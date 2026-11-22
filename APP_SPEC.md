# APP_SPEC.md

## 1. Product identity
- **Name:** Signal Screen
- **Version:** 1.1.0
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
- Auto-fit message size in preview and stage using a stable content box; short (up to 12 characters) single-line messages are fitted on one line when readable, and otherwise wrap; explicit multiline input is preserved.
- Presets for short messages and four directions.
- Save up to three custom text/color signals in LocalStorage; selecting one restores its message and background without modifying the active flash mode. Removal requires confirmation.
- QR Paste is activated only by the user, reads the Clipboard API when available, and falls back to manual paste guidance when unavailable or denied.
- Mobile editor shows a compact preview, puts presets before freeform text entry, and exposes a preview Reset control.
- Mobile action bar reacts to visual viewport occlusion by the on-screen keyboard.
- Full-stage API/Wake Lock notifications are visible on the stage, and auto-dismiss.
- Automatic white/black foreground contrast.
- Steady, slow, beacon, and SOS flash patterns.
- Flashing must be disabled when `prefers-reduced-motion` is active.
- First non-steady selection requires an in-app safety confirmation.
- Fullscreen API is progressive enhancement.
- Screen Wake Lock is progressive enhancement. Manual Off persists for the current display session, including tab visibility changes; obsolete acquisitions are released.
- Settings, QR content, current text, and saved signals persist in LocalStorage.
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
- Reset discloses QR and saved-signal deletion, keeps the language, and restores a localized default message.
- Native modal dialogs lock both page scroll roots; only their bodies scroll. Reset and flashing confirmations reserve nonshrinking header/footer space in short windows.
- Dialog dismissal restores the current visible opener without scrolling or activating it. If resizing hides Reset, fall back to a visible enabled Show control, then an available header control; delayed close events never steal newer valid focus or a newer modal.
- The local-processing badge keeps its shield/check artwork; the app logo is unchanged. Its English label is “Fully local processing”, matching 完全ローカル処理.
- No dark-mode switch.
- Full-stage controls auto-hide after a short delay, unless focused or protected by an open dialog.
- Session-only Pin controls defaults off, exposes aria-pressed, and prevents both auto-hide and background-tap hiding until unpinned or closed.

## 9. Browser target
Current stable Chromium, Firefox, and Safari on desktop/mobile. Core display works with `file://`. Fullscreen and Wake Lock depend on browser/security context support.

## 10. Release integrity
- The GitHub Pages build is generated from the current source; checked-in distribution snapshots may lag behind a pull request.
- The PR CI validates release packaging through `scripts/package-release.ps1` before merging. The post-merge release workflow publishes versioned HTML downloads, a ZIP, SHA-256 hashes, screenshots, and the first-party and third-party license notices after validation succeeds.
- README and the release must identify the same version and limitations.

## 11. Acceptance criteria
- Both release HTML variants build.
- Self-extract wrapper is ASCII-only, inherits favicon, and restores readable HTML byte-for-byte.
- No unresolved placeholders.
- No external runtime asset URL.
- `connect-src 'none'` exists.
- 320px layout has no horizontal overflow.
- Short signals (e.g. ここです / HERE) stay on one line when readable at the available width; long messages and explicit newlines wrap.
- Mobile Reset is reachable regardless of whether text or QR mode is active.
- Saved signal create/apply/remove survives reload; storage is local; saved-signal removal and full Reset require confirmation.
- Paste is a user-initiated clipboard read; denied or unsupported access never clears the existing QR input.
- Warnings are visible while the full-screen stage is active.
- Flashes never activate when reduced-motion is active.
- At 393×252, Help outside-wheel input does not move the page; Reset and flashing confirmation Close/Cancel/action buttons remain reachable, with internal text scrolling.
- Desktop-to-mobile and mobile-to-desktop modal resizing preserves safe visible focus on dismissal in both languages; native Escape, Close, Cancel, and backdrop dismissal keep editor data and flashing policy unchanged.
