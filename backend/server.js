import express from 'express';
import cors from 'cors';
import { initTables } from './src/db.js';
import { authRouter } from './src/routes/auth.js';
import { linksRouter } from './src/routes/links.js';
import { startScheduler } from './src/services/scheduler.js';
import { xssSanitizer } from './src/middleware/xssSanitizer.js';

const app = express();

// 初始化数据库表
initTables();

app.use(cors());
app.use(express.json());
app.use(xssSanitizer); // 全局 XSS 清理

// 注册路由
app.use('/api/auth', authRouter);
app.use('/api/links', linksRouter);

// 启动定时任务
startScheduler();

const PORT = process.env.PORT || 3818;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));