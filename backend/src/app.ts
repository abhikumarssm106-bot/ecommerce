import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';

import authRouter from './routes/auth.routes';
import productRouter from './routes/product.routes';
import cartRouter from './routes/cart.routes';
import orderRouter from './routes/order.routes';
import paymentRouter from './routes/payment.routes';
import reviewRouter from './routes/review.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security and Logging middlewares
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS configuration supporting credentials (cookies) for Vite's localhost:5173 server and local network IPs
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5000'];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      // Check if it is in the explicitly allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Match typical local network IPs (e.g. 192.168.x.x, 10.x.x.x, 172.16.x.x to 172.31.x.x)
      const isLocalIp = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);
      if (isLocalIp) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Base Route
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'MegaMart API is running.' });
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/payments', paymentRouter);
app.use('/api/v1/reviews', reviewRouter);

// Centralized error handler
app.use(errorHandler);

export default app;
