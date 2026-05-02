import { ipcMain, BrowserWindow } from 'electron'
import { getCachedRecommendations } from '../../services/db'
import { generateAndBroadcastRecommendations } from '../recommendationsFetcher'

export function registerRecommendationHandlers(floatingWindow: BrowserWindow): void {
  ipcMain.handle('recommendations:fetch', async () => {
    return generateAndBroadcastRecommendations(floatingWindow)
  })

  ipcMain.handle('recommendations:getCached', () => getCachedRecommendations())
}
