import express, { Request, Response } from 'express';
import { Logger } from './core/Logger';

const app = express();
const port = 3000;

app.get('/', (req: Request, res: Response) => {
  Logger.log('Request received');
  res.send('Hello, TypeScript!');
});

app.listen(port, () => {
  Logger.log(`Server running on port ${port}`);
});