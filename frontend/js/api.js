/* ══ Lingua API Client ══════════════════════════════════════ */
const API_BASE = 'https://api.lingua.sa/v1'; // ← غيّر لعنوان الـ backend

/* ── Auth ───────────────────────────────────────────────── */
const auth = {
  getToken:   () => localStorage.getItem('lingua_token'),
  getUser:    () => JSON.parse(localStorage.getItem('lingua_user') || 'null'),
  setToken:   t  => localStorage.setItem('lingua_token', t),
  setUser:    u  => localStorage.setItem('lingua_user', JSON.stringify(u)),
  isLoggedIn: () => !!localStorage.getItem('lingua_token'),
  logout: () => {
    localStorage.removeItem('lingua_token');
    localStorage.removeItem('lingua_user');
    window.location.href = 'auth.html';
  }
};

/* ── Fetch wrapper ──────────────────────────────────────── */
async function apiFetch(path, options = {}) {
  const token = auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res  = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'خطأ في الاتصال');
  return data;
}

/* ── API methods ────────────────────────────────────────── */
const api = {
  // Auth
  register: b => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(b) }),
  login:    b => apiFetch('/auth/login',    { method: 'POST', body: JSON.stringify(b) }),
  google:   b => apiFetch('/auth/google',   { method: 'POST', body: JSON.stringify(b) }),
  me:       () => apiFetch('/auth/me'),
  webauthnLoginOptions:  b => apiFetch('/auth/webauthn/login-options',  { method: 'POST', body: JSON.stringify(b) }),
  webauthnLoginVerify:   b => apiFetch('/auth/webauthn/login-verify',   { method: 'POST', body: JSON.stringify(b) }),
  webauthnRegisterOptions: () => apiFetch('/auth/webauthn/register-options'),
  webauthnRegisterVerify:  b => apiFetch('/auth/webauthn/register-verify', { method: 'POST', body: JSON.stringify(b) }),
  // Products
  getProducts: p => apiFetch('/products?' + new URLSearchParams(p)),
  getProduct:  id => apiFetch('/products/' + id),
  addReview:  (id, b) => apiFetch('/products/' + id + '/review', { method: 'POST', body: JSON.stringify(b) }),
  // Stripe
  checkout: items => apiFetch('/stripe/checkout-session', { method: 'POST', body: JSON.stringify({ items }) }),
  refund:   oid   => apiFetch('/stripe/refund',           { method: 'POST', body: JSON.stringify({ orderId: oid }) }),
  // Dashboard
  myEnrollments:  () => apiFetch('/me/enrollments'),
  myOrders:       () => apiFetch('/me/orders'),
  myStats:        () => apiFetch('/me/stats'),
  updateProgress: (pid, p) => apiFetch('/me/enrollments/' + pid + '/progress', { method: 'PUT', body: JSON.stringify({ progress: p }) }),
  // Admin
  adminStats:  () => apiFetch('/admin/stats'),
  adminUsers:  () => apiFetch('/admin/users'),
  adminOrders: () => apiFetch('/admin/orders'),
};

/* ── Cart (localStorage) ────────────────────────────────── */
const cart = {
  get:    () => JSON.parse(localStorage.getItem('lingua_cart') || '[]'),
  save:   c  => localStorage.setItem('lingua_cart', JSON.stringify(c)),
  add:    p  => { const c = cart.get(); if (!c.find(i => i.id === p.id)) c.push(p); cart.save(c); cart.dispatch(); },
  remove: id => { cart.save(cart.get().filter(i => i.id !== id)); cart.dispatch(); },
  clear:  () => { localStorage.removeItem('lingua_cart'); cart.dispatch(); },
  total:  () => cart.get().reduce((s, i) => s + Number(i.price), 0),
  count:  () => cart.get().length,
  dispatch: () => window.dispatchEvent(new Event('cartUpdated')),
};

/* ── Toast ──────────────────────────────────────────────── */
let _toastTimer;
function showToast(msg, type = 'success') {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%) translateY(80px);background:#1E1648;color:#fff;padding:12px 22px;border-radius:30px;font-size:14px;font-weight:500;z-index:9999;transition:transform .3s;display:flex;align-items:center;gap:8px;direction:rtl;';
    el.innerHTML = '<span id="toastMsg"></span>';
    document.body.appendChild(el);
    el.style.setProperty('--show', 'translateX(-50%) translateY(0)');
    const style = document.createElement('style');
    style.textContent = '#toast.show{transform:translateX(-50%) translateY(0)!important}';
    document.head.appendChild(style);
  }
  if (type === 'error') el.style.background = '#E24B4A';
  else el.style.background = '#1E1648';
  document.getElementById('toastMsg').textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ── Auth Guard ─────────────────────────────────────────── */
function requireAuth() {
  if (!auth.isLoggedIn()) {
    window.location.href = 'auth.html?redirect=' + encodeURIComponent(window.location.pathname);
  }
}