import {Router} from 'express';
import {z} from 'zod';
import {db} from '../db/connection';
import {ApiError, wrap} from '../lib/errors';
import {toProductDTO} from '../lib/serialize';
import {parseBody} from '../middleware/errors';
import {requireAuth} from '../middleware/auth';
import type {ProductRow} from '../types';

const router = Router();
router.use(requireAuth);

const addToCartSchema = z.object({
  product_id: z.number().int().positive(),
  qty: z.number().int().min(1).max(99).default(1),
});

const updateItemSchema = z.object({
  qty: z.number().int().min(0).max(99),
});

function getOrCreateCart(userId: number): number {
  const existing = db.prepare('SELECT id FROM carts WHERE user_id = ?').get(userId) as {id: number} | undefined;
  if (existing) return existing.id;
  const r = db.prepare('INSERT INTO carts (user_id) VALUES (?)').run(userId);
  return Number(r.lastInsertRowid);
}

function cartPayload(userId: number) {
  const cart = db.prepare('SELECT id FROM carts WHERE user_id = ?').get(userId) as {id: number} | undefined;
  if (!cart) return {items: [], subtotal: 0, count: 0};
  const rows = db.prepare(`
    SELECT ci.id AS item_id, ci.qty, p.*
    FROM cart_items ci JOIN products p ON p.id = ci.product_id
    WHERE ci.cart_id = ? ORDER BY ci.id
  `).all(cart.id) as ({item_id: number; qty: number} & ProductRow)[];
  const items = rows.map(r => ({
    id: r.item_id,
    qty: r.qty,
    line_total: r.qty * r.price,
    product: toProductDTO(r),
  }));
  const subtotal = items.reduce((s, i) => s + i.line_total, 0);
  return {items, subtotal, count: items.reduce((s, i) => s + i.qty, 0)};
}

router.get(
  '/',
  wrap(async (req, res) => {
    res.json(cartPayload(req.user!.id));
  }),
);

router.post(
  '/items',
  wrap(async (req, res) => {
    const body = parseBody(addToCartSchema, req.body);
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(body.product_id) as ProductRow | undefined;
    if (!product) throw new ApiError(404, 'PRODUCT_NOT_FOUND');
    if (product.stock < body.qty) throw new ApiError(409, 'OUT_OF_STOCK', 'Requested quantity exceeds available stock');

    const cartId = getOrCreateCart(req.user!.id);
    const existing = db.prepare('SELECT id, qty FROM cart_items WHERE cart_id = ? AND product_id = ?')
      .get(cartId, body.product_id) as {id: number; qty: number} | undefined;
    if (existing) {
      const newQty = Math.min(existing.qty + body.qty, product.stock);
      db.prepare('UPDATE cart_items SET qty = ? WHERE id = ?').run(newQty, existing.id);
    } else {
      db.prepare('INSERT INTO cart_items (cart_id, product_id, qty) VALUES (?, ?, ?)')
        .run(cartId, body.product_id, body.qty);
    }
    db.prepare(`UPDATE carts SET updated_at = datetime('now') WHERE id = ?`).run(cartId);
    res.status(201).json(cartPayload(req.user!.id));
  }),
);

router.patch(
  '/items/:itemId',
  wrap(async (req, res) => {
    const body = parseBody(updateItemSchema, req.body);
    const cartId = getOrCreateCart(req.user!.id);
    const item = db.prepare('SELECT ci.*, p.stock FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.id = ? AND ci.cart_id = ?')
      .get(Number(req.params.itemId), cartId) as {id: number; product_id: number; stock: number} | undefined;
    if (!item) throw new ApiError(404, 'CART_ITEM_NOT_FOUND');
    if (body.qty === 0) {
      db.prepare('DELETE FROM cart_items WHERE id = ?').run(item.id);
    } else {
      if (body.qty > item.stock) throw new ApiError(409, 'OUT_OF_STOCK', 'Requested quantity exceeds available stock');
      db.prepare('UPDATE cart_items SET qty = ? WHERE id = ?').run(body.qty, item.id);
    }
    res.json(cartPayload(req.user!.id));
  }),
);

router.delete(
  '/items/:itemId',
  wrap(async (req, res) => {
    const cartId = getOrCreateCart(req.user!.id);
    db.prepare('DELETE FROM cart_items WHERE id = ? AND cart_id = ?').run(Number(req.params.itemId), cartId);
    res.json(cartPayload(req.user!.id));
  }),
);

router.delete(
  '/',
  wrap(async (req, res) => {
    const cartId = getOrCreateCart(req.user!.id);
    db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cartId);
    res.json(cartPayload(req.user!.id));
  }),
);

/** Merge a guest cart (from localStorage) into the server cart after login. */
router.post(
  '/merge',
  wrap(async (req, res) => {
    const body = parseBody(z.object({items: z.array(z.object({product_id: z.number().int().positive(), qty: z.number().int().min(1).max(99)})).max(100)}), req.body);
    const cartId = getOrCreateCart(req.user!.id);
    for (const line of body.items) {
      const product = db.prepare('SELECT stock FROM products WHERE id = ? AND is_active = 1').get(line.product_id) as {stock: number} | undefined;
      if (!product) continue;
      const qty = Math.min(line.qty, product.stock);
      if (qty <= 0) continue;
      const existing = db.prepare('SELECT id, qty FROM cart_items WHERE cart_id = ? AND product_id = ?')
        .get(cartId, line.product_id) as {id: number; qty: number} | undefined;
      if (existing) {
        db.prepare('UPDATE cart_items SET qty = ? WHERE id = ?')
          .run(Math.min(existing.qty + qty, product.stock), existing.id);
      } else {
        db.prepare('INSERT INTO cart_items (cart_id, product_id, qty) VALUES (?, ?, ?)').run(cartId, line.product_id, qty);
      }
    }
    res.json(cartPayload(req.user!.id));
  }),
);

export default router;
