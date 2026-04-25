/// <reference types="vite/client" />

import type { WindowApi } from '../../../shared/windowApi'

declare global {
  interface Window {
    api: WindowApi
  }
}

export {}
