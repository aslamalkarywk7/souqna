import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {migrate} from './db/migrate';
import {errorHandler} from './middleware/errors';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import cartRoutes from './routes/cart.routes';
import couponsRoutes from './routes/coupons.routes';
import ordersRoutes from './routes/orders.routes';
import productsRoutes from './routes/products.routes';
import reviewsRoutes from './routes/reviews.routes';
import wishlistRoutes from './routes/wishlist.routes';

// Ensure the schema exists before serving traffic
migrate();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json({limit: '1mb'}));

app.use('/api/auth', authRoutes);
app.use('/api', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api', reviewsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ok: true, service: 'souqna', time: new Date().toISOString()});
});

// Serve the built SPA in production
const distDir = path.resolve(__dirname, '../../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use((_req, res) => {
  res.status(404).json({error: {code: 'NOT_FOUND', message: 'Route not found'}});
});

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`Souqna API listening on http://localhost:${PORT}`);
});
