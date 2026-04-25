import Database from 'better-sqlite3'
import { join } from 'path'
import log from 'electron-log'
import type {
  Alert,
  AlertHistoryEntry,
  AlertType,
  AppSettings,
  NewsItem,
  Recommendation
} from '../shared/types'

let db: Database.Database

// ─── Init ────────────────────────────────────────────────────────────────────

export function initDb(userDataPath: string): void {
  db = new Database(join(userDataPath, 'ticker.db'))
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  runMigrations()
  seedDefaults()
  log.info('Database ready at', join(userDataPath, 'ticker.db'))
}

function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized — call initDb() first')
  return db
}

// ─── Schema ──────────────────────────────────────────────────────────────────

function runMigrations(): void {
  getDb().exec(`
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
  `)
  log.info('Schema migrations complete')
}

function seedDefaults(): void {
  const insert = getDb().prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
  const defaults: [string, string][] = [
    ['poll_interval_seconds', '60'],
    ['widget_position', 'top-right'],
    ['widget_opacity_idle', '0.4'],
    ['news_auto_refresh', '1'],
    ['rec_auto_refresh_morning', '1']
  ]
  for (const [key, value] of defaults) {
    insert.run(key, value)
  }
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

interface DbPortfolioRow {
  ticker: string
  name: string
  quantity: number
}

export function getPortfolio(): DbPortfolioRow[] {
  return getDb()
    .prepare('SELECT ticker, name, quantity FROM portfolio ORDER BY ticker')
    .all() as DbPortfolioRow[]
}

export function addToPortfolio(ticker: string, name: string, quantity: number): void {
  getDb()
    .prepare('INSERT OR REPLACE INTO portfolio (ticker, name, quantity) VALUES (?, ?, ?)')
    .run(ticker.toUpperCase(), name, quantity)
}

export function removeFromPortfolio(ticker: string): void {
  getDb().prepare('DELETE FROM portfolio WHERE ticker = ?').run(ticker.toUpperCase())
}

export function updatePortfolioQuantity(ticker: string, quantity: number): void {
  getDb()
    .prepare('UPDATE portfolio SET quantity = ? WHERE ticker = ?')
    .run(quantity, ticker.toUpperCase())
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

interface DbWatchlistRow {
  ticker: string
  name: string
  target_price: number | null
}

export function getWatchlist(): DbWatchlistRow[] {
  return getDb()
    .prepare('SELECT ticker, name, target_price FROM watchlist ORDER BY ticker')
    .all() as DbWatchlistRow[]
}

export function addToWatchlist(ticker: string, name: string, targetPrice?: number): void {
  getDb()
    .prepare('INSERT OR REPLACE INTO watchlist (ticker, name, target_price) VALUES (?, ?, ?)')
    .run(ticker.toUpperCase(), name, targetPrice ?? null)
}

export function removeFromWatchlist(ticker: string): void {
  getDb().prepare('DELETE FROM watchlist WHERE ticker = ?').run(ticker.toUpperCase())
}

export function setWatchlistTarget(ticker: string, targetPrice: number | null): void {
  getDb()
    .prepare('UPDATE watchlist SET target_price = ? WHERE ticker = ?')
    .run(targetPrice, ticker.toUpperCase())
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export function getAlerts(): Alert[] {
  const rows = getDb()
    .prepare('SELECT id, ticker, type, value, persistent, active FROM alerts ORDER BY id')
    .all() as {
    id: number
    ticker: string
    type: string
    value: number
    persistent: number
    active: number
  }[]

  return rows.map((r) => ({
    id: r.id,
    ticker: r.ticker,
    type: r.type as AlertType,
    value: r.value,
    persistent: r.persistent === 1,
    active: r.active === 1
  }))
}

export function createAlert(
  ticker: string,
  type: AlertType,
  value: number,
  persistent: boolean
): Alert {
  const result = getDb()
    .prepare('INSERT INTO alerts (ticker, type, value, persistent, active) VALUES (?, ?, ?, ?, 1)')
    .run(ticker.toUpperCase(), type, value, persistent ? 1 : 0)

  return {
    id: result.lastInsertRowid as number,
    ticker: ticker.toUpperCase(),
    type,
    value,
    persistent,
    active: true
  }
}

export function deleteAlert(id: number): void {
  getDb().prepare('DELETE FROM alerts WHERE id = ?').run(id)
}

export function toggleAlert(id: number, active: boolean): void {
  getDb()
    .prepare('UPDATE alerts SET active = ? WHERE id = ?')
    .run(active ? 1 : 0, id)
}

export function logAlertTrigger(
  alertId: number,
  ticker: string,
  priceAtTrigger: number
): AlertHistoryEntry {
  const triggeredAt = new Date().toISOString()
  const result = getDb()
    .prepare(
      'INSERT INTO alert_history (alert_id, ticker, triggered_at, price_at_trigger) VALUES (?, ?, ?, ?)'
    )
    .run(alertId, ticker, triggeredAt, priceAtTrigger)

  return {
    id: result.lastInsertRowid as number,
    alertId,
    ticker,
    triggeredAt,
    priceAtTrigger
  }
}

export function getAlertHistory(): AlertHistoryEntry[] {
  const rows = getDb()
    .prepare(
      'SELECT id, alert_id, ticker, triggered_at, price_at_trigger FROM alert_history ORDER BY triggered_at DESC LIMIT 100'
    )
    .all() as {
    id: number
    alert_id: number
    ticker: string
    triggered_at: string
    price_at_trigger: number
  }[]

  return rows.map((r) => ({
    id: r.id,
    alertId: r.alert_id,
    ticker: r.ticker,
    triggeredAt: r.triggered_at,
    priceAtTrigger: r.price_at_trigger
  }))
}

// ─── News ─────────────────────────────────────────────────────────────────────

type NewsCacheInput = Omit<NewsItem, 'id' | 'summary' | 'read'>

export function getCachedNews(): NewsItem[] {
  return getDb()
    .prepare(
      'SELECT id, ticker, headline, source, url, published_at, summary, read FROM news_cache ORDER BY published_at DESC LIMIT 200'
    )
    .all() as NewsItem[]
}

export function cacheNewsItems(items: NewsCacheInput[]): void {
  const stmt = getDb().prepare(
    'INSERT OR IGNORE INTO news_cache (ticker, headline, source, url, published_at) VALUES (?, ?, ?, ?, ?)'
  )
  const insertMany = getDb().transaction((rows: NewsCacheInput[]) => {
    for (const row of rows) {
      stmt.run(row.ticker, row.headline, row.source, row.url, row.publishedAt)
    }
  })
  insertMany(items)
}

export function markNewsRead(id: number): void {
  getDb().prepare('UPDATE news_cache SET read = 1 WHERE id = ?').run(id)
}

export function updateNewsSummary(id: number, summary: string): void {
  getDb().prepare('UPDATE news_cache SET summary = ? WHERE id = ?').run(summary, id)
}

export function getUnreadCount(): number {
  const row = getDb().prepare('SELECT COUNT(*) as count FROM news_cache WHERE read = 0').get() as {
    count: number
  }
  return row.count
}

export function clearOldNews(olderThanDays = 7): void {
  const cutoff = new Date(Date.now() - olderThanDays * 86400 * 1000).toISOString()
  getDb().prepare('DELETE FROM news_cache WHERE published_at < ?').run(cutoff)
}

// ─── Recommendations ──────────────────────────────────────────────────────────

export function getCachedRecommendations(): Recommendation[] {
  return getDb()
    .prepare('SELECT id, ticker, reasoning, generated_at FROM recommendations_cache ORDER BY id')
    .all() as Recommendation[]
}

export function cacheRecommendations(recs: Omit<Recommendation, 'id'>[]): void {
  const generatedAt = new Date().toISOString()
  getDb().prepare('DELETE FROM recommendations_cache').run()
  const stmt = getDb().prepare(
    'INSERT INTO recommendations_cache (ticker, reasoning, generated_at) VALUES (?, ?, ?)'
  )
  const insertMany = getDb().transaction((rows: Omit<Recommendation, 'id'>[]) => {
    for (const row of rows) {
      stmt.run(row.ticker, row.reasoning, row.generatedAt ?? generatedAt)
    }
  })
  insertMany(recs)
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function getSettings(): AppSettings {
  const rows = getDb().prepare('SELECT key, value FROM settings').all() as {
    key: string
    value: string
  }[]
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]))

  return {
    pollIntervalSeconds: Number(map['poll_interval_seconds'] ?? 60),
    widgetPosition: (map['widget_position'] ?? 'top-right') as AppSettings['widgetPosition'],
    widgetOpacityIdle: Number(map['widget_opacity_idle'] ?? 0.4),
    newsAutoRefresh: map['news_auto_refresh'] === '1',
    recAutoRefreshMorning: map['rec_auto_refresh_morning'] === '1'
  }
}

export function updateSettings(partial: Partial<AppSettings>): void {
  const stmt = getDb().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
  const updateMany = getDb().transaction((updates: [string, string][]) => {
    for (const [key, value] of updates) {
      stmt.run(key, value)
    }
  })

  const updates: [string, string][] = []
  if (partial.pollIntervalSeconds !== undefined)
    updates.push(['poll_interval_seconds', String(partial.pollIntervalSeconds)])
  if (partial.widgetPosition !== undefined)
    updates.push(['widget_position', partial.widgetPosition])
  if (partial.widgetOpacityIdle !== undefined)
    updates.push(['widget_opacity_idle', String(partial.widgetOpacityIdle)])
  if (partial.newsAutoRefresh !== undefined)
    updates.push(['news_auto_refresh', partial.newsAutoRefresh ? '1' : '0'])
  if (partial.recAutoRefreshMorning !== undefined)
    updates.push(['rec_auto_refresh_morning', partial.recAutoRefreshMorning ? '1' : '0'])

  updateMany(updates)
}
