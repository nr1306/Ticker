import { useState, useEffect } from 'react'
import type { PortfolioStock, PriceUpdate } from '../../../../shared/types'

function StockRow({ stock }: { stock: PortfolioStock }) {
  const hasPrice = stock.price !== null
  const positive = (stock.changePercent ?? 0) >= 0

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-100/60 dark:border-zinc-800/60 last:border-0">
      <span className="w-12 text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-100 shrink-0">
        {stock.ticker}
      </span>
      <span className="flex-1 text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
        {hasPrice ? `$${stock.price!.toFixed(2)}` : '—'}
      </span>
      <span
        className={`text-[11px] font-medium tabular-nums shrink-0 ${
          !hasPrice
            ? 'text-zinc-300 dark:text-zinc-600'
            : positive
              ? 'text-green-500'
              : 'text-red-400'
        }`}
      >
        {hasPrice ? `${positive ? '+' : ''}${stock.changePercent!.toFixed(2)}%` : '—'}
      </span>
    </div>
  )
}

export default function App() {
  const [hovered, setHovered] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [stocks, setStocks] = useState<PortfolioStock[]>([])

  useEffect(() => {
    // Load current portfolio with any already-cached prices
    window.api.portfolio.getAll().then(setStocks)

    // Subscribe to live price updates from the poller
    const unsub = window.api.onPricesUpdate((updates: PriceUpdate[]) => {
      setStocks((prev) => {
        const map = new Map(updates.map((u) => [u.ticker, u]))
        return prev.map((stock) => {
          const live = map.get(stock.ticker)
          if (!live) return stock
          return { ...stock, price: live.price, changePercent: live.changePercent }
        })
      })
    })

    return unsub
  }, [])

  return (
    <div
      style={{ opacity: hovered ? 1 : 0.4 }}
      className="transition-opacity duration-200 w-[300px]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 shadow-lg overflow-hidden">
        {/* Header — drag region */}
        <div className="drag-region flex items-center justify-between px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-[10px] font-semibold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase select-none">
            Ticker
          </span>
          <div className="flex items-center gap-2">
            <button
              className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors leading-none"
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? '▲' : '▼'}
            </button>
            <button
              className="text-base text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors p-1 rounded"
              onClick={() => window.api.openSettings()}
              title="Open Settings"
            >
              ⚙
            </button>
          </div>
        </div>

        {/* Stock rows */}
        {!collapsed && (
          <div>
            {stocks.length === 0 ? (
              <div className="px-3 py-2.5">
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  Add stocks in Settings to get started.
                </p>
              </div>
            ) : (
              stocks.map((stock) => <StockRow key={stock.ticker} stock={stock} />)
            )}
          </div>
        )}
      </div>
    </div>
  )
}
