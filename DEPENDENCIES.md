# Ticker — Dependency Reference

A plain-English explanation of every package used in this project and why it's here.

---

## Production Dependencies

### electron

The core framework that wraps a web app (HTML/CSS/JS) into a native desktop application. It bundles Node.js (for file system, OS APIs) and Chromium (for rendering the UI) together. Gives us native windows, system tray, desktop notifications, and always-on-top behavior.

### react + react-dom

The UI library used to build both the floating widget and the settings panel. `react` is the core library (components, hooks, state). `react-dom` renders those components into the Electron window's HTML.

### zustand

Lightweight state management for the React renderer. Stores live data (portfolio stocks, news items, recommendations) that the UI reads and updates. Simpler than Redux — no boilerplate, just functions.

### better-sqlite3

Synchronous SQLite driver for Node.js. Used in the Electron main process to read and write all persistent data: portfolio, watchlist, alerts, news cache, recommendations cache, and settings. Synchronous means no async/await complexity for database calls.

### yahoo-finance2

Fetches real-time and historical stock price data from Yahoo Finance without needing an API key. Used in the price poller to get current price and daily % change for every stock in the portfolio and watchlist. Development-only — can be swapped for Polygon.io in production.

### axios

HTTP client for making REST API requests. Used specifically to call the NewsAPI to fetch financial news headlines. Handles request configuration, response parsing, and error handling cleanly.

### openai

The official OpenAI JavaScript SDK. Used in two places:

- `gpt-4o` — generates the 5 stock recommendations based on the user's portfolio context
- `gpt-4o-mini` — generates 2-3 sentence summaries of news articles on demand (cheaper, faster)

### electron-log

Structured logging for the Electron main process. Writes logs to a file on disk (not just the terminal console). Essential for debugging background processes like the price poller and alert engine in production builds where DevTools are not open.

---

## Dev Dependencies

### electron-vite

The build tool for this project. Combines Vite (fast bundler) with Electron-specific config to handle both the main process (Node.js) and renderer process (React) in one setup. Provides hot module replacement (HMR) so UI changes reflect instantly without restarting the app.

### typescript

Adds static types to JavaScript. Catches bugs at compile time (wrong IPC payload shape, missing fields, wrong function arguments) instead of at runtime. Used everywhere — main process, renderer, and shared types.

### tailwindcss

Utility-first CSS framework. Instead of writing custom CSS files, you apply classes like `text-green-500`, `bg-zinc-900`, `dark:bg-white` directly in JSX. The `darkMode: 'media'` setting makes it automatically follow the OS light/dark theme.

### eslint + eslint-plugin-react + eslint-plugin-react-hooks

Static analysis tool that catches code quality issues, bad patterns, and potential bugs. The React plugins add rules specific to React components and hooks (e.g., missing dependency arrays in `useEffect`).

### @typescript-eslint/eslint-plugin + @typescript-eslint/parser

Extends ESLint to understand TypeScript syntax and adds TypeScript-specific lint rules (no `any`, proper type assertions, etc.).

### prettier

Automatic code formatter. Enforces consistent style (indentation, quotes, trailing commas) across the whole project on save. Eliminates style debates and keeps diffs clean.

### eslint-config-prettier

Disables ESLint rules that would conflict with Prettier's formatting. You need this when using both tools together — without it they fight each other.

### husky

Runs scripts automatically at git hook points. Used here to trigger lint and type checks before every `git commit`. If the checks fail, the commit is blocked. Prevents broken code from entering any version tag.

### lint-staged

Works with Husky. Instead of linting the entire codebase on every commit, it only lints the files that are staged (changed). Makes pre-commit checks fast even as the project grows.

### commitizen + cz-conventional-changelog

Replaces `git commit` with an interactive prompt (`git cz`) that guides you through writing a structured commit message:

```
feat(widget): add live price color coding
fix(alerts): correct floor threshold comparison
chore(deps): upgrade yahoo-finance2
```

These structured messages are the input that `release-it` uses to auto-generate changelogs and version numbers.

### release-it + @release-it/conventional-changelog

Automates the release process. After finishing a feature, running `npx release-it` will:

1. Read all commits since the last tag
2. Determine the next version number (patch/minor/major) based on commit types
3. Update `package.json` version
4. Generate / update `CHANGELOG.md`
5. Create a git tag (`v0.6.0`, etc.)

### electron-devtools-installer

Installs browser extensions (React DevTools, Redux DevTools) inside the Electron window during development. Without this, you cannot inspect React component trees or Zustand store state in the Electron app.

### msw (Mock Service Worker)

Intercepts HTTP requests during development and returns mock responses instead of hitting real APIs. Used to mock:

- `yahoo-finance2` stock price responses
- NewsAPI headline responses
- OpenAI API responses

Prevents burning through rate limits (NewsAPI: 100 req/day, OpenAI: costs money) while developing and iterating on UI.

### vitest

Vite-native unit testing framework. Integrates directly with `electron-vite` — no separate config needed. Used to test:

- `db.ts` CRUD logic
- `alertEngine.ts` threshold comparison logic
- `aiService.ts` prompt construction
- Zustand store state transitions

### @testing-library/react + @testing-library/jest-dom

Testing utilities for React components. `@testing-library/react` renders components in a test environment and provides queries to find elements. `@testing-library/jest-dom` adds custom matchers like `toBeInTheDocument()`, `toHaveClass()`, etc.

---

## GUI Tools (Installed Separately)

### DB Browser for SQLite

A desktop GUI application for opening and inspecting `.db` SQLite files. During development, open the app's database file directly to browse tables, run SQL queries, and verify data is being written correctly — without adding `console.log` statements everywhere. Download from sqlitebrowser.org.

---

## Install Timing Reference

| When                   | What                        |
| ---------------------- | --------------------------- |
| `v0.1.0` scaffold      | Everything above except msw |
| `v0.5.0` price polling | msw                         |
| Before `v0.3.0`        | DB Browser for SQLite (GUI) |

## Environment Variables

```bash
OPENAI_API_KEY=      # Required for AI recommendations and news summaries
NEWS_API_KEY=        # Required for News Pulse feature
```
