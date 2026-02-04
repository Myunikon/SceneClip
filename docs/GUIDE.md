# User Manual

Welcome to the comprehensive guide for SceneClip. This document covers everything from basic downloading to advanced features like trimming, GIF creation, and power-user configurations.

> For troubleshooting common issues, please refer to [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## Table of Contents

1.  [Essentials: Quick Start & Basics](#1-essentials-quick-start--basics)
2.  [Core Features](#2-core-features)
3.  [Advanced Capabilities](#3-advanced-capabilities)
4.  [Configuration Compatibility Guide](#4-configuration-compatibility-guide)

---

## 1. Essentials: Quick Start & Basics

### Quick Start: Smart Detection Flow
SceneClip features a Smart Detection system that accelerates your workflow by automatically detecting links from your clipboard.

**Steps:**
1.  **Copy Link**: Copy the URL of the video you want to download from your browser (e.g., YouTube, Twitch, or Instagram).
2.  **Open SceneClip**: Click the **Add (+)** button in the bottom right corner or use the keyboard shortcut (`Ctrl`+`N`).
3.  **Auto-Paste**: SceneClip will automatically read your clipboard. If a valid link is detected, the URL field will populate automatically.
4.  **Download**: Click **Download** to start with default settings (Best Quality).

*Tip: Use Batch Mode (list icon) to paste multiple URLs and download them in a queue.*

### Supported Sites
SceneClip is powered by the `yt-dlp` engine, supporting thousands of media platforms.

**Popular Platforms:**
*   **Video Hosting**: YouTube, Vimeo, Dailymotion
*   **Social Media**: Facebook, Instagram, TikTok, Twitter (X)
*   **Streaming**: Twitch (VODs & Clips), Kick
*   **Music**: SoundCloud, Bandcamp, Mixcloud
*   **Others**: Bilibili, Reddit, and various news sites.

**[View Full List of Supported Sites](../supportedsites.md)**

### Multi-Language Support
SceneClip is designed for a global audience and currently supports the following languages:
*   English
*   Indonesian (Bahasa Indonesia)
*   Malay (Bahasa Melayu)
*   Mandarin Chinese (Simplified)

You can change the language preference in **Settings > General**.

### Format Selection: Understanding Quality Options
You have full control over the output format via the **Quality** dropdown menu.

**Best (Recommended)**
The default mode. The system searches for the best available Video stream (e.g., 4K/8K) and best Audio stream, then merges them automatically. Use this for maximum quality.

**Audio Only**
Special mode for extracting audio.
*   **Output**: MP3 or M4A (AAC).
*   **Use Case**: Ideal for music, podcasts, or audiobooks where visuals are not needed. Saves data and storage space.

**Custom Formats (Resolution & Container)**
Manual mode for specific needs.
*   **Resolution**: Select 1080p, 720p, or 480p to save space or for device compatibility.
*   **Container**:
    *   **MP4**: Most compatible format for all devices (Mobile, TV, Console).
    *   **MKV**: Supports advanced features (like multiple subtitles/audio tracks) but player support may vary.

---

## 2. Core Features

### Clipping & Trimming
This feature allows you to download only specific segments of a video without downloading the full duration.

**How to Use:**
In the download dialog, enable the **Trim Video** toggle (scissors icon). Use the slider or type timestamps (format `MM:SS`) to set the start and end points.

### GIF Maker
Create instant animated GIFs directly from online videos.

**How to Use:**
Select the **GIF** tab in the top right of the download dialog.
*   **Rules**: Clip duration is limited to a maximum of 30 seconds.
*   **Customization**: You can adjust FPS (frames per second) and Resolution Scale to balance quality and file size.

### Batch Downloading
Feature for downloading multiple videos at once.

**How to Use:**
Click the **List** icon next to the URL input field. You can paste a list of URLs (one per line) or import directly from a text file (`.txt`).

### Keyring Manager
Secure credential manager for accessing Premium or Age-gated content.

*   **Security**: Uses the operating system's secure storage (Windows Credential Manager / macOS Keychain).
*   **Setup**: Go to **Settings > Network & Security > Saved Passwords**. Add the Service (site domain), Username, and Password. SceneClip will automatically use these credentials when downloading from the associated site.

---

## 3. Advanced Capabilities

### Advanced Enhancements
Access these features via the **ENHANCEMENTS** dropdown in the download dialog.

1.  **Remove Sponsors (SponsorBlock)**
    Automatically skips sponsor segments, intros, and outros using the SponsorBlock community database. *Inactive when Clipping mode is used.*

2.  **Subtitles**
    Downloads available subtitles. You can choose the language and whether to "embed" them into the video file (soft-sub) or download as a separate file.

3.  **Loudness Normalization**
    Normalizes audio volume using the EBU R128 broadcast standard. Ensures all downloads have a consistent volume level.

4.  **Post-Processing**
    Allows usage of FFmpeg presets or manual arguments for further file manipulation (e.g., codec conversion, color filters).

5.  **Schedule Download**
    Schedule tasks to run automatically at a specific future time. *The application must remain open for the schedule to execute.*

### Network & Connectivity
Advanced settings in **Settings > Network**.

**Aria2c (External Downloader)**
Download accelerator that splits files into multiple connections (multi-threaded). Highly effective for increasing speed on servers that limit bandwidth per connection.

**Cookies & User-Agent**
Solutions for sites that block bot access.
*   **User-Agent**: Changes the simulated browser identity.
*   **Cookies**: Import login sessions from browsers (Chrome/Edge/Firefox) or `cookies.txt` files to access content requiring account login (like Premium videos).

**Proxy Settings**
Proxy configuration (HTTP/SOCKS5) to bypass geo-restrictions.
*   **Smart Proxy Rotator**: Experimental feature to rotate IP addresses to avoid YouTube bans. *Do not enable along with Manual Proxy.*

### History & Data Management
Manage your download history in **Settings**.
*   **Retention Policy**: Set history to auto-delete after 3, 7, 14, 30 days, or "Keep Forever".
*   **Backup/Restore**: Use **Export History** to save a backup to a `.json` file and **Import History** to restore it. Useful when migrating computers.
*   **Reset**: **Reset All Data** option is available to restore factory settings.

### Hardware Acceleration
Leverage your GPU for maximum performance.
*   **Settings**: Ensure **Hardware Acceleration** is enabled in **Settings > Video Processing**.
*   **Benefits**: Accelerates video conversion and GIF creation, significantly reducing CPU load.

### Terminal Output
Built-in debugger to monitor background processes. Access via the **Terminal** tab.
*   **Live Log**: Displays execution commands, detailed progress, and error messages.
*   **Filter & Export**: Filter logs by category (System/yt-dlp/FFmpeg) and save to `.txt` for issue reporting.

### Auto-Rename
Customize output filename format in **Settings > Downloads**. Use variable templates like `{title}`, `{date}`, `{author}`, and `{id}` to standardize your file naming.

---

## 4. Configuration Compatibility Guide

This guide explains interactions between advanced settings to avoid configuration conflicts.

### Known Conflicts

**1. Proxy Collision (High Risk)**

> **WARNING**: Do not enable **Smart Proxy Rotator** and **Manual Proxy Configuration** simultaneously.

*   **Mechanism**: Manual Proxy forces traffic through a specific server, while Smart Proxy rotates IPs dynamically.
*   **Result**: `yt-dlp` will fail to determine the network route, causing connection errors.
*   **Recommendation**: Choose one. Use Smart Proxy to avoid general rate limits, Manual Proxy to bypass specific geo-blocks.

### Safe Combinations

**2. Authentication Stack**
You can safely combine authentication methods. `yt-dlp` prioritizes the most relevant method.
*   **Browser Auth**: Uses browser cookies (High Priority).
*   **Keyring**: Uses saved username/password (Fallback/Re-auth).
*   **Cookie Unlocker**: Helper plugin for reading encrypted Chrome/Edge cookies.
*   **Conclusion**: Safe to enable all.

**3. PO Token & Visitor Data**
*   **Function**: YouTube-specific "Proof of Origin" verification.
*   **Interaction**: Works alongside all other settings (Proxy/Auth). Does not alter network route or user identity.
*   **Conclusion**: Safe. Enable if experiencing bot verification errors on YouTube.

### Recommended Setup
For maximum stability in general use:
*   **Proxy**: OFF (Unless blocked by provider).
*   **Auth**: Browser (Chrome/Edge) + Unlocker **ON**.
*   **PO Token**: OFF (Enable only if YouTube downloads fail with 403 Forbidden).
