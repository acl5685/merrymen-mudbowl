import { IDS, TEAMS, WEEKS, LIVE_WEEK, LAST, REG_END } from './league.js';
import { awardList } from './stats.js';
import { mustWin } from './forecast.js';
import { pc } from '../util.js';
import { weekTop, pinfo, formFor } from './players.js';
import { series, rec, rivalFacts, HISTORY_READY } from './history.js';

/* The commentators' booth. Two made-up announcers call the league from the live numbers: standings, odds,
   awards, this week's picks and the biggest must-win game. No pronouns for real drivers, and nothing is hard-coded
   about scores, so the script rewrites itself every refresh. */
export const CAST = [
  { id: 'A', name: 'Skip "Tailgate" Tolliver', short: 'Skip', role: 'Play-by-play', initials: 'ST', color: '#f5b021' },
  { id: 'B', name: 'Dr. Gladys Gearbox', short: 'Gearbox', role: 'Color analyst', initials: 'GG', color: '#ff6a2b' }
];

const sgn = x => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(1);

// ctx = { w, ST, R, F }: the selected week, statsThrough(w), analytics(w) and forecast(min(w, LAST)).
export function buildCommentary({ w, ST, R, F }) {
  const out = [], say = (who, text) => out.push({ who, text });
  const nm = id => TEAMS[id].name, sh = id => TEAMS[id].short, q = id => TEAMS[id].profile.quips;

  if (R.K < 1) {
    say('A', 'Welcome to the 2026–27 Mudbowl, folks. Six drivers, one trophy, and everybody is undefeated.');
    say('B', 'Everybody is also the favorite. Enjoy it. That lasts until the first scoreboard.');
    ST.order.forEach(id => {
      say('A', `Rolling in: ${nm(id)}, driving the ${TEAMS[id].profile.truck}.`);
      say('B', TEAMS[id].profile.tagline);
    });
    say('A', 'Tap a driver on the board for the full story.');
    return out;
  }

  const live = w === LIVE_WEEK;
  const order = ST.order, lead = order[0], bottom = order[order.length - 1];
  const fav = IDS.slice().sort((a, b) => F.T[b].title - F.T[a].title)[0];
  const sl = ST.s[lead], sb = ST.s[bottom];

  say('A', `Welcome back to the Mudbowl. ${live ? `Week ${LIVE_WEEK} is underway` : `We are through week ${R.K}`}, and ${nm(fav)} is the title favorite at ${pc(F.T[fav].title)}.`);
  say('B', F.T[fav].title >= .3
    ? `${pc(F.T[fav].bye)} to land a first-round bye, too. When the numbers lean that hard, the rest of the field has to lean harder.`
    : `Only ${pc(F.T[fav].title)} for the favorite, Skip. That is a wide-open race and I am here for it.`);

  say('A', `${nm(lead)} holds the top spot at ${sl.w}-${sl.l} with ${sl.pf.toFixed(1)} points on the season.`);
  const second = order[1];
  say('B', ST.s[second].w === sl.w ? `${sh(second)} has the same record, so points are doing the tiebreaking: ${ST.s[second].pf.toFixed(1)} against ${sl.pf.toFixed(1)}.` : q(lead).leader);

  // Streaks come from Sleeper's own streak string.
  IDS.map(id => { const m = /^(\d+)([WL])$/.exec(String(formFor(id, w, ST).streak)); return m ? { id, n: +m[1], t: m[2] } : null; })
    .filter(s => s && s.n >= 3).sort((a, b) => b.n - a.n).slice(0, 2).forEach(s => {
      say('A', `Streak watch: ${sh(s.id)} has ${s.t === 'W' ? 'won' : 'lost'} ${s.n} straight, per Sleeper.`);
      say('B', s.t === 'W' ? q(s.id).hot : q(s.id).cold);
    });

  say('A', `Down at the bottom, ${nm(bottom)} is ${sb.w}-${sb.l}.`);
  say('B', q(bottom).cellar);

  const byLuck = IDS.slice().sort((a, b) => R.A[b].luck - R.A[a].luck);
  const lucky = byLuck[0], unlucky = byLuck[byLuck.length - 1];
  if (R.A[lucky].luck >= 1 && R.A[unlucky].luck <= -1) {
    say('A', `Luck report: ${sh(lucky)} is ${sgn(R.A[lucky].luck)} wins above what the scoring earned.`);
    say('B', `While ${sh(unlucky)} is ${sgn(R.A[unlucky].luck)}. The schedule is not neutral, Skip.`);
  }

  const wk = live ? LIVE_WEEK : R.K, pw = weekTop(wk, 1)[0];
  if (pw && pw.pts > 0) {
    const p = pinfo(pw.pid), g = (WEEKS[wk] || []).find(r => r[0] === pw.rid || r[2] === pw.rid), team = g ? (g[0] === pw.rid ? g[1] : g[3]) : 0;
    say('A', `Player of the week${live ? ', live' : ''}: ${p.name}, ${p.pos}, ${pw.pts.toFixed(1)} points for ${nm(pw.rid)}.`);
    say('B', team > 0 ? `That is ${Math.round(pw.pts / team * 100)}% of the whole ${sh(pw.rid)} score from one player. Depth is for people who do not have that.` : 'One player, one big week. The mud noticed.');
  }

  awardList(R).filter(([k]) => k !== 'Defending Champ').slice(0, 6).forEach(([k, id, d]) => {
    say('A', `${k} goes to ${nm(id)}.`);
    say('B', d);
  });

  const nk = F.K + 1;
  if (nk <= REG_END) {
    F.games.filter(g => g.k === nk).forEach(g => {
      const pa = g.aw / F.NS, pb = 1 - pa, fa = pa >= .5, p = Math.max(pa, pb);
      say('A', `${live && nk === LIVE_WEEK ? 'Now' : 'Up next'}: ${sh(g.a)} against ${sh(g.b)}. ${pc(fa ? pa : pb)} to ${sh(fa ? g.a : g.b)}.`);
      const row = live && nk === LIVE_WEEK && WEEKS[nk] && WEEKS[nk].find(r => r[0] === g.a || r[2] === g.a);
      const ls = row ? (row[0] === g.a ? [row[1], row[3]] : [row[3], row[1]]) : null;
      const sr = HISTORY_READY ? series(g.a, g.b) : null, ser = sr && sr.n ? `Series: ${sh(g.a)} ${rec(sr)} against ${sh(g.b)}. ` : '';
      say('B', ser + (ls && (ls[0] || ls[1])
        ? `Live: ${sh(g.a)} ${ls[0].toFixed(1)}, ${sh(g.b)} ${ls[1].toFixed(1)}. Plenty of week left.`
        : p > .7 ? 'A heavy favorite, but this is the Mudbowl. Mud does not read odds.' : p < .55 ? 'A coin flip. Pick with your heart and regret it later.' : 'A slight edge, nothing more.'));
    });
  }

  let best = null;
  IDS.forEach(id => { const m = mustWin(F, id); if (m && (!best || m.sw > best.m.sw)) best = { id, m }; });
  if (best) {
    const { id, m } = best;
    say('A', `Circle week ${m.k}: ${sh(id)} against ${sh(m.opp)}. Biggest swing on the board.`);
    say('B', F.T[id].bye >= .03
      ? `Win it and the bye odds sit at ${pc(m.bw)}. Lose it and they drop to ${pc(m.bl)}.`
      : `A win lifts the title odds from ${pc(m.tl)} to ${pc(m.tw)}. That is the whole season in one game.`);
  }

  rivalFacts().slice(0, 3).forEach(f => { say('A', `Rivalry file: ${f.title}.`); say('B', f.text); });

  say('A', 'That is the booth for now. Tap a driver on the board for the full story.');
  say('B', 'And remember: the mud always wins.');
  return out;
}
