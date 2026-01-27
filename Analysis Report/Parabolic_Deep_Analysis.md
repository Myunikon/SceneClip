# Deep Analysis: Nickvision Parabolic & Implementation Strategy for SceneClip

**Date**: 2026-01-26
**Target**: [Nickvision Parabolic](https://github.com/NickvisionApps/Parabolic) (formerly Tube Converter)
**Context**: C++ / GTK4 / LibAdwaita codebase analysis.

## 1. Executive Summary: The "Parabolic Advantage"

Parabolic is widely regarded as the "Gold Standard" for Linux-native YouTube downloaders. After analyzing its core controllers (`adddownloaddialogcontroller.cpp`, `downloadoptions.cpp`) and event handlers, its superiority stems not from magic, but from **strict adherence to `yt-dlp` internals** rather than fighting against them.

Its three pillars of stability are:
1.  **Protocol Discipline**: It forces specific transfer protocols when mixing incompatible features (e.g., Aria2c + Trimming).
2.  **Deterministic Parsing**: It avoids Regex for progress monitoring, using a custom template instead.
3.  **State Isolation**: Credentials and configurations are isolated from the main download logic via a strict "Keyring" pattern.

---

## 2. Key Advantages & Technical Breakdown

### A. The "Magic Fix" (Aria2c + Trimming Stability)
**The Problem**: Trimming (`--download-sections`) often fails or produces corrupt files when combined with multi-threaded downloaders (Aria2c) or streaming protocols (HLS/DASH .m3u8), because these protocols rely on segmentation that doesn't map 1:1 to byte offsets.

**Parabolic's Solution**:
Found in `downloadoptions.cpp` (Line 515 in `Code Analysis.md`):
```cpp
// Logic Gate: If TimeFrame (Trimming) is active, FORCE plain HTTPS protocol
std::string formatSort{ m_timeFrame ? "proto:https" : "" };
```
*   **Mechanism**: When the user requests a trim, Parabolic injects `proto:https` into the `--format-sort` argument.
*   **Why it works**: This forces `yt-dlp` to select formats served via standard HTTP (Direct URL) rather than HLS manifests. HTTP allows precise "Range" headers, enabling `aria2c` or the native downloader to fetch *exact* byte ranges for the trim without fetching the whole file.

### B. Deterministic Progress Parsing
**The Problem**: Parsing `yt-dlp`'s standard stdout (human readable text) is fragile. If `yt-dlp` changes a whitespace or word in an update, the Regex breaks.

**Parabolic's Solution**:
Found in `DownloadOptions::toArgumentVector` & `DownloadProgressChangedEventArgs`:
```cpp
arguments.push_back("--progress-template");
arguments.push_back("[download] PROGRESS;%(progress.status)s;%(progress.downloaded_bytes)s;%(progress.total_bytes)s...");
```
*   **Mechanism**: It forces `yt-dlp` to output a semicolon-separated CSV string.
*   **Advantage**: The parser (`downloadprogresschangedeventargs.cpp`) simply splits the string by `;`. fast, zero-allocation, and unbreakable by minor UI changes in `yt-dlp`.

### C. Smart Subtitle Handling
**The Problem**: Users want subtitles embedded, but containers like MP4 hate `ASS` (Advanced Substation Alpha), and WebM hates `SRT`.

**Parabolic's Solution**:
It implements a "Container-Aware Conversion Matrix":
*   **Target: MP4/MOV** -> Forces `--convert-subs srt` (rejects ASS).
*   **Target: MKV** -> Allows `ass`, `srt`, `vtt` (Pass-through).
*   **Target: WebM** -> Forces `--convert-subs vtt`.
This ensures `ffmpeg` never fails the embedding step due to incompatible streams.

### D. The Keyring Architecture
**The Problem**: Storing credentials/cookies in plaintext files is insecure and messy.

**Parabolic's Solution**:
Uses `keyringdialogcontroller.cpp` to interface with `libsecret` (Linux) or Windows Credential Manager. It treats credentials as named objects that are *injected* into `yt-dlp` at runtime, rather than static files on disk.

---

## 3. Implementation Strategy for SceneClip

We can port these advantages to SceneClip (React/Tauri) immediately.

### Phase 1: Stability (The "Magic Gate")
**Priority**: Critical
**File**: `src/lib/ytdlp.ts` (Command Builder)

**Action**:
Modify the command generation logic. If `isClip` (Trimming) is true:
1.  **Force Protocol**: Prepend `proto:https` to the `formatSort` logic.
2.  **Disable incompatible arguments**: If `proto:https` finds no formats, fallback gracefully or warn the user.

```typescript
// Proposed Logic
if (options.clipStart !== undefined && options.clipEnd !== undefined) {
    // Force HTTP for accurate byte-range requests
    // Using unshift to make it higher priority than other sort options
    cmd.push('--format-sort', 'proto:https,res,acodec'); 
}
```

### Phase 2: Robust Parsing
**Priority**: High
**File**: `src/lib/ytdlp.ts` & `src/store/slices/createTaskSlice.ts`

**Action**:
Replace the current Regex parser with the Template strategy.
1.  Add argument: `--progress-template "SCENE_PROGRESS:%(progress.status)s:%(progress.downloaded_bytes)s:..."`
2.  Update the Rust/Tauri listener to look for `SCENE_PROGRESS:` prefix.
3.  Split by `:` and update state directly.

### Phase 3: Smart Subtitles
**Priority**: Medium
**File**: `src/components/AddDialog.tsx`

**Action**:
Map the "Extension" selection to the "Subtitle Conversion" logic.
- If User selects **.mp4**: Pass `--convert-subs srt --embed-subs`.
- If User selects **.mkv**: Pass `--embed-subs` (Native).

---

## 4. Conclusion

Parabolic isn't doing anything that SceneClip cannot do. Its "magic" is simply a collection of very specific, well-tested `yt-dlp` arguments that handle edge cases (like trimming HLS streams).

**Recommendation**: We should immediately implement the **"Magic Fix" (Phase 1)** as it directly solves corrupt downloads when trimming, which is a core value prop of SceneClip.
