<p align="center">
  <img src="https://raw.githubusercontent.com/Myunikon/SceneClip/main/public/sceneclip-banner.png" width="600" alt="SceneClip Banner"/>
</p>

<h1 align="center">SceneClip 🎬</h1>

<p align="center">
  <b>The Ultimate GUI for yt-dlp and ffmpeg</b><br/>
  <sub>Download videos, extract audio, and create precise clips with correct metadata — no command line required.</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Built_with-Tauri_v2-blue?style=flat-square&logo=tauri&logoColor=white" alt="Tauri v2"/>
  <img src="https://img.shields.io/badge/Frontend-React_18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 18"/>
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
  <br/>
  <img src="https://img.shields.io/github/v/release/Myunikon/SceneClip?style=flat-square&label=Version&color=success" alt="Version"/>
  <img src="https://img.shields.io/github/downloads/Myunikon/SceneClip/total?style=flat-square&label=Downloads&color=blue" alt="Downloads"/>
  <img src="https://img.shields.io/github/license/Myunikon/SceneClip?style=flat-square&label=License" alt="License"/>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#%EF%B8%8F-privacy--security">Privacy</a> •
  <a href="#-roadmap">Roadmap</a> •
  <a href="#-faq">FAQ</a>
</p>

---

<p align="center">
  <img src="https://via.placeholder.com/800x450.png?text=SceneClip+Demo+GIF+Placeholder" alt="SceneClip Interface Preview" width="100%" style="border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);"/>
</p>

---

## 🚀 Quick Start

### ⚡ Installation

SceneClip is a **fully portable** application. No need to manually install Python, FFMPEG, or yt-dlp. We bundle everything you need in a single file.

|                                                 Platform                                                 |    Type     | Instructions                                                                     |
| :------------------------------------------------------------------------------------------------------: | :---------: | -------------------------------------------------------------------------------- |
| <img src="https://img.shields.io/badge/-Windows-0078D6?style=flat-square&logo=windows&logoColor=white"/> |   `.exe`    | **Download & Run.**<br>If SmartScreen appears: Click `More Info` → `Run Anyway`. |
|   <img src="https://img.shields.io/badge/-macOS-000000?style=flat-square&logo=apple&logoColor=white"/>   |   `.dmg`    | **Drag to Applications.**<br>If blocked: Right Click App → `Open` → `Open`.      |
|   <img src="https://img.shields.io/badge/-Linux-FCC624?style=flat-square&logo=linux&logoColor=black"/>   | `.AppImage` | **Make Executable & Run.**<br>`chmod +x SceneClip.AppImage` in terminal.         |

> 📥 **[Download the Latest Release Here](https://github.com/Myunikon/SceneClip/releases)**

---

## ✨ Features

<table>
<tr>
<td width="33%" valign="top">

**✂️ Smart Clipping**

- **Precision Cuts**: Extract specific segments (e.g., `00:10` - `00:20`) without re-encoding the whole video.
- **Phantom Fix**: Proprietary algorithm to rewrite MP4 duration atoms, ensuring clips play correctly on Windows Media Player & QuickTime.
- **GIF Maker**: Turn video segments into high-quality, optimized GIFs.

</td>
<td width="33%" valign="top">

**📥 Advanced Downloading**

- **Multi-Format**: Support for MP4, MKV, WEBM, MP3, FLAC, WAV.
- **Quality Control**: From 144p up to **4K/8K** HDR.
- **Codec Selection**: Force AV1, HEVC, H.264, or VP9.
- **Batch Mode**: Queue multiple URLs for sequential, hands-free processing.

</td>
<td width="33%" valign="top">

**🛠️ Power Tools**

- **SponsorBlock**: Automatically skip intros, outros, and sponsored segments.
- **Subtitles**: Embed soft-subs or burn-in captions (SRT/VTT).
- **Audio Norm**: Normalize audio levels to 0dB.
- **Cookies**: Import `cookies.txt` for premium/age-gated content.

</td>
</tr>
</table>

### 🖼️ Modern UI & UX

- **Theme Support**: 🌞 Light / 🌙 Dark / 💻 System Sync
- **Localization**: 🇬🇧 English, 🇮🇩 Indonesian, 🇲🇾 Malay, 🇨🇳 Chinese
- **Clipboard Monitor**: Auto-detects supported URLs when you copy them (can be toggled off).
- **Native Notifications**: Desktop alerts when tasks complete.

---

## 🛡️ Privacy & Security

We believe in **Local Processing**.

- **No Data Collection**: SceneClip does not track your downloads or watch history.
- **Offline Logic**: All video processing (clipping, converting, ffmpeg tasks) happens 100% on your machine.
- **Open Source**: The code is transparent. You can audit exactly what the application does.

<p align="center">
  <img src="https://img.shields.io/badge/VirusTotal-Clean-brightgreen?style=flat-square&logo=virustotal" alt="VirusTotal Clean"/>
</p>

---

## 🗺️ Roadmap

See what's coming next or [request a feature](https://github.com/Myunikon/SceneClip/issues):

- [x] Dark/Light Mode Support
- [x] SponsorBlock Integration
- [ ] **Playlist Downloading** (Download entire playlists in one click)
- [ ] **Metadata Editor** (Edit ID3 tags for MP3s manually)
- [ ] **MacOS Universal Binary** (Native M1/M2/M3 Support)

---

## 📝 Usage Guide

### 1. Simple Download

1. Copy a link (YouTube, Twitter, Instagram, etc.).
2. SceneClip detects it automatically. Click **Download**.
3. Choose Video or Audio format. Done.

### 2. Creating a Clip

1. Select **"Clip Mode"** in the dialog.
2. Drag the timeline sliders or type exact timestamps (e.g., `01:20` to `01:30`).
3. Toggle **"Phantom Fix"** for maximum player compatibility.
4. Click **Download**.

### 3. Converting to GIF

1. Select **"GIF Mode"**.
2. Set **FPS** (15-60) and **Scale** (Width in px).
3. Choose Quality: **High** (Better colors/dithering) or **Fast** (Quicker encode).

---

## ⚙️ Configuration

<details>
<summary><b>📂 File Paths & Naming</b></summary>

- **Downloads Folder**: Customizable via Settings.
- **Filename Template**:
  - Default: `%(title)s.%(ext)s`
  - Advanced: `%(uploader)s_%(upload_date)s_%(title)s.%(ext)s`
  </details>

<details>
<summary><b>🌐 Network & Access</b></summary>

- **Proxy**: Supports HTTP/HTTPS/SOCKS proxies.
- **Imposter Mode**: Spoof User-Agent (mimic iPad/Android) to bypass throttling.
- **Cookies**: Load `cookies.txt` (Netscape format) to access member-only videos.
</details>

---

## ❓ FAQ

<details>
<summary><b>Windows says "Unrecognized App" (SmartScreen). Is it safe?</b></summary>
Yes. This warning appears because SceneClip is an open-source project and isn't signed with an expensive corporate certificate (~$400/year).
<br><br>
To install: Click <b>More Info</b> → <b>Run Anyway</b>. The source code is openly available for audit.
</details>

<details>
<summary><b>What is "Phantom Duration Fix"?</b></summary>
When you clip a small segment from a long stream using standard tools, the file metadata often retains the original duration (e.g., a 10s clip thinks it is 5 hours long). <b>Phantom Fix</b> rewrites the MP4 atoms so the file is truly 10 seconds long, allowing proper seeking in all players.
</details>

<details>
<summary><b>Which sites are supported?</b></summary>
SceneClip is powered by `yt-dlp`, supporting <b>thousands of sites</b> including YouTube, Twitch, Twitter (X), Instagram, TikTok, Vimeo, and many more.
</details>

---

## 🛠️ For Developers

Interested in contributing? Here is how to build from source.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/) (Stable)
- **Windows**: VS C++ Build Tools
- **Linux**: `libwebkit2gtk-4.0-dev`, `build-essential`, `ffmpeg`

### Build Steps

1. **Clone Repo**:

   ```bash
   git clone https://github.com/Myunikon/SceneClip.git
   cd SceneClip
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Setup Binaries (Crucial)**:
   This script downloads the OS-specific `yt-dlp` and `ffmpeg` executables needed for Tauri's sidecar pattern.

   ```bash
   npm run setup-binaries
   ```

4. **Run in Dev Mode**:
   ```bash
   npm run tauri dev
   ```

---

<p align="center">
  <b>Enjoying SceneClip?</b>
  <br/>
  Gives us a star ⭐ on <a href="https://github.com/Myunikon/SceneClip">GitHub</a> to support development!
</p>

<p align="center">
  <sub>Made with ❤️ by <a href="https://github.com/Myunikon">Myunikon</a></sub>
  <br/>
  <sub>Distributed under MIT License</sub>
</p>
