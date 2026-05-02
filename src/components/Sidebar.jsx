import { useState, useEffect, useRef } from 'react'
import DbPickerModal from './DbPickerModal'
import './Sidebar.css'

export default function Sidebar({ activeSession, onSelectSession }) {
  const [projects, setProjects] = useState([])
  const [expandedProjects, setExpandedProjects] = useState({})
  const [newProjectInput, setNewProjectInput] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newSessionInput, setNewSessionInput] = useState(null) // projectId or null
  const [newSessionName, setNewSessionName] = useState('')
  const [pendingSession, setPendingSession] = useState(null) // { projectId, name, folder }
  const projectInputRef = useRef(null)
  const sessionInputRef = useRef(null)

  useEffect(() => {
    window.electron.loadData().then(data => {
      if (data?.projects) {
        setProjects(data.projects)
        const expanded = {}
        data.projects.forEach(p => { expanded[p.id] = true })
        setExpandedProjects(expanded)
      }
    })
  }, [])

  useEffect(() => {
    if (projects.length === 0) return
    window.electron.saveData({ projects })
  }, [projects])

  useEffect(() => {
    if (newProjectInput) projectInputRef.current?.focus()
  }, [newProjectInput])

  useEffect(() => {
    if (newSessionInput) sessionInputRef.current?.focus()
  }, [newSessionInput])

  function toggleProject(projectId) {
    setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }))
  }

  function confirmNewProject() {
    if (!newProjectName.trim()) { cancelNewProject(); return }
    const newProject = { id: Date.now(), name: newProjectName.trim(), sessions: [] }
    setProjects(prev => [...prev, newProject])
    setExpandedProjects(prev => ({ ...prev, [newProject.id]: true }))
    cancelNewProject()
  }

  function cancelNewProject() {
    setNewProjectInput(false)
    setNewProjectName('')
  }

  async function confirmNewSession(projectId) {
    if (!newSessionName.trim()) { cancelNewSession(); return }
    const name = newSessionName.trim()
    cancelNewSession()
    const folder = await window.electron.pickFolder()
    if (!folder) return
    setPendingSession({ projectId, name, folder })
  }

  function cancelNewSession() {
    setNewSessionInput(null)
    setNewSessionName('')
  }

  function finishSessionCreation(database) {
    const { projectId, name, folder } = pendingSession
    setPendingSession(null)
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? { ...p, sessions: [...p.sessions, { id: Date.now(), name, folder, database }] }
          : p
      )
    )
  }

  function deleteProject(projectId) {
    setProjects(prev => prev.filter(p => p.id !== projectId))
    onSelectSession(null)
  }

  function deleteSession(projectId, sessionId, session) {
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? { ...p, sessions: p.sessions.filter(s => s.id !== sessionId) }
          : p
      )
    )
    if (activeSession?.id === sessionId) onSelectSession(null)
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">DevOps App</span>
      </div>

      <div className="sidebar-section-label">Projects</div>

      <div className="sidebar-projects">
        {projects.length === 0 && !newProjectInput && (
          <div className="sidebar-hint">No projects yet. Create one below.</div>
        )}

        {projects.map(project => (
          <div key={project.id} className="project-group">
            <div className="project-row" onClick={() => toggleProject(project.id)}>
              <span className={`chevron ${expandedProjects[project.id] ? 'open' : ''}`}>›</span>
              <span className="project-name">{project.name}</span>
              <div className="project-actions">
                <button
                  className="action-btn"
                  title="New session"
                  onClick={e => { e.stopPropagation(); setNewSessionInput(project.id); setExpandedProjects(prev => ({ ...prev, [project.id]: true })) }}
                >+</button>
                <button
                  className="action-btn danger"
                  title="Delete project"
                  onClick={e => { e.stopPropagation(); deleteProject(project.id) }}
                >×</button>
              </div>
            </div>

            {expandedProjects[project.id] && (
              <div className="sessions-list">
                {project.sessions.map(session => (
                  <div
                    key={session.id}
                    className={`session-row ${activeSession?.id === session.id ? 'active' : ''}`}
                    onClick={() => onSelectSession(session)}
                  >
                    <span className="session-icon">▸</span>
                    <span className="session-name">{session.name}</span>
                    <button
                      className="action-btn danger session-delete"
                      title="Delete session"
                      onClick={e => { e.stopPropagation(); deleteSession(project.id, session.id, session) }}
                    >×</button>
                  </div>
                ))}

                {newSessionInput === project.id && (
                  <div className="inline-input-row">
                    <input
                      ref={sessionInputRef}
                      className="inline-input"
                      placeholder="Session name..."
                      value={newSessionName}
                      onChange={e => setNewSessionName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') confirmNewSession(project.id)
                        if (e.key === 'Escape') cancelNewSession()
                      }}
                    />
                    <button className="inline-confirm" onClick={() => confirmNewSession(project.id)}>→</button>
                  </div>
                )}

                {project.sessions.length === 0 && newSessionInput !== project.id && (
                  <div className="sessions-empty">No sessions yet</div>
                )}
              </div>
            )}
          </div>
        ))}

        {newProjectInput && (
          <div className="inline-input-row project-input-row">
            <input
              ref={projectInputRef}
              className="inline-input"
              placeholder="Project name..."
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') confirmNewProject()
                if (e.key === 'Escape') cancelNewProject()
              }}
            />
            <button className="inline-confirm" onClick={confirmNewProject}>→</button>
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <button className="new-project-btn" onClick={() => setNewProjectInput(true)}>
          + New Project
        </button>
      </div>

      {pendingSession && (
        <DbPickerModal
          sessionName={pendingSession.name}
          onConfirm={finishSessionCreation}
        />
      )}
    </div>
  )
}
