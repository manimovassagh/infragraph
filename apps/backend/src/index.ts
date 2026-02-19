import express from 'express';
import cors from 'cors';
import { parseRouter } from './routes/parse.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' }));
app.use(express.json({ limit: '50mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

app.use('/api', parseRouter);

app.listen(PORT, () => {
  console.log(`AWSArchitect backend running on http://localhost:${PORT}`);
});
