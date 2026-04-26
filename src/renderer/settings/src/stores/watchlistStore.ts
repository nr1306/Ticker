import { create } from 'zustand'
import type { WatchlistStock, PriceUpdate } from '../../../../shared/types'

interface WatchlistStore {
  stocks: WatchlistStock[]
  loading: boolean
  fetch: () => Promise<void>
  add: (ticker: string, name: string, targetPrice?: number) => Promise<void>
  remove: (ticker: string) => Promise<void>
  setTarget: (ticker: string, targetPrice: number | null) => Promise<void>
  applyPriceUpdates: (updates: PriceUpdate[]) => void
}

export const useWatchlistStore = create<WatchlistStore>((set) => ({
  stocks: [],
  loading: false,

  fetch: async () => {
    set({ loading: true })
    const data = await window.api.watchlist.getAll()
    set({ stocks: data, loading: false })
  },

  add: async (ticker, name, targetPrice) => {
    await window.api.watchlist.add(ticker, name, targetPrice)
    const data = await window.api.watchlist.getAll()
    set({ stocks: data })
  },

  remove: async (ticker) => {
    await window.api.watchlist.remove(ticker)
    const data = await window.api.watchlist.getAll()
    set({ stocks: data })
  },

  setTarget: async (ticker, targetPrice) => {
    await window.api.watchlist.setTarget(ticker, targetPrice as number)
    const data = await window.api.watchlist.getAll()
    set({ stocks: data })
  },

  applyPriceUpdates: (updates) => {
    const map = new Map(updates.map((u) => [u.ticker, u]))
    set((state) => ({
      stocks: state.stocks.map((stock) => {
        const live = map.get(stock.ticker)
        if (!live) return { ...stock, price: null, changePercent: null, atTarget: false }
        const atTarget =
          stock.targetPrice !== null && live.price !== null && live.price <= stock.targetPrice
        return { ...stock, price: live.price, changePercent: live.changePercent, atTarget }
      })
    }))
  }
}))
