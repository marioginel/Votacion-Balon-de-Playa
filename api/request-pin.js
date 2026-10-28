import { PARTICIPANTS } from '../lib/config.js';
import { send, body, person, validEmail, maskEmail, issuePin, requireSecret, loadAccounts } from '../lib/logic.js';
import * as db from '../lib/store.js';

export const CHEAT_MESSAGE = 'Te acabo de pillar haciendo trampas, no seas como Maroto. Honra esta celebración y respétate a ti mismo, únicamente pide tu PIN';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  if (!requireSecret(res)) return;
  const { pid, email } = body(req);
  const clean = String(email || '').trim().toLowerCase();
  if (!person(pid)) return send(res, 400, { error: 'Elige tu nombre.' });
  if (!validEmail(clean)) return send(res, 400, { error: 'Escribe un correo válido, por ejemplo nombre@gmail.com.' });
  try {
    const acc = await db.get('account:' + pid);
    // Solo se envía el PIN si el correo coincide con el que el admin ha dado de alta para esa persona.
    if (!acc?.email) return send(res, 403, { error: 'Tu correo todavía no está dado de alta. Pásaselo al admin para que lo añada.' });
    if (acc.email !== clean) {
      // Intento de trampa: se apunta en la lista del admin, identificando al tramposo si su correo está registrado.
      const accounts = await loadAccounts();
      const culprit = PARTICIPANTS.find(p => accounts[p.id]?.email === clean)?.id || null;
      const list = (await db.get('cheats')) || [];
      list.unshift({ at: new Date().toISOString(), as: pid, email: clean, culprit });
      await db.set('cheats', list.slice(0, 200));
      return send(res, 403, { error: CHEAT_MESSAGE, cheat: true });
    }
    // El límite solo cuenta peticiones legítimas, para que nadie pueda bloquear el PIN de otro.
    if ((await db.incrWithTtl('reqlimit:' + pid, 600)) > 3)
      return send(res, 429, { error: 'Has pedido el PIN demasiadas veces. Espera 10 minutos.' });
    await issuePin(pid, acc.email, req);
    send(res, 200, { ok: true, message: `Te hemos mandado un PIN nuevo a ${maskEmail(acc.email)}. Mira también en spam.` });
  } catch (e) { console.error(e); send(res, 502, { error: 'No se pudo enviar el correo. Inténtalo más tarde o avisa al admin.' }); }
}
