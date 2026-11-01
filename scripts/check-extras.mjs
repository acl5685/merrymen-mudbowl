// Checks the player, form and head-to-head models against live Sleeper data.
import { fetchAll, fetchHistory, loadPlayers } from '../src/api/sleeper.js';
import * as L from '../src/model/league.js';
import { setPlayers, pinfo, weekTop, seasonTotals, rosterBoard, carry } from '../src/model/players.js';
import { buildHistory, series, rec, nemesis, victim, allTime, rivalFacts } from '../src/model/history.js';
import { statsThrough } from '../src/model/stats.js';
import { formFor } from '../src/model/players.js';

globalThis.localStorage = { getItem: () => null, setItem() {} };
const raw = await fetchAll(); L.buildLeague(raw);
console.log('warnings:', L.WARNINGS.length ? L.WARNINGS : 'none (Sleeper record strings match the scores)');
setPlayers(await loadPlayers(L.PLAYER_IDS));
const ST = statsThrough(L.LAST);
const top = weekTop(L.LAST, 3).map(t => `${pinfo(t.pid).name} (${pinfo(t.pid).pos}) ${t.pts} for ${L.TEAMS[t.rid].short}`);
console.log('\nTop players, week', L.LAST + ':', top.join(' | '));
console.log('Season leaders:', seasonTotals(L.LAST).slice(0, 4).map(t => `${pinfo(t.pid).name} ${t.pts.toFixed(1)}`).join(' | '));
const sample = L.IDS[0];
console.log(`${L.TEAMS[sample].short} roster:`, rosterBoard(sample, L.LAST).slice(0, 5).map(p => `${pinfo(p.pid).name} ${pinfo(p.pid).pos} ${p.pts.toFixed(1)}`).join(' | '));
console.log('carry', L.IDS.map(id => { const c = carry(id, L.LAST, ST.s[id].pf); return `${L.TEAMS[id].short} ${(c.share * 100).toFixed(0)}% ${pinfo(c.pid).name}`; }).join(' | '));
console.log('\nForm:', L.IDS.map(id => { const f = formFor(id, L.LAST, ST); return `${L.TEAMS[id].short} ${f.pips.join('')} ${f.streak} [${f.source}]`; }).join('\n      '));
buildHistory(await fetchHistory(L.PREV_ID));
console.log('\nSeries (all games, both seasons):');
L.IDS.forEach(x => console.log(L.TEAMS[x].short.padEnd(10), L.IDS.filter(y => y !== x).map(y => `${L.TEAMS[y].short} ${rec(series(x, y))}`).join('  '),
  '| nemesis', nemesis(x) ? L.TEAMS[nemesis(x)].short : '-', '| victim', victim(x) ? L.TEAMS[victim(x)].short : '-', '| all-time', JSON.stringify((({ w, l }) => ({ w, l }))(allTime(x)))));
console.log('\nFacts:\n' + rivalFacts().map(f => `${f.title}: ${f.text}`).join('\n'));
