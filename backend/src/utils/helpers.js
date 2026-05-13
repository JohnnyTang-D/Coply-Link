/**
 * 获取客户端真实IP，兼容IPv4、IPv6、代理等情况
 */
export function getClientIp(req) {
  // 优先从代理头获取
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',      // Cloudflare
    'true-client-ip',        // Akamai
    'x-client-ip',
    'x-cluster-client-ip',
  ];

  for (const header of headers) {
    const value = req.headers[header];
    if (value) {
      // x-forwarded-for 可能包含多个IP，取第一个
      const ip = value.split(',')[0].trim();
      if (ip && ip !== 'unknown') {
        return normalizeIp(ip);
      }
    }
  }

  // 从socket获取
  const remoteAddress = req.socket?.remoteAddress;
  if (remoteAddress) {
    return normalizeIp(remoteAddress);
  }

  return 'unknown';
}

/**
 * 规范化IP地址
 * - 去除IPv6映射前缀 (::ffff:)
 * - 处理localhost (::1, 127.0.0.1)
 * - 保持IPv6完整格式
 */
export function normalizeIp(ip) {
  if (!ip || ip === 'unknown') {
    return 'unknown';
  }

  // 去除IPv6映射IPv4的前缀
  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }

  // localhost统一处理
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return 'localhost';
  }

  // IPv6地址转小写，去除多余零
  if (ip.includes(':')) {
    // 简化IPv6地址格式（去除前导零等）
    try {
      const segments = ip.toLowerCase().split(':');
      // 处理 :: 简写
      const doubleColonIndex = segments.indexOf('');
      if (doubleColonIndex !== -1) {
        const left = segments.slice(0, doubleColonIndex);
        const right = segments.slice(doubleColonIndex + 1);
        const missingCount = 8 - left.length - right.length;
        const expanded = [...left, ...Array(missingCount).fill('0'), ...right];
        // 去除前导零并重新组合
        return expanded.map(s => s.replace(/^0+/, '') || '0').join(':');
      }
      return segments.map(s => s.replace(/^0+/, '') || '0').join(':');
    } catch {
      return ip.toLowerCase();
    }
  }

  return ip;
}

/**
 * 获取今日日期字符串 (YYYY-MM-DD)
 */
export function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}