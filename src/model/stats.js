import { IDS, WEEKS, TEAMS, LAST, REG_END, LAST_CHAMP, LIVE_WEEK } from './league.js';
import { fmt } from '../util.js';

// Standings and per-team totals through week w (the live week counts toward points but not W/L).
export function statsThrough(w){
  const s={}; IDS.forEach(id=>s[id]={w:0,l:0,t:0,pf:0,pa:0,res:[],resBy:[],scores:[]});
  for(let k=1;k<=w;k++){
    (WEEKS[k]||[]).forEach(([a,pa,b,pb])=>{
      s[a].pf+=pa; s[b].pf+=pb; s[a].pa+=pb; s[b].pa+=pa;
      s[a].scores[k]=pa; s[b].scores[k]=pb;
      if(k===LIVE_WEEK) return;
      const r=pa>pb?['W','L']:pb>pa?['L','W']:['T','T'];
      if(pa>pb){s[a].w++;s[b].l++;}else if(pb>pa){s[b].w++;s[a].l++;}else{s[a].t++;s[b].t++;}
      s[a].res.push(r[0]);s[b].res.push(r[1]);s[a].resBy[k]=r[0];s[b].resBy[k]=r[1];
    });
  }
  IDS.forEach(id=>{const r=s[id].res;let n=0;const last=r[r.length-1];for(let i=r.length-1;i>=0&&r[i]===last;i--)n++;s[id].streak=last?n+last:"—";});
  const order=IDS.slice().sort((x,y)=>(s[y].w-s[x].w)||(s[y].pf-s[x].pf));
  order.forEach((id,i)=>s[id].rank=i+1);
  return {s,order};
}

// Completed-weeks analytics: all-play, luck, spread, records. Regular season only.
export function analytics(thru){
  const K=Math.min(thru,LAST,REG_END), A={}; IDS.forEach(id=>A[id]={sc:[],w:0,l:0,aw:0,al:0,exp:0,pa:0,rk:[],res:[]});
  const games=[];
  for(let k=1;k<=K;k++){
    const wk=[];(WEEKS[k]||[]).forEach(([a,pa,b,pb])=>{wk.push([a,pa],[b,pb]);A[a].pa+=pb;A[b].pa+=pa;games.push({k,a,pa,b,pb,m:Math.abs(pa-pb)});
      const aw=pa>pb;A[a].res[k]=aw?'W':'L';A[b].res[k]=aw?'L':'W';if(aw){A[a].w++;A[b].l++;}else{A[b].w++;A[a].l++;}});
    wk.forEach(([id,p])=>{A[id].sc[k]=p;const beat=wk.filter(([o,q])=>o!==id&&q<p).length;A[id].aw+=beat;A[id].al+=5-beat;A[id].exp+=beat/5;
      A[id].rk[k]=1+wk.filter(([o,q])=>o!==id&&q>p).length;});
  }
  if(K<1)return {K:0,A,order:IDS.slice(),hi:null,lo:null,close:null,blow:null};
  IDS.forEach(id=>{const v=A[id].sc.slice(1);const n=v.length||1,avg=v.reduce((s,x)=>s+x,0)/n;
    Object.assign(A[id],{pf:v.reduce((s,x)=>s+x,0),avg,sd:Math.sqrt(v.reduce((s,x)=>s+(x-avg)**2,0)/n),hi:Math.max(...v),lo:Math.min(...v),luck:A[id].w-A[id].exp});});
  const order=IDS.slice().sort((x,y)=>(A[y].aw-A[x].aw)||(A[y].pf-A[x].pf));
  const all=[];for(let k=1;k<=K;k++)IDS.forEach(id=>all.push({id,k,p:A[id].sc[k]}));
  const hi=all.reduce((m,x)=>x.p>m.p?x:m),lo=all.reduce((m,x)=>x.p<m.p?x:m);
  const close=games.reduce((m,g)=>g.m<m.m?g:m),blow=games.reduce((m,g)=>g.m>m.m?g:m);
  return {K,A,order,hi,lo,close,blow};
}

export function awardList(R){
  const {K,A}=R; if(K<1)return [];
  const S=id=>TEAMS[id].short; // plain text; the renderers escape it
  const by=(f,dir=1)=>IDS.slice().sort((a,b)=>dir*(f(b)-f(a)))[0];
  const crowns={};IDS.forEach(id=>crowns[id]=0);for(let k=1;k<=K;k++)IDS.forEach(id=>{if(A[id].rk[k]===1)crowns[id]++;});
  const losses=[],wins=[];for(let k=1;k<=K;k++)IDS.forEach(id=>{(A[id].res[k]==='L'?losses:wins).push({id,k,p:A[id].sc[k]});});
  const opp=(id,k)=>{const g=WEEKS[k].find(r=>r[0]===id||r[2]===id);return g[0]===id?g[2]:g[0];};
  const bad=losses.reduce((m,x)=>x.p>m.p?x:m,losses[0]),luckyW=wins.reduce((m,x)=>x.p<m.p?x:m,wins[0]);
  const flat=IDS.flatMap(id=>Array.from({length:K},(_,i)=>({id,k:i+1,p:A[id].sc[i+1]}))).reduce((m,x)=>x.p<m.p?x:m);
  const streak=id=>{const r=A[id].res.slice(1);let n=0;const last=r[r.length-1];for(let i=r.length-1;i>=0&&r[i]===last;i--)n++;return {n,last};};
  const hot=by(id=>{const s=streak(id);return s.last==='W'?s.n:0;}),cold=by(id=>{const s=streak(id);return s.last==='L'?s.n:0;});
  const sw=swapMatrix(R);let env={g:-99};IDS.forEach(x=>IDS.forEach(y=>{if(x!==y){const g=sw[x][y].w-A[x].w;if(g>env.g)env={g,x,y};}}));
  const crown=by(id=>crowns[id]*1000+A[id].pf);
  const cards=[
    ['Crusher Crown',crown,`Top score in the league ${crowns[crown]} of ${K} weeks.`],
    ['Bad Beat Bucket',bad.id,`Put up ${fmt(bad.p)} in week ${bad.k} and still lost to ${S(opp(bad.id,bad.k))}.`],
    ['Lucky Lugnut',luckyW.id,`Won week ${luckyW.k} with just ${fmt(luckyW.p)}.`],
    ['Flat Tire',flat.id,`Lowest score of the year: ${fmt(flat.p)} in week ${flat.k}.`],
    ['Wildest Ride',by(id=>A[id].sd),`Swings of ±${A[by(id=>A[id].sd)].sd.toFixed(1)} points week to week.`],
    ['Cruise Control',by(id=>A[id].sd,-1),`Steadiest scorer, only ±${A[by(id=>A[id].sd,-1)].sd.toFixed(1)} a week.`],
    ['Snakebit',by(id=>A[id].pa),`Opponents average ${(A[by(id=>A[id].pa)].pa/K).toFixed(1)} against them, most in the league.`],
    ['Schedule Envy',env.x,`Would be ${sw[env.x][env.y].w}-${sw[env.x][env.y].l} with ${S(env.y)}'s schedule instead of ${A[env.x].w}-${A[env.x].l}.`],
  ];
  const hs=streak(hot);if(hs.last==='W'&&hs.n>=2)cards.push(['Hottest Engine',hot,`${hs.n} straight wins and counting.`]);
  const cs=streak(cold);if(cs.last==='L'&&cs.n>=2)cards.push(['Stuck in the Mud',cold,`${cs.n} straight losses.`]);
  if(TEAMS[LAST_CHAMP])cards.push(['Defending Champ',LAST_CHAMP,`Won the league last season. Currently ${A[LAST_CHAMP].w}-${A[LAST_CHAMP].l}.`]);
  return cards;
}

export function swapMatrix(R){
  const {K,A}=R,M={};
  IDS.forEach(x=>{M[x]={};IDS.forEach(y=>{let w=0,l=0;for(let k=1;k<=K;k++){const g=WEEKS[k].find(r=>r[0]===y||r[2]===y);let o=g[0]===y?g[2]:g[0];if(o===x)o=y;
    if(A[x].sc[k]>A[o].sc[k])w++;else l++;}M[x][y]={w,l};});});
  return M;
}
