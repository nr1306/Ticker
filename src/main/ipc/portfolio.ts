import { ipcMain } from 'electron'
import {
  getPortfolio,
  addToPortfolio,
  removeFromPortfolio,
  updatePortfolioQuantity
} from '../../services/db'
import type { PortfolioStock } from '../../shared/types'
import { getLatestPriceUpdate } from '../pricePoller'

export function registerPortfolioHandlers(): void {
  ipcMain.handle('portfolio:getAll', (): PortfolioStock[] =>
    getPortfolio().map((row) => ({
      ...row,
      price: getLatestPriceUpdate(row.ticker)?.price ?? null,
      changePercent: getLatestPriceUpdate(row.ticker)?.changePercent ?? null
    }))
  )

  ipcMain.handle('portfolio:add', (_e, ticker: string, name: string, quantity: number) =>
    addToPortfolio(ticker, name, quantity)
  )

  ipcMain.handle('portfolio:remove', (_e, ticker: string) => removeFromPortfolio(ticker))

  ipcMain.handle('portfolio:updateQuantity', (_e, ticker: string, quantity: number) =>
    updatePortfolioQuantity(ticker, quantity)
  )
}
