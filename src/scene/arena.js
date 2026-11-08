import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { M, rnd, junkColors, junkCar, canvasTex, makeTruck, makeTire } from './trucks.js';
import { loadProps, placeProps } from './props.js';
import { TEAMS, IDS, WEEKS, LIVE_WEEK, LAST, REG_END } from '../model/league.js';
import { app, act } from '../state.js';

/* Three.js stadium, ported from the prototype. initArena() builds the scene once; the UI then drives it
   through the returned api (setWeek / focus / start). */
export function initArena(){
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;
document.getElementById('stage').appendChild(renderer.domElement);
const scene=new THREE.Scene();
const SKY=new THREE.Color('#0e1220');
scene.background=SKY; scene.fog=new THREE.Fog(SKY,70,150);
const camera=new THREE.PerspectiveCamera(48,1,0.1,400);
const narrow=()=>innerWidth<640;
camera.position.set(0,narrow()?40:30,narrow()?62:48);
const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,3,0); controls.enableDamping=true; controls.dampingFactor=.08;
controls.maxPolarAngle=Math.PI*0.47; controls.minDistance=14; controls.maxDistance=110; controls.enablePan=false;
controls.autoRotate=!reduce; controls.autoRotateSpeed=0.4;

// Bloom makes the floodlights, pillars and trophy glow. The composer renders linear, so a gamma pass finishes the job.
let composer=null;
if(new URLSearchParams(location.search).get('fx')!=='off'){
  try{
    const rt=renderer.capabilities.isWebGL2?new THREE.WebGLMultisampleRenderTarget(innerWidth,innerHeight):undefined;
    composer=new EffectComposer(renderer,rt);composer.setPixelRatio(renderer.getPixelRatio());
    composer.addPass(new RenderPass(scene,camera));
    const half=innerWidth<640?.5:1; // lighter bloom buffer on phones
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth*half,innerHeight*half),.7,.6,.86));
    composer.addPass(new ShaderPass(GammaCorrectionShader));
    scene.background=SKY.clone().convertSRGBToLinear(); // the clear colour gets gamma-encoded too; pre-darken so the sky matches the prototype
  }catch(e){console.warn('Glow effect unavailable',e);composer=null;}
}
scene.add(new THREE.HemisphereLight('#a9b8e0','#2a1d10',0.5));
const key=new THREE.DirectionalLight('#fff4dd',0.95);
key.position.set(-25,55,30); key.castShadow=true; key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:1,far:140});
scene.add(key);

// Graphics upgrade: textures from Poly Haven (CC0), shipped in public/assets. ?fx=off in the URL turns the glow off.
const ASSETS=import.meta.env.BASE_URL+'assets/', texLoader=new THREE.TextureLoader();
function mudTex(file,srgb){const t=texLoader.load(ASSETS+file);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(14,14);t.anisotropy=8;if(srgb)t.encoding=THREE.sRGBEncoding;return t;}
// arena floor: Poly Haven mud (the prototype used flat vertex-colour dirt)
const R_RING=20, ARENA=34;
{const g=new THREE.CircleGeometry(ARENA,96,0,Math.PI*2);g.rotateX(-Math.PI/2);
 const p=g.attributes.position,cols=new Float32Array(p.count*3),c=new THREE.Color();
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);const n=Math.sin(x*.7)*Math.cos(z*.6)+Math.sin(x*.21+z*.33);
   c.setHSL(.075,.45,.17+n*.025+rnd()*.03);cols.set([c.r,c.g,c.b],i*3);}
 g.setAttribute('color',new THREE.BufferAttribute(cols,3));
 const dirt=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:mudTex('brown_mud_diff_1k.jpg',true),normalMap:mudTex('brown_mud_nor_gl_1k.jpg'),roughnessMap:mudTex('brown_mud_rough_1k.jpg'),color:'#e6c9a2',roughness:1}));dirt.receiveShadow=true;scene.add(dirt);
 const wall=new THREE.Mesh(new THREE.CylinderGeometry(ARENA+.4,ARENA+.4,1.6,96,1,true),M('#c9c4b8',{side:THREE.DoubleSide}));wall.position.y=.8;scene.add(wall);
 // hazard stripe along the wall
 const cv=document.createElement('canvas');cv.width=256;cv.height=16;const x=cv.getContext('2d');
 for(let i=0;i<16;i++){x.fillStyle=i%2?'#111':'#f5b021';x.beginPath();x.moveTo(i*16,16);x.lineTo(i*16+8,0);x.lineTo(i*16+24,0);x.lineTo(i*16+16,16);x.fill();}
 const tx=new THREE.CanvasTexture(cv);tx.wrapS=THREE.RepeatWrapping;tx.repeat.set(24,1);
 const stripe=new THREE.Mesh(new THREE.CylinderGeometry(ARENA+.35,ARENA+.35,.35,96,1,true),new THREE.MeshBasicMaterial({map:tx,side:THREE.DoubleSide}));stripe.position.y=1.45;scene.add(stripe);}

// grandstands + crowd
{const tiers=7;for(let t=0;t<tiers;t++){const r0=ARENA+1.5+t*2.2,y=1.6+t*1.5;
  const step=new THREE.Mesh(new THREE.CylinderGeometry(r0+2.2,r0+2.2,1.5,96,1,true),M('#2a2f3a',{side:THREE.DoubleSide}));step.position.y=y-.75;scene.add(step);
  const top=new THREE.Mesh(new THREE.RingGeometry(r0,r0+2.2,96),M('#3a404c'));top.rotation.x=-Math.PI/2;top.position.y=y;scene.add(top);}
 const N=1800,body=new THREE.BoxGeometry(.5,.8,.4);body.translate(0,.4,0);
 const crowd=new THREE.InstancedMesh(body,new THREE.MeshStandardMaterial({roughness:.9}),N);
 const m=new THREE.Matrix4(),c=new THREE.Color();crowd.userData.base=[];
 const fan=['#e2582a','#1d3a6e','#f1ece2','#f5b021','#7a1f1f','#2b6b3a','#5a3a8a','#222'];
 for(let i=0;i<N;i++){const t=Math.floor(rnd()*tiers),a=rnd()*Math.PI*2,r=ARENA+2.4+t*2.2+rnd()*1.2,y=1.6+t*1.5;
   m.makeRotationY(-a);m.setPosition(Math.cos(a)*r,y,Math.sin(a)*r);crowd.setMatrixAt(i,m);c.set(fan[(rnd()*fan.length)|0]);crowd.setColorAt(i,c);crowd.userData.base.push([Math.cos(a)*r,y,Math.sin(a)*r,a,rnd()*6]);}
 scene.add(crowd);window.__crowd=crowd;}
const crowd=window.__crowd;

// floodlight towers
{[45,135,225,315].forEach(d=>{const a=d*Math.PI/180,r=ARENA+18;const g=new THREE.Group();g.position.set(Math.cos(a)*r,0,Math.sin(a)*r);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,26,8),M('#555b66',{metalness:.6}));pole.position.y=13;
  const rack=new THREE.Mesh(new THREE.BoxGeometry(5,2.6,.6),M('#333'));rack.position.y=27;rack.lookAt(0,0,0);rack.position.y=27;
  const lamps=new THREE.Mesh(new THREE.PlaneGeometry(4.4,2),new THREE.MeshBasicMaterial({color:'#fffbe6'}));lamps.position.y=27;lamps.lookAt(-g.position.x,-20,-g.position.z);
  lamps.translateZ(.35);g.add(pole,rack,lamps);scene.add(g);
  const sp=new THREE.SpotLight('#fff3d6',0.55,140,0.55,0.6,1);sp.position.set(g.position.x,27,g.position.z);sp.target.position.set(0,0,0);scene.add(sp,sp.target);});}

// center: dirt jump with trophy
const gold=M('#f2b632',{metalness:.85,roughness:.28,emissive:'#3a2600',emissiveIntensity:.6});
const trophy=new THREE.Group();
{const mound=new THREE.Mesh(new THREE.CylinderGeometry(3.2,7.5,3,24),M('#5a3a1e',{roughness:1,flatShading:true}));mound.position.y=1.5;mound.castShadow=mound.receiveShadow=true;
 const pts=[[0,0],[1.4,0],[1.4,.3],[.5,.6],[.3,1.4],[.45,2],[1.5,2.6],[1.85,3.6],[1.95,4.5],[1.8,4.5],[1.6,3.7],[1.2,2.9],[.3,2.4],[0,2.4]].map(p=>new THREE.Vector2(p[0],p[1]));
 const cup=new THREE.Mesh(new THREE.LatheGeometry(pts,36),gold);cup.position.y=3;cup.castShadow=true;
 [-1,1].forEach(sx=>{const h=new THREE.Mesh(new THREE.TorusGeometry(.8,.13,10,24,Math.PI*1.2),gold);h.position.set(sx*2,6.5,0);h.rotation.z=sx>0?-Math.PI*.6:Math.PI*1.6;trophy.add(h);});
 trophy.add(cup);scene.add(mound,trophy);}
const trophyLight=new THREE.PointLight('#ffcf6b',1.2,26,2);trophyLight.position.set(0,10,0);scene.add(trophyLight);

// ramps between truck spots + junked-car piles at the walls
function ramp(x,z,rot,s=1){const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(4.5,0);sh.lineTo(4.5,1.8);sh.lineTo(0,0);
  const g=new THREE.ExtrudeGeometry(sh,{depth:3,bevelEnabled:false});g.translate(-2.25,0,-1.5);
  const m=new THREE.Mesh(g,M('#5e3c1f',{roughness:1,flatShading:true}));m.position.set(x,0,z);m.rotation.y=rot;m.scale.setScalar(s);m.castShadow=m.receiveShadow=true;scene.add(m);}
for(let i=0;i<6;i++){const a=(i+.5)/6*Math.PI*2-Math.PI/2;ramp(Math.cos(a)*R_RING,Math.sin(a)*R_RING,-a,.9);}
for(let i=0;i<5;i++){const a=rnd()*Math.PI*2,r=ARENA-4;for(let k=0;k<2+((rnd()*3)|0);k++){const c=junkCar(junkColors[(rnd()*7)|0]);c.position.set(Math.cos(a)*r+(rnd()-.5),.25+k*.5,Math.sin(a)*r+(rnd()-.5));c.rotation.y=rnd()*3;scene.add(c);}}

const keepPos=id=>{const a=IDS.indexOf(id)/IDS.length*Math.PI*2-Math.PI/2;return new THREE.Vector3(Math.cos(a)*R_RING,0,Math.sin(a)*R_RING);};
const rnd2=(()=>{let s=7;return()=>(s=(s*16807)%2147483647)/2147483647;})(); // extra cars past the prototype's 8 draw from their own stream, so the first 8 look the same
const rigs={}; const pickables=[];
IDS.forEach(id=>{
  const p=keepPos(id),rig=new THREE.Group();rig.position.copy(p);
  rig.rotation.y=-Math.atan2(-p.z,-p.x);
  const truck=makeTruck(TEAMS[id]);rig.add(truck);
  // stack of crushed cars (one per win)
  const stack=[];for(let i=0;i<17;i++){const c=junkCar(junkColors[(id*3+i)%7]);c.scale.set(1.35,1,1.6);c.position.y=.25+i*.55;c.rotation.y=((i<8?rnd():rnd2())-.5)*.5;c.visible=false;rig.add(c);stack.push(c);}
  // points pillar
  const col=new THREE.Color(TEAMS[id].color);
  const pillarGeo=new THREE.CylinderGeometry(.32,.32,1,12);pillarGeo.translate(0,.5,0);
  const pillar=new THREE.Mesh(pillarGeo,new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.55,transparent:true,opacity:.85}));
  const tangent=new THREE.Vector3(-p.z,0,p.x).normalize().multiplyScalar(4.2);
  pillar.position.copy(p).add(tangent);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.42,12,10),new THREE.MeshBasicMaterial({color:col}));cap.position.copy(pillar.position);
  const pad=new THREE.Mesh(new THREE.CylinderGeometry(.7,.8,.25,12),M('#333'));pad.position.copy(pillar.position);
  scene.add(rig,pillar,cap,pad);
  truck.traverse(o=>{if(o.isMesh){o.userData.id=id;pickables.push(o);}});
  stack.forEach(c=>c.traverse(o=>{if(o.isMesh){o.userData.id=id;pickables.push(o);}}));
  rigs[id]={rig,truck,stack,pillar,cap,pos:p,col,lift:0,liftT:0,ph:0,pillarH:1,pillarT:1,wins:0,hop:0};
});

let duels=[];
function buildDuels(w){
  duels.forEach(d=>{scene.remove(d.tube,d.tire);d.tube.geometry.dispose();});duels=[];
  (WEEKS[w]||[]).forEach(([a,pa,b,pb])=>{
    const live=w===LIVE_WEEK, winner=pa>=pb?a:b, loser=winner===a?b:a;
    const from=rigs[live?a:winner].pos, to=rigs[live?b:loser].pos;
    const s=from.clone().setY(9), e=to.clone().setY(9);
    const mid=s.clone().add(e).multiplyScalar(.5);mid.x*=.5;mid.z*=.5;mid.y=17+s.distanceTo(e)*.15;
    const curve=new THREE.QuadraticBezierCurve3(s,mid,e);
    const col=live?new THREE.Color('#ff6a2b'):rigs[winner].col.clone();
    const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,48,.08,6,false),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:live?.45:.7}));
    const tire=makeTire();scene.add(tube,tire);
    duels.push({curve,tube,tire,t:rnd(),live,winner,loser,a,b});
  });
}

// exhaust/dust puffs
const puffTex=canvasTex(32,32,(x)=>{const g=x.createRadialGradient(16,16,0,16,16,16);g.addColorStop(0,'rgba(200,170,130,.9)');g.addColorStop(1,'rgba(200,170,130,0)');x.fillStyle=g;x.fillRect(0,0,32,32);});
const sparks=(()=>{const N=220,geo=new THREE.BufferGeometry(),a=new Float32Array(N*3),v=[];
  for(let i=0;i<N;i++){a[i*3+1]=-99;v.push({life:0,x:0,y:0,z:0,vx:0,vy:0,vz:0});}
  geo.setAttribute('position',new THREE.BufferAttribute(a,3));
  const pts=new THREE.Points(geo,new THREE.PointsMaterial({size:1.6,map:puffTex,transparent:true,depthWrite:false,opacity:.7}));pts.userData.v=v;scene.add(pts);return pts;})();
let sparkI=0;
function dust(pos,n=24){const v=sparks.userData.v;for(let k=0;k<n;k++){const p=v[sparkI=(sparkI+1)%v.length];p.life=1;p.x=pos.x+(rnd()-.5)*4;p.y=pos.y+.3;p.z=pos.z+(rnd()-.5)*4;p.vx=(rnd()-.5)*4;p.vy=2+rnd()*4;p.vz=(rnd()-.5)*4;}}

const tags={};
IDS.forEach(id=>{const el=document.createElement('div');el.className='tag';el.setAttribute('role','button');el.tabIndex=0;
  el.style.setProperty('--tc',TEAMS[id].color);el.innerHTML='<b></b><span></span>';
  el.addEventListener('click',()=>act.select(id));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();act.select(id);}});
  document.body.appendChild(el);tags[id]=el;});

const renderTags=ST=>IDS.forEach(id=>{const s=ST.s[id],el=tags[id];el.querySelector('b').textContent=TEAMS[id].name;el.querySelector('span').textContent=`${s.w}-${s.l} · ${s.pf.toFixed(1)}`;});
// The prototype scaled pillars so ~1150 points (7 weeks) reached 13 units. Keep that at 7 weeks and compress for a longer season.
const pillarUnit=()=>13/(1150/7*Math.max(7,Math.min(LAST,REG_END)));

let camGoal=null;
const ray=new THREE.Raycaster(),ptr=new THREE.Vector2();let down=null;
const shown=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;}; // hidden stack cars shouldn't catch taps
renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;
  ptr.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);ray.setFromCamera(ptr,camera);
  const hit=ray.intersectObjects(pickables.filter(o=>shown(o)))[0];act.select(hit?hit.object.userData.id:null);});

function resize(){renderer.setSize(innerWidth,innerHeight);if(composer)composer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();
const v3=new THREE.Vector3(),mtx=new THREE.Matrix4(),clock=new THREE.Clock();
function frame(){
  const dt=Math.min(clock.getDelta(),.05),T=clock.elapsedTime,ease=k=>reduce?1:Math.min(1,dt*k);
  if(app.view!=='arena'){requestAnimationFrame(frame);return;}
  IDS.forEach(id=>{const r=rigs[id],u=r.truck.userData;
    r.lift+=(r.liftT-r.lift)*ease(4);
    if(r.hop>0){r.hop=Math.max(0,r.hop-dt*1.1);if(r.hop<.02&&r.hop>0){dust(r.pos.clone().setY(r.lift),18);}}
    const hopY=reduce?0:Math.sin((1-r.hop)*Math.PI)*(r.hop>0?3:0);
    r.truck.position.y=r.lift+hopY;
    u.body.position.y=reduce?0:Math.sin(T*9+id)*.03+(app.selected===id?Math.abs(Math.sin(T*6))*.12:0);
    u.body.rotation.z=reduce?0:Math.sin(T*3+id)*.012;
    u.wheels.forEach(w=>{w.rotation.z-=app.selected===id&&!reduce?dt*8:0;});
    u.body.traverse(o=>{if(o.userData.flag){const fp=o.geometry.attributes.position;for(let i=0;i<fp.count;i++){const x=fp.getX(i);fp.setZ(i,Math.sin(x*4+T*5+id)*.1*(x+.8));}fp.needsUpdate=true;}
      if(o.userData.wing&&!reduce){o.rotation.x=o.userData.wing*(-Math.PI/2.4+Math.sin(T*3)*.25);}});
    r.pillarH+=(r.pillarT-r.pillarH)*ease(3);r.pillar.scale.y=r.pillarH;r.cap.position.y=r.pillarH+.1;
    r.pillar.material.emissiveIntensity=app.selected===id?.9+Math.sin(T*5)*.2:.5;
  });
  trophy.rotation.y=reduce?0:T*.3;
  duels.forEach(d=>{d.t=(d.t+dt*(d.live?.15:.3))%1;const t=d.live?(.5+Math.sin(T*1.1+d.a)*.38):d.t;
    d.tire.position.copy(d.curve.getPoint(t));d.tire.rotation.x+=dt*6;d.tire.rotation.y+=dt*3;
    const show=!app.selected||d.a===app.selected||d.b===app.selected;d.tube.material.opacity=show?(d.live?.45:.75):.07;d.tire.visible=show;});
  // dust particles
  const sp=sparks.geometry.attributes.position,sv=sparks.userData.v;
  for(let i=0;i<sv.length;i++){const p=sv[i];if(p.life>0){p.life-=dt*.8;p.vy-=dt*6;p.x+=p.vx*dt;p.y=Math.max(.2,p.y+p.vy*dt);p.z+=p.vz*dt;sp.setXYZ(i,p.x,p.y,p.z);}else sp.setY(i,-99);}
  sp.needsUpdate=true;
  // crowd bounce
  if(!reduce&&crowd){const b=crowd.userData.base;for(let i=0;i<b.length;i+=1){const [x,y,z,a,ph]=b[i];mtx.makeRotationY(-a);mtx.setPosition(x,y+Math.max(0,Math.sin(T*6+ph))*.18,z);crowd.setMatrixAt(i,mtx);}crowd.instanceMatrix.needsUpdate=true;}
  if(camGoal){controls.target.lerp(camGoal,ease(2.5));if(controls.target.distanceTo(camGoal)<.05)camGoal=null;}
  controls.update();if(composer)composer.render();else renderer.render(scene,camera);
  IDS.forEach(id=>{const r=rigs[id];v3.set(r.pos.x,r.truck.position.y+8.6,r.pos.z).project(camera);const el=tags[id];
    if(v3.z>1){el.hidden=true;return;}el.hidden=false;
    el.style.transform=`translate(${(v3.x*.5+.5)*innerWidth}px,${(-v3.y*.5+.5)*innerHeight}px) translate(-50%,-100%)`;
    el.classList.toggle('dim',!!app.selected&&app.selected!==id);});
  requestAnimationFrame(frame);
}

let envTex=null;
const giveEnv=root=>{if(envTex)root.traverse(o=>{const m=o.material;if(m&&m.isMeshStandardMaterial&&m.metalness>=.3){m.envMap=envTex;m.envMapIntensity=.5;m.needsUpdate=true;}});};
new RGBELoader().setDataType(THREE.UnsignedByteType).load(ASSETS+'dikhololo_night_1k.hdr',hdr=>{
  const pm=new THREE.PMREMGenerator(renderer);envTex=pm.fromEquirectangular(hdr).texture;hdr.dispose();pm.dispose();
  giveEnv(scene);
});

// Pilot: scenery from NVIDIA SimReady assets (CC BY 4.0). ?props=off in the URL leaves the arena as it was.
if(new URLSearchParams(location.search).get('props')!=='off'){
  loadProps(renderer).then(models=>{const g=placeProps(models);scene.add(g);giveEnv(g);}).catch(e=>console.warn('SimReady props unavailable',e));
}

return {
  start(){ resize(); frame(); },
  setWeek(w,ST){
    IDS.forEach(id=>{const s=ST.s[id],r=rigs[id];
      if(s.w>r.wins){r.hop=1;}
      r.wins=s.w;r.liftT=s.w*.55;r.pillarT=Math.max(.5,s.pf*pillarUnit());
      r.stack.forEach((c,i)=>c.visible=i<s.w);});
    buildDuels(w); renderTags(ST);
  },
  focus(id){
    if(!id){camGoal=new THREE.Vector3(0,3,0);controls.autoRotate=!reduce;return;}
    controls.autoRotate=false;rigs[id].hop=1;
    const p=rigs[id].pos;camGoal=new THREE.Vector3(p.x*.6,4,p.z*.6);
  }
};
}
