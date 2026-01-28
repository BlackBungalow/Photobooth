const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const pino = require('pino');
const PDFDocument = require('pdfkit');
const { print } = require('pdf-to-printer');
const { z } = require('zod');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
const PORT = Number(process.env.PORT || 8787);
const API_KEY = process.env.API_KEY || '';

const jobStore = new Map();

app.use(express.json({ limit: '15mb' }));

app.use((req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  const key = req.headers['x-api-key'];
  if (API_KEY && key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
});

const jobSchema = z.object({
  photoId: z.string().min(1),
  imageUrl: z.string().min(1),
  projectSlug: z.string().min(1)
});

app.post('/jobs', async (req, res) => {
  const parsed = jobSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const jobId = `${parsed.data.photoId}-${Date.now()}`;
  jobStore.set(jobId, { status: 'queued' });

  res.json({ jobId, status: 'queued' });

  try {
    jobStore.set(jobId, { status: 'printing' });
    const response = await fetch(parsed.data.imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }
    const buffer = Buffer.from(await response.arrayBuffer());

    const pdfPath = path.join(os.tmpdir(), `${jobId}.pdf`);
    await createPrintPdf(buffer, pdfPath);

    await print(pdfPath, {
      printer: process.env.DEFAULT_PRINTER
    });

    jobStore.set(jobId, { status: 'done' });
    fs.unlink(pdfPath, () => undefined);
  } catch (error) {
    logger.error({ err: error }, 'Print failed');
    jobStore.set(jobId, { status: 'error' });
  }
});

app.get('/jobs/:id', (req, res) => {
  const job = jobStore.get(req.params.id) || { status: 'unknown' };
  res.json(job);
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  logger.info(`Print server listening on ${PORT}`);
});

function createPrintPdf(imageBuffer, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [425, 638] });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);
    doc.image(imageBuffer, 0, 0, { width: 425, height: 638 });
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}
