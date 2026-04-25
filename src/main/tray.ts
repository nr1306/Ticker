import { app, BrowserWindow, Menu, nativeImage, Tray } from 'electron'
import { join } from 'path'
import { createSettingsWindow } from './settingsWindow'
import log from 'electron-log'

let tray: Tray | null = null

export function createTray(floatingWindow: BrowserWindow): Tray {
  const iconPath = join(__dirname, '../../resources/tray-icon.png')
  let icon = nativeImage.createFromPath(iconPath)

  if (icon.isEmpty()) {
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)

  if (process.platform === 'darwin') {
    tray.setTitle('T')
  }

  tray.setToolTip('Ticker — Stock Companion')

  const buildMenu = () =>
    Menu.buildFromTemplate([
      {
        label: floatingWindow.isVisible() ? 'Hide Widget' : 'Show Widget',
        click: () => {
          if (floatingWindow.isVisible()) {
            floatingWindow.hide()
          } else {
            floatingWindow.show()
          }
          tray?.setContextMenu(buildMenu())
        }
      },
      {
        label: 'Open Settings',
        click: () => createSettingsWindow()
      },
      { type: 'separator' },
      {
        label: 'Quit Ticker',
        click: () => app.quit()
      }
    ])

  tray.setContextMenu(buildMenu())

  tray.on('double-click', () => {
    if (floatingWindow.isVisible()) {
      floatingWindow.hide()
    } else {
      floatingWindow.show()
    }
    tray?.setContextMenu(buildMenu())
  })

  log.info('System tray created')
  return tray
}
