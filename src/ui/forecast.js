import { IDS, TEAMS, WEEKS, LIVE_WEEK, LAST, REG_END, PLAYOFF_START, BRACKET } from '../model/league.js';
import { forecast, mustWin } from '../model/forecast.js';
import { app, act } from '../state.js';
import { fmt, N, S, sw, pc, snap } from '../util.js';
import { series, rec, HISTORY_READY } from '../model/history.js';

const seriesLine = g => { if (!HISTORY_READY) return ''; const e = series(g.a, g.b); return e.n ? `<div class="series">All-time: ${S(g.a)} ${rec(e)} ${S(g.b)}${e.streak && e.streak.n >= 2 ? `, ${S(e.streak.type === 'W' ? g.a : g.b)} won the last ${e.streak.n}` : ''}</div>` : ''; };

export function renderFc(){
  if(app.view!=='fc')return;
  const {week,selected,hiddenSeries}=app;
  const asOf=Math.min(week,LAST),F=forecast(asOf);
  const left=REG_END-F.K;
  document.getElementById('fSub').textContent=(F.K<1?'Preseason':`After week ${F.K}`)+(left>0?` · ${left} regular-season week${left===1?'':'s'} left`:F.bracket?' · playoffs under way':' · regular season complete')+` · ${F.NS.toLocaleString()} simulated ${F.bracket?'playoffs':'seasons'} · Sleeper data as of ${snap()}`;
  renderBracket(asOf);
  const order=IDS.slice().sort((a,b)=>F.T[b].title-F.T[a].title);
  const meter=(lab,v,c)=>`<div class="meter"><span class="ml">${lab}</span><b>${pc(v)}</b><div class="bar"><i style="width:${Math.max(1,v*100)}%;background:${c}"></i></div></div>`;
  document.getElementById('fOdds').innerHTML=order.map(id=>{const t=F.T[id];const pw=t.wins;
    return `<div class="orow ${selected===id?'on':''}" data-id="${id}"><div class="nm"><span class="who">${sw(id)}${N(id)}</span><small>Now ${F.w[id]}-${F.K-F.w[id]} · projected ${pw.toFixed(1)}-${(REG_END-pw).toFixed(1)}</small></div>
    <div class="pr" title="Projected weekly score">${F.mu[id].toFixed(0)} pts/wk</div>${meter('Bye',t.bye,TEAMS[id].color)}${meter('No. 1 seed',t.one,TEAMS[id].color)}${meter('Champion',t.title,'#f5b021')}</div>`;}).join('');
  document.querySelectorAll('#fOdds .orow[data-id]').forEach(el=>el.addEventListener('click',()=>act.select(+el.dataset.id===selected?null:+el.dataset.id)));
  // must-win
  document.getElementById('fMust').innerHTML=order.map(id=>{const m=mustWin(F,id);
    if(!m)return `<div class="mcard" style="--tc:${TEAMS[id].color}"><div class="n">${N(id)}</div><div class="g">No swing games left</div><div class="sw">Their seed is settled either way.</div></div>`;
    const tag=F.T[id].bye<.03?'The bye is out of reach, so this is the game that does the most for their title odds.':m.sw<.04?'Low stakes everywhere. This is the biggest one.':(m.bw>.5&&m.bl<.35?'Win and the bye is likely. Lose and it probably slips away.':'The biggest swing left on their schedule.');
    return `<div class="mcard" style="--tc:${TEAMS[id].color}"><div class="n">${N(id)}</div><div class="g">Week ${m.k} vs ${S(m.opp)} <span>· ${pc(m.p)} to win</span></div>
      <div class="sp"><div><small>If they win</small><b>${pc(m.bw)}</b> bye<br><b>${pc(m.tw)}</b> title</div><div><small>If they lose</small><b>${pc(m.bl)}</b> bye<br><b>${pc(m.tl)}</b> title</div></div>
      <div class="sw">${tag}</div></div>`;}).join('');
  // next week duels
  const nk=F.K+1;document.getElementById('fNextH').textContent=nk<=REG_END?`Week ${nk} picks`:'Regular season complete';
  document.getElementById('fNext').innerHTML=F.games.filter(g=>g.k===nk).map(g=>{const pa=g.aw/F.NS,pb=1-pa;
    const live=nk===LIVE_WEEK&&WEEKS[nk]?WEEKS[nk].find(r=>r[0]===g.a||r[2]===g.a):null;
    const ls=live?(live[0]===g.a?[live[1],live[3]]:[live[3],live[1]]):null;
    return `<div class="duel"><div class="row"><span>${S(g.a)}</span><span>${S(g.b)}</span></div>
      <div class="split"><i style="flex:${pa};background:${TEAMS[g.a].color}"></i><i style="flex:${pb};background:${TEAMS[g.b].color}"></i></div>
      <div class="pct"><span>${pc(pa)} · proj ${F.mu[g.a].toFixed(0)}</span>${ls&&(ls[0]||ls[1])?`<span>live ${fmt(ls[0])}–${fmt(ls[1])}</span>`:''}<span>proj ${F.mu[g.b].toFixed(0)} · ${pc(pb)}</span></div>${seriesLine(g)}</div>`;}).join('')
    +(nk===LIVE_WEEK?`<p class="sub" style="margin:2px 0 0">Picks are pregame odds. The live score so far is shown in the middle.</p>`:'');
  // legend + trend
  const lg=document.getElementById('fLegend');lg.innerHTML='';
  IDS.forEach(id=>{const b=document.createElement('button');b.innerHTML=`<i style="background:${TEAMS[id].color}"></i>${S(id)}`;b.classList.toggle('off',hiddenSeries.has(id));
    b.setAttribute('aria-pressed',!hiddenSeries.has(id));b.addEventListener('click',()=>{hiddenSeries.has(id)?hiddenSeries.delete(id):hiddenSeries.add(id);renderFc();});lg.appendChild(b);});
  drawTrend(asOf);
}
function drawTrend(asOf){
  const {selected,hiddenSeries}=app;
  const box=document.getElementById('fTrend'),W=Math.max(260,box.clientWidth-20),H=220,m={l:36,r:14,t:12,b:26};
  const ks=Array.from({length:asOf+1},(_,i)=>i),data=ks.map(k=>forecast(k).T);
  const X=k=>m.l+(asOf===0?0:k/asOf)*(W-m.l-m.r),max=Math.max(.4,Math.ceil(Math.max(...data.flatMap(t=>IDS.map(id=>t[id].title)))*10)/10),Y=v=>m.t+(1-v/max)*(H-m.t-m.b);
  let s=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Title odds after each week">`;
  for(let v=0;v<=max+1e-9;v+=.1)s+=`<line x1="${m.l}" x2="${W-m.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="rgba(241,236,226,.08)"/><text x="${m.l-6}" y="${Y(v)+3.5}" text-anchor="end" font-size="10.5" fill="#a9a49a" font-family="JetBrains Mono,monospace">${Math.round(v*100)}%</text>`;
  ks.forEach(k=>s+=`<text x="${X(k)}" y="${H-8}" text-anchor="middle" font-size="10.5" fill="#a9a49a" font-family="JetBrains Mono,monospace">${k===0?'Pre':'Wk '+k}</text>`);
  IDS.filter(id=>!hiddenSeries.has(id)).sort((a,b)=>(a===selected)-(b===selected)).forEach(id=>{const c=TEAMS[id].color,dim=selected&&selected!==id;
    const p=ks.map(k=>[X(k),Y(data[k][id].title)]);
    s+=`<polyline fill="none" stroke="${c}" stroke-width="${selected===id?3:2}" stroke-linejoin="round" opacity="${dim?.18:1}" points="${p.map(q=>q.join(',')).join(' ')}"/>`;
    const e=p[p.length-1];s+=`<circle cx="${e[0]}" cy="${e[1]}" r="4" fill="${c}" stroke="#1b1f27" stroke-width="2" opacity="${dim?.18:1}"/>`;});
  s+=`<line id="xh2" x1="0" x2="0" y1="${m.t}" y2="${H-m.b}" stroke="rgba(241,236,226,.35)" visibility="hidden"/><rect x="${m.l-10}" y="0" width="${W-m.l-m.r+20}" height="${H}" fill="transparent" id="hit2"/></svg><div class="tip" hidden></div>`;
  box.innerHTML=s;
  const hit=box.querySelector('#hit2'),xh=box.querySelector('#xh2'),tip=box.querySelector('.tip');
  const show=e=>{const x=e.clientX-box.querySelector('svg').getBoundingClientRect().left;const k=Math.max(0,Math.min(asOf,Math.round(asOf===0?0:(x-m.l)/(W-m.l-m.r)*asOf)));
    xh.setAttribute('x1',X(k));xh.setAttribute('x2',X(k));xh.setAttribute('visibility','visible');
    tip.innerHTML=`<div class="t">${k===0?'Preseason':'After week '+k}</div>`+IDS.slice().sort((a,b)=>data[k][b].title-data[k][a].title).map(id=>`<div class="r">${sw(id)}${S(id)}<span>${pc(data[k][id].title)}</span></div>`).join('');
    tip.hidden=false;let left=X(k)+18;if(left+tip.offsetWidth>W)left=X(k)-tip.offsetWidth-8;tip.style.left=(left+10)+'px';tip.style.top='14px';};
  hit.addEventListener('pointermove',show);hit.addEventListener('pointerdown',show);hit.addEventListener('pointerleave',()=>{tip.hidden=true;xh.setAttribute('visibility','hidden');});
}

/* Playoff bracket from /winners_bracket, shown once the playoffs are seeded. Scores come from the matchup feed. */
function renderBracket(asOf){
  const sec=document.getElementById('fBrSec'),box=document.getElementById('fBracket');
  const ms=BRACKET.filter(m=>!(m.p>1)).slice().sort((a,b)=>(a.r-b.r)||(a.m-b.m));
  // Sleeper publishes a placeholder bracket early; only show it once the regular season is over and seeds are final.
  const show=ms.length&&LAST>=REG_END;sec.hidden=!show;if(!show){box.innerHTML='';return;}
  const rounds=[...new Set(ms.map(m=>m.r))],last=rounds[rounds.length-1];
  const score=(id,wk)=>{const g=(WEEKS[wk]||[]).find(r=>r[0]===id||r[2]===id);return g?(g[0]===id?g[1]:g[3]):null;};
  const side=(m,n,wk)=>{const id=m['t'+n],f=m['t'+n+'_from'];
    if(id==null&&!f)return `<div class="bt"><span class="nm">TBD</span></div>`;
    if(id==null){const lose=f.l!=null;return `<div class="bt"><span class="nm dim">${lose?'Loser':'Winner'} of game ${lose?f.l:f.w}</span></div>`;}
    const sc=wk<=Math.max(LAST,0)||wk===LIVE_WEEK?score(id,wk):null;
    return `<div class="bt${m.w===id?' win':''}${selectedClass(id)}"><span class="nm">${sw(id)}${S(id)}</span>${sc!=null?`<span class="sc">${fmt(sc)}</span>`:''}</div>`;};
  const selectedClass=id=>app.selected===id?' sel':'';
  box.innerHTML=rounds.map(r=>{const wk=PLAYOFF_START+r-1;
    return `<div class="brd"><h4>${r===last?'Final':'Round '+r} <small>wk ${wk}</small></h4>${ms.filter(m=>m.r===r).map(m=>`<div class="bg">${side(m,1,wk)}${side(m,2,wk)}</div>`).join('')}</div>`;}).join('');
}
