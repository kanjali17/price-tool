import { useState } from 'react'
import { AdminAnalytics } from '../analytics/AdminAnalytics'
import { useEstimate } from '../context/EstimateContext'
import type { AdminRates } from '../types'

const ADMIN_PASSWORD = 'daikin2026'

type AdminTab = 'settings' | 'analytics'

export function AdminSettings() {
  const { state, updateState } = useEstimate()
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [adminTab, setAdminTab] = useState<AdminTab>('settings')
  const admin = state.adminRates

  const updateRates = (patch: Partial<AdminRates>) => {
    updateState({ adminRates: { ...admin, ...patch } })
  }

  const updateLabor = (patch: Partial<AdminRates['laborRates']>) => {
    updateRates({ laborRates: { ...admin.laborRates, ...patch } })
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md rounded-lg border bg-white p-8 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-daikin-navy">Admin Access</h2>
        <p className="mb-4 text-sm text-slate-600">Enter password to edit labor rates and lookup tables.</p>
        <input
          type="password"
          className="mb-4 w-full rounded border px-3 py-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="button"
          className="w-full rounded bg-daikin-navy py-2 text-white"
          onClick={() => {
            if (password === ADMIN_PASSWORD) setUnlocked(true)
            else alert('Incorrect password')
          }}
        >
          Unlock
        </button>
        <p className="mt-4 text-xs text-slate-400">Default password: daikin2026</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            adminTab === 'settings'
              ? 'bg-daikin-navy text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          onClick={() => setAdminTab('settings')}
        >
          Settings
        </button>
        <button
          type="button"
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            adminTab === 'analytics'
              ? 'bg-daikin-navy text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          onClick={() => setAdminTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {adminTab === 'analytics' && <AdminAnalytics active />}

      {adminTab === 'settings' && (
      <>
      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 font-semibold text-daikin-navy">Labor Rates</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Sheet Metal / Piping ($/hr)
            <input
              type="number"
              className="mt-1 w-full rounded border bg-daikin-input px-2 py-1"
              value={admin.laborRates.sheetMetalPipingRate}
              onChange={(e) => updateLabor({ sheetMetalPipingRate: parseFloat(e.target.value) || 0 })}
            />
          </label>
          <label className="text-sm">
            Controls ($/hr)
            <input
              type="number"
              className="mt-1 w-full rounded border bg-daikin-input px-2 py-1"
              value={admin.laborRates.controlsRate}
              onChange={(e) => updateLabor({ controlsRate: parseFloat(e.target.value) || 0 })}
            />
          </label>
          <label className="text-sm">
            Insulation ($/hr)
            <input
              type="number"
              className="mt-1 w-full rounded border bg-daikin-input px-2 py-1"
              value={admin.laborRates.insulationRate}
              onChange={(e) => updateLabor({ insulationRate: parseFloat(e.target.value) || 0 })}
            />
          </label>
          <label className="text-sm">
            Insulation (ft/day)
            <input
              type="number"
              className="mt-1 w-full rounded border bg-daikin-input px-2 py-1"
              value={admin.laborRates.insulationFtPerDay}
              onChange={(e) => updateLabor({ insulationFtPerDay: parseFloat(e.target.value) || 0 })}
            />
          </label>
        </div>
      </div>

      <AdminTable
        title="VRV Outdoor Unit Install Hours"
        rows={Object.entries(admin.outdoorUnitHours).map(([model, v]) => ({
          key: model,
          cols: [v.setHours, v.pipeHours, v.pipeMatls, v.isoPads],
        }))}
        headers={['Set Hrs', 'Pipe Hrs', 'Pipe Matls', 'ISO Pads']}
        onUpdate={(key, cols) => {
          updateRates({
            outdoorUnitHours: {
              ...admin.outdoorUnitHours,
              [key]: {
                setHours: cols[0],
                pipeHours: cols[1],
                pipeMatls: cols[2],
                isoPads: cols[3],
              },
            },
          })
        }}
      />

      <AdminTable
        title="Copper ACR Pricing ($/ft)"
        rows={Object.entries(admin.copperAcrPricing).map(([size, v]) => ({
          key: size,
          cols: [v.copper, v.insulHalf, v.insulThreeQuarter, v.insulOne],
        }))}
        headers={['Copper', '1/2" Insul', '3/4" Insul', '1" Insul']}
        onUpdate={(key, cols) => {
          updateRates({
            copperAcrPricing: {
              ...admin.copperAcrPricing,
              [key]: {
                copper: cols[0],
                insulHalf: cols[1],
                insulThreeQuarter: cols[2],
                insulOne: cols[3],
              },
            },
          })
        }}
      />

      <div className="rounded-lg border bg-amber-50 p-4 text-sm text-amber-900">
        Changes save automatically to localStorage and apply to all new quantity entries.
      </div>
      </>
      )}
    </div>
  )
}

function AdminTable({
  title,
  headers,
  rows,
  onUpdate,
}: {
  title: string
  headers: string[]
  rows: { key: string; cols: number[] }[]
  onUpdate: (key: string, cols: number[]) => void
}) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <h3 className="border-b px-4 py-2 font-semibold text-daikin-navy">{title}</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-100">
            <th className="px-2 py-1 text-left">Key</th>
            {headers.map((h) => (
              <th key={h} className="px-2 py-1 text-right">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t">
              <td className="px-2 py-1 font-mono">{row.key}</td>
              {row.cols.map((val, i) => (
                <td key={i} className="px-1 py-1">
                  <input
                    type="number"
                    step="0.01"
                    className="w-20 rounded border bg-daikin-input px-1 py-0.5 text-right"
                    value={val}
                    onChange={(e) => {
                      const cols = [...row.cols]
                      cols[i] = parseFloat(e.target.value) || 0
                      onUpdate(row.key, cols)
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
