const fs = require('fs');
const path = require('path');
const os = require('os');
const pino = require('pino');
const PDFDocument = require('pdfkit');
const { print } = require('pdf-to-printer');
const { z } = require('zod');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const envSchema = z.object({
  CLOUD_BASE_URL: z.string().url(),
  PRINT_AGENT_KEY: z.string().min(1),
  POLL_INTERVAL_MS: z.coerce.number().default(1500),
  DEFAULT_PRINTER: z.string().optional()
});

const env = envSchema.parse(process.env);

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollLoop() {
  logger.info('Print agent started');
  while (true) {
    try {
      const job = await claimJob();
      if (!job) {
        await sleep(env.POLL_INTERVAL_MS);
        continue;
      }

      logger.info({ jobId: job.id }, 'Printing job');
      const pdfPath = await downloadAndPrepare(job);
      try {
        await print(pdfPath, { printer: env.DEFAULT_PRINTER || undefined });
        await completeJob(job.id, 'done');
        logger.info({ jobId: job.id }, 'Job done');
      } catch (error) {
        await completeJob(job.id, 'error', 'Print failed');
        logger.error({ err: error, jobId: job.id }, 'Print failed');
      } finally {
        fs.unlink(pdfPath, () => undefined);
      }
    } catch (error) {
      logger.error({ err: error }, 'Job failed');
      await sleep(env.POLL_INTERVAL_MS);
    }
  }
}

async function claimJob() {
  const response = await fetch(`${env.CLOUD_BASE_URL}/api/print-jobs/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-print-agent-key': env.PRINT_AGENT_KEY
    }
  });

  if (!response.ok) {
    logger.warn({ status: response.status }, 'Claim request failed');
    return null;
  }

  const data = await response.json();
  return data.job || null;
}

async function completeJob(jobId, status, errorMessage) {
  await fetch(`${env.CLOUD_BASE_URL}/api/print-jobs/${jobId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-print-agent-key': env.PRINT_AGENT_KEY
    },
    body: JSON.stringify({ status, errorMessage })
  });
}

async function downloadAndPrepare(job) {
  const response = await fetch(job.imageUrl);
  if (!response.ok) {
    await completeJob(job.id, 'error', 'Failed to download image');
    throw new Error('Failed to download image');
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const pdfPath = path.join(os.tmpdir(), `${job.id}.pdf`);
  await createPrintPdf(buffer, pdfPath);
  return pdfPath;
}

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

pollLoop();
