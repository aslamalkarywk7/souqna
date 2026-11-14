import {Router} from 'express';
import {z} from 'zod';
import {db} from '../db/connection';
import {ApiError, wrap} from '../lib/errors';
import {toCategoryDTO, toProductDTO} from '../lib/serialize';
import {parseBody} from '../middleware/errors';
import {requireAdmin, requireAuth} from '../middleware/auth';
import type {CategoryRow, OrderRow, ProductRow} from '../types';

const router = Router();
router.use(requireAuth, requireAdmin);

// ── Stats ────────────────────────────────────────────────────
router.get(
  '/stats',
  wrap(async (_req, res) => {
    const revenue = (db.prepare(
      `SELECT COALESCE(SUM(total), 0) AS v FROM orders WHERE status NOT IN ('cancelled','refunded')`,
    ).get() as {v: number}).v;
    const ordersCount = (db.prepare('SELECT COUNT(*) AS n FROM orders').get() as {n: number}).n;
    const productsCount = (db.prepare('SELECT COUNT(*) AS n FROM products WHERE is_active = 1').get() as {n: number}).n;
    const customersCount = (db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'customer'`).get() as {n: number}).n;
    const lowStock = db.prepare('SELECT * FROM products WHERE is_active = 1 AND stock <= 10 ORDER BY stock ASC LIMIT 5').all() as ProductRow[];
    const topProducts = db.prepare(`
      SELECT oi.name_ar, oi.name_en, SUM(oi.qty) AS qty_sold, SUM(oi.line_total) AS revenue
      FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.status NOT IN ('cancelled','refunded')
      GROUP BY oi.name_ar, oi.name_en ORDER BY qty_sold DESC LIMIT 5
    `).all();
    const recentOrders = db.prepare('SELECT * FROM orders ORDER BY placed_at DESC, id DESC LIMIT 8').all() as OrderRow[];
    res.json({revenue, orders_count: ordersCount, products_count: productsCount, customers_count: customersCount, low_stock: lowStock.map(p => toProductDTO(p)), top_products: topProducts, recent_orders: recentOrders});
  }),
);

// ── Products ─────────────────────────────────────────────────
const productSchema = z.object({
  sku: z.string().min(2).max(40),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with dashes'),
  name_ar: z.string().min(2).max(160),
  name_en: z.string().min(2).max(160),
  description_ar: z.string().max(4000).default(''),
  description_en: z.string().max(4000).default(''),
  price: z.number().int().min(0),
  compare_at_price: z.number().int().min(0).nullable().optional(),
  stock: z.number().int().min(0),
  category_id: z.number().int().positive(),
  brand: z.string().max(80).nullable().optional(),
  images: z.array(z.string().url()).max(8).default([]),
  specs: z.record(z.string(), z.string()).default({}),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
});

router.get(
  '/products',
  wrap(async (req, res) => {
    const q = (req.query.q as string | undefined)?.trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = 10;
    const where = q ? 'WHERE name_ar LIKE @q OR name_en LIKE @q OR sku LIKE @q' : '';
    const params = q ? {q: `%${q}%`} : {};
    const total = (db.prepare(`SELECT COUNT(*) AS n FROM products ${where}`).get(params) as {n: number}).n;
    const rows = db.prepare(`SELECT * FROM products ${where} ORDER BY id DESC LIMIT @limit OFFSET @offset`)
      .all({...params, limit: perPage, offset: (page - 1) * perPage}) as ProductRow[];
    res.json({items: rows.map(p => toProductDTO(p)), total, page, pages: Math.max(1, Math.ceil(total / perPage))});
  }),
);

router.post(
  '/products',
  wrap(async (req, res) => {
    const body = parseBody(productSchema, req.body);
    const r = db.prepare(`
      INSERT INTO products (sku, slug, name_ar, name_en, description_ar, description_en, price,
        compare_at_price, stock, category_id, brand, images, specs, is_active, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      body.sku, body.slug, body.name_ar, body.name_en, body.description_ar, body.description_en,
      body.price, body.compare_at_price ?? null, body.stock, body.category_id, body.brand ?? null,
      JSON.stringify(body.images), JSON.stringify({ar: body.specs, en: body.specs}),
      body.is_active ? 1 : 0, body.is_featured ? 1 : 0,
    );
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(r.lastInsertRowid) as ProductRow;
    res.status(201).json({product: toProductDTO(row)});
  }),
);

router.patch(
  '/products/:id',
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as ProductRow | undefined;
    if (!existing) throw new ApiError(404, 'PRODUCT_NOT_FOUND');
    const body = parseBody(productSchema.partial(), req.body);

    const fields: string[] = [];
    const params: Record<string, unknown> = {id};
    for (const [key, value] of Object.entries(body)) {
      if (value === undefined) continue;
      if (key === 'images') {
        fields.push('images = @images');
        params.images = JSON.stringify(value);
      } else if (key === 'specs') {
        fields.push('specs = @specs');
        params.specs = JSON.stringify({ar: value, en: value});
      } else if (key === 'is_active' || key === 'is_featured') {
        fields.push(`${key} = @${key}`);
        params[key] = value ? 1 : 0;
      } else {
        fields.push(`${key} = @${key}`);
        params[key] = value;
      }
    }
    if (fields.length) {
      fields.push(`updated_at = datetime('now')`);
      db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = @id`).run(params);
    }
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as ProductRow;
    res.json({product: toProductDTO(row)});
  }),
);

router.delete(
  '/products/:id',
  wrap(async (req, res) => {
    // Soft delete keeps order history intact.
    const info = db.prepare(`UPDATE products SET is_active = 0, updated_at = datetime('now') WHERE id = ?`)
      .run(Number(req.params.id));
    if (info.changes === 0) throw new ApiError(404, 'PRODUCT_NOT_FOUND');
    res.json({ok: true});
  }),
);

// ── Categories ───────────────────────────────────────────────
const categorySchema = z.object({
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/),
  name_ar: z.string().min(2).max(80),
  name_en: z.string().min(2).max(80),
});

router.get(
  '/categories',
  wrap(async (_req, res) => {
    const rows = db.prepare('SELECT * FROM categories ORDER BY id').all() as CategoryRow[];
    res.json({categories: rows.map(toCategoryDTO)});
  }),
);

router.post(
  '/categories',
  wrap(async (req, res) => {
    const body = parseBody(categorySchema, req.body);
    const r = db.prepare('INSERT INTO categories (slug, name_ar, name_en) VALUES (?, ?, ?)')
      .run(body.slug, body.name_ar, body.name_en);
    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(r.lastInsertRowid);
    res.status(201).json({category: toCategoryDTO(row as any)});
  }),
);

router.delete(
  '/categories/:id',
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const inUse = (db.prepare('SELECT COUNT(*) AS n FROM products WHERE category_id = ?').get(id) as {n: number}).n;
    if (inUse > 0) throw new ApiError(409, 'CATEGORY_IN_USE', 'Move or delete its products first');
    const info = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    if (info.changes === 0) throw new ApiError(404, 'CATEGORY_NOT_FOUND');
    res.json({ok: true});
  }),
);

// ── Orders ───────────────────────────────────────────────────
const orderStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
});

router.get(
  '/orders',
  wrap(async (req, res) => {
    const status = req.query.status as string | undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = 10;
    const where = status ? 'WHERE status = @status' : '';
    const params = status ? {status} : {};
    const total = (db.prepare(`SELECT COUNT(*) AS n FROM orders ${where}`).get(params) as {n: number}).n;
    const rows = db.prepare(`SELECT * FROM orders ${where} ORDER BY placed_at DESC, id DESC LIMIT @limit OFFSET @offset`)
      .all({...params, limit: perPage, offset: (page - 1) * perPage}) as OrderRow[];
    res.json({items: rows, total, page, pages: Math.max(1, Math.ceil(total / perPage))});
  }),
);

router.patch(
  '/orders/:id',
  wrap(async (req, res) => {
    const body = parseBody(orderStatusSchema, req.body);
    const id = Number(req.params.id);
    const info = db.prepare(`UPDATE orders SET status = ?, payment_status = CASE
        WHEN ? IN ('cancelled','refunded') AND payment_status = 'paid' THEN 'refunded'
        WHEN ? IN ('paid','processing','shipped','delivered') THEN 'paid'
        ELSE payment_status END,
        updated_at = datetime('now') WHERE id = ?`)
      .run(body.status, body.status, body.status, id);
    if (info.changes === 0) throw new ApiError(404, 'ORDER_NOT_FOUND');
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow;
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
    res.json({order: {...order, items}});
  }),
);

// ── Coupons ──────────────────────────────────────────────────
const couponSchema = z.object({
  code: z.string().min(3).max(40).toUpperCase(),
  type: z.enum(['percent', 'fixed']),
  value: z.number().int().positive(),
  min_subtotal: z.number().int().min(0).default(0),
  max_uses: z.number().int().positive().nullable().optional(),
  expires_at: z.string().nullable().optional(),
});

router.get(
  '/coupons',
  wrap(async (_req, res) => {
    const coupons = db.prepare('SELECT * FROM coupons ORDER BY rowid DESC').all();
    res.json({coupons});
  }),
);

router.post(
  '/coupons',
  wrap(async (req, res) => {
    const body = parseBody(couponSchema, req.body);
    if (body.type === 'percent' && body.value > 100) throw new ApiError(400, 'VALIDATION', 'Percent value must be ≤ 100');
    try {
      db.prepare('INSERT INTO coupons (code, type, value, min_subtotal, max_uses, expires_at, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)')
        .run(body.code, body.type, body.value, body.min_subtotal, body.max_uses ?? null, body.expires_at ?? null);
    } catch {
      throw new ApiError(409, 'COUPON_EXISTS', 'A coupon with this code already exists');
    }
    const coupon = db.prepare('SELECT * FROM coupons WHERE code = ?').get(body.code);
    res.status(201).json({coupon});
  }),
);

router.delete(
  '/coupons/:code',
  wrap(async (req, res) => {
    const info = db.prepare('DELETE FROM coupons WHERE code = ?').run(req.params.code);
    if (info.changes === 0) throw new ApiError(404, 'COUPON_NOT_FOUND');
    res.json({ok: true});
  }),
);

export default router;
