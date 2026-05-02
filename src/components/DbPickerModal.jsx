import { useState } from 'react'
import './DbPickerModal.css'

const DB_OPTIONS = [
  { value: 'none',       label: 'None',       abbr: '—'   },
  { value: 'postgresql', label: 'PostgreSQL',  abbr: 'PG'  },
  { value: 'mysql',      label: 'MySQL',       abbr: 'MY'  },
  { value: 'sqlite',     label: 'SQLite',      abbr: 'SQL' },
  { value: 'mongodb',    label: 'MongoDB',     abbr: 'MG'  },
  { value: 'redis',      label: 'Redis',       abbr: 'RD'  },
]

export default function DbPickerModal({ sessionName, onConfirm }) {
  const [selected, setSelected] = useState('none')

  return (
    <div className="dbm-backdrop">
      <div className="dbm-card">
        <div className="dbm-header">
          <div className="dbm-title">Select a database engine</div>
          <div className="dbm-subtitle">
            Choose the primary data store for <strong>{sessionName}</strong>.
            This helps the app tailor the Database Manager tab for your project.
          </div>
        </div>

        <div className="dbm-grid">
          {DB_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`dbm-option ${selected === opt.value ? 'dbm-option--selected' : ''}`}
              onClick={() => setSelected(opt.value)}
            >
              <span className="dbm-option-abbr">{opt.abbr}</span>
              <span className="dbm-option-label">{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="dbm-actions">
          <button className="dbm-btn-primary" onClick={() => onConfirm(selected)}>
            Confirm
          </button>
          <button className="dbm-btn-skip" onClick={() => onConfirm('none')}>
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
