import Conversion from '../models/Conversion.js';
import { shouldIncludePath, MAX_FILE_BYTES, MAX_TOTAL_BYTES } from '../utils/filters.js';
import { buildTreeLines } from '../utils/tree.js';
import { generatePdf } from '../services/pdf.service.js';
import { saveDownload, consumeDownload } from '../services/downloadStore.js';
import { saveUpload, consumeUpload } from '../services/uploadStore.js';

const safeFilename = (name) => `${name.replace(/[^\w.-]/g, '_')}-master.pdf`;

export const uploadFiles = (req, res) => {
  const uploaded = req.files ?? [];
  let retainedBuffers = new Set();

  try {
    let paths;
    try {
      paths = JSON.parse(req.body.paths ?? '[]');
    } catch {
      return res.status(400).json({ message: 'Invalid file paths' });
    }

    if (!Array.isArray(paths) || !uploaded.length || uploaded.length !== paths.length) {
      return res.status(400).json({ message: 'No files received or paths mismatch' });
    }

    const entries = uploaded.map((file, i) => ({ path: paths[i], buffer: file.buffer }));
    const accepted = entries
      .filter((entry) =>
        typeof entry.path === 'string' &&
        shouldIncludePath(entry.path) &&
        entry.buffer.length <= MAX_FILE_BYTES
      )
      .sort((a, b) => a.path.localeCompare(b.path));

    if (!accepted.length) {
      return res.status(422).json({ message: 'No readable source files found' });
    }

    const totalBytes = accepted.reduce((sum, entry) => sum + entry.buffer.length, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      return res.status(413).json({ message: 'Accepted files exceed the 10 MiB upload limit.' });
    }

    const saved = saveUpload(accepted, totalBytes, entries.length - accepted.length);
    if (!saved) {
      return res.status(503).json({ message: 'Server upload storage is busy. Please try again shortly.' });
    }

    retainedBuffers = new Set(accepted.map(({ buffer }) => buffer));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(201).json({
      ...saved,
      fileCount: accepted.length,
      totalBytes,
    });
  } finally {
    uploaded.forEach((file) => {
      if (!retainedBuffers.has(file.buffer)) file.buffer.fill(0);
    });
  }
};

export const generatePdfFromUpload = async (req, res) => {
  const uploadId = req.body?.uploadId;
  if (typeof uploadId !== 'string' || !/^[a-f0-9]{64}$/.test(uploadId)) {
    return res.status(404).json({ message: 'Upload expired or already used. Upload the folder again.' });
  }

  const staged = consumeUpload(uploadId);
  if (!staged) {
    return res.status(404).json({ message: 'Upload expired or already used. Upload the folder again.' });
  }

  let streaming = false;
  const sendEvent = (event) => {
    if (!streaming) {
      res.status(200);
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.flushHeaders();
      streaming = true;
    }

    if (!res.destroyed) res.write(`${JSON.stringify(event)}\n`);
  };

  try {
    sendEvent({
      type: 'progress',
      phase: 'processing',
      completed: 0,
      total: 3,
      percent: 0,
      message: 'Preparing uploaded files',
    });

    const files = staged.files
      .map(({ path, buffer }) => ({ path, content: buffer.toString('utf-8') }));
    sendEvent({
      type: 'progress',
      phase: 'processing',
      completed: 1,
      total: 3,
      percent: 33,
      message: 'Reading source files',
    });

    sendEvent({
      type: 'progress',
      phase: 'processing',
      completed: 2,
      total: 3,
      percent: 66,
      message: 'Building folder structure',
    });

    const projectName = files[0].path.split('/')[0];
    const tree = buildTreeLines(files.map((file) => file.path));
    sendEvent({
      type: 'progress',
      phase: 'processing',
      completed: 3,
      total: 3,
      percent: 100,
      message: 'Folder structure ready',
    });

    sendEvent({
      type: 'progress',
      phase: 'generating',
      completed: 0,
      total: files.length,
      percent: 0,
      message: 'Building PDF pages',
    });

    const pdfBuffer = await generatePdf({
      projectName,
      tree,
      files,
      onProgress: (progress) => sendEvent({
        type: 'progress',
        phase: 'generating',
        ...progress,
        message: 'Rendering files',
      }),
    });

    const saved = saveDownload(pdfBuffer, safeFilename(projectName));
    if (!saved) {
      pdfBuffer.fill(0);
      sendEvent({
        type: 'error',
        status: 503,
        message: 'Server busy, try again in a minute',
      });
      res.end();
      return;
    }

    await Conversion.create({
      fileCount: files.length,
      totalBytes: staged.totalBytes,
      skippedCount: staged.skippedCount,
    }).catch(() => {});

    sendEvent({
      type: 'progress',
      phase: 'generating',
      completed: files.length,
      total: files.length,
      percent: 100,
      message: 'PDF ready',
    });
    res.write(`${JSON.stringify({
      type: 'result',
      token: saved.token,
      expiresInMs: saved.expiresInMs,
      fileCount: files.length,
    })}\n`);
    res.end();
  } catch (error) {
    if (!streaming) throw error;

    console.error('PDF generation failed');
    if (!res.destroyed) {
      res.write(`${JSON.stringify({
        type: 'error',
        status: 500,
        message: 'Failed to generate PDF. Please try again.',
      })}\n`);
      res.end();
    }
  } finally {
    staged.files.forEach(({ buffer }) => buffer.fill(0));
  }
};

export const downloadPdf = (req, res) => {
  const entry = consumeDownload(req.params.token);
  if (!entry) {
    return res.status(404).json({ message: 'Link expired or already used' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${entry.filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.on('finish', () => entry.buffer.fill(0));
  res.end(entry.buffer);
};