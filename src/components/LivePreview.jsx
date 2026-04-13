import { useState, useEffect, useRef, useCallback } from 'react'
import './LivePreview.css'

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').replace(/\x1b\][^\x07]*\x07/g, '')
}

// Extract localhost URL from any framework's log output
function extractUrl(line) {
  const patterns = [
    // Generic: http://localhost:PORT or http://127.0.0.1:PORT
    /https?:\/\/(localhost|127\.0\.0\.1):(\d+)/i,
    // Rails / Sinatra: Listening on http://[::]:3000
    /listening on.*?:(\d+)/i,
    // Go: listening on :8080
    /listening.*?:(\d+)/i,
    // Generic port mention: "port 8000" or "on port 8000"
    /(?:on\s+)?port[:\s]+(\d{4,5})/i,
  ]

  for (const p of patterns) {
    const match = line.match(p)
    if (match) {
      // If we got a full URL, return it
      if (match[0].startsWith('http')) return match[0]
      // If we only got a port, build the URL
      const port = match[1] || match[2]
      if (port) return `http://localhost:${port}`
    }
  }
  return null
}

const READY_PATTERNS = [
  /ready in/i,
  /server running/i,
  /local:/i,
  /listening/i,
  /started.*server/i,
  /development server/i,
  /application server/i,
  /running on/i,
  /started on/i,
  /serving at/i,
  /vite.*ready/i,
]

export default function LivePreview({ session }) {
  const [url, setUrl] = useState('')
  const [inputUrl, setInputUrl] = useState('')
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverStatus, setServerStatus] = useState('idle')
  const [logs, setLogs] = useState([])
  const [showLogs, setShowLogs] = useState(false)
  const [logHeight, setLogHeight] = useState(140)
  const [startCommand, setStartCommand] = useState(null)
  const [needsCustomCommand, setNeedsCustomCommand] = useState(false)
  const [customCommandInput, setCustomCommandInput] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [overrideCommand, setOverrideCommand] = useState('')
  const webviewRef = useRef(null)
  const logsEndRef = useRef(null)

  useEffect(() => {
    if (!session?.folder) return
    setConnected(false)
    setUrl('')
    setLogs([])
    setServerStatus('idle')
    setNeedsCustomCommand(false)
    setStartCommand(null)

    // Detect URL and start command in parallel
    window.electron.detectDevServer(session.folder).then(detected => {
      setInputUrl(detected || 'http://localhost:3000')
    })

    window.electron.getStartCommand(session.id, session.folder).then(result => {
      if (result.known) {
        setStartCommand(result.command)
        setIsCustom(result.custom || false)
        setNeedsCustomCommand(false)
      } else {
        setNeedsCustomCommand(true)
        setStartCommand(null)
      }
    })

    window.electron.onServerLog(({ sessionId, text }) => {
      if (sessionId !== session.id) return
      const clean = stripAnsi(text)
      setLogs(prev => [...prev, clean])

      const detectedUrl = extractUrl(clean)
      if (detectedUrl) setInputUrl(detectedUrl)

      const isReady = READY_PATTERNS.some(p => p.test(clean))
      if (isReady) setServerStatus('running')
    })

    window.electron.onServerStopped(({ sessionId }) => {
      if (sessionId !== session.id) return
      setServerStatus('idle')
      setConnected(false)
    })

    return () => window.electron.removeServerListeners()
  }, [session?.id])

  useEffect(() => {
    if (serverStatus === 'running' && inputUrl && !connected) {
      connect(inputUrl)
    }
  }, [serverStatus, inputUrl])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  useEffect(() => {
    const wv = webviewRef.current
    if (!wv || !connected) return
    const onStart = () => setLoading(true)
    const onStop = () => setLoading(false)
    wv.addEventListener('did-start-loading', onStart)
    wv.addEventListener('did-stop-loading', onStop)
    return () => {
      wv.removeEventListener('did-start-loading', onStart)
      wv.removeEventListener('did-stop-loading', onStop)
    }
  }, [connected])

  const onDragStart = useCallback((e) => {
    e.preventDefault()
    const startY = e.clientY
    const startH = logHeight
    function onMove(e) { setLogHeight(Math.max(60, Math.min(500, startH + (e.clientY - startY)))) }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [logHeight])

  async function saveCustomCommand() {
    const cmd = customCommandInput.trim()
    if (!cmd) return
    await window.electron.saveCommand(session.id, cmd)
    setStartCommand(cmd)
    setNeedsCustomCommand(false)
    setIsCustom(true)
  }

  async function startServer() {
    const cmd = overrideCommand.trim() || startCommand
    if (!cmd) return
    setServerStatus('starting')
    setLogs([])
    setShowLogs(true)
    const result = await window.electron.startServer(session.id, session.folder, cmd)
    if (!result.ok) setServerStatus('idle')
  }

  async function stopServer() {
    await window.electron.stopServer(session.id)
    setServerStatus('idle')
    setConnected(false)
  }

  async function reloadServer() {
    await window.electron.stopServer(session.id)
    setConnected(false)
    setLogs([])
    setTimeout(() => startServer(), 300)
  }

  function connect(targetUrl) {
    const finalUrl = targetUrl || inputUrl
    if (!finalUrl.trim()) return
    const normalized = finalUrl.startsWith('http') ? finalUrl : `http://${finalUrl}`
    setUrl(normalized)
    setInputUrl(normalized)
    setConnected(true)
    setLoading(true)
  }

  function refresh() { webviewRef.current?.reload() }
  function goBack() { if (webviewRef.current?.canGoBack()) webviewRef.current.goBack() }
  function goForward() { if (webviewRef.current?.canGoForward()) webviewRef.current.goForward() }

  return (
    <div className="live-preview">
      <div className="preview-toolbar">
        <button className="nav-btn" onClick={goBack} title="Back">‹</button>
        <button className="nav-btn" onClick={goForward} title="Forward">›</button>
        <button className="nav-btn" onClick={refresh} title="Refresh">↻</button>

        <div className="url-bar-wrapper">
          {loading && <span className="url-spinner" />}
          <input
            className="url-bar"
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && connect()}
            placeholder="http://localhost:3000"
            spellCheck={false}
          />
        </div>

        {serverStatus === 'idle' && startCommand && (
          <button className="server-btn start" onClick={startServer}>▶ Start Server</button>
        )}
        {serverStatus === 'starting' && (
          <button className="server-btn starting" disabled>
            <span className="btn-spinner" /> Starting...
          </button>
        )}
        {serverStatus === 'running' && (
          <>
            <button className="server-btn reload" onClick={reloadServer}>↺ Reload</button>
            <button className="server-btn stop" onClick={stopServer}>■ Terminate</button>
          </>
        )}

        {isCustom && serverStatus === 'idle' && (
          <button
            className="custom-cmd-badge"
            title={`Custom command: ${startCommand}`}
            onClick={() => { setNeedsCustomCommand(true); setCustomCommandInput(startCommand || '') }}
          >
            custom
          </button>
        )}

        <button
          className={`logs-btn ${showLogs ? 'active' : ''}`}
          onClick={() => setShowLogs(p => !p)}
          title="Toggle server logs"
        >
          Logs {logs.length > 0 && <span className="log-count">{logs.length}</span>}
        </button>
      </div>

      {showLogs && (
        <>
          <div className="server-logs" style={{ height: logHeight }}>
            {logs.length === 0
              ? <span className="log-empty">No output yet...</span>
              : logs.map((line, i) => <span key={i} className="log-line">{line}</span>)
            }
            <div ref={logsEndRef} />
          </div>
          <div className="log-resize-handle" onMouseDown={onDragStart} title="Drag to resize" />
        </>
      )}

      {!connected ? (
        <div className="preview-connect-state">
          <div className="connect-card">
            <h3>Live Preview</h3>

            {needsCustomCommand ? (
              <>
                <p>Could not detect a start command for this project.<br />Enter it manually — it will be saved for this session.</p>
                <div className="connect-row">
                  <input
                    className="connect-input"
                    value={customCommandInput}
                    onChange={e => setCustomCommandInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveCustomCommand()}
                    placeholder="e.g. python manage.py runserver"
                    spellCheck={false}
                    autoFocus
                  />
                  <button className="connect-btn-sm" onClick={saveCustomCommand}>Save</button>
                </div>
                <span className="connect-hint">Examples: <code>flask run</code> · <code>rails server</code> · <code>go run .</code> · <code>cargo run</code></span>
              </>
            ) : (
              <>
                {serverStatus === 'idle' && startCommand && (
                  <>
                    <p>Start your dev server, then the preview will connect automatically.</p>
                    <div className="command-preview">{overrideCommand.trim() || startCommand}</div>
                    <button className="connect-btn-lg" onClick={startServer}>▶ Start Server</button>
                    <div className="override-section">
                      <div className="override-label">or use a specific command</div>
                      <input
                        className="connect-input override-input"
                        value={overrideCommand}
                        onChange={e => setOverrideCommand(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && startServer()}
                        placeholder={`Leave empty to use: ${startCommand}`}
                        spellCheck={false}
                      />
                      <span className="override-hint">
                        If left empty or invalid, falls back to the auto-detected command above.
                        Useful for debug flags, custom ports, or alternative run modes.
                      </span>
                    </div>
                    <div className="connect-divider">or connect manually</div>
                    <div className="connect-row">
                      <input
                        className="connect-input"
                        value={inputUrl}
                        onChange={e => setInputUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && connect()}
                        placeholder="http://localhost:3000"
                        spellCheck={false}
                      />
                      <button className="connect-btn-sm" onClick={() => connect()}>Connect</button>
                    </div>
                    <span className="connect-hint">URL auto-detected from your project files.</span>
                  </>
                )}
                {serverStatus === 'starting' && (
                  <p className="status-text"><span className="btn-spinner dark" /> Starting server...</p>
                )}
                {serverStatus === 'running' && (
                  <p className="status-text">Server is running. Connecting...</p>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <webview ref={webviewRef} src={url} className="preview-webview" />
      )}
    </div>
  )
}
