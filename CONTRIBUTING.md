# Contributing

Edit `src/index.template.html`, not generated files under `dist/`.

Before opening a pull request on Windows:

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-repository.ps1
```

Keep the application dependency-free unless a new dependency materially reduces implementation risk.
