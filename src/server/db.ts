import Database from 'better-sqlite3';

const db = new Database('marketplace.db');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'buyer',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      sellerId INTEGER NOT NULL,
      image TEXT,
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sellerId) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId INTEGER NOT NULL,
      bidderId INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (productId) REFERENCES products (id),
      FOREIGN KEY (bidderId) REFERENCES users (id)
    );
  `);

  // Simple seed mechanism
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const insertUser = db.prepare('INSERT INTO users (name, email, role) VALUES (?, ?, ?)');
    insertUser.run('Admin User', 'admin@ai-market.local', 'admin');
    insertUser.run('Seller One', 'seller1@ai-market.local', 'seller');
    insertUser.run('Buyer One', 'buyer1@ai-market.local', 'buyer');

    const insertProduct = db.prepare('INSERT INTO products (title, description, price, sellerId, image) VALUES (?, ?, ?, ?, ?)');
    insertProduct.run('Vintage Camera', 'A beautiful vintage camera from the 1980s.', 150.0, 2, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800');
    insertProduct.run('Mechanical Keyboard', 'Custom built mechanical keyboard with cherry mx switches.', 220.0, 2, 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=800');
    insertProduct.run('Smart Watch', 'Latest generation smartwatch with health tracking.', 199.99, 2, 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=800');
  }
}

export default db;
