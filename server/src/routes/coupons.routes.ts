import {Router} from 'express';
import {z} from 'zod';
import {wrap} from '../lib/errors';
import {applyCoupon} from '../lib/pricing';
import {parseBody} from '../middleware/errors';

const router = Router();

/** Validate a coupon against a subtotal without consuming it. */
router.post(
  '/validate',
  wrap(async (req, res) => {
    const body = parseBody(
      z.object({code: z.string().min(1).max(40), subtotal: z.number().int().min(0)}),
      req.body,
    );
    const {coupon, discount} = applyCoupon(body.code, body.subtotal);
    res.json({code: coupon.code, type: coupon.type, value: coupon.value, discount});
  }),
);

export default router;
