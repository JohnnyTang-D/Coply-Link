import { db, ADMIN_PASSWORD } from '../db.js';

export function authMiddleware(req, res, next) {
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: '需要管理员密码' });
  }

  next();
}