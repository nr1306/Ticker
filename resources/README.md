# Resources

Place app icons here before packaging.

## Required files

- `tray-icon.png` — 16x16px or 22x22px, monochrome (white/black for macOS template). Used in the system tray / menu bar.
- `icon.png` — 512x512px app icon used by electron-builder for the packaged app.

## macOS template images

On macOS, tray icons should be white/black with transparency so the OS can tint them to match the menu bar. Name the file `tray-iconTemplate.png` and macOS will automatically adapt it for light/dark mode.

## Placeholder

Until icons are added, the tray falls back to a text label ("T") on macOS.
