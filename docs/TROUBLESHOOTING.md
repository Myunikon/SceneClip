# Troubleshooting & FAQ

This document provides solutions to common issues you might encounter while using SceneClip.

---

## Table of Contents

1.  [FAQ: Common Issues](#faq-common-issues)
2.  [10 Realistic Scenarios & Solutions](#10-realistic-scenarios--solutions)
3.  [How to Report a Bug](#how-to-report-a-bug)

---

## FAQ: Common Issues

### Q: Why is my download stuck?

If the download status stops at "Processing" or 100% but hasn't finished:

1.  **Server Throttling**: YouTube sometimes limits speed. Solution: *Pause/Resume* the download or restart the application.
2.  **Merging Process**: High-resolution video files (4K/8K) take a significant amount of CPU/Disk time to merge (video+audio) with FFmpeg. **Please wait**, this process depends on your hardware speed.
3.  **Network Timeout**: If the connection drops, SceneClip automatically retries up to 3 times. Check the Terminal log for "Timeout" or "Socket Error" messages.

### Q: Permission Denied / Access Error

If you see a "Write error" or "Permission denied" message:

1.  **Protected Folder**: Do not save downloads to `C:\Program Files` or `C:\Windows`. Use your `Downloads`, `Documents` folders, or a different drive (D:/E:).
2.  **Antivirus**: Sometimes Windows Defender blocks `yt-dlp.exe`. Add an exclusion for the SceneClip installation folder.

### Q: How to Update yt-dlp?

SceneClip has an independent binary update mechanism.

1.  Open **Settings** (gear icon).
2.  Select the **About** menu.
3.  Look for the **"Binary Versions"** card.
4.  Click **Check Updates**.
5.  If a new version is available, click **Update Now**. The application will automatically download and replace `yt-dlp.exe`. No restart required.

---

## 10 Realistic Scenarios & Solutions

| Problem Scenario | Possible Cause | Practical Solution |
| :--- | :--- | :--- |
| **1. "Sign in to confirm you're not a bot"** | YouTube blocking IP/Default User-Agent. | Go to **Settings > Network**. Change **User-Agent** to your actual browser string, or use **PO Token** if available. |
| **2. Premium 1080p Video Fails** | Premium-only video (high bitrate). | Use **Cookies** (Settings > Network > From Browser). Ensure the account logged into the browser has Premium access. |
| **3. Slow Download (Fast Internet)** | Server limiting single connection. | Enable **Use Aria2c** in Settings > Network. This forces multi-connection downloading. |
| **4. "FFmpeg not found" error** | Missing or corrupt FFmpeg binary. | Go to **Settings > System**. Enable "Developer Mode", check FFmpeg path. If empty, reinstall SceneClip or set path manually. |
| **5. Subtitles not showing in video** | Subtitles downloaded separately (.srt). | Ensure **Embed Subtitles** is checked in the download dialog (Enhancements tab) to merge them into the video (soft-sub). |
| **6. GIF Download Failed (Conversion Error)** | Clip too long / Resolution too high. | Limit GIF clip to max 15-30 seconds. Reduce **Scale** in GIF options to 480p or 320p. |
| **7. Weird / Too Long Filenames** | Original video title has unique chars. | In **Settings > Downloads**, change the filename template. Remove `{title}` and replace with `{id}` or input manual name when downloading. |
| **8. App Crash at Start** | Corrupt config/database file. | Delete `settings.json` file in the AppData folder `C:\Users\[User]\AppData\Roaming\SceneClip` to manual reset. |
| **9. Playlist only downloads first 5 videos** | Wrong batch mode detection. | Ensure playlist link is entered in the **Batch Import** tab, not Single URL. |
| **10. "Video unavailable in your country"** | Geo-restriction (Region block). | Use **Proxy** (Settings > Network). Enter a proxy from an allowed country (e.g., US/UK). |

---

## How to Report a Bug

If you encounter an issue not listed above, please report it to us via **GitHub Issues**.

### Steps to Report:

1.  **Reproduce the Issue**: Check if the problem happens consistently.

2.  **Save Logs**:
    *   Open the **Terminal** tab in SceneClip.
    *   Reproduce the error (try downloading again).
    *   Click the **Save Logs** (Floppy Disk icon) button to save the output as a `.txt` file.

3.  **Create Issue**:
    *   Go to our [GitHub Issues](https://github.com/Myunikon/SceneClip/issues) page.
    *   Click "New Issue".
    *   Attach the **Log File** and a **Screenshot** of the error.
    *   Describe what you were trying to do.

> **Important**: Providing logs is crucial as it helps us see exactly what `yt-dlp` or `ffmpeg` reported during the failure.
