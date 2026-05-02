import { useRecommendationsStore } from '../stores/recommendationsStore'
import type { Recommendation } from '../../../../shared/types'

const CONFIDENCE_STYLES: Record<Recommendation['confidence'], string> = {
  High: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  Low: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
}

function RecCard({ rec }: { rec: Recommendation }) {
  return (
    <div className="px-4 py-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
          {rec.ticker}
        </span>
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${CONFIDENCE_STYLES[rec.confidence]}`}
        >
          {rec.confidence} confidence
        </span>
      </div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{rec.reasoning}</p>
    </div>
  )
}

export default function Recommendations() {
  const recs = useRecommendationsStore((s) => s.recs)
  const loading = useRecommendationsStore((s) => s.loading)
  const fetch = useRecommendationsStore((s) => s.fetch)

  const holdings = recs.filter((r) => r.category === 'holding')
  const discoveries = recs.filter((r) => r.category === 'discovery')

  const generatedAt = recs[0]?.generatedAt
    ? new Date(recs[0].generatedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-1">
            AI Recommendations
          </h2>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Insights from GPT-4o based on your portfolio, watchlist, and recent news.
          </p>
          {generatedAt && (
            <p className="text-xs text-zinc-300 dark:text-zinc-600 mt-0.5">
              Generated {generatedAt}
            </p>
          )}
        </div>
        <button
          onClick={fetch}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors shrink-0"
        >
          {loading ? 'Generating...' : 'Refresh'}
        </button>
      </div>

      {loading && recs.length === 0 ? (
        <div className="text-center py-16 text-sm text-zinc-400 dark:text-zinc-500">
          Asking GPT-4o for insights...
        </div>
      ) : recs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 p-8 text-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">No recommendations yet.</p>
          <p className="text-xs text-zinc-300 dark:text-zinc-600 mt-1">
            Add stocks to your portfolio or watchlist, then click Refresh.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {holdings.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-3">
                Your Holdings
              </h3>
              <div className="flex flex-col gap-2">
                {holdings.map((rec) => (
                  <RecCard key={rec.id} rec={rec} />
                ))}
              </div>
            </section>
          )}

          {discoveries.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-3">
                Worth Discovering
              </h3>
              <div className="flex flex-col gap-2">
                {discoveries.map((rec) => (
                  <RecCard key={rec.id} rec={rec} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
