import FingerprintJS from '@fingerprintjs/fingerprintjs';

export const API = import.meta.env.DEV ? 'http://localhost:3818/api' : '/api';

let fpPromise = null;
let cachedFingerprint = null;

export async function getFingerprint() {
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }

  const fp = await fpPromise;
  const result = await fp.get();
  cachedFingerprint = result.visitorId;
  return cachedFingerprint;
}

export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback below
    }
  }

  if (document.execCommand) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      document.body.removeChild(textarea);
    }
  }

  const range = document.createRange();
  const span = document.createElement('span');
  span.textContent = text;
  span.style.position = 'fixed';
  span.style.left = '-9999px';
  span.style.opacity = '0';
  document.body.appendChild(span);
  range.selectNode(span);

  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);

  try {
    document.execCommand('copy');
    document.body.removeChild(span);
    selection?.removeAllRanges();
    return true;
  } catch {
    document.body.removeChild(span);
    selection?.removeAllRanges();
    return false;
  }
}

export async function requestJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`request failed: ${response.status}`);
  }
  return response.json();
}

export function buildEditForm(link) {
  return {
    title: link.title,
    url: link.url,
    description: link.description || '',
  };
}