import { IDS, TEAMS, WEEKS, LIVE_WEEK, CUR, REG_END } from '../model/league.js';
import { statsThrough } from '../model/stats.js';
import { app, act } from '../state.js';
import { esc, fmt } from '../util.js';

const $ = id => document.getElementById(id);

// One button per week from 1 up to the newest; the live week gets the pulsing dot.
export function buildPicker() {
  const el = $('weeks'); el.innerHTML = '';
  el.style.setProperty('--nw', CUR);
  for (let w = 1; w <= CUR; w++) {
    const b = document.createElement('button'); b.id = 'wk' + w; b.textContent = w;
    if (w === LIVE_WEEK) b.classList.add('live');
    b.setAttribute('aria-label', 'Week ' + w + (w === LIVE_WEEK ? ' (in progress)' : ''));
    b.addEventListener('click', () => act.setWeek(w)); el.appendChild(b);
  }
}

export function initHud() {
  $('tableToggle').addEventListener('click', e => { const o = $('table').classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); });
  $('lgClose').addEventListener('click', () => act.select(null));
  $('lgProf').addEventListener('click', () => act.setView('drivers'));
}

export function renderTable() {
  const { ST, selected } = app;
  const ol = $('rows'); ol.innerHTML = '';
  ST.order.forEach(id => { const s = ST.s[id]; const li = document.createElement('li'); const b = document.createElement('button');
    if (id === selected) b.classList.add('on');
    b.innerHTML = `<span class="rk">${s.rank}</span><span class="sw" style="background:${TEAMS[id].color}"></span><span class="nm"></span><span class="rec">${s.w}-${s.l}</span>`;
    b.querySelector('.nm').textContent = TEAMS[id].name; b.addEventListener('click', () => act.select(id)); li.appendChild(b); ol.appendChild(li); });
}

export function renderLedger(id) {
  const { ST, week } = app, s = ST.s[id], t = TEAMS[id];
  $('ledger').style.setProperty('--tc', t.color);
  $('lgName').textContent = t.name;
  $('lgHandle').textContent = `#${s.rank} · ${t.team} · ${t.handle}`;
  $('lgRec').textContent = s.w + '-' + s.l + (s.t ? '-' + s.t : '');
  $('lgPF').textContent = s.pf.toFixed(1);
  $('lgPA').textContent = s.pa.toFixed(1);
  $('lgStk').textContent = s.streak;
  const all = statsThrough(CUR).s[id], svg = $('lgBars'), W = 520, H = 84, max = 200, n = CUR, bw = W / n, y150 = H - 14 - (150 / max) * (H - 24);
  let out = `<line x1="0" y1="${y150}" x2="${W}" y2="${y150}" stroke="rgba(241,236,226,.18)" stroke-dasharray="3 4"/><text x="${W - 2}" y="${y150 - 3}" text-anchor="end" font-size="9" fill="#a9a49a" font-family="JetBrains Mono,monospace">150</text>`;
  for (let k = 1; k <= n; k++) {
    const v = all.scores[k] || 0, h = v / max * (H - 24), x = (k - 1) * bw + bw * .18, r = all.resBy[k], op = k <= week ? 1 : .3;
    const fill = k === LIVE_WEEK ? '#ff6a2b' : (r === 'W' ? '#8fd17c' : '#ee7a64');
    if (v > 0 || k === LIVE_WEEK) out += `<rect x="${x}" y="${H - 14 - h}" width="${bw * .64}" height="${Math.max(h, 1)}" rx="2" fill="${fill}" opacity="${op}"/>`;
    out += `<text x="${x + bw * .32}" y="${H - 2}" text-anchor="middle" font-size="10" fill="#a9a49a" font-family="JetBrains Mono,monospace">${k}</text>`;
    if (v > 0) out += `<text x="${x + bw * .32}" y="${H - 17 - h}" text-anchor="middle" font-size="9.5" fill="#f1ece2" opacity="${op}" font-family="JetBrains Mono,monospace">${Math.round(v)}</text>`;
  }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = out;
  const m = (WEEKS[week] || []).find(r => r[0] === id || r[2] === id);
  if (!m) { $('lgNote').textContent = week > REG_END ? `Week ${week}: no game, a playoff bye or an early exit.` : `Week ${week}: no game on the schedule.`; }
  else {
    const mine = m[0] === id ? m[1] : m[3], opp = m[0] === id ? m[2] : m[0], theirs = m[0] === id ? m[3] : m[1];
    $('lgNote').innerHTML = week === LIVE_WEEK
      ? `Week ${LIVE_WEEK} vs <b>${esc(TEAMS[opp].name)}</b>: ${fmt(mine)} to ${fmt(theirs)} so far.`
      : `Week ${week}: ${mine > theirs ? 'crushed' : 'got crushed by'} <b>${esc(TEAMS[opp].name)}</b>, ${fmt(mine)} to ${fmt(theirs)}.`;
  }
  $('ledger').hidden = false;
}
