# Keyring Implementation Security Audit

**Date**: 2026-01-26
**Scope**: Frontend (`SecuritySettings.tsx`, `keyring.tsx`), Backend (`src-tauri/src/commands/keyring.rs`), and Integration (`ytdlp.ts`).

## Executive Summary
The current implementation provides a functional basic integration of the OS Keyring. It correctly delegates credential storage to the operating system (Windows Credential Manager / macOS Keychain / Linux Secret Service) using the `keyring` crate (v3). 

However, there are **Severe flaws** in data handling and User Experience (UX) robustness that could lead to data corruption or UI freezes. No critical "credential leak" vulnerabilities (e.g., logging passwords) were found.

---

## 1. Vulnerabilities & Weaknesses

### 🔴 Critical: Data Integrity (Delimiter Collision)
**Location**: `src/components/settings/SecuritySettings.tsx`
- **Issue**: The frontend stores the list of saved credentials as strings in the format `Service|Username`.
- **Attack/Bug Vector**: If a user enters a Service Name containing `|` (e.g., `My|Service`), the split logic `key.split('|')` will fail or produce incorrect results `['My', 'Service|Username']`.
- **Consequence**: The Delete button will fail (passing wrong arguments to backend), or the UI will display garbage.

### 🟡 Medium: Lack of Namespacing
**Location**: `src-tauri/src/commands/keyring.rs`
- **Issue**: The `service` argument is passed directly to the OS keyring.
- **Scenario**: If a user enters "Chrome" or "git" as the service name, the app attempts to write to the system-wide entry for that service.
- **Risk**: While OS protections usually prevent overwriting other apps' keys without permission, it is bad practice.
- **Recommendation**: Internalize a prefix, e.g., `sceneclip:Netflix` instead of just `Netflix`.

### 🟡 Medium: UI Freezing (Synchronous Commands)
**Location**: `src-tauri/src/commands/keyring.rs`
- **Issue**: The commands `set_credential`, `get_credential`, etc., are defined as synchronous `pub fn`.
- **Risk**: Keyring operations involve IPC or disk I/O. On Linux (Secret Service) or macOS, this might prompt the user for a password/unlock. If this happens on the main thread, the **entire application UI will freeze** until the user responds to the OS prompt.
- **Fix**: Change to `async fn` to allow Tauri to offload it to a thread pool.

### 🔵 Low: Free-Text Input Validation
- **Issue**: No validation on input fields.
- **Risk**: Leading/Trailing spaces (e.g., `Netflix `) are saved literally. `yt-dlp` might fail if it expects `Netflix` but gets `Netflix ` (or vice versa).

---

## 2. Code Review

### Backend (`src-tauri/src/commands/keyring.rs`)
```rust
// CURRENT
#[command]
pub fn set_credential(...) -> Result<(), String> { ... }
```
**Verdict**: Functional but risky for UI responsiveness. Uses `keyring` crate properly otherwise.

### Frontend (`SecuritySettings.tsx`)
```typescript
// CURRENT
const key = `${service}|${username}`
```
**Verdict**: Fragile. Should use a JSON object or a safer delimiter, or just store the list of objects `{ service, username }` in the store instead of a string array.

### Integration (`ytdlp.ts`)
**Verdict**: **SAFE**. 
- Password is passed directly to `args` array.
- No `console.log` was found dumping the options object or args array.
- `yt-dlp` itself is called with `--no-colors` and standard precautions.

---

## 3. Recommended Fixes

### Plan A: Robust Rewrite (Recommended)
1.  **Backend**: Rename `service` to `service_id` internally or prefix it (`sceneclip:${service}`).
2.  **Backend**: Make all commands `async`.
3.  **Frontend**: Change `savedCredentials` store type from `string[]` to `{ service: string, username: string, id: string }[]`.
4.  **Frontend**: Add validation (trim inputs, disallow special chars in service name if used as ID).

### Plan B: Quick Patches
1.  **Frontend**: Replace `|` with a safer delimiter (e.g., `::SCENECLIP::`) or forbid `|` in input.
2.  **Backend**: Add `async` keyword to commands.

## 4. Conclusion
 The "Keyring" feature is **safe to use** regarding credential theft (it doesn't leak passwords), but **fragile** regarding application stability and data management. It works, but it is not "Production Ready" by strict standards.
