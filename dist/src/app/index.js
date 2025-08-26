import express from 'express';
import { Logger } from './core/Logger';
const app = express();
const port = 3000;
app.get('/', (req, res) => {
    Logger.log('Request received');
    res.send('Hello, TypeScript!');
});
app.listen(port, () => {
    Logger.log(`Server running on port ${port}`);
});
//# sourceMappingURL=index.js.map