export default function News() {
  return (
    <div className="p-6">
      <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-1">News Pulse</h2>
      <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-6">
        High-signal headlines for your portfolio and watchlist stocks only. No clickbait, no generic
        market commentary.
      </p>

      <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 p-8 text-center">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">No news loaded yet.</p>
        <p className="text-xs text-zinc-300 dark:text-zinc-600 mt-1">Coming in v0.9.0.</p>
      </div>
    </div>
  )
}
