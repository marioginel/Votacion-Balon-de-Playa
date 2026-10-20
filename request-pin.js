import { send, body, person, validEmail, maskEmail, issuePin, requireSecret } from '../lib/logic.js';
import * as db from '../lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  if (!requireSecret(res)) return;
  const { pid, email } = body(req);
  const clean = String(email || '').trim().toLowerCase();
  if (!person(pid)) return send(res, 400, { error: 'Elige tu nombre.' });
  if (!validEmail(clean)) return send(res, 400, { error: 'Escribe un correo válido, por ejemplo nombre@gmail.com.' });
  try {
    if ((await db.incrWithTtl('reqlimit:' + pid, 600)) > 3)
      return send(res, 429, { error: 'Has pedido el PIN demasiadas veces. Espera 10 minutos.' });
    const acc = await db.get('account:' + pid);
    // El primer correo registrado manda. Si ya hay uno, el PIN va siempre a ese correo.
    const target = acc?.email || clean;
    await issuePin(pid, target, req);
    const msg = acc?.email && acc.email !== clean
      ? `Esta persona ya tiene un correo registrado. Hemos mandado un PIN nuevo a ${maskEmail(target)}. Si no es tuyo, habla con el admin.`
      : `Te hemos mandado el PIN a ${maskEmail(target)}. Mira también en spam.`;
    send(res, 200, { ok: true, message: msg });
  } catch (e) { console.error(e); send(res, 502, { error: 'No se pudo enviar el correo. Inténtalo más tarde o avisa al admin.' }); }
}
