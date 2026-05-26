import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { track } from '../analytics/amplitude'
import { ANALYTICS_EVENTS } from '../analytics/events'
import type { CalculatedTotals, EstimateState } from '../types'
import { countActiveEquipmentLines, formatCurrency } from './calculations'

export function exportEstimateToPdf(
  state: EstimateState,
  totals: CalculatedTotals
): void {
  const doc = new jsPDF()
  const h = state.header

  doc.setFontSize(18)
  doc.text('Daikin Install Cost Estimate', 14, 20)
  doc.setFontSize(10)
  doc.text(`Project: ${h.projectName || '—'}`, 14, 30)
  doc.text(`Location: ${h.location || '—'}`, 14, 36)
  doc.text(`Estimate #: ${h.estimateNo || '—'} | Date: ${h.date}`, 14, 42)
  doc.text(`Estimated By: ${h.estimatedBy || '—'}`, 14, 48)

  autoTable(doc, {
    startY: 55,
    head: [['Category', 'Amount']],
    body: [
      ['Equipment (incl. tax)', formatCurrency(totals.equipmentCost * (1 + state.summary.salesTaxPercent / 100))],
      ['Sheet Metal Materials', formatCurrency(totals.sheetMetalMaterials)],
      ['Piping Materials', formatCurrency(totals.pipingMaterials)],
      ['Sheet Metal Labor', formatCurrency(totals.sheetMetalLabor)],
      ['Piping Labor', formatCurrency(totals.pipingLabor)],
      ['Controls', formatCurrency(totals.controlsTotal)],
      ['Direct Costs Total', formatCurrency(totals.directCostsTotal)],
      ['Subcontractors', formatCurrency(totals.subcontractorsTotal)],
      ['Misc Costs', formatCurrency(totals.miscTotal)],
      ['Job Cost', formatCurrency(totals.jobCost)],
      ['TOTAL INSTALL COST', formatCurrency(totals.totalInstallCost)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 95] },
  })

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120
  if (state.summary.totalCapacityTons > 0) {
    doc.text(
      `$/ton: ${formatCurrency(totals.totalInstallCost / state.summary.totalCapacityTons)}`,
      14,
      finalY + 12
    )
  }
  if (state.summary.conditionedSqFt > 0) {
    doc.text(
      `$/sq.ft: ${formatCurrency(totals.totalInstallCost / state.summary.conditionedSqFt)}`,
      14,
      finalY + 18
    )
  }

  doc.save(`${h.projectName || 'estimate'}-daikin-install.pdf`)

  track(ANALYTICS_EVENTS.pdf_exported, {
    total: totals.totalInstallCost,
    line_item_count: countActiveEquipmentLines(state),
  })
}
