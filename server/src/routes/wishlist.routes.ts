import {Router} from 'express';
import {z} from 'zod';
import {db} from '../db/connection';
import {wrap} from '../lib/errors';
import {toProductDTO} from '../lib/serialize';
import {parseBody} from '../middleware/errors';
import {requireAuth} from '../middleware/auth';
import type {ProductRow} from '../types';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  wrap(async (req, res) => {
    const rows = db.prepare(`
      SELECT p.* FROM wishlist_items w JOIN products p ON p.id = w.product_id
      WHERE w.user_id = ? AND p.is_active = 1 ORDER BY w.created_at DESC
    `).all(req.user!.id) as ProductRow[];
    res.json({items: rows.map(p => toProductDTO(p))});
  }),
);

router.post(
  '/',
  wrap(async (req, res) => {
    const body = parseBody(z.object({product_id: z.number().int().positive()}), req.body);
    db.prepare('INSERT OR IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)')
      .run(req.user!.id, body.product_id);
    res.status(201).json({ok: true});
  }),
);

router.delete(
  '/:productId',
  wrap(async (req, res) => {
    db.prepare('DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?')
      .run(req.user!.id, Number(req.params.productId));
    res.json({ok: true});
  }),
);

export default router;
