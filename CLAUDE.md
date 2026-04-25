# Ticker — Stock Companion App

A lightweight, ambient desktop application for working professionals who actively hold stocks but cannot afford distraction during office hours. The app lives quietly in a corner of the screen and provides just enough visibility to stay informed without interrupting primary work.

**Core philosophy:** Ambient awareness, not a trading platform. It never executes trades, connects to brokerages, or manages money.

---

## Tech Stack

| Concern           | Choice                            |
| ----------------- | --------------------------------- |
| Desktop framework | Electron ^33                      |
| Build tool        | electron-vite ^2                  |
| UI framework      | React 18 + TypeScript             |
| Styling           | Tailwind CSS ^3 (system theme)    |
| State management  | Zustand ^5 (renderer only)        |
| Database          | SQLite via better-sqlite3 ^11     |
| Stock prices      | yahoo-finance2 (dev)              |
| News              | NewsAPI via axios                 |
| AI                | OpenAI SDK (gpt-4o / gpt-4o-mini) |

---

## Project Structure

```
ticker/
├── src/
│   ├── main/                      # Electron main process (Node.js)
│   │   ├── index.ts               # App entry — creates windows, tray
│   │   ├── floatingWindow.ts      # Frameless always-on-top widget window
│   │   ├── settingsWindow.ts      # Settings/panel window
│   │   ├── tray.ts                # System tray icon + menu
│   │   ├── pricePoller.ts         # Polls stock prices on interval
│   │   ├── alertEngine.ts         # Checks thresholds, fires notifications
│   │   ├── newsPoller.ts          # Polls NewsAPI for relevant headlines
│   │   └── ipc/                   # IPC handlers (main-side)
│   │       ├── portfolio.ts
│   │       ├── watchlist.ts
│   │       ├── alerts.ts
│   │       ├── news.ts
│   │       └── recommendations.ts
│   │
│   ├── renderer/                  # React frontend (browser context)
│   │   ├── widget/                # Floating widget UI
│   │   │   ├── Widget.tsx         # Root widget component
│   │   │   ├── StockRow.tsx       # Single stock line (ticker, price, %)
│   │   │   └── NewsBadge.tsx      # Unread news count badge
│   │   ├── panel/                 # Settings window tabs
│   │   │   ├── Portfolio.tsx      # Add/remove owned stocks
│   │   │   ├── Watchlist.tsx      # Watchlist + target prices
│   │   │   ├── NewsPulse.tsx      # News feed
│   │   │   ├── Recommendations.tsx# AI stock picks
│   │   │   ├── Alerts.tsx         # Create/manage alerts + history
│   │   │   └── Settings.tsx       # App settings (interval, position, etc.)
│   │   └── stores/                # Zustand state stores
│   │       ├── portfolioStore.ts
│   │       ├── watchlistStore.ts
│   │       ├── newsStore.ts
│   │       ├── alertStore.ts
│   │       └── recommendationStore.ts
│   │
│   ├── services/                  # Business logic — called from main process only
│   │   ├── stockApi.ts            # yahoo-finance2 wrapper
│   │   ├── newsApi.ts             # NewsAPI wrapper
│   │   ├── aiService.ts           # OpenAI — recommendations + summaries
│   │   └── db.ts                  # SQLite read/write (synchronous)
│   │
│   └── shared/                    # Types + constants shared across processes
│       ├── types.ts
│       └── constants.ts
│
├── assets/                        # App icon, tray icons (light/dark variants)
├── CLAUDE.md
├── .env                           # API keys (never commit)
├── .env.example                   # Committed template
├── electron.vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Architecture Rules

- **Main process owns all I/O.** The renderer (React) never calls external APIs or SQLite directly. All data flows through IPC.
- **IPC is the API.** Treat IPC channels like REST endpoints — typed inputs, typed outputs, documented below.
- **Renderer is display-only.** Zustand stores hold UI state. They are populated by IPC events pushed from main.
- **No brokerage connections.** Portfolio data is entered manually or imported via CSV. No OAuth, no credentials stored.

---

## Window Specs

### Floating Widget

```
width:        300px
height:       dynamic (auto, max ~500px)
frame:        false
transparent:  true
alwaysOnTop:  true
skipTaskbar:  true
resizable:    false
opacity:      0.4 idle → 1.0 on hover
position:     user-configured corner (saved in settings)
```

### Settings Panel

```
width:        820px    minWidth: 680px
height:       600px    minHeight: 500px
frame:        true
alwaysOnTop:  false
resizable:    true
```

---

## IPC Channel Reference

### Main → Renderer (push)

| Channel                 | Payload                                    |
| ----------------------- | ------------------------------------------ |
| `prices:update`         | `PriceUpdate[]`                            |
| `news:update`           | `NewsItem[]`                               |
| `alert:triggered`       | `{ alert: Alert, priceAtTrigger: number }` |
| `recommendations:ready` | `Recommendation[]`                         |
| `unread:count`          | `number`                                   |
| `theme:change`          | `'dark' \| 'light'`                        |

### Renderer → Main (invoke — returns Promise)

| Channel                 | Args                              | Returns               |
| ----------------------- | --------------------------------- | --------------------- |
| `portfolio:getAll`      | —                                 | `PortfolioStock[]`    |
| `portfolio:add`         | `ticker, name, quantity`          | `void`                |
| `portfolio:remove`      | `ticker`                          | `void`                |
| `watchlist:getAll`      | —                                 | `WatchlistStock[]`    |
| `watchlist:add`         | `ticker, name, targetPrice?`      | `void`                |
| `watchlist:remove`      | `ticker`                          | `void`                |
| `watchlist:setTarget`   | `ticker, targetPrice`             | `void`                |
| `alerts:getAll`         | —                                 | `Alert[]`             |
| `alerts:create`         | `ticker, type, value, persistent` | `Alert`               |
| `alerts:delete`         | `id`                              | `void`                |
| `alerts:toggle`         | `id, active`                      | `void`                |
| `alerts:getHistory`     | —                                 | `AlertHistoryEntry[]` |
| `recommendations:fetch` | —                                 | `Recommendation[]`    |
| `news:getAll`           | —                                 | `NewsItem[]`          |
| `news:markRead`         | `id`                              | `void`                |
| `news:getSummary`       | `id`                              | `string`              |
| `settings:get`          | —                                 | `AppSettings`         |
| `settings:set`          | `Partial<AppSettings>`            | `void`                |
| `window:openSettings`   | —                                 | `void`                |

---

## SQLite Schema

```sql
CREATE TABLE portfolio (
  ticker    TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  quantity  REAL NOT NULL DEFAULT 0
);

CREATE TABLE watchlist (
  ticker        TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  target_price  REAL
);

CREATE TABLE alerts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker      TEXT NOT NULL,
  type        TEXT NOT NULL CHECK(type IN ('floor', 'ceiling', 'percent')),
  value       REAL NOT NULL,
  persistent  INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE alert_history (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id         INTEGER REFERENCES alerts(id),
  ticker           TEXT NOT NULL,
  triggered_at     TEXT NOT NULL,
  price_at_trigger REAL NOT NULL
);

CREATE TABLE news_cache (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker       TEXT NOT NULL,
  headline     TEXT NOT NULL,
  source       TEXT NOT NULL,
  url          TEXT NOT NULL,
  published_at TEXT NOT NULL,
  summary      TEXT,
  read         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE recommendations_cache (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker       TEXT NOT NULL,
  reasoning    TEXT NOT NULL,
  generated_at TEXT NOT NULL
);

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

Default settings:

- `poll_interval_seconds` → `60`
- `widget_position` → `top-right`
- `widget_opacity_idle` → `0.4`
- `news_auto_refresh` → `1`
- `rec_auto_refresh_morning` → `1`

---

## Shared Types (`src/shared/types.ts`)

```typescript
export interface PortfolioStock {
  ticker: string
  name: string
  quantity: number
  price: number
  changePercent: number
}
export interface WatchlistStock {
  ticker: string
  name: string
  price: number
  changePercent: number
  targetPrice: number | null
  atTarget: boolean
}
export type AlertType = 'floor' | 'ceiling' | 'percent'
export interface Alert {
  id: number
  ticker: string
  type: AlertType
  value: number
  persistent: boolean
  active: boolean
}
export interface AlertHistoryEntry {
  id: number
  alertId: number
  ticker: string
  triggeredAt: string
  priceAtTrigger: number
}
export interface NewsItem {
  id: number
  ticker: string
  headline: string
  source: string
  url: string
  publishedAt: string
  summary: string | null
  read: boolean
}
export interface Recommendation {
  id: number
  ticker: string
  reasoning: string
  generatedAt: string
}
export interface PriceUpdate {
  ticker: string
  price: number
  changePercent: number
}
export interface AppSettings {
  pollIntervalSeconds: number
  widgetPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  widgetOpacityIdle: number
  newsAutoRefresh: boolean
  recAutoRefreshMorning: boolean
}
```

---

## Environment Variables

```bash
# .env (never commit — use .env.example as template)
OPENAI_API_KEY=
NEWS_API_KEY=
```

---

## Commands

```bash
npm run dev        # Start in development mode
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

---

## Code Conventions

- TypeScript strict mode — no `any`
- All IPC handlers in `src/main/ipc/` — one file per domain
- All external API calls in `src/services/` — never inline in IPC handlers
- Renderer stores (Zustand) are the single source of truth for UI state
- `better-sqlite3` is synchronous — never wrap in fake async
- No comments unless the WHY is non-obvious
- Tailwind `dark:` variants for all color classes — no hardcoded colors
