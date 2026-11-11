import Conversion from '../models/Conversion.js';
import { shouldIncludePath, MAX_FILE_BYTES } from '../utils/filters.js';
import { buildTreeLines } from '../utils/tree.js';
import { generatePdf } from '../services/pdf.service.js';
import { saveDownload, consumeDownload } from '../services/downloadStore.js';

const safeFilename = (name) => `${name.replace(/[^\w.-]/g, '_')}-master.pdf`;

export const createPdf = async (req, res) => {
  const uploaded = req.files ?? [];

  try {
    const paths = JSON.parse(req.body.paths ?? '[]');

    if (!uploaded.length || uploaded.length !== paths.length) {
      return res.status(400).json({ message: 'No files received or paths mismatch' });
    }

    const entries = uploaded.map((file, i) => ({ path: paths[i], buffer: file.buffer }));

    const accepted = entries
      .filter((e) => shouldIncludePath(e.path) && e.buffer.length <= MAX_FILE_BYTES)
      .map((e) => ({ path: e.path, content: e.buffer.toString('utf-8') }))
      .sort((a, b) => a.path.localeCompare(b.path));

    if (!accepted.length) {
      return res.status(422).json({ message: 'No readable source files found' });
    }

    const projectName = accepted[0].path.split('/')[0];
    const tree = buildTreeLines(accepted.map((f) => f.path));
    const pdfBuffer = await generatePdf({ projectName, tree, files: accepted });

    const saved = saveDownload(pdfBuffer, safeFilename(projectName));
    if (!saved) {
      return res.status(503).json({ message: 'Server busy, try again in a minute' });
    }

    await Conversion.create({
      fileCount: accepted.length,
      totalBytes: accepted.reduce((sum, f) => sum + Buffer.byteLength(f.content), 0),
      skippedCount: entries.length - accepted.length,
    }).catch(() => {});

    res.json({
      token: saved.token,
      expiresInMs: saved.expiresInMs,
      fileCount: accepted.length,
    });
  } finally {
    uploaded.forEach((file) => file.buffer.fill(0));
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