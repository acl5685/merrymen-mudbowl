// Pulls live Sleeper data and prints the numbers from spec section 6.4 so the port can be checked by eye.
import { fetchAll } from '../src/api/sleeper.js';
import * as L from '../src/model/league.js';
import { analytics } from '../src/model/stats.js';
import { forecast, mustWin } from '../src/model/forecast.js';
import { pc } from '../src/util.js';

const raw = await fetchAll();
L.buildLeague(raw);
console.log(`${L.LEAGUE_NAME}: last final week ${L.LAST}, live week ${L.LIVE_WEEK}, regular season ends ${L.REG_END}`);
console.log(L.WARNINGS.length ? 'WARNINGS:\n' + L.WARNINGS.join('\n') : 'Weekly points match Sleeper totals.');

const asOf = Number(process.argv[2] || L.LAST);
const R = analytics(asOf), F = forecast(asOf);
console.log(`\nAfter week ${F.K} (sd ${F.sd.toFixed(1)})`);
console.log('Team'.padEnd(11), 'ExpW  Bye   1seed Title  AllPlay  Luck   Must-win');
for (const id of L.IDS.slice().sort((a, b) => F.T[b].title - F.T[a].title)) {
  const t = F.T[id], a = R.A[id], m = mustWin(F, id), nm = L.TEAMS[id].short;
  const mw = m ? `Wk ${m.k} vs ${L.TEAMS[m.opp].short} (bye ${pc(m.bw)} / ${pc(m.bl)}, title ${pc(m.tw)} / ${pc(m.tl)})` : '-';
  console.log(nm.padEnd(11), t.wins.toFixed(1).padEnd(5), pc(t.bye).padEnd(5), pc(t.one).padEnd(5), pc(t.title).padEnd(6), `${a.aw}-${a.al}`.padEnd(8), (a.luck >= 0 ? '+' : '') + a.luck.toFixed(1), ' ', mw);
}
