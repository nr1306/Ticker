import { ipcMain } from 'electron'
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  setWatchlistTarget
} from '../../services/db'
import type { WatchlistStock } from '../../shared/types'
import { getLatestPriceUpdate } from '../pricePoller'

export function registerWatchlistHandlers(): void {
  ipcMain.handle('watchlist:getAll', (): WatchlistStock[] =>
    getWatchlist().map((row) => ({
      ticker: row.ticker,
      name: row.name,
      price: getLatestPriceUpdate(row.ticker)?.price ?? null,
      changePercent: getLatestPriceUpdate(row.ticker)?.changePercent ?? null,
      targetPrice: row.target_price,
      atTarget: false
    }))
  )

  ipcMain.handle('watchlist:add', (_e, ticker: string, name: string, targetPrice?: number) =>
    addToWatchlist(ticker, name, targetPrice)
  )

  ipcMain.handle('watchlist:remove', (_e, ticker: string) => removeFromWatchlist(ticker))

  ipcMain.handle('watchlist:setTarget', (_e, ticker: string, targetPrice: number | null) =>
    setWatchlistTarget(ticker, targetPrice)
  )
}
