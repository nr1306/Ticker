import { useEffect, useState, useRef } from 'react'
import { usePortfolioStore } from '../stores/portfolioStore'

type LookupStatus = 'idle' | 'loading' | 'found' | 'not-found'

export default function Portfolio() {
  const { stocks, loading, fetch, add, remove } = usePortfolioStore()

  const [ticker, setTicker] = useState('')
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch()
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
    const qty = parseFloat(quantity)
    if (!ticker) return setError('Enter a ticker symbol.')
    if (!name) return setError('Enter the company name.')
    if (isNaN(qty) || qty <= 0) return setError('Enter a valid quantity greater than 0.')

    setAdding(true)
    setError('')
    try {
      await add(ticker, name, qty)
      setTicker('')
      setName('')
      setQuantity('')
      setLookupStatus('idle')
    } catch {
      setError('Failed to add stock. Try again.')
    } finally {
      setAdding(false)
    }
  }

  const handleKeyDown = (e: { key: string }) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-1">Portfolio</h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          Stocks you currently own. Live prices appear after v0.5.0.
        </p>
      </div>

      {/* Add stock form */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 mb-6">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">
          Add stock
        </p>
        <div className="flex gap-2 items-start flex-wrap">
          {/* Ticker */}
          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={ticker}
              onChange={(e) => handleTickerChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="AAPL"
              maxLength={6}
              className="w-24 px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono uppercase"
            />
            <span className="text-[10px] h-3">
              {lookupStatus === 'loading' && <span className="text-zinc-400">Looking up…</span>}
              {lookupStatus === 'found' && <span className="text-green-500">✓ Found</span>}
              {lookupStatus === 'not-found' && <span className="text-red-400">Not found</span>}
            </span>
          </div>

          {/* Name */}
          <div className="flex-1 min-w-40 flex flex-col gap-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Company name"
              className="w-full px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            <span className="h-3" />
          </div>

          {/* Quantity */}
          <div className="flex flex-col gap-1">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Qty"
              min="0"
              step="any"
              className="w-24 px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            <span className="h-3" />
          </div>

          {/* Add button */}
          <div className="flex flex-col gap-1">
            <button
              onClick={handleAdd}
              disabled={adding || !ticker || !name}
              className="px-4 py-1.5 text-sm rounded-md bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {adding ? '…' : '+ Add'}
            </button>
            <span className="h-3" />
          </div>
        </div>

        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>

      {/* Stocks table */}
      {loading ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading…</p>
      ) : stocks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 p-8 text-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">No stocks added yet.</p>
          <p className="text-xs text-zinc-300 dark:text-zinc-600 mt-1">
            Add your first stock above.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-20">
                  Ticker
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24">
                  Shares
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock, i) => (
                <tr
                  key={stock.ticker}
                  className={`${i < stocks.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800' : ''} hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors`}
                >
                  <td className="px-4 py-3 font-mono font-semibold text-zinc-800 dark:text-zinc-100">
                    {stock.ticker}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{stock.name}</td>
                  <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-300 tabular-nums">
                    {stock.quantity}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => remove(stock.ticker)}
                      className="text-zinc-300 dark:text-zinc-600 hover:text-red-400 dark:hover:text-red-400 transition-colors text-base leading-none"
                      title={`Remove ${stock.ticker}`}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {stocks.length} {stocks.length === 1 ? 'stock' : 'stocks'} in portfolio
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
