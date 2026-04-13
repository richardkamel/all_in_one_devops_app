import { useState, useEffect } from 'react'
import LivePreview from './LivePreview'
import ApiTester from './ApiTester'
import './Workspace.css'

const TABS = [
  {
    id: 'preview',
    label: 'Live Preview',
    isEnabled: (info) => info.hasFrontend,
    disabledReason: 'No frontend files detected in this folder',
  },
  {
    id: 'api',
    label: 'API Tester',
    isEnabled: () => true,
  },
  {
    id: 'database',
    label: 'Database',
    isEnabled: () => true,
  },
  {
    id: 'docker',
    label: 'Docker',
    isEnabled: () => true,
  },
  {
    id: 'files',
    label: 'File Tracker',
    isEnabled: () => true,
  },
]

const PROJECT_TYPE_LABELS = {
  frontend: 'Frontend',
  fullstack: 'Full Stack',
  backend: 'Backend',
  ml: 'Python / ML',
  django: 'Django',
  flask: 'Flask',
  fastapi: 'FastAPI',
  rails: 'Ruby on Rails',
  sinatra: 'Sinatra',
  php: 'PHP',
  go: 'Go',
  rust: 'Rust',
  java: 'Java',
  unknown: 'Unknown',
}

export default function Workspace({ session }) {
  const [activeTab, setActiveTab] = useState('files')
  const [projectInfo, setProjectInfo] = useState(null)
  const [detecting, setDetecting] = useState(false)

  useEffect(() => {
    if (!session?.folder) { setProjectInfo(null); return }
    setDetecting(true)
    window.electron.detectProject(session.folder).then(info => {
      setProjectInfo(info)
      setDetecting(false)
      // Auto-select first enabled tab
      const firstEnabled = TABS.find(t => t.isEnabled(info))
      if (firstEnabled) setActiveTab(firstEnabled.id)
    })
  }, [session?.id])

  if (!session) {
    return (
      <div className="workspace workspace-empty">
        <div className="empty-state">
          <div className="empty-icon">⬡</div>
          <h2>No session selected</h2>
          <p>Select a session from the sidebar to start working</p>
        </div>
      </div>
    )
  }

  return (
    <div className="workspace">
      <div className="workspace-header">
        <div className="session-title">
          <span className="session-title-name">{session.name}</span>
          {session.folder && (
            <span className="session-title-folder">{session.folder}</span>
          )}
        </div>
        <div className="session-meta">
          {detecting && <span className="detecting-badge">Scanning...</span>}
          {!detecting && projectInfo && (
            <span className="project-type-badge">
              {PROJECT_TYPE_LABELS[projectInfo.projectType] ?? 'Unknown'}
            </span>
          )}
          {!detecting && projectInfo?.hasDocker && (
            <span className="docker-badge">Docker</span>
          )}
        </div>
      </div>

      <div className="tab-bar">
        {TABS.map(tab => {
          const enabled = projectInfo ? tab.isEnabled(projectInfo) : true
          const isActive = activeTab === tab.id
          return (
            <div key={tab.id} className="tab-wrapper" title={!enabled ? tab.disabledReason : ''}>
              <button
                className={`tab ${isActive ? 'active' : ''} ${!enabled ? 'disabled' : ''}`}
                onClick={() => enabled && setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            </div>
          )
        })}
      </div>

      <div className="tab-content">
        {activeTab === 'preview' && <LivePreview session={session} />}
        {activeTab === 'api' && <ApiTester session={session} />}
        {activeTab === 'database' && <PlaceholderPanel title="Database Manager" description="Browse and manage your databases here" />}
        {activeTab === 'docker' && <PlaceholderPanel title="Docker Manager" description="Manage containers for this session here" />}
        {activeTab === 'files' && <PlaceholderPanel title="File Tracker" description="Track and toggle file changes here" />}
      </div>
    </div>
  )
}

function PlaceholderPanel({ title, description }) {
  return (
    <div className="placeholder-panel">
      <div className="placeholder-content">
        <h3>{title}</h3>
        <p>{description}</p>
        <span className="placeholder-badge">Coming soon</span>
      </div>
    </div>
  )
}
