import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.config.js';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// BigInt와 Date를 JSON으로 직렬화하기 위한 설정
app.set('json replacer', (key, value) => {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
});

// CORS 설정
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://veridoc-ten.vercel.app/'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());
if (process.env.NODE_ENV !== 'production') {
  app.set('json spaces', 2);
}
app.use('/api/v1', routes);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health
app.get('/health', (req, res) => res.json({ success: true, message: 'ok' }));

// Global error handler (should be last middleware)
app.use(errorHandler);

export default app;
