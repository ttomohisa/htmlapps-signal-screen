# Security

Signal Screen performs no runtime network request and has no server-side component. User-entered text, QR content, and settings remain in browser memory and LocalStorage. QR generation is performed locally.

The Content Security Policy includes `connect-src 'none'`.

If reporting a security issue, avoid including private user data in a public issue.
