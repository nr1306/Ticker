import { BrowserWindow } from 'electron'
import log from 'electron-log'
import {
  getPortfolio,
  getWatchlist,
  clearNewsBeforeToday,
  cacheNewsItems,
  getCachedNews
} from '../services/db'
import { fetchNewsForTickers } from '../services/newsApi'
import { getSettingsWindow } from './settingsWindow'
import type { NewsItem } from '../shared/types'

export async function fetchAndCacheNews(floatingWindow: BrowserWindow): Promise<void> {
  const portfolio = getPortfolio()
  const watchlist = getWatchlist()
  const tickers = [
    ...new Set([...portfolio.map((s) => s.ticker), ...watchlist.map((s) => s.ticker)])
  ]

  if (tickers.length === 0) {
    log.info('newsFetcher: no tickers, skipping')
    broadcast(floatingWindow, [])
    return
  }

  clearNewsBeforeToday()

  try {
    const items = await fetchNewsForTickers(tickers)
    if (items.length > 0) {
      cacheNewsItems(items)
      log.info(`newsFetcher: cached ${items.length} articles for [${tickers.join(', ')}]`)
    }
  } catch (err) {
    log.warn('newsFetcher: fetch failed', err)
  }

  broadcast(floatingWindow, getCachedNews())
}

function broadcast(floatingWindow: BrowserWindow, news: NewsItem[]): void {
  for (const win of [floatingWindow, getSettingsWindow()]) {
    if (win && !win.isDestroyed()) win.webContents.send('news:update', news)
  }
}
