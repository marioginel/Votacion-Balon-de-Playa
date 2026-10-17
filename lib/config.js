// Participantes: cambia aquí los nombres si quieres. El "id" no debe cambiar una vez empiecen las votaciones.
export const PARTICIPANTS = [
  { id: 'borao', name: 'Borao' },
  { id: 'blasco', name: 'Blasco' },
  { id: 'civi', name: 'Civi' },
  { id: 'diego', name: 'Diego' },
  { id: 'domin', name: 'Domin' },
  { id: 'eduardo', name: 'Eduardo Polo' },
  { id: 'guille', name: 'Guille' },
  { id: 'rafael', name: 'Rafael Gomez' },
  { id: 'julian', name: 'Julian' },
  { id: 'juanjo', name: 'Juanjo' },
  { id: 'kike', name: 'Kike' },
  { id: 'maroto', name: 'Maroto' },
  { id: 'moyano', name: 'Moyano' },
  { id: 'portillo', name: 'Portillo' },
  { id: 'pablito', name: 'Pablito' },
  { id: 'sito', name: 'Sito Cañizares' },
  { id: 'admin', name: 'Mi nombre' }, // <- pon aquí tu nombre
];

export const CATS = ['balon', 'mojon', 'pony'];
export const POINTS = [3, 2, 1];

// Calendario en hora de Madrid (CET, UTC+1)
export const SCHEDULE = {
  open: Date.UTC(2026, 9, 31, 23, 0),    // 1 nov 2026 00:00
  close: Date.UTC(2026, 11, 6, 23, 0),   // 6 dic 2026 a medianoche
  reveal1: Date.UTC(2026, 11, 6, 23, 0), // 7 dic: se desvelan los 10 últimos (quedan 7 tapados)
  reveal2: Date.UTC(2026, 11, 12, 8, 0), // 12 dic 09:00: se desvela hasta el top 3
};

// Cuántos puestos siguen tapados en cada fase
export const HIDDEN_TOP = [Infinity, 7, 3, 2, 1, 0];

export const SITE_URL = process.env.SITE_URL || '';
