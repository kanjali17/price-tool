import { useEstimate } from '../context/EstimateContext'
import {
  deriveControlsWiringQuantities,
  formatCurrency,
  formatNumber,
  parseQuantity,
} from '../utils/calculations'

export function ControlsSection() {
  const { state, totals, updateState } = useEstimate()
  const rate = state.adminRates.laborRates.controlsRate

  const updateWiring = (id: string, quantity: number) => {
    const q = Math.max(0, quantity)
    updateState({
      controlsWiring: state.controlsWiring.map((w) =>
        w.id === id ? { ...w, quantity: q } : w
      ),
    })
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="flex items-center justify-end gap-3 border-b border-slate-100 px-4 py-2">
          <span className="text-xs text-slate-500">{formatCurrency(rate)}/hr</span>
          <button
            type="button"
            className="rounded bg-daikin-navy px-3 py-1 text-xs font-medium text-white hover:bg-daikin-slate"
            onClick={() =>
              updateState({
                controlsWiring: deriveControlsWiringQuantities(state, state.controlsWiring),
              })
            }
          >
            Sync qty
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-100 text-xs uppercase text-slate-600">
              <th className="px-4 py-2 text-left">Item</th>
              <th className="px-4 py-2 text-right">Qty</th>
              <th className="px-4 py-2 text-right">Hrs/EA</th>
              <th className="px-4 py-2 text-right">Matls/EA</th>
              <th className="px-4 py-2 text-right">Total Hrs</th>
              <th className="px-4 py-2 text-right">Total Matls</th>
            </tr>
          </thead>
          <tbody>
            {state.controlsWiring.map((w) => {
              const q = w.quantity || 0
              return (
                <tr key={w.id} className={`border-b ${!q ? 'text-slate-400' : ''}`}>
                  <td className="px-4 py-2">{w.label}</td>
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      className="w-20 rounded border bg-daikin-input px-2 py-1 text-right"
                      value={q || ''}
                      onChange={(e) => updateWiring(w.id, parseQuantity(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault()
                      }}
                    />
                  </td>
                  <td className="bg-slate-50 px-4 py-2 text-right">{w.hoursPerEa}</td>
                  <td className="bg-slate-50 px-4 py-2 text-right">{formatCurrency(w.materialsPerEa)}</td>
                  <td className="bg-slate-50 px-4 py-2 text-right">{formatNumber(w.hoursPerEa * q, 1)}</td>
                  <td className="bg-slate-50 px-4 py-2 text-right">{formatCurrency(w.materialsPerEa * q)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 rounded-lg border bg-white p-4 md:grid-cols-3">
        <label className="text-sm">
          Engineering / PM Hours
          <input
            type="number"
            className="mt-1 w-full rounded border bg-daikin-input px-2 py-1"
            value={state.controlsEngineeringHours || ''}
            onChange={(e) =>
              updateState({ controlsEngineeringHours: parseFloat(e.target.value) || 0 })
            }
          />
        </label>
        <label className="text-sm">
          Engineering / PM Cost ($)
          <input
            type="number"
            className="mt-1 w-full rounded border bg-daikin-input px-2 py-1"
            value={state.controlsEngineeringCost || ''}
            onChange={(e) =>
              updateState({ controlsEngineeringCost: parseFloat(e.target.value) || 0 })
            }
          />
        </label>
        <label className="text-sm">
          Material Costs (Panels, etc.)
          <input
            type="number"
            className="mt-1 w-full rounded border bg-daikin-input px-2 py-1"
            value={state.controlsMaterialCost || ''}
            onChange={(e) =>
              updateState({ controlsMaterialCost: parseFloat(e.target.value) || 0 })
            }
          />
        </label>
      </div>

      <div className="grid gap-4 rounded-lg bg-daikin-subtotal p-4 md:grid-cols-3">
        <div>
          <p className="text-xs">Controls Labor</p>
          <p className="text-lg font-bold">{formatCurrency(totals.controlsLabor)}</p>
        </div>
        <div>
          <p className="text-xs">Controls Materials</p>
          <p className="text-lg font-bold">{formatCurrency(totals.controlsMaterials)}</p>
        </div>
        <div>
          <p className="text-xs">Controls Total</p>
          <p className="text-lg font-bold text-daikin-navy">{formatCurrency(totals.controlsTotal)}</p>
        </div>
      </div>
    </div>
  )
}
