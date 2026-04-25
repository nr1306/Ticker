import { ipcMain } from 'electron'
import { getCachedNews, markNewsRead, updateNewsSummary, getUnreadCount } from '../../services/db'

export function registerNewsHandlers(): void {
  ipcMain.handle('news:getAll', () => getCachedNews())

  ipcMain.handle('news:markRead', (_e, id: number) => {
    markNewsRead(id)
    return getUnreadCount()
  })

  // getSummary returns cached summary if available; AI generation added in v1.0.0
  ipcMain.handle('news:getSummary', (_e, id: number) => {
    const items = getCachedNews()
    const item = items.find((n) => n.id === id)
    if (item?.summary) return item.summary
    return null
  })

  ipcMain.handle('news:updateSummary', (_e, id: number, summary: string) =>
    updateNewsSummary(id, summary)
  )

  ipcMain.handle('news:unreadCount', () => getUnreadCount())
}
