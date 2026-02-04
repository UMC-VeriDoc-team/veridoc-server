import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'production') {
	app.set('json spaces', 2);
}
app.use('/api/v1', routes);

// Health
app.get('/health', (req, res) => res.json({ success: true, message: 'ok' }));

// Global error handler (should be last middleware)
app.use(errorHandler);

export default app;
