import { send, body, readToken, requireSecret } from '../lib/logic.js';
import { SCHEDULE } from '../lib/config.js';
import * as db from '../lib/store.js';

// Confirmación de asistencia a la comida de Navidad del 12 de diciembre
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  if (!requireSecret(res)) return;
  const pid = await readToken(req);
  if (!pid) return send(res, 401, { error: 'Sesión caducada. Vuelve a entrar.' });
  if (Date.now() >= SCHEDULE.gala) return send(res, 403, { error: 'La comida ya ha pasado.' });
  const { going } = body(req);
  if (typeof going !== 'boolean') return send(res, 400, { error: 'Respuesta no válida' });
  const rsvp = { going, at: new Date().toISOString() };
  await db.set('rsvp:' + pid, rsvp);
  send(res, 200, { ok: true, rsvp });
}
