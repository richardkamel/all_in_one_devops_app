import { useState, useEffect, useRef } from 'react'
import './ApiTester.css'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

function tryPrettyJson(text) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

function statusColor(code) {
  if (!code) return 'status-none'
  if (code < 300) return 'status-2xx'
  if (code < 400) return 'status-3xx'
  if (code < 500) return 'status-4xx'
  return 'status-5xx'
}

function newHeader() {
  return { id: Date.now() + Math.random(), key: '', value: '', enabled: true }
}

export default function ApiTester({ session }) {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('')
  const [reqTab, setReqTab] = useState('headers')
  const [headers, setHeaders] = useState([newHeader()])
  const [bodyContent, setBodyContent] = useState('')
  const [bodyType, setBodyType] = useState('none')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resTab, setResTab] = useState('body')
  const [savedRequests, setSavedRequests] = useState([])
  const [savingName, setSavingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [activeRequestId, setActiveRequestId] = useState(null)
  const [error, setError] = useState(null)
  const nameInputRef = useRef(null)

  // Load saved requests when session changes
  useEffect(() => {
    if (!session?.id) return
    setResponse(null)
    setError(null)
    window.electron.loadRequests(session.id).then(reqs => {
      setSavedRequests(reqs)
    })
    // Reset editor for new session
    setMethod('GET')
    setUrl('')
    setHeaders([newHeader()])
    setBodyContent('')
    setBodyType('none')
    setActiveRequestId(null)
  }, [session?.id])

  useEffect(() => {
    if (savingName) nameInputRef.current?.focus()
  }, [savingName])

  async function sendRequest() {
    if (!url.trim()) return
    setLoading(true)
    setResponse(null)
    setError(null)

    const activeHeaders = headers
      .filter(h => h.enabled && h.key.trim())
      .reduce((acc, h) => ({ ...acc, [h.key.trim()]: h.value }), {})

    if (bodyType === 'json' && bodyContent.trim()) {
      activeHeaders['Content-Type'] = 'application/json'
    }

    const result = await window.electron.sendRequest({
      method,
      url: url.trim(),
      headers: activeHeaders,
      body: bodyType !== 'none' ? bodyContent : undefined,
    })

    setLoading(false)
    if (result.ok) {
      setResponse(result)
      setResTab('body')
    } else {
      setError(result.error)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') sendRequest()
  }

  // Headers editor
  function updateHeader(id, field, value) {
    setHeaders(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h))
  }

  function addHeader() {
    setHeaders(prev => [...prev, newHeader()])
  }

  function removeHeader(id) {
    setHeaders(prev => prev.filter(h => h.id !== id))
  }

  // Saved requests
  function loadRequest(req) {
    setMethod(req.method)
    setUrl(req.url)
    setHeaders(req.headers?.length ? req.headers : [newHeader()])
    setBodyContent(req.body || '')
    setBodyType(req.bodyType || 'none')
    setActiveRequestId(req.id)
    setResponse(null)
    setError(null)
  }

  async function saveRequest() {
    const name = nameInput.trim()
    if (!name) return
    const req = {
      id: activeRequestId || (Date.now() + Math.random()).toString(),
      name,
      method,
      url,
      headers,
      body: bodyContent,
      bodyType,
    }
    const updated = activeRequestId
      ? savedRequests.map(r => r.id === activeRequestId ? req : r)
      : [...savedRequests, req]
    setSavedRequests(updated)
    setActiveRequestId(req.id)
    await window.electron.saveRequests(session.id, updated)
    setSavingName(false)
    setNameInput('')
  }

  async function deleteRequest(id) {
    const updated = savedRequests.filter(r => r.id !== id)
    setSavedRequests(updated)
    if (activeRequestId === id) setActiveRequestId(null)
    await window.electron.saveRequests(session.id, updated)
  }

  function startSave() {
    const active = savedRequests.find(r => r.id === activeRequestId)
    setNameInput(active?.name || '')
    setSavingName(true)
  }

  const prettyBody = response ? tryPrettyJson(response.body) : ''

  return (
    <div className="api-tester">

      {/* ── Left sidebar: saved requests ── */}
      <div className="api-sidebar">
        <div className="api-sidebar-header">
          <span className="api-sidebar-title">Requests</span>
          <button className="api-new-btn" onClick={() => {
            setMethod('GET'); setUrl(''); setHeaders([newHeader()])
            setBodyContent(''); setBodyType('none')
            setActiveRequestId(null); setResponse(null); setError(null)
          }}>+ New</button>
        </div>

        <div className="api-saved-list">
          {savedRequests.length === 0 && (
            <span className="api-empty-hint">No saved requests yet.<br />Send one and click Save.</span>
          )}
          {savedRequests.map(req => (
            <div
              key={req.id}
              className={`api-saved-item ${req.id === activeRequestId ? 'active' : ''}`}
              onClick={() => loadRequest(req)}
            >
              <span className={`saved-method saved-method-${req.method.toLowerCase()}`}>{req.method}</span>
              <span className="saved-name">{req.name}</span>
              <button className="saved-delete" onClick={e => { e.stopPropagation(); deleteRequest(req.id) }}>×</button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: editor + response ── */}
      <div className="api-main">

        {/* Request bar */}
        <div className="api-request-bar">
          <select className="api-method-select" value={method} onChange={e => setMethod(e.target.value)}>
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input
            className="api-url-input"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="http://localhost:3000/api/..."
            spellCheck={false}
          />
          <button className="api-send-btn" onClick={sendRequest} disabled={loading || !url.trim()}>
            {loading ? <span className="api-spinner" /> : 'Send'}
          </button>
          <button className="api-save-btn" onClick={startSave} title="Save request">
            {activeRequestId ? 'Update' : 'Save'}
          </button>
        </div>

        {/* Save name prompt */}
        {savingName && (
          <div className="api-save-row">
            <input
              ref={nameInputRef}
              className="api-save-input"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveRequest(); if (e.key === 'Escape') setSavingName(false) }}
              placeholder="Request name..."
            />
            <button className="api-save-confirm-btn" onClick={saveRequest}>Save</button>
            <button className="api-save-cancel-btn" onClick={() => setSavingName(false)}>Cancel</button>
          </div>
        )}

        {/* Request tabs: Headers / Body */}
        <div className="api-tab-bar">
          <button className={`api-tab ${reqTab === 'headers' ? 'active' : ''}`} onClick={() => setReqTab('headers')}>
            Headers
            {headers.filter(h => h.enabled && h.key.trim()).length > 0 && (
              <span className="api-tab-badge">{headers.filter(h => h.enabled && h.key.trim()).length}</span>
            )}
          </button>
          <button className={`api-tab ${reqTab === 'body' ? 'active' : ''}`} onClick={() => setReqTab('body')}>
            Body
            {bodyType !== 'none' && <span className="api-tab-badge api-tab-badge-active">•</span>}
          </button>
        </div>

        {/* Headers editor */}
        {reqTab === 'headers' && (
          <div className="api-headers-editor">
            <div className="api-headers-grid">
              {headers.map(h => (
                <div key={h.id} className="api-header-row">
                  <input
                    type="checkbox"
                    className="api-header-check"
                    checked={h.enabled}
                    onChange={e => updateHeader(h.id, 'enabled', e.target.checked)}
                  />
                  <input
                    className="api-header-key"
                    value={h.key}
                    onChange={e => updateHeader(h.id, 'key', e.target.value)}
                    placeholder="Header name"
                    spellCheck={false}
                  />
                  <input
                    className="api-header-value"
                    value={h.value}
                    onChange={e => updateHeader(h.id, 'value', e.target.value)}
                    placeholder="Value"
                    spellCheck={false}
                  />
                  <button className="api-header-remove" onClick={() => removeHeader(h.id)}>×</button>
                </div>
              ))}
            </div>
            <button className="api-add-header-btn" onClick={addHeader}>+ Add Header</button>
          </div>
        )}

        {/* Body editor */}
        {reqTab === 'body' && (
          <div className="api-body-editor">
            <div className="api-body-type-bar">
              {['none', 'json', 'raw'].map(t => (
                <button
                  key={t}
                  className={`api-body-type-btn ${bodyType === t ? 'active' : ''}`}
                  onClick={() => setBodyType(t)}
                >
                  {t === 'none' ? 'None' : t === 'json' ? 'JSON' : 'Raw'}
                </button>
              ))}
            </div>
            {bodyType !== 'none' && (
              <textarea
                className="api-body-textarea"
                value={bodyContent}
                onChange={e => setBodyContent(e.target.value)}
                placeholder={bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Request body...'}
                spellCheck={false}
              />
            )}
            {bodyType === 'none' && (
              <span className="api-body-none-hint">Select JSON or Raw to add a request body.</span>
            )}
          </div>
        )}

        {/* Response area */}
        <div className="api-response-section">
          <div className="api-response-header">
            <span className="api-response-label">Response</span>
            {response && (
              <div className="api-response-meta">
                <span className={`api-status-badge ${statusColor(response.status)}`}>
                  {response.status} {response.statusText}
                </span>
                <span className="api-duration">{response.duration}ms</span>
              </div>
            )}
            {error && <span className="api-error-badge">Error</span>}
          </div>

          {!response && !error && !loading && (
            <div className="api-response-empty">
              <span>Hit Send to see the response</span>
            </div>
          )}

          {loading && (
            <div className="api-response-empty">
              <span className="api-spinner-lg" />
              <span>Waiting for response...</span>
            </div>
          )}

          {error && (
            <div className="api-response-error">
              <span className="api-error-title">Request Failed</span>
              <span className="api-error-message">{error}</span>
            </div>
          )}

          {response && (
            <>
              <div className="api-tab-bar api-res-tab-bar">
                <button className={`api-tab ${resTab === 'body' ? 'active' : ''}`} onClick={() => setResTab('body')}>Body</button>
                <button className={`api-tab ${resTab === 'headers' ? 'active' : ''}`} onClick={() => setResTab('headers')}>
                  Headers
                  <span className="api-tab-badge">{Object.keys(response.headers).length}</span>
                </button>
              </div>

              {resTab === 'body' && (
                <pre className="api-response-body">{prettyBody || <span className="api-empty-body">Empty response body</span>}</pre>
              )}

              {resTab === 'headers' && (
                <div className="api-response-headers">
                  {Object.entries(response.headers).map(([k, v]) => (
                    <div key={k} className="api-res-header-row">
                      <span className="api-res-header-key">{k}</span>
                      <span className="api-res-header-value">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  )
}
