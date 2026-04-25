import { ipcMain } from 'electron'
import {
  getAlerts,
  createAlert,
  deleteAlert,
  toggleAlert,
  getAlertHistory
} from '../../services/db'
import type { AlertType } from '../../shared/types'

export function registerAlertHandlers(): void {
  ipcMain.handle('alerts:getAll', () => getAlerts())

  ipcMain.handle(
    'alerts:create',
    (_e, ticker: string, type: AlertType, value: number, persistent: boolean) =>
      createAlert(ticker, type, value, persistent)
  )

  ipcMain.handle('alerts:delete', (_e, id: number) => deleteAlert(id))

  ipcMain.handle('alerts:toggle', (_e, id: number, active: boolean) => toggleAlert(id, active))

  ipcMain.handle('alerts:getHistory', () => getAlertHistory())
}
