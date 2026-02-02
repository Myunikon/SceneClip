use sha2::{Digest, Sha256};
use std::fs;
use std::io;
use std::path::Path;

pub fn calculate_sha256(path: &Path) -> io::Result<String> {
    let mut file = fs::File::open(path)?;
    let mut hasher = Sha256::new();
    io::copy(&mut file, &mut hasher)?;
    let hash = hasher.finalize();
    Ok(hex::encode(hash))
}

#[tauri::command]
pub async fn verify_binary_integrity(path: String, expected_hash: String) -> bool {
    log::debug!("[Integrity] Verifying hash for: {}", path);
    let path = Path::new(&path);
    if !path.exists() {
        log::warn!("[Integrity] File not found: {:?}", path);
        return false;
    }

    match calculate_sha256(path) {
        Ok(hash) => {
            let matched = hash == expected_hash;
            if matched {
                log::debug!("[Integrity] Hash verified: {:?}", path);
            } else {
                log::error!(
                    "[Integrity] Hash mismatch for {:?}! Expected: {}, Got: {}",
                    path,
                    expected_hash,
                    hash
                );
            }
            matched
        }
        Err(e) => {
            log::error!("[Integrity] Hash calculation failed for {:?}: {}", path, e);
            false
        }
    }
}
