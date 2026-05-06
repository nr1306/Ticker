import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppSettings } from '../../../../shared/types'

function formatInterval(s: number): string {
  if (s < 60) return `${s}s`
  if (s % 60 === 0) return `${s / 60}m`
  return `${s}s`
}

export default function SettingsTab() {
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    window.api.settings.get().then(setSettings)
  }, [])

  const save = async (partial: Partial<AppSettings>) => {
    if (!settings) return
    setSettings({ ...settings, ...partial })
    await window.api.settings.set(partial as Record<string, unknown>)
  }

  if (!settings) {
    return (
      <div className="p-8">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading…</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-2">Settings</h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          All changes take effect immediately.
        </p>
      </div>

      <div className="flex flex-col gap-6 max-w-2xl">
        {/* Widget */}
        <section>
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-3 uppercase tracking-widest">
            Widget
          </p>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 divide-y divide-zinc-100 dark:divide-zinc-800">
            <SettingRow
              label="Position"
              description="Which corner of the screen the widget appears in"
            >
              <select
                value={settings.widgetPosition}
                onChange={(e) =>
                  save({ widgetPosition: e.target.value as AppSettings['widgetPosition'] })
                }
                className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              >
                <option value="top-right">Top right</option>
                <option value="top-left">Top left</option>
                <option value="bottom-right">Bottom right</option>
                <option value="bottom-left">Bottom left</option>
              </select>
            </SettingRow>

            <SettingRow
              label="Idle opacity"
              description="Transparency when the widget is not being hovered"
            >
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0.1}
                  max={0.9}
                  step={0.1}
                  value={settings.widgetOpacityIdle}
                  onChange={(e) => save({ widgetOpacityIdle: Number(e.target.value) })}
                  className="w-28 accent-zinc-700 dark:accent-zinc-300"
                />
                <span className="text-sm tabular-nums w-9 text-right text-zinc-500 dark:text-zinc-400">
                  {Math.round(settings.widgetOpacityIdle * 100)}%
                </span>
              </div>
            </SettingRow>
          </div>
        </section>

        {/* Data */}
        <section>
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-3 uppercase tracking-widest">
            Data
          </p>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700">
            <SettingRow
              label="Price refresh interval"
              description="How often live stock prices are fetched — resets the poller immediately"
            >
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={30}
                  max={300}
                  step={30}
                  value={settings.pollIntervalSeconds}
                  onChange={(e) => save({ pollIntervalSeconds: Number(e.target.value) })}
                  className="w-28 accent-zinc-700 dark:accent-zinc-300"
                />
                <span className="text-sm tabular-nums w-9 text-right text-zinc-500 dark:text-zinc-400">
                  {formatInterval(settings.pollIntervalSeconds)}
                </span>
              </div>
            </SettingRow>
          </div>
        </section>

        {/* Automation */}
        <section>
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-3 uppercase tracking-widest">
            Automation
          </p>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 divide-y divide-zinc-100 dark:divide-zinc-800">
            <SettingRow
              label="News auto-refresh"
              description="Automatically fetch the latest headlines when you open the News tab"
            >
              <Toggle
                checked={settings.newsAutoRefresh}
                onChange={(v) => save({ newsAutoRefresh: v })}
              />
            </SettingRow>

            <SettingRow
              label="Morning AI recommendations"
              description="Auto-generate stock insights via GPT-4o each morning when Ticker starts"
            >
              <Toggle
                checked={settings.recAutoRefreshMorning}
                onChange={(v) => save({ recAutoRefreshMorning: v })}
              />
            </SettingRow>
          </div>
        </section>
      </div>
    </div>
  )
}

function SettingRow({
  label,
  description,
  children
}: {
  label: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 gap-6">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-zinc-700 dark:bg-zinc-200' : 'bg-zinc-200 dark:bg-zinc-700'
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
