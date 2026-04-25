import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import log from 'electron-log'
import { createFloatingWindow } from './floatingWindow'
import { createSettingsWindow, getSettingsWindow } from './settingsWindow'
import { createTray } from './tray'

log.initialize()
log.info('Ticker starting up')

let floatingWindow: BrowserWindow | null = null

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.ticker')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  if (is.dev) {
    try {
      const { default: installExtension, REACT_DEVELOPER_TOOLS } = await import(
        'electron-devtools-installer'
      )
      await installExtension(REACT_DEVELOPER_TOOLS)
      log.info('React DevTools installed')
    } catch (e) {
      log.warn('DevTools install failed (non-fatal):', e)
    }
  }

  floatingWindow = createFloatingWindow()
  createTray(floatingWindow)

  ipcMain.handle('window:openSettings', () => {
    createSettingsWindow()
  })

  nativeTheme.on('updated', () => {
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    floatingWindow?.webContents.send('theme:change', theme)
    getSettingsWindow()?.webContents.send('theme:change', theme)
    log.info('Theme changed to', theme)
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      floatingWindow = createFloatingWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
