const KEY = 'staymate_recently_viewed';

export function addRecentlyViewed(item) {
  try {
    const existing = getRecentlyViewed().filter(
      (entry) => !(entry.type === item.type && entry.id === item.id)
    );
    const next = [{ ...item, viewedAt: new Date().toISOString() }, ...existing].slice(0, 8);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage may be unavailable
  }
}

export function getRecentlyViewed() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearRecentlyViewed() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
