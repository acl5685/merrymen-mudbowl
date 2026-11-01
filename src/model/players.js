import { IDS, STARTS, ROSTERS, FORM, LAST } from './league.js';

/* Player-level numbers. Points come from each week's lineup (best ball: Sleeper picks the optimal starters), names
   come from Sleeper's player list once it has loaded. Until then players show as "Player <id>". */
export let PLAYERS = {};
export function setPlayers(map) { PLAYERS = map || {}; }
export const havePlayers = () => Object.keys(PLAYERS).length > 0;
export function pinfo(pid) {
  const p = PLAYERS[pid];
  return p ? { name: p[0], pos: p[1], team: p[2] } : { name: 'Player ' + pid, pos: '?', team: '' };
}
export const POS_ORDER = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

// Top single-player scores in one week across the league (the live week included).
export function weekTop(w, n = 3) {
  const rows = [];
  Object.entries(STARTS[w] || {}).forEach(([rid, arr]) => arr.forEach(([pid, pts]) => rows.push({ pid, rid: +rid, pts, w })));
  return rows.sort((a, b) => b.pts - a.pts).slice(0, n);
}

// Season totals for starters through completed week K (a player counts for the roster that started them).
export function seasonTotals(K) {
  const m = {};
  for (let w = 1; w <= Math.min(K, LAST); w++) Object.entries(STARTS[w] || {}).forEach(([rid, arr]) => arr.forEach(([pid, pts]) => {
    const t = m[pid] || (m[pid] = { pid, rid: +rid, pts: 0, starts: 0, best: 0, bestW: 0 });
    t.pts += pts; t.starts++; t.rid = +rid;
    if (pts > t.best) { t.best = pts; t.bestW = w; }
  }));
  return Object.values(m).sort((a, b) => b.pts - a.pts);
}

// A roster's players (all of them, started or not) with season points, best first.
export function rosterBoard(rid, K) {
  const tot = Object.fromEntries(seasonTotals(K).filter(t => t.rid === rid).map(t => [t.pid, t]));
  return (ROSTERS[rid] || []).map(pid => ({ pid, ...(tot[pid] || { pts: 0, starts: 0, best: 0, bestW: 0 }) }))
    .sort((a, b) => b.pts - a.pts);
}

// How much of a team's season points came from its single best player.
export function carry(rid, K, pf) {
  const top = rosterBoard(rid, K)[0];
  return top && pf > 0 ? { pid: top.pid, pts: top.pts, share: top.pts / pf } : null;
}

// Best single player per position across the league.
export function bestByPosition(K) {
  const out = {};
  seasonTotals(K).forEach(t => { const pos = pinfo(t.pid).pos; if (!out[pos]) out[pos] = t; });
  return out;
}

/* Form: the last results as W/L/T letters. For the current week Sleeper's own record and streak strings win,
   since they are the league's source of truth; for an earlier as-of week we compute them from the scores. */
export function formFor(id, w, ST) {
  const f = FORM[id], computed = ST.s[id].res;
  if (f && f.record && LAST > 0 && w >= LAST) return { pips: f.record.split(''), streak: f.streak || ST.s[id].streak, source: 'Sleeper' };
  return { pips: computed.slice(), streak: ST.s[id].streak, source: 'scores' };
}
