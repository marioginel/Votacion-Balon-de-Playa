import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { PARTICIPANTS, CATS, POINTS, SCHEDULE, HIDDEN_TOP, SITE_URL } from './config.js';
import * as db from './store.js';

const SECRET = process.env.SESSION_SECRET || (db.usingMemory ? 'dev-secret' : '');

export const person = id => PARTICIPANTS.find(p => p.id === id);
export const nameOf = id => person(id)?.name || '?';

/* ---------- Respuestas ---------- */
export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}
export function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}
export function requireSecret(res) {
  if (!SECRET) { send(res, 500, { error: 'Falta configurar SESSION_SECRET en Vercel.' }); return false; }
  return true;
}

/* ---------- PIN y sesiones ---------- */
const hmac = s => crypto.createHmac('sha256', SECRET).update(s).digest('hex');
export const newPin = () => String(crypto.randomInt(0, 10000)).padStart(4, '0');
export const pinHash = (pid, pin) => hmac(`pin:${pid}:${pin}`);
export function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
export function makeToken(pid, pinVersion) {
  const payload = Buffer.from(JSON.stringify({ pid, v: pinVersion })).toString('base64url');
  return `${payload}.${hmac('tok:' + payload)}`;
}
export async function readToken(req) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [payload, sig] = t.split('.');
  if (!payload || !sig || !safeEqual(sig, hmac('tok:' + payload))) return null;
  try {
    const { pid, v } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    const acc = await db.get('account:' + pid);
    // Si se genera un PIN nuevo, las sesiones antiguas dejan de valer
    if (!person(pid) || !acc || acc.pinVersion !== v) return null;
    return pid;
  } catch { return null; }
}

/* ---------- Correo ---------- */
export const validEmail = e => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length < 200;
export function maskEmail(e) {
  const [u, d] = e.split('@');
  return `${u.slice(0, 2)}${'•'.repeat(Math.max(1, u.length - 2))}@${d}`;
}
export async function sendPinEmail(pid, email, pin, siteUrl) {
  const link = SITE_URL || siteUrl;
  const name = nameOf(pid);
  const subject = 'Tu PIN para los Premios de Oro 2026';
  const text = `Hola ${name}:

Tu PIN para votar en los Premios de Oro 2026 es: ${pin}

Entra en ${link}, elige tu nombre y mete el PIN.

Las votaciones están abiertas del 1 de noviembre a la noche del 6 de diciembre. La gala es el 12 de diciembre en la comida de Navidad en Casa Club.

El PIN es personal e intransferible. Léete las normas antes de votar.`;
  const html = `<div style="font-family:Georgia,serif;max-width:480px;margin:auto;padding:24px;color:#10261F">
<h1 style="margin:0 0 4px;font-size:28px">Premios de Oro 2026</h1>
<p style="margin:0 0 20px;color:#50675D">Gala de Navidad, Casa Club</p>
<p>Hola ${name.replace(/[<>&]/g, '')}:</p>
<p>Tu PIN para votar es:</p>
<p style="font-size:40px;font-weight:bold;letter-spacing:8px;margin:8px 0 20px;color:#8E6A1C">${pin}</p>
<p><a href="${link}" style="display:inline-block;background:#8E6A1C;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-family:sans-serif;font-weight:bold">Ir a votar</a></p>
<p style="color:#50675D;font-size:14px">Votaciones abiertas del 1 de noviembre a la noche del 6 de diciembre. El PIN es personal e intransferible.</p>
</div>`;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    if (db.usingMemory) { console.log(`[DEV] PIN de ${pid} para ${email}: ${pin}`); return; }
    throw new Error('Falta configurar el correo (SMTP_USER y SMTP_PASS).');
  }
  const port = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: process.env.MAIL_FROM || `"Premios de Oro" <${process.env.SMTP_USER}>`,
    to: email, subject, text, html,
  });
}
export function siteUrlFrom(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

/* Genera un PIN nuevo, lo manda por correo y solo lo guarda si el correo sale bien */
export async function issuePin(pid, email, req) {
  const acc = (await db.get('account:' + pid)) || {};
  const pin = newPin();
  await sendPinEmail(pid, email, pin, siteUrlFrom(req));
  const next = { ...acc, email, pinHash: pinHash(pid, pin), pinVersion: (acc.pinVersion || 0) + 1, pinSentAt: new Date().toISOString() };
  await db.set('account:' + pid, next);
  return next;
}

/* ---------- Estado de la gala ---------- */
export async function loadState() { return (await db.get('state')) || { override: 'auto', stage: { balon: 0, mojon: 0, pony: 0 } }; }
export const scheduleOpen = (t = Date.now()) => t >= SCHEDULE.open && t < SCHEDULE.close;
export const isOpen = st => st.override === 'open' ? true : st.override === 'closed' ? false : scheduleOpen();
export const autoStage = (t = Date.now()) => t >= SCHEDULE.reveal2 ? 2 : t >= SCHEDULE.reveal1 ? 1 : 0;
export const stageOf = (st, cat) => isOpen(st) ? 0 : Math.max(Number(st.stage?.[cat] || 0), autoStage());

export async function loadBallots() {
  const vals = await db.mget(PARTICIPANTS.map(p => 'ballot:' + p.id));
  const out = {};
  PARTICIPANTS.forEach((p, i) => { if (vals[i]) out[p.id] = vals[i]; });
  return out;
}
export async function loadAccounts() {
  const vals = await db.mget(PARTICIPANTS.map(p => 'account:' + p.id));
  const out = {};
  PARTICIPANTS.forEach((p, i) => { out[p.id] = vals[i] || null; });
  return out;
}

export function standings(ballots, cat, withZeros) {
  const t = {};
  PARTICIPANTS.forEach(p => t[p.id] = { id: p.id, name: p.name, pts: 0, f: [0, 0, 0] });
  for (const [voter, b] of Object.entries(ballots)) {
    const picks = b?.picks?.[cat];
    if (!t[voter] || !Array.isArray(picks)) continue;
    picks.slice(0, 3).forEach((c, i) => { if (t[c] && c !== voter) { t[c].pts += POINTS[i]; t[c].f[i]++; } });
  }
  return Object.values(t).filter(x => withZeros || x.pts > 0)
    .sort((a, b) => b.pts - a.pts || b.f[0] - a.f[0] || b.f[1] - a.f[1] || a.name.localeCompare(b.name, 'es'));
}

/* Clasificación pública: los nombres tapados nunca salen del servidor */
export function publicRanking(ballots, st) {
  const out = {};
  for (const cat of CATS) {
    const stage = stageOf(st, cat);
    const hide = HIDDEN_TOP[stage];
    const rows = standings(ballots, cat, stage >= 1).map((x, i) => ({
      pos: i + 1, pts: x.pts, name: i >= hide ? x.name : null, key: i >= hide ? x.id : null,
    }));
    out[cat] = { stage, hidden: Math.min(hide, rows.length), rows };
  }
  return out;
}

export function validBallot(pid, picks) {
  if (!picks || typeof picks !== 'object') return false;
  return CATS.every(c => {
    const a = picks[c];
    return Array.isArray(a) && a.length === 3 && new Set(a).size === 3 && a.every(id => person(id) && id !== pid);
  });
}
