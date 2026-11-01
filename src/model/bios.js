import { IDS, TEAMS, WEEKS, SCHEDULE, LAST_CHAMP, LAST } from './league.js';
import { formFor } from './players.js';

/* Builds a driver's bio from their stats. The wording comes from config/profiles.js (written around each
   persona's name); this file decides which lines apply and fills in the numbers. */
const nth = n => { const v = n % 100, s = ['th', 'st', 'nd', 'rd']; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
const signed = x => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(1);

export function nextGame(id, K) {
  for (let w = K + 1; w <= 17; w++) {
    const g = WEEKS[w] ? WEEKS[w].map(r => [r[0], r[2]]) : SCHEDULE[w];
    const m = g && g.find(p => p[0] === id || p[1] === id);
    if (m) return { week: w, opp: m[0] === id ? m[1] : m[0] };
  }
  return null;
}

// R = analytics(thru), ST = statsThrough(thru). Returns { paras, facts, next }.
export function driverBio(id, R, ST, w = LAST) {
  const q = TEAMS[id].profile.quips, K = R.K, n = IDS.length;
  if (K < 1) return { paras: [q.preseason], facts: [], next: nextGame(id, 0) };

  const A = R.A, a = A[id], rank = ST.s[id].rank;
  const rankOf = f => 1 + IDS.filter(o => f(A[o]) > f(a)).length;
  const pfRank = rankOf(x => x.pf);
  const band = rank === 1 ? 'leader' : rank === n ? 'cellar' : rank <= Math.ceil(n / 2) ? 'contender' : 'chaser';

  const p1 = `${q[band]} ${a.w}-${a.l} on the board, ${a.pf.toFixed(1)} points scored (${nth(pfRank)} in the league) and ${a.pa.toFixed(1)} allowed. All-play says ${a.aw}-${a.al}.`;

  const p2 = [];
  if (a.luck >= .75) p2.push(`${q.lucky} That is ${signed(a.luck)} wins above what the scoring earned.`);
  else if (a.luck <= -.75) p2.push(`${q.unlucky} That is ${signed(a.luck)} wins below what the scoring earned.`);
  else p2.push('Record and scoring are in step, which is the least dramatic way to drive.');
  const maxSd = Math.max(...IDS.map(o => A[o].sd)), minSd = Math.min(...IDS.map(o => A[o].sd));
  if (K >= 3 && a.sd === maxSd) p2.push(`${q.wild} (±${a.sd.toFixed(1)} a week, the biggest swings in the league.)`);
  else if (K >= 3 && a.sd === minSd) p2.push(`${q.steady} (±${a.sd.toFixed(1)} a week, the smallest swings in the league.)`);

  const p3 = [];
  const sk = /^(\d+)([WL])$/.exec(String(formFor(id, w, ST).streak)); // Sleeper's own streak string for the current week
  if (sk && +sk[1] >= 2) p3.push(sk[2] === 'W' ? q.hot : q.cold);
  const crowns = IDS.map(o => A[o].rk.filter(r => r === 1).length), mine = A[id].rk.filter(r => r === 1).length;
  if (mine >= 2 && mine === Math.max(...crowns)) p3.push(`${q.crown} (${mine} of ${K} weeks.)`);
  const flatLo = Math.min(...IDS.map(o => A[o].lo));
  if (a.lo === flatLo) p3.push(`${q.flat} (${a.lo.toFixed(1)}.)`);

  let bestK = 1, worstK = 1;
  for (let k = 1; k <= K; k++) { if (a.sc[k] > a.sc[bestK]) bestK = k; if (a.sc[k] < a.sc[worstK]) worstK = k; }
  const facts = [
    ['Record', `${a.w}-${a.l}`], ['Points for', a.pf.toFixed(1)], ['Points against', a.pa.toFixed(1)],
    ['All-play', `${a.aw}-${a.al}`], ['Luck', signed(a.luck)], ['Average', a.avg.toFixed(1)],
    [`Best · wk ${bestK}`, a.hi.toFixed(1)], [`Worst · wk ${worstK}`, a.lo.toFixed(1)]
  ];
  return { paras: [p1, p2.join(' '), p3.join(' ')].filter(Boolean), facts, next: nextGame(id, K), champ: id === LAST_CHAMP };
}
