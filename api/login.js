import { send, body, person, pinHash, safeEqual, makeToken, requireSecret } from '../lib/logic.js';
import * as db from '../lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  if (!requireSecret(res)) return;
  const { pid, pin } = body(req);
  if (!person(pid)) return send(res, 400, { error: 'Elige tu nombre.' });
  try {
    const fails = (await db.get('fails:' + pid)) || 0;
    if (fails >= 8) return send(res, 429, { error: 'Demasiados intentos fallidos. Espera 15 minutos o pide un PIN nuevo.' });
    const acc = await db.get('account:' + pid);
    if (!acc?.pinHash) return send(res, 400, { error: 'Todavía no tienes PIN. Pídelo con tu correo.' });
    if (!safeEqual(acc.pinHash, pinHash(pid, String(pin || '').trim()))) {
      await db.incrWithTtl('fails:' + pid, 900);
      return send(res, 401, { error: 'El PIN no coincide. Revisa el que te llegó por correo.' });
    }
    await db.del('fails:' + pid);
    send(res, 200, { token: makeToken(pid, acc.pinVersion) });
  } catch (e) { console.error(e); send(res, 500, { error: 'No se pudo entrar. Inténtalo otra vez.' }); }
}
