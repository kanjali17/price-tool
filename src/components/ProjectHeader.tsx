import { useEstimate } from '../context/EstimateContext'
import { REQUIRED_HEADER_FIELDS, type HeaderFieldKey } from '../utils/validation'

const OPTIONAL_FIELDS: {
  key: HeaderFieldKey
  label: string
  type?: string
}[] = [
  { key: 'architectEngineer', label: 'Architect / Engineer' },
  { key: 'estimateNo', label: 'Estimate No.' },
]

export function ProjectHeader() {
  const { state, updateHeader, validation, showValidation } = useEstimate()
  const h = state.header
  const fieldError = (key: HeaderFieldKey) =>
    showValidation ? validation.headerErrors[key] : undefined

  const inputClass = (key: HeaderFieldKey) => {
    const base =
      'rounded border bg-daikin-input px-3 py-2 text-slate-900 focus:border-daikin-navy focus:outline-none focus:ring-1 focus:ring-daikin-navy'
    return fieldError(key)
      ? `${base} border-red-400 ring-1 ring-red-200`
      : `${base} border-blue-200`
  }

  return (
    <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-3">
      {REQUIRED_HEADER_FIELDS.map(({ key, label }) => (
        <label key={key} className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">
            {label} <span className="text-red-600">*</span>
          </span>
          <input
            type={key === 'date' ? 'date' : 'text'}
            required
            aria-required="true"
            aria-invalid={fieldError(key) ? true : undefined}
            className={inputClass(key)}
            value={h[key]}
            onChange={(e) => updateHeader({ [key]: e.target.value })}
          />
          {fieldError(key) && (
            <span className="text-xs text-red-600">{fieldError(key)}</span>
          )}
        </label>
      ))}
      {OPTIONAL_FIELDS.map(({ key, label, type }) => (
        <label key={key} className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">{label}</span>
          <input
            type={type || 'text'}
            className={inputClass(key)}
            value={h[key]}
            onChange={(e) => updateHeader({ [key]: e.target.value })}
          />
        </label>
      ))}
      <p className="text-xs text-slate-500 md:col-span-2 lg:col-span-3">
        <span className="text-red-600">*</span> Required for saving and exporting estimates.
      </p>
    </div>
  )
}
