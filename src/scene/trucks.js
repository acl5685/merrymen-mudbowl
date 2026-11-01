import * as THREE from 'three';

/* Truck builders, ported unchanged from the prototype. Pinned to three r128 so lighting and colour match. */
export const M=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.7},o));
export const rnd=(()=>{let s=11;return()=>(s=(s*16807)%2147483647)/2147483647;})();
export const junkColors=['#7d2b2b','#2d4f7a','#6b6b6b','#3c6b44','#8a6a2a','#4a3a5a','#9a9a9a'];
export function junkCar(color){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(3.4,.5,1.7),M(color,{metalness:.4,roughness:.6,flatShading:true}));
  const roof=new THREE.Mesh(new THREE.BoxGeometry(1.6,.2,1.5),M(color,{metalness:.4,roughness:.6}));roof.position.set(-.2,.33,0);
  const glass=new THREE.Mesh(new THREE.BoxGeometry(1.5,.12,1.55),M('#1a2230',{metalness:.2,roughness:.3}));glass.position.set(-.2,.24,0);
  g.add(b,glass,roof);g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return g;}
export function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;}
const spotsTex=canvasTex(256,128,(x,w,h)=>{x.fillStyle='#f4f1ea';x.fillRect(0,0,w,h);x.fillStyle='#111';
  let s=3;const r=()=>(s=(s*16807)%2147483647)/2147483647;for(let i=0;i<46;i++){x.beginPath();x.ellipse(r()*w,r()*h,4+r()*9,3+r()*7,r()*3,0,7);x.fill();}});
const skullTex=canvasTex(128,80,(x,w,h)=>{x.fillStyle='#0b0b0b';x.fillRect(0,0,w,h);x.fillStyle='#eee';x.strokeStyle='#eee';x.lineWidth=7;x.lineCap='round';
  x.beginPath();x.moveTo(36,64);x.lineTo(92,22);x.moveTo(36,22);x.lineTo(92,64);x.stroke();
  x.beginPath();x.arc(64,36,17,0,7);x.fill();x.fillRect(55,44,18,12);x.fillStyle='#0b0b0b';x.beginPath();x.arc(57,34,4.5,0,7);x.arc(71,34,4.5,0,7);x.fill();});
const royalTex=canvasTex(128,80,(x,w,h)=>{x.fillStyle='#173a7a';x.fillRect(0,0,w,h);x.fillStyle='#e8c14a';
  for(let i=0;i<3;i++){const cx=26+i*38,cy=40;x.beginPath();x.moveTo(cx,cy-16);x.quadraticCurveTo(cx+8,cy-4,cx,cy+12);x.quadraticCurveTo(cx-8,cy-4,cx,cy-16);x.fill();x.fillRect(cx-9,cy,18,3);}});

export const tireGeo=new THREE.CylinderGeometry(1.15,1.15,1,18);tireGeo.rotateX(Math.PI/2);
const treadGeo=new THREE.TorusGeometry(1.08,.14,4,18);
export const rimGeo=new THREE.CylinderGeometry(.55,.55,1.04,12);rimGeo.rotateX(Math.PI/2);
export function makeTruck(T){
  const th=T.theme,G=new THREE.Group(),body=new THREE.Group();
  const bodyMat={spots:M('#ffffff',{map:spotsTex,roughness:.5}),spikes:M('#2b2e33',{metalness:.6,roughness:.4}),royal:M('#7cc0ec',{roughness:.45}),
    dragon:M('#3f9a3a',{roughness:.5,flatShading:true}),pirate:M('#141414',{roughness:.5}),dawg:M('#8e5a2b',{roughness:.65})}[th];
  const rimCol={spots:'#c42a2a',spikes:'#f08a24',royal:'#e8c14a',dragon:'#e0602a',pirate:'#c9a54a',dawg:'#c42a2a'}[th];
  // tires
  const wheels=[];
  [[1.9,1.55],[1.9,-1.55],[-1.9,1.55],[-1.9,-1.55]].forEach(([x,z],i)=>{const w=new THREE.Group();
    let tc='#1a1a1a';if(th==='pirate'&&i===1)tc='#9a1f1f';if(th==='pirate'&&i===3)tc='#8d8d8d';
    const t=new THREE.Mesh(tireGeo,M(tc,{roughness:.95}));const tr1=new THREE.Mesh(treadGeo,M(tc,{roughness:1}));tr1.position.z=.32;const tr2=tr1.clone();tr2.position.z=-.32;
    const r=new THREE.Mesh(rimGeo,M(rimCol,{metalness:.7,roughness:.3}));w.add(t,tr1,tr2,r);w.position.set(x,1.15,z);w.traverse(o=>o.castShadow=true);G.add(w);wheels.push(w);});
  // chassis + shocks
  const frame=new THREE.Mesh(new THREE.BoxGeometry(4.2,.3,1.6),M('#2b2b2b',{metalness:.5}));frame.position.y=1.5;G.add(frame);
  [[1.9,.9],[1.9,-.9],[-1.9,.9],[-1.9,-.9]].forEach(([x,z])=>{const s=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,1.4,6),M('#c0c4cc',{metalness:.8,roughness:.3}));s.position.set(x*.8,2,z);s.rotation.x=z>0?-.25:.25;G.add(s);});
  // body shell
  const shell=new THREE.Mesh(new THREE.BoxGeometry(4.6,1.1,2.6),bodyMat);shell.position.y=2.75;
  const cab=new THREE.Mesh(new THREE.BoxGeometry(1.8,.9,2.2),bodyMat);cab.position.set(-.4,3.7,0);
  const glass=new THREE.Mesh(new THREE.BoxGeometry(1.84,.5,2.0),M('#10161f',{metalness:.3,roughness:.2}));glass.position.set(-.35,3.75,0);
  body.add(shell,cab,glass);
  const add=(geo,mat,x,y,z,rx=0,ry=0,rz=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);body.add(m);return m;};
  const teethMat=M('#f5f2ea',{roughness:.4}), mouthMat=M('#5a0d12');
  if(th==='spots'||th==='dawg'||th==='dragon'){ // snarling grille
    add(new THREE.BoxGeometry(.12,.55,2.3),mouthMat,2.31,2.6,0);
    for(let i=0;i<7;i++){add(new THREE.ConeGeometry(.13,.32,4),teethMat,2.36,2.82,-1+i*.33,Math.PI,0,0);add(new THREE.ConeGeometry(.13,.3,4),teethMat,2.36,2.38,-.85+i*.28);}
  }
  if(th==='spots'||th==='dawg'){
    add(new THREE.SphereGeometry(.42,12,10),M('#0c0c0c',{roughness:.3}),2.35,3.35,0);
    add(new THREE.BoxGeometry(.06,.9,.5),M('#e2687a'),2.4,2.15,.35,0,0,.25);
    const earMat=M(th==='spots'?'#121212':'#5c3716',{side:THREE.DoubleSide});
    [-1,1].forEach(s=>add(new THREE.BoxGeometry(.9,.12,.7),earMat,-.4,4.0,s*1.2,s*.9,0,.2));
    add(new THREE.CylinderGeometry(.07,.12,1.3,6),earMat,-2.6,3.4,0,0,0,-.9);
  }
  if(th==='dawg'){ // giant bone on the roof rack
    const bm=M('#efe3c4');add(new THREE.CylinderGeometry(.14,.14,1.5,8),bm,-.4,4.45,0,Math.PI/2);
    [-1,1].forEach(s=>{add(new THREE.SphereGeometry(.2,8,8),bm,-.4,4.45,s*.78+.12);add(new THREE.SphereGeometry(.2,8,8),bm,-.4,4.45,s*.78-.12);});
  }
  if(th==='dragon'){
    for(let i=0;i<8;i++)add(new THREE.ConeGeometry(.22,.7,5),M('#e0602a',{flatShading:true}),1.8-i*.6,i<3?3.55:(i<5?4.4:3.55),0);
    const wing=new THREE.Shape();wing.moveTo(0,0);wing.lineTo(2.6,1.6);wing.lineTo(2.2,.4);wing.lineTo(3,.2);wing.lineTo(1.4,-.3);wing.lineTo(0,0);
    const wg=new THREE.ShapeGeometry(wing);const wm=M('#2fb3a0',{side:THREE.DoubleSide,roughness:.5});
    [-1,1].forEach(s=>{const w=add(wg,wm,-1,3.2,s*1.3,s*-Math.PI/2.4,0,0);w.rotation.order='YXZ';w.rotation.y=Math.PI;w.userData.wing=s;});
    [-1,1].forEach(s=>add(new THREE.ConeGeometry(.16,.8,5),M('#d8cfa8'),2.0,3.55,s*.8,0,0,-.6));
    add(new THREE.SphereGeometry(.14,8,8),new THREE.MeshBasicMaterial({color:'#ffd23a'}),2.3,3.15,.7);
    add(new THREE.SphereGeometry(.14,8,8),new THREE.MeshBasicMaterial({color:'#ffd23a'}),2.3,3.15,-.7);
  }
  if(th==='pirate'){
    add(new THREE.BoxGeometry(4.64,.18,2.64),M('#8a1d22'),0,2.25,0);
    add(new THREE.CylinderGeometry(.18,.24,1.8,10),M('#b9bcc2',{metalness:.8,roughness:.25}),2.5,3.0,.6,0,0,Math.PI/2);
    add(new THREE.CylinderGeometry(.07,.07,3.2,6),M('#3a2a1c'),-1.6,5.0,0);
    const flag=add(new THREE.PlaneGeometry(1.7,1.05,8,1),new THREE.MeshStandardMaterial({map:skullTex,side:THREE.DoubleSide}),-.75,6.0,0);flag.userData.flag=true;
    add(new THREE.ConeGeometry(.9,.5,3),M('#111'),-.4,4.4,0,0,Math.PI/6,0); // tricorn
  }
  if(th==='royal'){
    add(new THREE.BoxGeometry(4.64,.16,2.64),M('#e8c14a',{metalness:.7,roughness:.3}),0,3.32,0);
    const crown=new THREE.Group();const cg=M('#f2c645',{metalness:.85,roughness:.25,emissive:'#3a2800',emissiveIntensity:.5});
    const band=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,.4,16,1,true),cg);crown.add(band);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const p=new THREE.Mesh(new THREE.ConeGeometry(.16,.5,5),cg);p.position.set(Math.cos(a)*.7,.42,Math.sin(a)*.7);crown.add(p);
      const gem=new THREE.Mesh(new THREE.SphereGeometry(.07,6,6),new THREE.MeshBasicMaterial({color:i%2?'#d1203a':'#2f6fe0'}));gem.position.set(Math.cos(a)*.71,0,Math.sin(a)*.71);crown.add(gem);}
    crown.position.set(-.4,4.4,0);body.add(crown);
    const whip=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.2,4.2,.8),new THREE.Vector3(-1.6,6.2,1.2),new THREE.Vector3(-.4,7.6,1.6),new THREE.Vector3(1.0,7.1,1.2),new THREE.Vector3(1.4,6.0,.4)]);
    const wm=add(new THREE.TubeGeometry(whip,40,.06,5),M('#1a1410',{roughness:.6}),0,0,0);wm.userData.whip=true;
    add(new THREE.CylinderGeometry(.04,.04,2.4,5),M('#cfcfcf',{metalness:.7}),-1.9,4.6,-1.0);
    const f=add(new THREE.PlaneGeometry(1.3,.8,6,1),new THREE.MeshStandardMaterial({map:royalTex,side:THREE.DoubleSide}),-1.25,5.45,-1.0);f.userData.flag=true;
  }
  if(th==='spikes'){
    const sm=M('#c7cbd2',{metalness:.85,roughness:.25});
    for(let i=0;i<11;i++)[-1,1].forEach(s=>add(new THREE.ConeGeometry(.12,.6,6),sm,-2.1+i*.42,3.45,s*1.15,s*.5,0,0));
    for(let i=0;i<5;i++)add(new THREE.ConeGeometry(.14,.7,6),sm,-1.1+i*.32,4.45,0);
    add(new THREE.BoxGeometry(4.64,.22,2.64),M('#f08a24',{emissive:'#5a2500',emissiveIntensity:.4}),0,2.3,0);
    add(new THREE.BoxGeometry(4.64,.08,2.64),M('#f5c518'),0,3.12,0);
    const face=add(new THREE.SphereGeometry(.75,12,10),sm,2.2,2.75,0);face.scale.set(.5,1,1);
    [-1,1].forEach(s=>add(new THREE.SphereGeometry(.14,8,8),new THREE.MeshBasicMaterial({color:'#ff6a1a'}),2.6,2.95,s*.3));
    [-1,1].forEach(s=>add(new THREE.CylinderGeometry(.13,.13,1.1,8),sm,1.3,3.6,s*.9,0,0,-.35));
  }
  body.traverse(o=>{if(o.isMesh){o.castShadow=true;}});
  G.add(body);
  G.userData={body,wheels};
  return G;
}
export function makeTire(){const g=new THREE.Group();const t=new THREE.Mesh(tireGeo,M('#1a1a1a',{roughness:.95}));const r=new THREE.Mesh(rimGeo,M('#cfcfcf',{metalness:.7}));g.add(t,r);g.scale.setScalar(.55);return g;}
