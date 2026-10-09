# APP_SPEC.md

## 1. Product identity
- **Name:** Signal Screen
- **Version:** 1.0.2
- **Purpose:** Turn a phone or computer screen into a large, high-contrast visual signal.
- **Primary users:** People who need a temporary sign for meetups, directions, events, travel, or emergencies.
- **Release artifacts:** `dist/index.html`, `dist/index.self-extract.html`

## 2. Core outcome
A user can enter a short message or choose a preset, choose a signal color and optional low-frequency flash pattern, then show it as large as possible without installing an app.

## 3. Core user flow
1. Open locally or on GitHub Pages.
2. Choose Text & arrows or QR mode.
3. In text mode, enter up to 60 characters or choose HERE / HELP / SOS / STOP / arrow presets. In QR mode, enter up to 300 UTF-8 bytes.
4. In text mode, pick one of six high-contrast background colors.
5. Optionally choose Slow, Beacon, or SOS flashing after the first-use safety confirmation. QR mode never flashes.
6. Press **Show full screen**.
7. Tap the stage to hide controls; exit when finished.

## 4. Functional requirements
- Live preview.
- Local QR generation for URLs and short UTF-8 text with a 4-module quiet zone.
- QR mode uses fixed black modules on white and disables flashing for scan reliability.
- Auto-fit message size in preview and stage using a stable content box, including wrapped and multiline input.
- Presets for short messages and four directions.
- Automatic white/black foreground contrast.
- Steady, slow, beacon, and SOS flash patterns.
- Flashing must be disabled when `prefers-reduced-motion` is active.
- First non-steady selection requires an in-app safety confirmation.
- Fullscreen API is progressive enhancement.
- Screen Wake Lock is progressive enhancement. Manual Off persists for the current display session, including tab visibility changes; obsolete acquisitions are released.
- Settings persist in LocalStorage.
- Japanese/English switch without reload; the header shows EN in Japanese and JA in English, with localized target-language and Help accessible names/titles.
- Core functionality works from `file://`.

## 5. Safety
- Never claim this is certified emergency equipment.
- Do not provide high-frequency strobe modes.
- Show a visible warning when flashing is selected.
- Respect reduced-motion preferences by forcing steady display.

## 6. Data and privacy
- Message and settings remain in memory/LocalStorage.
- No runtime network requests, analytics, telemetry, or account.
- CSP includes `connect-src 'none'`.

## 7. Non-goals
- Controlling hardware flashlight LEDs.
- Controlling device screen brightness.
- Location tracking.
- Remote synchronized signs.
- Certified road, maritime, aviation, or emergency signaling.

## 8. UX
- Mobile-first from 320px.
- Mobile primary action is safe-area-aware and fixed at the bottom.
- Desktop shows preview/settings and usage tips side by side.
- Visible focus and keyboard access; display controls isolate keyboard focus from the editor and return focus to Show on exit.
- Escape dismisses only the topmost confirmation before closing the display.
- Reset discloses QR deletion, keeps the language, and restores a localized default message.
- No dark-mode switch.
- Full-stage controls auto-hide after a short delay, unless focused or protected by an open dialog.
- Session-only Pin controls defaults off, exposes aria-pressed, and prevents both auto-hide and background-tap hiding until unpinned or closed.

## 9. Browser target
Current stable Chromium, Firefox, and Safari on desktop/mobile. Core display works with `file://`. Fullscreen and Wake Lock depend on browser/security context support.

## 10. Acceptance criteria
- Both release HTML variants build.
- Self-extract wrapper is ASCII-only, inherits favicon, and restores readable HTML byte-for-byte.
- No unresolved placeholders.
- No external runtime asset URL.
- `connect-src 'none'` exists.
- 320px layout has no horizontal overflow.
- Flashes never activate when reduced-motion is active.
