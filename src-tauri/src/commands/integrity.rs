use sha2::{Sha256, Digest};
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
    let path = Path::new(&path);
    if !path.exists() {
        return false;
    }

    match calculate_sha256(path) {
        Ok(hash) => hash == expected_hash,
        Err(_) => false,
    }
}
