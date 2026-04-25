import { create } from 'zustand'
import type { PortfolioStock, PriceUpdate } from '../../../../shared/types'

interface PortfolioStore {
  stocks: PortfolioStock[]
  loading: boolean
  fetch: () => Promise<void>
  add: (ticker: string, name: string, quantity: number) => Promise<void>
  remove: (ticker: string) => Promise<void>
  applyPriceUpdates: (updates: PriceUpdate[]) => void
}

export const usePortfolioStore = create<PortfolioStore>((set) => ({
  stocks: [],
  loading: false,

  fetch: async () => {
    set({ loading: true })
    const data = await window.api.portfolio.getAll()
    set({ stocks: data, loading: false })
  },

  add: async (ticker, name, quantity) => {
    await window.api.portfolio.add(ticker, name, quantity)
    const data = await window.api.portfolio.getAll()
    set({ stocks: data })
  },

  remove: async (ticker) => {
    await window.api.portfolio.remove(ticker)
    const data = await window.api.portfolio.getAll()
    set({ stocks: data })
  },

  applyPriceUpdates: (updates) => {
    const updatesByTicker = new Map(updates.map((update) => [update.ticker, update]))
    set((state) => ({
      stocks: state.stocks.map((stock) => {
        const liveUpdate = updatesByTicker.get(stock.ticker)
        if (!liveUpdate) {
          return {
            ...stock,
            price: null,
            changePercent: null
          }
        }

        return {
          ...stock,
          price: liveUpdate.price,
          changePercent: liveUpdate.changePercent
        }
      })
    }))
  }
}))
