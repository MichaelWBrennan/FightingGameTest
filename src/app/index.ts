import express, { Request, Response } from 'express';
import { Logger } from './core/Logger';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req: Request, res: Response) => {
  Logger.info('Health check endpoint accessed');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  Logger.info(`Server running on port ${PORT}`);
});