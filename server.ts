import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import path from 'path';
import 'dotenv/config';
import db, { initDb } from './src/server/db.js';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize SQLite db
  initDb();

  // Initialize Gemini AI client
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  }

  // ==== API ROUTES ====
  
  // Users
  app.get('/api/users', (req, res) => {
    try {
      const users = db.prepare('SELECT * FROM users').all();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/users/:id', (req, res) => {
    try {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
      res.json(user || { error: 'Not found' });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Products
  app.get('/api/products', (req, res) => {
    try {
      const products = db.prepare(`
        SELECT p.*, u.name as sellerName 
        FROM products p 
        JOIN users u ON p.sellerId = u.id
      `).all();
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/products/:id', (req, res) => {
    try {
      const product = db.prepare(`
        SELECT p.*, u.name as sellerName 
        FROM products p 
        JOIN users u ON p.sellerId = u.id 
        WHERE p.id = ?
      `).get(req.params.id);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      const bids = db.prepare(`
        SELECT b.*, u.name as bidderName
        FROM bids b
        JOIN users u ON b.bidderId = u.id
        WHERE b.productId = ?
        ORDER BY b.amount DESC
      `).all(req.params.id);

      res.json({ ...(product as object), bids });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Orders / Bids
  app.post('/api/bids', (req, res) => {
    try {
      const { productId, bidderId, amount } = req.body;
      const insert = db.prepare('INSERT INTO bids (productId, bidderId, amount) VALUES (?, ?, ?)');
      const info = insert.run(productId, bidderId, amount);
      res.json({ id: info.lastInsertRowid, success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // AI Features (Recommendations / Insights)
  app.post('/api/ai/insights', async (req, res) => {
    if (!ai) {
      return res.status(503).json({ error: 'AI not configured' });
    }
    
    try {
      const { productTitle, description } = req.body;
      const prompt = `Analyze this marketplace product: "${productTitle}" - "${description}". Provide 3 short insights: 1. Target audience. 2. Estimated fair market value range (USD). 3. Suggested marketing keywords. Format as JSON with keys: "target_audience", "price_range", "keywords".`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      
      let text = response.text || '';
      // Strip markdown code block around JSON if needed
      text = text.replace(/```json\\n?/g, '').replace(/```\\n?/g, '').trim();
      
      res.json(JSON.parse(text));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not generate AI insights.' });
    }
  });

  // ==== VITE MIDDLEWARE FOR DEVELOPMENT ====
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
