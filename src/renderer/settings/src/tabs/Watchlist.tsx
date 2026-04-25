export default function Watchlist() {
  return (
    <div className="p-6">
      <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-1">Watchlist</h2>
      <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-6">
        Stocks you are tracking but have not yet purchased. Set a target entry price per stock.
      </p>

      <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 p-8 text-center">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Your watchlist is empty.</p>
        <p className="text-xs text-zinc-300 dark:text-zinc-600 mt-1">Coming in v0.7.0.</p>
      </div>
    </div>
  )
}
