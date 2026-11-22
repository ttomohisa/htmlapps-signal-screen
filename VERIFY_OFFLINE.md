# Offline verification

1. Run `scripts/check-repository.ps1` on Windows to rebuild the normal and self-extracting HTML and check byte-for-byte parity.
2. Open `dist/index.html` using a `file://` URL, disconnect from the network, and check that the app still opens.
3. Test the default message, arrow presets, live preview, color changes, and a short single-line signal. Open and close the signal display.
4. Save three text/color combinations. Reload, restore one, cancel a delete, confirm a delete, and verify both state persistence and the three-item limit.
5. Enter QR content, check the generated QR and 300 UTF-8-byte limit, then check that an invalid value disables Show without losing the text. On browsers where clipboard permission is available, test the explicit Paste button and denial fallback.
6. Test Reset on mobile and desktop; confirm that it asks first and clears message, QR, and saved signals but keeps the selected language.
7. Test with `prefers-reduced-motion` enabled and verify all flashing is disabled. If flashing is tested manually, heed the app's safety warning and never run automated flashing in a browser test.
8. Verify Help, dialog dismissal, and keyboard focus in both languages at 320px, near 760px, desktop, and short-height landscape sizes. Confirm no horizontal scrolling or fixed-button overlap with an on-screen keyboard.
9. Open `dist/index.self-extract.html` from `file://`; confirm readable loader text, the favicon, and that the restored app behaves like the normal HTML. `DecompressionStream` is required.
10. In browser developer tools, confirm that no runtime request containing user content is made. The `connect-src 'none'` policy blocks network connections. Note that opening the hosted site initially downloads the HTML.
11. Compare the release files (including ZIP and checksums) with the version in `app.config.json`. Confirm that the release screenshots match the current UI.

The automated Chromium test and the Node harness do not substitute for Safari/Firefox or physical-device testing. Fullscreen, Wake Lock, and clipboard access can vary by browser and by `file://` security context.
