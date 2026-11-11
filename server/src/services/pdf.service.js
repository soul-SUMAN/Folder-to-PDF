import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const FONT_DIR = fileURLToPath(new URL('../../node_modules/dejavu-fonts-ttf/ttf/', import.meta.url));

const MARGIN = 40;
const CODE_SIZE = 8;

const COLORS = {
  text: '#1f2937',
  muted: '#9ca3af',
  folder: '#1d4ed8',
  accent: '#4f46e5',
  rule: '#d1d5db',
};

const EXT_COLORS = {
  '.js': '#b45309',
  '.jsx': '#0e7490',
  '.json': '#15803d',
  '.css': '#7e22ce',
  '.html': '#c2410c',
  '.md': '#475569',
};

const sanitize = (text) => text.replace(/\r\n/g, '\n').replace(/\t/g, '  ');

const colorFor = (name) => EXT_COLORS[path.extname(name).toLowerCase()] ?? COLORS.text;

const registerFonts = (doc) => {
  doc.registerFont('Mono', path.join(FONT_DIR, 'DejaVuSansMono.ttf'));
  doc.registerFont('MonoBold', path.join(FONT_DIR, 'DejaVuSansMono-Bold.ttf'));
};

const drawRule = (doc) => {
  doc
    .moveTo(MARGIN, doc.y + 2)
    .lineTo(doc.page.width - MARGIN, doc.y + 2)
    .lineWidth(0.5)
    .strokeColor(COLORS.rule)
    .stroke();
};

const drawCover = (doc, { projectName, files, tree }) => {
  const folderCount = tree.filter((line) => line.isDir).length;

  doc.rect(0, 0, doc.page.width, 96).fill(COLORS.accent);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22).text(projectName, MARGIN, 30);
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#e0e7ff')
    .text(
      `${files.length} files · ${folderCount} folders · generated ${new Date().toLocaleString()}`,
      MARGIN,
      62
    );

  doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.text).text('Folder Structure', MARGIN, 124);
  drawRule(doc);
  doc.moveDown(0.8);
};

const drawTree = (doc, tree) => {
  doc.fontSize(9);

  tree.forEach(({ prefix, name, isDir }) => {
    if (prefix) {
      doc.font('Mono').fillColor(COLORS.muted).text(prefix, { continued: true, lineGap: 2 });
    }
    doc
      .font(isDir ? 'MonoBold' : 'Mono')
      .fillColor(isDir ? COLORS.folder : colorFor(name))
      .text(name, { lineGap: 2 });
  });
};

const drawFile = (doc, { path: filePath, content }, index, total) => {
  const lines = (sanitize(content).trimEnd() || '(empty file)').split('\n');
  const numberWidth = String(lines.length).length;

  doc.addPage();
  doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.text).text(filePath, MARGIN);
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(`File ${index + 1} of ${total} · ${lines.length} lines`);
  drawRule(doc);
  doc.moveDown(0.8);

  doc.font('Mono').fontSize(CODE_SIZE).fillColor(COLORS.text);
  lines.forEach((line, i) => {
    doc.text(`${String(i + 1).padStart(numberWidth)}  ${line || ' '}`, { lineGap: 1 });
  });
};

const drawFooters = (doc) => {
  const { start, count } = doc.bufferedPageRange();

  for (let i = 0; i < count; i++) {
    doc.switchToPage(start + i);

    const originalBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(`${i + 1} / ${count}`, MARGIN, doc.page.height - 28, {
        align: 'center',
        width: doc.page.width - MARGIN * 2,
        lineBreak: false,
      });

    doc.page.margins.bottom = originalBottom;
  }
};

export const generatePdf = ({ projectName, tree, files }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: MARGIN, bufferPages: true, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    registerFonts(doc);
    drawCover(doc, { projectName, files, tree });
    drawTree(doc, tree);
    files.forEach((file, index) => drawFile(doc, file, index, files.length));
    drawFooters(doc);

    doc.end();
  });