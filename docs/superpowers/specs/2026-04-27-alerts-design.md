# v0.8.0 — Smart Price Alerts Design

**Date:** 2026-04-27  
**Status:** Approved

---

## Overview

Add smart price alerts that fire quiet OS desktop notifications when a tracked stock crosses a user-defined threshold. Alerts are scoped to tickers already in the portfolio or watchlist (no extra polling). The floating widget stays unchanged — notifications are the only signal.

---

## Alert Types

| Type      | Condition                                                                                                              |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| `floor`   | `price <= alert.value`                                                                                                 |
| `ceiling` | `price >= alert.value`                                                                                                 |
| `percent` | `Math.abs(changePercent) >= alert.value` — uses daily % change from previous close, fires on moves in either direction |

---

## Persistence Behaviour

- **Non-persistent:** fires once → `active = false` in DB (permanent, never fires again)
- **Persistent:** edge-crossing detection —
  - Condition becomes true → fire notification, mark as "currently triggered" in memory
  - Condition becomes false → remove the mark (reset)
  - Condition becomes true again → fires again (new crossing)

In-memory tracking uses a `Set<number>` of alert IDs keyed by alert ID. Resets on app restart.

---

## Architecture

### New file: `src/main/alertEvaluator.ts`

Owns all evaluation logic. Exports:

```ts
export function evaluateAlerts(prices: PriceUpdate[], windows: BrowserWindow[]): void
```

Internal state:

```ts
const triggeredAlerts = new Set<number>() // alert IDs currently in triggered state
```

Per-poll logic:

1. Load all active alerts from DB via `getAlerts()`
2. For each alert, find its price in the incoming `prices` array
3. Evaluate condition:
   - If met **and** alert ID **not** in `triggeredAlerts`:
     a. Fire Electron `Notification` (title: `"Alert: {TICKER}"`, descriptive body)
     b. Call `logAlertTrigger(id, ticker, price)` → writes to `alert_history`
     c. Add ID to `triggeredAlerts`
     d. If `persistent === false`: call `toggleAlert(id, false)` to deactivate
     e. Broadcast `alert:triggered` → `{ alert, priceAtTrigger }` to all renderer windows
   - If met **and** ID **is** in `triggeredAlerts`: skip (still triggered, no repeat)
   - If **not** met **and** ID **is** in `triggeredAlerts`: remove from `triggeredAlerts` (reset for next crossing)

### Change: `src/main/pricePoller.ts`

After `broadcastPriceUpdates(floatingWindow, prices)`, add:

```ts
evaluateAlerts(prices, [floatingWindow, getSettingsWindow()])
```

No other changes.

### New file: `src/renderer/settings/src/stores/alertsStore.ts`

Zustand store:

- State: `alerts: Alert[]`, `history: AlertHistoryEntry[]`
- Actions: `fetchAlerts()`, `fetchHistory()`, `addAlert(ticker, type, value, persistent)`, `removeAlert(id)`, `toggleAlert(id, active)`
- On `alert:triggered` push: update the matching alert's `active` field inline — non-persistent alerts go grey immediately without re-fetching

### Rewrite: `src/renderer/settings/src/tabs/Alerts.tsx`

Three sections:

**1. Add alert form**

- Ticker dropdown — union of `portfolioStore.stocks` + `watchlistStore.stocks` tickers (no new IPC)
- Type selector: `floor` / `ceiling` / `% change`
- Value input: positive number (validated before submit)
- Persistent toggle
- Add button

**2. Active alerts table**

- Columns: Ticker | Type | Value | Persistent | Active (toggle) | Delete
- Inactive alerts shown greyed out
- Empty state if none configured

**3. History (collapsible)**

- Last 100 triggers from `alerts:getHistory`
- Columns: Ticker | Triggered At | Price at Trigger

---

## Notification Format

| Alert type | Title         | Body                                                     |
| ---------- | ------------- | -------------------------------------------------------- |
| `floor`    | `Alert: AAPL` | `Price dropped to $182.50 — below your floor of $180.00` |
| `ceiling`  | `Alert: AAPL` | `Price reached $202.00 — above your ceiling of $200.00`  |
| `percent`  | `Alert: AAPL` | `AAPL moved -3.2% today — your threshold is ±3%`         |

---

## What Is Not Changing

- No new IPC channels (all channels already scaffolded)
- No DB schema changes (tables and CRUD already in place)
- No new dependencies (Electron's built-in `Notification` API used)
- Floating widget UI unchanged
- No ticker polling added — alerts only cover portfolio + watchlist tickers

---

## Files Touched

| File                                              | Change                                                   |
| ------------------------------------------------- | -------------------------------------------------------- |
| `src/main/alertEvaluator.ts`                      | **New** — evaluation engine                              |
| `src/main/pricePoller.ts`                         | **Minor** — one call to `evaluateAlerts` after broadcast |
| `src/renderer/settings/src/stores/alertsStore.ts` | **New** — Zustand store                                  |
| `src/renderer/settings/src/tabs/Alerts.tsx`       | **Rewrite** — full UI                                    |
