import { driverFor } from '../config/drivers.js';
import { profileFor } from '../config/profiles.js';

/* The league as the rest of the app sees it. These are live ES-module bindings: buildLeague() reassigns them
   and every importer sees the new values, so the ported prototype code can keep its original names.

   WEEKS    = { 1: [[rosterA, ptsA, rosterB, ptsB], ...], ... }   final weeks + the live week
   SCHEDULE = { 9: [[a, b], ...], ... }                           regular-season weeks not yet played */
export let TEAMS = {};
export let IDS = [];
export let WEEKS = {};
export let SCHEDULE = {};
export let BRACKET = [];          // /winners_bracket rows, [] until the playoffs are seeded
export let PLAYOFF_START = 15;
export let REG_END = 14;          // last regular-season week
export let LAST = 0;              // last final week (settings.last_scored_leg)
export let LIVE_WEEK = null;      // settings.leg while it is still being played, else null
export let CUR = 1;               // newest week the picker offers
export let LAST_CHAMP = null;     // roster id of the defending champion
export let FETCHED = null;
export let WARNINGS = [];
export let LEAGUE_NAME = '';
export let STARTS = {};          // STARTS[week][rosterId] = [[playerId, points], ...] (the best-ball lineup)
export let ROSTERS = {};         // rosterId -> player ids on the roster
export let FORM = {};            // rosterId -> Sleeper's own { record: 'WLLWWWW', streak: '4W' }
export let PREV_ID = '';         // last season's league id
export let PLAYER_IDS = [];      // every player id we might need a name for

const MAX_WEEK = 17;
const round2 = x => Math.round((x || 0) * 100) / 100;

// Two rows sharing a matchup_id are one game. Pair order follows matchup_id, then the API's row order.
export function pairsOf(rows) {
  const by = new Map();
  (rows || []).forEach(r => {
    if (r.matchup_id == null) return; // bye
    if (!by.has(r.matchup_id)) by.set(r.matchup_id, []);
    by.get(r.matchup_id).push(r);
  });
  return [...by.entries()].sort((a, b) => a[0] - b[0]).filter(([, g]) => g.length === 2)
    .map(([, g]) => [g[0].roster_id, round2(g[0].points), g[1].roster_id, round2(g[1].points)]);
}

export function buildLeague(raw) {
  const { league, users, rosters, matchups, bracket, fetchedAt } = raw;
  const st = league.settings || {};

  PLAYOFF_START = st.playoff_week_start || 15;
  REG_END = PLAYOFF_START - 1;
  const leg = Math.min(MAX_WEEK, Math.max(1, st.leg || 1));
  LAST = Math.min(MAX_WEEK, st.last_scored_leg || 0);
  LIVE_WEEK = leg > LAST ? leg : null;
  CUR = LIVE_WEEK || Math.max(1, LAST);
  LAST_CHAMP = Number(league.metadata && league.metadata.latest_league_winner_roster_id) || null;
  LEAGUE_NAME = league.name || '';
  FETCHED = fetchedAt || new Date();
  BRACKET = Array.isArray(bracket) ? bracket : [];

  const userById = Object.fromEntries((users || []).map(u => [u.user_id, u]));
  const teams = {};
  const ids = [];
  rosters.slice().sort((a, b) => a.roster_id - b.roster_id).forEach((r, i) => {
    const u = userById[r.owner_id] || {};
    const d = driverFor(r.owner_id, i, u);
    teams[r.roster_id] = {
      id: r.roster_id, ownerId: r.owner_id,
      name: d.persona, short: d.short, theme: d.theme, color: d.color,
      team: (u.metadata && u.metadata.team_name) || d.teamName || u.display_name || 'Roster ' + r.roster_id,
      handle: (u.display_name || '') + (u.is_owner ? ' · commish' : ''),
      avatar: u.avatar ? 'https://sleepercdn.com/avatars/thumbs/' + u.avatar : null,
      profile: profileFor(r.owner_id, d)
    };
    ids.push(r.roster_id);
  });
  TEAMS = teams; IDS = ids;

  const weeks = {}, sched = {};
  for (let w = 1; w <= MAX_WEEK; w++) {
    const pairs = pairsOf(matchups[w]);
    if (!pairs.length) continue;
    if (w <= LAST || w === LIVE_WEEK) weeks[w] = pairs;
    else if (w <= REG_END) sched[w] = pairs.map(p => [p[0], p[2]]);
  }
  WEEKS = weeks; SCHEDULE = sched;

  // Player level: the matchup rows carry the lineup and each starter's points.
  const starts = {};
  Object.keys(weeks).forEach(w => {
    starts[w] = {};
    (matchups[w] || []).forEach(r => {
      if (r.matchup_id == null || !r.starters) return;
      starts[w][r.roster_id] = r.starters.map((p, i) => [p, (r.starters_points && r.starters_points[i]) || 0]).filter(x => x[0] && x[0] !== '0');
    });
  });
  STARTS = starts;
  ROSTERS = Object.fromEntries(rosters.map(r => [r.roster_id, (r.players || []).slice()]));
  FORM = Object.fromEntries(rosters.map(r => [r.roster_id, { record: (r.metadata && r.metadata.record) || '', streak: (r.metadata && r.metadata.streak) || '' }]));
  PREV_ID = league.previous_league_id || '';
  PLAYER_IDS = [...new Set([...rosters.flatMap(r => r.players || []), ...Object.values(starts).flatMap(m => Object.values(m).flatMap(a => a.map(x => x[0])))])];

  // Summed weekly points should equal what Sleeper reports for the roster.
  const warnings = [];
  if (LAST <= REG_END) {
    rosters.forEach(r => {
      let sum = 0;
      for (let w = 1; w <= LAST; w++) (weeks[w] || []).forEach(([a, pa, b, pb]) => { if (a === r.roster_id) sum += pa; if (b === r.roster_id) sum += pb; });
      const api = (r.settings.fpts || 0) + (r.settings.fpts_decimal || 0) / 100;
      if (Math.abs(sum - api) > 0.05) warnings.push(`${teams[r.roster_id].short}: weekly points add up to ${sum.toFixed(2)} but Sleeper reports ${api.toFixed(2)}`);
    });
  }
  // Sleeper's own record string (one letter per scored week) should match what we computed from the scores.
  if (LAST <= REG_END) rosters.forEach(r => {
    const rec = FORM[r.roster_id].record; if (!rec) return;
    let c = '';
    for (let w = 1; w <= LAST; w++) { const g = (weeks[w] || []).find(x => x[0] === r.roster_id || x[2] === r.roster_id); if (!g) continue;
      const mine = g[0] === r.roster_id ? g[1] : g[3], th = g[0] === r.roster_id ? g[3] : g[1]; c += mine > th ? 'W' : mine < th ? 'L' : 'T'; }
    if (c !== rec) warnings.push(`${teams[r.roster_id].short}: Sleeper's record string is ${rec} but the scores say ${c}`);
  });
  WARNINGS = warnings;
  if (warnings.length) console.warn('Sleeper totals do not match the weekly scores:\n' + warnings.join('\n'));
}
