import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/v1', routes);

// Health
app.get('/health', (req, res) => res.json({ success: true, message: 'ok' }));

// Global error handler (should be last middleware)
app.use(errorHandler);

export default app;
