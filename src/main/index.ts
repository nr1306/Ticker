import { config } from 'dotenv'
import { join } from 'path'
config({ path: join(process.cwd(), '.env') })

import { app, BrowserWindow, ipcMain, nativeTheme, shell } from 'electron'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import log from 'electron-log'
import { initDb } from '../services/db'
import { createFloatingWindow } from './floatingWindow'
import { createSettingsWindow, getSettingsWindow } from './settingsWindow'
import { createTray } from './tray'
import { registerPortfolioHandlers } from './ipc/portfolio'
import { registerWatchlistHandlers } from './ipc/watchlist'
import { registerAlertHandlers } from './ipc/alerts'
import { registerNewsHandlers } from './ipc/news'
import { registerRecommendationHandlers } from './ipc/recommendations'
import { registerSettingsHandlers } from './ipc/settings'
import { registerTickerHandlers } from './ipc/ticker'
import { startPricePoller, stopPricePoller } from './pricePoller'
import { fetchAndCacheNews } from './newsFetcher'

log.initialize()
log.info('Ticker starting up')

let floatingWindow: BrowserWindow | null = null

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.ticker')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize SQLite database
  initDb(app.getPath('userData'))

  // Register all IPC handlers
  registerPortfolioHandlers()
  registerWatchlistHandlers()
  registerAlertHandlers()
  registerNewsHandlers()
  registerRecommendationHandlers()
  registerSettingsHandlers()
  registerTickerHandlers()

  ipcMain.handle('window:openSettings', () => {
    createSettingsWindow()
  })

  ipcMain.handle('shell:openExternal', (_e, url: string) => shell.openExternal(url))

  if (is.dev) {
    try {
      const { default: installExtension, REACT_DEVELOPER_TOOLS } =
        await import('electron-devtools-installer')
      await installExtension(REACT_DEVELOPER_TOOLS)
      log.info('React DevTools installed')
    } catch (e) {
      log.warn('DevTools install failed (non-fatal):', e)
    }
  }

  floatingWindow = createFloatingWindow()
  createTray(floatingWindow)
  startPricePoller(floatingWindow)
  fetchAndCacheNews(floatingWindow)

  ipcMain.handle('news:refresh', () => fetchAndCacheNews(floatingWindow!))

  nativeTheme.on('updated', () => {
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    floatingWindow?.webContents.send('theme:change', theme)
    getSettingsWindow()?.webContents.send('theme:change', theme)
    log.info('Theme changed to', theme)
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      floatingWindow = createFloatingWindow()
      startPricePoller(floatingWindow)
    }
  })
})

app.on('before-quit', () => {
  stopPricePoller()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
