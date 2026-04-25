import { ipcMain } from 'electron'
import yahooFinance from 'yahoo-finance2'
import log from 'electron-log'

interface TickerLookupResult {
  ticker: string
  name: string
  valid: boolean
}

export function registerTickerHandlers(): void {
  ipcMain.handle('ticker:lookup', async (_e, ticker: string): Promise<TickerLookupResult> => {
    const upper = ticker.toUpperCase().trim()
    if (!upper) return { ticker: upper, name: '', valid: false }

    try {
      const result = await yahooFinance.quoteSummary(upper, { modules: ['price'] })
      const name = result.price?.longName ?? result.price?.shortName ?? upper
      return { ticker: upper, name, valid: true }
    } catch (e) {
      log.warn(`ticker:lookup failed for ${upper}:`, e)
      return { ticker: upper, name: '', valid: false }
    }
  })
}
