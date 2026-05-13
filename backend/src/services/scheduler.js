import cron from 'node-cron';
import { linksRepo, submissionRepo } from '../db.js';

export function startScheduler() {
  // 清除所有链接和记录的定时任务（每天凌晨0:01执行）
  cron.schedule('1 0 * * *', () => {
    console.log('执行定时清理：清除所有URL和提交记录...');
    linksRepo.deleteAll();
    submissionRepo.deleteAll();
    console.log('定时清理完成');
  });
}