export const IPC = {
  // Main → Renderer (push)
  PRICES_UPDATE: 'prices:update',
  NEWS_UPDATE: 'news:update',
  ALERT_TRIGGERED: 'alert:triggered',
  RECOMMENDATIONS_READY: 'recommendations:ready',
  UNREAD_COUNT: 'unread:count',
  THEME_CHANGE: 'theme:change',

  // Portfolio
  PORTFOLIO_GET_ALL: 'portfolio:getAll',
  PORTFOLIO_ADD: 'portfolio:add',
  PORTFOLIO_REMOVE: 'portfolio:remove',

  // Watchlist
  WATCHLIST_GET_ALL: 'watchlist:getAll',
  WATCHLIST_ADD: 'watchlist:add',
  WATCHLIST_REMOVE: 'watchlist:remove',
  WATCHLIST_SET_TARGET: 'watchlist:setTarget',

  // Alerts
  ALERTS_GET_ALL: 'alerts:getAll',
  ALERTS_CREATE: 'alerts:create',
  ALERTS_DELETE: 'alerts:delete',
  ALERTS_TOGGLE: 'alerts:toggle',
  ALERTS_GET_HISTORY: 'alerts:getHistory',

  // Recommendations
  RECOMMENDATIONS_FETCH: 'recommendations:fetch',

  // News
  NEWS_GET_ALL: 'news:getAll',
  NEWS_MARK_READ: 'news:markRead',
  NEWS_GET_SUMMARY: 'news:getSummary',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // Window
  WINDOW_OPEN_SETTINGS: 'window:openSettings'
} as const
