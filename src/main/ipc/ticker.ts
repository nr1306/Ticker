import { ipcMain } from 'electron'
import axios from 'axios'
import log from 'electron-log'

interface TickerLookupResult {
  ticker: string
  name: string
  valid: boolean
}

interface YFSearchQuote {
  symbol: string
  longname?: string
  shortname?: string
  quoteType?: string
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json'
}

export function registerTickerHandlers(): void {
  ipcMain.handle('ticker:lookup', async (_e, ticker: string): Promise<TickerLookupResult> => {
    const upper = ticker.toUpperCase().trim()
    if (!upper) return { ticker: upper, name: '', valid: false }

    try {
      const { data } = await axios.get('https://query1.finance.yahoo.com/v1/finance/search', {
        params: {
          q: upper,
          quotesCount: 5,
          newsCount: 0,
          enableFuzzyQuery: false
        },
        headers: HEADERS,
        timeout: 6000
      })

      const quotes: YFSearchQuote[] = data?.quotes ?? []

      // Find exact symbol match first, then fall back to first result
      const match =
        quotes.find((q) => q.symbol === upper && q.quoteType === 'EQUITY') ??
        quotes.find((q) => q.symbol === upper) ??
        quotes.find((q) => q.quoteType === 'EQUITY')

      if (!match) {
        return { ticker: upper, name: '', valid: false }
      }

      const name = match.longname ?? match.shortname ?? upper
      return { ticker: upper, name, valid: true }
    } catch (e) {
      log.warn(`ticker:lookup failed for ${upper}:`, e)
      return { ticker: upper, name: '', valid: false }
    }
  })
}
