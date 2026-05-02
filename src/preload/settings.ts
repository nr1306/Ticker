import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Alert, NewsItem, PriceUpdate, Recommendation } from '../shared/types'

contextBridge.exposeInMainWorld('electron', electronAPI)

function subscribe<T>(channel: string, cb: (data: T) => void): () => void {
  const listener = (_event: unknown, data: T) => cb(data)
  ipcRenderer.on(channel, listener)
  return () => {
    ipcRenderer.removeListener(channel, listener)
  }
}

contextBridge.exposeInMainWorld('api', {
  onThemeChange: (cb: (theme: 'dark' | 'light') => void) => subscribe('theme:change', cb),
  onPricesUpdate: (cb: (data: PriceUpdate[]) => void) => subscribe('prices:update', cb),
  onUnreadCount: (cb: (count: number) => void) => subscribe('unread:count', cb),
  onAlertTriggered: (cb: (data: { alert: Alert; priceAtTrigger: number }) => void) =>
    subscribe('alert:triggered', cb),
  onRecommendationsReady: (cb: (data: Recommendation[]) => void) =>
    subscribe('recommendations:ready', cb),
  onNewsUpdate: (cb: (data: NewsItem[]) => void) => subscribe('news:update', cb),
  openSettings: () => ipcRenderer.invoke('window:openSettings'),
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),

  portfolio: {
    getAll: () => ipcRenderer.invoke('portfolio:getAll'),
    add: (ticker: string, name: string, quantity: number) =>
      ipcRenderer.invoke('portfolio:add', ticker, name, quantity),
    remove: (ticker: string) => ipcRenderer.invoke('portfolio:remove', ticker)
  },

  watchlist: {
    getAll: () => ipcRenderer.invoke('watchlist:getAll'),
    add: (ticker: string, name: string, targetPrice?: number) =>
      ipcRenderer.invoke('watchlist:add', ticker, name, targetPrice),
    remove: (ticker: string) => ipcRenderer.invoke('watchlist:remove', ticker),
    setTarget: (ticker: string, targetPrice: number) =>
      ipcRenderer.invoke('watchlist:setTarget', ticker, targetPrice)
  },

  alerts: {
    getAll: () => ipcRenderer.invoke('alerts:getAll'),
    create: (ticker: string, type: string, value: number, persistent: boolean) =>
      ipcRenderer.invoke('alerts:create', ticker, type, value, persistent),
    delete: (id: number) => ipcRenderer.invoke('alerts:delete', id),
    toggle: (id: number, active: boolean) => ipcRenderer.invoke('alerts:toggle', id, active),
    getHistory: () => ipcRenderer.invoke('alerts:getHistory')
  },

  recommendations: {
    fetch: () => ipcRenderer.invoke('recommendations:fetch')
  },

  news: {
    getAll: () => ipcRenderer.invoke('news:getAll'),
    markRead: (id: number) => ipcRenderer.invoke('news:markRead', id),
    getSummary: (id: number) => ipcRenderer.invoke('news:getSummary', id),
    refresh: () => ipcRenderer.invoke('news:refresh')
  },

  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (settings: Record<string, unknown>) => ipcRenderer.invoke('settings:set', settings)
  },

  ticker: {
    lookup: (ticker: string) => ipcRenderer.invoke('ticker:lookup', ticker)
  }
})
