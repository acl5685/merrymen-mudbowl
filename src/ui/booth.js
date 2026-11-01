import { IDS, TEAMS, LAST } from '../model/league.js';
import { analytics } from '../model/stats.js';
import { forecast } from '../model/forecast.js';
import { buildCommentary, CAST } from '../model/commentary.js';
import { app, act } from '../state.js';
import { esc, N, pc } from '../util.js';
import { formFor } from '../model/players.js';

/* The commentators' booth plus the broadcast leaderboard on the splash, and a one-line mini booth in the arena.
   Both booths share one script and one position, so tapping Next in either moves the other. */
const $ = id => document.getElementById(id);
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let lines = [], idx = 0, sort = 'standings', manual = false;

const SORTS = [['standings', 'Standings'], ['odds', 'Title odds'], ['scoring', 'Scoring'], ['luck', 'Luck']];

function context() {
  const w = app.week;
  return { w, ST: app.ST, R: analytics(w), F: forecast(Math.min(w, LAST)) };
}

function paint() {
  if (!lines.length) return;
  const l = lines[idx], a = CAST.find(c => c.id === l.who);
  if ($('boothSay')) {
    $('boothSay').textContent = l.text;
    $('boothName').textContent = a.name + ' · ' + a.role;
    $('boothPos').textContent = `${idx + 1} / ${lines.length}`;
    document.querySelectorAll('#cast .ann').forEach(el => el.classList.toggle('on', el.dataset.id === l.who));
    $('cast').style.setProperty('--sc', a.color);
  }
  if ($('miniSay')) { $('miniWho').textContent = a.short; $('miniWho').style.setProperty('--sc', a.color); $('miniSay').textContent = l.text; }
}

function go(d, byUser = true) {
  if (!lines.length) return;
  idx = (idx + d + lines.length) % lines.length;
  if (byUser) manual = true; // once someone takes the controls, stop auto-advancing
  paint();
}

function board(c) {
  const { ST, R, F } = c, A = R.A;
  const val = {
    standings: id => ST.s[id].pf, odds: id => F.T[id].title,
    scoring: id => A[id].avg || 0, luck: id => A[id].luck || 0
  }[sort];
  const text = { standings: v => v.toFixed(1) + ' pts', odds: v => pc(v), scoring: v => v.toFixed(1) + ' avg', luck: v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) }[sort];
  const order = sort === 'standings' ? ST.order : IDS.slice().sort((a, b) => val(b) - val(a));
  const max = Math.max(...IDS.map(id => Math.abs(val(id))), 1e-9);
  $('boardSort').innerHTML = SORTS.map(([k, label]) => `<button data-sort="${k}" aria-pressed="${k === sort}">${label}</button>`).join('');
  $('boardRows').innerHTML = order.map((id, i) => {
    const s = ST.s[id], v = val(id), neg = v < 0, f = formFor(id, c.w, ST);
    return `<li><button class="brow" data-id="${id}" style="--tc:${TEAMS[id].color}" aria-label="${esc(TEAMS[id].name)}, rank ${i + 1}">
      <span class="rk">${i + 1}</span>
      <span class="nm"><b>${N(id)}</b><small>${esc(TEAMS[id].team)}</small></span>
      <span class="rec">${s.w}-${s.l}<span class="pips sm">${f.pips.slice(-5).map(r => `<i class="p ${r}"></i>`).join('')}</span></span>
      <span class="val"><i class="${neg ? 'neg' : ''}" style="width:${Math.max(4, Math.abs(v) / max * 100)}%"></i><em>${text(v)}</em></span></button></li>`;
  }).join('');
  document.querySelectorAll('#boardSort button').forEach(b => b.addEventListener('click', () => { sort = b.dataset.sort; board(context()); }));
  document.querySelectorAll('#boardRows .brow').forEach(b => b.addEventListener('click', () => {
    $('splash').hidden = true; act.setView('arena'); act.select(+b.dataset.id);
  }));
}

export function renderBooth() {
  const c = context();
  lines = buildCommentary(c);
  idx = Math.min(idx, Math.max(0, lines.length - 1));
  paint(); board(c);
}

export function initBooth() {
  $('boothNext').addEventListener('click', () => go(1));
  $('boothPrev').addEventListener('click', () => go(-1));
  $('boothSay').addEventListener('click', () => go(1));
  $('miniNext').addEventListener('click', () => go(1));
  if (!reduce()) setInterval(() => {
    if (manual || document.hidden) return;
    if ($('splash').hidden && app.view !== 'arena') return;
    go(1, false);
  }, 8000);
}
