// Lingua API Client v2
const API_BASE = 'https://api.lingua.sa/v1';
const auth = {
  getToken: ()    => localStorage.getItem('lingua_token'),
  setToken: t     => localStorage.setItem('lingua_token', t),
  getUser:  ()    => JSON.parse(localStorage.getItem('lingua_user') || 'null'),
  setUser:  u     => localStorage.setItem('lingua_user', JSON.stringify(u)),
  logout:   ()    => { localStorage.removeItem('lingua_token'); localStorage.removeItem('lingua_user'); window.location.href = '/auth.html'; },
  isLoggedIn: ()  => !!localStorage.getItem('lingua_token'),
};
async function apiFetch(path, options = {}) {
  const token = auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, { ...options, headers });
  if (res.status === 401) { auth.logout(); return; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'خطأ في الاتصال');
  return data;
}
const api = {
  register: b   => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(b) }),
  login:    b   => apiFetch('/auth/login',    { method: 'POST', body: JSON.stringify(b) }),
  google:   b   => apiFetch('/auth/google',   { method: 'POST', body: JSON.stringify(b) }),
  me:       ()  => apiFetch('/auth/me'),
  webauthnLoginOptions:  b => apiFetch('/auth/webauthn/login-options',  { method: 'POST', body: JSON.stringify(b) }),
  webauthnLoginVerify:   b => apiFetch('/auth/webauthn/login-verify',   { method: 'POST', body: JSON.stringify(b) }),
  webauthnRegisterOptions: () => apiFetch('/auth/webauthn/register-options'),
  webauthnRegisterVerify:  b => apiFetch('/auth/webauthn/register-verify', { method: 'POST', body: JSON.stringify(b) }),
  getProducts:    p => apiFetch('/products?' + new URLSearchParams(p)),
  getProduct:    id => apiFetch('/products/' + id),
  addReview:  (id,b) => apiFetch('/products/' + id + '/review', { method: 'POST', body: JSON.stringify(b) }),
  checkout:   items  => apiFetch('/stripe/checkout-session', { method: 'POST', body: JSON.stringify({ items }) }),
  refund:       oid  => apiFetch('/stripe/refund', { method: 'POST', body: JSON.stringify({ orderId: oid }) }),
  myEnrollments: ()  => apiFetch('/me/enrollments'),
  updateProgress: (pid, p) => apiFetch('/me/enrollments/' + pid + '/progress', { method: 'PUT', body: JSON.stringify({ progress: p }) }),
  myOrders:  ()  => apiFetch('/me/orders'),
  myStats:   ()  => apiFetch('/me/stats'),
  adminStats:  () => apiFetch('/admin/stats'),
  adminUsers:  () => apiFetch('/admin/users'),
  adminOrders: () => apiFetch('/admin/orders'),
};
const cart = {
  get:    () => JSON.parse(localStorage.getItem('lingua_cart') || '[]'),
  save:   c  => localStorage.setItem('lingua_cart', JSON.stringify(c)),
  add:    p  => { const c = cart.get(); if (!c.find(i => i.id === p.id)) c.push(p); cart.save(c); cart.dispatch(); },
  remove: id => { cart.save(cart.get().filter(i => i.id !== id)); cart.dispatch(); },
  clear:  () => { localStorage.removeItem('lingua_cart'); cart.dispatch(); },
  total:  () => cart.get().reduce((s, i) => s + Number(i.price), 0),
  dispatch: () => window.dispatchEvent(new Event('cartUpdated')),
};
function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:' + (type==='error'?'#E24B4A':'#1E1648') + ';color:#fff;padding:12px 22px;border-radius:30px;font-size:14px;font-weight:500;z-index:9999;direction:rtl;display:flex;align-items:center;gap:8px;';
  t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
function requireAuth() { if (!auth.isLoggedIn()) window.location.href = '/auth.html?redirect=' + encodeURIComponent(window.location.pathname); }