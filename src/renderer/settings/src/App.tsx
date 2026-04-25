import { useState } from 'react'

const TABS = ['Portfolio', 'Watchlist', 'Alerts', 'News', 'Recommendations', 'Settings'] as const
type Tab = (typeof TABS)[number]

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Portfolio')

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
      <aside className="w-44 shrink-0 border-r border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-1">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Ticker</span>
          <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
            v0.1.0
          </span>
        </div>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <h2 className="text-base font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
          {activeTab}
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          {activeTab} will be built in an upcoming version.
        </p>
      </main>
    </div>
  )
}
