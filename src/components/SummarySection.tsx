import { trackEstimateEvent } from '../analytics/amplitude'
import { ValidationBanner } from './ValidationBanner'
import { useEstimate } from '../context/EstimateContext'
import { exportEstimateToPdf } from '../utils/export'
import { formatCurrency } from '../utils/calculations'

function SummaryRow({
  label,
  value,
  editable,
  onEdit,
  highlight,
}: {
  label: string
  value: string
  editable?: boolean
  onEdit?: (v: number) => void
  highlight?: 'green' | 'amber'
}) {
  const bg =
    highlight === 'amber'
      ? 'bg-amber-100'
      : highlight === 'green'
        ? 'bg-daikin-subtotal'
        : editable
          ? 'bg-daikin-input/30'
          : 'bg-slate-50'

  return (
    <tr className={`border-b ${bg}`}>
      <td className="px-4 py-2 font-medium text-slate-700">{label}</td>
      <td className="px-4 py-2 text-right">
        {editable && onEdit ? (
          <input
            type="number"
            className="w-28 rounded border bg-daikin-input px-2 py-1 text-right"
            value={parseFloat(value.replace(/[^0-9.-]/g, '')) || 0}
            onChange={(e) => onEdit(parseFloat(e.target.value) || 0)}
          />
        ) : (
          <span className={highlight === 'amber' ? 'text-lg font-bold text-amber-700' : ''}>
            {value}
          </span>
        )}
      </td>
    </tr>
  )
}

export function SummarySection() {
  const { state, totals, updateState, validateAndProceed, showValidation, validation, setActiveSection } =
    useEstimate()
  const s = state.summary
  const ps = state.pipingSettings

  const updateSummary = (patch: Partial<typeof s>) => {
    updateState({ summary: { ...s, ...patch } })
  }

  const updateSub = (id: string, amount: number) => {
    updateState({
      subcontractors: state.subcontractors.map((l) =>
        l.id === id ? { ...l, amount } : l
      ),
    })
  }

  const updateSubLabel = (id: string, label: string) => {
    updateState({
      subcontractors: state.subcontractors.map((l) =>
        l.id === id ? { ...l, label } : l
      ),
    })
  }

  const tax = s.salesTaxPercent / 100
  const equipmentTaxed = totals.equipmentCost * (1 + tax)

  const metrics =
    s.totalCapacityTons > 0
      ? {
          perTon: totals.totalInstallCost / s.totalCapacityTons,
          equipPerTon: equipmentTaxed / s.totalCapacityTons,
        }
      : null

  const sqMetrics =
    s.conditionedSqFt > 0
      ? {
          perSqFt: totals.totalInstallCost / s.conditionedSqFt,
          equipPerSqFt: equipmentTaxed / s.conditionedSqFt,
        }
      : null

  return (
    <div className="space-y-6 print:text-black">
      {showValidation && !validation.isValid && (
        <ValidationBanner
          result={validation}
          onGoToProject={() => setActiveSection('project')}
          onGoToEquipment={() => setActiveSection('vrv')}
        />
      )}
      <div className="flex flex-wrap gap-3 print:hidden">
        <button
          type="button"
          className="rounded bg-daikin-accent px-4 py-2 font-semibold text-white hover:bg-amber-600"
          onClick={() =>
            validateAndProceed('complete', () => {
              exportEstimateToPdf(state, totals)
              trackEstimateEvent('pdf_exported', {}, totals.totalInstallCost)
            })
          }
        >
          Export to PDF
        </button>
        <button
          type="button"
          className="rounded border border-daikin-navy px-4 py-2 text-daikin-navy hover:bg-slate-50"
          onClick={() => window.print()}
        >
          Print
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <h3 className="border-b bg-daikin-navy px-4 py-2 font-semibold text-white">Direct Costs</h3>
        <table className="w-full text-sm">
          <tbody>
            <SummaryRow label="Equipment" value={formatCurrency(totals.equipmentCost)} />
            <tr className="border-b bg-daikin-input/30">
              <td className="px-4 py-2 font-medium text-slate-700">Sales Tax %</td>
              <td className="px-4 py-2 text-right">
                <input
                  type="number"
                  step="0.1"
                  className="w-20 rounded border bg-daikin-input px-2 py-1 text-right"
                  value={s.salesTaxPercent}
                  onChange={(e) => updateSummary({ salesTaxPercent: parseFloat(e.target.value) || 0 })}
                />
                <span className="ml-2 text-slate-600">{formatCurrency(totals.equipmentCost * tax)}</span>
              </td>
            </tr>
            <SummaryRow label="Equipment (incl. tax)" value={formatCurrency(equipmentTaxed)} highlight="green" />
            <SummaryRow label="Material - Sheet Metal" value={formatCurrency(totals.sheetMetalMaterials)} />
            <SummaryRow label="Material - Piping" value={formatCurrency(totals.pipingMaterials)} />
            <SummaryRow label="Labor - Sheet Metal" value={formatCurrency(totals.sheetMetalLabor)} />
            <SummaryRow label="Labor - Piping" value={formatCurrency(totals.pipingLabor)} />
            <SummaryRow label="TOTAL DIRECT COSTS" value={formatCurrency(totals.directCostsTotal)} highlight="green" />
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <h3 className="border-b bg-slate-600 px-4 py-2 font-semibold text-white">Subcontractors</h3>
        <table className="w-full text-sm">
          <tbody>
            {state.subcontractors.map((sub) => (
              <tr key={sub.id} className="border-b">
                <td className="px-4 py-2">
                  {sub.id.includes('sub-6') || sub.id.includes('sub-7') ? (
                    <input
                      className="w-full rounded border bg-daikin-input px-2 py-1"
                      value={sub.label}
                      onChange={(e) => updateSubLabel(sub.id, e.target.value)}
                    />
                  ) : (
                    sub.label
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    className="w-32 rounded border bg-daikin-input px-2 py-1 text-right"
                    value={sub.amount || ''}
                    onChange={(e) => updateSub(sub.id, parseFloat(e.target.value) || 0)}
                  />
                </td>
              </tr>
            ))}
            <SummaryRow label="TOTAL SUBCONTRACTORS" value={formatCurrency(totals.subcontractorsTotal)} highlight="green" />
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <h3 className="border-b bg-slate-600 px-4 py-2 font-semibold text-white">Misc Costs</h3>
        <table className="w-full text-sm">
          <tbody>
            {state.miscCosts.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="px-4 py-2">
                  {m.label}
                  {m.isPercentOfLabor && ` (${s.projectManagementPercent}% of labor)`}
                </td>
                <td className="px-4 py-2 text-right">
                  {m.isPercentOfLabor ? (
                    <input
                      type="number"
                      className="w-20 rounded border bg-daikin-input px-2 py-1 text-right"
                      value={s.projectManagementPercent}
                      onChange={(e) =>
                        updateSummary({ projectManagementPercent: parseFloat(e.target.value) || 0 })
                      }
                    />
                  ) : (
                    <input
                      type="number"
                      className="w-32 rounded border bg-daikin-input px-2 py-1 text-right"
                      value={m.amount || ''}
                      onChange={(e) =>
                        updateState({
                          miscCosts: state.miscCosts.map((x) =>
                            x.id === m.id ? { ...x, amount: parseFloat(e.target.value) || 0 } : x
                          ),
                        })
                      }
                    />
                  )}
                </td>
              </tr>
            ))}
            {state.miscCustom.map((m, i) => (
              <tr key={i} className="border-b">
                <td className="px-4 py-2">
                  <input
                    className="w-full rounded border bg-daikin-input px-2 py-1"
                    value={m.label}
                    onChange={(e) => {
                      const next = [...state.miscCustom]
                      next[i] = { ...next[i], label: e.target.value }
                      updateState({ miscCustom: next })
                    }}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    className="w-32 rounded border bg-daikin-input px-2 py-1 text-right"
                    value={m.amount || ''}
                    onChange={(e) => {
                      const next = [...state.miscCustom]
                      next[i] = { ...next[i], amount: parseFloat(e.target.value) || 0 }
                      updateState({ miscCustom: next })
                    }}
                  />
                </td>
              </tr>
            ))}
            <SummaryRow label="TOTAL MISC COSTS" value={formatCurrency(totals.miscTotal)} highlight="green" />
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <h3 className="border-b px-4 py-2 font-semibold">Bottom Line</h3>
        <table className="w-full text-sm">
          <tbody>
            <SummaryRow label="Controls" value={formatCurrency(totals.controlsTotal)} />
            <SummaryRow label="TOTAL JOB COST" value={formatCurrency(totals.jobCost)} highlight="green" />
            <SummaryRow
              label="Errors & Omissions %"
              value={`${s.errorsOmissionsPercent}%`}
              editable
              onEdit={(v) => updateSummary({ errorsOmissionsPercent: v })}
            />
            <SummaryRow
              label="Contingency/Permits %"
              value={`${s.contingencyPercent}%`}
              editable
              onEdit={(v) => updateSummary({ contingencyPercent: v })}
            />
            <SummaryRow
              label="Engineering %"
              value={`${s.engineeringPercent}%`}
              editable
              onEdit={(v) => updateSummary({ engineeringPercent: v })}
            />
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white p-4">
        <div className="mb-4 flex flex-wrap gap-4">
          <label className="text-sm">
            Markup mode
            <select
              className="ml-2 rounded border bg-daikin-input px-2 py-1"
              value={s.markupMode}
              onChange={(e) =>
                updateSummary({ markupMode: e.target.value as typeof s.markupMode })
              }
            >
              <option value="markup">Markup %</option>
              <option value="grossMargin">Gross Margin %</option>
            </select>
          </label>
          {(['equipmentMarkup', 'materialMarkup', 'laborMarkup', 'subcontractorMarkup', 'miscMarkup', 'eoMarkup'] as const).map((key) => (
            <label key={key} className="text-sm">
              {key.replace('Markup', ' MU')}
              <input
                type="number"
                className="ml-1 w-16 rounded border bg-daikin-input px-2 py-1"
                value={s[key]}
                onChange={(e) => updateSummary({ [key]: parseFloat(e.target.value) || 0 })}
              />
              %
            </label>
          ))}
        </div>
        <p className="rounded-lg bg-amber-100 px-4 py-3 text-2xl font-bold text-amber-800">
          TOTAL INSTALL COST: {formatCurrency(totals.totalInstallCost)}
        </p>
      </div>

      <div className="grid gap-4 rounded-lg border bg-white p-4 md:grid-cols-2">
        <label className="text-sm">
          Total Capacity (tons)
          <input
            type="number"
            className="mt-1 w-full rounded border bg-daikin-input px-2 py-1"
            value={s.totalCapacityTons || ''}
            onChange={(e) => updateSummary({ totalCapacityTons: parseFloat(e.target.value) || 0 })}
          />
        </label>
        <label className="text-sm">
          Conditioned Sq Ft
          <input
            type="number"
            className="mt-1 w-full rounded border bg-daikin-input px-2 py-1"
            value={s.conditionedSqFt || ''}
            onChange={(e) => updateSummary({ conditionedSqFt: parseFloat(e.target.value) || 0 })}
          />
        </label>
        {metrics && (
          <div className="text-sm text-slate-600">
            <p>$/ton (overall): {formatCurrency(metrics.perTon)}</p>
            <p>$/ton (equipment): {formatCurrency(metrics.equipPerTon)}</p>
          </div>
        )}
        {sqMetrics && (
          <div className="text-sm text-slate-600">
            <p>$/sq.ft (overall): {formatCurrency(sqMetrics.perSqFt)}</p>
            <p>$/sq.ft (equipment): {formatCurrency(sqMetrics.equipPerSqFt)}</p>
          </div>
        )}
      </div>

      <div className="rounded border bg-slate-50 p-4 text-sm text-slate-600">
        <p>Brazed: {ps.brazed ? 'YES' : 'NO'} | RefLok: {ps.reflok ? 'YES' : 'NO'} | Insulation: {ps.insulationThickness}</p>
      </div>
    </div>
  )
}
