import { useState } from 'react'

export default function App() {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{ opacity: hovered ? 1 : 0.4 }}
      className="transition-opacity duration-200 w-[300px]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="drag-region rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 shadow-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
            Ticker
          </span>
          <button
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors text-sm leading-none"
            onClick={() => window.api.openSettings()}
            title="Open Settings"
          >
            ⚙
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          Add stocks in Settings to get started.
        </p>
      </div>
    </div>
  )
}
