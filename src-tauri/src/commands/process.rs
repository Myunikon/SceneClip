use lazy_static::lazy_static;
use std::sync::Mutex;
use sysinfo::{Pid, System};
use tauri::command;

lazy_static! {
    static ref SYSTEM: Mutex<System> = Mutex::new(System::new_all());
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
    let mut to_kill = vec![pid];
    let mut checked_indices = 0;

    // Standard BFS to find children
    while checked_indices < to_kill.len() {
        let parent = to_kill[checked_indices];
        for (child_pid, process) in sys.processes() {
            if let Some(parent_pid) = process.parent() {
                if parent_pid == parent && !to_kill.contains(child_pid) {
                    to_kill.push(*child_pid);
                }
            }
        }
        checked_indices += 1;
    }

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

// Keep existing suspend logic for now, but consolidate imports if needed
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
#[command]
pub fn suspend_process(pid: u32) -> Result<(), String> {
    implementation::suspend_process(pid)
}

#[cfg(target_os = "windows")]
#[command]
pub fn resume_process(pid: u32) -> Result<(), String> {
    implementation::resume_process(pid)
}

// Fallback for non-Windows (Unix uses signals)
#[cfg(not(target_os = "windows"))]
#[command]
pub fn suspend_process(pid: u32) -> Result<(), String> {
    use std::process::Command;
    Command::new("kill")
        .args(["-STOP", &pid.to_string()])
        .output()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(not(target_os = "windows"))]
#[command]
pub fn resume_process(pid: u32) -> Result<(), String> {
    use std::process::Command;
    Command::new("kill")
        .args(["-CONT", &pid.to_string()])
        .output()
        .map_err(|e| e.to_string())?;
    Ok(())
}
