// Participantes. Puedes cambiar el nombre y el correo cuando quieras.
// El "id" no debe cambiar una vez empiecen las votaciones.
// El PIN solo se envía al correo de esta lista (o al que pongas desde el panel de admin, que tiene prioridad).
// Este archivo no se envía al navegador, pero mantén el repositorio de GitHub en privado.
export const PARTICIPANTS = [
  { id: 'borao', name: 'Borao', email: 'aboraobosque@gmail.com' },
  { id: 'blasco', name: 'Blasco', email: 'javierblascomarquez@gmail.com' },
  { id: 'civi', name: 'Civi', email: 'acivantoslopez@gmail.com' },
  { id: 'diego', name: 'Diego', email: 'd.castillomartin@gmail.com' },
  { id: 'domin', name: 'Domin', email: 'j.domingosancho@gmail.com' },
  { id: 'eduardo', name: 'Eduardo Polo', email: 'edupc92@gmail.com' },
  { id: 'guille', name: 'Guille', email: 'guillegcc@gmail.com' },
  { id: 'rafael', name: 'Rafael Gomez', email: 'rafagombe@gmail.com' },
  { id: 'julian', name: 'Julian', email: 'julepeherce@hotmail.com' },
  { id: 'juanjo', name: 'Juanjo', email: 'jj.simon05@gmail.com' },
  { id: 'kike', name: 'Kike', email: 'e.usandizagaribalta@gmail.com' },
  { id: 'maroto', name: 'Maroto', email: 'a.marotobr@gmail.com' },
  { id: 'moyano', name: 'Moyano', email: 'jmoyanosol@gmail.com' },
  { id: 'portillo', name: 'Portillo', email: 'apmadrid92@gmail.com' },
  { id: 'pablito', name: 'Pablito', email: 'pgarciacruz@hotmail.com' },
  { id: 'juanma', name: 'Juanma', email: 'juanmaprc@gmail.com' },
  { id: 'admin', name: 'Mario', email: 'mario.ginel@gmail.com' },
];

export const CATS = ['balon', 'mojon', 'pony'];
export const POINTS = [3, 2, 1];

// Calendario en hora de Madrid (CET, UTC+1)
export const SCHEDULE = {
  open: Date.UTC(2026, 9, 31, 23, 0),    // 1 nov 2026 00:00
  close: Date.UTC(2026, 11, 6, 23, 0),   // 6 dic 2026 a medianoche
  reveal1: Date.UTC(2026, 11, 6, 23, 0), // 7 dic: se desvelan los 10 últimos (quedan 7 tapados)
  reveal2: Date.UTC(2026, 11, 12, 8, 0), // 12 dic 09:00: se desvela hasta el top 3
  gala: Date.UTC(2026, 11, 12, 13, 0),   // 12 dic 14:00: comida en Casa Club (se cierra la confirmación)
};

// Cuántos puestos siguen tapados en cada fase
export const HIDDEN_TOP = [Infinity, 7, 3, 2, 1, 0];

export const SITE_URL = process.env.SITE_URL || '';
