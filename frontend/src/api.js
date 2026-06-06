// ── API Base URL ─────────────────────────────────────────────────────────────
// In production (Vercel), set VITE_API_URL env variable to your Render backend URL
// e.g.  VITE_API_URL=https://khoistan-backend.onrender.com/api
// Locally it defaults to http://localhost:5000/api
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Robust fetch with timeout ────────────────────────────────────────────────
export async function apiFetch(path, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('TIMEOUT');
    }
    throw new Error('OFFLINE');
  }
}
