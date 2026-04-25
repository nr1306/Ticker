import { create } from 'zustand'

export interface PortfolioStock {
  ticker: string
  name: string
  quantity: number
  price: number
  changePercent: number
}

interface PortfolioStore {
  stocks: PortfolioStock[]
  loading: boolean
  fetch: () => Promise<void>
  add: (ticker: string, name: string, quantity: number) => Promise<void>
  remove: (ticker: string) => Promise<void>
}

export const usePortfolioStore = create<PortfolioStore>((set) => ({
  stocks: [],
  loading: false,

  fetch: async () => {
    set({ loading: true })
    const data = await window.api.portfolio.getAll()
    set({ stocks: data as PortfolioStock[], loading: false })
  },

  add: async (ticker, name, quantity) => {
    await window.api.portfolio.add(ticker, name, quantity)
    const data = await window.api.portfolio.getAll()
    set({ stocks: data as PortfolioStock[] })
  },

  remove: async (ticker) => {
    await window.api.portfolio.remove(ticker)
    const data = await window.api.portfolio.getAll()
    set({ stocks: data as PortfolioStock[] })
  }
}))
