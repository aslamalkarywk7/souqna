-- ============================================================
-- Souqna — e-commerce platform schema (SQLite)
-- All monetary values are stored as INTEGER minor units (halalas).
-- ============================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  phone         TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS addresses (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      TEXT    NOT NULL,
  line1      TEXT    NOT NULL,
  city       TEXT    NOT NULL,
  country    TEXT    NOT NULL,
  phone      TEXT    NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT    NOT NULL UNIQUE,
  name_ar    TEXT    NOT NULL,
  name_en    TEXT    NOT NULL,
  parent_id  INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  image_url  TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  sku              TEXT    NOT NULL UNIQUE,
  slug             TEXT    NOT NULL UNIQUE,
  name_ar          TEXT    NOT NULL,
  name_en          TEXT    NOT NULL,
  description_ar   TEXT    NOT NULL DEFAULT '',
  description_en   TEXT    NOT NULL DEFAULT '',
  price            INTEGER NOT NULL CHECK (price >= 0),
  compare_at_price INTEGER CHECK (compare_at_price IS NULL OR compare_at_price >= price),
  stock            INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id      INTEGER NOT NULL REFERENCES categories(id),
  brand            TEXT,
  images           TEXT    NOT NULL DEFAULT '[]',  -- JSON array of URLs
  specs            TEXT    NOT NULL DEFAULT '{}',  -- JSON: { "ar": {k:v}, "en": {k:v} }
  is_active        INTEGER NOT NULL DEFAULT 1,
  is_featured      INTEGER NOT NULL DEFAULT 0,
  rating_avg       REAL    NOT NULL DEFAULT 0,
  rating_count     INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active   ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);

CREATE TABLE IF NOT EXISTS carts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cart_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  cart_id    INTEGER NOT NULL REFERENCES carts(id)    ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty        INTEGER NOT NULL CHECK (qty > 0),
  UNIQUE (cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS coupons (
  code         TEXT    PRIMARY KEY COLLATE NOCASE,
  type         TEXT    NOT NULL CHECK (type IN ('percent','fixed')),
  value        INTEGER NOT NULL CHECK (value > 0),  -- percent: 1-100, fixed: minor units
  min_subtotal INTEGER NOT NULL DEFAULT 0,
  max_uses     INTEGER,
  used_count   INTEGER NOT NULL DEFAULT 0,
  expires_at   TEXT,
  is_active    INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS orders (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number   TEXT    NOT NULL UNIQUE,
  user_id        INTEGER NOT NULL REFERENCES users(id),
  status         TEXT    NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
  payment_method TEXT    NOT NULL CHECK (payment_method IN ('cod','card')),
  payment_status TEXT    NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','refunded')),
  subtotal       INTEGER NOT NULL,
  discount       INTEGER NOT NULL DEFAULT 0,
  shipping_fee   INTEGER NOT NULL DEFAULT 0,
  total          INTEGER NOT NULL,
  coupon_code    TEXT REFERENCES coupons(code),
  ship_name      TEXT    NOT NULL,
  ship_phone     TEXT    NOT NULL,
  ship_line1     TEXT    NOT NULL,
  ship_city      TEXT    NOT NULL,
  ship_country   TEXT    NOT NULL,
  placed_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL REFERENCES orders(id)   ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  name_ar    TEXT    NOT NULL,
  name_en    TEXT    NOT NULL,
  image      TEXT,
  unit_price INTEGER NOT NULL,
  qty        INTEGER NOT NULL CHECK (qty > 0),
  line_total INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS reviews (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title      TEXT,
  body       TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, product_id)
);
