import {Router} from 'express';
import {z} from 'zod';
import {db} from '../db/connection';
import {ApiError, wrap} from '../lib/errors';
import {applyCoupon, computeTotals} from '../lib/pricing';
import {parseBody} from '../middleware/errors';
import {requireAuth} from '../middleware/auth';
import {mockGateway} from '../services/payments';
import type {OrderRow, ProductRow} from '../types';

const router = Router();
router.use(requireAuth);

const checkoutSchema = z.object({
  ship: z.object({
    name: z.string().min(2).max(80),
    phone: z.string().min(6).max(20),
    line1: z.string().min(4).max(200),
    city: z.string().min(2).max(80),
    country: z.string().min(2).max(80),
  }),
  payment_method: z.enum(['cod', 'card']),
  coupon_code: z.string().max(40).optional(),
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    qty: z.number().int().min(1).max(99),
  })).min(1).max(100),
});

const CANCELLABLE: OrderRow['status'][] = ['pending', 'paid'];

function orderWithItems(order: OrderRow) {
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  return {...order, items};
}

function generateOrderNumber(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${new Date().getFullYear()}-${rand}`;
}

router.post(
  '/',
  wrap(async (req, res) => {
    const body = parseBody(checkoutSchema, req.body);
    const userId = req.user!.id;

    // Pass 1 (reads): validate products and compute totals.
    const productStmt = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1');
    const lines: {product: ProductRow; qty: number; line_total: number}[] = [];
    let subtotal = 0;
    for (const line of body.items) {
      const product = productStmt.get(line.product_id) as ProductRow | undefined;
      if (!product) throw new ApiError(404, 'PRODUCT_NOT_FOUND', `Product ${line.product_id} not found`);
      if (product.stock < line.qty) {
        throw new ApiError(409, 'OUT_OF_STOCK', `Insufficient stock for "${product.name_en}"`);
      }
      subtotal += product.price * line.qty;
      lines.push({product, qty: line.qty, line_total: product.price * line.qty});
    }

    let discount = 0;
    let couponCode: string | null = null;
    if (body.coupon_code) {
      const applied = applyCoupon(body.coupon_code, subtotal);
      discount = applied.discount;
      couponCode = applied.coupon.code;
    }
    const totals = computeTotals(subtotal, discount);
    const orderNumber = generateOrderNumber();

    // Charge before the write transaction (better-sqlite3 transactions are sync).
    // A real gateway would expose a void/refund call to run if the transaction fails.
    let status: OrderRow['status'] = 'pending';
    let paymentStatus: OrderRow['payment_status'] = 'unpaid';
    if (body.payment_method === 'card') {
      const charge = await mockGateway.charge(totals.total, orderNumber);
      if (!charge.ok) throw new ApiError(402, 'PAYMENT_FAILED', charge.reason ?? 'Payment declined');
      status = 'paid';
      paymentStatus = 'paid';
    }

    // Pass 2 (single transaction): re-validate stock, create order + items,
    // decrement stock, consume the coupon and clear the cart.
    try {
      const order = db.transaction(() => {
        for (const l of lines) {
          const fresh = db.prepare('SELECT stock FROM products WHERE id = ?').get(l.product.id) as {stock: number};
          if (fresh.stock < l.qty) {
            throw new ApiError(409, 'OUT_OF_STOCK', `Insufficient stock for "${l.product.name_en}"`);
          }
        }

        if (couponCode) {
          db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?').run(couponCode);
        }

        const orderInfo = db.prepare(`
          INSERT INTO orders (order_number, user_id, status, payment_method, payment_status,
            subtotal, discount, shipping_fee, total, coupon_code,
            ship_name, ship_phone, ship_line1, ship_city, ship_country)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          orderNumber, userId, status, body.payment_method, paymentStatus,
          totals.subtotal, totals.discount, totals.shipping_fee, totals.total, couponCode,
          body.ship.name, body.ship.phone, body.ship.line1, body.ship.city, body.ship.country,
        );
        const orderId = Number(orderInfo.lastInsertRowid);

        const insertItem = db.prepare(`
          INSERT INTO order_items (order_id, product_id, name_ar, name_en, image, unit_price, qty, line_total)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const decrement = db.prepare(`UPDATE products SET stock = stock - ?, updated_at = datetime('now') WHERE id = ?`);
        for (const l of lines) {
          const firstImage = Array.isArray(l.product.images) ? null : (JSON.parse(l.product.images)[0] ?? null);
          insertItem.run(orderId, l.product.id, l.product.name_ar, l.product.name_en, firstImage, l.product.price, l.qty, l.line_total);
          decrement.run(l.qty, l.product.id);
        }

        // Clear the server cart after a successful order
        const cart = db.prepare('SELECT id FROM carts WHERE user_id = ?').get(userId) as {id: number} | undefined;
        if (cart) db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);

        const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as OrderRow;
        return orderWithItems(created);
      })();
      res.status(201).json({order});
    } catch (err) {
      // The charge succeeded but the order could not be written; with a real
      // gateway this is where the payment would be voided/refunded.
      if (body.payment_method === 'card' && !(err instanceof ApiError)) {
        console.error(`Charge ${orderNumber} succeeded but order write failed — refund required.`, err);
      }
      throw err;
    }
  }),
);

router.get(
  '/',
  wrap(async (req, res) => {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY placed_at DESC, id DESC')
      .all(req.user!.id) as OrderRow[];
    res.json({orders: orders.map(orderWithItems)});
  }),
);

router.get(
  '/:orderNumber',
  wrap(async (req, res) => {
    const order = db.prepare('SELECT * FROM orders WHERE order_number = ? AND user_id = ?')
      .get(req.params.orderNumber, req.user!.id) as OrderRow | undefined;
    if (!order) throw new ApiError(404, 'ORDER_NOT_FOUND');
    res.json({order: orderWithItems(order)});
  }),
);

router.post(
  '/:orderNumber/cancel',
  wrap(async (req, res) => {
    const restore = db.transaction(() => {
      const order = db.prepare('SELECT * FROM orders WHERE order_number = ? AND user_id = ?')
        .get(req.params.orderNumber, req.user!.id) as OrderRow | undefined;
      if (!order) throw new ApiError(404, 'ORDER_NOT_FOUND');
      if (!CANCELLABLE.includes(order.status)) {
        throw new ApiError(409, 'ORDER_NOT_CANCELLABLE', 'This order can no longer be cancelled');
      }
      const items = db.prepare('SELECT product_id, qty FROM order_items WHERE order_id = ? AND product_id IS NOT NULL').all(order.id) as {product_id: number; qty: number}[];
      for (const it of items) {
        db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(it.qty, it.product_id);
      }
      if (order.coupon_code) {
        db.prepare('UPDATE coupons SET used_count = MAX(used_count - 1, 0) WHERE code = ?').run(order.coupon_code);
      }
      db.prepare(`UPDATE orders SET status = 'cancelled', payment_status = CASE WHEN payment_status = 'paid' THEN 'refunded' ELSE payment_status END, updated_at = datetime('now') WHERE id = ?`)
        .run(order.id);
      const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id) as OrderRow;
      return orderWithItems(updated);
    });
    res.json({order: restore()});
  }),
);

export default router;
