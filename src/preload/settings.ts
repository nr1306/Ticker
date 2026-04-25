import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

contextBridge.exposeInMainWorld('electron', electronAPI)

contextBridge.exposeInMainWorld('api', {
  onThemeChange: (cb: (theme: 'dark' | 'light') => void) =>
    ipcRenderer.on('theme:change', (_e, theme) => cb(theme)),
  onRecommendationsReady: (cb: (data: unknown) => void) =>
    ipcRenderer.on('recommendations:ready', (_e, data) => cb(data)),
  onNewsUpdate: (cb: (data: unknown) => void) =>
    ipcRenderer.on('news:update', (_e, data) => cb(data)),

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
    getSummary: (id: number) => ipcRenderer.invoke('news:getSummary', id)
  },

  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (settings: Record<string, unknown>) => ipcRenderer.invoke('settings:set', settings)
  },

  ticker: {
    lookup: (ticker: string) => ipcRenderer.invoke('ticker:lookup', ticker)
  }
})
