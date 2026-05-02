import { BrowserWindow, screen, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import log from 'electron-log'
import { getWidgetSize, saveWidgetSize } from '../services/db'

export function createFloatingWindow(): BrowserWindow {
  const { width: savedW, height: savedH } = getWidgetSize()

  const win = new BrowserWindow({
    width: savedW,
    height: savedH,
    minWidth: 220,
    maxWidth: 600,
    minHeight: 80,
    maxHeight: 900,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    hasShadow: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/widget.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  win.setAlwaysOnTop(true, 'floating')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  const { width } = screen.getPrimaryDisplay().workAreaSize
  win.setPosition(width - savedW - 20, 20)

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  let resizeTimer: ReturnType<typeof setTimeout>
  win.on('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      if (!win.isDestroyed()) {
        const [w, h] = win.getSize()
        saveWidgetSize(w, h)
      }
    }, 500)
  })

  win.on('ready-to-show', () => win.show())

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/widget/index.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/widget/index.html'))
  }

  log.info('Floating window created')
  return win
}
