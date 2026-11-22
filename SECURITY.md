# Security

Signal Screen performs no runtime network request and has no server-side component. User-entered text, QR content, saved signals, and settings remain in browser memory and LocalStorage. QR generation is performed locally. Clipboard text is read only after the user presses Paste; denying permission does not erase the existing QR input.

The Content Security Policy includes `connect-src 'none'`.

If reporting a security issue, avoid including private user data in a public issue.
