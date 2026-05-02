import { create } from 'zustand'
import type { Recommendation } from '../../../../shared/types'

interface RecommendationsStore {
  recs: Recommendation[]
  loading: boolean
  fetch: () => Promise<void>
  applyUpdate: (recs: Recommendation[]) => void
}

export const useRecommendationsStore = create<RecommendationsStore>((set) => ({
  recs: [],
  loading: false,

  fetch: async () => {
    set({ loading: true })
    const data = await window.api.recommendations.fetch()
    set({ recs: data, loading: false })
  },

  applyUpdate: (recs: Recommendation[]) => {
    set({ recs, loading: false })
  }
}))
