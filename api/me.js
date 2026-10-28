import { send, readToken, nameOf, requireSecret } from '../lib/logic.js';
import * as db from '../lib/store.js';

export default async function handler(req, res) {
  if (!requireSecret(res)) return;
  const pid = await readToken(req);
  if (!pid) return send(res, 401, { error: 'Sesión caducada. Vuelve a entrar.' });
  const [ballot, rsvp] = await Promise.all([db.get('ballot:' + pid), db.get('rsvp:' + pid)]);
  send(res, 200, { pid, name: nameOf(pid), ballot, rsvp });
}
