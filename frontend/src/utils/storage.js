const COPIED_STORAGE_KEY = 'coply-link-copied';

export function getCopiedIds() {
  try {
    const stored = localStorage.getItem(COPIED_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveCopiedIds(ids) {
  try {
    localStorage.setItem(COPIED_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage 不可用时静默失败
  }
}

export function addCopiedId(id) {
  const ids = getCopiedIds();
  if (!ids.includes(id)) {
    ids.push(id);
    saveCopiedIds(ids);
  }
}

export function clearCopiedIds() {
  try {
    localStorage.removeItem(COPIED_STORAGE_KEY);
  } catch {
    // 静默失败
  }
}