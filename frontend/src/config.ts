// Centralized API configuration for the AI Estate Vision frontend
// Falls back to localhost in development, but allows overriding in Vercel/Production
export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
