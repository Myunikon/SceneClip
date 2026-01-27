# Deep Dive Analysis & Integration Strategy: Parabolic into SceneClip

This document provides a **code-level analysis** of Nickvision Parabolic's core advantages and a concrete **Implementation Strategy** for porting them to SceneClip.

---

## Part 1: Deep Dive Analysis of Parabolic

I have analyzed the C++ source code (`models/download.cpp`, `models/downloadmanager.cpp`, etc.) and identified the exact mechanisms that make Parabolic robust.

### 1. Robust Output Parsing (The "Template" Strategy)
**Source**: `downloadoptions.cpp` (Line 463) & `download.cpp` (Line 269)

Parabolic avoids fragile Regex by forcing `yt-dlp` to output data in a stable CSV format.
*   **Injection**:
    ```cpp
    arguments.push_back("--progress-template");
    arguments.push_back("[download] PROGRESS;%(progress.status)s;%(progress.downloaded_bytes)s;%(progress.total_bytes)s;%(progress.total_bytes_estimate)s;%(progress.speed)s;%(progress.eta)s");
    ```
*   **Parsing (download.cpp)**:
    It simply splits the string by `;`.
    *   Index 2: Downloaded
    *   Index 3: Total (or Index 4 if Estimate)
    *   Index 5: Speed
    *   Index 6: ETA
*   **Advantage**: This is immune to `yt-dlp` changing its human-readable output (e.g., from "ETA 00:05" to "Time Remaining: 5s"), ensuring 100% reliability across updates.

### 2. The "Aria2c" Download Engine
**Source**: `downloadoptions.cpp` (Line 162) & `download.cpp` (Line 247)

Parabolic uses `aria2c` as an external downloader to accelerate connections.
*   **Argument Logic**:
    ```cpp
    arguments.push_back("--downloader");
    arguments.push_back("aria2c");
    arguments.push_back("--downloader-args");
    arguments.push_back("aria2c:--summary-interval=0 --enable-color=false -x 16 -k 1M");
    ```
*   **Parsing Logic**:
    Aria2c outputs distinct lines starting with `[#`. Parabolic detects this and switches parsing logic:
    ```cpp
    if(line.find("[#") != std::string::npos) {
        // Parse: [#2089b0 1.2MiB/9.5MiB(12%) CN:1 DL:3.4MiB/s ETA:2s]
    }
    ```
*   **The "Protocol Hack" for Trimming**:
    When a user trims a video (TimeFrame is active), Parabolic forces `proto:https` to prevent `aria2c` from failing on HLS manifests. This allows the speed of Aria2c to exist alongside video cutting.

### 3. Smart Filename Verification
**Source**: `download.cpp` (Line 311)

SceneClip currently truncates filenames blindly. Parabolic reads the **last line of stdout** to confirm the final filename `yt-dlp` actually used.
*   **Mechanism**:
    ```cpp
    std::vector<std::string> logLines{ StringHelpers::split(m_process->getOutput(), "\n") };
    std::filesystem::path finalPath{ logLines[logLines.size() - 1] };
    ```
*   **Benefit**: If `yt-dlp` automatically renames a file (e.g., to avoid collision `video (1).mp4`), Parabolic knows immediately, whereas SceneClip might lose track of the file.

---

## Part 2: Implementation Strategy for SceneClip

We can apply these advantages to SceneClip to create the ultimate downloader.

### Step 1: Switch to Template Parsing (High Priority)
**Complexity**: Low | **Impact**: High (Stability)

Refactor `src/lib/ytdlp.ts` to use Parabolic's template.

1.  **Modify `buildYtDlpArgs`**:
    ```typescript
    // REMOVE: --progress (standard)
    // ADD:
    args.push('--progress-template', 'SCENECLIP_PROGRESS;%(progress.status)s;%(progress.downloaded_bytes)s;%(progress.total_bytes)s;%(progress.total_bytes_estimate)s;%(progress.speed)s;%(progress.eta)s')
    ```

2.  **Update `DownloadService.ts`**:
    Replace the Regex parser with a simple splitter:
    ```typescript
    if (line.startsWith('SCENECLIP_PROGRESS;')) {
        const parts = line.split(';');
        const progress = {
            status: parts[1],
            downloaded: parseInt(parts[2]),
            total: parseInt(parts[3]) || parseInt(parts[4]), // Total or Estimate
            speed: parseFloat(parts[5]),
            eta: parseInt(parts[6])
        };
        // Update UI
    }
    ```

### Step 2: Integrate Aria2c (High Priority)
**Complexity**: Medium | **Impact**: High (Speed)

1.  **Bundle Binary**: Add `aria2c.exe` to `src-tauri/bin/` (or sidecar folder).
2.  **Update `ytdlp.ts`**:
    Add a toggle `useAria2c` in settings.
    ```typescript
    if (settings.useAria2c) {
        args.push('--downloader', 'aria2c');
        args.push('--downloader-args', 'aria2c:-x 16 -k 1M');
    }
    ```
3.  **Handle Output**: Update parsing logic to listen for `[#` lines (Aria2c progress) which differ from the Template format.

### Step 3: Implement "Protocol Hack" for Trimming
**Complexity**: Low | **Impact**: Medium (Bug Prevention)

If you implement Step 2, you **must** add this. `aria2c` fails on YouTube streams (HLS) unless forced to `https`.

In `ytdlp.ts`:
```typescript
if (isClipping && settings.useAria2c) {
    // Force specific sort to prefer direct HTTPS files over HLS/DASH
    args.push('--format-sort', 'proto:https');
}
```

### Step 4: Robust Process Recovery (Medium Priority)
**Complexity**: Medium | **Impact**: Medium

Parabolic has a `recovery.json` system.
*   **Logic**: Save the `DownloadTask` state to a persistent JSON store *before* starting the download.
*   **On App Start**: Read this JSON. If entries exist, it means the app crashed. Offer to "Resuming Interrupted Downloads".
*   **SceneClip**: Currently uses `tauri-plugin-store`, but ensuring the "Task State" is saved periodically (or on start) would match Parabolic's reliability.

---

## Summary Checklist

| Feature | Action | Code Location |
| :--- | :--- | :--- |
| **Output Parsing** | Replace Regex with `--progress-template` | `src/lib/ytdlp.ts` |
| **Engine** | Add `aria2c` support + `-x 16` | `src/lib/ytdlp.ts` |
| **Trimming** | Add `proto:https` hack if using aria2c | `src/lib/ytdlp.ts` |
| **Validation** | Read last stdout line for final filename | `src/lib/DownloadService.ts` |

This strategy combines SceneClip's modern UI/GPU prowess with Parabolic's bulletproof backend logic.
