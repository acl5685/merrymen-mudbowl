import { IDS, WEEKS, SCHEDULE, BRACKET, PLAYOFF_START, REG_END, LAST } from './league.js';

/* Seeded Monte Carlo. Ported from the prototype: same PRNG, same draw order, so the same data gives the same odds.
   Added: playoff weeks only count regular-season scores, and once /winners_bracket exists the playoffs are
   simulated from the real bracket, with games already played fixed. */
function rng(seed){return()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const FC={};
export function resetForecast(){ for(const k of Object.keys(FC)) delete FC[k]; }
function gamesFor(k){const g=WEEKS[k];return g?g.map(r=>[r[0],r[2]]):(SCHEDULE[k]||[]);}
/* Playoffs from the real bracket. Rounds map to weeks PLAYOFF_START, +1, +2. A game counts as played only if its
   week is at or before the as-of week, so replaying an earlier week doesn't leak later results.
   Returns [finalist, finalist, champion], or null if the bracket can't be resolved. */
function playBracket(asOf,pts){
  const ms=BRACKET.filter(m=>!(m.p>1)).slice().sort((a,b)=>(a.r-b.r)||(a.m-b.m));
  if(!ms.length)return null;
  const res={};
  const from=f=>f?(f.w!=null?(res[f.w]&&res[f.w].w):(f.l!=null?(res[f.l]&&res[f.l].l):null)):null;
  for(const m of ms){
    const t1=m.t1_from?from(m.t1_from):m.t1,t2=m.t2_from?from(m.t2_from):m.t2;
    if(t1==null||t2==null)return null;
    const win=m.w!=null&&PLAYOFF_START+m.r-1<=asOf?m.w:(pts(t1)>pts(t2)?t1:t2);
    res[m.m]={t1,t2,w:win,l:win===t1?t2:t1};
  }
  const fin=ms.find(m=>m.p===1)||ms[ms.length-1],f=res[fin.m];
  return [f.t1,f.t2,f.w];
}

export function forecast(asOf,NS=5000){
  if(FC[asOf])return FC[asOf];
  const K=Math.min(asOf,LAST,REG_END),scores={},w={},pf={};IDS.forEach(id=>{scores[id]=[];w[id]=0;pf[id]=0;});
  for(let k=1;k<=K;k++)WEEKS[k].forEach(([a,pa,b,pb])=>{scores[a].push(pa);scores[b].push(pb);pf[a]+=pa;pf[b]+=pb;if(pa>pb)w[a]++;else w[b]++;});
  const allS=IDS.flatMap(id=>scores[id]),lm=allS.length?allS.reduce((s,x)=>s+x,0)/allS.length:140;
  const mu={};IDS.forEach(id=>{const n=scores[id].length;mu[id]=(scores[id].reduce((s,x)=>s+x,0)+3*lm)/(n+3);});
  let rv=0,rn=0;IDS.forEach(id=>scores[id].forEach(x=>{const m=scores[id].reduce((s,y)=>s+y,0)/scores[id].length;rv+=(x-m)**2;rn++;}));
  const sd=rn>8?Math.max(16,Math.sqrt(rv/(rn-6))):24;
  const games=[];for(let k=K+1;k<=REG_END;k++)gamesFor(k).forEach(([a,b])=>games.push({k,a,b,aw:0,t:{}}));
  // tallies per game per side: [wins, bye|win, bye|loss, title|win, title|loss]
  games.forEach(g=>{g.t[g.a]=[0,0,0,0,0];g.t[g.b]=[0,0,0,0,0];});
  const T={};IDS.forEach(id=>T[id]={wins:0,bye:0,one:0,title:0,final:0,seed:[0,0,0,0,0,0,0]});
  const useBracket=asOf>REG_END&&BRACKET.length>0;
  const r=rng(1000+asOf);
  const gauss=()=>{let u=0,v=0;while(!u)u=r();v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
  const pts=id=>mu[id]+sd*gauss();
  const out=new Int8Array(games.length);
  for(let n=0;n<NS;n++){
    const W=Object.assign({},w),P=Object.assign({},pf);
    games.forEach((g,i)=>{const x=pts(g.a),y=pts(g.b);P[g.a]+=x;P[g.b]+=y;const aw=x>y;if(aw)W[g.a]++;else W[g.b]++;out[i]=aw?1:0;});
    const seeds=IDS.slice().sort((a,b)=>(W[b]-W[a])||(P[b]-P[a]));
    const duel=(a,b)=>pts(a)>pts(b)?a:b;
    let s1,s2,champ;
    if(useBracket){const b=playBracket(asOf,pts);if(b)[s1,s2,champ]=b;}
    if(champ===undefined){
      const q1=duel(seeds[2],seeds[5]),q2=duel(seeds[3],seeds[4]);
      const rem=[q1,q2].sort((a,b)=>seeds.indexOf(a)-seeds.indexOf(b));
      s1=duel(seeds[0],rem[1]);s2=duel(seeds[1],rem[0]);champ=duel(s1,s2);
    }
    IDS.forEach(id=>{T[id].wins+=W[id];});
    seeds.forEach((id,i)=>T[id].seed[i+1]++);T[seeds[0]].one++;T[seeds[0]].bye++;T[seeds[1]].bye++;T[s1].final++;T[s2].final++;T[champ].title++;
    const bye=new Set([seeds[0],seeds[1]]);
    games.forEach((g,i)=>{const win=out[i]?g.a:g.b,los=out[i]?g.b:g.a;if(out[i])g.aw++;
      const tw=g.t[win],tl=g.t[los];tw[0]++;if(bye.has(win))tw[1]++;if(champ===win)tw[3]++;if(bye.has(los))tl[2]++;if(champ===los)tl[4]++;});
  }
  IDS.forEach(id=>{const t=T[id];t.wins/=NS;t.bye/=NS;t.one/=NS;t.title/=NS;t.final/=NS;t.seed=t.seed.map(x=>x/NS);});
  return FC[asOf]={K,T,games,NS,mu,sd,w,bracket:useBracket};
}

export function mustWin(F,id){
  let best=null;F.games.forEach(g=>{if(g.a!==id&&g.b!==id)return;const t=g.t[id],nw=t[0],nl=F.NS-nw;if(nw<50||nl<50)return;
    const bw=t[1]/nw,bl=t[2]/nl,tw=t[3]/nw,tl=t[4]/nl,sw=F.T[id].bye>=.03?bw-bl:tw-tl;
    if(!best||sw>best.sw)best={k:g.k,opp:g.a===id?g.b:g.a,bw,bl,tw,tl,sw,p:(g.a===id?g.aw:F.NS-g.aw)/F.NS};});
  return best;
}
