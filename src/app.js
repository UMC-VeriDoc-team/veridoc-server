import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import routes from './routes/index.js';
import cors from 'cors';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
<<<<<<< HEAD
app.use(cors());
=======
>>>>>>> cca7d1161adb0adc8a261497bd0a24ccffc0206d
app.use('/api/v1', routes);

// Health
app.get('/health', (req, res) => res.json({ success: true, message: 'ok' }));

// Global error handler (should be last middleware)
app.use(errorHandler);

export default app;
