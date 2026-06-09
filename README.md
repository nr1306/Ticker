# Ticker

A lightweight ambient desktop app for working professionals who hold stocks but can't afford distraction during office hours. Ticker lives quietly in a corner of your screen and surfaces just enough — live prices, % change, smart alerts, news headlines, and AI-generated insights — without pulling your attention away from actual work.

**It never executes trades, connects to a brokerage, or manages money.**

---

## What it looks like

A small always-on-top widget floats in a corner of your screen. At idle it fades to 40% opacity (configurable). Hover it and it snaps to full opacity, showing your portfolio and watchlist with live prices. A gear icon opens the full settings panel where you manage everything else.

---

## Features

| Feature                | Description                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| **Live prices**        | Portfolio and watchlist prices polled from Yahoo Finance — no API key required                 |
| **Watchlist**          | Track any ticker with an optional target price; widget highlights when price hits target       |
| **Price alerts**       | Floor, ceiling, or % move alerts with system notifications; one-time or persistent             |
| **News Pulse**         | Latest headlines per ticker from NewsAPI, cached locally                                       |
| **AI recommendations** | GPT-4o analyses your portfolio and surfaces 5 insights each morning                            |
| **Settings**           | Widget corner, idle opacity, poll interval, and automation toggles — all take effect instantly |

---

## Prerequisites

- **Node.js** v20 or later
- **npm** v10 or later
- **macOS** (primary target; Windows untested)
- **OpenAI API key** — required for AI recommendations
- **NewsAPI key** — required for News Pulse (free tier: 100 req/day)

Get your keys:

- OpenAI: https://platform.openai.com/api-keys
- NewsAPI: https://newsapi.org/register

---

## Quick start

```bash
# 1. Clone the repo
git clone https://github.com/nr1306/ticker.git
cd ticker

# 2. Install dependencies
#    postinstall automatically rebuilds better-sqlite3 against Electron's Node
npm install

# 3. Add your API keys
cp .env.example .env
# Edit .env and fill in:
#   OPENAI_API_KEY=sk-...
#   NEWS_API_KEY=...

# 4. Start in dev mode
npm run dev
```

The floating widget appears in the top-right corner. Click the gear icon (or right-click the tray icon) to open Settings and add your first stock.

---

## Environment variables

```bash
# .env  —  never commit this file
OPENAI_API_KEY=      # GPT-4o recommendations + on-demand news summaries
NEWS_API_KEY=        # NewsAPI headlines per ticker
```

The app starts and all non-AI features work without any keys. The Recommendations and News tabs will silently produce no data until the respective keys are present.

---

## Project structure

```
src/
├── main/                     # Electron main process (Node.js)
│   ├── index.ts              # Entry point — bootstraps DB, IPC, windows, pollers
│   ├── floatingWindow.ts     # Frameless always-on-top widget window
│   ├── settingsWindow.ts     # Full settings panel
│   ├── tray.ts               # System tray icon and menu
│   ├── pricePoller.ts        # Background price polling with exponential backoff
│   ├── newsFetcher.ts        # NewsAPI fetch + SQLite cache
│   ├── recommendationsFetcher.ts  # GPT-4o call + broadcast
│   ├── alertEvaluator.ts     # Threshold comparisons + system notifications
│   └── ipc/                  # One file per domain (portfolio, watchlist, alerts, news, …)
│
├── renderer/
│   ├── widget/               # Floating widget UI (React)
│   └── settings/             # Settings panel UI (React + Zustand stores)
│       └── tabs/             # Portfolio, Watchlist, Alerts, News, Recommendations, Settings
│
├── services/
│   ├── db.ts                 # All SQLite CRUD (better-sqlite3, synchronous)
│   ├── stockApi.ts           # yahoo-finance2 price fetcher
│   ├── newsApi.ts            # NewsAPI wrapper
│   └── recommendationsService.ts  # OpenAI prompt construction + parsing
│
└── shared/
    ├── types.ts              # Shared TypeScript interfaces
    └── constants.ts          # IPC channel name constants
```

**Architecture rule:** the main process owns all I/O. Renderers never call external APIs or SQLite directly — everything goes through typed IPC channels.

---

## Available scripts

```bash
npm run dev          # Dev mode with HMR
npm run build        # Production build → out/
npm run preview      # Preview the production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit (both main and renderer configs)
npm run test         # Vitest unit tests
npm run dist:mac     # Package for macOS → dist/
npm run dist:win     # Package for Windows → dist/
```

---

## How the data flows

```
Yahoo Finance
    └─▶ pricePoller.ts  (every N seconds, configurable)
            ├─▶ prices:update  ──▶  widget (live price display)
            ├─▶ prices:update  ──▶  settings panel (watchlist tab)
            └─▶ alertEvaluator.ts
                    └─▶ Electron Notification  (system alert)

NewsAPI
    └─▶ newsFetcher.ts  (on startup + manual refresh)
            └─▶ news_cache table  ──▶  News tab

OpenAI GPT-4o
    └─▶ recommendationsFetcher.ts  (on startup if stale, or on demand)
            └─▶ recommendations_cache table  ──▶  Recommendations tab
```

All persistent state lives in a SQLite database at the Electron `userData` path (`~/Library/Application Support/ticker/` on macOS). The database is created automatically on first launch.

---

## Database location

| Platform | Path                                             |
| -------- | ------------------------------------------------ |
| macOS    | `~/Library/Application Support/ticker/ticker.db` |
| Windows  | `%APPDATA%\ticker\ticker.db`                     |

You can inspect the database with [DB Browser for SQLite](https://sqlitebrowser.org) while the app is running.

---

## Price polling details

- First poll fires 3 seconds after startup (gives Yahoo Finance time to settle)
- Default interval: 60 seconds (adjustable in Settings: 30s – 5m)
- On failure: retries in 15s, then exponential backoff up to 10 minutes
- Polls all tickers that appear in portfolio, watchlist, or active alerts (deduplicated)

---

## Alert types

| Type      | Triggers when                                                  |
| --------- | -------------------------------------------------------------- |
| `floor`   | Price drops **at or below** the set value                      |
| `ceiling` | Price rises **at or above** the set value                      |
| `percent` | Intraday % change exceeds the set threshold (either direction) |

One-time alerts auto-deactivate after firing. Persistent alerts keep firing on every poll while the condition holds.

---

## Known gotchas

**yahoo-finance2 is ESM-only.** The main process runs in CJS context. It is loaded with a lazy dynamic `import()` and cached — never with a static `import` statement. See `src/services/stockApi.ts`.

**better-sqlite3 needs a native rebuild.** `npm install` runs `electron-rebuild` automatically via the `postinstall` script. If you see a `NODE_MODULE_VERSION` mismatch error, run:

```bash
npx electron-rebuild -f -w better-sqlite3
```

**eslint-plugin-react doesn't declare ESLint 10 support.** Install with `--legacy-peer-deps` if you add it fresh. The plugin works correctly with ESLint 10.

---

## Tech stack

| Concern           | Choice                                                          |
| ----------------- | --------------------------------------------------------------- |
| Desktop framework | Electron ^41                                                    |
| Build tool        | electron-vite 6.0                                               |
| UI                | React ^19 + TypeScript ^6                                       |
| Styling           | Tailwind CSS v4 (no config file — `@tailwindcss/vite` plugin)   |
| State (renderer)  | Zustand ^5                                                      |
| Database          | SQLite via better-sqlite3 ^12                                   |
| Stock prices      | yahoo-finance2 ^2 (no API key)                                  |
| News              | NewsAPI via axios                                               |
| AI                | OpenAI SDK — gpt-4o (recommendations) + gpt-4o-mini (summaries) |
| Logging           | electron-log ^5                                                 |

---

## Packaging & distribution

### Build a distributable

```bash
# macOS — outputs a .dmg to dist/
npm run dist:mac

# Windows — must run on a Windows machine (see note below)
npm run dist:win
```

Output lands in `dist/`. The macOS build produces two `.dmg` files — one for Intel (x64) and one for Apple Silicon (arm64).

### API keys in the packaged app

The packaged app reads its `.env` from the Electron `userData` directory, not the repo root. After installing, create the file at:

| Platform | Path                                        |
| -------- | ------------------------------------------- |
| macOS    | `~/Library/Application Support/ticker/.env` |
| Windows  | `%APPDATA%\ticker\.env`                     |

File contents:

```bash
OPENAI_API_KEY=sk-...
NEWS_API_KEY=...
```

The app starts without these keys — all non-AI features work. The Recommendations and News tabs stay empty until keys are present.

### Apple Silicon — "damaged app" warning

Unsigned apps on Apple Silicon show _"Ticker is damaged and can't be opened"_ instead of the usual Gatekeeper prompt. Fix it by clearing the quarantine attribute after installation:

```bash
xattr -cr /Applications/Ticker.app
```

Then re-open normally.

### Windows cross-compile limitation

`better-sqlite3` is a native module. Building the Windows `.exe` from macOS requires the Windows toolchain and will fail at the native rebuild step. Two options:

- Build on a Windows machine (clone the repo, `npm install`, `npm run dist:win`)
- Use [GitHub Actions](https://github.com/features/actions) with a `windows-latest` runner

---

## License

MIT
