import { ipcMain, dialog } from 'electron'
import { readFileSync } from 'fs'
import {
  getPortfolio,
  addToPortfolio,
  removeFromPortfolio,
  updatePortfolioQuantity
} from '../../services/db'
import type { PortfolioStock } from '../../shared/types'
import { getLatestPriceUpdate } from '../pricePoller'

const TICKER_KEYWORDS = [
  'symbol',
  'ticker',
  'stock',
  'security',
  'instrument',
  'underlying',
  'asset'
]
const QUANTITY_KEYWORDS = ['quantity', 'shares', 'qty', 'units', 'position']

function parseCsvText(text: string): string[][] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const result: string[][] = []
  for (const line of lines) {
    if (!line.trim()) continue
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"'
          i++
        } else if (ch === '"') {
          inQuotes = false
        } else {
          current += ch
        }
      } else if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        fields.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    fields.push(current.trim())
    result.push(fields)
  }
  return result
}

function detectColumn(headers: string[], keywords: string[]): string | null {
  for (const header of headers) {
    const lower = header.toLowerCase()
    if (keywords.some((k) => lower.includes(k))) return header
  }
  return null
}

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

  ipcMain.handle('portfolio:parseCsv', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'CSV Files', extensions: ['csv', 'txt'] }]
    })
    if (canceled || filePaths.length === 0) return null

    const text = readFileSync(filePaths[0], 'utf-8')
    const all = parseCsvText(text)
    if (all.length < 2) return null

    const [headers, ...rows] = all
    return {
      headers,
      rows,
      detectedTicker: detectColumn(headers, TICKER_KEYWORDS),
      detectedQuantity: detectColumn(headers, QUANTITY_KEYWORDS)
    }
  })
}
