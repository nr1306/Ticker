import { useState } from 'react'

export default function App() {
  const [hovered, setHovered] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

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
          <span className="text-[11px] font-semibold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase select-none">
            Ticker
          </span>
          <div className="flex items-center gap-2">
            <button
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors text-xs leading-none"
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? '▲' : '▼'}
            </button>
            <button
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors text-sm leading-none"
              onClick={() => window.api.openSettings()}
              title="Open Settings"
            >
              ⚙
            </button>
          </div>
        </div>

        {/* Body — hidden when collapsed */}
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Add stocks in Settings to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
