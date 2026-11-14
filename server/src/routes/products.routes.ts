import {Router} from 'express';
import {db} from '../db/connection';
import {ApiError, wrap} from '../lib/errors';
import {toCategoryDTO, toProductDTO, type ProductDTO} from '../lib/serialize';
import type {CategoryRow} from '../types';

const router = Router();

/** Serialize a product row joined with its category. */
function withCategory(row: any): ProductDTO {
  return toProductDTO(row, row.cat_slug
    ? {id: row.category_id, slug: row.cat_slug, name_ar: row.cat_name_ar, name_en: row.cat_name_en}
    : null);
}

const PRODUCT_SELECT = `
  SELECT p.*, c.slug AS cat_slug, c.name_ar AS cat_name_ar, c.name_en AS cat_name_en
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

router.get(
  '/categories',
  wrap(async (_req, res) => {
    const rows = db.prepare('SELECT * FROM categories ORDER BY id').all() as CategoryRow[];
    res.json({categories: rows.map(toCategoryDTO)});
  }),
);

router.get(
  '/products',
  wrap(async (req, res) => {
    const q = (req.query.q as string | undefined)?.trim();
    const category = req.query.category as string | undefined;
    const featured = req.query.featured === 'true';
    const sort = (req.query.sort as string | undefined) ?? 'newest';
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.min(48, Math.max(1, Number(req.query.per_page) || 12));
    const priceMin = req.query.price_min ? Number(req.query.price_min) : null;
    const priceMax = req.query.price_max ? Number(req.query.price_max) : null;

    const where: string[] = ['p.is_active = 1'];
    const params: Record<string, unknown> = {};
    if (q) {
      where.push('(p.name_ar LIKE @q OR p.name_en LIKE @q OR p.brand LIKE @q)');
      params.q = `%${q}%`;
    }
    if (category) {
      where.push('c.slug = @category');
      params.category = category;
    }
    if (featured) {
      where.push('p.is_featured = 1');
    }
    if (priceMin !== null && !Number.isNaN(priceMin)) {
      where.push('p.price >= @priceMin');
      params.priceMin = priceMin;
    }
    if (priceMax !== null && !Number.isNaN(priceMax)) {
      where.push('p.price <= @priceMax');
      params.priceMax = priceMax;
    }

    const orderBy =
      sort === 'price_asc' ? 'p.price ASC'
      : sort === 'price_desc' ? 'p.price DESC'
      : sort === 'rating' ? 'p.rating_avg DESC, p.rating_count DESC'
      : sort === 'name' ? 'p.name_en COLLATE NOCASE ASC'
      : 'p.created_at DESC, p.id DESC';

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = (db.prepare(
      `SELECT COUNT(*) AS n FROM products p LEFT JOIN categories c ON c.id = p.category_id ${whereSql}`,
    ).get(params) as {n: number}).n;
    const rows = db.prepare(
      `${PRODUCT_SELECT} ${whereSql} ORDER BY ${orderBy} LIMIT @limit OFFSET @offset`,
    ).all({...params, limit: perPage, offset: (page - 1) * perPage}) as any[];

    res.json({
      items: rows.map(withCategory),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / perPage)),
    });
  }),
);

router.get(
  '/products/:slug',
  wrap(async (req, res) => {
    const row = db.prepare(`${PRODUCT_SELECT} WHERE p.slug = ? AND p.is_active = 1`).get(req.params.slug);
    if (!row) throw new ApiError(404, 'PRODUCT_NOT_FOUND');
    const product = withCategory(row);
    const related = db.prepare(
      `${PRODUCT_SELECT} WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
       ORDER BY p.is_featured DESC, p.rating_avg DESC LIMIT 4`,
    ).all(product.category.id, product.id) as any[];
    res.json({product, related: related.map(withCategory)});
  }),
);

router.get(
  '/products/:id/reviews',
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const rows = db.prepare(`
      SELECT r.id, r.rating, r.title, r.body, r.created_at, u.name AS user_name
      FROM reviews r JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ? ORDER BY r.created_at DESC
    `).all(id);
    res.json({reviews: rows});
  }),
);

export default router;
