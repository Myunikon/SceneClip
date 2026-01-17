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
  <a href="#%EF%B8%8F-installation">Installation</a> •
  <a href="#-configuration">Configuration</a> •
  <a href="#-faq">FAQ</a>
</p>

---

## 🚀 Quick Start

### ⚡ Installation

SceneClip is a **portable** application. You do not need to install Python, FFMPEG, or yt-dlp heavily on your system. We bundle everything for you.

|                                                 Platform                                                 |    Type     | Instructions                                                |
| :------------------------------------------------------------------------------------------------------: | :---------: | ----------------------------------------------------------- |
| <img src="https://img.shields.io/badge/-Windows-0078D6?style=flat-square&logo=windows&logoColor=white"/> |   `.exe`    | Download & Run. Click "Run Anyway" if SmartScreen appears.  |
|   <img src="https://img.shields.io/badge/-macOS-000000?style=flat-square&logo=apple&logoColor=white"/>   |   `.dmg`    | Drag to Applications. Open (Right Click > Open if blocked). |
|   <img src="https://img.shields.io/badge/-Linux-FCC624?style=flat-square&logo=linux&logoColor=black"/>   | `.AppImage` | `chmod +x SceneClip.AppImage` then run.                     |

> 📥 **Download the latest release from [Releases Page](https://github.com/Myunikon/SceneClip/releases)**

---

## ✨ Features

<table>
<tr>
<td width="33%" valign="top">

**✂️ Smart Clipping**

- **Precision Cuts**: Extract specific segments (e.g., 00:10 - 00:20) without re-encoding.
- **Phantom Fix**: Proprietary algorithm to fix MP4 duration metadata so clips play correctly in all players.
- **GIF Maker**: Convert video segments to high-quality GIFs.

</td>
<td width="33%" valign="top">

**📥 Advanced Downloading**

- **Multi-Format**: MP4, MKV, WEBM, MP3, FLAC, WAV.
- **Codec Control**: Force usage of AV1, HEVC, H.264, or VP9.
- **4K/8K Support**: Download original quality streams.
- **Batch Mode**: Queue multiple URLs for sequential processing.

</td>
<td width="33%" valign="top">

**🛠️ Power Tools**

- **SponsorBlock**: Auto-skip intro, outro, and sponsors.
- **Subtitles**: Embed soft-subs or burn-in captions (SRT/VTT).
- **Audio Norm**: Normalize audio levels to 0dB.
- **Cookies**: Import `cookies.txt` for premium content.

</td>
</tr>
</table>

### 🖼️ Modern UI & UX

- **Theme Support**: 🌞 Light / 🌙 Dark / 💻 System
- **Localization**: 🇬🇧 English, 🇮🇩 Indonesian, 🇲🇾 Malay, 🇨🇳 Chinese
- **Clipboard Monitor**: Auto-detects supported URLs when you copy them.
- **Notifications**: Native desktop alerts when tasks complete.

---

## 📝 Usage Guide

### 1. Simple Download

1.  Copy a link (YouTube, Twitter, Instagram, etc.).
2.  SceneClip pops up. Click **Download**.
3.  Choose Video or Audio. Done.

### 2. Creating a Clip

1.  Select **"Clip Mode"** in the dialog.
2.  Drag the sliders or type timestamps (e.g., `01:20` to `01:30`).
3.  (Optional) Toggle **"Phantom Fix"** for maximum compatibility.
4.  Click **Download**.

### 3. Converting to GIF

1.  Select **"GIF Mode"**.
2.  Set **FPS** (15-60) and **Scale** (Width).
3.  Choose Quality: **High** (Better colors) or **Fast** (Quicker encode).

---

## ⚙️ Configuration

<details>
<summary><b>📂 File Paths & Templates</b></summary>

- **Downloads Folder**: customizable via Settings.
- **Filename Template**:
  - Default: `%(title)s.%(ext)s`
  - Advanced: `%(uploader)s_%(upload_date)s_%(title)s.%(ext)s`

</details>

<details>
<summary><b>🌐 Network & Access</b></summary>

- **Proxy**: Supports HTTP/HTTPS/SOCKS proxies.
- **Imposter Mode**: Spoof User-Agent (e.g., mimic an iPad or Android device) to bypass restrictions.
- **Cookies**: Load `cookies.txt` (Netscape format) to access age-gated or member-only videos.

</details>

---

## ❓ FAQ

<details>
<summary><b>Why does Windows say "Unrecognized App" (SmartScreen)?</b></summary>
SceneClip is an open-source project and is not digitally signed with a paid certificate (which costs ~$400/year). 
This warning is normal for new apps. Simply click <b>More Info → Run Anyway</b>.
</details>

<details>
<summary><b>What is "Phantom Duration Fix"?</b></summary>
Sometimes, when you clip a 10-second part from a 5-hour stream using generic tools, Windows Media Player still thinks the video is 5 hours long. 
<b>Phantom Fix</b> rewrites the MP4 atoms so the file is truly 10 seconds long in every player.
</details>

<details>
<summary><b>Which sites are supported?</b></summary>
SceneClip uses `yt-dlp` under the hood, which supports <b>thousands</b> of sites including YouTube, Twitch, Twitter (X), Instagram, TikTok, Vimeo, and many more.
</details>

---

## 🛠️ For Developers

Want to build from source?

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/) (Stable)
- **Windows**: VS C++ Build Tools
- **Linux**: `libwebkit2gtk-4.0-dev`, `build-essential`, `ffmpeg`

### Build Steps

1.  **Clone Repo**:

    ```bash
    git clone https://github.com/Myunikon/SceneClip.git
    cd SceneClip
    ```

2.  **Install Deps**:

    ```bash
    npm install
    ```

3.  **Setup Binaries** (Crucial):

    ```bash
    npm run setup-binaries
    ```

    _This downloads the platform-specific `yt-dlp` and `ffmpeg` binaries._

4.  **Run**:
    ```bash
    npm run tauri dev
    ```

---

## 🛡️ VirusTotal Scan

<p align="center">
  <img src="https://img.shields.io/badge/VirusTotal-Clean-brightgreen?style=for-the-badge&logo=virustotal" alt="VirusTotal Clean"/>
</p>

SceneClip is 100% open source. The binaries included (`yt-dlp`, `ffmpeg`) are fetched directly from their official repositories.

---

<p align="center">
  <sub>Made with ❤️ by <a href="https://github.com/Myunikon">Myunikon</a></sub><br/>
  <sub>Distributed under MIT License</sub>
</p>
