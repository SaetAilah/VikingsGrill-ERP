export const SESSION_TOKEN_KEY = 'vikings-erp-session';

export function apiFetch(input, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...options, headers });
}
