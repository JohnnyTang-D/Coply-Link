import { Router } from 'express';
import { linksRepo, submissionRepo, usersRepo } from '../db.js';
import { getClientIp, getTodayDate } from '../utils/helpers.js';
import { isSafeUrl } from '../middleware/xssSanitizer.js';

export const linksRouter = Router();

// 获取所有链接
linksRouter.get('/', (req, res) => {
  res.json(linksRepo.findAll());
});

// 获取今日提交次数（fingerprint + IP 组合）
linksRouter.post('/submission-count', (req, res) => {
  const { fingerprint } = req.body;
  const ip = getClientIp(req);

  if (!fingerprint) {
    return res.status(400).json({ error: '缺少指纹标识' });
  }

  res.json({
    count: 0,
    limit: 9999,
    remaining: 9999,
  });
});

// 公共提交链接（每个用户仅限一条，新的替换旧的）
linksRouter.post('/public', (req, res) => {
  const { title, url, description, username } = req.body;

  if (!username) {
    return res.status(401).json({ success: false, error: '请先登录' });
  }

  if (!url || !isSafeUrl(url)) {
    return res.status(400).json({ success: false, error: 'URL 格式不正确或包含不安全协议' });
  }

  const user = usersRepo.findByUsername(username);
  if (!user) {
    return res.status(401).json({ success: false, error: '用户不存在' });
  }

  const link = linksRepo.upsertByUser(user.id, title, url, description);

  res.json({
    success: true,
    ...link,
  });
});

// 管理员提交链接
linksRouter.post('/admin', (req, res) => {
  const { password, title, url, description } = req.body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: '密码错误' });
  }

  if (!url || !isSafeUrl(url)) {
    return res.status(400).json({ success: false, error: 'URL 格式不正确或包含不安全协议' });
  }

  const link = linksRepo.create(title, url, description);
  res.json({ success: true, ...link });
});

// 管理台添加链接
linksRouter.post('/', (req, res) => {
  const { password, title, url, description } = req.body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: '需要管理员密码' });
  }

  if (!url || !isSafeUrl(url)) {
    return res.status(400).json({ success: false, error: 'URL 格式不正确或包含不安全协议' });
  }

  const link = linksRepo.create(title, url, description);
  res.json(link);
});

// 更新链接
linksRouter.put('/:id', (req, res) => {
  const { title, url, description } = req.body;

  if (url && !isSafeUrl(url)) {
    return res.status(400).json({ success: false, error: 'URL 格式不正确或包含不安全协议' });
  }

  res.json(linksRepo.update(req.params.id, title, url, description));
});

// 删除链接
linksRouter.delete('/:id', (req, res) => {
  res.json(linksRepo.delete(req.params.id));
});

// 点击计数
linksRouter.post('/:id/click', (req, res) => {
  res.json(linksRepo.click(req.params.id));
});