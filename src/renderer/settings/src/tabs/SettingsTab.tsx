export default function SettingsTab() {
  return (
    <div className="p-6">
      <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-1">Settings</h2>
      <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-6">
        Configure poll interval, widget position, opacity, and refresh preferences.
      </p>

      <div className="space-y-4 max-w-sm">
        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Price refresh interval
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              How often to poll stock prices
            </p>
          </div>
          <span className="text-xs text-zinc-300 dark:text-zinc-600">60s (default)</span>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Widget position</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Corner of the screen</p>
          </div>
          <span className="text-xs text-zinc-300 dark:text-zinc-600">Top-right (default)</span>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Idle opacity</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Widget opacity when not hovered
            </p>
          </div>
          <span className="text-xs text-zinc-300 dark:text-zinc-600">40% (default)</span>
        </div>

        <p className="text-xs text-zinc-300 dark:text-zinc-600 pt-2">
          Full settings controls coming in v1.3.0.
        </p>
      </div>
    </div>
  )
}
