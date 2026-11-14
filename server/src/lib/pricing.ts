import {db} from '../db/connection';
import {ApiError} from './errors';

export const SHIPPING_FEE = 2500; // 25.00
export const FREE_SHIPPING_THRESHOLD = 50000; // 500.00
export const CURRENCY = 'SAR';

export interface CouponRow {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_subtotal: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: number;
}

export function shippingFeeFor(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

/** Validate a coupon against a subtotal; returns the row or throws a stable-coded ApiError. */
export function applyCoupon(code: string, subtotal: number): {coupon: CouponRow; discount: number} {
  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ?').get(code) as CouponRow | undefined;
  if (!coupon || coupon.is_active !== 1) {
    throw new ApiError(400, 'COUPON_INVALID', 'Coupon not found or inactive');
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    throw new ApiError(400, 'COUPON_EXPIRED', 'Coupon has expired');
  }
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    throw new ApiError(400, 'COUPON_EXHAUSTED', 'Coupon usage limit reached');
  }
  if (subtotal < coupon.min_subtotal) {
    throw new ApiError(400, 'COUPON_MIN_SUBTOTAL', 'Order does not meet the coupon minimum');
  }
  const discount =
    coupon.type === 'percent'
      ? Math.round((subtotal * coupon.value) / 100)
      : Math.min(coupon.value, subtotal);
  return {coupon, discount};
}

export interface Totals {
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
}

export function computeTotals(subtotal: number, discount = 0): Totals {
  const shipping_fee = shippingFeeFor(subtotal);
  return {subtotal, discount, shipping_fee, total: Math.max(0, subtotal - discount) + shipping_fee};
}
