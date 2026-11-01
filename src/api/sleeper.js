// Sleeper public API: fetch everything once, then re-fetch only the live week on a timer.
export const LEAGUE_ID = '1389705305679486976';
const BASE = 'https://api.sleeper.app/v1';
const MAX_WEEK = 17;
const L = `/league/${LEAGUE_ID}`;

async function get(path, optional = false) {
  const res = await fetch(BASE + path);
  if (!res.ok) {
    if (optional) return null;
    throw new Error(`Sleeper answered ${res.status} for ${path}`);
  }
  return res.json();
}

export async function fetchAll() {
  const weeks = Array.from({ length: MAX_WEEK }, (_, i) => i + 1);
  const [state, league, users, rosters, bracket, ...mu] = await Promise.all([
    get('/state/nfl'), get(L), get(L + '/users'), get(L + '/rosters'), get(L + '/winners_bracket', true),
    ...weeks.map(w => get(`${L}/matchups/${w}`, true))
  ]);
  return { state, league, users, rosters, bracket: bracket || [],
    matchups: Object.fromEntries(weeks.map((w, i) => [w, mu[i] || []])), fetchedAt: new Date() };
}

// Re-fetch the standings plus the current and previous week (so a week that just finalised is picked up).
export async function refreshLive(raw) {
  const [state, league, rosters, bracket] = await Promise.all([
    get('/state/nfl'), get(L), get(L + '/rosters'), get(L + '/winners_bracket', true)]);
  const leg = Math.min(MAX_WEEK, Math.max(1, league.settings.leg || 1));
  const wk = [...new Set([Math.max(1, leg - 1), leg])];
  const rows = await Promise.all(wk.map(w => get(`${L}/matchups/${w}`, true)));
  const matchups = { ...raw.matchups };
  wk.forEach((w, i) => { matchups[w] = rows[i] || []; });
  return { ...raw, state, league, rosters, bracket: bracket || [], matchups, fetchedAt: new Date() };
}

// Sundays and Mondays only; every other day the data loads once.
export const inPollWindow = (d = new Date()) => d.getDay() === 0 || d.getDay() === 1;

export function startPolling(getRaw, onUpdate, every = 60000) {
  return setInterval(async () => {
    if (!inPollWindow() || document.hidden) return;
    try { onUpdate(await refreshLive(getRaw())); } catch (e) { console.warn('Live refresh failed', e); }
  }, every);
}

// Last season (previous_league_id): same shape as the live league, fetched once and kept for head-to-head history.
export async function fetchHistory(prevId) {
  const P = `/league/${prevId}`;
  const weeks = Array.from({ length: MAX_WEEK }, (_, i) => i + 1);
  const [league, rosters, ...mu] = await Promise.all([get(P), get(P + '/rosters'), ...weeks.map(w => get(`${P}/matchups/${w}`, true))]);
  return { league, rosters, matchups: Object.fromEntries(weeks.map((w, i) => [w, mu[i] || []])) };
}

// Player names. Sleeper's list is ~2.6 MB gzipped, so fetch it only for ids we haven't cached, and keep just the
// few we use ([name, position, team]) in localStorage.
const PKEY = 'mudbowl.players.v1';
export async function loadPlayers(ids) {
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(PKEY) || '{}'); } catch (e) { /* private mode: start empty */ }
  const missing = ids.filter(id => !cache[id]);
  if (missing.length) {
    const all = await get('/players/nfl');
    missing.forEach(id => {
      const p = all[id];
      cache[id] = p ? [p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || id, p.position || '?', p.team || 'FA'] : [id, '?', ''];
    });
    try { localStorage.setItem(PKEY, JSON.stringify(cache)); } catch (e) { /* quota or private mode */ }
  }
  return cache;
}
