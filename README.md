# Folder to Master PDF

Folder to Master PDF is a React and Express app that turns a selected codebase into a PDF. The PDF contains a formatted folder tree followed by each accepted file's contents, with line numbers and page numbers.

## Features

- Select a project folder in the browser.
- See upload progress, then PDF-generation and download-preparation status.
- Exclude common generated/dependency directories, binary file types, lock files, large files, and secret `.env` files.
- Download the generated PDF through a one-time link that expires after five minutes.
- Keep uploaded files and generated PDFs in server memory rather than writing them to disk.

## Requirements

- Node.js and npm
- MongoDB (local or hosted)

## Local setup

Open two terminals from the project root.

### 1. Configure and run the server

Create `server/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/folder-to-pdf
```

Install dependencies and start the API:

```bash
cd server
npm install
npm run dev
```

The server connects to MongoDB before it starts listening. Keep MongoDB running.

### 2. Configure and run the client

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Install dependencies and start Vite:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). The server permits localhost Vite origins on any port for development; `CLIENT_URL` can also be set to the frontend origin.

## Using the app

1. Choose a project folder.
2. Click **Generate PDF**. Selecting a folder does not upload it; the upload starts when generation is requested.
3. Follow the progress panel through **Uploading codebase**, **Generating PDF**, and **Preparing download**.
4. The PDF downloads automatically when ready.

## File selection and limits

The client filters files before upload. The server applies its own filtering as well.

- Maximum accepted file size: 500 KiB per file.
- Maximum number of uploaded files: 2,000.
- Multer's request-level limit is 1 MiB per file and 5 MiB for the file-paths field; files larger than 500 KiB are subsequently excluded from the PDF.
- Common generated/dependency directories such as `node_modules`, `.git`, `dist`, `build`, and `coverage` are skipped.
- Common lock files, binary extensions, and `.env` files are skipped. `.env.example`, `.env.sample`, and `.env.template` are allowed.

The server also rate-limits PDF generation to 10 requests per IP per 15 minutes.

## Privacy and deployment notes

Selected files are uploaded to the configured server and processed there; this is not browser-only or zero-knowledge processing. The server buffers uploads and the generated PDF in memory, and the uploaded buffers are zero-filled after request processing. A generated PDF is held in an in-memory, one-time download store for up to five minutes. Conversion records in MongoDB contain counts and byte totals, not project names or file contents.

These measures do not prevent the server operator, host, or a compromised server from accessing data while it is being processed. Use this application only with code you are comfortable sending to the server. Use HTTPS in production, protect server and database access, and do not expose secrets in project files.

The one-time PDF store is process-local. A server restart invalidates pending download links, and multi-instance deployments need sticky routing or a shared secure store to ensure a generated token can be downloaded by the same instance that created it. The production frontend origin `https://folder-to-pdf.vercel.app` is allowed by default. Configure Render's `CLIENT_URL` to the exact deployed frontend origin for other deployments (for multiple origins, separate them with commas; trailing slashes are normalized) and Vercel's `VITE_API_URL` to the deployed API base URL (including `/api`). Do not use the development CORS behavior as a substitute for production origin configuration.

## Useful commands

From `client/`:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

From `server/`:

```bash
npm run dev
npm start
```
