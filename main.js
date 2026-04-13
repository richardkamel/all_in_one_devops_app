import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { spawn } from 'child_process'

const servers = new Map()
const __dirname = dirname(fileURLToPath(import.meta.url))

function getDataPath() {
  return join(app.getPath('userData'), 'devops-app-data.json')
}

function readDataFile() {
  const path = getDataPath()
  if (!existsSync(path)) return {}
  try { return JSON.parse(readFileSync(path, 'utf-8')) } catch { return {} }
}

function writeDataFile(data) {
  writeFileSync(getDataPath(), JSON.stringify(data, null, 2), 'utf-8')
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      preload: join(__dirname, 'preload.cjs'),
    }
  })
  win.loadURL('http://localhost:5999')
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

// ─── Data persistence ────────────────────────────────────────────────────────

ipcMain.handle('pick-folder', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const result = await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

ipcMain.handle('save-data', (_event, data) => {
  const existing = readDataFile()
  writeDataFile({ ...existing, ...data })
})

ipcMain.handle('load-data', () => readDataFile())

ipcMain.handle('save-command', (_event, { sessionId, command }) => {
  const data = readDataFile()
  data.commands = { ...data.commands, [sessionId]: command }
  writeDataFile(data)
})

ipcMain.handle('load-command', (_event, sessionId) => {
  const data = readDataFile()
  return data.commands?.[sessionId] || null
})

// ─── Project detection ───────────────────────────────────────────────────────

function getFiles(folder) {
  try { return readdirSync(folder) } catch { return [] }
}

function getPackageJson(folder) {
  try { return JSON.parse(readFileSync(join(folder, 'package.json'), 'utf-8')) } catch { return null }
}

function getRequirements(folder) {
  try { return readFileSync(join(folder, 'requirements.txt'), 'utf-8').toLowerCase() } catch { return '' }
}

function getGemfile(folder) {
  try { return readFileSync(join(folder, 'Gemfile'), 'utf-8').toLowerCase() } catch { return '' }
}

// Detect package manager from lockfiles
function detectPackageManager(files) {
  if (files.includes('bun.lockb')) return 'bun'
  if (files.includes('pnpm-lock.yaml')) return 'pnpm'
  if (files.includes('yarn.lock')) return 'yarn'
  return 'npm'
}

// Build the run command for a given package manager and script name
function pmRunCmd(pm, script) {
  if (pm === 'npm') return `npm run ${script}`
  if (pm === 'yarn') return `yarn ${script}`
  if (pm === 'pnpm') return `pnpm ${script}`
  if (pm === 'bun') return `bun run ${script}`
  return `npm run ${script}`
}

ipcMain.handle('detect-project', (_event, folder) => {
  if (!folder || !existsSync(folder)) return { hasFrontend: false, hasDocker: false, projectType: 'unknown' }

  const files = getFiles(folder)
  const has = (name) => files.includes(name)
  const hasExt = (...exts) => files.some(f => exts.some(e => f.endsWith(e)))

  const hasDocker = has('Dockerfile') || has('docker-compose.yml') || has('docker-compose.yaml')

  // JS/TS frontend
  let hasFrontendDeps = false
  let hasBackendDeps = false
  const pkg = getPackageJson(folder)
  if (pkg) {
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    hasFrontendDeps = ['react', 'vue', 'svelte', 'next', 'nuxt', 'vite', '@angular/core', 'solid-js', 'astro', 'remix'].some(l => deps.includes(l))
    hasBackendDeps = ['express', 'fastify', 'koa', 'hapi', '@nestjs/core', 'hono'].some(l => deps.includes(l))
  }

  const hasFrontendFiles = has('index.html') || hasExt('.jsx', '.tsx', '.vue', '.svelte')

  // Python
  const reqs = getRequirements(folder)
  const hasDjango = has('manage.py') || reqs.includes('django')
  const hasFlask = reqs.includes('flask')
  const hasFastApi = reqs.includes('fastapi') || reqs.includes('uvicorn')
  const hasPython = has('requirements.txt') || has('pyproject.toml') || hasExt('.py')

  // Ruby
  const gemfile = getGemfile(folder)
  const hasRails = gemfile.includes('rails')
  const hasSinatra = gemfile.includes('sinatra')

  // PHP
  const hasPhp = has('artisan') || has('index.php') || hasExt('.php')

  // Other
  const hasGo = has('go.mod') || hasExt('.go')
  const hasRust = has('Cargo.toml')
  const hasJava = hasExt('.java') || has('pom.xml') || has('build.gradle')

  const hasFrontend = hasFrontendFiles || hasFrontendDeps || hasDjango || hasFlask || hasFastApi || hasRails || hasSinatra || hasPhp

  let projectType = 'unknown'
  if (hasFrontend && hasBackendDeps) projectType = 'fullstack'
  else if (hasFrontendDeps || hasFrontendFiles) projectType = 'frontend'
  else if (hasDjango) projectType = 'django'
  else if (hasFlask) projectType = 'flask'
  else if (hasFastApi) projectType = 'fastapi'
  else if (hasRails) projectType = 'rails'
  else if (hasSinatra) projectType = 'sinatra'
  else if (hasPhp) projectType = 'php'
  else if (hasPython) projectType = 'ml'
  else if (hasGo) projectType = 'go'
  else if (hasRust) projectType = 'rust'
  else if (hasJava) projectType = 'java'
  else if (hasBackendDeps) projectType = 'backend'

  return { hasFrontend, hasDocker, projectType }
})

ipcMain.handle('detect-dev-server', (_event, folder) => {
  if (!folder || !existsSync(folder)) return 'http://localhost:3000'
  const files = getFiles(folder)
  const has = (name) => files.includes(name)

  const pkg = getPackageJson(folder)
  if (pkg) {
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    if (deps.includes('next')) return 'http://localhost:3000'
    if (deps.includes('vite') || deps.includes('@vitejs/plugin-react') || deps.includes('vue')) return 'http://localhost:5173'
    if (deps.includes('@vue/cli-service')) return 'http://localhost:8080'
    if (deps.includes('react-scripts')) return 'http://localhost:3000'
    if (deps.includes('@angular/core')) return 'http://localhost:4200'
    if (deps.includes('astro')) return 'http://localhost:4321'
    if (deps.includes('@remix-run/dev')) return 'http://localhost:3000'
  }

  const reqs = getRequirements(folder)
  if (has('manage.py') || reqs.includes('django')) return 'http://localhost:8000'
  if (reqs.includes('flask')) return 'http://localhost:5000'
  if (reqs.includes('fastapi') || reqs.includes('uvicorn')) return 'http://localhost:8000'

  const gemfile = getGemfile(folder)
  if (gemfile.includes('rails') || gemfile.includes('sinatra')) return 'http://localhost:3000'

  if (has('artisan')) return 'http://localhost:8000'
  if (has('index.php')) return 'http://localhost:8000'
  if (has('go.mod')) return 'http://localhost:8080'
  if (has('Cargo.toml')) return 'http://localhost:8080'

  return 'http://localhost:3000'
})

// Detect start command — returns { command, known }
function detectStartCommand(folder, files) {
  const has = (name) => files.includes(name)
  const hasExt = (...exts) => files.some(f => exts.some(e => f.endsWith(e)))

  // Node / JS — check package manager first
  if (has('package.json')) {
    const pkg = getPackageJson(folder)
    if (pkg?.scripts) {
      const pm = detectPackageManager(files)
      for (const name of ['dev', 'start', 'serve', 'develop']) {
        if (pkg.scripts[name]) return { command: pmRunCmd(pm, name), known: true }
      }
    }
  }

  // Python
  if (has('manage.py')) return { command: 'python manage.py runserver', known: true }
  if (has('requirements.txt') || has('pyproject.toml')) {
    const reqs = getRequirements(folder)
    if (reqs.includes('django')) return { command: 'python manage.py runserver', known: true }
    if (reqs.includes('fastapi') || reqs.includes('uvicorn')) return { command: 'uvicorn main:app --reload', known: true }
    if (reqs.includes('flask')) return { command: 'flask run', known: true }
  }
  if (has('app.py')) return { command: 'flask run', known: true }
  if (has('main.py') && hasExt('.py')) return { command: 'python main.py', known: true }

  // Ruby
  const gemfile = getGemfile(folder)
  if (gemfile.includes('rails')) return { command: 'rails server', known: true }
  if (gemfile.includes('sinatra')) return { command: 'ruby app.rb', known: true }

  // PHP
  if (has('artisan')) return { command: 'php artisan serve', known: true }
  if (has('index.php')) return { command: 'php -S localhost:8000', known: true }

  // Go
  if (has('go.mod')) return { command: 'go run .', known: true }

  // Rust
  if (has('Cargo.toml')) return { command: 'cargo run', known: true }

  // Java
  if (has('pom.xml')) return { command: 'mvn spring-boot:run', known: true }
  if (has('build.gradle')) return { command: './gradlew bootRun', known: true }

  return { command: null, known: false }
}

ipcMain.handle('get-start-command', (_event, { sessionId, folder }) => {
  // Saved custom command takes priority
  const data = readDataFile()
  if (data.commands?.[sessionId]) {
    return { command: data.commands[sessionId], known: true, custom: true }
  }
  if (!folder || !existsSync(folder)) return { command: null, known: false }
  const files = getFiles(folder)
  return detectStartCommand(folder, files)
})

// ─── Server management ───────────────────────────────────────────────────────

function killProcess(child) {
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', child.pid, '/T', '/F'], { shell: true })
  } else {
    child.kill('SIGTERM')
  }
}

ipcMain.handle('start-server', (event, { sessionId, folder, command }) => {
  if (servers.has(sessionId)) return { ok: false, reason: 'Already running' }

  const [cmd, ...args] = command.split(' ')
  const child = spawn(cmd, args, {
    cwd: folder,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '0' },
  })

  servers.set(sessionId, child)
  const sender = event.sender

  child.stdout.on('data', (data) => sender.send('server-log', { sessionId, text: data.toString() }))
  child.stderr.on('data', (data) => sender.send('server-log', { sessionId, text: data.toString() }))
  child.on('exit', () => {
    servers.delete(sessionId)
    sender.send('server-stopped', { sessionId })
  })

  return { ok: true, command }
})

ipcMain.handle('stop-server', (_event, { sessionId }) => {
  const child = servers.get(sessionId)
  if (!child) return { ok: false }
  killProcess(child)
  servers.delete(sessionId)
  return { ok: true }
})

app.on('before-quit', () => servers.forEach(child => killProcess(child)))

// ─── API Tester ──────────────────────────────────────────────────────────────

ipcMain.handle('send-request', async (_event, { method, url, headers, body }) => {
  const start = Date.now()
  try {
    const options = { method, headers: headers || {} }
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      options.body = body
    }
    const res = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) })
    const duration = Date.now() - start
    const responseHeaders = {}
    res.headers.forEach((value, key) => { responseHeaders[key] = value })
    const text = await res.text()
    return { ok: true, status: res.status, statusText: res.statusText, headers: responseHeaders, body: text, duration }
  } catch (err) {
    return { ok: false, error: err.message, duration: Date.now() - start }
  }
})

ipcMain.handle('save-requests', (_event, { sessionId, requests }) => {
  const data = readDataFile()
  data.requests = { ...data.requests, [sessionId]: requests }
  writeDataFile(data)
})

ipcMain.handle('load-requests', (_event, sessionId) => {
  const data = readDataFile()
  return data.requests?.[sessionId] || []
})
