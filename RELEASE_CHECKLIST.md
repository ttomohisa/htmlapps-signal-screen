# Signal Screen v1.1.0 — release checks

This checklist distinguishes automatic validation from checks that require a physical phone or a separately installed browser. Do not treat a green CI result as proof of real-device behavior.

## Automated gates (PR)

- [ ] `scripts/check-repository.ps1` succeeds and builds readable/self-extracting single HTML.
- [ ] Every behavior regression passes for source, readable, self-extracting, and root HTML.
- [ ] Byte parity, favicon, ASCII-only loader, CSP `connect-src 'none'`, and offline asset checks pass.
- [ ] Chromium checks pass for Japanese and English at desktop, 768px, 760px, 393px short landscape, and 320px.
- [ ] QR paste, save/restore/delete/reset, keyboard-offset CSS, dialogs, reduced-motion, no horizontal overflow, and no external requests pass.
- [ ] Fresh Japanese/English desktop and Japanese mobile screenshots are generated from the built HTML without external runtime requests.
- [ ] The PR preview is published and returns HTTP 200.

## Physical-device and cross-browser checks

- [ ] Android Chrome: portrait and landscape; open and close display, tap controls, show/hide keyboard, check the fixed Show button is not overlaid.
- [ ] iOS Safari: repeat keyboard, display, QR, Wake Lock, and fullscreen fallback checks. Confirm the user can return to the editor even when fullscreen is unsupported.
- [ ] Firefox desktop/mobile where available: repeat message, QR, reset, and focus/dismissal checks.
- [ ] Open the downloaded readable HTML via `file://` with networking disabled; verify core messaging, saved signals, and QR generation.
- [ ] Open the self-extracting HTML via `file://` with `DecompressionStream` support.
- [ ] Scan a displayed QR with a second device. Check both a short ASCII URL and a short Japanese message.
- [ ] Verify flashing warnings, first-use consent, and reduced-motion behavior without exposing people to unnecessary flashing.
- [ ] Check an intentionally denied clipboard permission does not delete QR content.
- [ ] Check local storage persistence after reopening and the reset confirmation before deleting saved content.

## After the owner merges

- [ ] `main` build and GitHub Pages deployment pass.
- [ ] The release workflow creates **v1.1.0** only after the main-branch checks pass; it does not overwrite an existing release.
- [ ] The GitHub Release contains normal and self-extracting HTML, ZIP, `SHA256SUMS.txt`, and three fresh screenshots.
- [ ] Check the downloaded file names, SHA-256 hashes, offline opening, version badge, and release notes.
- [ ] Confirm the README's versioned Release link points to current downloads. Note: checked-in `dist/`, root HTML, and repository screenshot files can be older build snapshots; release assets are the versioned distribution.

The assistant must not merge the PR. Cross-browser/physical-device items remain unchecked until they have actually been tested.
