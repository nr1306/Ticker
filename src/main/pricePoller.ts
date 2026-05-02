import { BrowserWindow } from 'electron'
import log from 'electron-log'
import { getPortfolio, getWatchlist, getSettings } from '../services/db'
import type { PriceUpdate } from '../shared/types'
import { fetchPrices } from '../services/stockApi'
import { getSettingsWindow } from './settingsWindow'
import { evaluateAlerts } from './alertEvaluator'

let pollTimer: ReturnType<typeof setTimeout> | null = null
let consecutiveFailures = 0
let latestPrices = new Map<string, PriceUpdate>()
const MAX_BACKOFF_MS = 10 * 60 * 1000 // 10 minutes

export function startPricePoller(floatingWindow: BrowserWindow): void {
  if (pollTimer) {
    clearTimeout(pollTimer)
  }
  consecutiveFailures = 0
  log.info('Price poller starting')
  // 3s initial delay — gives Yahoo Finance crumb fetch time to settle after cold start
  schedulePoll(floatingWindow, 3000)
}

export function stopPricePoller(): void {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
    log.info('Price poller stopped')
  }
}

export function getLatestPriceUpdate(ticker: string): PriceUpdate | null {
  return latestPrices.get(ticker.toUpperCase()) ?? null
}

function schedulePoll(floatingWindow: BrowserWindow, delayMs: number): void {
  pollTimer = setTimeout(() => runPoll(floatingWindow), delayMs)
}

async function runPoll(floatingWindow: BrowserWindow): Promise<void> {
  // Deduplicate tickers across portfolio and watchlist
  const portfolio = getPortfolio()
  const watchlist = getWatchlist()
  const tickers = [
    ...new Set([...portfolio.map((s) => s.ticker), ...watchlist.map((s) => s.ticker)])
  ]

  if (tickers.length === 0) {
    latestPrices.clear()
    log.info('Price poller: no tickers to poll, will retry after interval')
    const intervalMs = getSettings().pollIntervalSeconds * 1000
    schedulePoll(floatingWindow, intervalMs)
    return
  }

  try {
    const prices = await fetchPrices(tickers)
    latestPrices = new Map(prices.map((update) => [update.ticker.toUpperCase(), update]))

    broadcastPriceUpdates(floatingWindow, prices)
    const settingsWin = getSettingsWindow()
    evaluateAlerts(prices, [floatingWindow, ...(settingsWin ? [settingsWin] : [])])

    consecutiveFailures = 0
    log.info(`Price poller: pushed ${prices.length} updates (${tickers.join(', ')})`)

    const intervalMs = getSettings().pollIntervalSeconds * 1000
    schedulePoll(floatingWindow, intervalMs)
  } catch (err) {
    consecutiveFailures++

    // First failure retries in 15s (likely a transient 429); then exponential up to MAX_BACKOFF_MS
    const baseMs = getSettings().pollIntervalSeconds * 1000
    const backoffMs =
      consecutiveFailures === 1
        ? 15_000
        : Math.min(baseMs * Math.pow(2, consecutiveFailures - 1), MAX_BACKOFF_MS)

    log.warn(
      `Price poller: fetch failed (consecutive failures: ${consecutiveFailures}), retrying in ${backoffMs / 1000}s`,
      err
    )

    schedulePoll(floatingWindow, backoffMs)
  }
}

function broadcastPriceUpdates(floatingWindow: BrowserWindow, prices: PriceUpdate[]): void {
  const windows = [floatingWindow, getSettingsWindow()]

  for (const window of windows) {
    if (window && !window.isDestroyed()) {
      window.webContents.send('prices:update', prices)
    }
  }
}
