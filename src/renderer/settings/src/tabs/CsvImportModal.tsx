import { useState } from 'react'

interface CsvData {
  headers: string[]
  rows: string[][]
  detectedTicker: string | null
  detectedQuantity: string | null
}

type Step = 'mapping' | 'preview' | 'importing' | 'done'

interface SkippedRow {
  ticker: string
  reason: string
}

interface Props {
  data: CsvData
  onClose: () => void
  onImportComplete: () => void
}

export default function CsvImportModal({ data, onClose, onImportComplete }: Props) {
  const [step, setStep] = useState<Step>('mapping')
  const [tickerCol, setTickerCol] = useState(data.detectedTicker ?? '')
  const [quantityCol, setQuantityCol] = useState(data.detectedQuantity ?? '')
  const [importedCount, setImportedCount] = useState(0)
  const [skipped, setSkipped] = useState<SkippedRow[]>([])

  const tickerIdx = data.headers.indexOf(tickerCol)
  const quantityIdx = data.headers.indexOf(quantityCol)

  const previewRows =
    tickerIdx >= 0 && quantityIdx >= 0
      ? data.rows
          .map((row) => ({
            ticker: (row[tickerIdx] ?? '')
              .trim()
              .toUpperCase()
              .replace(/[^A-Z.]/g, ''),
            quantityRaw: (row[quantityIdx] ?? '').trim()
          }))
          .filter((r) => r.ticker && r.quantityRaw)
      : []

  const handleImport = async () => {
    setStep('importing')
    let imported = 0
    const skippedRows: SkippedRow[] = []

    for (const row of previewRows) {
      const qty = parseFloat(row.quantityRaw.replace(/,/g, ''))
      if (isNaN(qty) || qty <= 0) {
        skippedRows.push({ ticker: row.ticker, reason: 'invalid quantity' })
        continue
      }
      const lookup = await window.api.ticker.lookup(row.ticker)
      if (!lookup.valid) {
        skippedRows.push({ ticker: row.ticker, reason: 'ticker not found' })
        continue
      }
      await window.api.portfolio.add(lookup.ticker, lookup.name, qty)
      imported++
    }

    setImportedCount(imported)
    setSkipped(skippedRows)
    setStep('done')
    onImportComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[520px] max-h-[80vh] rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {step === 'mapping' && 'Import from CSV'}
              {step === 'preview' && 'Preview import'}
              {step === 'importing' && 'Importing…'}
              {step === 'done' && 'Import complete'}
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              {step === 'mapping' && 'Match your CSV columns to the required fields'}
              {step === 'preview' && `${previewRows.length} rows ready to import`}
              {step === 'importing' && 'Looking up tickers and adding to portfolio…'}
              {step === 'done' &&
                `${importedCount} added${skipped.length > 0 ? `, ${skipped.length} skipped` : ''}`}
            </p>
          </div>
          {step !== 'importing' && (
            <button
              onClick={onClose}
              className="text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 text-xl leading-none transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6">
          {step === 'mapping' && (
            <div className="flex flex-col gap-5">
              <ColumnSelect
                label="Ticker / Symbol column"
                value={tickerCol}
                headers={data.headers}
                onChange={setTickerCol}
              />
              <ColumnSelect
                label="Quantity / Shares column"
                value={quantityCol}
                headers={data.headers}
                onChange={setQuantityCol}
              />
              {data.detectedTicker && data.detectedQuantity && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  ✓ Columns auto-detected from your CSV headers
                </p>
              )}
              {(!data.detectedTicker || !data.detectedQuantity) && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Select which columns contain ticker symbols and share quantities.
                </p>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        Ticker
                      </th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(0, 50).map((row, i) => (
                      <tr
                        key={i}
                        className={`${i < Math.min(previewRows.length, 50) - 1 ? 'border-b border-zinc-50 dark:border-zinc-800/50' : ''}`}
                      >
                        <td className="px-4 py-2 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-100 tracking-wide">
                          {row.ticker}
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                          {row.quantityRaw}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewRows.length > 50 && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Showing first 50 of {previewRows.length} rows. All will be imported.
                </p>
              )}
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-700 dark:border-t-zinc-300 animate-spin" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Importing {previewRows.length} stocks…
              </p>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
                <span className="text-emerald-500 text-base mt-0.5">✓</span>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  {importedCount} stock{importedCount !== 1 ? 's' : ''} added to your portfolio.
                </p>
              </div>
              {skipped.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
                    Skipped ({skipped.length})
                  </p>
                  <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                    {skipped.map((s, i) => (
                      <div
                        key={i}
                        className={`flex justify-between px-4 py-2 text-xs ${i < skipped.length - 1 ? 'border-b border-zinc-50 dark:border-zinc-800/50' : ''}`}
                      >
                        <span className="font-mono font-semibold text-zinc-600 dark:text-zinc-400">
                          {s.ticker}
                        </span>
                        <span className="text-zinc-400 dark:text-zinc-500">{s.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          {step === 'mapping' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('preview')}
                disabled={!tickerCol || !quantityCol || previewRows.length === 0}
                className="px-5 py-2 text-sm rounded-lg bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Preview {previewRows.length > 0 ? `${previewRows.length} rows` : '→'}
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('mapping')}
                className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleImport}
                className="px-5 py-2 text-sm rounded-lg bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
              >
                Import {previewRows.length} stocks
              </button>
            </>
          )}

          {step === 'done' && (
            <div className="ml-auto">
              <button
                onClick={onClose}
                className="px-5 py-2 text-sm rounded-lg bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ColumnSelect({
  label,
  value,
  headers,
  onChange
}: {
  label: string
  value: string
  headers: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
      >
        <option value="">— select column —</option>
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </div>
  )
}
