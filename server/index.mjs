import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { PRODUCTS as SEED_PRODUCTS, MOCK_ORDERS as SEED_ORDERS } from '../src/data/mockData.js';
import { BLOG_POSTS } from '../src/data/blogPosts.js';
import { WIX_BLOG_POSTS } from '../src/data/wixBlogPosts.js';
import { getWixCatalog } from './wix_catalog.mjs';
import {
  addWixCartItem,
  applyWixCartCoupon,
  clearWixCart,
  createCommerceClient,
  createVisitorCommerceSession,
  createWixCheckout,
  getAllWixOrders,
  getCurrentWixCart,
  getMemberLoyalty,
  getWixCommerceAnalytics,
  getWixMemberOrders,
  removeWixCartItem,
  removeWixCartCoupon,
  updateWixCartItem,
} from './wix_commerce.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCAL_ENV_PATH = join(__dirname, '..', '.env.local');

if (existsSync(LOCAL_ENV_PATH)) {
  for (const line of readFileSync(LOCAL_ENV_PATH, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1] in process.env) continue;
    const value = match[2].replace(/^(['"])(.*)\1$/, '$2');
    process.env[match[1]] = value;
  }
}
const STORE_SCRIPT = join(__dirname, 'sqlite_store.py');
const PRERENDER_SCRIPT = join(__dirname, '..', 'scripts', 'prerender.mjs');
const PUBLIC_DIR = join(__dirname, '..', 'public');
const PUBLIC_SITE_URL = (process.env.MIK_PUBLIC_SITE_URL || 'https://www.indianstoretaiwan.com').replace(/\/$/, '');
const PORT = Number(process.env.API_PORT || 4173);
const ADMIN_EMAIL = 'admin@mik.store';
const ADMIN_PASSWORD = 'mik2024';
const AUTH_SECRET = process.env.MIK_AUTH_SECRET || 'mik-store-auth-secret';
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE_SECURE = String(process.env.MIK_COOKIE_SECURE || '').trim() === '1';
const MAX_BODY_BYTES = Number(process.env.MIK_MAX_BODY_BYTES || 2 * 1024 * 1024);
const WIX_HEADLESS_CLIENT_ID = String(process.env.WIX_HEADLESS_CLIENT_ID || '').trim();
const WIX_HEADLESS_REDIRECT_URI = String(process.env.WIX_HEADLESS_REDIRECT_URI || '').trim();
const WIX_VISITOR_COOKIE = 'mik_wix_visitor_session';
const WIX_COMMERCE_ENABLED = String(process.env.COMMERCE_PROVIDER || 'wix').toLowerCase() === 'wix';
const ALLOWED_ORIGINS = new Set(
    String(
      process.env.MIK_ALLOWED_ORIGINS ||
      'http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:5175,http://localhost:5175,http://127.0.0.1:4173,http://localhost:4173,http://127.0.0.1:4174,http://localhost:4174',
    )
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),
);
const RATE_LIMITS = {
  public: { limit: 180, windowMs: 60 * 1000 },
  read: { limit: 240, windowMs: 60 * 1000 },
  write: { limit: 60, windowMs: 60 * 1000 },
  auth: { limit: 12, windowMs: 60 * 1000 },
  login: { limit: 5, windowMs: 10 * 60 * 1000 },
};
const DEFAULT_HERO_OFFERS = [
  {
    id: 'offer-spices',
    tag: 'Freshly Imported',
    title: 'Authentic Indian\nSpices & Masalas',
    subtitle: 'Hand-picked from India\'s finest farms',
    cta_label: 'Shop Spices',
    href: '/category/spices',
    emoji: '🌶️',
    bg_from: 'from-green-700',
    bg_to: 'to-green-900',
    accent: 'bg-white/20',
    sort_order: 0,
    active: true,
  },
  {
    id: 'offer-ready-to-eat',
    tag: 'Ready in Minutes',
    title: 'Taste of Home\nReady-to-Eat Meals',
    subtitle: 'MTR, Haldirams & more - just heat and serve',
    cta_label: 'Shop Ready To Eat',
    href: '/category/ready-to-eat',
    emoji: '🥘',
    bg_from: 'from-orange-500',
    bg_to: 'to-red-600',
    accent: 'bg-white/20',
    sort_order: 1,
    active: true,
  },
  {
    id: 'offer-delivery',
    tag: 'Limited Time',
    title: 'Free Delivery\non Orders Over NT$4,000',
    subtitle: 'Shop more and enjoy delivery across Taiwan',
    cta_label: 'Shop Now',
    href: '/',
    emoji: '🚚',
    bg_from: 'from-teal-600',
    bg_to: 'to-cyan-700',
    accent: 'bg-white/20',
    sort_order: 2,
    active: true,
  },
];
const rateLimitBuckets = new Map();
const loginFailureBuckets = new Map();

function isUnsafeMethod(method) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(String(method || '').toUpperCase());
}

function parseCookies(req) {
  const header = String(req.headers.cookie || '');
  if (!header) return {};
  return header.split(';').reduce((acc, pair) => {
    const index = pair.indexOf('=');
    if (index < 0) return acc;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (key) acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function authCookieNames(scope) {
  return scope === 'customer'
    ? {
        access: 'mik_customer_access_token',
        refresh: 'mik_customer_refresh_token',
      }
    : {
        access: 'mik_admin_access_token',
        refresh: 'mik_admin_refresh_token',
      };
}

function csrfCookieName(scope) {
  return scope === 'customer' ? 'mik_customer_csrf_token' : 'mik_admin_csrf_token';
}

function cookieAttributes(maxAgeSeconds) {
  const parts = [
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
  ];
  if (COOKIE_SECURE) parts.push('Secure');
  if (Number.isFinite(maxAgeSeconds)) parts.push(`Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`);
  return parts.join('; ');
}

function setAuthCookies(res, scope, { accessToken, refreshToken, csrfToken, accessTtlMs, refreshTtlMs, csrfTtlMs }) {
  const names = authCookieNames(scope);
  const csrfName = csrfCookieName(scope);
  const cookies = [];
  if (accessToken) {
    cookies.push(`${names.access}=${encodeURIComponent(accessToken)}; ${cookieAttributes(accessTtlMs / 1000)}`);
  }
  if (refreshToken) {
    cookies.push(`${names.refresh}=${encodeURIComponent(refreshToken)}; ${cookieAttributes(refreshTtlMs / 1000)}`);
  }
  if (csrfToken) {
    const attrs = [
      'Path=/',
      'SameSite=Lax',
    ];
    if (COOKIE_SECURE) attrs.push('Secure');
    if (Number.isFinite(csrfTtlMs)) attrs.push(`Max-Age=${Math.max(0, Math.floor(csrfTtlMs / 1000))}`);
    cookies.push(`${csrfName}=${encodeURIComponent(csrfToken)}; ${attrs.join('; ')}`);
  }
  if (cookies.length > 0) {
    res.setHeader('Set-Cookie', cookies);
  }
}

function clearAuthCookies(res, scope) {
  const names = authCookieNames(scope);
  const csrfName = csrfCookieName(scope);
  const cookies = [
    `${names.access}=; Path=/; HttpOnly; SameSite=Lax${COOKIE_SECURE ? '; Secure' : ''}; Max-Age=0`,
    `${names.refresh}=; Path=/; HttpOnly; SameSite=Lax${COOKIE_SECURE ? '; Secure' : ''}; Max-Age=0`,
    `${csrfName}=; Path=/; SameSite=Lax${COOKIE_SECURE ? '; Secure' : ''}; Max-Age=0`,
  ];
  res.setHeader('Set-Cookie', cookies);
}

function appendCookie(res, cookie) {
  const existing = res.getHeader('Set-Cookie');
  const cookies = Array.isArray(existing) ? existing : existing ? [existing] : [];
  res.setHeader('Set-Cookie', [...cookies, cookie]);
}

function setVisitorSessionCookie(res, sid) {
  appendCookie(res, `${WIX_VISITOR_COOKIE}=${encodeURIComponent(signToken({ sid, type: 'wix_visitor', exp: Date.now() + REFRESH_TOKEN_TTL_MS }))}; ${cookieAttributes(REFRESH_TOKEN_TTL_MS / 1000)}`);
}

function getTokenFromRequest(req, scope, kind = 'access') {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  const cookies = parseCookies(req);
  const names = authCookieNames(scope);
  return cookies[kind === 'refresh' ? names.refresh : names.access] || '';
}

function getCsrfTokenFromRequest(req, scope) {
  const headerToken = String(req.headers['x-csrf-token'] || '').trim();
  const cookies = parseCookies(req);
  const cookieToken = cookies[csrfCookieName(scope)] || '';
  return { headerToken, cookieToken };
}

function verifyCsrfRequest(req, res, scope, authPayload) {
  const { headerToken, cookieToken } = getCsrfTokenFromRequest(req, scope);
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    sendJson(res, 403, { error: 'Invalid CSRF token' });
    return null;
  }
  const payload = verifyToken(headerToken);
  if (!payload || payload.type !== 'csrf' || payload.sid !== authPayload?.sid || payload.scope !== scope) {
    sendJson(res, 403, { error: 'Invalid CSRF token' });
    return null;
  }
  return payload;
}

function requireCsrfForAuthRequest(req, res, scope, authPayload) {
  if (!isUnsafeMethod(req.method)) return true;
  return Boolean(verifyCsrfRequest(req, res, scope, authPayload));
}

function getClientIp(req) {
  const forwardedFor = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  if (forwardedFor) return forwardedFor;
  return (
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    'unknown'
  );
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') return false;
  try {
    const parsed = new URL(origin);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      ['localhost', '127.0.0.1', '[::1]', '::1'].includes(parsed.hostname)
    );
  } catch {
    return false;
  }
}

function getRateLimitPolicy(pathname, method) {
  if (pathname === '/api/admin/login' || pathname === '/api/customer/wix/start') {
    return { ...RATE_LIMITS.login, key: 'login' };
  }
  if (
    pathname === '/api/admin/refresh' ||
    pathname === '/api/admin/logout' ||
    pathname === '/api/customer/refresh' ||
    pathname === '/api/customer/logout'
  ) {
    return { ...RATE_LIMITS.auth, key: 'auth' };
  }
  if (pathname === '/api/health') return { ...RATE_LIMITS.public, key: 'public' };
  if (pathname.startsWith('/api/') && isUnsafeMethod(method)) return { ...RATE_LIMITS.write, key: 'write' };
  if (pathname.startsWith('/api/')) return { ...RATE_LIMITS.read, key: 'read' };
  return null;
}

function checkRateLimit(bucketKey, limit, windowMs) {
  const now = Date.now();
  const existing = rateLimitBuckets.get(bucketKey) || [];
  const windowStart = now - windowMs;
  const recent = existing.filter(timestamp => timestamp > windowStart);
  if (recent.length >= limit) {
    rateLimitBuckets.set(bucketKey, recent);
    const retryAfterMs = windowMs - (now - recent[0]);
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }
  recent.push(now);
  rateLimitBuckets.set(bucketKey, recent);
  return { allowed: true };
}

function recordLoginFailure(bucketKey) {
  const now = Date.now();
  const existing = loginFailureBuckets.get(bucketKey) || [];
  const windowMs = RATE_LIMITS.login.windowMs;
  const windowStart = now - windowMs;
  const recent = existing.filter(timestamp => timestamp > windowStart);
  recent.push(now);
  loginFailureBuckets.set(bucketKey, recent);
  return recent.length;
}

function clearLoginFailures(bucketKey) {
  loginFailureBuckets.delete(bucketKey);
}

function shouldBlockLogin(bucketKey) {
  const now = Date.now();
  const existing = loginFailureBuckets.get(bucketKey) || [];
  const windowMs = RATE_LIMITS.login.windowMs;
  const windowStart = now - windowMs;
  const recent = existing.filter(timestamp => timestamp > windowStart);
  if (recent.length < RATE_LIMITS.login.limit) {
    loginFailureBuckets.set(bucketKey, recent);
    return { blocked: false };
  }
  const retryAfterMs = windowMs - (now - recent[0]);
  loginFailureBuckets.set(bucketKey, recent);
  return {
    blocked: true,
    retryAfter: Math.max(1, Math.ceil(retryAfterMs / 1000)),
  };
}

function applyResponseHeaders(req, res) {
  const origin = String(req.headers.origin || '').trim();
  const allowedOrigin = isAllowedOrigin(origin) ? origin : null;
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Cache-Control': 'no-store',
    Pragma: 'no-cache',
    Expires: '0',
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token',
    'Access-Control-Max-Age': '600',
  };
  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(payload));
}

function toBase64Url(buffer) {
  return Buffer.from(buffer).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function wixJson(url, body, authorization = '') {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || payload.error || `Wix authentication failed (${response.status})`);
  return payload;
}

async function startWixMemberLogin(visitorAccessToken = '') {
  if (!WIX_HEADLESS_CLIENT_ID || !WIX_HEADLESS_REDIRECT_URI) throw new Error('Wix Headless authentication is not configured');
  const codeVerifier = toBase64Url(randomBytes(48));
  const state = toBase64Url(randomBytes(32));
  const codeChallenge = toBase64Url(createHash('sha256').update(codeVerifier).digest());
  const visitor = visitorAccessToken
    ? { access_token: visitorAccessToken }
    : await wixJson('https://www.wixapis.com/oauth2/token', { clientId: WIX_HEADLESS_CLIENT_ID, grantType: 'anonymous' });
  const redirect = await wixJson('https://www.wixapis.com/_api/redirects-api/v1/redirect-session', {
    auth: { authRequest: { redirectUri: WIX_HEADLESS_REDIRECT_URI, clientId: WIX_HEADLESS_CLIENT_ID, codeChallenge, codeChallengeMethod: 'S256', responseMode: 'fragment', responseType: 'code', scope: 'offline_access', state } },
  }, `Bearer ${visitor.access_token}`);
  saveWixSession(state, 'auth_request', { codeVerifier }, Date.now() + 10 * 60 * 1000);
  return { state, url: redirect.redirectSession?.fullUrl };
}

async function finishWixMemberLogin({ code, state }) {
  const pending = loadWixSession(state, 'auth_request');
  deleteWixSession(state);
  if (!pending) throw new Error('Wix login expired. Please try again.');
  return wixJson('https://www.wixapis.com/oauth2/token', { clientId: WIX_HEADLESS_CLIENT_ID, grantType: 'authorization_code', redirectUri: WIX_HEADLESS_REDIRECT_URI, code, codeVerifier: pending.codeVerifier });
}

async function getWixMember(accessToken) {
  const response = await fetch('https://www.wixapis.com/members/v1/members/my', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.member?.id) {
    throw new Error(payload.message || 'Wix connected the account but did not return a member profile.');
  }
  return payload.member;
}

function wixCustomerFromMember(member) {
  const profile = member.profile || {};
  const contact = member.contactDetails || {};
  const name = profile.nickname || [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'MIK Member';
  const email = member.loginEmail || contact.email || contact.emails?.[0] || '';
  return {
    id: `wix-${member.id}`,
    wix_member_id: member.id,
    name,
    email,
    phone: contact.phone || contact.phones?.[0] || '',
    address: '',
    avatar_url: profile.photo?.url || profile.photo?.image?.url || '',
    points: 0,
  };
}

function issueWixCustomerSession(res, member, tokens) {
  const customer = wixCustomerFromMember(member);
  const sid = `wix-csess-${randomUUID()}`;
  const accessExp = Date.now() + ACCESS_TOKEN_TTL_MS;
  const refreshExp = Date.now() + REFRESH_TOKEN_TTL_MS;
  const accessToken = signToken({ sid, customer_id: customer.id, email: customer.email, type: 'wix_customer_access', exp: accessExp });
  const refreshToken = signToken({ sid, customer_id: customer.id, email: customer.email, type: 'wix_customer_refresh', exp: refreshExp });
  saveWixSession(sid, 'member', { customer, tokens }, refreshExp);
  const { token: csrfToken, csrfTtlMs } = issueCsrfToken('customer', sid);
  setAuthCookies(res, 'customer', {
    accessToken,
    refreshToken,
    csrfToken,
    accessTtlMs: ACCESS_TOKEN_TTL_MS,
    refreshTtlMs: REFRESH_TOKEN_TTL_MS,
    csrfTtlMs,
  });
  return { customer, tokens, accessToken, refreshToken, expiresAt: new Date(accessExp).toISOString() };
}

function getWixCustomerSession(req, res, kind = 'access') {
  const token = getTokenFromRequest(req, 'customer', kind);
  const payload = verifyToken(token);
  const expectedType = kind === 'refresh' ? 'wix_customer_refresh' : 'wix_customer_access';
  if (!payload || payload.type !== expectedType) return null;
  const session = loadWixSession(payload.sid, 'member');
  if (!session) return null;
  if (isUnsafeMethod(req.method) && !verifyCsrfRequest(req, res, 'customer', payload)) return null;
  return { payload, session };
}

async function getWixCommerceSession(req, res) {
  const member = getWixCustomerSession(req, res);
  if (member) {
    const client = createCommerceClient({
      clientId: WIX_HEADLESS_CLIENT_ID,
      tokens: member.session.tokens,
      onTokens: tokens => {
        member.session.tokens = tokens;
        saveWixSession(member.payload.sid, 'member', member.session, member.session.expiresAt);
      },
    });
    return { client, member: member.session.customer, tokens: member.session.tokens, type: 'member' };
  }

  const cookie = parseCookies(req)[WIX_VISITOR_COOKIE];
  const payload = verifyToken(cookie);
  let sid = payload?.type === 'wix_visitor' ? payload.sid : '';
  let session = sid ? loadWixSession(sid, 'visitor') : null;
  if (!session) {
    sid = `wix-vsess-${randomUUID()}`;
    session = { tokens: await createVisitorCommerceSession(WIX_HEADLESS_CLIENT_ID), expiresAt: Date.now() + REFRESH_TOKEN_TTL_MS };
    saveWixSession(sid, 'visitor', session, session.expiresAt);
    setVisitorSessionCookie(res, sid);
  }
  const client = createCommerceClient({
    clientId: WIX_HEADLESS_CLIENT_ID,
    tokens: session.tokens,
    onTokens: tokens => {
      session.tokens = tokens;
      saveWixSession(sid, 'visitor', session, session.expiresAt);
    },
  });
  return { client, member: null, tokens: session.tokens, type: 'visitor' };
}

function wixAccessToken(tokens) {
  return tokens?.accessToken?.value || tokens?.access_token || '';
}

function readBody(req, maxBytes = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let settled = false;
    const fail = error => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    req.on('data', chunk => chunks.push(chunk));
    req.on('data', chunk => {
      total += chunk.length;
      if (total > maxBytes) {
        const err = new Error('Request body too large');
        err.statusCode = 413;
        fail(err);
        req.destroy();
      }
    });
    req.on('end', () => {
      if (settled) return;
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        const err = new Error('Invalid JSON body');
        err.statusCode = 400;
        fail(err);
      }
    });
    req.on('error', fail);
  });
}

function callStore(action, payload = {}) {
  const result = spawnSync('python3', [STORE_SCRIPT], {
    input: JSON.stringify({ action, payload }),
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });

  if (result.error) throw result.error;

  const stdout = (result.stdout || '').trim();
  const stderr = (result.stderr || '').trim();
  if (stderr) {
    console.error(stderr);
  }

  if (!stdout) {
    throw new Error(`Store helper returned no output for action ${action}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new Error(`Invalid store output for action ${action}: ${stdout}`);
  }

  if (!parsed.ok) {
    const error = new Error(parsed.error || `Store action ${action} failed`);
    error.statusCode = parsed.statusCode || 500;
    error.payload = parsed;
    throw error;
  }

  return parsed.result;
}

const WIX_SESSION_KEY = createHash('sha256').update(AUTH_SECRET).digest();

function encryptWixSession(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', WIX_SESSION_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ciphertext.toString('base64url')}`;
}

function decryptWixSession(value) {
  const [iv, tag, ciphertext] = String(value || '').split('.');
  if (!iv || !tag || !ciphertext) return null;
  try {
    const decipher = createDecipheriv('aes-256-gcm', WIX_SESSION_KEY, Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return JSON.parse(Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64url')),
      decipher.final(),
    ]).toString('utf8'));
  } catch {
    return null;
  }
}

function saveWixSession(sid, kind, value, expiresAt) {
  callStore('save_wix_session', {
    sid,
    kind,
    payload: encryptWixSession({ ...value, expiresAt }),
    expires_at: new Date(expiresAt).toISOString(),
  });
}

function loadWixSession(sid, kind) {
  const row = callStore('get_wix_session', { sid, kind });
  return row ? decryptWixSession(row.payload) : null;
}

function deleteWixSession(sid) {
  callStore('delete_wix_session', { sid });
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload?.sid || !payload?.exp || payload.exp < Date.now()) return null;
    if (!['csrf', 'wix_visitor'].includes(payload.type) && !payload?.email) return null;
    return payload;
  } catch {
    return null;
  }
}

function requireAdmin(req, res) {
  const token = getTokenFromRequest(req, 'admin', 'access');
  const payload = verifyToken(token);
  if (!payload) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return null;
  }

  const session = callStore('validate_session', { sid: payload.sid });
  if (!session?.active || session.admin_email !== payload.email) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return null;
  }

  if (!requireCsrfForAuthRequest(req, res, 'admin', payload)) {
    return null;
  }

  return payload;
}

function requireCustomer(req, res) {
  const token = getTokenFromRequest(req, 'customer', 'access');
  const payload = verifyToken(token);
  if (!payload || payload.type !== 'customer_access') {
    sendJson(res, 401, { error: 'Unauthorized' });
    return null;
  }

  const session = callStore('validate_customer_session', { sid: payload.sid });
  if (!session?.active || session.customer_id !== payload.customer_id) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return null;
  }

  if (!requireCsrfForAuthRequest(req, res, 'customer', payload)) {
    return null;
  }

  return payload;
}

function maybeCustomer(req, res) {
  const token = getTokenFromRequest(req, 'customer', 'access');
  const payload = verifyToken(token);
  if (!payload || payload.type !== 'customer_access') return null;
  const session = callStore('validate_customer_session', { sid: payload.sid });
  if (!session?.active || session.customer_id !== payload.customer_id) return null;
  if (isUnsafeMethod(req.method) && !verifyCsrfRequest(req, res, 'customer', payload)) return null;
  return payload;
}

function buildCustomerRewards(customer) {
  const points = Number(customer?.points || 0);
  const remainder = points % 100;
  return {
    points,
    can_redeem_100: points >= 100,
    next_reward_at: remainder === 0 ? 100 : 100 - remainder,
    reward_value_percent: 10,
  };
}

async function verifyGoogleCredential(credential) {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || 'Google sign-in verification failed');
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  if (clientId && payload.aud !== clientId) {
    throw new Error('Google token audience mismatch');
  }

  if (payload.email_verified !== 'true' && payload.email_verified !== true) {
    throw new Error('Google email not verified');
  }

  return payload;
}

async function ensureSeeded() {
  callStore('seed', {
    seed: {
      products: SEED_PRODUCTS,
      orders: SEED_ORDERS,
      admin: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    },
  });
  callStore('seed_offers', { offers: DEFAULT_HERO_OFFERS });
  if (!process.env.VERCEL) await syncSeoArtifacts();
}

function currentTimeBody() {
  return { server_time: new Date().toISOString() };
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function syncSeoArtifacts() {
  try {
    mkdirSync(PUBLIC_DIR, { recursive: true });
    const products = WIX_COMMERCE_ENABLED
      ? (await getWixCatalog()).products
      : (callStore('list_products') || []);
    const urls = [
      `${PUBLIC_SITE_URL}/`,
      `${PUBLIC_SITE_URL}/categories`,
      `${PUBLIC_SITE_URL}/blog`,
    ];
    for (const product of products) {
      const slug = String(product.seo_slug || product.name_en || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const legacyPath = String(product.legacy_path || `/product-page/${slug || product.id}`);
      urls.push(`${PUBLIC_SITE_URL}${legacyPath.startsWith('/') ? legacyPath : `/${legacyPath}`}`);
    }
    for (const post of BLOG_POSTS) {
      urls.push(`${PUBLIC_SITE_URL}/blog/${encodeURIComponent(post.slug)}`);
    }
    for (const post of WIX_BLOG_POSTS) {
      urls.push(new URL(post.path, `${PUBLIC_SITE_URL}/`).href);
    }
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map(url => `  <url><loc>${escapeXml(url)}</loc><changefreq>weekly</changefreq><priority>${url.includes('/product-page/') ? '0.8' : '0.9'}</priority></url>`).join('\n') +
      `\n</urlset>\n`;
    writeFileSync(join(PUBLIC_DIR, 'sitemap.xml'), sitemap, 'utf8');
    writeFileSync(
      join(PUBLIC_DIR, 'robots.txt'),
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /checkout\nDisallow: /account\nSitemap: ${PUBLIC_SITE_URL}/sitemap.xml\n`,
      'utf8',
    );
    const prerender = spawnSync('node', [PRERENDER_SCRIPT], {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
    if (prerender.error) {
      throw prerender.error;
    }
    if (prerender.stderr?.trim()) {
      console.warn(prerender.stderr.trim());
    }
  } catch (error) {
    console.warn('Failed to sync SEO artifacts:', error.message || error);
  }
}

function issueCsrfToken(scope, sid) {
  const csrfTtlMs = REFRESH_TOKEN_TTL_MS;
  const token = signToken({
    sid,
    scope,
    type: 'csrf',
    exp: Date.now() + csrfTtlMs,
  });
  return { token, csrfTtlMs };
}

async function handleAdminLogin(req, res) {
  const body = await readBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const loginBucketKey = `${getClientIp(req)}:${email || 'unknown'}`;
  const loginBlock = shouldBlockLogin(loginBucketKey);
  if (loginBlock.blocked) {
    res.setHeader('Retry-After', String(loginBlock.retryAfter));
    sendJson(res, 429, { error: 'Too many failed login attempts. Please wait and try again.' });
    return;
  }
  const verified = callStore('verify_admin', { email, password });

  if (!verified?.ok) {
    const attempts = recordLoginFailure(loginBucketKey);
    if (attempts >= RATE_LIMITS.login.limit) {
      res.setHeader('Retry-After', String(RATE_LIMITS.login.windowMs / 1000));
      sendJson(res, 429, { error: 'Too many failed login attempts. Please wait and try again.' });
      return;
    }
    sendJson(res, 401, { error: 'Invalid email or password' });
    return;
  }

  clearLoginFailures(loginBucketKey);

  const sessionId = `sess-${randomUUID()}`;
  const refreshExp = Date.now() + REFRESH_TOKEN_TTL_MS;
  const accessExp = Date.now() + ACCESS_TOKEN_TTL_MS;
  const refreshToken = signToken({
    sid: sessionId,
    email: verified.admin.email,
    type: 'refresh',
    exp: refreshExp,
  });

  callStore('create_session', {
    sid: sessionId,
    admin_email: verified.admin.email,
    refresh_token: refreshToken,
    refresh_expires_at: new Date(refreshExp).toISOString(),
  });

  const accessToken = signToken({
    sid: sessionId,
    email: verified.admin.email,
    type: 'access',
    exp: accessExp,
  });
  const { token: csrfToken, csrfTtlMs } = issueCsrfToken('admin', sessionId);

  setAuthCookies(res, 'admin', {
    accessToken,
    refreshToken,
    csrfToken,
    accessTtlMs: ACCESS_TOKEN_TTL_MS,
    refreshTtlMs: REFRESH_TOKEN_TTL_MS,
    csrfTtlMs,
  });

  sendJson(res, 200, {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: new Date(accessExp).toISOString(),
    admin: { email: verified.admin.email },
  });
}

async function handleAdminRefresh(req, res) {
  const body = await readBody(req);
  const refreshToken = String(body.refresh_token || getTokenFromRequest(req, 'admin', 'refresh') || '').trim();
  const payload = verifyToken(refreshToken);
  if (!payload || payload.type !== 'refresh') {
    sendJson(res, 401, { error: 'Unauthorized' });
    return;
  }
  if (!verifyCsrfRequest(req, res, 'admin', payload)) return;

  const session = callStore('validate_refresh_session', {
    sid: payload.sid,
    refresh_token: refreshToken,
  });
  if (!session?.active) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return;
  }

  const accessExp = Date.now() + ACCESS_TOKEN_TTL_MS;
  const accessToken = signToken({
    sid: payload.sid,
    email: payload.email,
    type: 'access',
    exp: accessExp,
  });
  const { token: csrfToken, csrfTtlMs } = issueCsrfToken('admin', payload.sid);

  setAuthCookies(res, 'admin', {
    accessToken,
    refreshToken,
    csrfToken,
    accessTtlMs: ACCESS_TOKEN_TTL_MS,
    refreshTtlMs: REFRESH_TOKEN_TTL_MS,
    csrfTtlMs,
  });

  sendJson(res, 200, {
    access_token: accessToken,
    expires_at: new Date(accessExp).toISOString(),
    admin: { email: payload.email },
  });
}

async function handleAdminLogout(req, res) {
  const body = await readBody(req);
  const refreshToken = String(body.refresh_token || getTokenFromRequest(req, 'admin', 'refresh') || '').trim();
  const payload = verifyToken(refreshToken);
  if (payload && !verifyCsrfRequest(req, res, 'admin', payload)) return;
  if (payload?.sid) {
    callStore('revoke_session', { sid: payload.sid });
  }
  clearAuthCookies(res, 'admin');
  sendJson(res, 200, { ok: true });
}

async function handleCustomerLogin(req, res) {
  const body = await readBody(req);
  const credential = String(body.credential || '').trim();
  if (!credential) {
    sendJson(res, 400, { error: 'Google credential is required' });
    return;
  }

  const googleProfile = await verifyGoogleCredential(credential);
  const customer = callStore('upsert_customer_from_google', { google_profile: googleProfile });
  const sessionId = `csess-${randomUUID()}`;
  const refreshExp = Date.now() + REFRESH_TOKEN_TTL_MS;
  const accessExp = Date.now() + ACCESS_TOKEN_TTL_MS;
  const refreshToken = signToken({
    sid: sessionId,
    customer_id: customer.id,
    email: customer.email,
    type: 'customer_refresh',
    exp: refreshExp,
  });

  callStore('create_customer_session', {
    sid: sessionId,
    customer_id: customer.id,
    refresh_token: refreshToken,
    refresh_expires_at: new Date(refreshExp).toISOString(),
  });

  const accessToken = signToken({
    sid: sessionId,
    customer_id: customer.id,
    email: customer.email,
    type: 'customer_access',
    exp: accessExp,
  });
  const { token: csrfToken, csrfTtlMs } = issueCsrfToken('customer', sessionId);

  setAuthCookies(res, 'customer', {
    accessToken,
    refreshToken,
    csrfToken,
    accessTtlMs: ACCESS_TOKEN_TTL_MS,
    refreshTtlMs: REFRESH_TOKEN_TTL_MS,
    csrfTtlMs,
  });

  sendJson(res, 200, {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: new Date(accessExp).toISOString(),
    ...getCustomerPayload(customer.id),
  });
}

async function handleCustomerRefresh(req, res) {
  const body = await readBody(req);
  const refreshToken = String(body.refresh_token || getTokenFromRequest(req, 'customer', 'refresh') || '').trim();
  const payload = verifyToken(refreshToken);
  if (payload?.type === 'wix_customer_refresh') {
    if (!verifyCsrfRequest(req, res, 'customer', payload)) return;
    const session = loadWixSession(payload.sid, 'member');
    if (!session) {
      sendJson(res, 401, { error: 'Unauthorized' });
      return;
    }
    const accessExp = Date.now() + ACCESS_TOKEN_TTL_MS;
    const accessToken = signToken({
      sid: payload.sid,
      customer_id: session.customer.id,
      email: session.customer.email,
      type: 'wix_customer_access',
      exp: accessExp,
    });
    const { token: csrfToken, csrfTtlMs } = issueCsrfToken('customer', payload.sid);
    setAuthCookies(res, 'customer', {
      accessToken,
      refreshToken,
      csrfToken,
      accessTtlMs: ACCESS_TOKEN_TTL_MS,
      refreshTtlMs: Math.max(0, session.expiresAt - Date.now()),
      csrfTtlMs,
    });
    sendJson(res, 200, { access_token: accessToken, expires_at: new Date(accessExp).toISOString(), ...await getWixCustomerPayload(session.customer, session.tokens) });
    return;
  }
  if (!payload || payload.type !== 'customer_refresh') {
    sendJson(res, 401, { error: 'Unauthorized' });
    return;
  }
  if (!verifyCsrfRequest(req, res, 'customer', payload)) return;

  const session = callStore('validate_customer_refresh_session', {
    sid: payload.sid,
    refresh_token: refreshToken,
  });
  if (!session?.active) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return;
  }

  const customer = callStore('get_customer', { customer_id: session.customer_id });
  const accessExp = Date.now() + ACCESS_TOKEN_TTL_MS;
  const accessToken = signToken({
    sid: payload.sid,
    customer_id: session.customer_id,
    email: customer.email,
    type: 'customer_access',
    exp: accessExp,
  });
  const { token: csrfToken, csrfTtlMs } = issueCsrfToken('customer', payload.sid);

  setAuthCookies(res, 'customer', {
    accessToken,
    refreshToken,
    csrfToken,
    accessTtlMs: ACCESS_TOKEN_TTL_MS,
    refreshTtlMs: REFRESH_TOKEN_TTL_MS,
    csrfTtlMs,
  });

  sendJson(res, 200, {
    access_token: accessToken,
    expires_at: new Date(accessExp).toISOString(),
    ...getCustomerPayload(customer.id),
  });
}

async function handleCustomerLogout(req, res) {
  const body = await readBody(req);
  const refreshToken = String(body.refresh_token || getTokenFromRequest(req, 'customer', 'refresh') || '').trim();
  const payload = verifyToken(refreshToken);
  if (payload && !verifyCsrfRequest(req, res, 'customer', payload)) return;
  if (payload?.type === 'wix_customer_refresh') {
    deleteWixSession(payload.sid);
    clearAuthCookies(res, 'customer');
    sendJson(res, 200, { ok: true });
    return;
  }
  if (payload?.sid) {
    callStore('revoke_customer_session', { sid: payload.sid });
  }
  clearAuthCookies(res, 'customer');
  sendJson(res, 200, { ok: true });
}

function getCustomerPayload(customerId) {
  const customer = callStore('get_customer', { customer_id: customerId });
  const orders = callStore('get_customer_orders', { customer_id: customerId });
  const cart = callStore('get_customer_cart', { customer_id: customerId });
  return {
    customer: {
      ...customer,
      rewards: buildCustomerRewards(customer),
    },
    orders,
    cart,
  };
}

async function getWixCustomerPayload(customer, tokens) {
  const client = createCommerceClient({ clientId: WIX_HEADLESS_CLIENT_ID, tokens });
  const [orders, cart, loyalty] = await Promise.all([
    getWixMemberOrders(customer.wix_member_id),
    getCurrentWixCart(client),
    getMemberLoyalty(client),
  ]);
  return {
    customer: {
      ...customer,
      points: loyalty.points,
      rewards: {
        points: loyalty.points,
        reward_available: loyalty.reward_available,
        source: 'wix-loyalty',
      },
    },
    orders,
    cart: cart.items,
  };
}

function enforceRequestGuards(req, res, pathname) {
  applyResponseHeaders(req, res);

  const origin = String(req.headers.origin || '').trim();
  if (origin && !isAllowedOrigin(origin) && isUnsafeMethod(req.method)) {
    sendJson(res, 403, { error: 'Origin not allowed' });
    return false;
  }

  if (isUnsafeMethod(req.method)) {
    const contentType = String(req.headers['content-type'] || '').toLowerCase();
    if (!contentType.includes('application/json')) {
      sendJson(res, 415, { error: 'Content-Type must be application/json' });
      return false;
    }
  }

  const policy = getRateLimitPolicy(pathname, req.method);
  if (policy) {
    const bucketKey = `${policy.key}:${getClientIp(req)}`;
    const result = checkRateLimit(bucketKey, policy.limit, policy.windowMs);
    if (!result.allowed) {
      res.setHeader('Retry-After', String(result.retryAfter));
      sendJson(res, 429, { error: 'Too many requests. Please slow down.' });
      return false;
    }
  }

  return true;
}

export async function handleRequest(req, res) {
  applyResponseHeaders(req, res);

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const { pathname } = url;

  if (!enforceRequestGuards(req, res, pathname)) {
    return;
  }

  try {
    if (req.method === 'GET' && pathname === '/api/health') {
      sendJson(res, 200, { ok: true, ...currentTimeBody() });
      return;
    }

    if (req.method === 'GET' && pathname === '/') {
      sendJson(res, 200, {
        ok: true,
        service: 'MIK API',
        message: 'This server provides the backend API for the storefront.',
        health: '/api/health',
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/bootstrap') {
      if (process.env.VERCEL) {
        const catalog = await getWixCatalog();
        sendJson(res, 200, {
          products: catalog.products,
          orders: [],
          coupons: [],
          offers: DEFAULT_HERO_OFFERS,
          catalog: { ...catalog, products: undefined },
        });
        return;
      }
      const localData = callStore('bootstrap');
      const { orders: _orders, coupons: _coupons, ...nonCommerceData } = localData;
      try {
        const catalog = await getWixCatalog();
        sendJson(res, 200, { ...nonCommerceData, products: catalog.products, catalog: { ...catalog, products: undefined } });
      } catch (error) {
        console.warn(`Wix catalog unavailable: ${error.message}`);
        if (WIX_COMMERCE_ENABLED) throw new Error('Wix catalog is temporarily unavailable');
        sendJson(res, 200, { ...nonCommerceData, catalog: { source: 'sqlite-development', product_count: localData.products?.length || 0 } });
      }
      return;
    }

    if (req.method === 'GET' && pathname === '/api/products') {
      try {
        const catalog = await getWixCatalog();
        sendJson(res, 200, catalog.products);
      } catch (error) {
        if (WIX_COMMERCE_ENABLED) throw new Error('Wix catalog is temporarily unavailable');
        sendJson(res, 200, callStore('list_products'));
      }
      return;
    }

    if (req.method === 'GET' && pathname === '/api/orders') {
      const payload = requireAdmin(req, res);
      if (!payload) return;
      sendJson(res, 200, WIX_COMMERCE_ENABLED ? await getAllWixOrders() : callStore('list_orders'));
      return;
    }

    if (req.method === 'GET' && pathname === '/api/offers') {
      sendJson(res, 200, process.env.VERCEL ? DEFAULT_HERO_OFFERS : callStore('list_offers'));
      return;
    }

    if (req.method === 'POST' && pathname === '/api/admin/login') {
      await handleAdminLogin(req, res);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/admin/refresh') {
      await handleAdminRefresh(req, res);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/admin/logout') {
      await handleAdminLogout(req, res);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/customer/wix/start') {
      const commerce = await getWixCommerceSession(req, res);
      sendJson(res, 200, await startWixMemberLogin(wixAccessToken(commerce.tokens)));
      return;
    }

    if (req.method === 'POST' && pathname === '/api/customer/wix/callback') {
      const body = await readBody(req);
      const tokens = await finishWixMemberLogin({ code: String(body.code || ''), state: String(body.state || '') });
      const member = await getWixMember(tokens.access_token);
      const session = issueWixCustomerSession(res, member, tokens);
      sendJson(res, 200, { ok: true, expires_at: session.expiresAt, ...await getWixCustomerPayload(session.customer, session.tokens) });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/customer/refresh') {
      await handleCustomerRefresh(req, res);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/customer/logout') {
      await handleCustomerLogout(req, res);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/admin/me') {
      const payload = requireAdmin(req, res);
      if (!payload) return;
      sendJson(res, 200, { admin: { email: payload.email } });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/customer/me') {
      const wixSession = getWixCustomerSession(req, res);
      if (wixSession) {
        sendJson(res, 200, await getWixCustomerPayload(wixSession.session.customer, wixSession.session.tokens));
        return;
      }
      if (WIX_COMMERCE_ENABLED) {
        sendJson(res, 401, { error: 'Sign in with Wix to access your account' });
        return;
      }
      const payload = requireCustomer(req, res);
      if (!payload) return;
      sendJson(res, 200, getCustomerPayload(payload.customer_id));
      return;
    }

    if (req.method === 'GET' && pathname === '/api/customer/orders') {
      const wixSession = getWixCustomerSession(req, res);
      if (wixSession) {
        sendJson(res, 200, { orders: await getWixMemberOrders(wixSession.session.customer.wix_member_id) });
        return;
      }
      if (WIX_COMMERCE_ENABLED) {
        sendJson(res, 401, { error: 'Sign in with Wix to view your orders' });
        return;
      }
      const payload = requireCustomer(req, res);
      if (!payload) return;
      sendJson(res, 200, { orders: callStore('get_customer_orders', { customer_id: payload.customer_id }) });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/customer/cart') {
      if (WIX_COMMERCE_ENABLED) {
        const commerce = await getWixCommerceSession(req, res);
        sendJson(res, 200, await getCurrentWixCart(commerce.client));
        return;
      }
      const payload = requireCustomer(req, res);
      if (!payload) return;
      sendJson(res, 200, { items: callStore('get_customer_cart', { customer_id: payload.customer_id }) });
      return;
    }

    if (req.method === 'PUT' && pathname === '/api/customer/cart') {
      if (WIX_COMMERCE_ENABLED) {
        sendJson(res, 410, { error: 'Bulk local cart sync is disabled. Use Wix cart item endpoints.' });
        return;
      }
      const payload = requireCustomer(req, res);
      if (!payload) return;
      const body = await readBody(req);
      const items = callStore('save_customer_cart', {
        customer_id: payload.customer_id,
        items: Array.isArray(body.items) ? body.items : [],
        _actor: { type: 'customer', id: payload.customer_id, email: payload.email },
      });
      sendJson(res, 200, { items });
      return;
    }

    if (req.method === 'DELETE' && pathname === '/api/customer/cart') {
      if (WIX_COMMERCE_ENABLED) {
        const commerce = await getWixCommerceSession(req, res);
        sendJson(res, 200, await clearWixCart(commerce.client));
        return;
      }
      const payload = requireCustomer(req, res);
      if (!payload) return;
      callStore('clear_customer_cart', {
        customer_id: payload.customer_id,
        _actor: { type: 'customer', id: payload.customer_id, email: payload.email },
      });
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/commerce/cart/items') {
      const body = await readBody(req);
      const commerce = await getWixCommerceSession(req, res);
      sendJson(res, 200, await addWixCartItem(commerce.client, body.product_id, body.quantity, body.variant_id));
      return;
    }

    if (req.method === 'PATCH' && pathname.startsWith('/api/commerce/cart/items/')) {
      const body = await readBody(req);
      const lineItemId = decodeURIComponent(pathname.split('/').pop());
      const commerce = await getWixCommerceSession(req, res);
      sendJson(res, 200, await updateWixCartItem(commerce.client, lineItemId, body.quantity));
      return;
    }

    if (req.method === 'DELETE' && pathname.startsWith('/api/commerce/cart/items/')) {
      const lineItemId = decodeURIComponent(pathname.split('/').pop());
      const commerce = await getWixCommerceSession(req, res);
      sendJson(res, 200, await removeWixCartItem(commerce.client, lineItemId));
      return;
    }

    if (req.method === 'POST' && pathname === '/api/commerce/cart/coupon') {
      const body = await readBody(req);
      const commerce = await getWixCommerceSession(req, res);
      sendJson(res, 200, await applyWixCartCoupon(commerce.client, body.code));
      return;
    }

    if (req.method === 'DELETE' && pathname === '/api/commerce/cart/coupon') {
      const commerce = await getWixCommerceSession(req, res);
      sendJson(res, 200, await removeWixCartCoupon(commerce.client));
      return;
    }

    if (req.method === 'POST' && pathname === '/api/commerce/checkout') {
      const commerce = await getWixCommerceSession(req, res);
      sendJson(res, 200, await createWixCheckout(commerce.client));
      return;
    }

    if (WIX_COMMERCE_ENABLED && pathname === '/api/coupons') {
      sendJson(res, 409, { error: 'Coupons are managed in the Wix dashboard.' });
      return;
    }

    if (WIX_COMMERCE_ENABLED && pathname.startsWith('/api/coupons/')) {
      sendJson(res, 409, { error: 'Coupons are managed in the Wix dashboard.' });
      return;
    }

    if (WIX_COMMERCE_ENABLED && req.method === 'PATCH' && pathname === '/api/customer/profile') {
      sendJson(res, 409, { error: 'Customer profiles are managed by Wix Members.' });
      return;
    }

    if (
      WIX_COMMERCE_ENABLED &&
      isUnsafeMethod(req.method) &&
      (pathname === '/api/products/import' || pathname.startsWith('/api/products/'))
    ) {
      sendJson(res, 409, { error: 'Products, variants, prices, and inventory are managed in the Wix dashboard.' });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/coupons') {
      const payload = requireAdmin(req, res);
      if (!payload) return;
      sendJson(res, 200, { coupons: callStore('list_coupons') });
      return;
    }

    if (req.method === 'PATCH' && pathname === '/api/customer/profile') {
      const payload = requireCustomer(req, res);
      if (!payload) return;
      const body = await readBody(req);
      const customer = callStore('update_customer_profile', {
        customer_id: payload.customer_id,
        updates: body,
        _actor: { type: 'customer', id: payload.customer_id, email: payload.email },
      });
      sendJson(res, 200, getCustomerPayload(customer.id));
      return;
    }

    if (req.method === 'POST' && pathname === '/api/coupons') {
      const payload = requireAdmin(req, res);
      if (!payload) return;
      const body = await readBody(req);
      const coupon = callStore('create_coupon', {
        ...body,
        _actor: { type: 'admin', id: payload.email, email: payload.email },
      });
      sendJson(res, 201, { coupon });
      return;
    }

    if (req.method === 'PUT' && pathname.startsWith('/api/coupons/')) {
      const payload = requireAdmin(req, res);
      if (!payload) return;
      const id = pathname.split('/').pop();
      const body = await readBody(req);
      const coupon = callStore('update_coupon', {
        id,
        ...body,
        _actor: { type: 'admin', id: payload.email, email: payload.email },
      });
      sendJson(res, 200, { coupon });
      return;
    }

    if (req.method === 'DELETE' && pathname.startsWith('/api/coupons/')) {
      const payload = requireAdmin(req, res);
      if (!payload) return;
      const id = pathname.split('/').pop();
      callStore('delete_coupon', { id, _actor: { type: 'admin', id: payload.email, email: payload.email } });
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/offers') {
      const payload = requireAdmin(req, res);
      if (!payload) return;
      const body = await readBody(req);
      const offer = callStore('create_offer', {
        ...body,
        _actor: { type: 'admin', id: payload.email, email: payload.email },
      });
      sendJson(res, 201, { offer });
      return;
    }

    if (req.method === 'PUT' && pathname.startsWith('/api/offers/')) {
      const payload = requireAdmin(req, res);
      if (!payload) return;
      const id = pathname.split('/').pop();
      const body = await readBody(req);
      const offer = callStore('update_offer', {
        id,
        ...body,
        _actor: { type: 'admin', id: payload.email, email: payload.email },
      });
      sendJson(res, 200, { offer });
      return;
    }

    if (req.method === 'DELETE' && pathname.startsWith('/api/offers/')) {
      const payload = requireAdmin(req, res);
      if (!payload) return;
      const id = pathname.split('/').pop();
      callStore('delete_offer', { id, _actor: { type: 'admin', id: payload.email, email: payload.email } });
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/orders') {
      if (WIX_COMMERCE_ENABLED) {
        sendJson(res, 409, { error: 'Direct order creation is disabled. Create orders through Wix checkout.' });
        return;
      }
      const body = await readBody(req);
      const customer = maybeCustomer(req, res);
      const order = callStore('create_order', {
        ...body,
        customer_id: customer?.customer_id || null,
        redeem_points: customer?.customer_id ? body.redeem_points : 0,
        _actor: customer
          ? { type: 'customer', id: customer.customer_id, email: customer.email }
          : { type: 'guest', id: 'guest' },
      });
      sendJson(res, 201, order);
      return;
    }

    if (req.method === 'PATCH' && pathname.startsWith('/api/orders/')) {
      if (WIX_COMMERCE_ENABLED) {
        sendJson(res, 409, { error: 'Orders and refunds are managed in the Wix dashboard.' });
        return;
      }
      const payload = requireAdmin(req, res);
      if (!payload) return;
      const id = pathname.split('/').pop();
      const body = await readBody(req);
      const status = String(body.status || '').trim();
      const order = callStore('update_order_status', {
        id,
        status,
        _actor: { type: 'admin', id: payload.email, email: payload.email },
      });
      sendJson(res, 200, order);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/products') {
      if (WIX_COMMERCE_ENABLED) {
        sendJson(res, 409, { error: 'Products and inventory are managed in the Wix dashboard.' });
        return;
      }
      const payload = requireAdmin(req, res);
      if (!payload) return;
      const body = await readBody(req);
      const product = callStore('create_product', {
        ...body,
        _actor: { type: 'admin', id: payload.email, email: payload.email },
      });
      syncSeoArtifacts();
      sendJson(res, 201, product);
      return;
    }

    if (req.method === 'PUT' && pathname.startsWith('/api/products/')) {
      if (WIX_COMMERCE_ENABLED) {
        sendJson(res, 409, { error: 'Products and inventory are managed in the Wix dashboard.' });
        return;
      }
      const payload = requireAdmin(req, res);
      if (!payload) return;
      const id = pathname.split('/').pop();
      const body = await readBody(req);
      const product = callStore('update_product', {
        id,
        updates: body,
        _actor: { type: 'admin', id: payload.email, email: payload.email },
      });
      syncSeoArtifacts();
      sendJson(res, 200, product);
      return;
    }

    if (req.method === 'DELETE' && pathname.startsWith('/api/products/')) {
      if (WIX_COMMERCE_ENABLED) {
        sendJson(res, 409, { error: 'Products and inventory are managed in the Wix dashboard.' });
        return;
      }
      const payload = requireAdmin(req, res);
      if (!payload) return;
      const id = pathname.split('/').pop();
      callStore('delete_product', { id, _actor: { type: 'admin', id: payload.email, email: payload.email } });
      syncSeoArtifacts();
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/products/import') {
      if (WIX_COMMERCE_ENABLED) {
        sendJson(res, 409, { error: 'Products and inventory are managed in the Wix dashboard.' });
        return;
      }
      const payload = requireAdmin(req, res);
      if (!payload) return;
      const body = await readBody(req);
      const imported = callStore('import_products', {
        products: Array.isArray(body.products) ? body.products : [],
        _actor: { type: 'admin', id: payload.email, email: payload.email },
      });
      syncSeoArtifacts();
      sendJson(res, 200, { imported });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/admin/analytics') {
      const payload = requireAdmin(req, res);
      if (!payload) return;
      sendJson(res, 200, WIX_COMMERCE_ENABLED ? await getWixCommerceAnalytics() : callStore('admin_analytics'));
      return;
    }

    if (req.method === 'GET' && pathname === '/api/admin/audit-logs') {
      const payload = requireAdmin(req, res);
      if (!payload) return;
      const limit = Number(url.searchParams.get('limit') || 25);
      sendJson(res, 200, { logs: callStore('list_admin_audit_logs', { limit }) });
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    if (res.headersSent) {
      return;
    }
    const statusCode = error.statusCode || 500;
    sendJson(res, statusCode, { error: error.message || 'Internal server error' });
  }
}

let readyPromise;

async function ensureReady() {
  if (process.env.VERCEL) return;
  if (!readyPromise) readyPromise = ensureSeeded();
  await readyPromise;
}

export default async function handler(req, res) {
  await ensureReady();
  return handleRequest(req, res);
}

if (!process.env.VERCEL) {
  await ensureReady();
  const server = http.createServer(handleRequest);
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`MIK backend listening on http://127.0.0.1:${PORT}`);
  });
}
