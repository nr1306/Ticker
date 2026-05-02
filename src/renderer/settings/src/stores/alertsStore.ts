import { create } from 'zustand'
import type { Alert, AlertHistoryEntry, AlertType } from '../../../../shared/types'

interface AlertsStore {
  alerts: Alert[]
  history: AlertHistoryEntry[]
  loading: boolean
  fetch: () => Promise<void>
  fetchHistory: () => Promise<void>
  add: (ticker: string, type: AlertType, value: number, persistent: boolean) => Promise<void>
  remove: (id: number) => Promise<void>
  toggle: (id: number, active: boolean) => Promise<void>
  applyTriggered: (data: { alert: Alert; priceAtTrigger: number }) => void
}

export const useAlertsStore = create<AlertsStore>((set) => ({
  alerts: [],
  history: [],
  loading: false,

  fetch: async () => {
    set({ loading: true })
    const data = await window.api.alerts.getAll()
    set({ alerts: data, loading: false })
  },

  fetchHistory: async () => {
    const data = await window.api.alerts.getHistory()
    set({ history: data })
  },

  add: async (ticker, type, value, persistent) => {
    await window.api.alerts.create(ticker, type, value, persistent)
    const data = await window.api.alerts.getAll()
    set({ alerts: data })
  },

  remove: async (id) => {
    await window.api.alerts.delete(id)
    set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) }))
  },

  toggle: async (id, active) => {
    await window.api.alerts.toggle(id, active)
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, active } : a))
    }))
  },

  applyTriggered: ({ alert }) => {
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === alert.id ? { ...a, active: alert.active } : a))
    }))
    window.api.alerts
      .getHistory()
      .then((data) => set({ history: data }))
      .catch(() => {})
  }
}))
