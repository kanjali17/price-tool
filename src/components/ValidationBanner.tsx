import type { ValidationResult } from '../utils/validation'

interface ValidationBannerProps {
  result: ValidationResult
  onGoToProject?: () => void
  onGoToEquipment?: () => void
}

export function ValidationBanner({
  result,
  onGoToProject,
  onGoToEquipment,
}: ValidationBannerProps) {
  if (result.isValid) return null

  const hasHeader = Object.keys(result.headerErrors).length > 0

  return (
    <div
      className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
      role="alert"
    >
      <p className="font-semibold">Complete required fields before continuing:</p>
      <ul className="mt-1 list-inside list-disc">
        {result.messages.map((msg) => (
          <li key={msg}>{msg}</li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap gap-2">
        {hasHeader && onGoToProject && (
          <button
            type="button"
            className="rounded bg-red-800 px-3 py-1 text-xs font-medium text-white hover:bg-red-900"
            onClick={onGoToProject}
          >
            Go to Project Info
          </button>
        )}
        {result.needsEquipment && onGoToEquipment && (
          <button
            type="button"
            className="rounded border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-900 hover:bg-red-100"
            onClick={onGoToEquipment}
          >
            Go to VRV Equipment
          </button>
        )}
      </div>
    </div>
  )
}
