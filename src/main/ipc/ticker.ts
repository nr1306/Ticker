import { ipcMain } from 'electron'
import log from 'electron-log'

interface TickerLookupResult {
  ticker: string
  name: string
  valid: boolean
}

// yahoo-finance2 is ESM-only — load once via dynamic import in CJS context
let _yf: typeof import('yahoo-finance2').default | null = null
async function getYF() {
  if (!_yf) _yf = (await import('yahoo-finance2')).default
  return _yf
}

export function registerTickerHandlers(): void {
  ipcMain.handle('ticker:lookup', async (_e, ticker: string): Promise<TickerLookupResult> => {
    const upper = ticker.toUpperCase().trim()
    if (!upper) return { ticker: upper, name: '', valid: false }

    try {
      const yf = await getYF()
      const result = await yf.quoteSummary(upper, { modules: ['price'] })
      const name = result.price?.longName ?? result.price?.shortName ?? upper
      return { ticker: upper, name, valid: true }
    } catch (e) {
      log.warn(`ticker:lookup failed for ${upper}:`, e)
      return { ticker: upper, name: '', valid: false }
    }
  })
}
