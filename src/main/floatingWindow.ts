import { BrowserWindow, screen, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import log from 'electron-log'
import {
  getWidgetSize,
  saveWidgetSize,
  getWidgetPosition,
  saveWidgetPosition,
  getSettings
} from '../services/db'

function computePosition(
  position: string,
  winWidth: number,
  winHeight: number
): { x: number; y: number } {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  const m = 20
  switch (position) {
    case 'top-left':
      return { x: m, y: m }
    case 'bottom-right':
      return { x: sw - winWidth - m, y: sh - winHeight - m }
    case 'bottom-left':
      return { x: m, y: sh - winHeight - m }
    default:
      return { x: sw - winWidth - m, y: m } // top-right
  }
}

export function repositionWindow(win: BrowserWindow, position: string): void {
  if (win.isDestroyed()) return
  const [w, h] = win.getSize()
  const { x, y } = computePosition(position, w, h)
  win.setPosition(x, y)
}

export function createFloatingWindow(): BrowserWindow {
  const { width: savedW, height: savedH } = getWidgetSize()
  const { widgetPosition } = getSettings()

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

  const { x: savedX, y: savedY } = getWidgetPosition()
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  if (
    savedX !== null &&
    savedY !== null &&
    savedX >= 0 &&
    savedY >= 0 &&
    savedX < sw &&
    savedY < sh
  ) {
    win.setPosition(savedX, savedY)
  } else {
    const { x, y } = computePosition(widgetPosition, savedW, savedH)
    win.setPosition(x, y)
  }

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

  let moveTimer: ReturnType<typeof setTimeout>
  win.on('move', () => {
    clearTimeout(moveTimer)
    moveTimer = setTimeout(() => {
      if (!win.isDestroyed()) {
        const [x, y] = win.getPosition()
        saveWidgetPosition(x, y)
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
