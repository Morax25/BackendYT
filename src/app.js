import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import ApiError from './utils/ApiError.js';

const app = express();

//middlewares

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: '16kb',
  })
);
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

//Routes

import UserRouter from './routes/user.routes.js';

app.use('/api/v1/users', UserRouter);


app.use((err, req, res, next) => {
  console.error('🔥 Error caught:', err);
  if (err instanceof ApiError) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});



export default app;
