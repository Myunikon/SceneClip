# Comparative Analysis: Nickvision Parabolic vs. SceneClip

This report provides a detailed technical comparison between **Nickvision Parabolic** (C++/C#) and **SceneClip** (TypeScript/Rust/Tauri), focusing on architecture, download handling, and unique features.

## 1. Executive Summary

| Feature | Nickvision Parabolic | SceneClip |
| :--- | :--- | :--- |
| **Architecture** | C++ Wrapper (`libnick`) + C# UI (WinUI/GTK) | Tauri (Rust Backend + React Frontend) |
| **Download Engine** | `yt-dlp` + `aria2c` (External Downloader) | `yt-dlp` Native |
| **Process Control** | OS-Level Suspension (`NtSuspendProcess` / `SIGSTOP`) | OS-Level Suspension (Identical Implementation) |
| **Output Parsing** | **Strict Template** (Custom Output Format) | **Regex Parsing** (Standard Output) |
| **Trimming/Clipping** | `proto:https` hack (allows `aria2c` + trimming) | `--no-part` + `-N 1` (Standard `yt-dlp` clipping) |
| **Acceleration** | Basic `ffmpeg` integration | **Advanced GPU Transcoding** (NVENC/AMF/QSV) |

---

## 2. Detailed Architecture Analysis

### Nickvision Parabolic
*   **Core Philosophy**: Stability and Speed. It relies heavily on delegating network complexity to `aria2c` and process management to the OS.
*   **Parsing Strategy**:
    *   **Mechanism**: Injects `--progress-template` to force `yt-dlp` to output data in a CSV-like format (`PROGRESS;status;downloaded;total;...`).
    *   **Benefit**: Extremely robust. It does not break even if `yt-dlp` changes its display text (e.g., "ETA" vs "Time Left"), as long as the template engine remains consistent.
*   **Download Strategy**:
    *   Uses `--downloader aria2c` with aggressive connection splitting (`-x 16`).
    *   **The "Magic Fix"**: When trimming video, it forces `proto:https` to prevent HLS/DASH manifest issues, allowing `aria2c` to still work reliably on specific byte ranges.

### SceneClip
*   **Core Philosophy**: Modern Web Tech & Media Processing. It emphasizes GPU-accelerated post-processing and a rich UI.
*   **Parsing Strategy**:
    *   **Mechanism**: Uses Regex (`PROGRESS_PATTERNS`) to parse standard `yt-dlp` output lines (`[download] 5.0% of 10.0MB at 2.0MB/s ETA 00:05`).
    *   **Risk**: Slightly more fragile. If `yt-dlp` changes its output format in a future update, the Regex might fail to capture progress.
*   **Download Strategy**:
    *   Uses native `yt-dlp` concurrency (`-N 4`).
    *   **Trimming**: Disables fragmentation (`-N 1`, `--no-part`) during clipping to prevent file locking or corruption issues. This is safer but potentially slower than Parabolic's approach.
    *   **GPU Power**: Contains extensive logic to detect GPU vendor (Nvidia/AMD/Intel/Apple) and inject specific FFmpeg encoders (e.g., `h264_nvenc`, `hevc_amf`) for faster format conversion.

---

## 3. Key Findings & Recommendations for SceneClip

### A. The "Pause" Mechanism
**Status**: ✅ **Already Implemented**
SceneClip's `src-tauri/src/commands/process.rs` uses the exact same Windows API (`NtSuspendProcess` from `ntdll`) as Parabolic. This is the "Gold Standard" for pausing downloads without killing connections destructively.

### B. Output Parsing (Improvement Opportunity)
**Current**: SceneClip uses Regex on standard output.
**Recommendation**: Adopt Parabolic's **Template Strategy**.
Instead of relying on Regex, pass this argument to `yt-dlp`:
```bash
--progress-template "SCENECLIP_PROGRESS;%(progress.status)s;%(progress.downloaded_bytes)s;%(progress.total_bytes)s;%(progress.speed)s;%(progress.eta)s"
```
Then, simply look for lines starting with `SCENECLIP_PROGRESS;` and split by `;`. This eliminates Regex completely and is 100% reliable.

### C. Download Acceleration (Feature Gap)
**Current**: SceneClip uses `yt-dlp`'s internal downloader.
**Recommendation**: Integrate **aria2c**.
Parabolic achieves significantly higher speeds on unstable connections by using `aria2c`.
*   **Implementation**: Ship `aria2c.exe` alongside `yt-dlp.exe`.
*   **Args**: `--downloader aria2c --downloader-args "aria2c:-x 16 -k 1M"`
*   **Note**: This requires handling the "Trimming vs Aria2c" conflict. If you add `aria2c`, you **must** use Parabolic's `proto:https` hack or disable aria2c when a user selects a time range.

### D. Subtitle "Burn-in" Safety
**Current**: SceneClip forces `srt` conversion when embedding to avoid mp4 issues.
**Analysis**: This is a smart move. Parabolic has complex logic to allow `ASS` subs in MKV but blocks them in MP4. SceneClip's approach ("Always SRT") is safer and simpler, though it sacrifices advanced styling (colors/fonts) found in `ASS` subtitles.

### E. Filename Handling
**Current**: SceneClip has rigid Windows `MAX_PATH` checks (truncating to ~250 chars).
**Observation**: This is good defensive programming. However, Parabolic handles this by using the standard `\\?\` prefix or relying on `yt-dlp`'s internal `--windows-filenames` (which SceneClip seems to not use fully, doing manual truncation instead).
**Recommendation**: Add `--windows-filenames` to `yt-dlp` args as a fallback safety net.

## 4. Conclusion
SceneClip is a sophisticated application with superior media processing capabilities (GPU transcoding) compared to Parabolic. However, Parabolic holds a slight edge in **download stability** (via `aria2c`) and **parsing reliability** (via templates).

**Top 3 Actionable items for SceneClip:**
1.  **Refactor Parsing**: Switch from Regex to `--progress-template`.
2.  **Add Aria2c**: Optional toggle for faster downloads.
3.  **Adopt `proto:https`**: If Aria2c is added, use this to allow fast downloading even when trimming.
