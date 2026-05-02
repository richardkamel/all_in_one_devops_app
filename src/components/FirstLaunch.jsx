import { useState, useEffect } from 'react'
import './FirstLaunch.css'

const PM_OPTIONS = ['npm', 'yarn', 'pnpm', 'bun']
const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
]

export default function FirstLaunch({ onComplete }) {
  const [packageManager, setPackageManager] = useState('npm')
  const [autoCheckpoint, setAutoCheckpoint] = useState(false)
  const [checkpointInterval, setCheckpointInterval] = useState(30)
  const [gitName, setGitName] = useState('')
  const [gitEmail, setGitEmail] = useState('')
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    window.electron.getGitConfig().then(({ name, email }) => {
      if (name) setGitName(name)
      if (email) setGitEmail(email)
    })
  }, [])

  function handleSave() {
    const settings = {
      packageManager,
      autoCheckpoint,
      checkpointInterval: Math.max(1, Number(checkpointInterval) || 30),
      gitName: gitName.trim(),
      gitEmail: gitEmail.trim(),
      theme,
    }
    window.electron.saveSettings(settings).then(() => onComplete(settings))
  }

  function handleSkip() {
    const defaults = {
      packageManager: 'npm',
      autoCheckpoint: false,
      checkpointInterval: 30,
      gitName: gitName.trim(),
      gitEmail: gitEmail.trim(),
      theme: 'dark',
    }
    window.electron.saveSettings(defaults).then(() => onComplete(defaults))
  }

  return (
    <div className="fl-backdrop">
      <div className="fl-card">

        <div className="fl-header">
          <div className="fl-logo">⚙</div>
          <h1 className="fl-title">Welcome to DevOS</h1>
          <p className="fl-subtitle">
            Configure a few defaults before you start. You can always change these later in Settings.
          </p>
        </div>

        <div className="fl-sections">

          {/* Package manager */}
          <div className="fl-section">
            <div className="fl-section-label">Fallback package manager</div>
            <div className="fl-section-hint">Used when no lockfile is detected in a project.</div>
            <div className="fl-radio-group">
              {PM_OPTIONS.map(pm => (
                <label key={pm} className={`fl-radio ${packageManager === pm ? 'fl-radio--active' : ''}`}>
                  <input
                    type="radio"
                    name="pm"
                    value={pm}
                    checked={packageManager === pm}
                    onChange={() => setPackageManager(pm)}
                  />
                  {pm}
                </label>
              ))}
            </div>
          </div>

          {/* Auto-checkpoint */}
          <div className="fl-section">
            <div className="fl-section-label">Auto-checkpoint</div>
            <div className="fl-section-hint">Automatically create a git snapshot on a recurring interval.</div>
            <div className="fl-checkpoint-row">
              <button
                className={`fl-toggle ${autoCheckpoint ? 'fl-toggle--on' : ''}`}
                onClick={() => setAutoCheckpoint(v => !v)}
                aria-pressed={autoCheckpoint}
              >
                <span className="fl-toggle-knob" />
              </button>
              <span className="fl-toggle-label">{autoCheckpoint ? 'Enabled' : 'Disabled'}</span>
              {autoCheckpoint && (
                <div className="fl-interval">
                  <span>every</span>
                  <input
                    className="fl-number-input"
                    type="number"
                    min="1"
                    max="1440"
                    value={checkpointInterval}
                    onChange={e => setCheckpointInterval(e.target.value)}
                  />
                  <span>min</span>
                </div>
              )}
            </div>
          </div>

          {/* Git identity */}
          <div className="fl-section">
            <div className="fl-section-label">Git identity</div>
            <div className="fl-section-hint">Used as the author on checkpoint commits.</div>
            <div className="fl-fields">
              <div className="fl-field">
                <label className="fl-field-label">Name</label>
                <input
                  className="fl-input"
                  type="text"
                  placeholder="Your Name"
                  value={gitName}
                  onChange={e => setGitName(e.target.value)}
                />
              </div>
              <div className="fl-field">
                <label className="fl-field-label">Email</label>
                <input
                  className="fl-input"
                  type="email"
                  placeholder="you@example.com"
                  value={gitEmail}
                  onChange={e => setGitEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Theme */}
          <div className="fl-section">
            <div className="fl-section-label">Interface theme</div>
            <div className="fl-section-hint">Light theme is not yet implemented — selecting it will be applied in a future update.</div>
            <div className="fl-radio-group">
              {THEME_OPTIONS.map(opt => (
                <label key={opt.value} className={`fl-radio ${theme === opt.value ? 'fl-radio--active' : ''}`}>
                  <input
                    type="radio"
                    name="theme"
                    value={opt.value}
                    checked={theme === opt.value}
                    onChange={() => setTheme(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

        </div>

        <div className="fl-actions">
          <button className="fl-btn-primary" onClick={handleSave}>
            Get Started
          </button>
          <button className="fl-btn-skip" onClick={handleSkip}>
            Skip, use defaults
          </button>
        </div>

      </div>
    </div>
  )
}
