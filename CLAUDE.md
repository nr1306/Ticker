# Ticker — Stock Companion App

A lightweight, ambient desktop application for working professionals who actively hold stocks but cannot afford distraction during office hours. The app lives quietly in a corner of the screen and provides just enough visibility to stay informed without interrupting primary work.

**Core philosophy:** Ambient awareness, not a trading platform. It never executes trades, connects to brokerages, or manages money.

---

## Current Version: v0.9.0

### Build Progress

| Version | Feature                                                        | Status                                     |
| ------- | -------------------------------------------------------------- | ------------------------------------------ |
| v0.1.0  | Project scaffold — Electron + React + TypeScript + Tailwind v4 | ✅ Done                                    |
| v0.2.0  | Two-window setup, collapsible widget, settings tab routing     | ✅ Done                                    |
| v0.3.0  | SQLite schema, full CRUD service, IPC handler layer            | ✅ Done                                    |
| v0.4.0  | Portfolio management UI with ticker lookup                     | ✅ Done (UI spacing polish pending commit) |
| v0.5.0  | Live price polling (yahoo-finance2 + pricePoller)              | ✅ Done                                    |
| v0.6.0  | Live floating widget with prices + % change                    | ✅ Done                                    |
| v0.7.0  | Watchlist                                                      | ✅ Done                                    |
| v0.8.0  | Smart price alerts + system notifications                      | ✅ Done                                    |
| v0.9.0  | News Pulse (NewsAPI)                                           | ✅ Done                                    |
| v1.0.0  | AI news summaries (GPT-4o-mini)                                | ⛔ Skipped — users read full articles      |
| v1.1.0  | AI stock recommendations (GPT-4o)                              | ✅ Done                                    |
| v1.2.0  | CSV portfolio import                                           | ⏳ Pending                                 |
| v1.3.0  | Settings + preferences UI                                      | ⏳ Pending                                 |
| v1.4.0  | Packaging + distribution                                       | ⏳ Pending                                 |

---

## Actual Tech Stack (corrected versions)

| Concern           | Choice                                                      |
| ----------------- | ----------------------------------------------------------- |
| Desktop framework | Electron ^41.3.0                                            |
| Build tool        | electron-vite 6.0.0-beta.1                                  |
| UI framework      | React ^19.2.5 + TypeScript ^6.0.3                           |
| Styling           | Tailwind CSS v4 + @tailwindcss/vite (no config file needed) |
| State management  | Zustand ^5.0.3 (renderer only)                              |
| Database          | SQLite via better-sqlite3 ^12.9.0                           |
| Stock prices      | yahoo-finance2 ^2.13.3 (ESM-only — see Gotchas)             |
| News              | NewsAPI via axios                                           |
| AI                | OpenAI SDK (gpt-4o / gpt-4o-mini)                           |
| Logging           | electron-log ^5.2.4                                         |
| Native rebuild    | @electron/rebuild ^4.0.4                                    |

---

## Actual Project Structure (as built)

```
ticker/
├── src/
│   ├── main/
│   │   ├── index.ts                    # App entry — initDb, registers all IPC, creates windows
│   │   ├── floatingWindow.ts           # Frameless always-on-top widget (300px, transparent)
│   │   ├── pricePoller.ts              # Background stock polling + prices:update broadcasts
│   │   ├── settingsWindow.ts           # Settings panel (820×600, resizable)
│   │   ├── tray.ts                     # System tray icon + Show/Hide/Settings/Quit menu
│   │   └── ipc/
│   │       ├── portfolio.ts            # portfolio:getAll/add/remove/updateQuantity
│   │       ├── watchlist.ts            # watchlist:getAll/add/remove/setTarget
│   │       ├── alerts.ts               # alerts:getAll/create/delete/toggle/getHistory
│   │       ├── news.ts                 # news:getAll/markRead/getSummary/unreadCount
│   │       ├── recommendations.ts      # recommendations:fetch (AI wired in v1.1.0)
│   │       ├── settings.ts             # settings:get/set
│   │       └── ticker.ts               # ticker:lookup (yahoo-finance2 company name lookup)
│   │
│   ├── renderer/
│   │   ├── widget/
│   │   │   ├── index.html
│   │   │   └── src/
│   │   │       ├── main.tsx
│   │   │       ├── App.tsx             # Collapsible widget, hover opacity, drag header
│   │   │       ├── index.css           # @import "tailwindcss", drag-region styles
│   │   │       └── env.d.ts            # window.api types for widget
│   │   └── settings/
│   │       ├── index.html
│   │       └── src/
│   │           ├── main.tsx
│   │           ├── App.tsx             # Sidebar nav (w-56), tab routing
│   │           ├── index.css
│   │           ├── env.d.ts            # window.api types for settings
│   │           ├── stores/
│   │           │   ├── portfolioStore.ts   # Zustand: fetch/add/remove via IPC
│   │           │   └── watchlistStore.ts   # Zustand: fetch/add/remove/setTarget + price updates
│   │           └── tabs/
│   │               ├── Portfolio.tsx   # Full UI: add form, ticker lookup, stocks table
│   │               ├── Watchlist.tsx   # Full UI: add form, ticker lookup, live prices, target price editing
│   │               ├── Alerts.tsx      # Full UI: add form, active table, history (v0.8.0)
│   │               ├── News.tsx        # Placeholder (v0.9.0)
│   │               ├── Recommendations.tsx # Placeholder (v1.1.0)
│   │               └── SettingsTab.tsx # Placeholder (v1.3.0)
│   │
│   ├── services/
│   │   ├── db.ts                       # Full SQLite CRUD (initDb, all 6 domains)
│   │   └── stockApi.ts                 # yahoo-finance2 quote wrapper for live prices
│   │
│   └── shared/
│       ├── types.ts                    # All shared TypeScript interfaces
│       └── constants.ts                # IPC channel name constants
│
├── resources/
│   └── README.md                       # Icon placement instructions
├── CLAUDE.md
├── DEPENDENCIES.md
├── .env.example
├── .gitignore
├── .prettierrc
├── .commitlintrc.json
├── .release-it.json
├── electron.vite.config.ts             # Multi-renderer: widget + settings
├── eslint.config.mjs                   # ESLint 10 flat config (.mjs for ESM)
├── tsconfig.json / tsconfig.node.json / tsconfig.web.json
├── vitest.config.ts
└── package.json
```

---

## Architecture Rules

- **Main process owns all I/O.** Renderer never calls external APIs or SQLite directly.
- **IPC is the API.** Every channel is typed. Renderer invokes → main responds.
- **Renderer is display-only.** Zustand stores hold UI state, populated by IPC.
- **No brokerage connections.** Portfolio entered manually or via CSV. No OAuth, no credentials.
- **Commit subjects must be lowercase** — commitlint enforces this. `feat(db): sqlite...` not `feat(db): SQLite...`

---

## Known Gotchas

### yahoo-finance2 is ESM-only

The main process runs in CJS context. Never use a static import:

```typescript
// ❌ WRONG — throws ERR_PACKAGE_PATH_NOT_EXPORTED
import yahooFinance from 'yahoo-finance2'

// ✅ CORRECT — lazy dynamic import with cache
let _yf: typeof import('yahoo-finance2').default | null = null
async function getYF() {
  if (!_yf) _yf = (await import('yahoo-finance2')).default
  return _yf
}
```

This pattern applies everywhere yahoo-finance2 is used (ticker lookup, price poller).

### better-sqlite3 requires native rebuild

Must be rebuilt against Electron's Node version after install:

```bash
npx electron-rebuild -f -w better-sqlite3
```

The `postinstall` script in package.json runs this automatically on `npm install`.

### eslint-plugin-react doesn't declare ESLint 10 support

Install with `--legacy-peer-deps`. The plugin works fine with ESLint 10.

### eslint.config.js must be .mjs

Without `"type": "module"` in package.json (which would break Electron's CJS main process), the ESLint flat config must use the `.mjs` extension to be treated as ESM.

---

## Window Specs

### Floating Widget

```
width:        300px
height:       dynamic (collapses to header bar)
frame:        false
transparent:  true
alwaysOnTop:  true  (level: 'floating')
skipTaskbar:  true
resizable:    false
opacity:      0.4 idle → 1.0 on hover (CSS transition on div, not window)
position:     top-right by default (saved in settings table)
drag:         header bar has -webkit-app-region: drag; buttons exempt
```

### Settings Panel

```
width:        820px    minWidth: 680px
height:       600px    minHeight: 500px
frame:        true
alwaysOnTop:  false
resizable:    true
sidebar:      w-56 (224px)
```

---

## IPC Channel Reference

### Main → Renderer (push events)

| Channel                 | Payload                                    |
| ----------------------- | ------------------------------------------ |
| `prices:update`         | `PriceUpdate[]`                            |
| `news:update`           | `NewsItem[]`                               |
| `alert:triggered`       | `{ alert: Alert, priceAtTrigger: number }` |
| `recommendations:ready` | `Recommendation[]`                         |
| `unread:count`          | `number`                                   |
| `theme:change`          | `'dark' \| 'light'`                        |

### Renderer → Main (invoke — returns Promise)

| Channel                 | Args                              | Returns                   |
| ----------------------- | --------------------------------- | ------------------------- |
| `portfolio:getAll`      | —                                 | `PortfolioStock[]`        |
| `portfolio:add`         | `ticker, name, quantity`          | `void`                    |
| `portfolio:remove`      | `ticker`                          | `void`                    |
| `watchlist:getAll`      | —                                 | `WatchlistStock[]`        |
| `watchlist:add`         | `ticker, name, targetPrice?`      | `void`                    |
| `watchlist:remove`      | `ticker`                          | `void`                    |
| `watchlist:setTarget`   | `ticker, targetPrice`             | `void`                    |
| `alerts:getAll`         | —                                 | `Alert[]`                 |
| `alerts:create`         | `ticker, type, value, persistent` | `Alert`                   |
| `alerts:delete`         | `id`                              | `void`                    |
| `alerts:toggle`         | `id, active`                      | `void`                    |
| `alerts:getHistory`     | —                                 | `AlertHistoryEntry[]`     |
| `recommendations:fetch` | —                                 | `Recommendation[]`        |
| `news:getAll`           | —                                 | `NewsItem[]`              |
| `news:markRead`         | `id`                              | `void`                    |
| `news:getSummary`       | `id`                              | `string`                  |
| `settings:get`          | —                                 | `AppSettings`             |
| `settings:set`          | `Partial<AppSettings>`            | `void`                    |
| `ticker:lookup`         | `ticker`                          | `{ ticker, name, valid }` |
| `window:openSettings`   | —                                 | `void`                    |

---

## SQLite Schema

```sql
CREATE TABLE IF NOT EXISTS portfolio (
  ticker    TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  quantity  REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS watchlist (
  ticker        TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  target_price  REAL
);

CREATE TABLE IF NOT EXISTS alerts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker      TEXT NOT NULL,
  type        TEXT NOT NULL CHECK(type IN ('floor', 'ceiling', 'percent')),
  value       REAL NOT NULL,
  persistent  INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS alert_history (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id         INTEGER REFERENCES alerts(id) ON DELETE SET NULL,
  ticker           TEXT NOT NULL,
  triggered_at     TEXT NOT NULL,
  price_at_trigger REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS news_cache (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker       TEXT NOT NULL,
  headline     TEXT NOT NULL,
  source       TEXT NOT NULL,
  url          TEXT NOT NULL UNIQUE,
  published_at TEXT NOT NULL,
  summary      TEXT,
  read         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS recommendations_cache (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker       TEXT NOT NULL,
  reasoning    TEXT NOT NULL,
  generated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

**Default settings rows:**

- `poll_interval_seconds` → `60`
- `widget_position` → `top-right`
- `widget_opacity_idle` → `0.4`
- `news_auto_refresh` → `1`
- `rec_auto_refresh_morning` → `1`

---

## Environment Variables

```bash
# .env — never commit. Use .env.example as template.
OPENAI_API_KEY=
NEWS_API_KEY=
```

---

## Commands

```bash
npm run dev           # Start Electron in dev mode (HMR enabled)
npm run build         # Production build → out/
npm run preview       # Preview production build
npm run lint          # ESLint (flat config)
npm run typecheck     # tsc --noEmit on both node + web configs
npm run test          # Vitest
npm run commit        # Commitizen interactive commit prompt (git cz)
npm run release       # release-it — bumps version, generates CHANGELOG, tags
```

---

## Code Conventions

- TypeScript strict mode — no `any`
- All IPC handlers in `src/main/ipc/` — one file per domain
- All external API calls in `src/services/` — never inline in IPC handlers
- Renderer Zustand stores are the single source of truth for UI state
- `better-sqlite3` is synchronous — never wrap db calls in fake async
- `yahoo-finance2` must always be loaded via dynamic `import()` — never static
- No comments unless the WHY is non-obvious
- Tailwind `dark:` variants on all color classes — no hardcoded colors
- Commit subjects must be lowercase (commitlint enforces)

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:

- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

## SPECIAL INSTRUCTION

Do not make any changes until you have 95% confidence in what you need to build. Ask me follow up questions until you reach that confidence.

## Applied Learning

- Validate inputs before execution; bad inputs cause cascading failures.
- Re-run tasks after fixing inputs; first outputs often incomplete.
- Avoid redundant explanations; default to concise outputs.
- Cache repeated results to reduce recomputation and tokens.
- Prefer structured output over paragraphs for clarity and reuse.
- Skip steps already completed unless state has changed.
- Do not retry failing actions without modifying approach.
- Use deterministic logic for validation instead of LLM reasoning.
- Break tasks only when necessary; over-decomposition wastes tokens.
- Avoid regenerating identical content; reuse previous outputs.
- Validate file paths and dependencies before execution.
- Limit tool usage; unnecessary calls increase latency and cost.
- Prefer parallel execution for independent tasks.
- Eliminate verbose reasoning unless explicitly required.
- Detect and stop infinite or redundant loops early.
