// Server-side only (uses BACKEND_URL, which is not exposed to the browser).
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

/**
 * Fetch from Express inside Server Components. Returns `fallback` instead of
 * throwing so pages still render when the API / DB is not configured yet.
 */
export async function serverApi(path, { revalidate = 60, fallback = null } = {}) {
  try {
    const res = await fetch(`${BACKEND_URL}/api${path}`, { next: { revalidate } });
    if (!res.ok) return res.status === 404 ? null : fallback;
    return await res.json();
  } catch {
    return fallback;
  }
}
