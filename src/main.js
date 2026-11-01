import { fetchAll, startPolling, fetchHistory, loadPlayers } from './api/sleeper.js';
import { buildLeague, IDS, LIVE_WEEK, LAST, CUR, WARNINGS, PLAYER_IDS, PREV_ID } from './model/league.js';
import { PLAYERS, setPlayers } from './model/players.js';
import { buildHistory, rebuildH2H, HISTORY_READY } from './model/history.js';
import { statsThrough } from './model/stats.js';
import { resetForecast } from './model/forecast.js';
import { initArena } from './scene/arena.js';
import { app, act } from './state.js';
import { snap } from './util.js';
import { buildPicker, initHud, renderTable, renderLedger } from './ui/hud.js';
import { renderDash } from './ui/stats.js';
import { renderFc } from './ui/forecast.js';
import { renderSplash, initSplash } from './ui/splash.js';
import { renderDrivers, scrollToDriver } from './ui/drivers.js';
import { renderBooth } from './ui/booth.js';

const $ = id => document.getElementById(id);
let raw = null, arena = null, booted = false;

function setWeek(w) {
  app.week = w; app.ST = statsThrough(w);
  document.querySelectorAll('#weeks button').forEach((b, i) => b.classList.toggle('on', i + 1 === w));
  const live = w === LIVE_WEEK;
  $('wkLabel').textContent = 'Week ' + w + (live ? ' · live' : '');
  $('wkHint').textContent = live ? 'In progress · data as of ' + snap() : 'Stacks and pillars through week ' + w;
  $('thru').textContent = live ? 'thru wk ' + LAST : 'thru wk ' + w;
  if (arena) arena.setWeek(w, app.ST);
  renderTable();
  if (app.selected && app.view === 'arena') renderLedger(app.selected);
  renderDash(); renderFc(); renderDrivers(); renderBooth();
}

function select(id) {
  app.selected = id; renderTable(); renderDash(); renderFc(); renderDrivers();
  if (!id) { $('ledger').hidden = true; if (arena) arena.focus(null); return; }
  if (app.view === 'arena') renderLedger(id);
  if (arena) arena.focus(id);
}

const VIEWS = [['vArena', 'arena'], ['vDash', 'dash'], ['vFc', 'fc'], ['vDr', 'drivers']];
function setView(v) {
  app.view = v;
  document.body.classList.toggle('dashOn', v !== 'arena');
  $('dash').hidden = v === 'arena';
  $('wStats').hidden = v !== 'dash'; $('wFc').hidden = v !== 'fc'; $('wDr').hidden = v !== 'drivers';
  VIEWS.forEach(([b, n]) => $(b).setAttribute('aria-pressed', v === n));
  $('dash').scrollTop = 0;
  if (v === 'dash') renderDash();
  else if (v === 'fc') renderFc();
  else if (v === 'drivers') { renderDrivers(); scrollToDriver(app.selected); }
  else if (app.selected) renderLedger(app.selected);
}

Object.assign(act, { select, setWeek, setView });

// Player names and last season arrive after first paint; each one redraws the views that use it when it lands.
function refreshExtras() { renderDash(); renderFc(); renderDrivers(); renderBooth(); renderSplash(); }
function loadExtras() {
  loadPlayers(PLAYER_IDS).then(m => { setPlayers(m); refreshExtras(); }).catch(e => console.warn('Player names unavailable', e));
  if (PREV_ID) fetchHistory(PREV_ID).then(h => { buildHistory(h); refreshExtras(); }).catch(e => console.warn('Last season unavailable', e));
}

// Apply a fresh Sleeper payload: rebuild the model, drop cached odds, redraw whatever is showing.
function apply(next) {
  raw = next; buildLeague(raw); resetForecast();
  if (HISTORY_READY) rebuildH2H(); // this season's finished games feed the head-to-head history
  if (WARNINGS.length) console.warn('Data check:', WARNINGS);
  buildPicker();
  if (app.selected && !IDS.includes(app.selected)) app.selected = null;
  setWeek(Math.min(app.week, CUR));
  renderSplash();
  if (PLAYER_IDS.some(id => !PLAYERS[id])) loadPlayers(PLAYER_IDS).then(m => { setPlayers(m); refreshExtras(); }).catch(() => {});
}

function boot(first) {
  buildLeague(first); resetForecast(); raw = first;
  app.week = LAST > 0 ? LAST : CUR; // like the prototype: open on the last finished week, with the live week one tap away
  try { arena = initArena(); }
  catch (e) {
    console.warn('3D arena unavailable', e);
    $('stage').innerHTML = '<p class="nogl">The 3D arena needs WebGL, which this browser is not offering. Stats, Forecast and Drivers still work.</p>';
  }
  initHud(); initSplash(); buildPicker();
  VIEWS.forEach(([b, n]) => $(b).addEventListener('click', () => setView(n)));
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { renderDash(); renderFc(); }, 120); });
  setWeek(app.week); renderSplash();
  $('load').remove();
  if (arena) arena.start();
  startPolling(() => raw, apply);
  loadExtras();
  booted = true;
}

async function load() {
  $('err').hidden = true;
  try { boot(await fetchAll()); }
  catch (e) {
    console.error(e);
    $('errMsg').textContent = (e && e.message ? e.message + '. ' : '') + 'Check your connection and try again.';
    $('err').hidden = false;
  }
}

$('errRetry').addEventListener('click', () => { if (!booted) load(); });
load();
