
# Nickvision Parabolic Reverse Engineering Report

## Executive Summary

This report analyzes the internal mechanisms of "Nickvision Parabolic" (formerly TubeConverter) regarding process management, specifically focusing on stability, pause/resume functionality, and error handling.

**Key Findings:**

1.  **Pause/Resume**: Uses  **OS-Level Process Suspension**  (Non-Destructive). It does  _not_  kill the process.
2.  **Error Handling**: Relies on specific  `yt-dlp`  output templates and string parsing, not complex Regex. No automatic application-layer retry loop for crashes.
3.  **Process Management**: Delegates heavily to  `yt-dlp`  arguments for stability, while managing the process lifecycle via a C++ wrapper (`libnick`).

----------

## 1. The "Pause/Resume" Mechanism

**Implementation:**  OS-Level Process Suspension (Non-Destructive)

Parabolic does  **not**  use a "Destructive Pause" (killing and restarting). Instead, it suspends the process execution at the Operating System level.

-   **Source**:
    
    libparabolic/src/models/download.cpp
-   **Logic**:
    -   `Download::pause()`  calls  `m_process->pause()`.
    -   `Download::resume()`  calls  `m_process->resume()`.
    -   The
        
        Process  class (from  `libnick`) abstracts platform-specific suspension:
        -   **Windows**: Likely uses  `NtSuspendProcess`  (via NTAPI) or iterates threads with  `SuspendThread`. This allows the process to keep open file handles and sockets without timeout (usually), as long as the OS doesn't kill it for unresponsiveness.
        -   **Linux**: Sends  `SIGSTOP`  to pause and  `SIGCONT`  to resume.
-   **File Locking**: Because the process is suspended, file handles remain open and locked by  `yt-dlp`. No special file locking logic is implemented in the C++ layer.

**Contrast with "Destructive Pause":**  `Download::stop()`  explicitly calls  `m_process->kill()`, which is used when the user cancels the download. This confirms that

pause()  is distinct and non-destructive.

## 2. Error Parsing & Mitigation

**Implementation:**  String Splitting & Template Output

Parabolic imposes a strict output format on  `yt-dlp`  to avoid fragile Regex parsing of standard output.

### Output format

It injects the following argument to  `yt-dlp`:

--progress-template  "[download] PROGRESS;%(progress.status)s;%(progress.downloaded_bytes)s;%(progress.total_bytes)s;%(progress.total_bytes_estimate)s;%(progress.speed)s;%(progress.eta)s"

### Parsing Logic

-   **Location**:  `Download::watch()`  in
    
    download.cpp.
-   **Method**:
    1.  Reads  `stdout`  line by line.
    2.  Check if line contains  `PROGRESS;`.
    3.  Splits the string by  `;`  delimiter.
    4.  Directly parses index positions:
        -   Index 2: Downloaded Bytes
        -   Index 3: Total Bytes
        -   Index 5: Speed
        -   Index 6: ETA

### Error Detection & Retry

-   **Detection**: It primarily relies on  `yt-dlp`  exit codes.
    -   Success: Exit Code  `0`.
    -   Error: Non-zero exit code.
-   **Retry Logic**:
    -   **Internal**:  `yt-dlp`  handles network retries internally (standard behavior).
    -   **Application**: There is  **NO automatic retry loop**  in
        
        DownloadManager  for crashed processes. If the process crashes, the download state becomes  `Error`. The user must manually click "Retry" (which calls
        
        retryFailedDownloads  in
        
        DownloadManager).
    -   **Recovery**: A  `DownloadRecoveryQueue`  (`recovery.json`) exists to restore downloads if the application itself is closed/crashed, but this is different from restarting a failing  `yt-dlp`  process.

## 3. FFmpeg/Fragment Handling

**Implementation:**  Argument Injection

Parabolic constructs a complex command line in  `DownloadOptions::toArgumentVector`  (

downloadoptions.cpp).

### Key Arguments for Stability

-   **Aria2c Integration**:
    
    --downloader  aria2c
    
    --downloader-args  "aria2c:--summary-interval=0 --enable-color=false -x 16 -k 1M"
    
    --concurrent-fragments  8
    
    This is used to accelerate downloads and handle connection drops better than native HTTP.
    
-   **Progress updates**:
    
    --progress-delta  .25
    
    Forces updates every 0.25s for smooth UI.
    
-   **Filesystem**:
    
    --no-part (Optional)
    
    --paths  temp:[CacheDir]
    
    --paths [DestDir]
    
    It uses a temporary directory for fragments to prevent cluttering the user's download folder until completion.
    

### Fragment Merging

It relies entirely on  `yt-dlp`'s internal post-processing (using the bundled  `ffmpeg`) to merge fragments. It uses the  `--ffmpeg-location`  flag to ensure the bundled, compatible FFmpeg is used instead of system binaries.


# Parabolic Deep Dive: Technical Logic Analysis

## 1. Cookie Management & "403 Forbidden" Strategy

**Implementation:**  Passive Injection (No auto-bypass).

Parabolic does  **not**  implement complex anti-bot measures like PoToken injection or VisitorData handling. It relies entirely on  `yt-dlp`'s native browser integration.

-   **Browser Detection:**
    -   **Logic**: There is  **no code**  that automatically scans the host OS for installed browsers. The list of browsers (Chrome, Firefox, Brave, etc.) is hardcoded in  `Browser`  enum/UI.
    -   **Selection**: The user manually selects a browser from a static list in preferences.
    -   **Mechanism**:
        -   If a browser is selected: Injects  `--cookies-from-browser [BROWSER_NAME]`.
        -   If a file is provided: Injects  `--cookies [PATH_TO_FILE]`.
    -   **Crash Recovery**: If a 403 error occurs, the application fails. It does  **not**  silently prompt for cookies or retry with a different browser.

## 2. Aria2c + Trimming (Time-Range) Conflict

**Implementation:**  Argument Coexistence + Protocol Forcing ("The Magic Fix").

Parabolic  **allows**  Aria2c and Trimming to be used simultaneously. It does not disable Aria2c when logic gate  `m_timeFrame`  is active. However, it implements a critical stability argument to prevent corruption.

### The "Magic Fix" (Logic Gate)

When  `m_timeFrame`  (Trimming) is active, Parabolic forces  `yt-dlp`  to prioritize HTTPS streams over HLS/DASH.

-   **Code Evidence**:
    
    downloadoptions.cpp  (Line 289)
    
    std::string formatSort{ m_timeFrame ?  "proto:https"  :  "" };
    
-   **Why this matters**: HLS/DASH segments are difficult to trim cleanly without re-encoding or complex concatenation. Pure HTTP streams are strictly byte-offsets, which  `aria2c`  handles perfectly. This argument  `proto:https`  tells  `yt-dlp`  to prefer direct video file downloads over streaming manifests when trimming is requested.

### Argument Priority List

The arguments are injected in this specific order:

1.  `--downloader aria2c`  (if enabled)
2.  `--downloader-args aria2c:...`
3.  `--format-sort proto:https,...`  (if trimming active)
4.  `--download-sections *[START]-[END]`
5.  `--force-keyframes-at-cuts`  (Ensures the video is cut at the nearest keyframe to prevent corruption at the start/end).

## 3. Subtitle Reliability & Embedding

**Implementation:**  Explicit Format Conversion & container-aware embedding.

### Auto-Subs vs Manual Subs

-   **Manual Subs**: Enabled via code  `arguments.push_back("--write-subs");`  (Always added if languages selected).
-   **Auto-Subs**: Enabled via explicit gate:
    
    if(downloaderOptions.getIncludeAutoGeneratedSubtitles()) {
    
      arguments.push_back("--write-auto-subs");
    
    }
    

### Format Conversion

Parabolic  **always**  converts subtitles to a target format to ensure compatibility, it does not keep the original (often VTT) format unless requested.

-   **Switch Logic**:
    -   **SRT**:  `--convert-subs srt`  AND  `--use-postprocessor srt_fix`  (Fixes common timing issues).
    -   **ASS**:  `--convert-subs ass`.
    -   **LRC**:  `--convert-subs lrc`.
    -   **Default**:  `--convert-subs vtt`.

### Embedding Strategy

Embedding is conditional based on the  **Container**  capabilities, defined in  `MediaFileType::supportsSubtitleFormat`.

-   **Logic Tree**:
    -   **IF**  `EmbedSubtitles`  is ON:
        -   **AND**  Output Container is  **MKV**:
            -   Supported Formats:  **ASS, SRT, VTT**.
            -   Action: Inject  `--embed-subs`.
        -   **AND**  Output Container is  **MP4/MOV**:
            -   Supported Formats:  **SRT, VTT**  (ASS is rejected).
            -   Action: Inject  `--embed-subs`.
        -   **AND**  Output Container is  **WebM**:
            -   Supported Formats:  **VTT**  (SRT/ASS rejected).
            -   Action: Inject  `--embed-subs`.
    -   **AND**  (Always): Inject  `--compat-options no-keep-subs`  (Deletes the external subtitle file after embedding).

### Metadata

-   It uses  `--embed-metadata`  if enabled.
-   It explicitly clears specific metadata fields  `comment`,  `description`,  `synopsis`,  `purl`  via  `--postprocessor-args`  if "Remove Source Data" is enabled.