import 'dotenv/config';

import cors from 'cors';
import express, { type Request, type Response } from 'express';
import multer from 'multer';

import { parseCnab444 } from './cnabParser';
import { getStatus } from './fattorClient';
import type { CnabDetailRecord, ResultItem, UploadResponse } from './types';

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

app.use(cors());

const fetchStatusBatch = async (
  details: CnabDetailRecord[],
  concurrency = 4,
): Promise<ResultItem[]> => {
  const results: ResultItem[] = new Array(details.length);
  let cursor = 0;

  const worker = async (): Promise<void> => {
    while (cursor < details.length) {
      const idx = cursor++;
      const item = details[idx];
      try {
        const status = await getStatus(item.accessKey);
        results[idx] = { ...item, situation: status.situacao, error: null };
      } catch (err) {
        results[idx] = { ...item, situation: null, error: (err as Error).message };
      }
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, details.length) }, worker);
  await Promise.all(workers);
  return results;
};

app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'Nenhum arquivo enviado. Use o campo "file".' });
    return;
  }

  let parsed;
  try {
    const content = req.file.buffer.toString('latin1');
    parsed = parseCnab444(content);
  } catch (err) {
    res.status(400).json({ error: `Arquivo CNAB 444 inválido: ${(err as Error).message}` });
    return;
  }

  try {
    const items = await fetchStatusBatch(parsed.details);
    const body: UploadResponse = {
      totalRecords: parsed.details.length,
      warnings: parsed.warnings,
      items,
    };
    res.json(body);
  } catch (err) {
    res
      .status(502)
      .json({ error: `Falha ao consultar a API de status: ${(err as Error).message}` });
  }
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
