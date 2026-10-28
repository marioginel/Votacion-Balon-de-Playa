import fs from 'node:fs/promises';
import path from 'node:path';
import { readToken, person, requireSecret, send } from '../lib/logic.js';

// Sirve las fotos de la carpeta privada /fotos solo a quien ha entrado con su PIN.
export default async function handler(req, res) {
  if (!requireSecret(res)) return;
  const pid = await readToken(req);
  if (!pid) return send(res, 401, { error: 'Entra con tu PIN para ver las fotos.' });
  const id = new URL(req.url || '/', 'http://x').searchParams.get('id') || '';
  if (!/^[a-z0-9_-]{1,40}$/.test(id) || !person(id)) return send(res, 404, { error: 'No existe' });
  try {
    const img = await fs.readFile(path.join(process.cwd(), 'fotos', id + '.jpg'));
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'private, no-store');
    res.end(img);
  } catch { send(res, 404, { error: 'Sin foto' }); }
}
