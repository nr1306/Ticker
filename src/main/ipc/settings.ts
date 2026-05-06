import { ipcMain, BrowserWindow } from 'electron'
import { getSettings, updateSettings } from '../../services/db'
import type { AppSettings } from '../../shared/types'
import { startPricePoller } from '../pricePoller'
import { repositionWindow } from '../floatingWindow'

export function registerSettingsHandlers(floatingWindow: BrowserWindow): void {
  ipcMain.handle('settings:get', () => getSettings())

  ipcMain.handle('settings:set', (_e, partial: Partial<AppSettings>) => {
    updateSettings(partial)

    if (partial.pollIntervalSeconds !== undefined) {
      startPricePoller(floatingWindow)
    }

    if (partial.widgetPosition !== undefined) {
      repositionWindow(floatingWindow, partial.widgetPosition)
    }

    if (partial.widgetOpacityIdle !== undefined && !floatingWindow.isDestroyed()) {
      floatingWindow.webContents.send('settings:opacityUpdate', partial.widgetOpacityIdle)
    }
  })
}
