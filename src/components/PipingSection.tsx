import { useEstimate } from '../context/EstimateContext'
import { formatCurrency, formatNumber } from '../utils/calculations'

export function PipingSection() {
  const { state, totals, updateState } = useEstimate()
  const ps = state.pipingSettings

  const updateFootage = (size: string, footage: number) => {
    updateState({
      pipingFootage: state.pipingFootage.map((e) =>
        e.size === size ? { ...e, footage } : e
      ),
    })
  }

  const lineSets = state.pipingFootage.filter((e) => e.type === 'lineSet')
  const acr = state.pipingFootage.filter((e) => e.type === 'acr')

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-daikin-navy">Job settings</h3>
        <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Brazed</span>
          <select
            className="rounded border bg-daikin-input px-2 py-1"
            value={ps.brazed ? 'YES' : 'NO'}
            onChange={(e) =>
              updateState({
                pipingSettings: { ...ps, brazed: e.target.value === 'YES' },
              })
            }
          >
            <option value="YES">YES</option>
            <option value="NO">NO</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">ACR Pipe</span>
          <select
            className="rounded border bg-daikin-input px-2 py-1"
            value={ps.acrPipe}
            onChange={(e) =>
              updateState({
                pipingSettings: {
                  ...ps,
                  acrPipe: e.target.value as 'COPPER' | 'ALUMINUM',
                },
              })
            }
          >
            <option value="COPPER">COPPER</option>
            <option value="ALUMINUM">ALUMINUM</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Insulation</span>
          <select
            className="rounded border bg-daikin-input px-2 py-1"
            value={ps.insulationThickness}
            onChange={(e) =>
              updateState({
                pipingSettings: {
                  ...ps,
                  insulationThickness: e.target.value as typeof ps.insulationThickness,
                },
              })
            }
          >
            <option value='1/2"'>1/2&quot;</option>
            <option value='3/4"'>3/4&quot;</option>
            <option value='1"'>1&quot;</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={ps.reflok}
            onChange={(e) =>
              updateState({ pipingSettings: { ...ps, reflok: e.target.checked } })
            }
          />
          <span className="text-sm">RefLok</span>
        </label>
        {ps.reflok && (
          <label className="flex items-center gap-2 text-sm">
            RefLok labor discount ($)
            <input
              type="number"
              min={0}
              className="w-28 rounded border bg-daikin-input px-2 py-1"
              value={ps.reflokLaborDiscount || ''}
              onChange={(e) =>
                updateState({
                  pipingSettings: {
                    ...ps,
                    reflokLaborDiscount: parseFloat(e.target.value) || 0,
                  },
                })
              }
            />
          </label>
        )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <PipeFootageTable title="Line Sets (ft)" entries={lineSets} onUpdate={updateFootage} />
        <PipeFootageTable title="ACR Pipe (ft)" entries={acr} onUpdate={updateFootage} />
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 font-semibold text-daikin-navy">Condensate</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm">
            COND DRAINS (qty)
            <input
              type="number"
              className="mt-1 w-full rounded border bg-daikin-input px-2 py-1"
              value={state.condensateDrains || ''}
              onChange={(e) => updateState({ condensateDrains: parseFloat(e.target.value) || 0 })}
            />
          </label>
          <label className="text-sm">
            Material
            <select
              className="mt-1 w-full rounded border bg-daikin-input px-2 py-1"
              value={state.condensateDrainsMaterial}
              onChange={(e) =>
                updateState({
                  condensateDrainsMaterial: e.target.value as 'COPPER' | 'PVC',
                })
              }
            >
              <option value="COPPER">Copper</option>
              <option value="PVC">PVC</option>
            </select>
          </label>
          <label className="text-sm">
            Condensate Pumps (qty)
            <input
              type="number"
              className="mt-1 w-full rounded border bg-daikin-input px-2 py-1"
              value={state.condensatePumps || ''}
              onChange={(e) => updateState({ condensatePumps: parseFloat(e.target.value) || 0 })}
            />
          </label>
        </div>
      </div>

      <div className="grid gap-4 rounded-lg bg-daikin-subtotal p-4 md:grid-cols-3">
        <div>
          <p className="text-xs text-slate-600">Total Piping Cost</p>
          <p className="text-lg font-bold">{formatCurrency(totals.pipingSectionCost)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-600">Piping Hours</p>
          <p className="text-lg font-bold">{formatNumber(totals.pipingSectionHours, 1)} hrs</p>
        </div>
        <div>
          <p className="text-xs text-slate-600">Insulation Cost</p>
          <p className="text-lg font-bold">{formatCurrency(totals.insulationCost)}</p>
        </div>
      </div>
    </div>
  )
}

function PipeFootageTable({
  title,
  entries,
  onUpdate,
}: {
  title: string
  entries: { size: string; footage: number }[]
  onUpdate: (size: string, footage: number) => void
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="mb-3 font-semibold text-daikin-navy">{title}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500">
            <th>Size</th>
            <th className="text-right">Footage</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.size} className={!e.footage ? 'text-slate-400' : ''}>
              <td className="py-1">{e.size}</td>
              <td className="py-1 text-right">
                <input
                  type="number"
                  min={0}
                  className="w-24 rounded border border-blue-200 bg-daikin-input px-2 py-1 text-right"
                  value={e.footage || ''}
                  onChange={(ev) => onUpdate(e.size, parseFloat(ev.target.value) || 0)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
