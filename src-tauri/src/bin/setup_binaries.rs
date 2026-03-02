use std::env;
use std::fs::{self, File};
use std::io;
use std::path::{Path, PathBuf};

use bzip2::read::BzDecoder;
use flate2::read::GzDecoder;
use reqwest::blocking::Client;
use tar::Archive;
use xz2::read::XzDecoder;
use zip::ZipArchive;

// Configuration for all supported targets
struct TargetConfig {
    triple: &'static str,
    platform: &'static str,
    ffmpeg_url: &'static str,
    deno_url: &'static str,
    ytdlp_url: &'static str,
    aria2_url: Option<&'static str>,
    rsgain_url: Option<&'static str>,
    ext: &'static str,
}

impl TargetConfig {
    fn get(key: &str) -> Option<Self> {
        match key {
            "win-x64" => Some(Self {
                triple: "x86_64-pc-windows-msvc",
                platform: "win32",
                ffmpeg_url: "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip",
                deno_url: "https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip",
                ytdlp_url: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe",
                aria2_url: Some("https://github.com/aria2/aria2/releases/download/release-1.36.0/aria2-1.36.0-win-64bit-build1.zip"),
                rsgain_url: Some("https://github.com/complexlogic/rsgain/releases/download/v3.6/rsgain_3.6_win64.zip"),
                ext: ".exe",
            }),
            "win-arm64" => Some(Self {
                triple: "aarch64-pc-windows-msvc",
                platform: "win32",
                ffmpeg_url: "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-winarm64-gpl.zip",
                deno_url: "https://github.com/denoland/deno/releases/latest/download/deno-aarch64-pc-windows-msvc.zip",
                ytdlp_url: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_arm64.exe",
                aria2_url: Some("https://github.com/minnyres/aria2-windows-arm64/releases/download/1.37.0/aria2_1.37.0_arm64.zip"),
                rsgain_url: Some("https://github.com/complexlogic/rsgain/releases/download/v3.6/rsgain_3.6_win64.zip"),
                ext: ".exe",
            }),
            "win-x86" => Some(Self {
                triple: "i686-pc-windows-msvc",
                platform: "win32",
                ffmpeg_url: "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win32-gpl.zip",
                deno_url: "https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip", // Fallback to x64
                ytdlp_url: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_x86.exe",
                aria2_url: Some("https://github.com/aria2/aria2/releases/download/release-1.36.0/aria2-1.36.0-win-32bit-build1.zip"),
                rsgain_url: None, // No 32-bit binary available
                ext: ".exe",
            }),
            "mac-x64" => Some(Self {
                triple: "x86_64-apple-darwin",
                platform: "darwin",
                ffmpeg_url: "https://evermeet.cx/ffmpeg/getrelease/zip",
                deno_url: "https://github.com/denoland/deno/releases/latest/download/deno-x86_64-apple-darwin.zip",
                ytdlp_url: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos",
                aria2_url: Some("https://github.com/aria2/aria2/releases/download/release-1.36.0/aria2-1.36.0-osx-darwin.tar.bz2"),
                rsgain_url: Some("https://github.com/complexlogic/rsgain/releases/download/v3.6/rsgain_3.6_macos-x64.zip"),
                ext: "",
            }),
            "mac-arm64" => Some(Self {
                triple: "aarch64-apple-darwin",
                platform: "darwin",
                ffmpeg_url: "https://evermeet.cx/ffmpeg/getrelease/zip",
                deno_url: "https://github.com/denoland/deno/releases/latest/download/deno-aarch64-apple-darwin.zip",
                ytdlp_url: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos",
                aria2_url: Some("https://github.com/aria2/aria2/releases/download/release-1.36.0/aria2-1.36.0-osx-darwin.tar.bz2"),
                rsgain_url: Some("https://github.com/complexlogic/rsgain/releases/download/v3.6/rsgain_3.6_macos-arm64.zip"),
                ext: "",
            }),
            "linux-x64" => Some(Self {
                triple: "x86_64-unknown-linux-gnu",
                platform: "linux",
                ffmpeg_url: "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz",
                deno_url: "https://github.com/denoland/deno/releases/latest/download/deno-x86_64-unknown-linux-gnu.zip",
                ytdlp_url: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp",
                aria2_url: Some("https://github.com/aria2/aria2/releases/download/release-1.36.0/aria2-1.36.0-linux-gnu-64bit-build1.tar.bz2"),
                rsgain_url: None, // No static binary available for Linux. Use package manager.
                ext: "",
            }),
            "linux-arm64" => Some(Self {
                triple: "aarch64-unknown-linux-gnu",
                platform: "linux",
                ffmpeg_url: "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz",
                deno_url: "https://github.com/denoland/deno/releases/latest/download/deno-aarch64-unknown-linux-gnu.zip",
                ytdlp_url: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_aarch64",
                aria2_url: Option::None,
                rsgain_url: Option::None,
                ext: "",
            }),
            _ => None,
        }
    }
}

// Download a file handling modern redirects
fn download_file(url: &str, dest: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::builder()
        .user_agent("Mozilla/5.0 (compatible; SceneClip/1.0)")
        .build()?;

    let mut response = client.get(url).send()?.error_for_status()?;
    let mut file = File::create(dest)?;
    response.copy_to(&mut file)?;

    Ok(())
}

// Ensure execution permissions on Unix matching `fs.chmodSync(path, 0o755)`
#[cfg(unix)]
fn set_executable_perms(path: &Path) -> io::Result<()> {
    use std::os::unix::fs::PermissionsExt;
    let mut perms = fs::metadata(path)?.permissions();
    perms.set_mode(0o755);
    fs::set_permissions(path, perms)?;
    Ok(())
}

#[cfg(not(unix))]
fn set_executable_perms(_path: &Path) -> io::Result<()> {
    Ok(())
}

// Recursively find a file in a directory
fn find_file<'a>(dir: &Path, filename: &str) -> Option<PathBuf> {
    if !dir.is_dir() {
        return None;
    }

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                if let Some(found) = find_file(&path, filename) {
                    return Some(found);
                }
            } else if path.file_name().and_then(|n| n.to_str()) == Some(filename) {
                return Some(path);
            }
        }
    }
    None
}

// Extract archives based on extension
fn extract_archive(file_path: &Path, dest_dir: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let ext = file_path
        .file_name()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    println!("[EXTRACT] {}...", file_path.display());

    if ext.ends_with(".zip") {
        let file = File::open(file_path)?;
        let mut archive = ZipArchive::new(file)?;
        archive.extract(dest_dir)?;
    } else if ext.ends_with(".tar.xz") {
        let file = File::open(file_path)?;
        let tar = XzDecoder::new(file);
        let mut archive = Archive::new(tar);
        archive.unpack(dest_dir)?;
    } else if ext.ends_with(".tar.bz2") {
        let file = File::open(file_path)?;
        let tar = BzDecoder::new(file);
        let mut archive = Archive::new(tar);
        archive.unpack(dest_dir)?;
    } else if ext.ends_with(".tar.gz") {
        let file = File::open(file_path)?;
        let tar = GzDecoder::new(file);
        let mut archive = Archive::new(tar);
        archive.unpack(dest_dir)?;
    } else {
        return Err(format!("Unsupported archive format: {}", ext).into());
    }

    Ok(())
}

fn setup_target(key: &str, config: &TargetConfig, bin_dir: &Path) {
    println!("\n--- Setting up for {} ({}) ---", key, config.triple);
    let temp_dir = bin_dir.join(format!("temp_{}", key));

    if !temp_dir.exists() {
        if let Err(e) = fs::create_dir_all(&temp_dir) {
            eprintln!("[ERROR] Failed to create temp dir: {}", e);
            return;
        }
    }

    // 1. Setup yt-dlp
    let ytdlp_name = format!("yt-dlp-{}{}", config.triple, config.ext);
    let ytdlp_path = bin_dir.join(&ytdlp_name);

    if !ytdlp_path.exists() {
        println!("[DOWNLOAD] yt-dlp from {}...", config.ytdlp_url);
        if let Err(e) = download_file(config.ytdlp_url, &ytdlp_path) {
            eprintln!("[ERROR] Failed to download yt-dlp: {}", e);
        } else {
            let _ = set_executable_perms(&ytdlp_path);
            println!("[OK] Saved {}", ytdlp_name);
        }
    } else {
        println!("[SKIP] {} exists", ytdlp_name);
    }

    // 2. Setup ffmpeg (and ffprobe)
    let ffmpeg_name = format!("ffmpeg-{}{}", config.triple, config.ext);
    let ffmpeg_path = bin_dir.join(&ffmpeg_name);
    let ffprobe_name = format!("ffprobe-{}{}", config.triple, config.ext);
    let ffprobe_path = bin_dir.join(&ffprobe_name);

    if !ffmpeg_path.exists() || !ffprobe_path.exists() {
        let mut archive_name = "ffmpeg_archive".to_string();
        if config.ffmpeg_url.ends_with(".zip") || config.ffmpeg_url.ends_with("/zip") {
            archive_name.push_str(".zip");
        } else if config.ffmpeg_url.ends_with(".tar.xz") {
            archive_name.push_str(".tar.xz");
        }

        let archive_path = temp_dir.join(&archive_name);
        println!("[DOWNLOAD] ffmpeg archive from {}...", config.ffmpeg_url);
        if let Err(e) = download_file(config.ffmpeg_url, &archive_path) {
            eprintln!("[ERROR] Failed to download ffmpeg: {}", e);
        } else if let Err(e) = extract_archive(&archive_path, &temp_dir) {
            eprintln!("[ERROR] Failed to extract ffmpeg: {}", e);
        } else {
            let target_ffmpeg = if config.platform == "win32" {
                "ffmpeg.exe"
            } else {
                "ffmpeg"
            };
            if !ffmpeg_path.exists() {
                if let Some(found) = find_file(&temp_dir, target_ffmpeg) {
                    let _ = fs::copy(&found, &ffmpeg_path);
                    let _ = set_executable_perms(&ffmpeg_path);
                    println!("[OK] Saved {}", ffmpeg_name);
                } else {
                    eprintln!("[ERROR] Could not find {}", target_ffmpeg);
                }
            }

            let target_ffprobe = if config.platform == "win32" {
                "ffprobe.exe"
            } else {
                "ffprobe"
            };
            if !ffprobe_path.exists() {
                if let Some(found) = find_file(&temp_dir, target_ffprobe) {
                    let _ = fs::copy(&found, &ffprobe_path);
                    let _ = set_executable_perms(&ffprobe_path);
                    println!("[OK] Saved {}", ffprobe_name);
                } else {
                    eprintln!("[ERROR] Could not find {}", target_ffprobe);
                }
            }
        }
    } else {
        println!("[SKIP] {} and {} exist", ffmpeg_name, ffprobe_name);
    }

    // 3. Setup Aria2c
    if let Some(aria2_url) = config.aria2_url {
        let aria2_name = format!("aria2c-{}{}", config.triple, config.ext);
        let aria2_path = bin_dir.join(&aria2_name);
        if !aria2_path.exists() {
            let mut archive_name = "aria2_archive".to_string();
            if aria2_url.ends_with(".zip") {
                archive_name.push_str(".zip");
            } else if aria2_url.ends_with(".tar.bz2") {
                archive_name.push_str(".tar.bz2");
            }
            let archive_path = temp_dir.join(&archive_name);
            println!("[DOWNLOAD] aria2c from {}...", aria2_url);
            if let Err(e) = download_file(aria2_url, &archive_path) {
                eprintln!("[ERROR] Failed to download aria2: {}", e);
            } else if let Err(e) = extract_archive(&archive_path, &temp_dir) {
                eprintln!("[ERROR] Failed to extract aria2: {}", e);
            } else {
                let target_aria2 = if config.platform == "win32" {
                    "aria2c.exe"
                } else {
                    "aria2c"
                };
                if let Some(found) = find_file(&temp_dir, target_aria2) {
                    let _ = fs::copy(&found, &aria2_path);
                    let _ = set_executable_perms(&aria2_path);
                    println!("[OK] Saved {}", aria2_name);
                } else {
                    eprintln!("[ERROR] Could not find {}", target_aria2);
                }
            }
        } else {
            println!("[SKIP] {} exists", aria2_name);
        }
    }

    // 4. Setup rsgain
    if let Some(rsgain_url) = config.rsgain_url {
        let rsgain_name = format!("rsgain-{}{}", config.triple, config.ext);
        let rsgain_path = bin_dir.join(&rsgain_name);
        if !rsgain_path.exists() {
            let mut archive_name = "rsgain_archive".to_string();
            if rsgain_url.ends_with(".zip") {
                archive_name.push_str(".zip");
            }
            let archive_path = temp_dir.join(&archive_name);
            println!("[DOWNLOAD] rsgain from {}...", rsgain_url);
            if let Err(e) = download_file(rsgain_url, &archive_path) {
                eprintln!("[ERROR] Failed to download rsgain: {}", e);
            } else if let Err(e) = extract_archive(&archive_path, &temp_dir) {
                eprintln!("[ERROR] Failed to extract rsgain: {}", e);
            } else {
                let target_rsgain = if config.platform == "win32" {
                    "rsgain.exe"
                } else {
                    "rsgain"
                };
                if let Some(found) = find_file(&temp_dir, target_rsgain) {
                    let _ = fs::copy(&found, &rsgain_path);
                    let _ = set_executable_perms(&rsgain_path);
                    println!("[OK] Saved {}", rsgain_name);
                } else {
                    eprintln!("[ERROR] Could not find {}", target_rsgain);
                }
            }
        } else {
            println!("[SKIP] {} exists", rsgain_name);
        }
    }

    // 5. Setup Deno
    let deno_name = format!("deno-{}{}", config.triple, config.ext);
    let deno_path = bin_dir.join(&deno_name);
    if !deno_path.exists() {
        let archive_path = temp_dir.join("deno_archive.zip");
        println!("[DOWNLOAD] deno from {}...", config.deno_url);
        if let Err(e) = download_file(config.deno_url, &archive_path) {
            eprintln!("[ERROR] Failed to download deno: {}", e);
        } else if let Err(e) = extract_archive(&archive_path, &temp_dir) {
            eprintln!("[ERROR] Failed to extract deno: {}", e);
        } else {
            let target_deno = if config.platform == "win32" {
                "deno.exe"
            } else {
                "deno"
            };
            if let Some(found) = find_file(&temp_dir, target_deno) {
                let _ = fs::copy(&found, &deno_path);
                let _ = set_executable_perms(&deno_path);
                println!("[OK] Saved {}", deno_name);
            } else {
                eprintln!("[ERROR] Could not find {}", target_deno);
            }
        }
    } else {
        println!("[SKIP] {} exists", deno_name);
    }

    // Cleanup temp
    let _ = fs::remove_dir_all(&temp_dir);
}

fn get_current_target_key() -> Option<&'static str> {
    if cfg!(target_os = "windows") {
        if cfg!(target_arch = "aarch64") {
            Some("win-arm64")
        } else {
            Some("win-x64") // Default to x64, handle x86 manually if needed via flag
        }
    } else if cfg!(target_os = "linux") {
        Some("linux-x64")
    } else if cfg!(target_os = "macos") {
        if cfg!(target_arch = "aarch64") {
            Some("mac-arm64")
        } else {
            Some("mac-x64")
        }
    } else {
        None
    }
}

fn main() {
    println!("{:=<50}", "");
    println!("SceneClip Binary Setup Manager (Rust)");
    println!("{:=<50}", "");

    let bin_dir = Path::new("bin");
    if !bin_dir.exists() {
        fs::create_dir_all(bin_dir).expect("Failed to create bin directory");
    }

    let args: Vec<String> = env::args().collect();
    let download_all = args.contains(&"--all".to_string());

    let mut target_flags: Vec<String> = Vec::new();
    let mut i = 1;
    while i < args.len() {
        if args[i] == "--target" && i + 1 < args.len() {
            target_flags.push(args[i + 1].clone());
            i += 1;
        }
        i += 1;
    }

    if download_all {
        println!("Mode: Download ALL platforms (Windows, macOS, Linux)");
        for key in &["win-x64", "win-x86", "mac-x64", "mac-arm64", "linux-x64"] {
            if let Some(config) = TargetConfig::get(key) {
                setup_target(key, &config, bin_dir);
            }
        }
    } else if !target_flags.is_empty() {
        println!("Mode: Specific targets ({})", target_flags.join(", "));
        for key in &target_flags {
            if let Some(config) = TargetConfig::get(key) {
                setup_target(key, &config, bin_dir);
            } else {
                eprintln!("[ERROR] Unknown target: {}", key);
            }
        }
    } else {
        if let Some(current_key) = get_current_target_key() {
            if let Some(config) = TargetConfig::get(current_key) {
                println!("Mode: Current Platform Only ({})", current_key);
                setup_target(current_key, &config, bin_dir);
            }
        } else {
            eprintln!("Current platform is not explicitly supported or mapped.");
            std::process::exit(1);
        }
    }

    println!("{:=<50}", "");
    println!("Setup Complete!");
}
