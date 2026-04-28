import { BrowserWindow, Notification } from 'electron'
import log from 'electron-log'
import { getAlerts, logAlertTrigger, triggerAndDeactivateAlert } from '../services/db'
import type { Alert, AlertType, PriceUpdate } from '../shared/types'

export function checkCondition(
  type: AlertType,
  value: number,
  price: number,
  changePercent: number
): boolean {
  switch (type) {
    case 'floor':
      return price <= value
    case 'ceiling':
      return price >= value
    case 'percent':
      return Math.abs(changePercent) >= value
  }
}

function buildBody(alert: Alert, price: number, changePercent: number): string {
  switch (alert.type) {
    case 'floor':
      return `Price dropped to $${price.toFixed(2)} — below your floor of $${alert.value.toFixed(2)}`
    case 'ceiling':
      return `Price reached $${price.toFixed(2)} — above your ceiling of $${alert.value.toFixed(2)}`
    case 'percent':
      return `Moved ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}% today — threshold is ±${alert.value.toFixed(1)}%`
  }
}

// Tracks persistent alerts currently in a triggered state (condition was true last poll).
// Removed when condition becomes false, allowing re-fire on the next crossing.
// Non-persistent alerts are not tracked here — the DB active=false flag deduplicates them.
const triggeredAlerts = new Set<number>()

export function evaluateAlerts(prices: PriceUpdate[], windows: BrowserWindow[]): void {
  const alerts = getAlerts()
  const priceMap = new Map(prices.map((p) => [p.ticker.toUpperCase(), p]))

  for (const alert of alerts) {
    if (!alert.active) continue

    const update = priceMap.get(alert.ticker.toUpperCase())
    if (!update) continue

    const conditionMet = checkCondition(alert.type, alert.value, update.price, update.changePercent)

    if (conditionMet && !triggeredAlerts.has(alert.id)) {
      // Guard first: mark as triggered before any fallible side effect so a
      // downstream throw does not cause a duplicate notification on the next poll.
      if (alert.persistent) triggeredAlerts.add(alert.id)

      try {
        new Notification({
          title: `Alert: ${alert.ticker}`,
          body: buildBody(alert, update.price, update.changePercent)
        }).show()

        if (!alert.persistent) {
          // Atomic: log history + deactivate in one transaction
          triggerAndDeactivateAlert(alert.id, alert.ticker, update.price)
          // Mutate before spread so renderer receives the post-deactivation state
          alert.active = false
        } else {
          logAlertTrigger(alert.id, alert.ticker, update.price)
        }

        const payload = { alert: { ...alert }, priceAtTrigger: update.price }
        for (const win of windows) {
          if (!win.isDestroyed()) {
            win.webContents.send('alert:triggered', payload)
          }
        }
      } catch (err) {
        log.warn(`evaluateAlerts: side effect failed for alert ${alert.id}`, err)
      }
    } else if (!conditionMet && triggeredAlerts.has(alert.id)) {
      triggeredAlerts.delete(alert.id)
    }
  }
}
