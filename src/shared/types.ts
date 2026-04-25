export interface PortfolioStock {
  ticker: string
  name: string
  quantity: number
  price: number
  changePercent: number
}

export interface WatchlistStock {
  ticker: string
  name: string
  price: number
  changePercent: number
  targetPrice: number | null
  atTarget: boolean
}

export type AlertType = 'floor' | 'ceiling' | 'percent'

export interface Alert {
  id: number
  ticker: string
  type: AlertType
  value: number
  persistent: boolean
  active: boolean
}

export interface AlertHistoryEntry {
  id: number
  alertId: number
  ticker: string
  triggeredAt: string
  priceAtTrigger: number
}

export interface NewsItem {
  id: number
  ticker: string
  headline: string
  source: string
  url: string
  publishedAt: string
  summary: string | null
  read: boolean
}

export interface Recommendation {
  id: number
  ticker: string
  reasoning: string
  generatedAt: string
}

export interface PriceUpdate {
  ticker: string
  price: number
  changePercent: number
}

export interface AppSettings {
  pollIntervalSeconds: number
  widgetPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  widgetOpacityIdle: number
  newsAutoRefresh: boolean
  recAutoRefreshMorning: boolean
}
