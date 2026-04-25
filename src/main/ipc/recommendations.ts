import { ipcMain } from 'electron'
import { getCachedRecommendations } from '../../services/db'

export function registerRecommendationHandlers(): void {
  // Returns cached recommendations — AI generation wired in v1.1.0
  ipcMain.handle('recommendations:fetch', () => getCachedRecommendations())
}
