# Signal Screen

[日本語 README](README.ja.md)

A single-HTML utility that turns a phone or computer display into a large visual signal using text, arrows, colors, QR codes, and an SOS pattern.

## Features

- Up to 60 characters in an auto-fit stage
- Local QR generation for URLs and short text
- Fixed black-on-white QR rendering with a full 4-module quiet zone
- HERE, HELP, SOS, STOP, and four direction presets
- Black, white, red, yellow, green, and blue backgrounds
- Automatic black/white text contrast
- Steady, Slow, Beacon, and SOS patterns
- First-use flashing-light safety confirmation
- Flashing disabled automatically when `prefers-reduced-motion` is enabled
- Fullscreen API and Screen Wake Lock as progressive enhancements
- Japanese and English in the same HTML
- LocalStorage persistence
- No runtime network request or account

## Usage

1. Choose **Text & arrows** or **QR**.
2. In text mode, enter a message/preset, pick a background, and choose a flash pattern only when needed.
3. In QR mode, enter a URL or short text. The QR is generated locally and never flashes.
4. Press **Show full screen**.
5. Tap the stage to hide or show controls.

## Safety

Flashing displays can cause discomfort or health effects for some people. Do not use flashing light near people who are sensitive to it. Signal Screen intentionally avoids high-frequency strobe modes and respects `prefers-reduced-motion`.

Browsers cannot control device screen brightness. Signal Screen is not a substitute for certified emergency, traffic, maritime, or aviation signaling equipment.

## Build

On Windows PowerShell 5.1:

```powershell
.\build-standalone.ps1
```

or:

```powershell
.\scripts\check-repository.ps1
```

The build creates `dist/index.html` and `dist/index.self-extract.html`. Following the current template contract, the self-extract loader is ASCII-only and inherits the embedded favicon from the readable HTML.

## Privacy

Messages and settings stay in the browser. The runtime CSP contains `connect-src 'none'`, with no analytics, telemetry, server storage, or hidden network dependency.

## License

MIT License
