import {Router} from 'express';
import {z} from 'zod';
import {db} from '../db/connection';
import {ApiError, wrap} from '../lib/errors';
import {parseBody} from '../middleware/errors';
import {requireAuth} from '../middleware/auth';

const router = Router();

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(2000).optional(),
});

/** Refresh a product's denormalized rating aggregates. */
function refreshRating(productId: number): void {
  db.prepare(`
    UPDATE products SET
      rating_avg = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE product_id = ?), 0),
      rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ?)
    WHERE id = ?
  `).run(productId, productId, productId);
}

router.post(
  '/products/:id/reviews',
  requireAuth,
  wrap(async (req, res) => {
    const body = parseBody(reviewSchema, req.body);
    const productId = Number(req.params.id);
    const product = db.prepare('SELECT id FROM products WHERE id = ? AND is_active = 1').get(productId);
    if (!product) throw new ApiError(404, 'PRODUCT_NOT_FOUND');

    try {
      db.prepare('INSERT INTO reviews (product_id, user_id, rating, title, body) VALUES (?, ?, ?, ?, ?)')
        .run(productId, req.user!.id, body.rating, body.title ?? null, body.body ?? null);
    } catch {
      throw new ApiError(409, 'REVIEW_EXISTS', 'You have already reviewed this product');
    }
    refreshRating(productId);
    const row = db.prepare(`
      SELECT r.id, r.rating, r.title, r.body, r.created_at, u.name AS user_name
      FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.id = last_insert_rowid()
    `).get();
    res.status(201).json({review: row});
  }),
);

router.delete(
  '/products/:id/reviews',
  requireAuth,
  wrap(async (req, res) => {
    const productId = Number(req.params.id);
    const info = db.prepare('DELETE FROM reviews WHERE product_id = ? AND user_id = ?')
      .run(productId, req.user!.id);
    if (info.changes === 0) throw new ApiError(404, 'REVIEW_NOT_FOUND');
    refreshRating(productId);
    res.json({ok: true});
  }),
);

export default router;
