import { ipcMain } from 'electron'
import log from 'electron-log'

interface TickerLookupResult {
  ticker: string
  name: string
  valid: boolean
}

// yahoo-finance2 is ESM-only — load once via dynamic import in CJS context
type YahooFinance = InstanceType<typeof import('yahoo-finance2').default>

let _yf: YahooFinance | null = null

async function getYF(): Promise<YahooFinance> {
  if (!_yf) {
    const YahooFinance = (await import('yahoo-finance2')).default
    _yf = new YahooFinance()
  }
  return _yf
}

export function registerTickerHandlers(): void {
  ipcMain.handle('ticker:lookup', async (_e, ticker: string): Promise<TickerLookupResult> => {
    const upper = ticker.toUpperCase().trim()
    if (!upper) return { ticker: upper, name: '', valid: false }

    try {
      const yf = await getYF()
      const result = await yf.quote(upper)
      const name = result.longName ?? result.shortName ?? upper
      const valid =
        result.regularMarketPrice != null || result.longName != null || result.shortName != null

      return {
        ticker: upper,
        name: valid ? name : '',
        valid
      }
    } catch (e) {
      log.warn(`ticker:lookup failed for ${upper}:`, e)
      return { ticker: upper, name: '', valid: false }
    }
  })
}
