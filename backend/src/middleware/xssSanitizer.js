import xss from 'xss';

const XSS_OPTIONS = {
  whiteList: {}, // 不允许任何 HTML 标签
  stripIgnoreTag: true, // 过滤掉不在白名单中的标签
  stripIgnoreTagBody: ['script', 'style'], // 过滤 script 和 style 标签内容
};

/**
 * 清理字符串中的 XSS 内容
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return xss(str, XSS_OPTIONS);
}

/**
 * 验证 URL 是否安全（防止 javascript: 协议攻击）
 */
export function isSafeUrl(url) {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  return !dangerousProtocols.some((p) => trimmed.startsWith(p));
}

/**
 * XSS 清理中间件，自动清理请求体中的字符串字段
 */
export function xssSanitizer(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
}

/**
 * 递归清理对象中的字符串值
 */
function sanitizeObject(obj) {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string') {
      obj[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitizeObject(value);
    }
  }
}