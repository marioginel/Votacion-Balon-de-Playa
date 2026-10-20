import { PARTICIPANTS, CATS } from '../lib/config.js';
import { send, body, safeEqual, person, validEmail, issuePin, loadState, loadBallots, loadAccounts,
  isOpen, autoStage, stageOf, standings, validBallot, requireSecret } from '../lib/logic.js';
import * as db from '../lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  if (!requireSecret(res)) return;
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return send(res, 500, { error: 'Falta configurar ADMIN_PASSWORD en Vercel.' });
  const given = req.headers['x-admin-password'] || '';
  if ((await db.get('adminfails')) >= 10) return send(res, 429, { error: 'Demasiados intentos. Espera 15 minutos.' });
  if (!safeEqual(given, pass)) { await db.incrWithTtl('adminfails', 900); return send(res, 401, { error: 'Contraseña incorrecta.' }); }

  const b = body(req);
  try {
    const st = await loadState();
    if (b.action === 'override') {
      if (!['auto', 'open', 'closed'].includes(b.value)) return send(res, 400, { error: 'Valor no válido' });
      await db.set('state', { ...st, override: b.value });
    } else if (b.action === 'stage') {
      if (!CATS.includes(b.cat)) return send(res, 400, { error: 'Premio no válido' });
      if (isOpen(st)) return send(res, 400, { error: 'Cierra la votación antes de desvelar.' });
      const cur = stageOf(st, b.cat);
      const next = b.dir === 'back' ? Math.max(autoStage(), Number(st.stage?.[b.cat] || 0) - 1) : Math.min(5, cur + 1);
      await db.set('state', { ...st, stage: { ...st.stage, [b.cat]: next } });
    } else if (b.action === 'setEmail') {
      if (!person(b.pid)) return send(res, 400, { error: 'Persona no válida' });
      const email = String(b.email || '').trim().toLowerCase();
      const acc = (await db.get('account:' + b.pid)) || {};
      if (!email) { await db.set('account:' + b.pid, { ...acc, email: null }); }
      else if (!validEmail(email)) return send(res, 400, { error: 'Correo no válido' });
      else await db.set('account:' + b.pid, { ...acc, email });
    } else if (b.action === 'sendPin') {
      const acc = await db.get('account:' + b.pid);
      if (!person(b.pid) || !acc?.email) return send(res, 400, { error: 'Esa persona no tiene correo.' });
      await issuePin(b.pid, acc.email, req);
    } else if (b.action === 'wipe') {
      await Promise.all(PARTICIPANTS.map(p => db.del('ballot:' + p.id)));
      await db.set('state', { override: 'auto', stage: { balon: 0, mojon: 0, pony: 0 } });
    } else if (b.action !== 'status') return send(res, 400, { error: 'Acción no válida' });

    const [st2, ballots, accounts] = await Promise.all([loadState(), loadBallots(), loadAccounts()]);
    send(res, 200, {
      open: isOpen(st2), override: st2.override || 'auto', autoStage: autoStage(),
      stages: Object.fromEntries(CATS.map(c => [c, stageOf(st2, c)])),
      manual: st2.stage || {},
      people: PARTICIPANTS.map(p => ({ id: p.id, name: p.name, email: accounts[p.id]?.email || '',
        pinSentAt: accounts[p.id]?.pinSentAt || null, voted: !!(ballots[p.id] && validBallot(p.id, ballots[p.id].picks)) })),
      standings: Object.fromEntries(CATS.map(c => [c, standings(ballots, c, true).map(({ name, pts }) => ({ name, pts }))])),
    });
  } catch (e) { console.error(e); send(res, 500, { error: e.message?.includes('correo') ? e.message : 'No se pudo completar la acción.' }); }
}
