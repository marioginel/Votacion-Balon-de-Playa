import { PARTICIPANTS, SCHEDULE } from '../lib/config.js';
import { send, loadState, loadBallots, isOpen, publicRanking, validBallot } from '../lib/logic.js';

export default async function handler(req, res) {
  try {
    const [st, ballots] = await Promise.all([loadState(), loadBallots()]);
    const voted = Object.entries(ballots).filter(([pid, b]) => validBallot(pid, b.picks)).length;
    send(res, 200, {
      participants: PARTICIPANTS.map(({ id, name }) => ({ id, name })),
      open: isOpen(st), override: st.override || 'auto', schedule: SCHEDULE, now: Date.now(),
      voted, total: PARTICIPANTS.length,
      ranking: publicRanking(ballots, st),
    });
  } catch (e) { console.error(e); send(res, 500, { error: 'No se pudo cargar la gala.' }); }
}
