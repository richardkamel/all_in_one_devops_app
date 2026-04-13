# DevFlow

**A desktop workspace that consolidates your entire development toolkit — live preview, API testing, database management, Docker, and file tracking — all in one place, scoped to your project.**

> No more switching between a browser, Postman, TablePlus, Docker Desktop, and a terminal just to work on a single project. DevFlow keeps everything together.

---

## What it does

DevFlow is an Electron desktop app built around the concept of **sessions** — each session links to a project folder on your machine and remembers everything about it: how to start the dev server, your saved API requests, database connections, and file history.

Switch sessions and the whole workspace switches with you. Your tools follow your context, not the other way around.

---

## Features

### ✅ Live Preview
- Auto-detects how to start your dev server based on project type (React, Vue, Next.js, Django, Flask, FastAPI, Rails, Go, Rust, PHP, and more)
- Detects the package manager in use (npm / yarn / pnpm / bun)
- Parses stdout in real time to find the actual URL the server started on — no hardcoding ports
- Embedded Chromium browser with back, forward, refresh, and editable URL bar
- Resizable server log panel with ANSI stripping, auto-scroll, and selectable text
- Override command input for one-off debug runs without changing the saved config

### ✅ API Tester
- Send GET, POST, PUT, PATCH, DELETE requests with a clean request editor
- Headers editor with per-row enable/disable toggles
- JSON and raw body support with auto Content-Type
- Color-coded response status badges, response time, pretty-printed JSON
- Save requests per session — persists across restarts, loads instantly when you switch back

### 🔲 Database Manager *(in progress)*
- Connect to PostgreSQL, MySQL, SQLite, and MongoDB
- Browse tables and collections, run queries, view results

### 🔲 Docker Manager *(in progress)*
- Auto-detects `Dockerfile` and `docker-compose.yml` in the project folder
- Start, stop, and restart containers with live log streaming

### 🔲 File Change Tracker *(in progress)*
- Tracks what changed since the last checkpoint
- Per-file diff view, toggle files in/out of the next save

### 🔲 Checkpoint System *(in progress)*
- Named snapshots of your session state backed by git
- Save, overwrite, or branch — without ever touching a terminal

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | [Electron](https://www.electronjs.org/) |
| Frontend | [React](https://react.dev/) + [Vite](https://vitejs.dev/) |
| IPC bridge | Electron `contextBridge` + `ipcRenderer` |
| Embedded browser | Chromium `<webview>` tag |
| Process management | Node.js `child_process.spawn` |
| Persistence | JSON file via `app.getPath('userData')` |

---

## Project Structure

```
devops_app/
├── main.js          # Electron main process — IPC handlers, process management
├── preload.cjs      # contextBridge — exposes safe APIs to the renderer
├── src/
│   ├── App.jsx
│   └── components/
│       ├── Sidebar.jsx       # Project & session management
│       ├── Workspace.jsx     # Tab bar + tool switcher
│       ├── LivePreview.jsx   # Dev server + embedded browser
│       ├── ApiTester.jsx     # HTTP client
│       └── ...
└── vite.config.js
```

---

## Requirements

- [Node.js](https://nodejs.org/) v18 or higher
- npm v8 or higher (comes with Node.js)
- Windows, macOS, or Linux

To check your versions:
```bash
node -v
npm -v
```

---

## Running the app locally

```bash
# 1. Clone the repo
git clone https://github.com/richardkamel/all_in_one_devops_app.git
cd all_in_one_devops_app

# 2. Install dependencies
npm install

# 3. Start in development mode (launches Vite + Electron together)
npm run electron:dev
```

The desktop app window will open automatically once the dev server is ready.

### Testing the features

**Live Preview**
1. In the sidebar, create a project and add a session linked to any local web project folder (React, Vue, Next.js, Django, etc.)
2. Click the **Live Preview** tab — DevFlow will auto-detect the project type and start command
3. Hit **Start Server** and the embedded browser will connect automatically when the server is ready

**API Tester**
1. Select any session and click the **API Tester** tab
2. Enter a method and URL (e.g. `GET https://jsonplaceholder.typicode.com/posts/1`) and hit **Send**
3. Use **Save** to store the request — it will persist and reload with the session

---

## How sessions work

1. **Create a project** — a named group (e.g. "Restaurant App")
2. **Add a session** — link it to a folder on your machine (e.g. `~/projects/restaurant-frontend`)
3. DevFlow scans the folder, detects the project type, and configures the workspace automatically
4. Everything you do in that session — server config, API requests, database connections — is saved and restored next time you open it

---

## Roadmap

- [x] Project & session management with persistence
- [x] Multi-language project type detection
- [x] Live preview with embedded browser
- [x] API tester with saved request collections
- [ ] Checkpoint system (git-backed snapshots)
- [ ] File change tracker with diff view
- [ ] Database manager
- [ ] Docker manager
- [ ] Environment variable editor per session
- [ ] Packaged installers (Windows / macOS / Linux)
