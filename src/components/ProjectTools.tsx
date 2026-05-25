import { useState } from 'react'
import { ValidationBanner } from './ValidationBanner'
import { useEstimate } from '../context/EstimateContext'

export function ProjectTools() {
  const {
    savedProjects,
    saveProject,
    loadProject,
    duplicateProject,
    deleteProject,
    resetEstimate,
    loadSampleEstimate,
    state,
    showValidation,
    validation,
    setActiveSection,
  } = useEstimate()
  const [saveName, setSaveName] = useState('')
  const [showLog, setShowLog] = useState(false)

  return (
    <div className="mb-6 space-y-4">
      {showValidation && !validation.isValid && (
        <ValidationBanner
          result={validation}
          onGoToProject={() => setActiveSection('project')}
        />
      )}
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-daikin-navy">Save &amp; manage</h3>
      </div>
      <div className="flex flex-wrap items-center gap-2 p-4">
        <input
          type="text"
          placeholder="Project name to save as…"
          className="min-w-[12rem] flex-1 rounded-lg border border-slate-200 bg-daikin-input/30 px-3 py-2 text-sm"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
        />
        <button
          type="button"
          className="rounded-lg bg-daikin-navy px-4 py-2 text-sm font-medium text-white hover:bg-daikin-slate"
          onClick={() => {
            saveProject(saveName || state.header.projectName)
            setSaveName('')
          }}
        >
          Save copy
        </button>
        <button
          type="button"
          className="rounded-lg border border-daikin-navy px-4 py-2 text-sm text-daikin-navy hover:bg-slate-50"
          onClick={duplicateProject}
        >
          Duplicate
        </button>
        {savedProjects.length > 0 && (
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) loadProject(e.target.value)
              e.target.value = ''
            }}
          >
            <option value="">Open saved…</option>
            {savedProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({new Date(p.savedAt).toLocaleDateString()})
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          onClick={() => setShowLog(!showLog)}
        >
          History ({state.changeLog.length})
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          onClick={() => {
            if (confirm('Replace current data with the sample estimate?')) loadSampleEstimate()
          }}
        >
          Load sample
        </button>
        <button
          type="button"
          className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
          onClick={() => {
            if (confirm('Clear all estimate data and start over?')) resetEstimate()
          }}
        >
          Reset all
        </button>
      </div>

      {savedProjects.length > 0 && (
        <ul className="border-t border-slate-100 px-4 py-2 text-xs text-slate-600">
          {savedProjects.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 py-1">
              <span>{p.name}</span>
              <button
                type="button"
                className="text-red-600 hover:underline"
                onClick={() => {
                  if (confirm(`Delete saved project "${p.name}"?`)) deleteProject(p.id)
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {showLog && (
        <div className="max-h-40 overflow-y-auto border-t border-slate-100 bg-slate-50 p-3 text-xs">
          {state.changeLog.length === 0 ? (
            <p className="text-slate-400">No changes logged yet.</p>
          ) : (
            state.changeLog.map((e, i) => (
              <div key={i} className="border-b border-slate-100 py-1 text-slate-600">
                <span className="text-slate-400">{new Date(e.timestamp).toLocaleString()}</span> —{' '}
                {e.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
    </div>
  )
}
