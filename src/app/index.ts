import express, { Request, Response } from 'express';
import { Logger } from './core/Logger';

const app = express();
const port = 3000;

app.get('/', (_req: Request, res: Response) => {
  Logger.log('Health check endpoint called');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  Logger.log(`Server running on port ${port}`);
});