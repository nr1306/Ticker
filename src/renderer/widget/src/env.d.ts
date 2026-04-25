/// <reference types="vite/client" />

declare global {
  interface Window {
    api: {
      onPricesUpdate: (cb: (data: unknown) => void) => void
      onThemeChange: (cb: (theme: 'dark' | 'light') => void) => void
      onUnreadCount: (cb: (count: number) => void) => void
      onAlertTriggered: (cb: (data: unknown) => void) => void
      openSettings: () => Promise<void>
    }
  }
}

export {}
