# DevFlow

A desktop workspace that brings live preview, API testing, database management, Docker, and file tracking into one place — scoped to your project.

No more switching between a browser, Postman, TablePlus, Docker Desktop, and a terminal just to work on a single project.

---

## How it works

DevFlow is built around **sessions**. Each session links to a folder on your machine and remembers everything about it: how to start the dev server, your saved API requests, database connections, and file history. Switch sessions and the whole workspace switches with you.

---

## Features

### Live Preview
- Auto-detects how to start your dev server based on project type (React, Vue, Next.js, Django, Flask, FastAPI, Rails, Go, Rust, PHP, and more)
- Detects the package manager in use (npm / yarn / pnpm / bun)
- Parses stdout in real time to find the actual URL the server started on — no hardcoded ports
- Embedded Chromium browser with back, forward, refresh, and editable URL bar
- Server log panel with auto-scroll and selectable text

### API Tester
- GET, POST, PUT, PATCH, DELETE with a clean request editor
- Headers editor with per-row enable/disable toggles
- JSON and raw body support with auto Content-Type
- Color-coded status badges, response time, pretty-printed JSON
- Saved requests per session, restored automatically when you switch back

### Checkpoint System
- Named git snapshots of your session state
- Save and restore without touching a terminal
- Auto-initializes a git repo in the project folder if one doesn't exist

### Database Manager *(coming soon)*
- PostgreSQL, MySQL, SQLite, MongoDB

### Docker Manager *(coming soon)*
- Detects Dockerfile and docker-compose.yml, start/stop/restart containers with live log streaming

### File Change Tracker *(coming soon)*
- Per-file diff view since the last checkpoint, toggle files in/out of the next save

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron |
| Frontend | React + Vite |
| IPC bridge | contextBridge + ipcRenderer |
| Embedded browser | Chromium webview |
| Process management | Node.js child_process |
| Persistence | JSON via app.getPath('userData') |

---

## Requirements

Node.js v18+ and npm v8+.

---

## Running locally

```bash
git clone https://github.com/richardulaval/all_in_one_devops_app.git
cd all_in_one_devops_app
npm install
npm run electron:dev
```

---

## Roadmap

- [x] Project & session management with persistence
- [x] Multi-language project type detection
- [x] Live preview with embedded browser
- [x] API tester with saved request collections
- [x] Checkpoint system
- [x] First launch setup & app settings
- [ ] Settings panel (in-app, change defaults at any time)
- [ ] File change tracker with diff view
- [ ] Database manager
- [ ] Docker manager
- [ ] Packaged installers (Windows / macOS / Linux)
