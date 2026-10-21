# Security Policy

## Local-First Data & Privacy Guarantee

**CV Maker** is designed with privacy as the core architecture principle:
- **100% Client-Side:** CVs, cover letters, photos, templates and settings are stored only in your browser's IndexedDB. PDFs are generated on the device with `@react-pdf/renderer`.
- **Zero Data Transmission:** No CV, photo or personal data is ever sent to a remote server. The only network requests are for the app's static files. There is no account, login or analytics.
- **Offline Capable:** Once installed or visited, the app keeps working without a network connection.
- **You own the backup:** Data moves between devices only through backup files you export yourself.

## Reporting a Security Concern

If you discover a security vulnerability, issue, or unintended network leak within this project, please report it responsibly:

1. **GitHub Security Advisory:** You can submit a private vulnerability report via [GitHub Security Advisories](https://github.com/rizalahmaddd/cv-maker/security/advisories/new).
2. **Direct Contact:** You can also contact the maintainer directly via WhatsApp at [+62 857-7777-5477](https://wa.me/6285777775477).

Please provide:
- A description of the issue.
- Steps or a proof-of-concept to reproduce the behavior.
- Browser name and version used.

We will review reports promptly and take necessary corrective actions.
