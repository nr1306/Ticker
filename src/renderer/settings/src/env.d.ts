/// <reference types="vite/client" />

declare global {
  interface Window {
    api: {
      onThemeChange: (cb: (theme: 'dark' | 'light') => void) => void
      onRecommendationsReady: (cb: (data: unknown) => void) => void
      onNewsUpdate: (cb: (data: unknown) => void) => void
      portfolio: {
        getAll: () => Promise<unknown>
        add: (ticker: string, name: string, quantity: number) => Promise<void>
        remove: (ticker: string) => Promise<void>
      }
      watchlist: {
        getAll: () => Promise<unknown>
        add: (ticker: string, name: string, targetPrice?: number) => Promise<void>
        remove: (ticker: string) => Promise<void>
        setTarget: (ticker: string, targetPrice: number) => Promise<void>
      }
      alerts: {
        getAll: () => Promise<unknown>
        create: (ticker: string, type: string, value: number, persistent: boolean) => Promise<unknown>
        delete: (id: number) => Promise<void>
        toggle: (id: number, active: boolean) => Promise<void>
        getHistory: () => Promise<unknown>
      }
      recommendations: {
        fetch: () => Promise<unknown>
      }
      news: {
        getAll: () => Promise<unknown>
        markRead: (id: number) => Promise<void>
        getSummary: (id: number) => Promise<string>
      }
      settings: {
        get: () => Promise<unknown>
        set: (settings: Record<string, unknown>) => Promise<void>
      }
    }
  }
}

export {}
