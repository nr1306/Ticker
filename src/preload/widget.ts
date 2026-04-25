import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

contextBridge.exposeInMainWorld('electron', electronAPI)

contextBridge.exposeInMainWorld('api', {
  onPricesUpdate: (cb: (data: unknown) => void) =>
    ipcRenderer.on('prices:update', (_e, data) => cb(data)),
  onThemeChange: (cb: (theme: 'dark' | 'light') => void) =>
    ipcRenderer.on('theme:change', (_e, theme) => cb(theme)),
  onUnreadCount: (cb: (count: number) => void) =>
    ipcRenderer.on('unread:count', (_e, count) => cb(count)),
  onAlertTriggered: (cb: (data: unknown) => void) =>
    ipcRenderer.on('alert:triggered', (_e, data) => cb(data)),
  openSettings: () => ipcRenderer.invoke('window:openSettings')
})
