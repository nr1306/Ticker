import type {
  Alert,
  AlertHistoryEntry,
  AppSettings,
  NewsItem,
  PortfolioStock,
  PriceUpdate,
  Recommendation,
  WatchlistStock
} from './types'

export interface WindowApi {
  onThemeChange: (cb: (theme: 'dark' | 'light') => void) => () => void
  onPricesUpdate: (cb: (data: PriceUpdate[]) => void) => () => void
  onUnreadCount: (cb: (count: number) => void) => () => void
  onAlertTriggered: (cb: (data: { alert: Alert; priceAtTrigger: number }) => void) => () => void
  onRecommendationsReady: (cb: (data: Recommendation[]) => void) => () => void
  onNewsUpdate: (cb: (data: NewsItem[]) => void) => () => void
  openSettings: () => Promise<void>
  portfolio: {
    getAll: () => Promise<PortfolioStock[]>
    add: (ticker: string, name: string, quantity: number) => Promise<void>
    remove: (ticker: string) => Promise<void>
  }
  watchlist: {
    getAll: () => Promise<WatchlistStock[]>
    add: (ticker: string, name: string, targetPrice?: number) => Promise<void>
    remove: (ticker: string) => Promise<void>
    setTarget: (ticker: string, targetPrice: number) => Promise<void>
  }
  alerts: {
    getAll: () => Promise<Alert[]>
    create: (ticker: string, type: string, value: number, persistent: boolean) => Promise<Alert>
    delete: (id: number) => Promise<void>
    toggle: (id: number, active: boolean) => Promise<void>
    getHistory: () => Promise<AlertHistoryEntry[]>
  }
  recommendations: {
    fetch: () => Promise<Recommendation[]>
  }
  news: {
    getAll: () => Promise<NewsItem[]>
    markRead: (id: number) => Promise<void>
    getSummary: (id: number) => Promise<string>
  }
  settings: {
    get: () => Promise<AppSettings>
    set: (settings: Record<string, unknown>) => Promise<void>
  }
  ticker: {
    lookup: (ticker: string) => Promise<{ ticker: string; name: string; valid: boolean }>
  }
}
