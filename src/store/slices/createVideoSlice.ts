import { StateCreator } from 'zustand'
import { AppState, VideoSlice, DownloadTask } from './types'
import { v4 as uuidv4 } from 'uuid'
import { Child } from '@tauri-apps/plugin-shell'
import { downloadDir, join } from '@tauri-apps/api/path'
import { invoke } from '@tauri-apps/api/core'

// Import Helper Lib
import { toast } from 'sonner'
import { buildYtDlpArgs, parseMetadata, sanitizeFilename, getYtDlpCommand } from '../../lib/ytdlp'

const activeProcessMap = new Map<string, Child>()
const activePidMap = new Map<string, number>() // Store PID for true pause

export const createVideoSlice: StateCreator<AppState, [], [], VideoSlice> = (set, get) => ({
  tasks: [],

  addTask: async (url, options) => {
    const id = uuidv4()
    const { settings, processQueue, tasks } = get()

    // Prevent duplicate downloads of same URL
    const existingTask = tasks.find(t => 
        t.url === url && 
        ['pending', 'downloading', 'fetching_info'].includes(t.status)
    )
    if (existingTask) {
        get().addLog(`[Queue] Duplicate URL ignored: ${url}`)
        return
    }

    let downloadPath = options.path || settings.downloadPath
    if (!downloadPath) {
        downloadPath = await downloadDir()
    }

    const newTask: DownloadTask = {
      id,
      url,
      title: 'Queueing...',
      status: 'pending',
      progress: 0,
      speed: '-',
      eta: '-',
      range: (options.rangeStart || options.rangeEnd) ? `${options.rangeStart || 0}-${options.rangeEnd || ''}` : 'Full',
      format: options.format || settings.resolution,
      path: downloadPath,
      _options: options
    };
    
    set(state => ({ tasks: [newTask, ...state.tasks] }))
    processQueue()
  },

  processQueue: () => {
      const { tasks, settings, startTask } = get()
      const active = tasks.filter(t => t.status === 'downloading').length
      const limit = settings.concurrentDownloads || 3
      
      if (active < limit) {
          const pending = tasks.find(t => t.status === 'pending')
          if (pending) {
              startTask(pending.id)
          }
      }
  },

  startTask: async (id) => {
    const { tasks, settings, updateTask } = get()
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const options = task._options || {}
    const url = task.url
    const downloadPath = task.path || settings.downloadPath




    // Check FFMPEG via sidecar
    try {
        const { getBinaryVersion } = await import('../../lib/updater-service')
        const version = await getBinaryVersion('ffmpeg')
        
        if (!version) {
            try {
                toast.error('Critical Error: FFmpeg binary missing.')
            } catch(e) {}
            return
        }
    } catch (e) {
        console.error("Binary check failed:", e)
    }

    updateTask(id, { status: 'fetching_info', speed: 'Fetching Info...', eta: '...', log: undefined })
    get().addLog(`Starting Task ${id}: Fetching stream info...`)

    // 1. DUMP JSON (Metadata Phase)
    const dumpArgs = ['--get-url', '--dump-json', '--no-playlist', url]
    // Add auth if needed for metadata too
    if (settings.cookieSource === 'browser') {
        dumpArgs.push('--cookies-from-browser', settings.browserType || 'chrome')
    } else if (settings.cookieSource === 'txt' && settings.cookiePath) {
        dumpArgs.push('--cookies', settings.cookiePath)
    }

    try {
        const command = await getYtDlpCommand(dumpArgs)
        const output = await command.execute()
        
        if (output.code !== 0) {
            const err = output.stderr
            if (err.includes('DPAPI') || err.includes('database is locked')) {
                 const msg = "Gagal mengakses Cookies Browser. Pastikan Browser sudah DITUTUP sepenuhnya."
                 toast.error('Cookie Access Failed', { description: 'Please close your browser.' })
                 throw new Error(msg)
            }
            if (err.includes('Sign in to confirm')) {
                 const msg = "Video ini memerlukan login (Age Restricted)."
                 toast.error('Age Restricted Video', { description: 'Use Browser Session in Settings.' })
                 throw new Error(msg)
            }
            throw new Error(`Gagal mengambil metadata: ${output.stderr.substring(0, 100)}...`)
        }

        const lines = output.stdout.split('\n').filter(l => l.trim())
        const { streamUrls, needsMerging, meta } = parseMetadata(lines)
        
        if (streamUrls.length === 0) {
             throw new Error("Could not parse stream URLs (No valid streams found)")
        }

        get().addLog(`Stream Found: ${streamUrls.length} sources. Merging Needed: ${needsMerging}`)
        
        // 2. Prepare Filename
        const template = settings.filenameTemplate || '{title}.{ext}'
        const finalName = sanitizeFilename(template, meta)
        const fullOutputPath = await join(downloadPath, finalName)

        // 3. START DOWNLOAD (Native Phase)
        get().addLog(`Starting Native Download via yt-dlp for ${id} (Resumable)`)
        
        const nativeArgs = await buildYtDlpArgs(url, options, settings, fullOutputPath)

        try {
             const cmd = await getYtDlpCommand(nativeArgs)
             const _child = await cmd.spawn()
             
             activeProcessMap.set(id, _child)
             
             // Store PID for True Pause feature
             const pid = _child.pid
             if (pid) {
                 activePidMap.set(id, pid)
                 get().addLog(`[Process] Started PID ${pid} for task ${id}`)
             }
             
             // Store command for Developer Mode
             const ytdlpCommandStr = `yt-dlp ${nativeArgs.join(' ')}`
             
             updateTask(id, { 
                 status: 'downloading', 
                 title: finalName,
                 filePath: fullOutputPath,
                 speed: 'Starting Native Engine...',
                 eta: '...',
                 ytdlpCommand: ytdlpCommandStr
             })

             cmd.on('close', (data: any) => {
                 activeProcessMap.delete(id)
                 activePidMap.delete(id) // Clean up PID on close 
                 if (data.code === 0) {
                     updateTask(id, { status: 'completed', progress: 100, speed: '-', eta: 'Done' })
                     get().addLog(`Native Task ${id} Completed.`)
                 } else {
                     updateTask(id, { status: 'error', log: `Native Process Failed (Code ${data.code})` })
                 }
             })

             cmd.on('error', (err: any) => {
                  activeProcessMap.delete(id)
                  updateTask(id, { status: 'error', log: `Spawn Error: ${err}` })
             })
             
             cmd.stdout.on('data', (line: any) => {
                 const str = line.toString()
                 if (str.includes('[download]')) {
                     const percentMatch = str.match(/(\d+\.?\d*)%/)
                     const speedMatch = str.match(/at\s+(\d+\.?\d*\w+\/s)/)
                     const etaMatch = str.match(/ETA\s+(\S+)/)

                     if (percentMatch) {
                         const p = parseFloat(percentMatch[1])
                         const s = speedMatch ? speedMatch[1] : '-'
                         const e = etaMatch ? etaMatch[1] : '-'
                         updateTask(id, { progress: p, speed: s, eta: e })
                     }
                 }
             })

             cmd.stderr.on('data', (line: any) => {
                 const str = line.toString()
                 if (str.includes('ERROR:') || str.includes('Traceback')) {
                     updateTask(id, { log: str })
                 }
             })
             
             return

        } catch (e) {
             throw new Error(`Failed to spawn native downloader: ${e}`)
        }
    } catch (e) {
        get().addLog(`Task Error: ${e}`)
        const msg = e instanceof Error ? e.message : String(e)
        updateTask(id, { status: 'error', log: msg })
    }
  },

  clearTask: (id) => {
    const { stopTask } = get()
    // Ensure process is killed before removing
    stopTask(id) 
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }))
  },

  deleteHistory: () => {
     set(state => ({ tasks: state.tasks.filter(t => t.status !== 'completed' && t.status !== 'stopped') }))
  },

  updateTask: (id, updates) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    }))
  },

  stopTask: async (id) => {
    const { tasks, updateTask } = get()
    const task = tasks.find(t => t.id === id)
    if(!task) return
    
    // Kill the active process if it exists
    const child = activeProcessMap.get(id)
    if (child) {
         try {
             await child.kill()
             get().addLog(`Killed Native Process for Task ${id}`)
         } catch (e) {
             console.error("Failed to kill child process:", e)
         }
         activeProcessMap.delete(id)
    }

    updateTask(id, { status: 'stopped', speed: '-', eta: 'Stopped' })
  },

  pauseTask: async (id) => {
      const { updateTask, tasks } = get()
      const task = tasks.find(t => t.id === id)
      if(!task) return

      const pid = activePidMap.get(id)
      if (pid) {
          try {
              // TRUE PAUSE: Suspend the process instead of killing
              await invoke('suspend_process', { pid })
              get().addLog(`[True Pause] Suspended process PID ${pid} for task ${id}`)
              updateTask(id, { status: 'paused', speed: 'Paused', eta: '-' })
          } catch(e: any) {
              console.error("True pause failed, falling back to kill:", e)
              // Fallback to kill if suspend fails
              const child = activeProcessMap.get(id)
              if (child) {
                  try {
                      await child.kill()
                  } catch(e2) { console.error("Kill also failed:", e2) }
                  activeProcessMap.delete(id)
                  activePidMap.delete(id)
              }
              updateTask(id, { status: 'paused', speed: 'Paused (Killed)', eta: '-' })
          }
      } else {
          // No PID stored, use old method
          const child = activeProcessMap.get(id)
          if (child) {
              try { await child.kill() } catch(e) { console.error("Pause kill failed:", e) }
              activeProcessMap.delete(id)
          }
          updateTask(id, { status: 'paused', speed: 'Paused', eta: '-' })
      }
  },

  retryTask: async (id) => {
      const { tasks, updateTask, startTask } = get()
      const task = tasks.find(t => t.id === id)
      if(!task) return

      get().addLog(`Retrying Task ${id}...`)
      updateTask(id, { status: 'pending', speed: 'Retrying...', eta: '...', log: undefined }) 
      startTask(id)
  },

  resumeTask: async (id) => {
      const { tasks, updateTask, startTask } = get()
      const task = tasks.find(t => t.id === id)
      if(!task) return

      const pid = activePidMap.get(id)
      if (pid && task.status === 'paused') {
          try {
              // TRUE RESUME: Resume the suspended process
              await invoke('resume_process', { pid })
              get().addLog(`[True Resume] Resumed process PID ${pid} for task ${id}`)
              updateTask(id, { status: 'downloading', speed: 'Resuming...', eta: '...' })
              return // Process continues from where it left off
          } catch(e: any) {
              console.error("True resume failed, restarting task:", e)
              // If resume fails, clean up and restart
              activePidMap.delete(id)
              activeProcessMap.delete(id)
          }
      }
      
      // Fallback: restart the task
      get().addLog(`Resuming Task ${id} (Restart)...`)
      updateTask(id, { status: 'pending', speed: 'Resuming...', eta: '...' })
      startTask(id)
  }
})
