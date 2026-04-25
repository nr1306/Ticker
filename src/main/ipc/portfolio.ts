import { ipcMain } from 'electron'
import {
  getPortfolio,
  addToPortfolio,
  removeFromPortfolio,
  updatePortfolioQuantity
} from '../../services/db'
import type { PortfolioStock } from '../../shared/types'

export function registerPortfolioHandlers(): void {
  ipcMain.handle('portfolio:getAll', (): PortfolioStock[] =>
    getPortfolio().map((row) => ({
      ...row,
      price: 0,
      changePercent: 0
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
