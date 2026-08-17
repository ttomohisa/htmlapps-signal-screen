# AGENTS.md — Single HTML App Contract

This repository follows `ttomohisa/htmlapps-template`.

## Required order
1. Read this file.
2. Read `APP_SPEC.md`.
3. Inspect `src/index.template.html`.
4. Edit source, never generated `dist` files by hand.
5. Build and run `scripts/check-repository.ps1`.

## Non-negotiable constraints
- Generate `dist/index.html` and `dist/index.self-extract.html`.
- `scripts/build-self-extract.ps1` and its generated loader must remain ASCII-only.
- The self-extract loader inherits the embedded favicon from `dist/index.html`.
- Direct `file://` opening is a first-class path for core Signal Screen features.
- No CDN, analytics, telemetry, server API, external fonts, or runtime network dependency.
- CSP keeps `connect-src 'none'`.
- Japanese and English live in the same HTML.
- Smartphone and desktop are both first-class.
- Prefer inline SVG over emoji for UI iconography.
- Respect `prefers-reduced-motion`.
- Destructive reset uses an in-app dialog, not `window.confirm()`.

## Help dialog
Keep the upper-right help dialog current with actual behavior, privacy, flashing-light cautions, and browser limitations.
