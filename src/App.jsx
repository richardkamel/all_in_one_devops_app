import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Workspace from './components/Workspace'
import FirstLaunch from './components/FirstLaunch'
import './App.css'

export default function App() {
  const [activeSession, setActiveSession] = useState(null)
  const [settings, setSettings] = useState(undefined) // undefined = still loading

  useEffect(() => {
    window.electron.loadSettings().then(saved => {
      setSettings(saved) // null = first launch, object = already configured
    })
  }, [])

  if (settings === undefined) return null // loading, render nothing briefly

  if (settings === null) {
    return <FirstLaunch onComplete={s => setSettings(s)} />
  }

  return (
    <div className="app">
      <Sidebar
        activeSession={activeSession}
        onSelectSession={setActiveSession}
      />
      <Workspace session={activeSession} />
    </div>
  )
}
