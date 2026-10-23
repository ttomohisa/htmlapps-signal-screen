# Changelog

## Unreleased

- Standardize the English local-processing badge to “Fully local processing” without changing its artwork or behavior.

## 1.0.4 - 2026-10-11

- Keep page scrolling locked while Help or a native confirmation is open, with contained dialog-body scrolling.
- Reserve Reset and flashing confirmation header/footer space so actions stay reachable in short windows.
- Restore a visible opener after dismissal or resizing without starting the display or stealing newer focus.
- Preserve the existing local-processing shield/check and app logo; expand bilingual Help and dialog regressions.

## 1.0.3 - 2026-10-09

- Normalize the app icon background to `#16624f` with 25% corner radii, and keep the asset, header and favicon consistent without changing the artwork.

## 1.0.2 - 2026-10-09

- Add a real English catalog screenshot and use it in the English README, preserving app behavior and the supplied icon.

## 1.0.1 - 2026-10-07

- Standardized header language targets as EN / JA with localized accessible names and tooltips.
- Localized Help tooltips and standardized the Japanese fully-local processing badge.
- Added a session-only Pin controls toggle with Japanese/English labels and accessible pressed state.
- Kept manual Keep awake Off across tab returns and prevented obsolete wake-lock requests from reviving an earlier intent.
- Fixed preview and stage text fitting for short, long, and multiline messages.
- Isolated display focus, restored invokers, and kept Escape scoped to the topmost dialog.
- Prevented late display-session completions from retaining wake locks or exiting a newer fullscreen session.
- Localized reset defaults and disclosed QR deletion and flashing acknowledgement reset.
- Added automated regression and artifact-parity checks; canonical builds refresh the root HTML download.

## 1.0.0 - 2026-08-17
- Separated the display-mode switch and preview into distinct visual surfaces on desktop and mobile.
- Initial Signal Screen release.
- Added giant text and direction presets.
- Added local QR display mode for URLs and UTF-8 text with scan-friendly black/white rendering and quiet zone.
- Added six high-contrast background colors.
- Added low-frequency Slow, Beacon, and SOS flash patterns with a first-use safety confirmation.
- Added reduced-motion protection, Fullscreen, Wake Lock, LocalStorage, and bilingual UI.
- Adopted the current template self-extract safeguards: ASCII-only loader and inherited favicon.
