'use strict';
// ===================== Denda: Gaučový šampion =====================
const $=id=>document.getElementById(id);
const R=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.random()*a.length|0];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ST={};
function resetST(){Object.assign(ST,{kroky:25,burgery:0,vaha:118,zlomeniny:0,skrabance:0,tep:68,tepMax:68,goly:0,chyceno:0,kanaly:0,basaky:0,db:0,sousedi:0,basy:0,anetka:0,okno:0});}
resetST();
const fat=()=>1+Math.max(0,ST.vaha-118)/32;

// ---------- renderer ----------
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true});}catch(e){document.body.innerHTML='<p style="padding:20px;font-size:18px">Tenhle prohlížeč neumí 3D (WebGL) 😢 Zkus Chrome nebo Safari.</p>';throw e;}
renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
renderer.setSize(innerWidth,innerHeight);
document.body.prepend(renderer.domElement);
const cam=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,0.1,400);
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();});
const camK=()=>Math.pow(Math.max(1,1.15/cam.aspect),0.62); // na mobilu na výšku kamera odjede dál
const _lk=new THREE.Vector3(),_cp=new THREE.Vector3();
function aim(px,py,pz,lx,ly,lz,lerp=1){const k=camK();_lk.set(lx,ly,lz);_cp.set(lx+(px-lx)*k,ly+(py-ly)*k,lz+(pz-lz)*k);
  if(lerp>=1)cam.position.copy(_cp);else cam.position.lerp(_cp,lerp);cam.userData.look=(cam.userData.look||new THREE.Vector3()).copy(_lk);}

// ---------- stavebnice ----------
const MC={};const M=c=>MC[c]||(MC[c]=new THREE.MeshLambertMaterial({color:c}));
function mesh(g,c,x,y,z,p){const m=new THREE.Mesh(g,typeof c==='string'?M(c):c);m.position.set(x||0,y||0,z||0);if(p)p.add(m);return m;}
const box=(w,h,d,c,x,y,z,p)=>mesh(new THREE.BoxGeometry(w,h,d),c,x,y,z,p);
const cyl=(rt,rb,h,c,x,y,z,p,s=14)=>mesh(new THREE.CylinderGeometry(rt,rb,h,s),c,x,y,z,p);
const sph=(r,c,x,y,z,p)=>mesh(new THREE.SphereGeometry(r,16,12),c,x,y,z,p);
function newScene(sky){const s=new THREE.Scene();s.background=new THREE.Color(sky);
  s.add(new THREE.HemisphereLight(0xffffff,0x887766,1.9));const d=new THREE.DirectionalLight(0xffffff,2.0);d.position.set(4,10,6);s.add(d);return s;}
function texLabel(txt,bg,fg='#fff',W=512,H=128,font=60){const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle=bg;const r=28;x.beginPath();x.moveTo(r,0);x.arcTo(W,0,W,H,r);x.arcTo(W,H,0,H,r);x.arcTo(0,H,0,0,r);x.arcTo(0,0,W,0,r);x.fill();
  x.fillStyle=fg;let fs=font;do{x.font='900 '+fs+'px Segoe UI, Arial, sans-serif';fs-=2;}while(fs>10&&x.measureText(txt).width>W*0.9);x.textAlign='center';x.textBaseline='middle';x.fillText(txt,W/2,H/2+4);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function label(txt,bg='#e6007e',fg='#fff',w=1.6){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:texLabel(txt,bg,fg),depthTest:false}));s.scale.set(w,w/4,1);s.renderOrder=9;return s;}
function plaque(txt,bg,fg,w,h,p,x,y,z,ry=0){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texLabel(txt,bg,fg,512,Math.round(512*h/w),Math.min(70,Math.round(380*h/w)))}));m.position.set(x,y,z);m.rotation.y=ry;p.add(m);return m;}

// postavička z kvádrů a koulí; nohy u y=0, kouká na +z
function person(o={}){
  const {skin='#f1c27d',shirt='#3478f6',pants='#333',hair='#3b2a1a',h=1,longHair=false,shoes='#222'}=o;
  const g=new THREE.Group(),s=new THREE.Group();g.add(s);s.scale.setScalar(h);const P={g,s};
  const leg=side=>{const hip=new THREE.Group();hip.position.set(side*0.13,0.9,0);s.add(hip);
    cyl(0.1,0.09,0.46,pants,0,-0.23,0,hip);const knee=new THREE.Group();knee.position.y=-0.45;hip.add(knee);
    cyl(0.09,0.08,0.45,pants,0,-0.225,0,knee);box(0.15,0.08,0.27,shoes,0,-0.44,0.05,knee);return {hip,knee};};
  P.L=leg(-1);P.Rl=leg(1);
  P.torso=cyl(0.21,0.19,0.62,shirt,0,1.2,0,s);
  P.belly=sph(0.21,shirt,0,1.08,0.06,s);
  P.head=new THREE.Group();P.head.position.y=1.7;s.add(P.head);
  sph(0.17,skin,0,0,0,P.head);sph(0.026,'#111',-0.06,0.03,0.155,P.head);sph(0.026,'#111',0.06,0.03,0.155,P.head);
  box(0.08,0.02,0.02,'#a33',0,-0.07,0.16,P.head);sph(0.03,skin,0,-0.01,0.17,P.head);
  const hr=sph(0.178,hair,0,0.05,-0.025,P.head);hr.scale.set(1,0.72,1);
  if(longHair){box(0.34,0.42,0.1,hair,0,-0.12,-0.13,P.head);}
  const arm=side=>{const sh=new THREE.Group();sh.position.set(side*0.3,1.46,0);s.add(sh);cyl(0.07,0.06,0.56,shirt,0,-0.28,0,sh);sph(0.07,skin,0,-0.6,0,sh);return sh;};
  P.aL=arm(-1);P.aR=arm(1);
  P.setFat=f=>{P.belly.scale.set(f,f*0.92,f*1.15);P.belly.position.z=0.06+(f-1)*0.17;P.torso.scale.set(0.9+0.3*f,1,0.9+0.3*f);
    P.aL.position.x=-(0.25+0.08*f);P.aR.position.x=0.25+0.08*f;P.aL.rotation.z=-(f-1)*0.25;P.aR.rotation.z=(f-1)*0.25;P.head.scale.setScalar(1+(f-1)*0.18);};
  P.setFat(o.fat||1);
  P.sit=()=>{P.L.hip.rotation.set(-Math.PI/2,0,0);P.Rl.hip.rotation.set(-Math.PI/2,0,0);P.L.knee.rotation.set(Math.PI/2,0,0);P.Rl.knee.rotation.set(Math.PI/2,0,0);};
  P.stand=()=>{[P.L.hip,P.Rl.hip,P.L.knee,P.Rl.knee,P.aL,P.aR].forEach(q=>{q.rotation.x=0;});};
  P.walk=(t,a=0.6)=>{const w=Math.sin(t)*a;P.L.hip.rotation.x=w;P.Rl.hip.rotation.x=-w;P.aL.rotation.x=-w*0.8;P.aR.rotation.x=w*0.8;
    P.L.knee.rotation.x=Math.max(0,w)*0.9;P.Rl.knee.rotation.x=Math.max(0,-w)*0.9;};
  return P;}
function makeDenda(){const P=person({skin:'#f0c090',shirt:'#8a8f98',pants:'#3d4f7a',hair:'#2a1a0a',shoes:'#c9c9c9',fat:fat()});
  P.cast=cyl(0.17,0.16,0.56,'#ffffff',0,-0.21,0.01,P.Rl.knee);P.cast.visible=false;
  box(0.1,0.06,0.11,'#111',0,-0.5,0,P.aL);box(0.07,0.065,0.08,'#3f3',0,-0.5,0.012,P.aL); // hodinky
  const l=label('DENDA','#ffcc00','#111',1.1);l.position.y=2.25;P.g.add(l);P.lab=l;return P;}
function burger(){const g=new THREE.Group();const b1=sph(0.14,'#d9902f',0,0.06,0,g);b1.scale.y=0.55;cyl(0.15,0.15,0.04,'#5a2d0c',0,0.02,0,g);
  cyl(0.16,0.16,0.012,'#4caf50',0,0.045,0,g);cyl(0.155,0.155,0.012,'#ffd54f',0,0.0,0,g);const b2=sph(0.14,'#c97f22',0,-0.03,0,g);b2.scale.y=0.35;return g;}
// generický hatchback = "Golfík"
function makeGolf(color='#1f4e9a'){const g=new THREE.Group();
  box(1.8,0.62,3.9,color,0,0.6,0,g);box(1.62,0.58,2.25,color,0,1.18,0.35,g);
  box(1.5,0.44,0.06,'#26354a',0,1.17,-0.79,g);box(1.5,0.4,0.06,'#26354a',0,1.2,1.48,g);box(1.64,0.36,1.9,'#26354a',0,1.2,0.35,g);
  [[-0.86,-1.25],[0.86,-1.25],[-0.86,1.25],[0.86,1.25]].forEach(([x,z])=>{const w=cyl(0.34,0.34,0.26,'#151515',x,0.34,z,g,16);w.rotation.z=Math.PI/2;const h=cyl(0.18,0.18,0.27,'#bbb',x,0.34,z,g,10);h.rotation.z=Math.PI/2;});
  const hl=new THREE.MeshBasicMaterial({color:0xfff6c8});mesh(new THREE.BoxGeometry(0.38,0.16,0.05),hl,-0.6,0.72,-1.96,g);mesh(new THREE.BoxGeometry(0.38,0.16,0.05),hl,0.6,0.72,-1.96,g);
  const tl=new THREE.MeshBasicMaterial({color:0xd01010});mesh(new THREE.BoxGeometry(0.36,0.16,0.05),tl,-0.66,0.82,1.96,g);mesh(new THREE.BoxGeometry(0.36,0.16,0.05),tl,0.66,0.82,1.96,g);
  box(1.86,0.16,0.12,'#222',0,0.36,-1.96,g);box(1.86,0.16,0.12,'#222',0,0.36,1.96,g);
  plaque('DENDA 1','#f4f4f4','#123',0.62,0.15,g,0,0.55,2.03);
  plaque('GOLFÍK','#00000000','#fff',0.7,0.16,g,0,1.48,1.52);
  g.scr=[];return g;}
function scratch(car){if(Math.random()<0.45){const m=box(R(0.3,0.8),0.035,0.03,'#e8e8e8',R(-0.6,0.6),R(0.45,1.0),1.985,car);m.rotation.z=R(-0.5,0.5);car.scr.push(m);return;}const side=Math.random()<0.5?-1:1;const m=box(0.03,0.035,R(0.4,1.3),'#e8e8e8',side*0.915,R(0.45,0.85),R(-1.6,1.6),car);m.rotation.x=R(-0.25,0.25);car.scr.push(m);
  if(Math.random()<0.5){const d=box(0.03,0.2,0.25,'#555',side*0.912,R(0.45,0.8),R(-1.5,1.5),car);car.scr.push(d);}}
let CAR=makeGolf();
function tree(p,x,z,s=1){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);cyl(0.15,0.2,1.2,'#6b4a2a',0,0.6,0,g);const c=mesh(new THREE.ConeGeometry(0.9,2.2,8),'#2e7d32',0,2.1,0,g);p.add(g);return g;}

// ---------- zvuky (WebAudio, bez souborů) ----------
let AC=null;function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}}if(AC.state==='suspended')AC.resume();return AC;}
function tone(f,d=0.15,type='sine',v=0.2,f2){const a=ac();if(!a)return;const t=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+0.03);}
function noise(d=0.3,v=0.3){const a=ac();if(!a)return;const b=a.createBuffer(1,Math.floor(a.sampleRate*d),a.sampleRate),c=b.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=(Math.random()*2-1)*(1-i/c.length);
  const s=a.createBufferSource(),g=a.createGain();g.gain.value=v;s.buffer=b;s.connect(g);g.connect(a.destination);s.start();}
const SND={krup(){noise(0.22,0.7);tone(220,0.45,'sawtooth',0.3,40);setTimeout(()=>noise(0.12,0.5),90);},chomp(){[0,130,260].forEach(t=>setTimeout(()=>noise(0.07,0.3),t));},
  horn(){tone(415,0.35,'square',0.1);tone(523,0.35,'square',0.08);},crash(){noise(0.35,0.55);tone(110,0.3,'square',0.12,40);},kick(){tone(150,0.13,'sine',0.5,55);noise(0.04,0.2);},
  whistle(){tone(2300,0.18,'sine',0.13);setTimeout(()=>tone(2300,0.45,'sine',0.13,2500),220);},goal(){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,0.28,'triangle',0.22),i*110));},
  siren(){for(let i=0;i<8;i++)setTimeout(()=>tone(i%2?960:700,0.46,'triangle',0.09),i*480);},beep(){tone(1250,0.07,'square',0.05);},ding(){tone(880,0.18,'sine',0.15);setTimeout(()=>tone(1320,0.3,'sine',0.12),120);},
  splat(){noise(0.12,0.25);tone(300,0.1,'sine',0.15,120);},bass(b){const n=[55,55,65.4,49][Math.floor(b/2)%4];tone(120,0.22,'sine',0.6,38);tone(n,0.42,'sawtooth',0.07);},hat(){noise(0.035,0.09);},dingdong(){tone(784,0.45,'triangle',0.25);setTimeout(()=>tone(622,0.7,'triangle',0.25),420);},
  sad(){[392,370,349,330].forEach((f,i)=>setTimeout(()=>tone(f,0.35,'triangle',0.15),i*260));}};

// ---------- UI ----------
const TQ=[];let tT=0,tGap=0;function toast(t){TQ.push(t);if(TQ.length>4)TQ.shift();}
let sayTo=0;function say(html,ms=3600){const e=$('say');e.innerHTML=html;e.style.bottom=($('joy').style.display==='block'&&innerWidth<700?175:(($('btns').offsetHeight||0)+(innerWidth<600?22:30)))+'px';e.style.display='block';clearTimeout(sayTo);sayTo=setTimeout(()=>e.style.display='none',ms);}
function hideSay(){$('say').style.display='none';clearTimeout(sayTo);}
let BTN=[];
function setBtns(list,side){const w=$('btns');w.innerHTML='';w.className=side?'side':'';BTN=list.map(b=>{const e=document.createElement('button');e.className='b '+(b.c||'');e.innerHTML=b.t;if(b.id)e.id=b.id;
  e.addEventListener('pointerdown',ev=>{ev.preventDefault();ac();if(!e.classList.contains('off'))b.f();});w.appendChild(e);b.el=e;return b;});}
function burst(t,ms=1100){const b=$('burst');b.firstChild.textContent=t;b.firstChild.style.fontSize=t.length>11?'min(10vw,104px)':'';b.style.display='flex';b.firstChild.style.animation='none';void b.offsetWidth;b.firstChild.style.animation='';clearTimeout(burst.to);burst.to=setTimeout(()=>b.style.display='none',ms);}
function bar(v){const b=$('bar');if(v==null){b.style.display='none';return;}b.style.display='block';b.firstChild.style.width=(clamp(v,0,1)*100)+'%';}
const keys={};
addEventListener('keydown',e=>{if(e.repeat)return;keys[e.code]=1;ac();for(const b of BTN){if(b.k&&b.k.includes(e.code)&&!b.el.classList.contains('off')){e.preventDefault();b.f();return;}}});
addEventListener('keyup',e=>{keys[e.code]=0;});
const joy={x:0,y:0,id:null};{const J=$('joy'),K=J.firstChild;
  const jm=e=>{const r=J.getBoundingClientRect();let dx=(e.clientX-r.left-r.width/2)/(r.width/2),dy=(e.clientY-r.top-r.height/2)/(r.height/2);const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l;}joy.x=dx;joy.y=dy;K.style.transform=`translate(${dx*40}px,${dy*40}px)`;};
  J.addEventListener('pointerdown',e=>{ac();joy.id=e.pointerId;J.setPointerCapture(e.pointerId);jm(e);});
  J.addEventListener('pointermove',e=>{if(e.pointerId===joy.id)jm(e);});
  const up=e=>{if(e.pointerId===joy.id){joy.id=null;joy.x=joy.y=0;K.style.transform='';}};J.addEventListener('pointerup',up);J.addEventListener('pointercancel',up);}
let shakeT=0;
function updWatch(){const t=$('wTep');t.textContent=Math.round(ST.tep);t.className=ST.tep>140?'hot':'';$('wKr').textContent=Math.floor(ST.kroky);$('wKg').textContent=ST.vaha.toFixed(1);ST.tepMax=Math.max(ST.tepMax,ST.tep);}

// ---------- scény ----------
let cur=null,curName='',scene=new THREE.Scene(),T=0,goLock=false;
const SC={};
function go(n,instant){if(goLock)return;goLock=true;const f=$('fade');f.style.opacity=instant?0:1;
  setTimeout(()=>{hideSay();TQ.length=0;tT=0;tGap=0;$('toast').classList.remove('on');$('pbub').style.display='none';setFov(55);setBtns([]);bar(null);$('joy').style.display='none';joy.x=joy.y=0;
    cur=SC[n];curName=n;cur.t=0;scene=cur.enter();$('scn').textContent=cur.title;f.style.opacity=0;goLock=false;window.dispatchEvent(new Event('scene'));},instant?0:380);}

// pokoj (obývák) – sdílený pro začátek i konec
function livingRoom(s){
  box(10,0.1,9,'#b5835a',0,-0.05,0,s);box(4.2,0.02,3,'#2e6b8a',0,0.01,-1.9,s);
  box(1.3,4,0.2,'#efe3c6',-4.35,2,-4.5,s);box(6.5,4,0.2,'#efe3c6',1.75,2,-4.5,s);box(2.2,1.65,0.2,'#efe3c6',-2.6,0.825,-4.5,s);box(2.2,1.05,0.2,'#efe3c6',-2.6,3.475,-4.5,s);box(0.2,4,9,'#e2d5b6',-5,2,0,s);
  const door=new THREE.Group();door.position.set(2.8,0,-4.38);s.add(door);box(1.2,2.3,0.06,'#7a4a2a',0.6,1.15,0,door);sph(0.05,'#ffd700',1.05,1.1,0.05,door); // dveře
  // okno: rám + otevírací křídlo (pant vlevo), venku ulice
  box(2.3,0.08,0.14,'#fff',-2.6,1.62,-4.38,s);box(2.3,0.08,0.14,'#fff',-2.6,2.98,-4.38,s);box(0.08,1.4,0.14,'#fff',-3.72,2.3,-4.38,s);box(0.08,1.4,0.14,'#fff',-1.48,2.3,-4.38,s);
  const win=new THREE.Group();win.position.set(-3.7,1.65,-4.42);s.add(win);
  mesh(new THREE.PlaneGeometry(2.18,1.3),new THREE.MeshBasicMaterial({color:0x9fd6ff,transparent:true,opacity:0.28,depthWrite:false,side:THREE.DoubleSide}),1.1,0.65,0,win);
  box(0.05,1.3,0.05,'#fff',1.1,0.65,0,win);box(0.08,0.05,0.06,'#ccc',2.05,0.65,0.05,win);
  const out=new THREE.Mesh(new THREE.PlaneGeometry(160,80),new THREE.MeshBasicMaterial({color:0x6f9cc8}));out.position.set(-2,0,-34);s.add(out);
  street(s);
  plaque('MŮJ GOLF ❤','#1f4e9a','#fff',1.3,0.5,s,0.2,2.75,-4.38);
  const couch=new THREE.Group();couch.position.set(0,0,-3);s.add(couch);
  box(2.8,0.25,0.95,'#5a2525',0,0.12,0,couch);couch.seat=box(2.6,0.24,0.9,'#8b3a3a',0,0.36,0.02,couch);
  box(2.8,0.85,0.28,'#8b3a3a',0,0.72,-0.44,couch);box(0.26,0.6,0.98,'#7a3030',-1.4,0.45,0,couch);box(0.26,0.6,0.98,'#7a3030',1.4,0.45,0,couch);
  const dent=box(0.9,0.05,0.7,'#6e2c2c',0,0.49,0.05,couch); // důlek po Dendovi
  const table=new THREE.Group();table.position.set(0,0,-1.6);s.add(table);box(1.5,0.08,0.75,'#6b4a2a',0,0.45,0,table);
  [[-0.65,-0.3],[0.65,-0.3],[-0.65,0.3],[0.65,0.3]].forEach(([x,z])=>box(0.06,0.45,0.06,'#4a3018',x,0.22,z,table));
  const tv=new THREE.Group();tv.position.set(-2.9,0,-0.2);tv.rotation.y=Math.atan2(2.9,-2.8);s.add(tv);
  box(1.7,0.5,0.5,'#333',0,0.25,0,tv);box(2.0,1.15,0.08,'#111',0,1.15,0,tv);
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(1.85,1.0),new THREE.MeshBasicMaterial({color:0x4466ff}));scr.position.set(0,1.15,0.045);tv.add(scr);
  cyl(0.03,0.03,1.6,'#222',4.2,0.8,-3.6,s);const sh=cyl(0.25,0.4,0.4,'#fff3c4',4.2,1.75,-3.6,s);
  cyl(0.25,0.2,0.5,'#c0603a',-4.3,0.25,-3.8,s);sph(0.5,'#3c8d3c',-4.3,0.95,-3.8,s);
  const spk=[-1.5,1.5].map(x=>{const g=speaker();g.position.set(x,0.68,0.05);g.visible=!!ST.basaky;tv.add(g);return g;});
  return {couch,table,scr,tv,dent,door,spk,win,out};}
// ulice pod Dendovým oknem – obývák je ve 2. patře (podlaha 6,4 m nad ulicí)
const GY=-6.4;
function street(s){
  // fasáda domu č. 10 zvenku (pod oknem, okolo a nad)
  const F='#e8dcc0';box(16,6.4,0.12,F,-1,GY/2,-4.66,s);box(4,4.3,0.12,F,-7,2.15,-4.66,s);box(2,4.3,0.12,F,6,2.15,-4.66,s);box(16.4,0.5,0.4,'#cdbd9b',-1,4.35,-4.7,s);
  box(2.5,0.08,0.3,'#bfb08f',-2.6,1.58,-4.75,s); // parapet
  [-6.5,-2.6,1.6].forEach(x=>[-0.9,-4.1].forEach(y=>{if(x===1.6&&y<-3)return;box(2.0,1.3,0.06,'#6f8faa',x,y,-4.74,s);box(2.1,0.07,0.2,'#fff',x,y-0.68,-4.76,s);}));
  [-6.5,1.6].forEach(x=>{box(2.0,1.3,0.06,'#6f8faa',x,2.3,-4.74,s);});
  box(1.3,2.3,0.08,'#5a3a22',1.6,GY+1.15,-4.75,s);plaque('č. 10','#1f4e9a','#fff',0.6,0.3,s,1.6,GY+2.6,-4.8,Math.PI);
  plaque('2. patro – DENDA','#ffcc00','#111',1.5,0.3,s,-2.6,1.25,-4.8,Math.PI);
  // dům č. 12 vedle
  box(7,13,0.4,'#c9a98a',-12.5,GY+6.5,-4.9,s);plaque('č. 12','#7a3020','#fff',0.7,0.34,s,-10.5,GY+2.6,-5.12,Math.PI);
  for(let y=GY+1.6;y<5;y+=3.2)[-14,-11].forEach(x=>box(1.6,1.2,0.06,'#6f8faa',x,y,-5.12,s));
  // chodník, silnice, protější domy
  box(40,0.2,3.2,'#a7a7a7',-2,GY-0.1,-6.2,s);box(40,0.22,0.2,'#888',-2,GY-0.09,-7.8,s);box(40,0.1,6,'#3a3a3a',-2,GY-0.15,-10.9,s);
  for(let x=-20;x<20;x+=3)box(1.4,0.02,0.15,'#eee',x,GY-0.09,-10.9,s);box(40,0.2,3,'#a7a7a7',-2,GY-0.1,-15.4,s);
  [[-12,'#d8c9a8',13],[-2,'#e0b98f',15],[9,'#bcc7d0',12]].forEach(([x,c,h])=>{box(9.6,h,0.5,c,x,GY+h/2,-17.2,s);for(let y=GY+1.8;y<GY+h-1;y+=3.2)for(let k=-3;k<=3;k+=3)box(1.5,1.2,0.06,'#5f7f9a',x+k,y,-16.93,s);});
  // zastávka + lampa
  const bs=new THREE.Group();bs.position.set(4.2,GY,-7.0);s.add(bs);[-1.1,1.1].forEach(x=>cyl(0.05,0.05,2.3,'#555',x,1.15,0,bs));box(2.6,0.1,1.1,'#557',0,2.32,-0.2,bs);
  box(2.2,1.2,0.04,'#9fd6ff',0,1.3,-0.7,bs);box(1.6,0.12,0.4,'#7a4a2a',0,0.5,-0.4,bs);plaque('🚌 ZASTÁVKA','#1565c0','#fff',1.2,0.3,bs,0,2.6,0.1);
  cyl(0.06,0.06,4.2,'#333',-0.2,GY+2.1,-7.4,s);sph(0.2,'#ffe9a0',-0.2,GY+4.25,-7.4,s);
  // Golf zaparkovaný dole + popelnice
  CAR.position.set(-8.5,GY,-9.0);const sl=new THREE.DirectionalLight(0xfff2dd,1.5);sl.position.set(6,10,-30);s.add(sl);CAR.rotation.set(0,Math.PI/2,0);s.add(CAR);
  cyl(0.32,0.3,0.9,'#2e7d32',-6.0,GY+0.45,-5.0,s);cyl(0.32,0.3,0.9,'#1565c0',-5.2,GY+0.45,-5.0,s);
}

// basák = velký basový repro
function speaker(){const g=new THREE.Group();box(0.78,1.36,0.62,'#141414',0,0,0,g);box(0.8,0.06,0.64,'#333',0,0.68,0,g);
  const c=new THREE.Group();c.position.set(0,-0.22,0.31);g.add(c);const w=cyl(0.3,0.3,0.05,'#2b2b2b',0,0,0,c,20);w.rotation.x=Math.PI/2;const w2=cyl(0.2,0.24,0.06,'#444',0,0,0.02,c,20);w2.rotation.x=Math.PI/2;const w3=sph(0.08,'#666',0,0,0.04,c);w3.scale.z=0.5;
  const tw=cyl(0.09,0.09,0.05,'#3a3a3a',0,0.4,0.31,g,14);tw.rotation.x=Math.PI/2;
  plaque('KUSÁČ BASS','#141414','#ffcc00',0.6,0.11,g,0,0.18,0.315);g.cone=c;return g;}
// diskotéka v obýváku (basáky od Kusáče)
function makeDisco(s,room,D){const X={on:false,beat:-1,pump:0,lt:[]};
  const ball=new THREE.Group();ball.position.set(0.3,3.25,-1.2);s.add(ball);ball.visible=false;cyl(0.01,0.01,1.4,'#999',0,0.85,0,ball);
  mesh(new THREE.IcosahedronGeometry(0.32,1),new THREE.MeshPhongMaterial({color:0xdddddd,flatShading:true,shininess:120,specular:0xffffff}),0,0,0,ball);X.ball=ball;
  [0xff2060,0x20ff60,0x3060ff,0xffd000].forEach((c,i)=>{const l=new THREE.PointLight(c,0,9,1);l.position.set(0,2.5,-1.5);s.add(l);
    const spot=new THREE.Mesh(new THREE.CircleGeometry(0.55,20),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.45,depthWrite:false}));spot.rotation.x=-Math.PI/2;spot.position.y=0.03;spot.visible=false;s.add(spot);X.lt.push({l,spot,i});});
  X.hemi=s.children.find(o=>o.isHemisphereLight);X.dir=s.children.find(o=>o.isDirectionalLight);
  X.start=()=>{X.on=true;ball.visible=true;X.lt.forEach(o=>{o.l.intensity=9;o.spot.visible=true;});X.hemi.intensity=0.8;X.dir.intensity=0.7;room.spk.forEach(g=>g.visible=true);};
  X.update=(dt)=>{if(!X.on)return;const bt=T*2.1,b=Math.floor(bt);
    if(b!==X.beat){X.beat=b;X.pump=1;SND.bass(b);room.scr.material.color.setHSL((b*0.13)%1,0.9,0.55);if(b%2===1)setTimeout(SND.hat,120);
      ST.db=Math.max(ST.db,Math.round(108+Math.random()*8+ST.basy*2));if(b%24===23&&curName==='gauc'){ST.sousedi++;toast(pick(['⌚ Soused z 2. patra buší na topení (×'+ST.sousedi+') 🔨','⌚ Hluk '+ST.db+' dB. Paní odvedle volá Kusáčovi, ať si to odveze.','⌚ Tep jde do rytmu: 126 BPM 🎶 Tohle je tvůj nejlepší trénink!']));}}
    X.pump=Math.max(0,X.pump-dt*4);const p=X.pump;
    room.spk.forEach(g=>{g.cone.scale.setScalar(1+p*0.35);g.scale.y=1+p*0.03;});
    room.couch.position.y=p*0.035;room.table.position.y=p*0.05;room.table.children.forEach((c,i)=>{if(i>4)c.rotation.z=Math.sin(T*20+i)*0.12*p;});
    if(D&&D.lab)D.head.rotation.z=Math.sin(bt*Math.PI)*0.2;
    ball.rotation.y+=dt*1.5;X.lt.forEach(o=>{const a=T*(0.8+o.i*0.3)+o.i*1.6;o.l.position.set(Math.cos(a)*2.5,2.6,-1.5+Math.sin(a)*2);o.spot.position.x=Math.cos(a*1.3)*3;o.spot.position.z=-1.2+Math.sin(a*0.9)*2;});
    if(p>0.95)shakeT=Math.max(shakeT,0.05+ST.basy*0.02);};
  if(ST.basaky)X.start();return X;}

// parta pod okny (obecní hlučná parta ze sousedství – čistě hlasití sousedi)
const PARTY_SHOUT=['Dendo, hoď to sem z druhýho patra!','Dendóóó, slez dolů! Aha, ty nemůžeš… 😂','Hej, 2. patro! Pojď do okna!','JÉÉÉ! 🎉','HALÓ DENDO!','🎵 UNC UNC UNC 🎵','Pojď ven, Dendo!','Ještě jedno, ještě jedno!','ÓLÉ ÓLÉ ÓLÉ!','Dendóóó, hoď sem burgr!','Pusť to nahlas!'];
const PARTY_DISCO=['Ty máš co říkat, Dendo! Tvoje basáky slyšíme až na zastávce!','Ztlum toho Kusáče a pak ztlumíme my!','Dendo, pusť nás na tu diskotéku!'];
const YELL=['BUĎTE TICHO!','DRŽTE HUBY!','TICHO TAM DOLE!','JE NEMOCENSKÁ, VOLE!','DÁVAJ SERIÁL!','ZAVOLÁM NA VÁS FUDORU!'];
const YELL_SAY={'BUĎTE TICHO!':'Buďte ticho! Tady se maroduje!','DRŽTE HUBY!':'Držte huby! Mám zlomenou… teda skoro zlomenou nohu!','TICHO TAM DOLE!':'Ticho tam dole! Gauč potřebuje klid!','JE NEMOCENSKÁ, VOLE!':'Je nemocenská! Den 731! Mám nárok na klid!','DÁVAJ SERIÁL!':'Ticho, dávaj seriál a já nic neslyším!','ZAVOLÁM NA VÁS FUDORU!':'Ještě slovo a zavolám na vás kurýra Fudory! Ten vás přejede kolem!'};
const PARTY_BACK=['Jo jo, dobře, šéfe z druhýho patra… 🤫','Psst, Denda se vzbudil!','Promiň, Dendo, už budem potichu. Asi.','No jo, no jo… ty jsi ale bručoun!'];
function makeParty(s,room){const X={on:false,t:R(7,10),grp:new THREE.Group(),ppl:[],beat:-1,shT:0,yT:0,txt:'',hold:0};s.add(X.grp);X.grp.visible=false;
  const cols=['#2e7d32','#f57c00','#6a1b9a','#00838f'];[[-3.7,-6.5],[-2.9,-7.0],[-2.1,-6.4],[-1.3,-6.9]].forEach(([x,z],i)=>{const P=person({shirt:cols[i],pants:'#333',skin:'#f1c27d',hair:['#3b2a1a','#111','#a0522d','#555'][i]});P.g.position.set(x,GY,z);X.grp.add(P.g);P.ph=R(0,6);X.ppl.push(P);
    if(i===1){const bb=box(0.5,0.28,0.18,'#222',0,-0.6,0.12,P.aR);sph(0.08,'#777',-0.12,0,0.1,bb);sph(0.08,'#777',0.12,0,0.1,bb);}
    if(i===2)cyl(0.04,0.05,0.25,'#2e7d32',0,-0.62,0.05,P.aL);});
  X.lab=label('Parta z čísla 12','#333','#fff',1.8);X.lab.material.depthTest=true;X.lab.userData.street=true;X.lab.position.set(-2.5,GY+2.55,-6.7);X.grp.add(X.lab);
  // Denda vyklonený z okna (jen pro pohled zvenku)
  const DL=makeDenda();DL.g.position.set(-2.6,1.15,-3.9);DL.g.rotation.y=Math.PI;DL.s.rotation.x=0.95;DL.head.rotation.x=0.55;DL.lab.visible=false;DL.g.visible=false;s.add(DL.g);X.DL=DL;
  X.bubble=t=>{X.txt=t;$('pbub').innerHTML='<small>📢 Parta z čísla 12 <i>(dole na ulici)</i>:</small><br>'+t;};
  const v=new THREE.Vector3();
  X.place=(G)=>{const e=$('pbub');const show=(X.on||X.hold>0)&&curName==='gauc'&&!goLock;if(!show){e.style.display='none';return;}
    const outV=G.viewT>0;if(outV)v.set(-2.5,GY+2.4,-6.7);else v.set(-2.6,3.05,-4.4);v.project(cam);
    let x=(v.x+1)/2*innerWidth,y=(1-v.y)/2*innerHeight;if(v.z>1){x=innerWidth*0.3;y=innerHeight*0.3;}
    const w=e.offsetWidth||200;x=clamp(x,w/2+8,innerWidth-w/2-8);y=clamp(y,(e.offsetHeight||60)+70,innerHeight-220);
    e.style.left=x+'px';e.style.top=y+'px';e.className=outV?'big':'';e.style.display='block';};
  X.update=(dt,G)=>{X.t-=dt;if(X.hold>0)X.hold-=dt;
    if(!X.on&&X.t<=0){X.on=true;X.grp.visible=true;X.shT=2.5;X.bubble('🎵 UNC UNC UNC 🎵 HALÓÓÓ DENDO!');G.partyOn();}
    room.win.rotation.y+=((X.yT>0?-1.25:0)-room.win.rotation.y)*Math.min(1,dt*5);if(X.yT>0)X.yT-=dt;
    DL.g.visible=X.yT>0.3&&G.viewT>0;if(DL.g.visible){DL.aR.rotation.x=-2.6+Math.sin(T*14)*0.5;DL.aL.rotation.x=-1.2;DL.head.rotation.z=Math.sin(T*9)*0.1;}
    const lookUp=!X.on||X.yT>0;
    X.ppl.forEach((P,i)=>{const ty=lookUp?Math.atan2(-2.6-P.g.position.x,-4.6-P.g.position.z)*0.6+Math.PI*0.4:Math.PI*0.88+Math.sin(T*2+i)*0.3;
      let d=ty-P.g.rotation.y;P.g.rotation.y+=d*Math.min(1,dt*6);
      if(X.on){P.ph+=dt*9;P.g.position.y=GY+Math.abs(Math.sin(P.ph))*0.15;P.aL.rotation.x=-2.6+Math.sin(P.ph)*0.5;P.aR.rotation.x=i===1?-1.4:-2.6-Math.sin(P.ph)*0.5;P.head.rotation.x=-0.25;P.head.rotation.z=Math.sin(P.ph*0.5)*0.2;}
      else{P.g.position.y=GY;P.aL.rotation.x=P.aR.rotation.x=i===0?-0.6:0;P.head.rotation.x=-0.75;P.head.rotation.z=0;}});
    X.place(G);
    if(!X.on)return;const b=Math.floor(T*2.6);if(b!==X.beat){X.beat=b;tone([196,233,262,294][b%4],0.12,'square',0.05);if(b%2)noise(0.03,0.06);}
    X.shT-=dt;if(X.shT<=0){X.shT=R(2.4,3.4);X.bubble((G.disco&&G.disco.on&&Math.random()<0.4)?pick(PARTY_DISCO):pick(PARTY_SHOUT));}};
  X.hush=()=>{X.on=false;X.t=R(18,26);X.yT=3.2;X.hold=3.6;X.bubble(pick(PARTY_BACK));setTimeout(()=>{if(!X.on)X.grp.visible=false;},4200);};
  return X;}

const TV_JOKES=['📺 <b>ČT Sport:</b> Cvičení pro seniory. <b>Denda:</b> Moc náročný, přepnout.','📺 <b>Dokument:</b> Lenochod tříprstý. <b>Denda:</b> Konečně někdo, kdo mě chápe.',
 '📺 <b>Reklama:</b> Nový Golf 2026! <b>Denda:</b> Můj je hezčí. Protože je můj.','📺 <b>Teleshopping:</b> Posilovací stroj jen za 2999 Kč! <b>Denda:</b> Ten by se mi nevešel ke gauči.',
 '📺 <b>Zprávy:</b> Muž vstal z gauče a… <b>Denda:</b> RYCHLE PŘEPNOUT!','📺 <b>Kuchařská show:</b> Dnes vaříme zdravý salát. <b>Denda:</b> Fuj, horor.'];
const WATCH_IDLE=['⌚ Dnes jsi ušel <b>25 kroků</b>. Lenochod v ZOO: 40.','⌚ Čas se protáhnout! 😂 Promiň, to byl jen vtip.','⌚ Sedíš <b>17 520 hodin</b> v kuse. Světový rekord?',
 '⌚ Gauč hlásí <b>únavu materiálu</b>.','⌚ Tep 68. Gratulujeme, pořád žiješ.','⌚ Spáleno dnes: <b>12 kcal</b> (hlavně mrkáním).','⌚ Tip dne: Lednička k tobě sama nepřijde. Fudora jo.'];
const WATCH_EAT=['⌚ +950 kcal. Na spálení ujdi <b>38 km</b>. 😂','⌚ Gratulujeme! Nová váhová kategorie odemčena 🏆','⌚ Gauč: „Prosím, už ne.“','⌚ Fudora tě jmenovala zákazníkem měsíce. Zase.','⌚ Detekován hlad. Opět. Po 4 minutách.'];
const BRANDS=[{n:'Fudora',shirt:'#e6007e',bg:'#e6007e',fg:'#fff'},{n:'McDenda',shirt:'#d62828',bg:'#ffc300',fg:'#c00'},{n:'Dendo Eats',shirt:'#1c1c1c',bg:'#06c167',fg:'#fff'}];

SC.gauc={title:'🛋️ Den 731 nemocenské – obývák',enter(){
  const s=newScene('#2a2320');const room=livingRoom(s);this.room=room;
  const D=makeDenda();D.sit();D.g.position.set(0,-0.36,-2.95);room.couch.parent.add(D.g);this.D=D;this.disco=makeDisco(s,room,D);this.viewT=0;this.party=makeParty(s,room);this.visited=!!ST.basaky;this.wait=0;this.K=null;this.back=null;this.ph2='';
  this.cour=null;this.next=2.2;this.ci=0;this.idle=5;this.state='sit';this.st=0;this.tvT=0;this.pile=0;this.chan=0;
  this.held=burger();this.held.visible=false;s.add(this.held);
  aim(2.6,2.6,3.4,0.2,0.9,-2.4);
  this.mainBtns();
  say('<b>Denda:</b> Den 731. Gauč, telka, hodinky, jídlo. Dokonalý život. 😎',4000);
  setTimeout(()=>toast(WATCH_IDLE[0]),900);
  return s;},
 mainBtns(){const L=[{t:'🍔 Sníst <small>(E)</small>',k:['KeyE','Enter'],f:()=>this.eat(),id:'bEat',c:(this.cour&&this.cour.st==='wait')?'pulse':'off'},{t:'📺 Přepnout <small>(T)</small>',k:['KeyT'],f:()=>this.tv(),c:'blue'}];
  if(this.visited)L.push({t:'🔊 Basy! <small>(B)</small>',k:['KeyB'],f:()=>this.moreBass(),c:'blue',id:'bBass'});
  L.push({t:'🪟 Okno <small>(O)</small>',k:['KeyO'],f:()=>this.yell(),c:'blue'+(this.party&&this.party.on?' pulse':' off'),id:'bOkno'});
  L.push({t:'🧍 VSTÁT Z GAUČE <small>(mezerník)</small>',k:['Space'],f:()=>this.standUp(),c:'red'+(this.visited?'':' off'),id:'bStand'});setBtns(L);},
 moreBass(){ST.basy=Math.min(5,ST.basy+1);ST.db+=3;shakeT=0.3;SND.bass(0);
  say(pick(['<b>Denda:</b> Víc basů! Ať se třese i Fudora na cestě!','<b>Gauč:</b> *drnčí* … tohle mi doktor nepovolil.','<b>Denda:</b> Cítím to v sádře. Teda budu.','<b>Krabice od burgerů:</b> *skáčou do rytmu*']),2500);},
 bell(){this.state='bell';this.wait=0;this.cp=0;this.cpT=0;this.taps=0;SND.dingdong();burst('CRRR! 🔔',1300);
  say('<b>Denda:</b> Zvonek?! Fudora má přece klíče… Kdo to může bejt? 😱',3500);
  toast('⌚ Varování: cesta ke dveřím 4 m. Riziko zlomeniny: 98 %. Doporučuji <b>PLAZENÍ</b> 🐢');
  if(this.cour&&this.cour.P.hb)this.cour.P.hb.visible=false;
  setBtns([{t:'🐢 Plazit se ke dveřím <small>(mezerník / P)</small>',k:['Space','KeyP'],f:()=>this.crawl(),c:'pulse',id:'bCrawl'}]);},
 crawlPose(D,ph){D.stand();D.s.rotation.set(Math.PI/2-0.12,0,Math.sin(ph)*0.08);D.g.position.y=0.2+0.1*fat();
  D.aL.rotation.x=-2.6+Math.sin(ph)*0.6;D.aR.rotation.x=-2.6-Math.sin(ph)*0.6;D.L.knee.rotation.x=0.4+Math.sin(ph)*0.4;D.Rl.knee.rotation.x=0.4-Math.sin(ph)*0.4;D.lab.position.set(0,0.4,1.0);},
 crawlPos(k){const a=[0.4,-2.15],b=[2.95,-3.55];return [a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];},
 crawl(){if(this.state==='bell'){this.state='crawl';this.sitY=this.D.g.position.y;say('<b>Denda:</b> Opatrně… nejdřív jedna půlka, pak druhá… a teď jako tuleň. 🦭',2600);}
  if(this.state!=='crawl')return;this.taps++;this.cp=Math.min(1,this.taps/9);this.wait=0;ST.kroky+=0.5;ST.tep=Math.min(165,ST.tep+8);SND.splat();
  if(this.taps===3)toast('⌚ +0,5 kroku. Plazení po břiše se počítá jen napůl. 🐢');
  if(this.taps===4){SND.dingdong();say('<b>Hlas za dveřmi:</b> Dendo, otevři, nebo ti to nechám na rohožce a odjedu! 😄',3000);}
  if(this.taps===6)toast('⌚ Tep '+Math.round(ST.tep)+'! Do dveří zbývá metr. Žádná kost zatím nepraskla 👍');
  if(this.taps===2||this.taps===7)say(pick(['<b>Denda:</b> Tohle je horší než Sněžka…','<b>Denda:</b> Hlavně nic nezlomit, hlavně nic nezlomit…','<b>Denda:</b> Jedu rychlostí 2 cm za hodinu, vydrž!']),2200);},
 open(){this.state='visit';this.vt=0;this.ph2='in';SND.ding();burst('BASÁKY!',1300);ST.basaky=2;
  const K=person({shirt:'#1565c0',pants:'#263238',hair:'#4a3020',skin:'#f1c27d',shoes:'#111'});box(0.36,0.1,0.38,'#ffcc00',0,1.86,0.02,K.s);box(0.3,0.03,0.18,'#ffcc00',0,1.82,0.22,K.s);
  const kl=label('Kusáč','#1565c0','#fff',1.2);kl.position.y=2.3;K.g.add(kl);
  K.car=[-0.62,0.62].map(x=>{const g=speaker();g.scale.setScalar(0.85);g.position.set(x,1.0,0.15);K.s.add(g);return g;});K.aL.rotation.z=-0.5;K.aR.rotation.z=0.5;
  K.g.position.set(3.4,0,-4.15);scene.add(K.g);this.K=K;this.kp=[[3.4,-2.9],[1.6,-0.5],[-1.2,-0.7]];
  setBtns([{t:'🔊 Basy! <small>(B)</small>',k:['KeyB'],f:()=>this.moreBass(),c:'blue',id:'bBass'}]);
  say('<b>Kusáč:</b> Čau Dendo! Kusáč expres 🚚 – vozím chlazený zboží, dřív taxíkem lidi a dneska… BASÁKY! 🔊',4500);
  const T2=(ms,f)=>setTimeout(()=>{if(curName==='gauc'&&this.state==='visit')f();},ms);
  T2(4700,()=>say('<b>Denda:</b> Kusáči, ty seš blázen! Jak jsi to sem dostal? <b>Kusáč:</b> Deset let v taxíku, Dendo. Naložím cokoliv – a vynesu to i do druhýho patra. I tebe, kdybys vstal. 😄',5200));},
 place(){this.ph2='disco';this.vt=0;const K=this.K;K.car.forEach(g=>K.s.remove(g));K.aL.rotation.z=K.aR.rotation.z=0;this.disco.start();SND.goal();burst('DISKOTÉKA! 🪩',1500);
  say('<b>Kusáč:</b> Tak, hezky vedle telky. Pouštím ti DISKOTÉKU, ať se ti hejbe aspoň bříško! 🕺',4200);
  const T2=(ms,f)=>setTimeout(()=>{if(curName==='gauc'&&this.state==='visit')f();},ms);
  T2(1500,()=>toast('⌚ Hluk 116 dB. Tep jde do rytmu: 120 BPM 🎶'));
  T2(4400,()=>say('<b>Kusáč:</b> Cítíš ten bas? To je jedinej kardio, co ti doktor povolí! <b>Denda:</b> Konečně tanec, u kterýho nemusím vstávat! 🥳',4800));},
 lookOut(t){this.viewT=t;aimOut();},
 partyOn(){this.party.shown=false;const b=$('bOkno');if(b){b.classList.remove('off');b.classList.add('pulse');}if(this.state==='sit')say(ST.okno?'<b>Denda:</b> Zase?! Parta z čísla 12 je zpátky… 😤':'<b>Parta pod okny:</b> HALÓÓÓ! 🎵 UNC UNC UNC 🎵 <b>Denda:</b> Co to je za randál?!',3200);
  toast(ST.okno?'⌚ Hluk pod okny opět 92 dB. Otevři okno a zařvi! 🪟':'⌚ Hluk pod okny 92 dB. Doporučení: otevřít okno (bez vstávání!) a zařvat 🪟');},
 yell(){const X=this.party;if(this.state!=='sit'||!X||!X.on)return;ST.okno++;const y=pick(YELL);burst(y,1300);shakeT=0.25;tone(180,0.5,'sawtooth',0.18,90);
  say('<b>Denda:</b> *vykloní se z okna ve 2. patře (opatrně, vsedě!)* '+YELL_SAY[y]+' 😡',3400);X.hush();this.lookOut(3.6);const b=$('bOkno');if(b){b.classList.remove('pulse');b.classList.add('off');}
  if(ST.okno===1)setTimeout(()=>toast('⌚ Zařval jsi z okna: tep '+Math.round(ST.tep+25)+' BPM. Tohle se počítá jako cvičení! 💪'),900);ST.tep=Math.min(150,ST.tep+25);},
 tv(){if(this.state!=='sit')return;this.chan++;ST.kanaly++;SND.beep();say(TV_JOKES[this.chan%TV_JOKES.length],3800);this.room.scr.material.color.setHSL(Math.random(),0.7,0.55);},
 spawn(){const b=BRANDS[this.ci++%BRANDS.length];const P=person({shirt:b.shirt,pants:'#222',skin:pick(['#f1c27d','#e0ac69','#8d5524','#ffdbac'])});
  box(0.5,0.5,0.42,b.bg,0,1.25,-0.34,P.s);const l=label(b.n,b.bg,b.fg,1.4);l.position.y=2.25;P.g.add(l);const hb=burger();hb.position.set(0,-0.68,0.05);P.aR.add(hb);P.hb=hb;
  P.g.position.set(3.4,0,-4.1);scene.add(P.g);this.cour={P,b,path:[[3.4,-2.6],[1.75,-2.2]],st:'in',w:0,t:0};},
 eat(){const c=this.cour;if(!c||c.st!=='wait'||this.state!=='sit')return;c.st='out';c.path=[[3.4,-2.6],[3.4,-4.3]];
  if(c.P.hb)c.P.hb.visible=false;this.held.visible=true;this.held.position.set(1.5,1.1,-2.1);this.eatT=0.7;$('bEat').classList.add('off');},
 swallow(){SND.chomp();ST.burgery++;ST.vaha+=R(2.2,3.6);ST.tep+=6;this.D.setFat(fat());this.held.visible=false;
  const f=fat(),seat=this.room.couch.seat;seat.scale.y=Math.max(0.35,1-(f-1)*0.6);seat.position.y=0.36-(1-seat.scale.y)*0.12;this.D.g.position.y=-0.36-(1-seat.scale.y)*0.2;
  // krabice na stole
  const b=box(0.32,0.12,0.32,pick(['#e6007e','#ffc300','#06c167','#d62828']),R(-0.6,0.6),0.55+0.12*Math.floor(this.pile/4),R(-0.25,0.25),this.room.table);b.rotation.y=R(0,3);this.pile++;
  toast(pick(WATCH_EAT));
  if(ST.burgery===3)setTimeout(()=>{toast('⌚ Sedíš 2 roky. Zkusíš se <b>postavit</b>? 🧍');$('bStand')&&$('bStand').classList.add('pulse');},1500);
  if(ST.burgery===7){say('<b>Gauč:</b> *vrzzz* … nosnost překročena. VSTÁVEJ!',3500);}
  else say(pick(['<b>Denda:</b> Mňam! Ještě jeden a jdu cvičit. Zítra.','<b>Denda:</b> Tohle je dietní, má to v sobě salát.','<b>Denda:</b> Doktor říkal klid. Jídlo je klid.','<b>Denda:</b> *mlask* Kdo potřebuje kroky, když má Fudoru?']),2800);},
 leaveDone(){this.state='sit';this.visited=true;this.wait=0;this.back=null;this.room.door.rotation.y=0;this.next=1.5;this.mainBtns();$('bStand').classList.add('pulse');
  toast('⌚ Kusáč odjel. Basáky zůstaly. Tep '+Math.round(ST.tep)+' 🎶 Zkusíš teď <b>vstát</b>?');},
 standUp(){if(this.state!=='sit'||!this.visited)return;this.state='up';this.st=0;$('bStand').classList.add('off');$('bEat').classList.add('off');
  say('<b>Denda:</b> Tak jo… jdu na záchod. Hrdinsky. 💪',2000);toast('⌚ Detekován pohyb! Je to zemětřesení?');ST.tep=110;},
 update(dt){const D=this.D;
  if(!this.disco.on){this.tvT+=dt;if(this.tvT>1.3){this.tvT=0;this.room.scr.material.color.setHSL(Math.random(),0.6,0.5);}}
  if(this.viewT>0){this.viewT-=dt;outLabels(true);if(this.viewT<=0||this.state!=='sit'){this.viewT=0;setFov(55);outLabels(false);aim(2.6,2.6,3.4,0.2,0.9,-2.4);}}
  if(this.party.on&&(!this.party.shown||T-this.party.lastV>16)&&this.state==='sit'&&!this.K&&this.viewT<=0){this.party.shown=true;this.party.lastV=T;this.lookOut(3.6);toast('⌚ Pohled z okna: parta z čísla 12 řve dole na ulici ⬇');}
  this.disco.update(dt);this.party.update(dt,this);this.wait+=dt;
  if(this.state==='sit'&&!this.visited&&!this.cour&&!(this.eatT>0)&&(ST.burgery>=2||this.wait>28))this.bell();
  if(this.state==='bell'||this.state==='crawl'){if(this.wait>6){this.wait=0;SND.dingdong();say(pick(['<b>Hlas za dveřmi:</b> Haló! Vím, že tam seš, slyším ten gauč vrzat!','🔔 <i>CRRR! CRRR!</i>']),2500);}}
  if(this.state==='crawl'){this.cpT+=(this.cp-this.cpT)*Math.min(1,dt*3);const [x,z]=this.crawlPos(this.cpT);D.g.position.x=x;D.g.position.z=z;D.g.rotation.y=Math.atan2(2.55,-1.4);
    this.crawlPose(D,this.cpT*40);if(this.cpT>0.985&&this.cp>=1)this.open();}
  if(this.state==='visit'){this.vt+=dt;const K=this.K,dr=this.room.door;
    if(this.ph2==='in'||this.ph2==='out')dr.rotation.y+=((this.ph2==='in'&&this.vt<6?-1.4:0)-dr.rotation.y)*Math.min(1,dt*4);
    // Denda se plazí zpátky na gauč
    if(this.back==null)this.back=1;if(this.back>0){this.back=Math.max(0,this.back-dt*0.32);const [x,z]=this.crawlPos(this.back);D.g.position.x=x;D.g.position.z=z;D.g.rotation.y=Math.atan2(-2.55,1.4);this.crawlPose(D,T*6);
      if(this.back<=0){D.stand();D.s.rotation.set(0,0,0);D.sit();D.lab.position.set(0,2.25,0);D.g.rotation.y=0;D.g.position.set(0,this.sitY,-2.95);}}
    if(this.kp.length&&this.ph2!=='disco'){const [tx,tz]=this.kp[0],P=K.g.position,dx=tx-P.x,dz=tz-P.z,d=Math.hypot(dx,dz);
      if(d<0.06){this.kp.shift();if(!this.kp.length){if(this.ph2==='in'){K.g.rotation.y=Math.atan2(-2.9-P.x,-0.2-P.z);if(this.back<=0||this.vt>9)this.place();else this.kp=[[tx,tz]];}else{scene.remove(K.g);this.K=null;this.leaveDone();}}}
      else{const sp=Math.min(1,1.5*dt/d);P.x+=dx*sp;P.z+=dz*sp;K.g.rotation.y=Math.atan2(dx,dz);K.walk(this.vt*8,0.5);}}
    if(this.ph2==='disco'){K.walk(T*8.4,0.35);K.g.rotation.y=Math.atan2(0-K.g.position.x,-2.9-K.g.position.z)+Math.sin(T*4)*0.4;K.aL.rotation.x=-2.4+Math.sin(T*13)*0.4;K.aR.rotation.x=-2.4-Math.sin(T*13)*0.4;
      if(this.vt>10){this.ph2='out';this.vt=0;K.aL.rotation.x=K.aR.rotation.x=0;this.kp=[[1.6,-0.5],[3.4,-2.9],[3.4,-4.3]];
        say('<b>Kusáč:</b> Musím frčet, v autě mám jogurty na 4 °C, ať se mi neohřejou! Basáky ti nechávám – dárek od Kusáče! 👋',4500);}}}

  if(this.state==='sit'){ST.tep+=(R(64,74)-ST.tep)*dt*0.5;D.head.rotation.y=Math.sin(T*0.7)*0.25;
    this.idle-=dt;if(this.idle<0){this.idle=8;toast(pick(WATCH_IDLE));}}
  // kurýr
  if(!this.cour&&this.state==='sit'){this.next-=dt;if(this.next<0)this.spawn();}
  const c=this.cour;if(c){const P=c.P;c.t+=dt;
    if(c.st==='wait'){c.w+=dt;P.walk(0,0);P.aR.rotation.x=-1.3;if(c.w>6&&this.state==='sit'){toast('⌚ Automatické přijetí objednávky aktivováno 🤖');this.eat();}}
    else if(c.path.length){const [tx,tz]=c.path[0];const dx=tx-P.g.position.x,dz=tz-P.g.position.z,d=Math.hypot(dx,dz);
      if(d<0.05){c.path.shift();if(!c.path.length){if(c.st==='in'){c.st='wait';c.w=0;P.g.rotation.y=-Math.PI/2-0.3;$('bEat').classList.remove('off');$('bEat').classList.add('pulse');SND.ding();
          say(`<b>${c.b.n}:</b> `+pick(['Dobrý den, objednávka pro pana Dendu. Zase.','Ahoj Dendo, už znám cestu i se zavřenýma očima.','Tři burgery, hranolky, cola zero. Ať je to zdravý.','Pane Dendo, šéf se ptá, jestli vám nemáme dát vlastní kancelář.']),4000);}
        else{scene.remove(P.g);this.cour=null;this.next=R(1.5,3);}}}
      else{const sp=1.9*dt/d;P.g.position.x+=dx*Math.min(1,sp);P.g.position.z+=dz*Math.min(1,sp);P.g.rotation.y=Math.atan2(dx,dz);P.walk(c.t*9);}}}
  if(this.eatT>0){this.eatT-=dt;const k=1-Math.max(0,this.eatT)/0.7;this.held.position.set(1.5-1.5*k,1.1+0.25*k,-2.1-0.55*k);this.held.rotation.y+=dt*8;if(this.eatT<=0)this.swallow();}
  if(this.state==='up'){this.st+=dt;const k=Math.min(1,this.st/1.6);const e=k*k;
    D.L.hip.rotation.x=D.Rl.hip.rotation.x=-Math.PI/2*(1-e);D.L.knee.rotation.x=D.Rl.knee.rotation.x=Math.PI/2*(1-e);D.g.position.y=-0.36*(1-e);D.g.position.z=-2.95+0.4*e;
    D.s.rotation.z=Math.sin(T*40)*0.04*k;D.aL.rotation.x=D.aR.rotation.x=-0.8*e;ST.tep+=dt*40;
    if(this.st>=1.6){this.state='krup';this.st=0;this.krup();}}
  if(this.state==='krup'){this.st+=dt;const k=Math.min(1,this.st/0.6);
    D.Rl.knee.rotation.z=0.9*k;D.Rl.knee.rotation.x=-0.5*k;D.g.position.y=-0.36*k;D.g.position.z=-2.55-0.4*k;D.s.rotation.z=0.25*k;
    if(this.st>3.6&&!this.left){this.left=1;go('sanitka');}}
  const lk=new THREE.Vector3(0.2,0.9,-2.4);if(this.state==='krup'&&this.st<2.5){aim(1.6,1.3,0.2,0.1,0.5,-2.4,dt*3);}
 },
 krup(){this.left=0;const au=label('AU! KŘUP!','#d00000','#fff',1.2);au.position.set(0.2,0.6,0.5);this.D.g.add(au);ST.zlomeniny++;ST.tep=168;SND.krup();shakeT=0.9;burst('KŘUP!',1600);
  setTimeout(()=>say('<b>Denda:</b> AAAAAU!!! Já jen chtěl na záchod! 😭',3000),500);
  setTimeout(()=>{toast('⌚ Detekován pád. Volám 155… a Fudoru, ať to nevychladne.');SND.siren();},1200);}};

SC.sanitka={title:'🚑 Záchranka už zase jede k Dendovi',enter(){
  const s=newScene('#87c5f0');box(80,0.1,60,'#5fa84a',0,-0.05,0,s);box(80,0.02,4,'#444',0,0.01,1,s);
  for(let x=-36;x<40;x+=4)box(1.8,0.02,0.15,'#fff',x,0.03,1,s);
  const h=new THREE.Group();h.position.set(0,0,-6);s.add(h);box(8,9.6,5,'#e8dcc0',0,4.8,0,h);box(8.4,0.5,5.4,'#cdbd9b',0,9.85,0,h);
  box(1.1,2.1,0.06,'#5a3a22',0,1.05,2.52,h);plaque('č. 10','#1f4e9a','#fff',0.6,0.3,h,0,2.45,2.56);
  [0,1,2].forEach(f=>[-2.6,2.6].forEach(x=>{if(f===0&&x===0)return;const y=1.9+f*3.2;box(1.5,1.1,0.06,'#6f8faa',x,y,2.52,h);box(1.6,0.07,0.18,'#fff',x,y-0.58,2.56,h);}));
  [1,2].forEach(f=>box(1.3,1.1,0.06,'#6f8faa',0,1.9+f*3.2,2.52,h));
  this.dw=mesh(new THREE.BoxGeometry(1.5,1.1,0.07),new THREE.MeshBasicMaterial({color:0xffe066}),-2.6,8.3,2.53,h);
  plaque('⬇ DENDA – 2. patro','#ffcc00','#111',2.2,0.42,h,-2.6,9.25,2.58);
  box(9,0.06,0.4,'#bbb',0,3.2,2.6,h);box(9,0.06,0.4,'#bbb',0,6.4,2.6,h);
  CAR.position.set(5.5,0,-2.6);CAR.rotation.y=Math.PI/2;s.add(CAR);tree(s,-6,-3,1.2);tree(s,8.5,-5,1);tree(s,-9,-8,1.4);
  const A=new THREE.Group();s.add(A);box(3.4,1.8,1.7,'#fafafa',0,1.25,0,A);box(1.1,1.2,1.65,'#fafafa',2.2,0.95,0,A);box(0.06,0.6,1.4,'#2a3a50',2.76,1.25,0,A);
  box(3.42,0.22,1.72,'#e53935',0,1.0,0,A);box(1.12,0.22,1.67,'#e53935',2.2,1.0,0,A);
  plaque('ZÁCHRANKA','#ffffff','#e53935',1.8,0.4,A,0,1.6,0.86);
  [[-1.1],[1.1],[2.2]].forEach(([x])=>{[-0.86,0.86].forEach(z=>{const w=cyl(0.35,0.35,0.24,'#151515',x,0.35,z,A);w.rotation.x=Math.PI/2;});});
  this.l1=mesh(new THREE.BoxGeometry(0.35,0.2,0.4),new THREE.MeshBasicMaterial({color:0x2060ff}),1.2,2.25,-0.4,A);this.l2=mesh(new THREE.BoxGeometry(0.35,0.2,0.4),new THREE.MeshBasicMaterial({color:0x2060ff}),1.2,2.25,0.4,A);
  A.position.set(-22,0,1);this.A=A;this.done=0;
  aim(8,5.2,11,0,3.6,-2);
  setBtns([{t:'Dál ➡️ <small>(Enter)</small>',k:['Enter','Space'],f:()=>go('spital'),c:'blue'}]);
  setTimeout(()=>{if(curName==='sanitka')say('<b>Záchranář:</b> Zase vy, pane Dendo? A zase nosítka do druhýho patra… Co to bylo tentokrát – gauč, nebo lednička?',4500);},1800);
  return s;},
 update(dt){this.t+=dt;const k=Math.min(1,this.t/3.2),e=1-Math.pow(1-k,3);this.A.position.x=-22+21*e;
  const on=Math.floor(this.t*6)%2;this.dw.material.color.set(Math.floor(this.t*2)%2?0xffe066:0xff9a3c);this.l1.material.color.set(on?0x2060ff:0xffffff);this.l2.material.color.set(on?0xffffff:0x2060ff);ST.tep+=(140-ST.tep)*dt;
  if(this.t>3.4&&!this.done){this.done=1;toast('⌚ Doporučená aktivita: <b>nosítka</b>. Kroky: 0. 👍');}
  if(this.t>8.5&&this.done===1){this.done=2;go('spital');}}};

SC.spital={title:'🏥 Špitál – sádrovna',enter(){
  const s=newScene('#d9eef2');box(12,0.1,10,'#b8d8d8',0,-0.05,0,s);box(12,4,0.2,'#f7fbfb',0,2,-4,s);box(0.2,4,10,'#eef6f6',-5,2,0,s);
  box(1.4,0.4,0.06,'#fff',-1.5,3,-3.88,s);box(0.4,1.4,0.06,'#e53935',-1.5,3,-3.86,s);box(1.4,0.4,0.06,'#e53935',-1.5,3,-3.85,s);
  plaque('Zlomeniny z gauče: '+(ST.zlomeniny+1),'#ffffff','#e53935',2.6,0.45,s,1.6,2.2,-3.88);
  const bed=new THREE.Group();s.add(bed);box(1.2,0.5,2.4,'#9aa',0,0.25,0,bed);box(1.15,0.2,2.3,'#fff',0,0.6,0,bed);box(0.8,0.12,0.45,'#eaeaff',0,0.74,-0.85,bed);box(1.25,0.7,0.08,'#9aa',0,0.75,-1.2,bed);
  cyl(0.02,0.02,1.8,'#999',0.9,0.9,-1.0,s);box(0.2,0.3,0.08,'#cfe',0.9,1.7,-1.0,s);
  const D=makeDenda();D.stand();D.g.rotation.x=-Math.PI/2;D.g.position.set(0,0.72+0.22*fat(),0.95);D.lab.visible=false;s.add(D.g);this.D=D;
  D.cast.visible=true;D.cast.scale.set(1,0.02,1);D.Rl.knee.rotation.z=0;
  const doc=person({shirt:'#f6f6f6',pants:'#dfe7ea',hair:'#888',skin:'#ffdbac',shoes:'#fff'});doc.g.position.set(-1.05,0,0.75);doc.g.rotation.y=Math.PI/2;s.add(doc.g);
  sph(0.05,'#333',0,1.35,0.24,doc.s);const dl=label('MUDr. Kostička','#ffffff','#e53935',1.5);dl.position.y=2.25;doc.g.add(dl);this.doc=doc;
  this.p=0;this.taps=0;this.need=12;this.done=false;bar(0);
  aim(3.2,2.8,3.2,0.2,0.7,0.2);
  setBtns([{t:'🩹 SÁDROVAT! <small>(mezerník)</small>',k:['Space','KeyE'],f:()=>this.tap(),c:'pulse',id:'bTap'}]);
  say('<b>MUDr. Kostička:</b> Tak co se stalo? <b>Denda:</b> Vstal jsem z gauče. <b>MUDr.:</b> …a pak? <b>Denda:</b> Nic, to stačilo.',5000);
  setTimeout(()=>{if(curName==='spital')toast('⌚ Mačkej <b>SÁDROVAT</b>, ať je noha jak z betonu!');},1500);
  return s;},
 tap(){if(this.done)return;this.taps++;this.p=this.taps/this.need;SND.splat();this.D.cast.scale.y=Math.max(0.02,this.p);this.doc.aL.rotation.x=-1.2+Math.random()*0.4;this.doc.aR.rotation.x=-1.1;bar(this.p);ST.tep=Math.max(ST.tep,95);
  if(this.taps===4)say('<b>MUDr.:</b> Takovou zlomeninu jsem viděl jen jednou. U vás. Minule.',3500);
  if(this.taps===8)say(`<b>MUDr.:</b> Dám tam extra vrstvu. Při ${Math.round(ST.vaha)} kg je to bezpečnostní opatření.`,3500);
  if(this.taps>=this.need){this.done=true;SND.ding();burst('HOTOVO!',900);
   setTimeout(()=>say('<b>MUDr.:</b> Žádné vstávání, žádný sport! <b>Denda:</b> Pane doktore, vy mi rozumíte jak nikdo. 🥲',4500),500);
   setTimeout(()=>toast('⌚ Nová výbava: <b>Sádra +50 obrany</b>, -100 rychlosti.'),900);
   setBtns([]);setTimeout(()=>{if(curName==='spital')setBtns([{t:'📱 Zavolat holce, ať pro mě přijede <small>(Enter)</small>',k:['Enter'],f:()=>go('golf'),c:'pulse',id:'bCall'}]);},1800);}},
 update(dt){ST.tep+=(92-ST.tep)*dt*0.5;this.D.head.rotation.x=Math.sin(T*2)*0.08;}};

SC.golf={title:'🚗 Anetka veze Dendu domů – JEHO Golfem',enter(){
  const s=newScene('#9ad0f5');s.fog=new THREE.Fog(0x9ad0f5,40,110);box(200,0.1,260,'#62a84a',0,-0.06,-80,s);box(8.4,0.02,260,'#4a4a4a',0,0.0,-80,s);
  box(0.25,0.03,260,'#ddd',-4.0,0.02,-80,s);box(0.25,0.03,260,'#ddd',4.0,0.02,-80,s);
  this.dec=[];for(let i=0;i<24;i++){const g=new THREE.Group();g.position.set(0,0,-i*5);s.add(g);box(0.15,0.03,2,'#fff',-1.1,0.03,0,g);box(0.15,0.03,2,'#fff',1.1,0.03,0,g);this.dec.push(g);}
  for(let i=0;i<26;i++){const t=tree(s,(i%2?1:-1)*R(6.5,14),-i*4.5,R(0.8,1.4));this.dec.push(t);}
  CAR.position.set(0,0,0);CAR.rotation.set(0,0,0);s.add(CAR);
  this.lanes=[-2.2,0,2.2];this.lane=1;this.cx=0;this.q=[];this.obs=[];this.sp=17;this.dist=0;this.len=34;this.spawnT=1.6;this.her=6;this.fin=0;this.hits=0;
  aim(0,3.6,8,0,1,-6);bar(0);
  setBtns([{t:'⬅️ DOLEVA!',k:['ArrowLeft','KeyA'],f:()=>this.cmd(-1),c:'blue'},{t:'DOPRAVA! ➡️',k:['ArrowRight','KeyD'],f:()=>this.cmd(1),c:'blue'}]);
  say('<b>Anetka:</b> Neboj, Golfíka jsem řídila už dvakrát. Jednou i dopředu. 😇 <b>Denda:</b> …',4500);
  setTimeout(()=>{if(curName==='golf')toast('⌚ Tep 120. Příčina: <b>někdo jiný řídí tvoje auto</b>. Křič DOLEVA/DOPRAVA!');},1200);
  return s;},
 cmd(d){if(this.fin)return;this.q.push({t:0.28,d});if(Math.random()<0.35)say(d<0?'<b>Denda:</b> DOLEVA! DOLEVAAA!':'<b>Denda:</b> DOPRAVA! Ta druhá pravá!',1200);},
 spawnObs(lane){const types=['popelnice','kuzel','sloupek','auto','babicka'];const ty=pick(types);const g=new THREE.Group();
  if(ty==='popelnice'){cyl(0.45,0.4,1.1,'#2e7d32',0,0.55,0,g);box(1,0.1,1,'#1b5e20',0,1.12,0,g);}
  else if(ty==='kuzel'){mesh(new THREE.ConeGeometry(0.4,0.9,10),'#ff6d00',0,0.45,0,g);box(0.8,0.06,0.8,'#ff6d00',0,0.03,0,g);}
  else if(ty==='sloupek'){cyl(0.12,0.12,1.1,'#ddd',0,0.55,0,g);cyl(0.13,0.13,0.15,'#e53935',0,0.9,0,g);}
  else if(ty==='auto'){box(1.7,1.1,3.6,pick(['#e0e0e0','#c62828','#333','#f9a825']),0,0.65,0,g);}
  else{const b=person({shirt:'#8e24aa',pants:'#555',hair:'#ddd',h:0.85});b.g.rotation.y=Math.PI/2;g.add(b.g);g.bab=b;const u=cyl(0.02,0.02,0.8,'#222',0.35,0.8,0,g);u.rotation.z=0.3;}
  g.position.set(this.lanes[lane],0,-85);g.ty=ty;g.lane=lane;g.vx=0;g.spin=0;g.hit=false;scene.add(g);this.obs.push(g);},
 hit(o){o.hit=true;this.hits++;ST.skrabance++;scratch(CAR);SND.crash();setTimeout(SND.horn,150);shakeT=0.45;ST.tep=Math.min(199,ST.tep+18);o.vx=(o.position.x>=CAR.position.x?1:-1)*R(6,10);o.spin=R(-8,8);
  const L={popelnice:['<b>Anetka:</b> Kdo sem dal tu popelnici?!','<b>Denda:</b> MŮJ GOLFÍÍÍK! 😭'],kuzel:['<b>Anetka:</b> To byl jen kužel, to se nepočítá.','<b>Denda:</b> Lak z roku 2009! ORIGINÁL!'],
   sloupek:['<b>Anetka:</b> Ten sloupek tam včera nebyl!','<b>Denda:</b> Tohle mi pojišťovna neuvěří.'],auto:['<b>Anetka:</b> Jen jsem ho jemně pohladila. Bokem.','<b>Denda:</b> Já chci zpátky do sádrovny…'],
   babicka:['<b>Babička:</b> Vy grázlové! *buch deštníkem do kapoty*','<b>Anetka:</b> Babička v pohodě, jen nám ťukla deštníkem. 😅']}[o.ty];
  say(pick(L),2600);if(o.ty==='babicka'){o.vx=0;o.spin=0;o.bab.aR.rotation.x=-2.5;}
  toast(pick(['⌚ Škrábanec #'+ST.skrabance+' zaznamenán. Tep: '+Math.round(ST.tep)+' 💔','⌚ Detekován náraz. Ne, to nebyla tvoje noha. Tentokrát.','⌚ Tvůj Golf poslal SOS.']));},
 update(dt){const C=CAR;
  for(let i=this.q.length-1;i>=0;i--){const c=this.q[i];c.t-=dt;if(c.t<=0){this.lane=clamp(this.lane+c.d,0,2);this.q.splice(i,1);}}
  if(!this.fin){this.her-=dt;if(this.her<0){this.her=R(6,9);const nl=clamp(this.lane+(Math.random()<0.5?-1:1),0,2);if(nl!==this.lane){this.lane=nl;
     say(pick(['<b>Anetka:</b> Jé, koukej, kočička! 🐱 *cuk volantem*','<b>Anetka:</b> Počkej, píšu mámě, že jedeme. 📱','<b>Anetka:</b> Proč to tak pípá? <b>Denda:</b> To jsou SENZORY, lásko!','<b>Anetka:</b> Ten tvůj Golf má nějak málo koní. <b>Denda:</b> Má jich 110! <b>Anetka:</b> Tak ať se snaží.']),2800);}}}
  const tx=this.lanes[this.lane];const pcx=C.position.x;C.position.x+=(tx-C.position.x)*Math.min(1,dt*4);C.rotation.y=-(C.position.x-pcx)/dt*0.06;C.rotation.z=Math.sin(T*13)*0.008;
  let sp=this.sp;if(this.fin)sp=Math.max(0,this.sp*(1-(this.fin)/2));
  this.dist+=sp*dt;if(!this.fin){this.sp=17+this.dist/40;bar(this.dist/(this.len*20));}
  for(const d of this.dec){d.position.z+=sp*dt;if(d.position.z>10)d.position.z-=120;}
  if(!this.fin){this.spawnT-=dt;if(this.spawnT<0){this.spawnT=R(0.9,1.5);const l=Math.random()*3|0;this.spawnObs(l);if(Math.random()<0.25)this.spawnObs((l+1+(Math.random()*2|0))%3);}}
  for(let i=this.obs.length-1;i>=0;i--){const o=this.obs[i];o.position.z+=sp*dt;
    if(o.bab){o.bab.walk(T*5,0.4);}
    if(o.hit){o.position.x+=o.vx*dt;o.rotation.y+=o.spin*dt;if(o.ty!=='babicka')o.position.y=Math.max(0,o.position.y+dt*2);}
    else if(Math.abs(o.position.z-C.position.z)<(o.ty==='auto'?2.7:2.1)&&Math.abs(o.position.x-C.position.x)<(o.ty==='auto'?1.6:1.25))this.hit(o);
    if(o.position.z>12){scene.remove(o);this.obs.splice(i,1);}}
  ST.tep+=(108-ST.tep)*dt*0.25;
  if(!this.fin&&this.dist>=this.len*20){this.fin=0.001;bar(1);setBtns([]);say('<b>Anetka:</b> Jsme doma! A teď zaparkuju… <i>*KŘŘŘÍSK*</i>',3500);
    setTimeout(()=>{if(curName!=='golf')return;SND.crash();shakeT=0.4;ST.skrabance++;scratch(CAR);toast('⌚ Parkovací škrábanec: <b>bonus +1</b> 🎁');
      setTimeout(()=>{if(curName!=='golf')return;say('<b>Anetka:</b> Výborně, žádná škoda! <b>Denda:</b> '+ST.skrabance+' škrábanců, lásko. '+ST.skrabance+'.',4000);
        setBtns([{t:'⚽ Doma už čeká malej… <small>(Enter)</small>',k:['Enter','Space'],f:()=>go('fotbal'),c:'pulse'}]);},900);},1300);}
  if(this.fin)this.fin=Math.min(2,this.fin+dt);
  aim(C.position.x*0.5,3.6,8,C.position.x*0.5,1,-6,Math.min(1,dt*5));}};

const KID_CATCH=['<b>Malej:</b> Chytííím! Jsem lepší než Petr Čech! 🧤','<b>Malej:</b> Ha! Dendo, kopeš jak babička!','<b>Malej:</b> Zase chyceno! Nechceš radši sedět?','<b>Malej:</b> To bylo pomalý jak tvoje kroky! 🐌'];
const KID_GOAL=['<b>Malej:</b> To se nepočítá, já si vázal tkaničku!','<b>Malej:</b> Jůůů, dobrej! Ještě jednou!','<b>Malej:</b> Mamíí! Denda dal gól sádrou!','<b>Malej:</b> To jsem tě nechal, abys nebrečel.'];
const KID_DIST=['<b>Malej:</b> Jé, beruška! 🐞','<b>Malej:</b> Počkej, musím čůrat!','<b>Malej:</b> Dendo, proč máš tak velký bříško?','<b>Malej:</b> Koukej, umím hvězdu! *padá*'];
SC.fotbal={title:'⚽ Fotbal s malým (6 let)',enter(){
  const s=newScene('#8fd0ff');box(60,0.1,60,'#4caf50',0,-0.05,-2,s);for(let z=-14;z<16;z+=4)box(22,0.012,2,'#5cbf5f',0,0.005,z,s);
  box(0.1,0.02,28,'#fff',-10,0.02,0,s);box(0.1,0.02,28,'#fff',10,0.02,0,s);box(20,0.02,0.1,'#fff',0,0.02,-12,s);
  const gl=new THREE.Group();gl.position.set(0,0,-12);s.add(gl);cyl(0.08,0.08,1.8,'#fff',-2.5,0.9,0,gl);cyl(0.08,0.08,1.8,'#fff',2.5,0.9,0,gl);box(5.1,0.14,0.14,'#fff',0,1.8,0,gl);
  mesh(new THREE.BoxGeometry(5,1.8,1.2,10,4,3),new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:0.5}),0,0.9,-0.6,gl);
  const h=new THREE.Group();h.position.set(0,0,-24);s.add(h);box(12,4,6,'#f2e6c9',0,2,0,h);const rf=mesh(new THREE.ConeGeometry(8.5,3,4),'#a03b2c',0,5.5,0,h);rf.rotation.y=Math.PI/4;rf.scale.set(1,1,0.55);
  for(let x=-14;x<=14;x+=1.2)box(0.12,0.9,0.08,'#fff',x,0.45,-17,s);box(30,0.08,0.06,'#fff',0,0.75,-17,s);
  tree(s,-13,-8,1.5);tree(s,13,-3,1.3);tree(s,-13,6,1.2);
  CAR.position.set(12.5,0,4);CAR.rotation.set(0,0.3,0);s.add(CAR);
  const gf=person({shirt:'#c2185b',pants:'#222',hair:'#5a3a1a',longHair:true,skin:'#f5d0a9'});gf.g.position.set(10.8,0,1.5);gf.g.rotation.y=-0.8;s.add(gf.g);const gl2=label('Anetka','#c2185b','#fff',1);gl2.position.y=2.2;gf.g.add(gl2);this.gf=gf;
  const D=makeDenda();D.cast.visible=true;D.g.position.set(0,0,4);D.g.rotation.y=Math.PI;s.add(D.g);this.D=D;this.face=Math.PI;
  const kid=person({h:0.62,shirt:'#ff7f00',pants:'#1d3557',hair:'#c68642',skin:'#ffe0bd'});kid.g.position.set(0,0,-11.3);s.add(kid.g);const kl=label('Malej (6)','#ff7f00','#fff',0.9);kl.position.y=1.5;kid.g.add(kl);this.kid=kid;
  const ball=new THREE.Group();sph(0.22,'#fafafa',0,0,0,ball);[[0,0.2,0.08],[0.18,0,0.1],[-0.15,-0.05,0.14],[0,-0.1,-0.19],[-0.1,0.15,-0.12]].forEach(p=>sph(0.07,'#111',...p,ball));s.add(ball);
  this.ball=ball;ball.position.set(0,0.22,2.6);this.bv=new THREE.Vector3();
  this.time=90;this.rest=0;this.kidHold=0;this.kidDist=0;this.kick=0;this.ph=0;this.pause=0;this.end=0;this.stepMs=[30,40,50,75,100];
  aim(0,6.5,12,0,0.5,0);
  $('joy').style.display='block';
  setBtns([{t:'⚽ KOPNOUT <small>(mezerník)</small>',k:['Space','KeyK','Enter'],f:()=>this.doKick(),c:'red'}],true);
  say('<b>Malej:</b> Dendo, pojď hrát fotbal! Máš sádru, takže máš výhodu – sádra je tvrdší! 💪',4500);
  setTimeout(()=>{if(curName==='fotbal')toast('⌚ Kroky dnes: '+Math.floor(ST.kroky)+'. Cíl: 30. Věříme ti. Trochu.');},1500);
  setTimeout(()=>{if(curName==='fotbal')toast('⌚ Ovládání: šipky/WASD nebo joystick, kop mezerníkem. Dej 3 góly!');},5200);
  SND.whistle();return s;},
 resetBall(z){this.ball.position.set(clamp(this.D.g.position.x,-8,8),0.22,clamp(this.D.g.position.z-1.2,-8,12));this.bv.set(0,0,0);},
 doKick(){if(this.end||this.rest>0||this.pause>0)return;const D=this.D.g.position,b=this.ball.position;const d=Math.hypot(b.x-D.x,b.z-D.z);this.kick=0.35;
  if(d>1.5){say(pick(['<b>Denda:</b> Na to nedosáhnu… sádra je krátká.','<b>Denda:</b> Kopl jsem do vzduchu. Taky se to počítá?','<b>Malej:</b> Dendo, míč je TAMHLE! 👉']),1800);return;}
  const fx=Math.sin(this.face),K=this.kid.g.position;const far=Math.max(0,(-12-b.z)*-1-6)/10;const tx=clamp(-(Math.sign(K.x)||pick([-1,1]))*R(0.4,2.2)+fx*1.2+R(-far,far),-3.2,3.2);const dir=new THREE.Vector3(tx-b.x,0,-12-b.z).normalize();this.bv.copy(dir.multiplyScalar(R(11,14)));
  SND.kick();ST.tep=Math.min(199,ST.tep+10);if(Math.random()<0.25)say(pick(['<b>Denda:</b> Ááá, sádrovka!','<b>Denda:</b> Tohle bude gól jak z Ligy mistrů!','<b>Denda:</b> *funí* …kop…']),1500);},
 update(dt){const D=this.D,P=D.g.position,b=this.ball.position,kid=this.kid,K=kid.g.position;this.t+=dt;
  if(this.end){this.end+=dt;if(this.end>2.8&&!this.left){this.left=1;go('konec');}}
  else{this.time-=dt;bar(1-this.time/90);$('scn').textContent=`⚽ Fotbal s malým – góly ${ST.goly}/3 – zbývá ${Math.ceil(this.time)} s`;
    if(this.time<=0){this.end=0.001;SND.whistle();say('<b>Malej:</b> Konec! Hrajem zítra zas? <b>Denda:</b> Zítra mám… gauč.',4000);}}
  // pohyb
  let ix=joy.x+((keys.KeyD||keys.ArrowRight)?1:0)-((keys.KeyA||keys.ArrowLeft)?1:0),iz=joy.y+((keys.KeyS||keys.ArrowDown)?1:0)-((keys.KeyW||keys.ArrowUp)?1:0);
  let il=Math.hypot(ix,iz);if(il>1){ix/=il;iz/=il;il=1;}
  if(this.rest>0){this.rest-=dt;il=0;ST.tep=Math.max(100,ST.tep-30*dt);D.s.rotation.x=0.35;}else D.s.rotation.x=0;
  if(this.pause>0){this.pause-=dt;il=0;}
  if(il>0.12&&!this.end){const sp=2.1/Math.sqrt(fat())*il,ox=P.x,oz=P.z;P.x=clamp(P.x+ix*sp*dt*2.1/il*il,-9.5,9.5);P.z=clamp(P.z+iz*sp*dt*2.1/il*il,-11,13);
    const md=Math.hypot(P.x-ox,P.z-oz);ST.kroky+=md/1.25;this.face=Math.atan2(ix,iz);
    let dr=this.face-D.g.rotation.y;while(dr>Math.PI)dr-=2*Math.PI;while(dr<-Math.PI)dr+=2*Math.PI;D.g.rotation.y+=dr*Math.min(1,dt*8);
    this.ph+=dt*7;D.L.hip.rotation.x=Math.sin(this.ph)*0.55;D.L.knee.rotation.x=Math.max(0,Math.sin(this.ph))*0.7;D.Rl.hip.rotation.x=-Math.sin(this.ph)*0.18;D.Rl.knee.rotation.x=0;
    D.s.position.y=Math.abs(Math.sin(this.ph))*0.07;D.s.rotation.z=Math.sin(this.ph)*0.14;D.aL.rotation.x=-Math.sin(this.ph)*0.5;D.aR.rotation.x=Math.sin(this.ph)*0.5;
    ST.tep=Math.min(199,ST.tep+24*dt);
    for(const m of this.stepMs){if(ST.kroky>=m&&!this['ms'+m]){this['ms'+m]=1;toast(m===30?'⌚ 🎉 30 KROKŮ! Nový osobní rekord za 2 roky!':m===100?'⌚ 100 kroků?! Volám doktorovi, něco je špatně.':`⌚ ${m} kroků! Gauč se po tobě shání.`);SND.ding();}}}
  else if(this.rest<=0){ST.tep=Math.max(96,ST.tep-10*dt);D.s.position.y=0;D.s.rotation.z*=0.9;D.L.hip.rotation.x*=0.9;D.Rl.hip.rotation.x*=0.9;D.aL.rotation.x*=0.9;D.aR.rotation.x*=0.9;}
  if(ST.tep>=186&&this.rest<=0&&!this.end){this.rest=2.6;say('<b>Denda:</b> *funí jak parní lokomotiva* … moment … 🥵',2500);toast('⌚ TEP '+Math.round(ST.tep)+'! Toto není cvičení. Teda je, a v tom je ten problém.');}
  if(this.kick>0){this.kick-=dt;D.L.hip.rotation.x=-1.1*Math.sin((0.35-this.kick)/0.35*Math.PI);}
  // míč
  if(this.kidHold>0){this.kidHold-=dt;b.set(K.x,0.7,K.z+0.3);if(this.kidHold<=0){const dir=new THREE.Vector3(P.x-K.x+R(-2,2),0,P.z-K.z).normalize();b.set(K.x+dir.x*0.8,0.22,K.z+dir.z*0.8);this.bv.copy(dir.multiplyScalar(7.5));}}
  else{this.bv.multiplyScalar(Math.exp(-1.05*dt));b.x+=this.bv.x*dt;b.z+=this.bv.z*dt;this.ball.rotation.x+=this.bv.z*dt*4;this.ball.rotation.z-=this.bv.x*dt*4;
    if(b.x<-10){b.x=-10;this.bv.x*=-0.6;}if(b.x>10){b.x=10;this.bv.x*=-0.6;}if(b.z>14){b.z=14;this.bv.z*=-0.6;}
    const pd=Math.hypot(b.x-P.x,b.z-P.z);if(pd<0.55&&this.pause<=0){const nx=(b.x-P.x)/(pd||1),nz=(b.z-P.z)/(pd||1);b.x=P.x+nx*0.55;b.z=P.z+nz*0.55;const vn=this.bv.x*nx+this.bv.z*nz;if(vn<2.6){this.bv.x+=nx*(2.6-vn);this.bv.z+=nz*(2.6-vn);}}
    if(b.z<-12&&!this.end&&this.pause<=0){if(Math.abs(b.x)<2.4){ST.goly++;SND.goal();burst('GÓÓÓL!',1300);shakeT=0.2;say(pick(KID_GOAL),3000);this.pause=1.6;this.bv.set(0,0,-1);
        if(ST.goly===1)toast('⌚ Gól! Tep '+Math.round(ST.tep)+'. Tohle už je kardio.');
        if(ST.goly>=3){this.end=0.001;SND.whistle();setTimeout(()=>say('<b>Malej:</b> Dendo, ty jsi lepší než Ronaldo! <b>Denda:</b> Ronaldo nemá sádru. 😎',4000),1500);}
        else setTimeout(()=>{if(curName==='fotbal'&&!this.end)this.resetBall();},1500);}
      else{say(pick(['<b>Malej:</b> Vedle jak ta jedle! 🌲','<b>Malej:</b> Aut! Pro mě! Teda pro tebe, já tam nedojdu.']),2000);this.pause=0.8;setTimeout(()=>{if(curName==='fotbal')this.resetBall();},700);this.bv.set(0,0,0);b.z=-12.2;}}}
  // malej v bráně
  if(this.kidHold<=0){if(this.kidDist>0){this.kidDist-=dt;kid.g.rotation.y+=dt*6;kid.walk(T*10,0.3);}
    else{kid.g.rotation.y=0;const tx=clamp(b.x,-2.2,2.2);const dx=tx-K.x;const st=Math.sign(dx)*Math.min(Math.abs(dx),1.6*dt);K.x+=st;kid.walk(Math.abs(dx)>0.05?T*12:0,0.5);
      if(Math.random()<dt*0.09&&b.z>-7){this.kidDist=1.8;say(pick(KID_DIST),2200);}}
    if(!this.end&&this.pause<=0&&b.z<-9.6&&Math.hypot(b.x-K.x,b.z-K.z)<0.55&&this.kidDist<=0){this.kidHold=1.3;ST.chyceno++;this.bv.set(0,0,0);say(pick(KID_CATCH),2600);SND.whistle();}}
  this.gf.aL.rotation.x=this.gf.aR.rotation.x=-2.6+Math.sin(T*8)*0.3;
  const ax=clamp(P.x*0.6,-6,6);aim(ax,6.5,P.z+8.5,ax,0.5,P.z-3.5,Math.min(1,dt*4));}};

// ráno 6:30 – Anetka odchází do práce (decentně: pusa, peřina, srdíčka, zatmívačka)
function heart(s,x,y,z){const h=new THREE.Sprite(new THREE.SpriteMaterial({map:texLabel('❤','#00000000','#ff2d6f',128,128,110),transparent:true,depthTest:false}));h.scale.set(0.45,0.45,1);h.position.set(x,y,z);h.renderOrder=11;s.add(h);return h;}
SC.rano={title:'🌅 Ráno, 6:30 – den 731',enter(){
  const s=newScene('#1d2233');const room=livingRoom(s);this.room=room;room.out.material.color.set(0xffb27a);
  s.children.forEach(o=>{if(o.isHemisphereLight)o.intensity=1.1;if(o.isDirectionalLight){o.intensity=1.2;o.color.set(0xffd0a0);}});
  plaque('⏰ 6:30','#111','#ff5050',0.9,0.36,s,-1.0,3.3,-4.38);
  const D=makeDenda();D.stand();D.g.rotation.y=Math.PI/2;D.s.rotation.x=-Math.PI/2;D.g.position.set(0.95,0.8,-2.95);s.add(D.g);D.lab.position.set(0,0.6,-1.5);this.D=D;
  box(0.5,0.18,0.6,'#ffffff',-0.95,0.66,-2.95,s); // polštář
  this.duv=new THREE.Group();this.duv.position.set(0.47,0.9,-2.92);s.add(this.duv);const d1=box(1.75,0.3,0.92,'#f3eefc',0,0,0,this.duv);box(1.77,0.02,0.94,'#c9b8f0',0,0.06,0,this.duv);
  this.bump=box(0.9,0.32,0.8,'#f3eefc',0.1,0.18,0,this.duv);this.bump.visible=false;
  const A=person({shirt:'#c2185b',pants:'#222',hair:'#5a3a1a',longHair:true,skin:'#f5d0a9'});const al=label('Anetka','#c2185b','#fff',1.1);al.position.y=2.25;A.g.add(al);
  box(0.32,0.3,0.12,'#8d5524',0,-0.75,0.1,A.aR);// kabelka
  A.g.position.set(3.4,0,-4.15);s.add(A.g);this.A=A;this.path=[[3.4,-2.6],[1.7,-2.0]];this.ph='in';this.t=0;this.hearts=[];this.done=false;ST.anetka++;
  aim(2.3,2.4,2.8,0.2,0.9,-2.6);
  setBtns([{t:'⏩ Přeskočit <small>(Enter)</small>',k:['Enter','Space'],f:()=>this.finish(),c:'blue',id:'bSkip'}]);
  say('<b>Denda:</b> Zzzz… 😴 <i>(gauč = postel, už 2 roky)</i>',2500);setTimeout(()=>{if(curName==='rano')toast('⌚ Dobré ráno! Spánek: 14 h. Kroky: 0. Tep 58.');},700);ST.tep=58;
  SND.ding();return s;},
 finish(){if(this.done)return;this.done=true;const f=$('fade');f.innerHTML='';go('gauc');},
 update(dt){const A=this.A,D=this.D;this.t+=dt;{const dr=this.room.door,op=(this.ph==='in'&&this.t<3)||this.ph==='out';dr.rotation.y+=((op?-1.3:0)-dr.rotation.y)*Math.min(1,dt*4);}
  this.hearts.forEach(h=>{h.position.y+=dt*0.6;h.material.opacity=Math.max(0,h.material.opacity-dt*0.35);});
  const walk=(sp)=>{if(!this.path.length)return true;const [tx,tz]=this.path[0],P=A.g.position,dx=tx-P.x,dz=tz-P.z,d=Math.hypot(dx,dz);if(d<0.05){this.path.shift();return !this.path.length;}
    const k=Math.min(1,sp*dt/d);P.x+=dx*k;P.z+=dz*k;A.g.rotation.y=Math.atan2(dx,dz);A.walk(this.t*9,0.5);return false;};
  if(this.ph==='in'&&walk(1.6)){this.ph='talk';this.pt=0;A.walk(0,0);A.g.rotation.y=Math.atan2(0.4-1.7,-2.95+2.0);
    say('<b>Anetka:</b> Dobré ráno, zlato! Za chvíli musím do práce… ale ještě na <b>chviličku</b> za tebou skočím pod peřinu 😏',3800);D.head.rotation.x=-0.3;}
  if(this.ph==='talk'){this.pt+=dt;if(this.pt>2.6){this.ph='hop';this.pt=0;}}
  if(this.ph==='hop'){this.pt+=dt;const k=Math.min(1,this.pt/0.7);A.g.position.set(1.7-1.3*k,Math.sin(k*Math.PI)*0.9,-2.0-0.9*k);if(k>=1){A.g.visible=false;this.bump.visible=true;this.ph='duvet';this.pt=0;burst('Jen na chviličku… 🙈',1500);SND.splat();}}
  if(this.ph==='duvet'){this.pt+=dt;const w=Math.sin(this.pt*14);this.duv.rotation.z=w*0.04;this.duv.scale.set(1+w*0.03,1+Math.abs(w)*0.15,1);this.duv.position.y=0.9+Math.abs(w)*0.05;
    ST.tep=Math.min(146,ST.tep+dt*45);if(Math.random()<dt*5)this.hearts.push(heart(scene,R(-0.5,1.0),1.2,R(-3.2,-2.6)));
    if(this.pt>1.0&&!this.tw){this.tw=1;toast('⌚ Tep '+Math.round(ST.tep+40)+' BPM! 🎉 Jediné kardio dne splněno. ❤️');}
    if(this.pt>2.4){this.ph='black';this.pt=0;const f=$('fade');f.innerHTML='<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#ffcc00;font:900 clamp(22px,6vw,44px) Segoe UI,Arial,sans-serif;text-align:center">❤️ Jen na chviličku… ❤️<br><span style="font-size:.55em;color:#ddd">…o chviličku později…</span></div>';f.style.transition='opacity .5s';f.style.opacity=1;}}
  if(this.ph==='black'){this.pt+=dt;if(this.pt>2.2){this.ph='kiss';this.pt=0;const f=$('fade');f.style.opacity=0;setTimeout(()=>{f.innerHTML='';f.style.transition='';},600);
    this.duv.rotation.z=0;this.duv.scale.set(1,1,1);this.duv.position.y=0.9;this.bump.visible=false;A.g.visible=true;A.g.position.set(0.6,0,-2.1);A.g.rotation.y=Math.PI;A.stand();ST.tep=128;
    say('<b>Anetka:</b> Pa, zlato, a <b>nevstávej!</b> 😘 <b>Denda:</b> Neboj, to mám v popisu práce. 😎',4200);for(let i=0;i<5;i++)this.hearts.push(heart(scene,R(-0.2,1.2),R(1.4,2.0),R(-2.9,-2.3)));SND.goal();}}
  if(this.ph==='kiss'){this.pt+=dt;A.s.rotation.x=this.pt<1.2?0.35:0;if(this.pt>2.4){this.ph='out';this.pt=0;this.path=[[3.4,-2.6],[3.4,-4.4]];}}
  if(this.ph==='out'&&walk(1.9)){A.g.visible=false;this.ph='end';this.pt=0;toast('⌚ Anetka odešla do práce. Ty máš směnu na gauči. 🛋️');}
  if(this.ph==='end'){this.pt+=dt;if(this.pt>1.6)this.finish();}}};

function setFov(f){if(cam.fov!==f){cam.fov=f;cam.updateProjectionMatrix();}}
function outLabels(out){scene.traverse(o=>{if(o.isSprite&&!o.userData.street)o.visible=!out;});}
function aimOut(){setFov(cam.aspect<1?72:55);outLabels(true);cam.position.set(10,-1.5,-16.4);cam.userData.look=(cam.userData.look||new THREE.Vector3()).set(-2.5,-3.5,-6.0);}
function rating(){if(ST.goly>=3&&ST.skrabance<=3)return '🏆 Gaučový Ronaldo';if(ST.goly>=3)return '⚽ Kanonýr se sádrou';if(ST.burgery>=8)return '🍔 Zákazník měsíce Fudory';if(ST.skrabance>=8)return '🚗 Nejoblíbenější klient autolakovny';return '🛋️ Profesionální gaučář';}
SC.konec={title:'🏆 Konec dne – zase na gauči',enter(){
  const s=newScene('#2a2320');const room=livingRoom(s);
  const D=makeDenda();D.sit();D.cast.visible=true;D.g.position.set(0,-0.36-Math.min(0.12,(fat()-1)*0.12),-2.95);room.couch.parent.add(D.g);D.aR.rotation.x=-1.2;const bg=burger();bg.position.set(0,-0.62,0.05);D.aR.add(bg);
  room.couch.seat.scale.y=Math.max(0.35,1-(fat()-1)*0.6);this.disco=makeDisco(s,room,D);
  const gf=person({shirt:'#c2185b',pants:'#222',hair:'#5a3a1a',longHair:true,skin:'#f5d0a9'});gf.g.position.set(-2.1,0,-2.2);gf.g.rotation.y=0.6;s.add(gf.g);gf.aR.rotation.x=-1.5;
  plaque('klíčky od Golfu','#00000088','#fff',0.9,0.2,gf.g,0.3,1.35,0.35);
  const kid=person({h:0.62,shirt:'#ff7f00',pants:'#1d3557',hair:'#c68642',skin:'#ffe0bd'});kid.g.position.set(1.9,0,-1.6);kid.g.rotation.y=-0.7;s.add(kid.g);this.kid=kid;
  const c=person({shirt:'#e6007e',pants:'#222'});box(0.5,0.5,0.42,'#e6007e',0,1.25,-0.34,c.s);c.g.position.set(3.4,0,-3.6);s.add(c.g);const l=label('Fudora','#e6007e','#fff',1.3);l.position.y=2.25;c.g.add(l);this.c=c;
  aim(2.6,2.6,3.4,0.2,0.9,-2.4);ST.tep=70;SND.goal();
  setTimeout(()=>{if(curName==='konec')this.card();},1100);
  return s;},
 card(){const kg=(ST.vaha-118);const o=$('ov');o.className='';
  o.innerHTML=`<h1>Konec dne! 🛋️</h1><p>Denda je zpátky na gauči. Přesně tam, kde má být.</p>
  <div class="card">👣 Kroky za den: <b>${Math.floor(ST.kroky)}</b> <small>(doporučeno 10 000 – splněno na ${(ST.kroky/100).toFixed(2)} %)</small><br>
  🍔 Snězené burgery: <b>${ST.burgery}</b><br>⚖️ Váha: <b>${ST.vaha.toFixed(1)} kg</b> <small>(+${kg.toFixed(1)} kg za jeden den)</small><br>
  🦴 Zlomeniny: <b>${ST.zlomeniny}</b> <small>(z toho vstáváním z gauče: ${ST.zlomeniny})</small><br>
  🚗 Škrábance na Golfu: <b>${ST.skrabance}</b> <small>(Anetka: „to se vyleští“)</small><br>
  ❤️ Maximální tep: <b>${Math.round(ST.tepMax)} BPM</b><br>⚽ Góly: <b>${ST.goly}</b> · malej chytil: <b>${ST.chyceno}</b><br>📺 Přepnuto kanálů: <b>${ST.kanaly}</b><br>🔊 Basáky od Kusáče: <b>${ST.basaky}</b> <small>(max ${ST.db} dB, sousedi bušili ${ST.sousedi}×)</small><br>❤️ Ranní návštěvy Anetky: <b>${ST.anetka}</b> ❤️<br>🪟 Zařval z okna: <b>${ST.okno}×</b> <small>(parta z čísla 12 se pokaždé vrátila)</small>
  <div class="t">Titul: ${rating()}</div></div>
  <p>⌚ Hodinky: „Zítra zkusíme 26 kroků. Nebo ne.“</p>
  <button class="b pulse" id="again">🔁 Hrát znovu (zase od gauče)</button>`;
  $('again').onclick=()=>{o.className='hide';restart();};
  setBtns([]);BTN=[{k:['Enter'],f:()=>{o.className='hide';restart();},el:$('again')}];},
 update(dt){this.disco.update(dt);this.kid.walk(T*10,0.4);this.kid.g.position.y=Math.abs(Math.sin(T*5))*0.15;this.c.walk(0,0);}};

function restart(){resetST();CAR=makeGolf();go('rano');}
function intro(){const o=$('ov');o.className='';o.innerHTML=`<h1>DENDA:<br>Gaučový šampion 🛋️</h1>
 <p><b>Den 731 nemocenské.</b> Hodinky hlásí 25 kroků. Gauč hlásí únavu materiálu. Fudora hlásí rekordní tržby.</p>
 <div class="card">🌅 <b>Ráno:</b> Anetka jde do práce… ale napřed na chviličku pod peřinu ❤️<br>🍔 <b>Obývák:</b> přebírej jídlo od kurýrů a sleduj, jak Denda roste.<br>🧍 <b>Vstát z gauče:</b> na vlastní nebezpečí. KŘUP!<br>🏥 <b>Špitál:</b> mačkej a sádruj.<br>🚗 <b>Golf:</b> Anetka řídí TVOJE auto – křič DOLEVA/DOPRAVA.<br>⚽ <b>Fotbal:</b> s malým, se sádrou, s tepem 190.<br>🪟 <b>Okno:</b> když pod okny řve parta, otevři a zařvi (O).</div>
 <p style="font-size:13px;color:#aaa">PC: E, T, B, O, mezerník, šipky/WASD · Mobil: tlačítka a joystick</p>
 <button class="b pulse" id="play" style="font-size:22px;padding:16px 40px">▶ HRÁT</button>`;
 const st=()=>{BTN=[];ac();SND.ding();o.className='hide';go('rano');};$('play').onclick=st;BTN=[{k:['Enter','Space'],f:st,el:$('play')}];}

// ---------- smyčka ----------
let last=performance.now();
function loop(now){requestAnimationFrame(loop);let dt=Math.min(0.05,(now-last)/1000);last=now;T+=dt;
  if(cur&&!goLock){try{cur.update(dt);}catch(e){console.error(e);}}
  if(tT>0){tT-=dt;if(tT<=0){$('toast').classList.remove('on');tGap=0.45;}}else if(tGap>0)tGap-=dt;else if(TQ.length){$('toast').innerHTML=TQ.shift();$('toast').classList.add('on');tT=3.4;}
  updWatch();
  const lk=cam.userData.look||new THREE.Vector3();const sx=shakeT>0?(Math.random()-0.5)*shakeT*0.5:0,sy=shakeT>0?(Math.random()-0.5)*shakeT*0.5:0;if(shakeT>0)shakeT-=dt;
  cam.position.x+=sx;cam.position.y+=sy;cam.lookAt(lk);renderer.render(scene,cam);cam.position.x-=sx;cam.position.y-=sy;}
window.G={go,ST,SC,get scene(){return curName},get cur(){return cur},keys,joy,restart};
scene=SC.gauc.enter.call(SC.gauc);cur=null;setBtns([]);hideSay();TQ.length=0; // pozadí za úvodní obrazovkou
aim(2.6,2.6,3.4,0.2,0.9,-2.4);
intro();requestAnimationFrame(loop);
