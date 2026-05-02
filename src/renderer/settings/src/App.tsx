import { useEffect, useState } from 'react'
import Portfolio from './tabs/Portfolio'
import Watchlist from './tabs/Watchlist'
import Alerts from './tabs/Alerts'
import News from './tabs/News'
import Recommendations from './tabs/Recommendations'
import SettingsTab from './tabs/SettingsTab'
import { usePortfolioStore } from './stores/portfolioStore'
import { useWatchlistStore } from './stores/watchlistStore'
import { useNewsStore } from './stores/newsStore'

const TABS = ['Portfolio', 'Watchlist', 'Alerts', 'News', 'Recommendations', 'Settings'] as const
type Tab = (typeof TABS)[number]

const TAB_ICONS: Record<Tab, string> = {
  Portfolio: '📈',
  Watchlist: '👁',
  Alerts: '🔔',
  News: '📰',
  Recommendations: '✨',
  Settings: '⚙'
}

function renderTab(tab: Tab) {
  switch (tab) {
    case 'Portfolio':
      return <Portfolio />
    case 'Watchlist':
      return <Watchlist />
    case 'Alerts':
      return <Alerts />
    case 'News':
      return <News />
    case 'Recommendations':
      return <Recommendations />
    case 'Settings':
      return <SettingsTab />
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Portfolio')
  const applyToPortfolio = usePortfolioStore((s) => s.applyPriceUpdates)
  const applyToWatchlist = useWatchlistStore((s) => s.applyPriceUpdates)
  const applyNewsUpdate = useNewsStore((s) => s.applyUpdate)

  useEffect(
    () =>
      window.api.onPricesUpdate((updates) => {
        applyToPortfolio(updates)
        applyToWatchlist(updates)
      }),
    [applyToPortfolio, applyToWatchlist]
  )

  useEffect(() => window.api.onNewsUpdate(applyNewsUpdate), [applyNewsUpdate])

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 overflow-hidden">
      {/* Sidebar — wider and more spacious */}
      <aside className="w-56 shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
        <div className="px-5 py-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold text-zinc-800 dark:text-zinc-100">Ticker</span>
            <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
              v0.9.0
            </span>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Stock Companion</p>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-left text-sm px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${
                activeTab === tab
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <span className="text-base leading-none w-5 text-center">{TAB_ICONS[tab]}</span>
              {tab}
            </button>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-[11px] text-zinc-300 dark:text-zinc-600 leading-snug">
            Information only.
            <br />
            No trades executed.
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{renderTab(activeTab)}</main>
    </div>
  )
}
