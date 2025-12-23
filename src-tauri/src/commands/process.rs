use tauri::command;

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
