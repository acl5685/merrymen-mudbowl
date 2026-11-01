import { IDS, TEAMS, WEEKS, LAST } from './league.js';

/* Head-to-head history: every game last season (loaded once) plus this season's finished weeks (rebuilt on every
   refresh). Drivers are matched by Sleeper owner id, so a roster change wouldn't break the history. */
let prevGames = [];   // [{ s, w, oa, ob, pa, pb }] owner ids
export let H2H = {};  // `${a}-${b}` (current roster ids) -> series summary from a's side
export let HISTORY_READY = false;

export function buildHistory(prev) {
  const ownerOf = Object.fromEntries(prev.rosters.map(r => [r.roster_id, r.owner_id]));
  const done = prev.league.settings.last_scored_leg || 17, season = +prev.league.season || 2025, games = [];
  for (let w = 1; w <= done; w++) {
    const by = new Map();
    (prev.matchups[w] || []).forEach(r => { if (r.matchup_id == null) return; (by.get(r.matchup_id) || by.set(r.matchup_id, []).get(r.matchup_id)).push(r); });
    by.forEach(g => { if (g.length === 2 && (g[0].points > 0 || g[1].points > 0)) games.push({ s: season, w, oa: ownerOf[g[0].roster_id], ob: ownerOf[g[1].roster_id], pa: g[0].points, pb: g[1].points }); });
  }
  prevGames = games; HISTORY_READY = true;
  rebuildH2H();
}

export function rebuildH2H() {
  const byOwner = Object.fromEntries(IDS.map(id => [TEAMS[id].ownerId, id]));
  const all = [];
  prevGames.forEach(g => { if (byOwner[g.oa] && byOwner[g.ob]) all.push({ s: g.s, w: g.w, a: byOwner[g.oa], b: byOwner[g.ob], pa: g.pa, pb: g.pb }); });
  for (let w = 1; w <= LAST; w++) (WEEKS[w] || []).forEach(([a, pa, b, pb]) => all.push({ s: 2026, w, a, b, pa, pb }));
  const h = {};
  IDS.forEach(x => IDS.forEach(y => { if (x !== y) h[x + '-' + y] = { w: 0, l: 0, t: 0, pf: 0, pa: 0, games: [] }; }));
  all.sort((p, q) => p.s - q.s || p.w - q.w).forEach(g => {
    [[g.a, g.b, g.pa, g.pb], [g.b, g.a, g.pb, g.pa]].forEach(([x, y, px, py]) => {
      const e = h[x + '-' + y]; if (!e) return;
      const r = px > py ? 'W' : px < py ? 'L' : 'T';
      e[r.toLowerCase()]++; e.pf += px; e.pa += py; e.games.push({ s: g.s, w: g.w, px, py, r });
    });
  });
  Object.values(h).forEach(e => {
    const last = e.games.length ? e.games[e.games.length - 1].r : null; let n = 0;
    for (let i = e.games.length - 1; i >= 0 && e.games[i].r === last; i--) n++;
    e.streak = last ? { type: last, n } : null;
    e.n = e.games.length;
  });
  H2H = h;
}

export const series = (x, y) => H2H[x + '-' + y] || { w: 0, l: 0, t: 0, pf: 0, pa: 0, games: [], streak: null, n: 0 };
export const rec = e => `${e.w}-${e.l}${e.t ? '-' + e.t : ''}`;

// All-time record for one driver against the whole league.
export function allTime(id) {
  const t = { w: 0, l: 0, t: 0, pf: 0, pa: 0 };
  IDS.forEach(o => { if (o !== id) { const e = series(id, o); t.w += e.w; t.l += e.l; t.t += e.t; t.pf += e.pf; t.pa += e.pa; } });
  return t;
}

// Who a driver loses to most (nemesis) and beats most (victim), by win-loss gap, with at least 2 meetings.
export function nemesis(id) {
  const opp = IDS.filter(o => o !== id && series(id, o).n >= 2).sort((a, b) => { const x = series(id, a), y = series(id, b); return (x.w - x.l) - (y.w - y.l) || y.pa - x.pa; });
  return opp.length && series(id, opp[0]).l > series(id, opp[0]).w ? opp[0] : null;
}
export function victim(id) {
  const opp = IDS.filter(o => o !== id && series(id, o).n >= 2).sort((a, b) => { const x = series(id, a), y = series(id, b); return (y.w - y.l) - (x.w - x.l) || y.pf - x.pf; });
  return opp.length && series(id, opp[0]).w > series(id, opp[0]).l ? opp[0] : null;
}

// Fun facts for the Stats view and the booth. Each is { title, id (whose card colour), text }.
export function rivalFacts() {
  if (!HISTORY_READY) return [];
  const S = id => TEAMS[id].short, fmt = n => n.toFixed(1), facts = [];
  const pairs = [];
  IDS.forEach(x => IDS.forEach(y => { if (x < y) pairs.push([x, y, series(x, y)]); }));
  const played = pairs.filter(p => p[2].n >= 2);
  if (!played.length) return [];

  // Longest active streak in any one rivalry (a team losing again and again to the same opponent).
  let best = null;
  IDS.forEach(x => IDS.forEach(y => { if (x !== y) { const e = series(x, y); if (e.streak && e.streak.type === 'L' && e.streak.n >= 3 && (!best || e.streak.n > best.n)) best = { x, y, n: e.streak.n }; } }));
  if (best) facts.push({ title: 'The Bogeyman', id: best.y, text: `${S(best.x)} has lost ${best.n} straight to ${S(best.y)}.` });

  const lop = played.map(([x, y, e]) => (e.w - e.l >= 0 ? { win: x, lose: y, e } : { win: y, lose: x, e: series(y, x) })).sort((a, b) => (b.e.w - b.e.l) - (a.e.w - a.e.l) || b.e.n - a.e.n)[0];
  if (lop && lop.e.w - lop.e.l >= 2) facts.push({ title: 'Owned', id: lop.win, text: `${S(lop.win)} leads ${S(lop.lose)} ${lop.e.w}-${lop.e.l} across both seasons.` });

  const even = played.filter(p => Math.abs(p[2].w - p[2].l) <= 1).sort((a, b) => b[2].n - a[2].n)[0];
  if (even) facts.push({ title: 'Dead Even', id: even[0], text: `${S(even[0])} and ${S(even[1])} are ${rec(even[2])} against each other over ${even[2].n} games.` });

  const games = [];
  pairs.forEach(([x, y, e]) => e.games.forEach(g => games.push({ x, y, ...g, m: Math.abs(g.px - g.py) })));
  if (games.length) {
    const blow = games.reduce((m, g) => g.m > m.m ? g : m), close = games.reduce((m, g) => g.m < m.m ? g : m);
    const line = g => { const xw = g.px > g.py; const wn = xw ? g.x : g.y; const ls = xw ? g.y : g.x; return `${S(wn)} ${fmt(Math.max(g.px, g.py))} over ${S(ls)} ${fmt(Math.min(g.px, g.py))}, ${g.s} week ${g.w}`; };
    facts.push({ title: 'Biggest Blowout Ever', id: blow.px > blow.py ? blow.x : blow.y, text: `${line(blow)}. A ${fmt(blow.m)}-point margin.` });
    facts.push({ title: 'Heartbreaker', id: close.px > close.py ? close.y : close.x, text: `${line(close)}. Decided by ${close.m.toFixed(2)}.` });
  }

  const champ = IDS.map(id => ({ id, t: allTime(id) })).filter(o => o.t.w + o.t.l >= 6).sort((a, b) => (b.t.w / (b.t.w + b.t.l)) - (a.t.w / (a.t.w + a.t.l)))[0];
  if (champ) facts.push({ title: 'All-Time Best', id: champ.id, text: `${S(champ.id)} is ${champ.t.w}-${champ.t.l} across both seasons, the best record in the league.` });
  return facts;
}
