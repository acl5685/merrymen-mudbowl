import { IDS, TEAMS, LIVE_WEEK, LAST, REG_END, CUR } from '../model/league.js';
import { analytics, awardList } from '../model/stats.js';
import { forecast } from '../model/forecast.js';
import { app, act } from '../state.js';
import { esc, N, pc, snap } from '../util.js';
import { renderBooth, initBooth } from './booth.js';

function strapFor(F, fav) {
  const lead = `Six drivers. One trophy. `;
  if (LAST >= 17 && !LIVE_WEEK) return `${lead}The season is in the books. Check the Stats for the final word.`;
  if (LAST < 1 && !LIVE_WEEK) return `${lead}The engines are warming up.`;
  const where = LIVE_WEEK ? `Week ${LIVE_WEEK} is underway` : `Week ${LAST} is in the books`;
  return `${lead}${where} and <b>${N(fav)}</b> is the title favorite at ${pc(F.T[fav].title)}.`;
}

export function renderSplash() {
  const F = forecast(LAST), R = analytics(LAST), order = app.ST.order;
  const fav = IDS.slice().sort((a, b) => F.T[b].title - F.T[a].title)[0];
  document.getElementById('spStrap').innerHTML = strapFor(F, fav);
  renderBooth();
  const facts = awardList(R).map(([k, id, d]) => `<span><b>${esc(k)}</b>${N(id)}: ${esc(d)}</span>`).join('') || '<span><b>Coming up</b>The first awards are handed out after Week 1.</span>';
  document.getElementById('spTicker').innerHTML = facts + facts;
  document.getElementById('spFine').textContent = 'Scores from Sleeper as of ' + snap() + '.';
}

export function closeSplash(v) { document.getElementById('splash').hidden = true; act.setView(v); }

// Back to the booth from any view.
export function showSplash() { document.getElementById('splash').hidden = false; document.getElementById('splash').scrollTop = 0; renderSplash(); }

export function initSplash() {
  document.getElementById('spGo').addEventListener('click', () => closeSplash('arena'));
  document.getElementById('spStats').addEventListener('click', () => closeSplash('dash'));
  document.getElementById('spFc').addEventListener('click', () => closeSplash('fc'));
  document.getElementById('spDr').addEventListener('click', () => closeSplash('drivers'));
  document.querySelectorAll('[data-home]').forEach(b => b.addEventListener('click', showSplash));
  initBooth();
}
