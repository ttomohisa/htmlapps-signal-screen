# Contributing

Edit `src/index.template.html`, not generated files under `dist/`.

Use Node.js 22 or later and PowerShell 7 (or Windows PowerShell 5.1). Before opening a pull request on Windows:

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-repository.ps1
```

Keep the application dependency-free unless a new dependency materially reduces implementation risk.

The repository check builds both variants, refreshes `signal-screen.html`, executes 63 behavior cases against source/readable/self-extract/root variants, and verifies byte/application parity. The dependency-free Node harness uses DOM and geometry doubles; run browser QA for actual layout, Tab order, native dialogs, fullscreen fallback, and QR visibility at 320px and wider mobile widths. Never enable flashing during automated or routine browser QA.
