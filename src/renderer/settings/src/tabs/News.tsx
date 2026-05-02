import { useEffect } from 'react'
import { useNewsStore } from '../stores/newsStore'

function formatRelativeTime(publishedAt: string): string {
  const diff = Date.now() - new Date(publishedAt).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function News() {
  const news = useNewsStore((s) => s.news)
  const loading = useNewsStore((s) => s.loading)
  const fetch = useNewsStore((s) => s.fetch)
  const markRead = useNewsStore((s) => s.markRead)
  const refresh = useNewsStore((s) => s.refresh)

  useEffect(() => {
    if (news.length === 0) fetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleHeadlineClick = (id: number, url: string) => {
    markRead(id)
    window.api.openExternal(url)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-1">
            News Pulse
          </h2>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Today&apos;s headlines for your tracked stocks.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading && news.length === 0 ? (
        <div className="text-center py-12 text-sm text-zinc-400 dark:text-zinc-500">
          Loading news...
        </div>
      ) : news.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 p-8 text-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">No news for today.</p>
          <p className="text-xs text-zinc-300 dark:text-zinc-600 mt-1">
            Add stocks to your portfolio or watchlist to see headlines.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {news.map((item) => (
            <button
              key={item.id}
              onClick={() => handleHeadlineClick(item.id, item.url)}
              className={`text-left w-full px-4 py-3 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                item.read ? 'opacity-40' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                  {item.ticker}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-800 dark:text-zinc-100 leading-snug line-clamp-2">
                    {item.headline}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    {item.source} · {formatRelativeTime(item.publishedAt)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
