import { BrowserWindow } from 'electron'
import log from 'electron-log'
import {
  getPortfolio,
  getWatchlist,
  getCachedNews,
  cacheRecommendations,
  getCachedRecommendations
} from '../services/db'
import { generateRecommendations } from '../services/recommendationsService'
import { getLatestPriceUpdate } from './pricePoller'
import { getSettingsWindow } from './settingsWindow'
import type { Recommendation, PriceUpdate } from '../shared/types'

export async function generateAndBroadcastRecommendations(
  floatingWindow: BrowserWindow
): Promise<Recommendation[]> {
  const portfolio = getPortfolio()
  const watchlist = getWatchlist()

  const allTickers = [
    ...new Set([...portfolio.map((s) => s.ticker), ...watchlist.map((s) => s.ticker)])
  ]

  const priceMap = new Map<string, PriceUpdate>()
  for (const ticker of allTickers) {
    const update = getLatestPriceUpdate(ticker)
    if (update) priceMap.set(ticker, update)
  }

  const cachedNews = getCachedNews()
  const newsByTicker: Record<string, string[]> = {}
  for (const item of cachedNews) {
    if (!newsByTicker[item.ticker]) newsByTicker[item.ticker] = []
    newsByTicker[item.ticker].push(item.headline)
  }

  log.info('recommendationsFetcher: generating recommendations via GPT-4o')

  const recs = await generateRecommendations(portfolio, watchlist, priceMap, newsByTicker)

  if (recs.length > 0) {
    cacheRecommendations(recs)
    log.info(`recommendationsFetcher: cached ${recs.length} recommendations`)
  }

  const result = getCachedRecommendations()
  broadcast(floatingWindow, result)
  return result
}

function broadcast(floatingWindow: BrowserWindow, recs: Recommendation[]): void {
  for (const win of [floatingWindow, getSettingsWindow()]) {
    if (win && !win.isDestroyed()) win.webContents.send('recommendations:ready', recs)
  }
}
