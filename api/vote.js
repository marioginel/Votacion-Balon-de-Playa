import { send, body, readToken, loadState, isOpen, validBallot, requireSecret } from '../lib/logic.js';
import * as db from '../lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  if (!requireSecret(res)) return;
  const pid = await readToken(req);
  if (!pid) return send(res, 401, { error: 'Sesión caducada. Vuelve a entrar.' });
  if (!isOpen(await loadState())) return send(res, 403, { error: 'La votación está cerrada.' });
  const { picks } = body(req);
  if (!validBallot(pid, picks)) return send(res, 400, { error: 'Elige tres personas distintas en cada premio, sin votarte a ti mismo.' });
  const ballot = { picks: { balon: picks.balon, mojon: picks.mojon, pony: picks.pony }, updatedAt: new Date().toISOString() };
  await db.set('ballot:' + pid, ballot);
  send(res, 200, { ok: true, ballot });
}
