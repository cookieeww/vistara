# Vistara

> **Offline-first infinite study canvas** — a desktop application for Windows built with Next.js + Tauri + tldraw.

## Features

- 🎨 **Infinite canvas** — draw, write, organise ideas spatially
- 📝 **Notes & Todo list** — right-side panel
- 📂 **File drag & drop** — images, video, audio, PDF
- 🎬 **YouTube embeds** — paste a link, get an in-canvas player
- 📺 **Focus / Study Mode** — split view: video on one side, notes on the other
- 💾 **Offline-first saves** — `.vistara` files (JSON), autosave every 30 s
- 📤 **Export** as PNG, JPG, or SVG
- 🖥️ **Windows desktop app** (.exe / .msi installer)

---

## Prerequisites

| Tool | Install |
|------|---------|
| Node.js ≥ 18 | https://nodejs.org |
| Rust + Cargo | https://www.rust-lang.org/tools/install |
| Visual Studio Build Tools | https://visualstudio.microsoft.com/visual-cpp-build-tools/ (need "Desktop development with C++") |
| WebView2 Runtime | Included in Windows 10/11 — install from https://developer.microsoft.com/en-us/microsoft-edge/webview2/ if missing |

---

## Quick Start (Development)

```powershell
# 1. Install dependencies (already done if you're reading this)
npm install

# 2. Run in browser (fastest, no Rust needed)
npm run dev
# open http://localhost:3000

# 3. Run as native Tauri window (requires Rust)
npm run tauri:dev
```

---

## Build Windows Installer

```powershell
# Builds the Next.js static site + Tauri .exe/.msi in one step
npm run tauri:build

# Installer output location:
# src-tauri/target/release/bundle/msi/Vistara_0.1.0_x64_en-US.msi
# src-tauri/target/release/bundle/nsis/Vistara_0.1.0_x64-setup.exe
```

---

## Project Structure

```
vistara/
├── app/                  Next.js App Router pages
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/           React components
│   ├── CanvasWrapper.tsx  Main editor orchestrator
│   ├── Toolbar.tsx        Top toolbar
│   ├── Sidebar.tsx        Right panel (todos, layers, props)
│   ├── FocusMode.tsx      Study mode overlay
│   ├── PagesBar.tsx       Multi-page tab bar
│   └── StatusBar.tsx      Bottom status bar
├── lib/
│   ├── mediaSink.ts       Audio/video playback controller
│   └── persistence.ts     .vistara file format
├── src-tauri/             Tauri (Rust) backend
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── capabilities/
│       └── default.json
└── next.config.ts
```

---

## Saving Files

- Files are saved as `.vistara` (JSON containing the full tldraw canvas snapshot + todos + notes)
- **Autosave**: every 30 seconds when a file is open
- **Crash recovery**: open the last `.vistara` file manually to restore
- In browser mode (npm run dev), save triggers a file download

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save |
| `V` | Select tool |
| `H` | Hand / Pan |
| `P` | Pen / Draw |
| `E` | Eraser |
| `T` | Text |

---

## License

MIT License — Copyright © 2026 Shikhar. See [LICENSE](./LICENSE).

---

```
VISTARA DESKTOP APPLICATION READY
```
