use serde::Serialize;
use std::sync::Mutex;
use std::time::Instant;
use sysinfo::{Disks, Networks, System};
use tauri::command;

// Global state for network tracking
static LAST_NET_CHECK: Mutex<Option<(Instant, u64, u64)>> = Mutex::new(None);

#[derive(Serialize)]
pub struct DiskInfo {
    name: String,
    mount_point: String,
    total_space: u64,
    available_space: u64,
}

#[derive(Serialize)]
pub struct SystemStats {
    cpu_usage: f32,
    memory_used: u64,
    memory_total: u64,
    memory_percent: f32,
    download_speed: f64,  // bytes per second
    upload_speed: f64,    // bytes per second
    disk_free: u64,       // bytes (primary)
    disk_total: u64,      // bytes (primary)
    disks: Vec<DiskInfo>, // All disks
}

#[command]
pub fn get_system_stats(
    _state: tauri::State<'_, Mutex<System>>,
    download_path: Option<String>,
) -> SystemStats {
    // let mut sys = state.lock().unwrap();

    // Refresh specific components
    // sys.refresh_cpu_usage();
    // sys.refresh_memory();

    // Get CPU usage (average of all cores)
    let cpu_usage: f32 = 0.0;
    // sys.cpus().iter().map(|cpu| cpu.cpu_usage()).sum::<f32>() / sys.cpus().len().max(1) as f32;

    // Memory info
    let memory_used = 0; // sys.used_memory();
    let memory_total = 0; // sys.total_memory();
    let memory_percent = 0.0; // (memory_used as f64 / memory_total.max(1) as f64 * 100.0) as f32;

    // Network stats
    // Note: Networks::new_with_refreshed_list() is still a bit heavy but necessary for new interfaces
    let networks = Networks::new_with_refreshed_list();
    let mut total_rx: u64 = 0;
    let mut total_tx: u64 = 0;

    for (_name, data) in networks.iter() {
        total_rx += data.total_received();
        total_tx += data.total_transmitted();
    }

    // Calculate speed
    let (download_speed, upload_speed) = {
        let mut last = LAST_NET_CHECK.lock().unwrap();
        let now = Instant::now();

        let speeds = if let Some((last_time, last_rx, last_tx)) = *last {
            let elapsed = now.duration_since(last_time).as_secs_f64();
            if elapsed > 0.0 {
                let dl = (total_rx.saturating_sub(last_rx)) as f64 / elapsed;
                let ul = (total_tx.saturating_sub(last_tx)) as f64 / elapsed;
                (dl, ul)
            } else {
                (0.0, 0.0)
            }
        } else {
            (0.0, 0.0)
        };

        *last = Some((now, total_rx, total_tx));
        speeds
    };

    // Disk space
    let disks_data = Disks::new_with_refreshed_list();

    // Get all disks info
    let all_disks: Vec<DiskInfo> = disks_data
        .iter()
        .map(|d| DiskInfo {
            name: d.name().to_string_lossy().into_owned(),
            mount_point: d.mount_point().to_string_lossy().into_owned(),
            total_space: d.total_space(),
            available_space: d.available_space(),
        })
        .collect();

    // Smart Disk Detection
    // If download_path is provided, find the disk that contains it.
    // Otherwise fallback to Primary (C:\ vs /) -> First Available
    let target_disk = if let Some(path) = download_path {
        // Find disk with longest matching mount point prefix
        // e.g. Path "D:\Movies\Clip" matches "D:\" better than "C:\"
        disks_data
            .iter()
            .filter(|d| path.starts_with(d.mount_point().to_string_lossy().as_ref()))
            .max_by_key(|d| d.mount_point().as_os_str().len())
    } else {
        None
    };

    let (disk_free, disk_total) = target_disk
        .or_else(|| {
            // Fallback: Primary disk
            disks_data.iter().find(|d| {
                let mount = d.mount_point().to_string_lossy();
                mount == "C:\\" || mount == "/"
            })
        })
        .or_else(|| disks_data.iter().next()) // Final fallback: first disk
        .map(|d| (d.available_space(), d.total_space()))
        .unwrap_or((0, 0));

    SystemStats {
        cpu_usage,
        memory_used,
        memory_total,
        memory_percent,
        download_speed,
        upload_speed,
        disk_free,
        disk_total,
        disks: all_disks,
    }
}
