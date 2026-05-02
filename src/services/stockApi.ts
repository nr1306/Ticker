import axios from 'axios'
import log from 'electron-log'
import type { PriceUpdate } from '../shared/types'

// Uses Yahoo Finance v8 chart API directly — no crumb or auth required
const YF_CHART_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9'
}

interface YFChartMeta {
  symbol: string
  regularMarketPrice: number
  chartPreviousClose?: number
  previousClose?: number
}

async function fetchSinglePrice(ticker: string): Promise<PriceUpdate | null> {
  try {
    const { data } = await axios.get(`${YF_CHART_BASE}/${ticker}`, {
      params: { interval: '1d', range: '1d' },
      headers: HEADERS,
      timeout: 15000
    })

    const meta: YFChartMeta | undefined = data?.chart?.result?.[0]?.meta
    if (!meta?.regularMarketPrice) {
      log.warn(`stockApi: no price data for ${ticker}`)
      return null
    }

    const prevClose = meta.chartPreviousClose ?? meta.previousClose
    const changePercent = prevClose ? ((meta.regularMarketPrice - prevClose) / prevClose) * 100 : 0

    return {
      ticker: meta.symbol ?? ticker.toUpperCase(),
      price: meta.regularMarketPrice,
      changePercent
    }
  } catch (err) {
    log.warn(`stockApi: failed to fetch ${ticker}:`, err)
    return null
  }
}

export async function fetchPrices(tickers: string[]): Promise<PriceUpdate[]> {
  if (tickers.length === 0) return []

  const results: (PriceUpdate | null)[] = []
  for (const ticker of tickers) {
    results.push(await fetchSinglePrice(ticker))
  }
  return results.filter((r): r is PriceUpdate => r !== null)
}
