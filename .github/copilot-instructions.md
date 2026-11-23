# Project context: Folder to Master PDF

## What this app does
Users select a code folder in the browser. The client filters accepted source files and uploads them to the server, which returns a one-time download link for a PDF containing the folder tree followed by each accepted file's code with line numbers and page numbers.

## Tech stack
- **Client** (`/client`): React 19, Vite, Axios for uploads/downloads, XMLHttpRequest for streamed generation progress, plain CSS, JavaScript ES modules.
- **Server** (`/server`): Node 20+, Express 5, Mongoose 9, Multer 2 (memory storage), PDFKit, helmet, cors, express-rate-limit, dotenv, ES modules (`"type": "module"`).
- **Database:** MongoDB. Stores counts only: `fileCount`, `totalBytes`, `skippedCount`. Never store project names or file contents.
- **Hosting:** frontend on Vercel, backend on Render, database on Atlas.

## Folder structure
```text
client/src/
  api/pdfApi.js                 upload stream, PDF download, server wake-up API
  components/                   FolderPicker, LoadingScreen, GenerationProgress, Stepper
  constants/phases.js           phases, busy phases, loading screens, generation steps
  hooks/usePdfGenerator.js      selection, validation, progress, and conversion flow
  utils/                        file filters, validation, byte formatting, timing
  App.jsx, App.css, index.css, main.jsx
server/src/
  index.js                      app setup, CORS allowlist, /health, routes, error handler
  config/db.js                  mongoose connect
  routes/pdf.routes.js          POST /api/pdf/upload, POST /api/pdf/generate, GET /api/pdf/download/:token
  controllers/pdf.controller.js uploadFiles, generatePdfFromUpload, downloadPdf
  services/pdf.service.js       PDFKit rendering and per-file progress
  services/uploadStore.js       staged in-memory uploads (5 min TTL, size and entry caps)
  services/downloadStore.js     in-memory one-time token store (5 min TTL, max 200 entries)
  middleware/upload.js          gzip envelope parser, Multer fallback, request size guard
  middleware/error.js           central error handler
  models/Conversion.js          stats-only model
  utils/filters.js               server-side file filtering
  utils/tree.js                  buildTreeLines
```

## Request flow
1. After folder selection, show a scanning screen before synchronously filtering files. Validate the accepted file count and total size.
2. Upload accepted files to `/api/pdf/upload` as a gzip-compressed binary envelope (JSON manifest line followed by file bytes); keep the loading screen visible for at least 1.2 seconds, even if the request finishes sooner.
3. The server stages accepted buffers in memory and returns a one-time `uploadId`. Then show a **Generate PDF** button.
4. When clicked, POST the `uploadId` to `/api/pdf/generate`. The server consumes the staged upload, streams processing and per-file PDF-generation progress as newline-delimited JSON, and returns `{ token, expiresInMs, fileCount }`.
5. Download `/api/pdf/download/:token` as a blob. The download token works once; its PDF buffer is zero-filled after sending or after 5 minutes.
6. Staged uploads are zero-filled after generation or after their 5-minute expiry.

## Non-negotiable privacy and security rules
- Never write uploaded files or generated PDFs to disk. Memory only.
- Zero-fill decompressed request buffers, staged upload buffers after generation or expiry, and generated PDF buffers when they cannot be stored.
- Never log file contents, file paths, or request bodies.
- Never store project names or content in MongoDB. Counts only.
- Never expose a route that lists conversions or history.
- Skip `.env*` files on both client and server. `.env.example`, `.env.sample`, and `.env.template` are allowed.
- Keep the one-time token, 5-minute TTL, `Cache-Control: no-store`, and 64-hex token validation.
- Keep helmet, rate limiting (10 generate requests per IP per 15 minutes), and `trust proxy`.

## Limits
- Max 2,000 files, 500 KiB per accepted file, 10 MiB total accepted source.
- Server rejects requests over 12 MiB by `Content-Length` and caps decompressed request bodies at 16 MiB.
- Upload limits: 1 MiB per file, 5 MiB for paths/manifest data, 2,000 files. Multipart compatibility uses the same Multer limits.
- Staged uploads are limited to 10 active entries and 64 MiB total in memory; each upload expires after 5 minutes.
- The selected folder may exceed 1 GiB only when its accepted source files remain within these limits; excluded files are not uploaded. Do not raise limits without checking server memory and hosting capacity.
- Render's free tier has 512 MiB RAM. The memory-only architecture cannot safely accept 1 GiB of source content.

## File filtering rules
- Use an allowlist of source extensions and filenames, not a blocklist.
- Ignore dependency, build, cache, and environment folders (`node_modules`, `.git`, `dist`, `build`, `venv`, `.venv`, `env`, `site-packages`, `__pycache__`, and similar).
- On the client, any folder containing `pyvenv.cfg` is treated as a Python virtualenv and skipped.
- When changing filter lists, update both `client/src/utils/filters.js` and `server/src/utils/filters.js`.

## Environment variables
- Server: `PORT` (Render provides it), `MONGO_URI`, `CLIENT_URL` (full URL; comma-separate multiple origins).
- Client development: optional `VITE_LOCAL_API_URL` (defaults to `http://localhost:5000/api`).
- Client production: requests use the same-origin `/api` path, rewritten by `client/vercel.json` to the Render API.
- Never commit `.env` files.

## Coding conventions
- JavaScript ES modules, `const` arrow functions, named exports (React components use default exports).
- Keep frontend logic in API/hooks/utils/constants and components presentational.
- Backend layering: routes > controllers > services > utils. Controllers handle HTTP; services hold logic.
- Error responses use `{ message }` JSON before streaming begins; after streaming begins, use an NDJSON error event.
- Express 5 forwards thrown async-handler errors to the error handler.

## Known pitfalls
- A browser CORS error may be a Render 502/503 or a disallowed origin; check the Network status first.
- `/health` is registered before CORS and has no CORS headers.
- Render free instances sleep after inactivity. The client calls `wakeServer()` on page load.
- PDFKit can add a blank page if text is drawn inside the bottom margin. The page-number footer sets `margins.bottom = 0` temporarily; keep that pattern.
- Courier cannot render box-drawing characters. The PDF uses DejaVu Sans Mono from `node_modules/dejavu-fonts-ttf/ttf/`.
- The download store is process-local. Run exactly one server instance.
- The server currently connects to MongoDB before listening; avoid making database availability block PDF generation.

## Commands
- Server: `cd server && npm run dev` or `npm start`
- Client: `cd client && npm run dev` / `npm run build` / `npm run lint`
- Local URLs: client `http://localhost:5173`, API `http://localhost:5000/api`
