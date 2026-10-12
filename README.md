# Career Space

A simple Next.js + TypeScript personal career workspace with a responsive dashboard, MERN and AI interview questions, notes, document attachments, favorites, completion tracking, search, and JSON backup import/export.

## Run locally

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. Build with `npm run build`; the static site is exported to `out/`.

## Storage

This first version stores data in localStorage in the current browser and origin. It has no database, account system, or cross-device synchronization. The local preview and hosted site have separate storage. Export backups regularly, especially before clearing browser data or moving devices. Attachments are limited to 2 MB per file; total storage depends on the browser's quota. Backups include attached files. Import merges by resource ID, replacing matching entries. Starter questions are examples, not a comprehensive interview curriculum.
