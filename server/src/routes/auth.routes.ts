import {Router} from 'express';
import bcrypt from 'bcryptjs';
import {z} from 'zod';
import {db} from '../db/connection';
import {ApiError, wrap} from '../lib/errors';
import {parseBody} from '../middleware/errors';
import {requireAuth, signToken} from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  password: z.string().min(8).max(72),
  phone: z.string().max(20).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().max(20).optional(),
});

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'customer' | 'admin';
  phone: string | null;
  created_at: string;
}

function publicUser(u: UserRow) {
  return {id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone, created_at: u.created_at};
}

router.post(
  '/register',
  wrap(async (req, res) => {
    const body = parseBody(registerSchema, req.body);
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(body.email);
    if (existing) {
      throw new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
    }
    const hash = bcrypt.hashSync(body.password, 10);
    const r = db
      .prepare('INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)')
      .run(body.name, body.email, hash, 'customer', body.phone ?? null);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(r.lastInsertRowid) as UserRow;
    res.status(201).json({token: signToken({id: user.id, role: user.role}), user: publicUser(user)});
  }),
);

router.post(
  '/login',
  wrap(async (req, res) => {
    const body = parseBody(loginSchema, req.body);
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(body.email) as UserRow | undefined;
    if (!user || !bcrypt.compareSync(body.password, user.password_hash)) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password');
    }
    res.json({token: signToken({id: user.id, role: user.role}), user: publicUser(user)});
  }),
);

router.get(
  '/me',
  requireAuth,
  wrap(async (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as UserRow | undefined;
    if (!user) throw new ApiError(404, 'USER_NOT_FOUND');
    res.json({user: publicUser(user)});
  }),
);

router.patch(
  '/me',
  requireAuth,
  wrap(async (req, res) => {
    const body = parseBody(updateSchema, req.body);
    const fields: string[] = [];
    const values: unknown[] = [];
    if (body.name !== undefined) {
      fields.push('name = ?');
      values.push(body.name);
    }
    if (body.phone !== undefined) {
      fields.push('phone = ?');
      values.push(body.phone);
    }
    if (fields.length === 0) throw new ApiError(400, 'VALIDATION', 'Nothing to update');
    values.push(req.user!.id);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as UserRow;
    res.json({user: publicUser(user)});
  }),
);

export default router;
