use lazy_static::lazy_static;
use std::sync::Mutex;
use sysinfo::{Pid, System};
use tauri::command;

lazy_static! {
    static ref SYSTEM: Mutex<System> = Mutex::new(System::new_all());
}

/// Collect all descendant processes of a given PID using BFS
fn collect_process_tree(pid: Pid, sys: &System) -> Vec<Pid> {
    let mut tree = vec![pid];
    let mut checked_indices = 0;

    // Standard BFS to find children
    while checked_indices < tree.len() {
        let parent = tree[checked_indices];
        for (child_pid, process) in sys.processes() {
            if let Some(parent_pid) = process.parent() {
                if parent_pid == parent && !tree.contains(child_pid) {
                    tree.push(*child_pid);
                }
            }
        }
        checked_indices += 1;
    }

    tree
}

#[command]
pub fn kill_process_tree(pid: u32) -> Result<(), String> {
    let mut sys = SYSTEM.lock().map_err(|e| e.to_string())?;
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let pid = Pid::from_u32(pid);

    // Initial check
    if sys.process(pid).is_none() {
        return Ok(()); // Already dead
    }

    // Collect all descendants recursively
    let to_kill = collect_process_tree(pid, &sys);

    // Kill in reverse order (children first)
    for target_pid in to_kill.iter().rev() {
        if let Some(process) = sys.process(*target_pid) {
            #[cfg(target_os = "windows")]
            {
                // Force kill on Windows is essentially TerminateProcess
                process.kill();
            }
            #[cfg(not(target_os = "windows"))]
            {
                // On Unix send SIGKILL
                process.kill_with(sysinfo::Signal::Kill);
            }
        }
    }

    Ok(())
}

// ============================================================================
// PROCESS TREE SUSPEND/RESUME - For Pause/Resume functionality
// ============================================================================

/// Suspend an entire process tree (parent + all children)
/// This is crucial for pausing downloads that use aria2c, ffmpeg, or deno as child processes
pub fn suspend_process_tree(pid: u32) -> Result<(), String> {
    let mut sys = SYSTEM.lock().map_err(|e| e.to_string())?;
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let root_pid = Pid::from_u32(pid);

    // Check if process exists
    if sys.process(root_pid).is_none() {
        return Err(format!("Process {} not found", pid));
    }

    // Collect entire process tree
    let tree = collect_process_tree(root_pid, &sys);

    log::info!(
        "Suspending process tree for PID {}: {} processes",
        pid,
        tree.len()
    );

    // Suspend in reverse order (children first, then parent)
    // This prevents the parent from spawning new children while we're suspending
    for target_pid in tree.iter().rev() {
        let target_u32 = target_pid.as_u32();
        if let Err(e) = suspend_single_process(target_u32) {
            log::warn!("Failed to suspend PID {}: {}", target_u32, e);
            // Continue with other processes - don't fail the whole operation
        } else {
            log::debug!("Suspended PID {}", target_u32);
        }
    }

    Ok(())
}

/// Resume an entire process tree (parent + all children)
pub fn resume_process_tree(pid: u32) -> Result<(), String> {
    let mut sys = SYSTEM.lock().map_err(|e| e.to_string())?;
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let root_pid = Pid::from_u32(pid);

    // Check if process exists
    if sys.process(root_pid).is_none() {
        return Err(format!("Process {} not found", pid));
    }

    // Collect entire process tree
    let tree = collect_process_tree(root_pid, &sys);

    log::info!(
        "Resuming process tree for PID {}: {} processes",
        pid,
        tree.len()
    );

    // Resume in forward order (parent first, then children)
    // This ensures the parent is ready to handle child output when children resume
    for target_pid in tree.iter() {
        let target_u32 = target_pid.as_u32();
        if let Err(e) = resume_single_process(target_u32) {
            log::warn!("Failed to resume PID {}: {}", target_u32, e);
            // Continue with other processes
        } else {
            log::debug!("Resumed PID {}", target_u32);
        }
    }

    Ok(())
}

// ============================================================================
// PLATFORM-SPECIFIC SINGLE PROCESS SUSPEND/RESUME
// ============================================================================

#[cfg(target_os = "windows")]
mod implementation {
    // Windows API types
    type HANDLE = *mut std::ffi::c_void;
    type DWORD = u32;
    type NTSTATUS = i32;
    type BOOL = i32;

    const PROCESS_SUSPEND_RESUME: DWORD = 0x0800;
    const FALSE: BOOL = 0;

    #[link(name = "kernel32")]
    extern "system" {
        fn OpenProcess(dwDesiredAccess: DWORD, bInheritHandle: BOOL, dwProcessId: DWORD) -> HANDLE;
        fn CloseHandle(hObject: HANDLE) -> BOOL;
    }

    #[link(name = "ntdll")]
    extern "system" {
        fn NtSuspendProcess(ProcessHandle: HANDLE) -> NTSTATUS;
        fn NtResumeProcess(ProcessHandle: HANDLE) -> NTSTATUS;
    }

    pub fn suspend_process(pid: u32) -> Result<(), String> {
        unsafe {
            let handle = OpenProcess(PROCESS_SUSPEND_RESUME, FALSE, pid);
            if handle.is_null() {
                return Err(format!("Failed to open process {}", pid));
            }
            let status = NtSuspendProcess(handle);
            CloseHandle(handle);
            if status < 0 {
                return Err(format!("NtSuspendProcess failed with status: {}", status));
            }
            Ok(())
        }
    }

    pub fn resume_process(pid: u32) -> Result<(), String> {
        unsafe {
            let handle = OpenProcess(PROCESS_SUSPEND_RESUME, FALSE, pid);
            if handle.is_null() {
                return Err(format!("Failed to open process {}", pid));
            }
            let status = NtResumeProcess(handle);
            CloseHandle(handle);
            if status < 0 {
                return Err(format!("NtResumeProcess failed with status: {}", status));
            }
            Ok(())
        }
    }
}

#[cfg(target_os = "windows")]
fn suspend_single_process(pid: u32) -> Result<(), String> {
    implementation::suspend_process(pid)
}

#[cfg(target_os = "windows")]
fn resume_single_process(pid: u32) -> Result<(), String> {
    implementation::resume_process(pid)
}

// Tauri commands that expose tree-based suspend/resume
#[cfg(target_os = "windows")]
#[command]
pub fn suspend_process(pid: u32) -> Result<(), String> {
    suspend_process_tree(pid)
}

#[cfg(target_os = "windows")]
#[command]
pub fn resume_process(pid: u32) -> Result<(), String> {
    resume_process_tree(pid)
}

// ============================================================================
// UNIX IMPLEMENTATION (macOS, Linux)
// ============================================================================

#[cfg(not(target_os = "windows"))]
fn suspend_single_process(pid: u32) -> Result<(), String> {
    use std::process::Command;
    let output = Command::new("kill")
        .args(["-STOP", &pid.to_string()])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(format!(
            "kill -STOP failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }
    Ok(())
}

#[cfg(not(target_os = "windows"))]
fn resume_single_process(pid: u32) -> Result<(), String> {
    use std::process::Command;
    let output = Command::new("kill")
        .args(["-CONT", &pid.to_string()])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(format!(
            "kill -CONT failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }
    Ok(())
}

// Tauri commands for Unix that use tree-based suspend/resume
#[cfg(not(target_os = "windows"))]
#[command]
pub fn suspend_process(pid: u32) -> Result<(), String> {
    suspend_process_tree(pid)
}

#[cfg(not(target_os = "windows"))]
#[command]
pub fn resume_process(pid: u32) -> Result<(), String> {
    resume_process_tree(pid)
}
