import { IDS, TEAMS, LIVE_WEEK } from '../model/league.js';
import { analytics, awardList, swapMatrix } from '../model/stats.js';
import { app, act } from '../state.js';
import { weekTop, seasonTotals, pinfo, havePlayers, carry, bestByPosition, POS_ORDER } from '../model/players.js';
import { series, rec, rivalFacts, HISTORY_READY } from '../model/history.js';
import { fmt, esc, narrow, N, S, sw, snap } from '../util.js';

function gameLine(g){const wa=g.pa>g.pb;const w=wa?g.a:g.b,l=wa?g.b:g.a;return `<b>${S(w)}</b> ${fmt(Math.max(g.pa,g.pb))} over <b>${S(l)}</b> ${fmt(Math.min(g.pa,g.pb))}, wk ${g.k}`;}
export function renderDash(){
  if(app.view!=='dash')return;
  const {week,selected,hiddenSeries}=app;
  const R=analytics(week),{K,A}=R;
  if(K<1){document.getElementById('dSub').textContent='No weeks have been scored yet. Check back after the first games.';
    ['dTiles','dAwards','dLegend','dLine','dScatter','dPower','dGrid','dSwap','dPlayerTiles','dPlayers','dPos'].forEach(i=>document.getElementById(i).innerHTML='');renderRivals();return;}
  document.getElementById('dSub').textContent=`Weeks 1–${K}`+(week===LIVE_WEEK?' · week '+LIVE_WEEK+' is still being played':'')+' · Sleeper data as of '+snap();
  document.getElementById('dTiles').innerHTML=[
    ['High score',fmt(R.hi.p),`<b>${N(R.hi.id)}</b>, week ${R.hi.k}`],
    ['Low score',fmt(R.lo.p),`<b>${N(R.lo.id)}</b>, week ${R.lo.k}`],
    ['Closest game',fmt(R.close.m)+' pts',gameLine(R.close)],
    ['Biggest blowout',fmt(R.blow.m)+' pts',gameLine(R.blow)]
  ].map(([k,v,d])=>`<div class="tile"><div class="k">${k}</div><div class="v">${v}</div><div class="d">${d}</div></div>`).join('');
  // power table
  const sg=x=>(x>0?'+':x<0?'−':'')+Math.abs(x).toFixed(1);
  let h=`<thead><tr><th>Team</th><th>Record</th><th>All-play</th><th>Luck</th><th>PF</th><th>PA</th><th>Avg</th><th>Std dev</th><th>High</th><th>Low</th></tr></thead><tbody>`;
  R.order.forEach((id,i)=>{const a=A[id];const lk=a.luck;
    h+=`<tr data-id="${id}" class="${selected===id?'on':''}"><td><span class="who">${sw(id)}${i+1}. ${N(id)}</span></td><td>${a.w}-${a.l}</td><td>${a.aw}-${a.al}</td>
    <td class="${lk>.25?'pos':lk<-.25?'neg':''}">${lk>.25?'▲ ':lk<-.25?'▼ ':''}${sg(lk)}</td><td>${a.pf.toFixed(1)}</td><td>${a.pa.toFixed(1)}</td><td>${a.avg.toFixed(1)}</td><td>${a.sd.toFixed(1)}</td><td>${a.hi.toFixed(1)}</td><td>${a.lo.toFixed(1)}</td></tr>`;});
  const pt=document.getElementById('dPower');pt.innerHTML=h+'</tbody>';
  pt.querySelectorAll('tbody tr').forEach(tr=>tr.addEventListener('click',()=>act.select(+tr.dataset.id===selected?null:+tr.dataset.id)));
  // legend
  const lg=document.getElementById('dLegend');lg.innerHTML='';
  IDS.forEach(id=>{const b=document.createElement('button');b.innerHTML=`<i style="background:${TEAMS[id].color}"></i>${S(id)}`;
    b.classList.toggle('off',hiddenSeries.has(id));b.setAttribute('aria-pressed',!hiddenSeries.has(id));
    b.addEventListener('click',()=>{hiddenSeries.has(id)?hiddenSeries.delete(id):hiddenSeries.add(id);renderDash();});lg.appendChild(b);});
  drawLine(R);drawScatter(R);drawGrid(R);renderAwards(R);drawSwap(R);renderPlayers(R);renderRivals();
}
function drawLine(R){
  const {selected,hiddenSeries}=app;
  const box=document.getElementById('dLine'),W=Math.max(280,box.clientWidth-20),H=narrow()?200:240,m={l:36,r:14,t:12,b:26},{K,A}=R;
  const vals=[];IDS.forEach(id=>A[id].sc.slice(1).forEach(v=>vals.push(v)));
  const y0=Math.floor(Math.min(...vals)/20)*20,y1=Math.ceil(Math.max(...vals)/20)*20;
  const X=k=>m.l+(K===1?(W-m.l-m.r)/2:(k-1)/(K-1)*(W-m.l-m.r)),Y=v=>m.t+(1-(v-y0)/(y1-y0))*(H-m.t-m.b);
  let s=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Weekly points by team">`;
  for(let v=y0;v<=y1;v+=20)s+=`<line x1="${m.l}" x2="${W-m.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="rgba(241,236,226,.08)"/><text x="${m.l-6}" y="${Y(v)+3.5}" text-anchor="end" font-size="10.5" fill="#a9a49a" font-family="JetBrains Mono,monospace">${v}</text>`;
  for(let k=1;k<=K;k++)s+=`<text x="${X(k)}" y="${H-8}" text-anchor="middle" font-size="10.5" fill="#a9a49a" font-family="JetBrains Mono,monospace">Wk ${k}</text>`;
  // league average
  const avg=k=>IDS.reduce((t,id)=>t+A[id].sc[k],0)/6;
  s+=`<polyline fill="none" stroke="#a9a49a" stroke-width="1.5" stroke-dasharray="4 4" points="${Array.from({length:K},(_,i)=>X(i+1)+','+Y(avg(i+1))).join(' ')}"/>`;
  s+=`<text x="${W-m.r}" y="${Y(avg(K))-6}" text-anchor="end" font-size="10.5" fill="#a9a49a" font-family="Barlow Condensed,sans-serif">League avg</text>`;
  const ids=IDS.filter(id=>!hiddenSeries.has(id)).sort((a,b)=>(a===selected)-(b===selected));
  ids.forEach(id=>{const c=TEAMS[id].color,dim=selected&&selected!==id;
    const pts=Array.from({length:K},(_,i)=>[X(i+1),Y(A[id].sc[i+1])]);
    s+=`<polyline fill="none" stroke="${c}" stroke-width="${selected===id?3:2}" stroke-linejoin="round" stroke-linecap="round" opacity="${dim?.18:1}" points="${pts.map(p=>p.join(',')).join(' ')}"/>`;
    pts.forEach((p,i)=>s+=`<circle cx="${p[0]}" cy="${p[1]}" r="${selected===id?4.5:3.2}" fill="${c}" stroke="#1b1f27" stroke-width="2" opacity="${dim?.18:1}"/>`);
    if(selected===id){const p=pts[pts.length-1];s+=`<text x="${p[0]-8}" y="${p[1]-9}" text-anchor="end" font-size="12" font-weight="600" fill="#f1ece2" font-family="Barlow Condensed,sans-serif">${S(id)}</text>`;}
  });
  s+=`<line id="xh" x1="0" x2="0" y1="${m.t}" y2="${H-m.b}" stroke="rgba(241,236,226,.35)" visibility="hidden"/><rect x="${m.l-10}" y="0" width="${W-m.l-m.r+20}" height="${H}" fill="transparent" id="hit"/></svg><div class="tip" hidden></div>`;
  box.innerHTML=s;
  const hit=box.querySelector('#hit'),xh=box.querySelector('#xh'),tip=box.querySelector('.tip');
  const show=e=>{const r=box.querySelector('svg').getBoundingClientRect();const x=e.clientX-r.left;
    const k=Math.max(1,Math.min(K,Math.round(K===1?1:(x-m.l)/(W-m.l-m.r)*(K-1)+1)));
    xh.setAttribute('x1',X(k));xh.setAttribute('x2',X(k));xh.setAttribute('visibility','visible');
    const rows=IDS.slice().sort((a,b)=>A[b].sc[k]-A[a].sc[k]).map(id=>`<div class="r">${sw(id)}${S(id)} <small style="color:#a9a49a">${A[id].res[k]}</small><span>${fmt(A[id].sc[k])}</span></div>`).join('');
    tip.innerHTML=`<div class="t">Week ${k} · avg ${avg(k).toFixed(1)}</div>${rows}`;tip.hidden=false;
    const tw=tip.offsetWidth;let left=X(k)+18;if(left+tw>W)left=X(k)-tw-8;tip.style.left=(left+10)+'px';tip.style.top='14px';};
  hit.addEventListener('pointermove',show);hit.addEventListener('pointerdown',show);
  hit.addEventListener('pointerleave',()=>{tip.hidden=true;xh.setAttribute('visibility','hidden');});
}
function drawScatter(R){
  const {selected}=app;
  const box=document.getElementById('dScatter'),W=Math.max(260,box.clientWidth-20),H=Math.min(300,Math.max(230,W*.72)),m={l:42,r:16,t:14,b:34},{A}=R;
  const pf=IDS.map(id=>A[id].pf),pa=IDS.map(id=>A[id].pa),all=pf.concat(pa);
  const pad=(Math.max(...all)-Math.min(...all))*.12+5;
  const xa=[Math.min(...pf)-pad,Math.max(...pf)+pad],ya=[Math.min(...pa)-pad,Math.max(...pa)+pad];
  const X=v=>m.l+(v-xa[0])/(xa[1]-xa[0])*(W-m.l-m.r),Y=v=>m.t+(1-(v-ya[0])/(ya[1]-ya[0]))*(H-m.t-m.b);
  const mx=pf.reduce((a,b)=>a+b)/6,my=pa.reduce((a,b)=>a+b)/6,step=xa[1]-xa[0]>300?100:50;
  let s=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Points for versus points against">`;
  const tf='font-size="10.5" fill="#a9a49a" font-family="JetBrains Mono,monospace"';
  for(let v=Math.ceil(xa[0]/step)*step;v<=xa[1];v+=step)s+=`<line x1="${X(v)}" x2="${X(v)}" y1="${m.t}" y2="${H-m.b}" stroke="rgba(241,236,226,.06)"/><text x="${X(v)}" y="${H-m.b+14}" text-anchor="middle" ${tf}>${v}</text>`;
  for(let v=Math.ceil(ya[0]/step)*step;v<=ya[1];v+=step)s+=`<line x1="${m.l}" x2="${W-m.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="rgba(241,236,226,.06)"/><text x="${m.l-6}" y="${Y(v)+3.5}" text-anchor="end" ${tf}>${v}</text>`;
  s+=`<line x1="${X(mx)}" x2="${X(mx)}" y1="${m.t}" y2="${H-m.b}" stroke="rgba(241,236,226,.3)" stroke-dasharray="4 4"/><line x1="${m.l}" x2="${W-m.r}" y1="${Y(my)}" y2="${Y(my)}" stroke="rgba(241,236,226,.3)" stroke-dasharray="4 4"/>`;
  const qf='font-size="11.5" fill="#6f6b63" font-family="Barlow Condensed,sans-serif"';
  s+=`<text x="${W-m.r-4}" y="${H-m.b-6}" text-anchor="end" ${qf}>Strong &amp; lucky</text><text x="${W-m.r-4}" y="${m.t+12}" text-anchor="end" ${qf}>Strong &amp; snakebit</text>`;
  s+=`<text x="${m.l+4}" y="${H-m.b-6}" ${qf}>Weak &amp; spared</text><text x="${m.l+4}" y="${m.t+12}" ${qf}>Weak &amp; snakebit</text>`;
  s+=`<text x="${(m.l+W-m.r)/2}" y="${H-4}" text-anchor="middle" font-size="11.5" fill="#a9a49a" font-family="Barlow Condensed,sans-serif">Points for →</text>`;
  s+=`<text transform="translate(11 ${(m.t+H-m.b)/2}) rotate(-90)" text-anchor="middle" font-size="11.5" fill="#a9a49a" font-family="Barlow Condensed,sans-serif">Points against →</text>`;
  IDS.forEach(id=>{const x=X(A[id].pf),y=Y(A[id].pa),dim=selected&&selected!==id,right=x<W-80;
    s+=`<g data-id="${id}" style="cursor:pointer" opacity="${dim?.3:1}"><circle cx="${x}" cy="${y}" r="16" fill="transparent"/><circle cx="${x}" cy="${y}" r="${selected===id?8:6.5}" fill="${TEAMS[id].color}" stroke="#1b1f27" stroke-width="2"/>
    <text x="${right?x+11:x-11}" y="${y+4}" text-anchor="${right?'start':'end'}" font-size="12.5" font-weight="600" fill="#f1ece2" font-family="Barlow Condensed,sans-serif">${S(id)}</text></g>`;});
  s+=`</svg><div class="tip" hidden></div>`;box.innerHTML=s;
  const tip=box.querySelector('.tip');
  box.querySelectorAll('g[data-id]').forEach(g=>{const id=+g.dataset.id;
    g.addEventListener('pointerenter',()=>{const a=A[id];tip.innerHTML=`<div class="r">${sw(id)}<b>${N(id)}</b></div><div class="r">Points for<span>${a.pf.toFixed(1)}</span></div><div class="r">Points against<span>${a.pa.toFixed(1)}</span></div><div class="r">Record<span>${a.w}-${a.l}</span></div>`;
      tip.hidden=false;const x=X(a.pf);tip.style.left=Math.max(4,Math.min(W-tip.offsetWidth,x-tip.offsetWidth/2))+10+'px';tip.style.top=Math.max(4,Y(a.pa)-tip.offsetHeight-14)+'px';});
    g.addEventListener('pointerleave',()=>tip.hidden=true);
    g.addEventListener('click',()=>act.select(id===selected?null:id));});
}
function drawGrid(R){
  const {selected}=app;
  const {K,A}=R;const alpha=[0,.85,.6,.4,.24,.13,.06];
  let h='<thead><tr><th></th>'+Array.from({length:K},(_,i)=>`<th>Wk ${i+1}</th>`).join('')+'</tr></thead><tbody>';
  R.order.forEach(id=>{h+=`<tr${selected&&selected!==id?' style="opacity:.4"':''}><th class="tn"><span class="who">${sw(id)}${S(id)}</span></th>`;
    for(let k=1;k<=K;k++){const r=A[id].rk[k];h+=`<td style="background:rgba(245,176,33,${alpha[r]});color:${r<=2?'#191204':'#f1ece2'}" title="${esc(TEAMS[id].short)}, week ${k}: ${fmt(A[id].sc[k])}, ranked ${r} of 6, ${A[id].res[k]==='W'?'won':'lost'}">${A[id].res[k]} ${Math.round(A[id].sc[k])}<small>${r}${['','st','nd','rd','th','th','th'][r]}</small></td>`;}
    h+='</tr>';});
  document.getElementById('dGrid').innerHTML=h+'</tbody>';
}
export function renderAwards(R){const cards=awardList(R);
  document.getElementById('dAwards').innerHTML=cards.map(([k,id,d])=>`<div class="award" style="--tc:${TEAMS[id].color}"><div class="k">${k}</div><div class="n">${N(id)}</div><div class="d">${esc(d)}</div></div>`).join('');
}
function drawSwap(R){
  const M=swapMatrix(R),{A}=R;
  let h='<thead><tr><th></th>'+IDS.map(y=>`<th class="cn">${S(y)}'s</th>`).join('')+'</tr></thead><tbody>';
  IDS.forEach(x=>{h+=`<tr><th class="tn"><span class="who">${sw(x)}${S(x)}</span></th>`;
    IDS.forEach(y=>{const c=M[x][y],d=c.w-A[x].w;const bg=d>0?`rgba(143,209,124,${Math.min(.5,.12*d)})`:d<0?`rgba(238,122,100,${Math.min(.5,.12*-d)})`:'rgba(241,236,226,.05)';
      h+=`<td class="${x===y?'me':''}" style="background:${bg}" title="${esc(TEAMS[x].short)} with ${esc(TEAMS[y].short)}'s schedule: ${c.w}-${c.l}">${c.w}-${c.l}</td>`;});h+='</tr>';});
  document.getElementById('dSwap').innerHTML=h+'</tbody>';
}

/* ---------- player spotlight ---------- */
function renderPlayers(R){
  const {K,A}=R, week=app.week;
  const who=pid=>pinfo(pid), tag=pid=>{const p=who(pid);return p.pos+(p.team?' · '+p.team:'');};
  const top=weekTop(week,1)[0], tot=seasonTotals(K), mvp=tot[0];
  const big=tot.reduce((m,t)=>t.best>(m?m.best:0)?t:m,null);
  const car=IDS.map(id=>({id,...(carry(id,K,A[id].pf)||{share:0})})).sort((a,b)=>b.share-a.share)[0];
  const tiles=[];
  if(top)tiles.push([week===LIVE_WEEK?'Player of the week, live':'Player of the week '+week,top.pts.toFixed(1),`<b>${esc(who(top.pid).name)}</b>, ${esc(tag(top.pid))}, for ${S(top.rid)}`]);
  if(mvp)tiles.push(['Season MVP',mvp.pts.toFixed(1),`<b>${esc(who(mvp.pid).name)}</b>, ${esc(tag(mvp.pid))}, ${mvp.starts} starts for ${S(mvp.rid)}`]);
  if(big)tiles.push(['Biggest single game',big.best.toFixed(1),`<b>${esc(who(big.pid).name)}</b>, week ${big.bestW}, for ${S(big.rid)}`]);
  if(car&&car.pid)tiles.push(['Most carried',Math.round(car.share*100)+'%',`<b>${esc(who(car.pid).name)}</b> is that much of ${S(car.id)}'s points`]);
  document.getElementById('dPlayerTiles').innerHTML=tiles.map(([k,v,d])=>`<div class="tile"><div class="k">${k}</div><div class="v">${v}</div><div class="d">${d}</div></div>`).join('')
    +(havePlayers()?'':'<p class="sub">Loading player names…</p>');
  let h='<thead><tr><th>Player</th><th>Driver</th><th>Pts</th><th>Starts</th><th>Avg</th><th>Best</th></tr></thead><tbody>';
  tot.slice(0,10).forEach(t=>{const p=who(t.pid);
    h+=`<tr data-id="${t.rid}" class="${app.selected===t.rid?'on':''}"><td><span class="who">${esc(p.name)} <small class="dimtag">${esc(tag(t.pid))}</small></span></td><td><span class="who">${sw(t.rid)}${S(t.rid)}</span></td><td>${t.pts.toFixed(1)}</td><td>${t.starts}</td><td>${(t.pts/t.starts).toFixed(1)}</td><td>${t.best.toFixed(1)}</td></tr>`;});
  const pt=document.getElementById('dPlayers');pt.innerHTML=h+'</tbody>';
  pt.querySelectorAll('tbody tr').forEach(tr=>tr.addEventListener('click',()=>act.select(+tr.dataset.id===app.selected?null:+tr.dataset.id)));
  const bp=bestByPosition(K);
  document.getElementById('dPos').innerHTML=POS_ORDER.filter(p=>bp[p]).map(p=>{const t=bp[p];
    return `<div class="tile"><div class="k">Best ${p}</div><div class="v">${t.pts.toFixed(1)}</div><div class="d"><b>${esc(who(t.pid).name)}</b>, ${S(t.rid)}</div></div>`;}).join('');
}

/* ---------- rivalries ---------- */
let rivalSel=null;
function renderRivals(){
  const facts=document.getElementById('dRivalFacts'),tbl=document.getElementById('dRivals'),log=document.getElementById('dRivalLog');
  if(!HISTORY_READY){facts.innerHTML='';tbl.innerHTML='';log.innerHTML='<p class="sub">Loading last season\u2019s games…</p>';return;}
  facts.innerHTML=rivalFacts().map(f=>`<div class="award" style="--tc:${TEAMS[f.id].color}"><div class="k">${esc(f.title)}</div><div class="d">${esc(f.text)}</div></div>`).join('');
  let h='<thead><tr><th></th>'+IDS.map(y=>`<th class="cn">vs ${S(y)}</th>`).join('')+'</tr></thead><tbody>';
  IDS.forEach(x=>{h+=`<tr><th class="tn"><span class="who">${sw(x)}${S(x)}</span></th>`;
    IDS.forEach(y=>{if(x===y){h+='<td class="me" style="background:rgba(241,236,226,.03)">–</td>';return;}
      const e=series(x,y),d=e.w-e.l,bg=d>0?`rgba(143,209,124,${Math.min(.5,.12*d)})`:d<0?`rgba(238,122,100,${Math.min(.5,.12*-d)})`:'rgba(241,236,226,.05)';
      const on=rivalSel&&rivalSel[0]===x&&rivalSel[1]===y;
      h+=`<td data-x="${x}" data-y="${y}" tabindex="0" role="button" class="${on?'me':''}" style="background:${bg};cursor:pointer" title="${esc(TEAMS[x].short)} vs ${esc(TEAMS[y].short)}: ${rec(e)}">${rec(e)}</td>`;});h+='</tr>';});
  tbl.innerHTML=h+'</tbody>';
  const pick=td=>{rivalSel=[+td.dataset.x,+td.dataset.y];renderRivals();};
  tbl.querySelectorAll('td[data-x]').forEach(td=>{td.addEventListener('click',()=>pick(td));td.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(td);}});});
  if(!rivalSel){log.innerHTML='';return;}
  const [x,y]=rivalSel,e=series(x,y);
  log.innerHTML=`<div class="rl"><h4>${N(x)} vs ${N(y)}: ${rec(e)}</h4><p class="sub">${e.pf.toFixed(1)} points for, ${e.pa.toFixed(1)} against over ${e.n} games${e.streak?`. Current streak: ${e.streak.n} ${e.streak.type==='W'?'win':e.streak.type==='L'?'loss':'tie'}${e.streak.n>1?'s':''}.`:'.'}</p>
    <ol>${e.games.slice().reverse().map(g=>`<li class="${g.r}"><b>${g.r}</b><span>${g.s} wk ${g.w}</span><span>${fmt(g.px)} to ${fmt(g.py)}</span></li>`).join('')}</ol></div>`;
}
