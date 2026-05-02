import axios from 'axios'
import log from 'electron-log'
import type { NewsItem } from '../shared/types'

type NewsCacheInput = Omit<NewsItem, 'id' | 'summary' | 'read'>

const BASE = 'https://newsapi.org/v2/everything'

interface NewsApiArticle {
  title: string
  source: { name?: string }
  url: string
  publishedAt: string
}

async function fetchForTicker(
  ticker: string,
  apiKey: string,
  fromDate: string
): Promise<NewsCacheInput[]> {
  try {
    const { data } = await axios.get(BASE, {
      params: {
        q: ticker,
        from: fromDate,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 5,
        apiKey
      },
      timeout: 10000
    })

    if (data.status === 'error') {
      log.warn(`newsApi: API error for ${ticker}: [${data.code}] ${data.message}`)
      return []
    }

    if (!Array.isArray(data.articles)) return []

    log.info(
      `newsApi: ${ticker} → ${data.articles.length} articles (totalResults: ${data.totalResults})`
    )

    return data.articles
      .filter((a: NewsApiArticle) => a.title && a.url)
      .map((a: NewsApiArticle) => ({
        ticker: ticker.toUpperCase(),
        headline: a.title,
        source: a.source?.name ?? 'Unknown',
        url: a.url,
        publishedAt: a.publishedAt
      }))
  } catch (err) {
    log.warn(`newsApi: fetch failed for ${ticker}`, err)
    return []
  }
}

export async function fetchNewsForTickers(tickers: string[]): Promise<NewsCacheInput[]> {
  if (tickers.length === 0) return []
  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) {
    log.warn('newsApi: NEWS_API_KEY not set, skipping')
    return []
  }

  // Use 3-day lookback — NewsAPI free tier has a ~24h indexing delay for today's articles
  const from = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  log.info(`newsApi: fetching for [${tickers.join(', ')}] from ${from}`)

  const results = await Promise.all(tickers.map((t) => fetchForTicker(t, apiKey, from)))
  const flat = results.flat()
  log.info(`newsApi: total ${flat.length} articles across all tickers`)
  return flat
}
