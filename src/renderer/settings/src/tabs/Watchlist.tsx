import { useEffect, useState, useRef } from 'react'
import { useWatchlistStore } from '../stores/watchlistStore'

type LookupStatus = 'idle' | 'loading' | 'found' | 'not-found'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export default function Watchlist() {
  const { stocks, loading, fetch, add, remove, setTarget } = useWatchlistStore()

  const [ticker, setTicker] = useState('')
  const [name, setName] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [editingTarget, setEditingTarget] = useState<string | null>(null)
  const [editTargetValue, setEditTargetValue] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch()
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [fetch])

  const handleTickerChange = (value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z.]/g, '')
    setTicker(upper)
    setLookupStatus('idle')
    setName('')
    setError('')

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!upper) return

    debounceRef.current = setTimeout(async () => {
      setLookupStatus('loading')
      const result = await window.api.ticker.lookup(upper)
      if (result.valid) {
        setName(result.name)
        setLookupStatus('found')
      } else {
        setLookupStatus('not-found')
      }
    }, 600)
  }

  const handleAdd = async () => {
    if (!ticker) return setError('Enter a ticker symbol.')
    if (!name) return setError('Enter the company name.')

    const tp = targetPrice ? parseFloat(targetPrice) : undefined
    if (targetPrice && (isNaN(tp!) || tp! <= 0))
      return setError('Target price must be a positive number.')

    setAdding(true)
    setError('')
    try {
      await add(ticker, name, tp)
      setTicker('')
      setName('')
      setTargetPrice('')
      setLookupStatus('idle')
    } catch {
      setError('Failed to add to watchlist. Try again.')
    } finally {
      setAdding(false)
    }
  }

  const handleKeyDown = (e: { key: string }) => {
    if (e.key === 'Enter') handleAdd()
  }

  const handleSaveTarget = async (ticker: string) => {
    const val = parseFloat(editTargetValue)
    if (editTargetValue === '') {
      await setTarget(ticker, null)
    } else if (!isNaN(val) && val > 0) {
      await setTarget(ticker, val)
    }
    setEditingTarget(null)
    setEditTargetValue('')
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-2">Watchlist</h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          Stocks you are tracking but have not yet purchased. Set a target entry price to get
          notified when the stock hits it.
        </p>
      </div>

      {/* Add form */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 mb-8">
        <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-4 uppercase tracking-widest">
          Add to watchlist
        </p>

        <div className="grid grid-cols-[130px_1fr_130px_auto] gap-4 items-start">
          {/* Ticker */}
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              value={ticker}
              onChange={(e) => handleTickerChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="TSLA"
              maxLength={6}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono uppercase"
            />
            <span className="text-[11px] h-4 px-1">
              {lookupStatus === 'loading' && <span className="text-zinc-400">Looking up…</span>}
              {lookupStatus === 'found' && <span className="text-green-500">✓ Found</span>}
              {lookupStatus === 'not-found' && <span className="text-red-400">Not found</span>}
            </span>
          </div>

          {/* Company name */}
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Company name"
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            <span className="h-4" />
          </div>

          {/* Target price (optional) */}
          <div className="flex flex-col gap-1.5">
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Target $"
              min="0"
              step="any"
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            <span className="text-[11px] h-4 px-1 text-zinc-300 dark:text-zinc-600">optional</span>
          </div>

          {/* Add button */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={handleAdd}
              disabled={adding || !ticker || !name}
              className="px-5 py-2.5 text-sm rounded-lg bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {adding ? '…' : '+ Watch'}
            </button>
            <span className="h-4" />
          </div>
        </div>

        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>

      {/* Watchlist table */}
      {loading ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading…</p>
      ) : stocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 py-12 text-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">Nothing on your watchlist yet.</p>
          <p className="text-xs text-zinc-300 dark:text-zinc-600 mt-2">
            Add a stock above to start tracking it.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-20">
                  Ticker
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24">
                  Price
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24">
                  Change
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-28">
                  Target
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock, i) => (
                <tr
                  key={stock.ticker}
                  className={`${i < stocks.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800' : ''} transition-colors ${
                    stock.atTarget
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <td className="px-4 py-3 font-mono font-semibold text-zinc-800 dark:text-zinc-100 tracking-wide">
                    <span className="flex items-center gap-1.5">
                      {stock.ticker}
                      {stock.atTarget && <span title="At or below target price">🎯</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{stock.name}</td>
                  <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-300 tabular-nums">
                    {stock.price === null ? (
                      <span className="text-zinc-400 dark:text-zinc-500">--</span>
                    ) : (
                      currencyFormatter.format(stock.price)
                    )}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums ${
                      stock.changePercent === null
                        ? 'text-zinc-400 dark:text-zinc-500'
                        : stock.changePercent > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : stock.changePercent < 0
                            ? 'text-red-500 dark:text-red-400'
                            : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {stock.changePercent === null ? '--' : formatSignedPercent(stock.changePercent)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {editingTarget === stock.ticker ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          value={editTargetValue}
                          onChange={(e) => setEditTargetValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTarget(stock.ticker)
                            if (e.key === 'Escape') {
                              setEditingTarget(null)
                              setEditTargetValue('')
                            }
                          }}
                          placeholder="0.00"
                          min="0"
                          step="any"
                          autoFocus
                          className="w-20 px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 text-right"
                        />
                        <button
                          onClick={() => handleSaveTarget(stock.ticker)}
                          className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 font-medium"
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingTarget(stock.ticker)
                          setEditTargetValue(stock.targetPrice?.toString() ?? '')
                        }}
                        className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
                        title="Edit target price"
                      >
                        {stock.targetPrice !== null ? (
                          currencyFormatter.format(stock.targetPrice)
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-600 text-xs">
                            Set target
                          </span>
                        )}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => remove(stock.ticker)}
                      className="text-zinc-300 dark:text-zinc-600 hover:text-red-400 dark:hover:text-red-400 transition-colors text-lg leading-none"
                      title={`Remove ${stock.ticker}`}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {stocks.length} {stocks.length === 1 ? 'stock' : 'stocks'} on watchlist
              {stocks.some((s) => s.atTarget) && (
                <span className="ml-2 text-green-600 dark:text-green-400">
                  · {stocks.filter((s) => s.atTarget).length} at target 🎯
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
