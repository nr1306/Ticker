import { useEffect, useState } from 'react'
import { useAlertsStore } from '../stores/alertsStore'
import { usePortfolioStore } from '../stores/portfolioStore'
import { useWatchlistStore } from '../stores/watchlistStore'
import type { AlertType } from '../../../../shared/types'

export default function Alerts() {
  const { alerts, history, loading, fetch, fetchHistory, add, remove, toggle } = useAlertsStore()
  const portfolioStocks = usePortfolioStore((s) => s.stocks)
  const watchlistStocks = useWatchlistStore((s) => s.stocks)

  const availableTickers = [
    ...new Set([...portfolioStocks.map((s) => s.ticker), ...watchlistStocks.map((s) => s.ticker)])
  ].sort()

  const [ticker, setTicker] = useState('')
  const [type, setType] = useState<AlertType>('floor')
  const [value, setValue] = useState('')
  const [persistent, setPersistent] = useState(false)
  const [adding, setAdding] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    fetch()
    fetchHistory()
  }, [fetch, fetchHistory])

  useEffect(() => {
    if (availableTickers.length > 0 && !ticker) {
      setTicker(availableTickers[0])
    }
  }, [availableTickers, ticker])

  const handleAdd = async () => {
    const numValue = parseFloat(value)
    if (!ticker || isNaN(numValue) || numValue <= 0) return
    setAdding(true)
    await add(ticker, type, numValue, persistent)
    setValue('')
    setPersistent(false)
    setAdding(false)
  }

  const valueLabel = type === 'percent' ? '% threshold' : 'Price ($)'
  const valuePlaceholder = type === 'percent' ? 'e.g. 3' : 'e.g. 180.00'

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-1">
          Smart Alerts
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          Get notified when a stock crosses a price floor, ceiling, or daily % move threshold.
        </p>
      </div>

      {/* Add alert form */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">New Alert</h3>
        {availableTickers.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Add stocks to your portfolio or watchlist to create alerts.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">
                  Ticker
                </label>
                <select
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  className="w-full text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-800 dark:text-zinc-100"
                >
                  {availableTickers.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AlertType)}
                  className="w-full text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-800 dark:text-zinc-100"
                >
                  <option value="floor">Floor (price drops below)</option>
                  <option value="ceiling">Ceiling (price rises above)</option>
                  <option value="percent">% Change (daily move ±)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">
                  {valueLabel}
                </label>
                <input
                  type="number"
                  min="0"
                  step={type === 'percent' ? '0.1' : '0.01'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={valuePlaceholder}
                  className="w-full text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-800 dark:text-zinc-100"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={persistent}
                    onChange={(e) => setPersistent(e.target.checked)}
                    className="rounded"
                  />
                  Persistent
                </label>
                <button
                  onClick={handleAdd}
                  disabled={adding || !ticker || !value || parseFloat(value) <= 0}
                  className="flex-1 text-sm bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-md font-medium disabled:opacity-40 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
                >
                  {adding ? 'Adding...' : 'Add Alert'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Active alerts table */}
      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Active Alerts</h3>
        {loading ? (
          <p className="text-sm text-zinc-400">Loading...</p>
        ) : alerts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 p-8 text-center">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">No alerts configured.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Ticker</th>
                  <th className="text-left px-4 py-2.5 font-medium">Type</th>
                  <th className="text-left px-4 py-2.5 font-medium">Value</th>
                  <th className="text-left px-4 py-2.5 font-medium">Persistent</th>
                  <th className="text-left px-4 py-2.5 font-medium">Active</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {alerts.map((alert) => (
                  <tr key={alert.id} className={alert.active ? '' : 'opacity-40'}>
                    <td className="px-4 py-3 font-mono font-medium text-zinc-800 dark:text-zinc-100">
                      {alert.ticker}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 capitalize">
                      {alert.type === 'percent' ? '% change' : alert.type}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {alert.type === 'percent' ? `±${alert.value}%` : `$${alert.value.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3">
                      {alert.persistent ? (
                        <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                          yes
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-300 dark:text-zinc-600">once</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggle(alert.id, !alert.active)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          alert.active
                            ? 'bg-zinc-800 dark:bg-zinc-100'
                            : 'bg-zinc-200 dark:bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white dark:bg-zinc-900 rounded-full transition-transform ${
                            alert.active ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => remove(alert.id)}
                        className="text-xs text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alert history */}
      <div>
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3"
        >
          <span>{showHistory ? '▾' : '▸'}</span>
          Alert History
          {history.length > 0 && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">({history.length})</span>
          )}
        </button>
        {showHistory &&
          (history.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500">No alerts have fired yet.</p>
          ) : (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">Ticker</th>
                    <th className="text-left px-4 py-2.5 font-medium">Triggered At</th>
                    <th className="text-left px-4 py-2.5 font-medium">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {history.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 font-mono font-medium text-zinc-800 dark:text-zinc-100">
                        {entry.ticker}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                        {new Date(entry.triggeredAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        ${entry.priceAtTrigger.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>
    </div>
  )
}
