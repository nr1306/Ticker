import OpenAI from 'openai'
import axios from 'axios'
import log from 'electron-log'
import type { Recommendation, PriceUpdate } from '../shared/types'

type RecInput = Omit<Recommendation, 'id'>

interface PortfolioRow {
  ticker: string
  name: string
  quantity: number
}

interface WatchlistRow {
  ticker: string
  name: string
  target_price: number | null
}

async function fetchIPONews(newsApiKey: string): Promise<string[]> {
  try {
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data } = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: 'IPO OR "going public" OR "initial public offering" OR "stock market debut" OR "emerging company"',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 8,
        from,
        apiKey: newsApiKey
      },
      timeout: 10000
    })
    if (data.status === 'error' || !Array.isArray(data.articles)) return []
    return data.articles
      .filter((a: { title?: string }) => a.title)
      .map((a: { title: string }) => a.title as string)
  } catch {
    return []
  }
}

export async function generateRecommendations(
  portfolio: PortfolioRow[],
  watchlist: WatchlistRow[],
  priceMap: Map<string, PriceUpdate>,
  newsByTicker: Record<string, string[]>
): Promise<RecInput[]> {
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    log.warn('recommendationsService: OPENAI_API_KEY not set')
    return []
  }

  const generatedAt = new Date().toISOString()

  const portfolioLines = portfolio.map((s) => {
    const p = priceMap.get(s.ticker)
    const priceStr = p
      ? `$${p.price.toFixed(2)} (${p.changePercent >= 0 ? '+' : ''}${p.changePercent.toFixed(2)}%)`
      : 'price unavailable'
    return `  ${s.ticker} (${s.name}): ${s.quantity} shares @ ${priceStr}`
  })

  const watchlistLines = watchlist.map((s) => {
    const p = priceMap.get(s.ticker)
    const priceStr = p
      ? `$${p.price.toFixed(2)} (${p.changePercent >= 0 ? '+' : ''}${p.changePercent.toFixed(2)}%)`
      : 'price unavailable'
    const target = s.target_price ? `, target $${s.target_price.toFixed(2)}` : ''
    return `  ${s.ticker} (${s.name}): ${priceStr}${target}`
  })

  const newsSection = Object.entries(newsByTicker)
    .map(
      ([ticker, headlines]) =>
        `  ${ticker}:\n${headlines
          .slice(0, 3)
          .map((h) => `    - ${h}`)
          .join('\n')}`
    )
    .join('\n')

  const newsApiKey = process.env.NEWS_API_KEY
  const ipoHeadlines = newsApiKey ? await fetchIPONews(newsApiKey) : []
  const ipoSection =
    ipoHeadlines.length > 0
      ? `\nEmerging & IPO news:\n${ipoHeadlines.map((h) => `  - ${h}`).join('\n')}`
      : ''

  const allTickers = [
    ...new Set([...portfolio.map((s) => s.ticker), ...watchlist.map((s) => s.ticker)])
  ]
  if (allTickers.length === 0 && ipoHeadlines.length === 0) return []

  const systemPrompt = `You are a financial awareness assistant for a stock companion app used by working professionals who track their investments passively. Your role is to provide brief, practical insights — NOT buy/sell advice. Use language like "worth watching", "showing strength", "holding steady", "consider monitoring", "momentum building". Keep each reasoning to 2-3 concise sentences. Always respond with valid JSON only — no markdown, no explanation outside the JSON.`

  const userPrompt = `Generate stock insights based on this context:

Portfolio holdings:
${portfolioLines.length > 0 ? portfolioLines.join('\n') : '  (none)'}

Watchlist:
${watchlistLines.length > 0 ? watchlistLines.join('\n') : '  (none)'}

Recent news:
${newsSection || '  (none)'}
${ipoSection}

Return a JSON object with a "recommendations" array. For each portfolio/watchlist ticker use category "holding". For any interesting emerging or IPO companies discovered from the news, use category "discovery" with the ticker symbol if known.

{
  "recommendations": [
    {
      "ticker": "AAPL",
      "reasoning": "...",
      "confidence": "High",
      "category": "holding"
    }
  ]
}`

  try {
    const openai = new OpenAI({ apiKey: openaiKey })
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1000
    })

    const content = response.choices[0]?.message?.content
    if (!content) return []

    const parsed = JSON.parse(content)
    const recs: unknown[] = Array.isArray(parsed) ? parsed : (parsed.recommendations ?? [])

    log.info(`recommendationsService: generated ${recs.length} recommendations`)

    return recs
      .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
      .map((r) => ({
        ticker: String(r.ticker ?? '').toUpperCase(),
        reasoning: String(r.reasoning ?? ''),
        confidence: (['High', 'Medium', 'Low'].includes(String(r.confidence))
          ? String(r.confidence)
          : 'Medium') as 'High' | 'Medium' | 'Low',
        category: (String(r.category) === 'discovery' ? 'discovery' : 'holding') as
          | 'holding'
          | 'discovery',
        generatedAt
      }))
      .filter((r) => r.ticker && r.reasoning)
  } catch (err) {
    log.warn('recommendationsService: OpenAI call failed', err)
    return []
  }
}
