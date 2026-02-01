# Changelog

## [1.5.0] - 2026-02-01

### Added
- **Full Windows ARM64 Support**: Added native installer (.exe, .msi) and portable support for Windows ARM64.
- **Native macOS Universal Build**: New build strategy using `lipo` to combine ARM64 and Intel binaries into a single fat binary.
- **Expanded Linux Distribution Support**: Added `.rpm` (Fedora/RHEL) and manual `.tar.gz` portable builds alongside `.deb` and `.AppImage`.
- **Sidecar Synchronization**: Automated setup for `deno` and `ffprobe` across all platforms.
- **Hardware Acceleration**: Refined GPU scaling logic to correctly utilize detected `gpuType` for FFmpeg filters.

### Changed
- **FFmpeg Essentials**: Switched to FFmpeg Essentials builds for Windows to reduce footprint while maintaining core functionality.
- **Binary Management**: Simplified `setup-binaries.js` with better error handling and independent extraction logic.
- **Removed UPX Compression**: Eliminated UPX packing to avoid runtime compatibility issues and speed up build times.
- **UI Refinement**: Simplified updater settings (yt-dlp focused) and removed confusing "Technical & Binary Paths" section.
- **Theme Stability**: Improved theme persistence and fixed flash of unstyled content (FUNC).

### Fixed
- **UI Logic**: Fixed button ripple memory leaks, SegmentalControl layout collisions, and Tooltip provider prop passing.
- **Hook Reliability**: Fixed race conditions and read-only state issues in `useExportForm`, `useFileDrop`, and `useRecovery`.
- **CI/CD Reliability**: Fixed naming typos (e.g., `arm664`) and duplicate variables in release workflows.
- **Artifact Globs**: Fixed release asset collection to correctly capture all architecture-specific installers.

---
## [1.0.0] - 2026-01-28
- Initial release.
