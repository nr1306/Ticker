export default function Alerts() {
  return (
    <div className="p-6">
      <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-1">
        Smart Alerts
      </h2>
      <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-6">
        Set price floor, ceiling, or % change thresholds. Alerts fire as quiet desktop
        notifications.
      </p>

      <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 p-8 text-center">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">No alerts configured.</p>
        <p className="text-xs text-zinc-300 dark:text-zinc-600 mt-1">Coming in v0.8.0.</p>
      </div>
    </div>
  )
}
