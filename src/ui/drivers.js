import { TEAMS, LAST, LAST_CHAMP } from '../model/league.js';
import { analytics } from '../model/stats.js';
import { forecast } from '../model/forecast.js';
import { driverBio } from '../model/bios.js';
import { app, act } from '../state.js';
import { esc, N, pc, S } from '../util.js';
import { rosterBoard, pinfo, formFor, havePlayers, POS_ORDER } from '../model/players.js';
import { allTime, nemesis, victim, series, rec, HISTORY_READY } from '../model/history.js';

const pips = f => f.pips.slice(-7).map(r => `<i class="p ${r}" title="${r === 'W' ? 'Win' : r === 'L' ? 'Loss' : 'Tie'}">${r}</i>`).join('');
const pn = pid => { const p = pinfo(pid); return `<b>${esc(p.name)}</b><span>${esc(p.pos)}${p.team ? ' · ' + esc(p.team) : ''}</span>`; };

/* Driver profiles: persona, truck, a bio written from the live stats, and the made-up driving years. */
export function renderDrivers() {
  if (app.view !== 'drivers') return;
  const { week, selected, ST } = app;
  const R = analytics(week), F = forecast(Math.min(week, LAST));
  document.getElementById('drSub').textContent = R.K < 1 ? 'Meet the field. The bios fill in once games are played.' : `Bios update as the season does. Stats through week ${R.K}.`;
  document.getElementById('drCards').innerHTML = ST.order.map(id => {
    const t = TEAMS[id], p = t.profile, b = driverBio(id, R, ST, week), s = ST.s[id], fm = formFor(id, week, ST);
    const at = HISTORY_READY ? allTime(id) : null;
    const chips = b.facts.concat([['Title odds', pc(F.T[id].title)], ['Streak', fm.streak], ...(at ? [['All-time', at.w + '-' + at.l]] : [])]);
    const nem = HISTORY_READY ? nemesis(id) : null, vic = HISTORY_READY ? victim(id) : null;
    const board = rosterBoard(id, R.K), engines = board.filter(x => x.pts > 0).slice(0, 5);
    const byPos = POS_ORDER.map(pos => [pos, board.filter(x => pinfo(x.pid).pos === pos)]).filter(x => x[1].length);
    return `<article class="pcard${selected === id ? ' on' : ''}" id="pc${id}" style="--tc:${t.color}">
      <header data-id="${id}" tabindex="0" role="button" aria-label="Select ${esc(t.name)}">
        ${t.avatar ? `<img class="av" src="${esc(t.avatar)}" alt="" width="44" height="44" loading="lazy">` : ''}
        <div class="who2"><h3>${N(id)}</h3><div class="sub2">${esc(t.team)} · ${esc(t.handle)}</div></div>
        <span class="prk">#${s.rank}</span>
      </header>
      <p class="tagline">${esc(p.tagline)}</p>
      ${id === LAST_CHAMP ? '<p class="champ">Defending champion</p>' : ''}
      <dl class="pmeta"><div><dt>Truck</dt><dd>${esc(p.truck)}</dd></div><div><dt>Hometown</dt><dd>${esc(p.hometown)}</dd></div><div><dt>Catchphrase</dt><dd>${esc(p.catchphrase)}</dd></div></dl>
      <div class="pchips">${chips.map(([k, v]) => `<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>
      <div class="formrow"><span>Form</span><span class="pipset">${pips(fm)}</span><small>${fm.source === 'Sleeper' ? 'straight from Sleeper' : 'from the scores'}</small></div>
      <h4>Driver bio</h4>
      ${b.paras.map(x => `<p class="bio">${esc(x)}</p>`).join('')}
      ${b.next ? `<p class="next">Next up: week ${b.next.week} vs <b>${S(b.next.opp)}</b></p>` : ''}
      ${HISTORY_READY ? `<p class="rivals">${nem ? `Nemesis: <b>${S(nem)}</b> (${rec(series(id, nem))})` : 'No nemesis yet'} · ${vic ? `Favorite victim: <b>${S(vic)}</b> (${rec(series(id, vic))})` : 'No favorite victim yet'}</p>` : '<p class="rivals">Loading last season…</p>'}
      <h4>Top engines</h4>
      ${engines.length ? `<ol class="eng">${engines.map(x => `<li>${pn(x.pid)}<em>${x.pts.toFixed(1)}</em></li>`).join('')}</ol>` : '<p class="bio dim">Player scoring shows up after the first games.</p>'}
      <details class="roster"><summary>Full roster (${board.length})</summary>${havePlayers() ? byPos.map(([pos, list]) => `<div class="rpos"><small>${pos}</small>${list.map(x => `<div class="rp">${pn(x.pid)}<em>${x.pts ? x.pts.toFixed(1) : ''}</em></div>`).join('')}</div>`).join('') : '<p class="bio dim">Loading player names…</p>'}</details>
      <h4>The driving years</h4>
      <ol class="era">${p.era.map(e => `<li><b>${e.y}</b><span>${esc(e.t)}</span></li>`).join('')}</ol>
    </article>`;
  }).join('');
  document.querySelectorAll('#drCards header[data-id]').forEach(h => {
    const go = () => act.select(+h.dataset.id === selected ? null : +h.dataset.id);
    h.addEventListener('click', go);
    h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
}

export function scrollToDriver(id) {
  const el = id && document.getElementById('pc' + id);
  if (el) el.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
