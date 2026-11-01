import { TEAMS } from './model/league.js';

export const fmt = n => n.toFixed(2);
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const narrow = () => innerWidth < 640;
export const N = id => esc(TEAMS[id].name);
export const S = id => esc(TEAMS[id].short);
export const sw = id => `<i style="background:${TEAMS[id].color}"></i>`;
export const pc = x => x >= .995 ? '>99%' : x < .005 && x > 0 ? '<1%' : Math.round(x * 100) + '%';

import { FETCHED } from './model/league.js';
export const snap = () => FETCHED ? FETCHED.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
