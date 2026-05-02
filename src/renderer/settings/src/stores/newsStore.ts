import { create } from 'zustand'
import type { NewsItem } from '../../../../shared/types'

interface NewsStore {
  news: NewsItem[]
  loading: boolean
  fetch: () => Promise<void>
  markRead: (id: number) => void
  refresh: () => Promise<void>
  applyUpdate: (items: NewsItem[]) => void
}

export const useNewsStore = create<NewsStore>((set) => ({
  news: [],
  loading: false,

  fetch: async () => {
    set({ loading: true })
    const data = await window.api.news.getAll()
    set({ news: data, loading: false })
  },

  markRead: (id: number) => {
    window.api.news.markRead(id).catch(() => {})
    set((state) => ({
      news: state.news.map((item) => (item.id === id ? { ...item, read: true } : item))
    }))
  },

  refresh: async () => {
    set({ loading: true })
    await window.api.news.refresh().catch(() => set({ loading: false }))
    // applyUpdate from news:update broadcast sets loading: false and updates news
  },

  applyUpdate: (items: NewsItem[]) => {
    set({ news: items, loading: false })
  }
}))
