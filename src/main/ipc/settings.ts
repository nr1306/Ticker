import { ipcMain } from 'electron'
import { getSettings, updateSettings } from '../../services/db'
import type { AppSettings } from '../../shared/types'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', () => getSettings())

  ipcMain.handle('settings:set', (_e, partial: Partial<AppSettings>) => updateSettings(partial))
}
