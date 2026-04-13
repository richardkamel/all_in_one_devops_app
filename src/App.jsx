import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Workspace from './components/Workspace'
import './App.css'

export default function App() {
  const [activeSession, setActiveSession] = useState(null)

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
