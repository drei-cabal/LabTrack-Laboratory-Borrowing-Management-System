import express from 'express';
import cors from 'cors';
import { logger } from './middleware/logger';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(logger);

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api', routes);

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
