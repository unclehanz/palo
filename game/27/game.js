/* PALO! — 6v6 barangay volleyball. Developed by Hanz Rodil. v2.2.5 (build 27). Built from src/ by build.sh */
(function(){
'use strict';
var GAME_VERSION='2.2.5',GAME_BUILD=27;
/* ===== src/core.js ===== */
/* PALO! — 6v6 barangay volleyball. Developed by Hanz Rodil. */
/* saves carried over from v2.0 (Android only, once) + update info from the app shell */
(function(){try{if(window.AndroidApp&&AndroidApp.takeMigration){var s=AndroidApp.takeMigration();if(s){var o=JSON.parse(s);for(var k in o)if(localStorage.getItem(k)===null)localStorage.setItem(k,o[k])}}}catch(e){}})();
var D2R=Math.PI/180,$=function(s){return document.querySelector(s)};
function cl(v,a,b){return Math.max(a,Math.min(b,v))}
function lerp(a,b,k){return a+(b-a)*k}
function rnd(a,b){return a+Math.random()*(b-a)}
function chance(p){return Math.random()<p}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function angTo(a,b,k){var d=Math.atan2(Math.sin(b-a),Math.cos(b-a));return a+d*k}
function frac(x){return ((x%1)+1)%1}

/* ---------- renderer / scene ---------- */
var app=$('#app'),glc=$('#gl'),hud=$('#hud'),o=hud.getContext('2d');
var R=new THREE.WebGLRenderer({canvas:glc,antialias:true,powerPreference:'high-performance'});R.setClearColor('#f7f6f3');
var scene=new THREE.Scene();scene.fog=new THREE.Fog('#f7f6f3',34,80);
var cam=new THREE.PerspectiveCamera(50,9/13,.1,200);
scene.add(new THREE.HemisphereLight('#ffffff','#9a9a9a',.72));var dl=new THREE.DirectionalLight('#ffffff',.72);dl.position.set(-4,8,5);scene.add(dl);
var GRAD=(function(){var d=new Uint8Array([105,105,105,255,185,185,185,255,255,255,255,255]);var t=new THREE.DataTexture(d,3,1,THREE.RGBAFormat);t.minFilter=t.magFilter=THREE.NearestFilter;t.needsUpdate=true;return t})();
var TOONS={};function toon(c){return new THREE.MeshToonMaterial({color:c,gradientMap:GRAD})}
var OL=new THREE.MeshBasicMaterial({color:0x111111,side:THREE.BackSide});
OL.onBeforeCompile=function(s){s.uniforms.ow={value:.0105};s.vertexShader='uniform float ow;\n'+s.vertexShader.replace('#include <begin_vertex>','vec3 transformed = position + normal * ow;')};
var INK=new THREE.MeshBasicMaterial({color:0x111111});
var tmpV=new THREE.Vector3(),tmpM=new THREE.Matrix4();

/* floor + court lines + net (venue is in venue.js) */
var floor=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshBasicMaterial({color:'#f7f6f3'}));floor.rotation.x=-Math.PI/2;scene.add(floor);
var courtLines=new THREE.Group();scene.add(courtLines);
(function(){function L(w,d,x,z){var m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),INK);m.rotation.x=-Math.PI/2;m.position.set(x,.005,z);courtLines.add(m)}
 L(9.1,.05,0,-9);L(9.1,.05,0,9);L(.05,18,-4.5,0);L(.05,18,4.5,0);L(9,.05,0,-3);L(9,.05,0,3);L(9,.04,0,0)})();
var net=new THREE.Group();scene.add(net);
(function(){var c=document.createElement('canvas');c.width=1024;c.height=128;var g=c.getContext('2d');g.strokeStyle='#222';g.lineWidth=1.6;for(var x=0;x<1024;x+=13){g.beginPath();g.moveTo(x,0);g.lineTo(x,128);g.stroke()}for(var y=0;y<128;y+=13){g.beginPath();g.moveTo(0,y);g.lineTo(1024,y);g.stroke()}
 var nm=new THREE.Mesh(new THREE.PlaneGeometry(9.5,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,side:THREE.DoubleSide,depthWrite:false}));nm.position.y=1.93;net.add(nm);
 var tg=new THREE.BoxGeometry(9.5,.07,.03),tape=new THREE.Mesh(tg,toon('#ffffff'));tape.add(new THREE.Mesh(tg,OL));tape.position.y=2.43;net.add(tape);var bg=new THREE.BoxGeometry(9.5,.035,.02),bt=new THREE.Mesh(bg,toon('#ffffff'));bt.add(new THREE.Mesh(bg,OL));bt.position.y=1.44;net.add(bt);
 [-4.75,4.75].forEach(function(x){var p=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,2.6,8),INK);p.position.set(x,1.3,0);net.add(p);var an=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,1.2,6),toon('#d62828'));an.position.set(x>0?4.5:-4.5,2.9,0);net.add(an)})})();
/* ball */
var BR=.13;
var ballM=new THREE.Group();scene.add(ballM);
(function(){var g=new THREE.SphereGeometry(BR,20,14),m=new THREE.Mesh(g,toon('#ffffff'));m.add(new THREE.Mesh(g,OL));ballM.add(m);
 var sg=new THREE.TorusGeometry(BR,.009,4,28);for(var i=0;i<3;i++){var s=new THREE.Mesh(sg,INK);s.rotation.set(i*1.05,i*.7,0);m.add(s)}ballM.userData.m=m})();
var ballSh=new THREE.Mesh(new THREE.CircleGeometry(.15,16),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.22,depthWrite:false}));ballSh.rotation.x=-Math.PI/2;scene.add(ballSh);

/* ===== src/rig_body.js ===== */
/* ---------- geometry helpers ---------- */
var RIGQ=.65;/* tessellation scale for player meshes (performance) */
function ell(rx,ry,rz,ws,hs){var g=new THREE.SphereGeometry(1,Math.max(6,Math.round((ws||18)*RIGQ)),Math.max(4,Math.round((hs||12)*RIGQ)));g.scale(rx,ry,rz);return g}
function lathe(prof,zs,segs){var pts=prof.map(function(p){return new THREE.Vector2(Math.max(p[1],.0008),p[0])});var g=new THREE.LatheGeometry(pts,Math.max(8,Math.round((segs||18)*RIGQ)));if(zs&&zs!==1)g.scale(1,1,zs);return g}

/* ---------- bodies ---------- */
/* ---------- rosters ---------- */
/* Brgy. Mapayapa (yours, customisable in My Team). pos: S setter, OH outside, MB middle, OPP opposite, L libero */
var BODIES=[
 {id:'jun',name:'Hanz',role:'Setter',pos:'S',H:1.81,sex:'m',hair:'spike',num:7,team:0,sh:.27,hip:.152,waist:.138,rib:.17,chest:.19,limb:.95,arm:.95,pads:0,sleeves:0,acc:{headband:1}},
 {id:'tala',name:'Ela',role:'Outside hitter',pos:'OH',H:1.80,sex:'f',hair:'pony',num:4,team:0,sh:.226,hip:.19,waist:.122,rib:.146,chest:.152,limb:1,arm:1,pads:1,sleeves:0},
 {id:'bogs',name:'Jolo',role:'Middle blocker',pos:'MB',H:1.97,sex:'m',hair:'buzz',num:11,team:0,sh:.285,hip:.152,waist:.14,rib:.178,chest:.2,limb:1.08,arm:1.1,pads:1,sleeves:0,acc:{wrist:1}},
 {id:'migs',name:'Migs',role:'Opposite',pos:'OPP',H:1.88,sex:'m',hair:'spike',num:9,team:0,sh:.28,hip:.152,waist:.14,rib:.175,chest:.196,limb:1.04,arm:1.06,pads:1,sleeves:0},
 {id:'rina',name:'Rina',role:'Outside hitter',pos:'OH',H:1.76,sex:'f',hair:'bun',num:12,team:0,sh:.226,hip:.19,waist:.122,rib:.146,chest:.152,limb:1,arm:1,pads:1,sleeves:0},
 {id:'paolo',name:'Paolo',role:'Middle blocker',pos:'MB',H:1.93,sex:'m',hair:'messy',num:14,team:0,sh:.282,hip:.152,waist:.14,rib:.176,chest:.198,limb:1.06,arm:1.08,pads:1,sleeves:0},
 {id:'ising',name:'Ica',role:'Libero',pos:'L',H:1.64,sex:'f',hair:'bun',num:1,team:2,sh:.232,hip:.198,waist:.13,rib:.15,chest:.156,limb:1.1,arm:1.04,pads:1,sleeves:1}];
/* Brgy. San Roque (CPU) */
var RIVALS=[
 {id:'r_dax',base:'jun',name:'Dax',role:'Setter',pos:'S',H:1.83,hair:'buzz',num:3,team:1},
 {id:'r_mara',base:'tala',name:'Mara',role:'Outside hitter',pos:'OH',H:1.82,num:10,team:1,eyes:'determined'},
 {id:'r_tonyo',base:'bogs',name:'Tonyo',role:'Middle blocker',pos:'MB',num:15,team:1,eyes:'sharp',brows:'angry'},
 {id:'r_lyn',base:'tala',name:'Lyn',role:'Opposite',pos:'OPP',H:1.74,hair:'bun',num:6,team:1,mouth:'smirk'},
 {id:'r_kiko',base:'jun',name:'Kiko',role:'Outside hitter',pos:'OH',H:1.86,hair:'spike',num:8,team:1,acc:{},eyes:'big'},
 {id:'r_lito',base:'bogs',name:'Lito',role:'Middle blocker',pos:'MB',H:1.95,hair:'mohawk',num:5,team:1,acc:{}},
 {id:'r_pia',base:'ising',name:'Pia',role:'Libero',pos:'L',num:2,team:3,hair:'pony',sleeves:0}];
var TEAMKEY='palo.team.v1',FIELDS=['name','num','hair','hairC','skin','eyes','brows','mouth','acc','pads','sleeves','stats','sp','shoeCut','shoeCol'],DEFAULTS={};
BODIES.forEach(function(b){b.acc=b.acc||{};var d={};FIELDS.forEach(function(f){d[f]=JSON.parse(JSON.stringify(b[f]===undefined?null:b[f]))});DEFAULTS[b.id]=d});
try{var saved=JSON.parse(localStorage.getItem(TEAMKEY)||'null');if(saved)BODIES.forEach(function(b){var o=saved[b.id];if(o)FIELDS.forEach(function(f){if(o[f]!==undefined&&o[f]!==null)b[f]=o[f]})})}catch(e){}
function saveTeam(){var o={};BODIES.forEach(function(b){o[b.id]={};FIELDS.forEach(function(f){o[b.id][f]=b[f]})});try{localStorage.setItem(TEAMKEY,JSON.stringify(o))}catch(e){}}
function bodyOf(id){return BODIES.filter(function(b){return b.id===id})[0]}
RIVALS=RIVALS.map(function(r){var b=Object.assign({},DEFAULTS[r.base]?BODIES.filter(function(x){return x.id===r.base})[0]:{},r);
 var src=BODIES.filter(function(x){return x.id===r.base})[0];['sh','hip','waist','rib','chest','limb','arm','sex','pads','sleeves'].forEach(function(k){if(r[k]===undefined)b[k]=src[k]});
 if(r.H===undefined)b.H=src.H;b.acc=r.acc||{};b.hairC=0;b.skin=r.skin||0;b.eyes=r.eyes||'round';b.brows=r.brows||'normal';b.mouth=r.mouth||'line';b.shoeCut='mid';b.shoeCol=null;b.stats=null;return b});
var KIT=[{jersey:'#ffffff',trim:'#111111',shorts:'#111111',num:'#111111',pad:'#222222',shoe:'#ffffff',sleeve:'#222222'},
 {jersey:'#1c1c1c',trim:'#ffffff',shorts:'#ffffff',num:'#ffffff',pad:'#f0f0f0',shoe:'#1c1c1c',sleeve:'#f0f0f0'},
 {jersey:'#1c1c1c',trim:'#ffffff',shorts:'#111111',num:'#ffffff',pad:'#222222',shoe:'#ffffff',sleeve:'#1c1c1c'},
 {jersey:'#ffffff',trim:'#111111',shorts:'#ffffff',num:'#111111',pad:'#f0f0f0',shoe:'#1c1c1c',sleeve:'#ffffff'}];
var SKINS=['#f6f3ee','#e6dccd','#cdbca4','#a8937b','#8a6e55','#5e4636'],HAIRC=['#151515','#555555','#d8d8d8','#d62828','#5b3a22','#d9732b','#e9c766'];
var JN=['pelvis','spine','chest','neck','head','shL','elL','wrL','shR','elR','wrR','hipL','knL','anL','hipR','knR','anR'];
var ALL=[];

function numTex(n,col){var c=document.createElement('canvas');c.width=200;c.height=256;var g=c.getContext('2d'),txt=String(n),sz=236;g.font=sz+'px Bangers, Impact, sans-serif';var w=g.measureText(txt).width;if(w>176){sz=sz*176/w;g.font=sz+'px Bangers, Impact, sans-serif'}
 g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';var ink=col!=='#111111'&&col!=='#ffffff';if(ink){g.lineWidth=12;g.strokeStyle='#111';g.strokeText(txt,100,138)}g.fillStyle=col;g.fillText(txt,100,138);var t=new THREE.CanvasTexture(c);t.anisotropy=4;return t}

function buildChar(spec,ghost){
 var H=spec.H,lb=spec.limb,ab=spec.arm,C={spec:spec,H:H,J:{},mk:[],root:new THREE.Group(),ghost:!!ghost,mats:{},hand:{}};
 var kit=KIT[spec.team];if(spec.kitOv)kit=Object.assign({},kit,spec.kitOv);
 var names=['skin','jersey','trim','shorts','hair','shoe','sock','pad','sleeve','acc','glass'];if(!kit.acc)kit=Object.assign({},kit,{acc:kit.trim});if(!kit.glass)kit=Object.assign({},kit,{glass:'#3a3a3a'});
 var base={skin:SKINS[spec.skin||0],hair:HAIRC[spec.hairC||0],sock:'#ffffff'};if(spec.shoeCol)base.shoe=spec.shoeCol;
 names.forEach(function(n){C.mats[n]=ghost?GHOST:toon(base[n]||kit[n])});
 C.baseCol=function(n){return base[n]||kit[n]};
 function add(par,geo,mn,x,y,z,noOl){var m=new THREE.Mesh(geo,typeof mn==='string'?C.mats[mn]:mn);m.position.set(x||0,y||0,z||0);if(!ghost&&!noOl)m.add(new THREE.Mesh(geo,OL));par.add(m);return m}
 function joint(par,n,x,y,z,ord){var g=new THREE.Group();g.position.set(x,y,z);g.rotation.order=ord||'XYZ';par.add(g);C.J[n]=g;return g}
 function mark(par,x,y,z){var m=new THREE.Object3D();m.position.set(x,y,z);par.add(m);C.mk.push(m);return m}
 var thL=.24*H,shL=.23*H,ank=.058*H,ua=.18*H,fa=.15*H;C.standHip=thL+shL+ank;C.ua=ua;C.fa=fa;
 var hipH=spec.hip/2*H,waH=spec.waist/2*H,riH=spec.rib/2*H,chH=spec.chest/2*H,shH=spec.sh/2*H,neckR=(spec.sex==='f'?.025:.03)*H,dz=spec.sex==='f'?.64:.66;
 var pel=joint(C.root,'pelvis',0,C.standHip,0,'YXZ');
 add(pel,lathe(spec.sex==='m'?[[-.064*H,0],[-.058*H,hipH*.45],[-.042*H,hipH*.74],[-.005*H,hipH*.86],[.035*H,hipH*.86],[.075*H,waH*1.0],[.09*H,0]]:[[-.07*H,0],[-.064*H,hipH*.55],[-.045*H,hipH*.86],[-.005*H,hipH*.97],[.035*H,hipH*.92],[.075*H,waH*1.02],[.09*H,0]],spec.sex==='m'?.64:.74),'shorts');
 mark(pel,0,-.07*H,0);
 var shortLen=spec.sex==='f'?.04*H:.15*H;var tm=spec.sex==='m'?.9:1;
 ['L','R'].forEach(function(s){var sd=s==='L'?1:-1,hp=joint(pel,'hip'+s,sd*hipH*.52,-.012*H,0,'XZY');
  add(hp,lathe(spec.sex==='m'?[[-shortLen-.002*H,0],[-shortLen,.055*H*lb],[-shortLen*.5,.057*H*lb],[-.01*H,.058*H*lb],[.02*H,.053*H*lb],[.03*H,0]]:[[-shortLen-.002*H,0],[-shortLen,.063*H*lb],[-.01*H,.066*H*lb],[.02*H,.06*H*lb],[.03*H,0]]),'shorts');
  /* thigh skin starts just inside the shorts hem: a full-height thigh poked its top cap out through the seat of the shorts when the hip flexed */
  var thP=[[-thL-.006*H,0],[-thL,.032*H*lb],[-thL*.85,.039*H*lb],[-thL*.55,.051*H*lb],[-thL*.25,.058*H*lb*tm],[-.02*H,.06*H*lb*tm]],y0=-shortLen+.014*H,thQ=[];
  for(var ti=0;ti<thP.length;ti++){if(thP[ti][0]<y0)thQ.push(thP[ti]);else{var a0=thP[ti-1],b0=thP[ti],f0=(y0-a0[0])/(b0[0]-a0[0]);thQ.push([y0,(a0[1]+(b0[1]-a0[1])*f0)*.97]);break}}
  thQ.push([y0+.006*H,0]);add(hp,lathe(thQ),'skin');
  var kn=joint(hp,'kn'+s,0,-thL,0);add(kn,ell(.03*H*lb,.032*H*lb,.032*H*lb),'skin');mark(kn,0,0,.032*H*lb);
  if(spec.pads)add(kn,lathe([[-.055*H,0],[-.05*H,.036*H*lb],[.02*H,.038*H*lb],[.03*H,0]],1.1),'pad');
  add(kn,lathe([[-shL-.004*H,0],[-shL,.019*H*lb],[-shL*.85,.021*H*lb],[-shL*.55,.034*H*lb],[-shL*.28,.041*H*lb],[-shL*.08,.034*H*lb],[0,.03*H*lb],[.012*H,0]]),'skin');
  add(kn,lathe([[-shL-.008*H,0],[-shL-.006*H,.02*H*lb],[-shL,.0232*H*lb],[-shL*.78,.025*H*lb],[-shL*.76,0]]),'sock');
  var an=joint(kn,'an'+s,0,-shL,0);var sg=ell(.031*H*lb,.031*H,.075*H,20,14),sp=sg.attributes.position;for(var vi=0;vi<sp.count;vi++){var yy=sp.getY(vi);if(yy<-.021*H)sp.setY(vi,-.021*H-(yy+.021*H)*.04)}sg.computeVertexNormals();add(an,sg,'shoe',0,-.035*H,.036*H);
  add(an,ell(.0238*H*lb,.026*H,.0255*H*lb),'sock',0,-.004*H,.001*H);
  var cut=spec.shoeCut||'low',ct={low:-.009,mid:.025,high:.055}[cut],cr=cut==='high'?.0265:cut==='mid'?.0262:.0262;
  if(cut==='low')add(an,lathe([[-.04*H,0],[-.036*H,.029*H*lb],[-.018*H,.0285*H*lb],[(ct-.004)*H,cr*H*lb],[ct*H,(cr+.0012)*H*lb],[(ct+.0015)*H,0]],1.12),'shoe',0,0,.003*H);
  else{/* foot half rides the ankle (domed at the pivot so it turns inside itself); collar rides the shin so it can never cut through the leg */
   add(an,lathe([[-.04*H,0],[-.036*H,.029*H*lb],[-.018*H,.0285*H*lb],[-.006*H,.0262*H*lb],[.006*H,.02*H*lb],[.014*H,.009*H*lb],[.017*H,0]],1.12),'shoe',0,0,.003*H);
   add(kn,lathe([[-shL-.016*H,0],[-shL-.015*H,.0295*H*lb],[-shL-.004*H,.0298*H*lb],[-shL+(ct-.004)*H,(cr+.0008)*H*lb],[-shL+ct*H,(cr+.0018)*H*lb],[-shL+(ct+.0015)*H,0]],1.12),'shoe',0,0,.002*H);}
  if(!ghost){var sc=new THREE.Color(base.shoe||kit.shoe),strC=(sc.r+sc.g+sc.b)/3>.55?'#111111':'#ffffff';
   [-1,1].forEach(function(sd){var st=new THREE.Mesh(ell(.002*H,.0042*H,.036*H,10,6),toon(strC));st.position.set(sd*.0305*H*lb,-.031*H,.03*H);st.rotation.x=-.42;an.add(st)});
   if(cut!=='low'){var rim=new THREE.Mesh(lathe([[(ct-.008)*H,0],[(ct-.007)*H,(cr+.0024)*H*lb],[(ct-.001)*H,(cr+.0024)*H*lb],[ct*H,0]],1.12),toon(strC));rim.position.set(0,-shL,.002*H);kn.add(rim)}}
  mark(an,0,-.0575*H,.105*H);mark(an,0,-.0575*H,-.032*H);});
 var sp=joint(pel,'spine',0,.07*H,0,'YXZ');
 add(sp,lathe([[-.04*H,0],[-.035*H,waH*1.02],[0,waH],[.06*H,(waH+riH)/2*1.03],[.12*H,riH],[.135*H,0]],dz),'jersey');
 add(sp,lathe([[-.04*H,0],[-.037*H,waH*1.07],[-.022*H,waH*1.06],[-.02*H,0]],dz),'trim');
 var ch=joint(sp,'chest',0,.12*H,0,'YXZ');
 add(ch,lathe([[-.025*H,0],[-.02*H,riH],[.04*H,chH],[.085*H,chH*1.02],[.11*H,shH*(spec.sex==='m'?.86:.8)],[.128*H,shH*(spec.sex==='m'?.6:.52)],[.14*H,neckR*1.35],[.145*H,0]],dz),'jersey');
 add(ch,lathe([[.124*H,0],[.127*H,neckR*1.6],[.137*H,neckR*1.45],[.14*H,0]],dz),'trim');
 mark(ch,0,.06*H,chH*dz);mark(ch,0,.12*H,-chH*dz*.8);
 if(spec.sex==='f'){[-1,1].forEach(function(sd){add(ch,ell(.028*H,.024*H,.016*H),'jersey',sd*.036*H,.058*H,chH*dz*.84,true)})}
 if(!ghost){var nt=new THREE.MeshBasicMaterial({map:numTex(spec.num,kit.num),transparent:true});C.numMat=nt;C.numCol=kit.num;
  var bg=new THREE.CylinderGeometry(chH*1.035,chH*1.035,.15*H,24,1,true,Math.PI-.78,1.56);bg.scale(1,1,dz);var nb=new THREE.Mesh(bg,nt);nb.position.set(0,.05*H,0);ch.add(nb);
  var nf=new THREE.Mesh(new THREE.PlaneGeometry(.04*H,.051*H),nt);nf.position.set(.04*H,.09*H,chH*dz*.95+.004*H);ch.add(nf);}
 ['L','R'].forEach(function(s){var sd=s==='L'?1:-1,sh=joint(ch,'sh'+s,sd*(shH-.026*H),.104*H,0,'XZY');
  var slv=spec.sex==='f'?.035*H:.075*H;
  var dm=spec.sex==='m'?1.12:1;add(sh,ell(.035*H*ab*dm,.032*H*ab*dm,.033*H*ab*dm),'jersey',0,-.004*H,0);
  add(sh,lathe([[-slv-.002*H,0],[-slv,.036*H*ab*Math.max(dm,1.05)],[-.01*H,.042*H*ab*dm],[.012*H,.04*H*ab*dm],[.035*H,0]],1),'jersey');
  var am=spec.sleeves?'sleeve':'skin';
  add(sh,lathe([[-ua-.004*H,0],[-ua,.021*H*ab],[-ua*.6,.027*H*ab],[-ua*.3,.029*H*ab],[0,.03*H*ab],[.01*H,0]]),am);
  var el=joint(sh,'el'+s,0,-ua,0);add(el,ell(.021*H*ab,.022*H*ab,.021*H*ab),am);mark(el,0,0,-.02*H);
  add(el,lathe([[-fa-.003*H,0],[-fa,.015*H*ab],[-fa*.6,.02*H*ab],[-fa*.2,.024*H*ab],[0,.022*H*ab],[.008*H,0]]),am);
  var wr=joint(el,'wr'+s,0,-fa,0);add(wr,ell(.02*H,.038*H,.011*H),'skin',0,-.037*H,.004*H);
  if(!ghost&&RIGQ>=.55){/* light hand articulation: the four fingers are two bones (knuckle + tip, spread by x-scale), the thumb is two more */
   var FL=[.04,.045,.042,.033],FX=[-.0145,-.0048,.0048,.0145],La=.0215*H,fg1=new THREE.Group(),fg2=new THREE.Group();fg1.position.set(0,-.07*H,.004*H);wr.add(fg1);fg2.position.set(0,-La,0);fg1.add(fg2);
   FX.forEach(function(fx,i){var L1=FL[i]*H*.55,L2=FL[i]*H*.45,x=-sd*fx*H;add(fg1,ell(.0056*H,L1/2+.002*H,.0052*H,10,8),'skin',x,-L1/2,0);add(fg2,ell(.005*H,L2/2+.002*H,.0048*H,10,8),'skin',x,-(L1-La)-L2/2,0)});
   var t1=new THREE.Group();t1.position.set(sd*.017*H,-.024*H,.008*H);wr.add(t1);add(t1,ell(.0075*H,.012*H,.0068*H,10,8),'skin',0,-.01*H,0);
   var t2=new THREE.Group();t2.position.set(0,-.021*H,0);t1.add(t2);add(t2,ell(.0065*H,.01*H,.006*H,10,8),'skin',0,-.009*H,0);
   C.fing=C.fing||{};C.fb=(C.fb||[]).concat([fg1,fg2,t1,t2]);C.fing[s]={g:[fg1,fg2],t:[t1,t2],sd:sd}}
  else add(wr,ell(.007*H,.018*H,.007*H),'skin',sd*.017*H,-.022*H,.011*H);
  C.hand[s]=mark(wr,0,-.05*H,0);mark(wr,0,-.088*H,0);});
 var nk=joint(ch,'neck',0,.125*H,-.004*H,'YXZ');add(nk,lathe([[-.01*H,0],[-.005*H,neckR*1.1],[.035*H,neckR],[.05*H,0]]),'skin');
 var hd=joint(nk,'head',0,.04*H,0,'YXZ');C.headJ=hd;
 add(hd,ell(.054*H,.066*H,.062*H,22,16),'skin',0,.056*H,.006*H);
 add(hd,ell(.04*H,.036*H,.042*H),'skin',0,.024*H,.02*H,true);
 mark(hd,0,.125*H,0);
 var eyes=spec.eyes||'round',brows=spec.brows||'normal',mouthS=spec.mouth||'line',acc=spec.acc||{},hair=spec.hair;
 if(!ghost){
  [-1,1].forEach(function(sd){add(hd,ell(.011*H,.015*H,.008*H),'skin',sd*.054*H,.052*H,0,true)});
  var fg=new THREE.SphereGeometry(1,28,16,Math.PI/2-.75,1.5,1.05,.8);fg.scale(.0545*H*1.012,.0665*H*1.012,.0625*H*1.012);
  var fm=new THREE.Mesh(fg,new THREE.MeshBasicMaterial({map:faceTex(eyes,brows,spec.face),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));fm.position.set(0,.056*H,.006*H);fm.renderOrder=2;hd.add(fm);
  var nose=new THREE.Mesh(ell(.006*H,.01*H,.008*H),C.mats.skin);nose.position.set(0,.046*H,.068*H);hd.add(nose);
  var mg=new THREE.SphereGeometry(1,24,14,Math.PI/2-.7,1.4,Math.PI/2-.45,.9);mg.scale(.04*H*1.03,.036*H*1.03,.042*H*1.03);
  var mm=new THREE.MeshBasicMaterial({map:mouthTex(mouthS,spec.face),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});var mmesh=new THREE.Mesh(mg,mm);mmesh.position.set(0,.024*H,.02*H);mmesh.renderOrder=2;hd.add(mmesh);
  C.mouth={mat:mm,rest:mouthTex(mouthS,spec.face),open:mouthTex(mouthS==='scream'||mouthS==='laugh'?mouthS:'shout',spec.face),isOpen:false};
  if(acc.glasses){var gm=new THREE.MeshBasicMaterial({color:'#111'});[-1,1].forEach(function(sd){var l=new THREE.Mesh(ell(.016*H,.011*H,.004*H,14,8),C.mats.glass);l.position.set(sd*.022*H,.059*H,.066*H);l.add(new THREE.Mesh(l.geometry,OL));hd.add(l)});
   var gb=new THREE.Mesh(new THREE.TorusGeometry(.058*H,.0026*H,4,28),gm);gb.rotation.x=Math.PI/2;gb.scale.set(1,1.12,1);gb.position.set(0,.06*H,.004*H);hd.add(gb)}
  if(acc.plaster){var pl=add(hd,new THREE.BoxGeometry(.022*H,.008*H,.004*H),toon('#ffffff'),.03*H,.04*H,.058*H);pl.rotation.set(0,.45,.35)}}
 /* hair */
 var capAng=hair==='buzz'||hair==='mohawk'?1.75:hair==='bob'||hair==='long'?2.2:1.95;
 var cap=add(hd,new THREE.SphereGeometry(1,Math.round(24*RIGQ),Math.round(14*RIGQ),0,Math.PI*2,0,capAng).scale(.058*H,.071*H,.067*H),'hair',0,.06*H,-.004*H);cap.rotation.x=hair==='bob'||hair==='long'?-.32:-.55;
 if(!ghost&&/pony|bun|bob|twin|long/.test(hair)){[-1,0,1].forEach(function(i){var b=add(hd,ell(.022*H,.012*H,.012*H),'hair',i*.024*H,.098*H,.052*H);b.rotation.z=i*.4})}
 if(hair==='bun')add(hd,ell(.03*H,.028*H,.03*H),'hair',0,.1*H,-.055*H);
 if(hair==='twin')[-1,1].forEach(function(sd){var t=add(hd,ell(.02*H,.055*H,.02*H),'hair',sd*.062*H,.05*H,-.03*H);t.rotation.z=sd*.25});
 if(hair==='long'){add(hd,ell(.056*H,.105*H,.026*H),'hair',0,-.005*H,-.064*H);[-1,1].forEach(function(sd){add(hd,ell(.014*H,.07*H,.03*H),'hair',sd*.052*H,.02*H,-.03*H)})}
 if(hair==='bob')[-1,1].forEach(function(sd){add(hd,ell(.016*H,.04*H,.04*H),'hair',sd*.052*H,.04*H,-.004*H)});
 function spikes(n,fn){for(var i=0;i<n;i++){var r=fn(i),dir=r[0].normalize();var cn=add(hd,new THREE.ConeGeometry(r[1]*H,r[2]*H,6),'hair',dir.x*.055*H,.06*H+dir.y*.06*H,dir.z*.058*H);cn.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir)}}
 if(hair==='spike'&&!ghost)spikes(11,function(i){var a=i/11*Math.PI*2,el=.55+(i%2)*.35;return [new THREE.Vector3(Math.cos(a)*Math.sin(el)*.9,Math.cos(el),Math.sin(a)*Math.sin(el)-.35),.02,.065]});
 if(hair==='mohawk'&&!ghost)spikes(6,function(i){var el=-.2+i*.32;return [new THREE.Vector3(0,Math.cos(el),-Math.sin(el)*1.1),.016,.07]});
 if(hair==='messy'&&!ghost)spikes(16,function(i){var a=i*2.39,el=.35+((i*7)%5)*.22;return [new THREE.Vector3(Math.cos(a)*Math.sin(el),Math.cos(el),Math.sin(a)*Math.sin(el)-.15),.017,.045]});
 if(hair==='pony'&&!ghost){C.pony={anchor:mark(hd,0,.098*H,-.052*H),seg:.052*H,n:6,pts:[],prev:[],meshes:new THREE.Group()};C.mk.pop();
  for(var k=0;k<6;k++){var r=lerp(.024,.009,k/5)*H;var m=add(C.pony.meshes,ell(r*1.05,C.pony.seg*.62,r),'hair');C.pony.pts.push(new THREE.Vector3());C.pony.prev.push(new THREE.Vector3())}
  add(C.pony.meshes,ell(.016*H,.008*H,.016*H),'trim');C.pony.init=false;scene.add(C.pony.meshes)}
 if(!ghost&&acc.headband){var hb=add(hd,lathe([[-.008*H,0],[-.006*H,.06*H],[.006*H,.061*H],[.008*H,0]],1.12),'acc',0,.084*H,.004*H);hb.rotation.x=-.25}
 if(!ghost&&acc.forearm&&!spec.sleeves)['L','R'].forEach(function(sd){add(C.J['el'+sd],lathe([[-fa-.003*H,0],[-fa+.004*H,.0175*H*ab],[-fa*.6,.0228*H*ab],[-fa*.2,.0268*H*ab],[-.01*H,.025*H*ab],[-.006*H,0]]),'sleeve')});
 if(!ghost&&acc.wrist)['L','R'].forEach(function(sd){add(C.J['wr'+sd],lathe([[.002*H,0],[.004*H,.019*H*ab],[.028*H,.021*H*ab],[.03*H,0]]),'acc')});
 if(!ghost&&acc.ankle)['L','R'].forEach(function(sd){add(C.J['kn'+sd],lathe([[-shL-.004*H,0],[-shL,.026*H*lb],[-shL*.82,.027*H*lb],[-shL*.8,0]]),'pad')});
 /* shadow */
 C.shadow=new THREE.Mesh(new THREE.CircleGeometry(.42*H/1.8,20),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:ghost?0:.18,depthWrite:false}));C.shadow.rotation.x=-Math.PI/2;scene.add(C.shadow);
 optimizeChar(C);ALL.push(C);return C}

function setMouth(C,mo){if(!C.mouth)return;var open=mo>.15;if(open!==C.mouth.isOpen){C.mouth.isOpen=open;C.mouth.mat.map=open?C.mouth.open:C.mouth.rest;C.mouth.mat.needsUpdate=true}}
function setVisible(C,v){C.root.visible=v;C.shadow.visible=v&&!C.ghost;if(C.pony)C.pony.meshes.visible=v}
var accent=false;
var ACCOLS=[['Red','#d62828'],['Orange','#e8762c'],['Yellow','#e9c23a'],['Green','#2e9d5b'],['Teal','#1b9aa6'],['Blue','#2f62d8'],['Purple','#7a45c2'],['Pink','#e0569a'],['Gold','#b8903a']];
var KITSET={0:{on:0,col:'#d62828',parts:{trim:1,num:1,shorts:1,gear:1}},1:{on:0,col:'#2f62d8',parts:{trim:1,num:1,shorts:0,gear:1}}};
try{var ks=JSON.parse(localStorage.getItem('palo.kit.v1')||'null');if(ks)[0,1].forEach(function(t){if(ks[t])KITSET[t]=Object.assign(KITSET[t],ks[t])})}catch(e){}
function saveKit(){try{localStorage.setItem('palo.kit.v1',JSON.stringify(KITSET))}catch(e){}}
function kitSide(team){return team===1||team===3?1:0}
function applyKit(C){if(C.ghost)return;var kit=C.spec.kitOv?Object.assign({},KIT[C.spec.team],C.spec.kitOv):KIT[C.spec.team],K=KITSET[kitSide(C.spec.team)],on=K.on,P=K.parts,isLib=C.spec.team===2||C.spec.team===3;
 var use={trim:on&&P.trim,shorts:on&&P.shorts&&!isLib,sleeve:on&&P.gear,pad:on&&P.gear};
 ['trim','shorts','sleeve','pad'].forEach(function(n){C.mats[n].color.set(use[n]?K.col:kit[n])});C.mats.acc.color.set(C.spec.kitOv&&C.spec.kitOv.acc?C.spec.kitOv.acc:use.trim?K.col:kit.trim);if(C.recolor)C.recolor();
 var nc=on&&P.num?K.col:kit.num;if(nc!==C.numCol){C.numCol=nc;C.numMat.map=numTex(C.spec.num,nc);C.numMat.needsUpdate=true}}


/* ---------- cartoon face decals (drawn in ink) ---------- */
var FACES={},FACE_S=1,MOUTH_S=1;/* decal scale: bigger eyes/brows/mouth without changing the head */
/* per-player face tuning: values -5..5 (size, width, up/down, spacing) */
function fTune(f){f=f||{};var g=function(k){return +f[k]||0};return {es:1+g('es')*.08,ew:1+g('ew')*.08,ey:g('ey')*5,ex:g('ex')*5,bs:1+g('bs')*.07,bw:1+g('bw')*.07,by:g('by')*4,ms:1+g('ms')*.07,mw:1+g('mw')*.07,my:g('my')*5,key:JSON.stringify(f)}}
function faceTex(style,brows,ft){var T=fTune(ft),key=style+'|'+brows+'|'+FACE_S+'|'+T.key;if(FACES[key])return FACES[key];var c=document.createElement('canvas');c.width=512;c.height=256;var g=c.getContext('2d');
 g.lineCap='round';g.lineJoin='round';var INKC='#111',E=[[113,-1],[399,1]],cy=158;
 function scl(x,y,rx,ry){g.beginPath();g.ellipse(x,y,rx,ry,0,0,6.283);g.fillStyle='#fff';g.fill();g.lineWidth=7;g.strokeStyle=INKC;g.stroke()}
 function pup(x,y,r,hl){g.beginPath();g.arc(x,y,r,0,6.283);g.fillStyle=INKC;g.fill();if(hl!==0){g.beginPath();g.arc(x-r*.35,y-r*.4,r*(hl||.32),0,6.283);g.fillStyle='#fff';g.fill()}}
 function lid(x,y,rx,ry,iy,oy,inner,pupFn){/* clip sclera below a lid line from inner (iy) to outer (oy) */
  g.save();g.beginPath();g.moveTo(x+inner*rx*1.4,iy);g.lineTo(x-inner*rx*1.4,oy);g.lineTo(x-inner*rx*1.4,y+ry*2);g.lineTo(x+inner*rx*1.4,y+ry*2);g.closePath();g.clip();
  scl(x,y,rx,ry);pupFn();g.restore();g.beginPath();g.moveTo(x+inner*rx*1.05,iy+(oy-iy)*.04);g.lineTo(x-inner*rx*1.05,oy-(oy-iy)*.04);g.lineWidth=9;g.strokeStyle=INKC;g.stroke()}
 function arcEye(x,y,w,up){g.beginPath();if(up)g.arc(x,y+14,w,Math.PI*1.15,Math.PI*1.85);else g.arc(x,y-14,w,Math.PI*.15,Math.PI*.85);g.lineWidth=9;g.strokeStyle=INKC;g.stroke()}
 function spiral(x,y){g.beginPath();for(var a=0;a<6*Math.PI;a+=.2){var r=3+a*2.2;g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}g.lineWidth=5;g.strokeStyle=INKC;g.stroke()}
 function tear(x,y){g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x-16,y+26,x-14,y+52,x,y+56);g.bezierCurveTo(x+14,y+52,x+16,y+26,x,y);g.fillStyle='#8fc3f0';g.fill();g.lineWidth=4;g.strokeStyle=INKC;g.stroke()}
 E.forEach(function(e){var x0=e[0],s=e[1],x=x0,inner=-s,rx=34,ry=44;g.save();g.translate(x0+s*T.ex,cy+T.ey);g.scale(1.22*FACE_S*T.es*T.ew,1.22*FACE_S*T.es);g.translate(-x,-cy);
  switch(style){
   case 'big':g.beginPath();g.ellipse(x,cy,24,36,0,0,6.283);g.fillStyle=INKC;g.fill();g.beginPath();g.arc(x-8,cy-14,9,0,6.283);g.arc(x+8,cy+12,4,0,6.283);g.fillStyle='#fff';g.fill();break;
   case 'sharp':g.beginPath();g.ellipse(x,cy,30,11,s*-.28,0,6.283);g.fillStyle=INKC;g.fill();break;
   case 'sleepy':g.beginPath();g.ellipse(x,cy+4,28,6,0,0,6.283);g.fillStyle=INKC;g.fill();break;
   case 'toon':scl(x,cy,rx,ry);pup(x+inner*6,cy+4,15);break;
   case 'wink':if(s<0){scl(x,cy,rx,ry);pup(x+inner*6,cy+4,15)}else arcEye(x,cy,30,true);break;
   case 'angry':lid(x,cy,rx,ry,cy-ry*.1,cy-ry*.85,inner,function(){pup(x+inner*8,cy+8,14)});break;
   case 'determined':lid(x,cy,rx,ry*.9,cy-ry*.45,cy-ry*.7,inner,function(){pup(x+inner*4,cy+4,10)});break;
   case 'bored':lid(x,cy,rx,ry,cy-4,cy-4,inner,function(){pup(x,cy+16,14)});break;
   case 'tired':lid(x,cy,rx,ry,cy+2,cy-8,inner,function(){pup(x,cy+18,13)});g.beginPath();g.arc(x,cy+30,26,Math.PI*.2,Math.PI*.8);g.lineWidth=4;g.strokeStyle=INKC;g.stroke();break;
   case 'sad':lid(x,cy,rx,ry,cy-ry*.85,cy-ry*.05,inner,function(){pup(x+inner*3,cy+16,14)});break;
   case 'teary':lid(x,cy,rx,ry,cy-ry*.8,cy-ry*.15,inner,function(){pup(x+inner*3,cy+12,17,.45)});tear(x-s*8,cy+40);break;
   case 'shocked':scl(x,cy,rx+4,ry+6);pup(x,cy,6,0);break;
   case 'suspicious':if(s<0)lid(x,cy,rx,ry,cy+2,cy-6,inner,function(){pup(x+inner*10,cy+16,13)});else{scl(x,cy,rx,ry);pup(x+inner*10,cy+6,13)}break;
   case 'happy':arcEye(x,cy,30,true);break;
   case 'dizzy':scl(x,cy,rx,ry);spiral(x,cy);break;
   case 'closed':arcEye(x,cy,30,false);break;
   default:g.beginPath();g.ellipse(x,cy,15,24,0,0,6.283);g.fillStyle=INKC;g.fill();g.beginPath();g.arc(x-5,cy-9,5,0,6.283);g.fillStyle='#fff';g.fill()}
  g.restore();
  /* brows */
  var by=style==='toon'||style==='shocked'||style==='dizzy'||style==='suspicious'&&s>0?78:style==='round'||style==='big'||style==='sharp'||style==='sleepy'||style==='happy'||style==='closed'||style==='wink'?92:84,
   bw=brows==='thick'?18:11,ix=x+inner*12,ox=x-inner*48,iy=by-12,oy=by-12;
  if(style==='suspicious'&&s>0){iy-=10;oy-=14}
  if(brows==='angry'){iy+=16;oy-=10}else if(brows==='worried'){iy-=14;oy+=10}
  g.save();g.translate(x+s*T.ex,cy+T.ey+T.by);g.scale(FACE_S*T.bs*T.bw,FACE_S*T.bs);g.translate(-x,-cy);g.beginPath();g.moveTo(ix,iy);g.quadraticCurveTo((ix+ox)/2,Math.min(iy,oy)-10,ox,oy);g.lineWidth=bw;g.strokeStyle=INKC;g.stroke();g.restore()});
 var t=new THREE.CanvasTexture(c);t.anisotropy=4;FACES[key]=t;return t}

var MOUTHS={};
function mouthTex(style,ft){var T=fTune(ft),mk=style+'|'+MOUTH_S+'|'+T.key;if(MOUTHS[mk])return MOUTHS[mk];var c=document.createElement('canvas');c.width=512;c.height=256;var g=c.getContext('2d');g.lineCap='round';g.lineJoin='round';
 var K='#111',TONGUE='#e0566a',x0=256,y0=128;g.translate(x0,y0+T.my);g.scale(1.25*MOUTH_S*T.ms*T.mw,1.25*MOUTH_S*T.ms);g.translate(-x0,-y0);
 function ink(w){g.lineWidth=w||7;g.strokeStyle=K;g.stroke()}
 function teethV(x1,x2,y1,y2,n){g.save();g.clip();g.beginPath();for(var i=1;i<n;i++){var x=x1+(x2-x1)*i/n;g.moveTo(x,y1);g.lineTo(x,y2)}g.lineWidth=4;g.strokeStyle=K;g.stroke();g.restore()}
 switch(style){
  case 'smile':g.beginPath();g.arc(x0,y0-50,70,Math.PI*.22,Math.PI*.78);ink(8);break;
  case 'cat':g.beginPath();g.arc(x0-22,y0-6,22,Math.PI*.05,Math.PI*.95);g.moveTo(x0+44,y0-6);g.arc(x0+22,y0-6,22,Math.PI*.05,Math.PI*.95);ink(7);break;
  case 'frown':g.beginPath();g.arc(x0,y0+60,64,Math.PI*1.25,Math.PI*1.75);ink(8);break;
  case 'grin':g.beginPath();g.moveTo(x0-110,y0-26);g.quadraticCurveTo(x0,y0-12,x0+110,y0-26);g.quadraticCurveTo(x0+90,y0+52,x0,y0+56);g.quadraticCurveTo(x0-90,y0+52,x0-110,y0-26);g.closePath();g.fillStyle='#fff';g.fill();
   g.beginPath();g.moveTo(x0-110,y0-26);g.quadraticCurveTo(x0,y0-12,x0+110,y0-26);g.quadraticCurveTo(x0+90,y0+52,x0,y0+56);g.quadraticCurveTo(x0-90,y0+52,x0-110,y0-26);teethV(x0-110,x0+110,y0-40,y0+60,8);
   g.beginPath();g.moveTo(x0-100,y0+10);g.quadraticCurveTo(x0,y0+24,x0+100,y0+10);g.lineWidth=4;g.strokeStyle=K;g.stroke();
   g.beginPath();g.moveTo(x0-110,y0-26);g.quadraticCurveTo(x0,y0-12,x0+110,y0-26);g.quadraticCurveTo(x0+90,y0+52,x0,y0+56);g.quadraticCurveTo(x0-90,y0+52,x0-110,y0-26);ink(8);break;
  case 'gritted':g.beginPath();g.roundRect?g.roundRect(x0-100,y0-30,200,62,20):g.rect(x0-100,y0-30,200,62);g.fillStyle='#fff';g.fill();teethV(x0-100,x0+100,y0-40,y0+40,7);
   g.beginPath();g.moveTo(x0-100,y0+1);g.lineTo(x0+100,y0+1);g.lineWidth=5;g.strokeStyle=K;g.stroke();g.beginPath();g.roundRect?g.roundRect(x0-100,y0-30,200,62,20):g.rect(x0-100,y0-30,200,62);ink(8);break;
  case 'smirk':g.beginPath();g.moveTo(x0-90,y0+4);g.quadraticCurveTo(x0,y0-6,x0+100,y0-34);g.quadraticCurveTo(x0+70,y0+34,x0,y0+30);g.quadraticCurveTo(x0-60,y0+26,x0-90,y0+4);g.closePath();g.fillStyle='#fff';g.fill();
   g.save();g.clip();g.beginPath();for(var i=1;i<6;i++){var xx=x0-90+190*i/6;g.moveTo(xx,y0-40);g.lineTo(xx,y0+40)}g.lineWidth=4;g.strokeStyle=K;g.stroke();g.restore();
   g.beginPath();g.moveTo(x0-90,y0+4);g.quadraticCurveTo(x0,y0-6,x0+100,y0-34);g.quadraticCurveTo(x0+70,y0+34,x0,y0+30);g.quadraticCurveTo(x0-60,y0+26,x0-90,y0+4);ink(8);break;
  case 'nervous':g.beginPath();g.moveTo(x0-100,y0-16);for(var i=0;i<=8;i++)g.lineTo(x0-100+25*i,y0-16+(i%2?-8:6));for(i=8;i>=0;i--)g.lineTo(x0-100+25*i,y0+22+(i%2?6:-6));g.closePath();g.fillStyle='#fff';g.fill();
   teethV(x0-100,x0+100,y0-40,y0+40,8);g.beginPath();g.moveTo(x0-96,y0+3);for(i=1;i<=8;i++)g.lineTo(x0-100+25*i,y0+3+(i%2?5:-5));g.lineWidth=4;g.strokeStyle=K;g.stroke();
   g.beginPath();g.moveTo(x0-100,y0-16);for(i=0;i<=8;i++)g.lineTo(x0-100+25*i,y0-16+(i%2?-8:6));for(i=8;i>=0;i--)g.lineTo(x0-100+25*i,y0+22+(i%2?6:-6));g.closePath();ink(7);break;
  case 'laugh':case 'shout':case 'scream':{var w=style==='scream'?120:style==='laugh'?115:90,top=y0-(style==='laugh'?32:46),bot=y0+(style==='laugh'?78:70);
   function shape(){g.beginPath();if(style==='laugh'){g.moveTo(x0-w,top);g.quadraticCurveTo(x0,top-14,x0+w,top);g.quadraticCurveTo(x0+w*.8,bot,x0,bot);g.quadraticCurveTo(x0-w*.8,bot,x0-w,top)}else g.ellipse(x0,(top+bot)/2,w,(bot-top)/2,0,0,6.283);g.closePath()}
   shape();g.fillStyle='#2a1114';g.fill();g.save();shape();g.clip();
   g.fillStyle='#fff';g.fillRect(x0-w,top-30,w*2,48);if(style!=='laugh'){g.fillRect(x0-w,bot-34,w*2,40)}
   g.beginPath();for(var i=1;i<7;i++){var xx=x0-w+2*w*i/7;g.moveTo(xx,top-30);g.lineTo(xx,top+18);if(style!=='laugh'){g.moveTo(xx,bot-34);g.lineTo(xx,bot+6)}}g.lineWidth=4;g.strokeStyle=K;g.stroke();
   g.beginPath();g.moveTo(x0-w,top+18);g.lineTo(x0+w,top+18);if(style!=='laugh'){g.moveTo(x0-w,bot-34);g.lineTo(x0+w,bot-34)}g.lineWidth=5;g.stroke();
   g.beginPath();g.ellipse(x0+(style==='scream'?0:10),bot-(style==='laugh'?12:22),w*.55,26,0,0,6.283);g.fillStyle=TONGUE;g.fill();g.beginPath();g.moveTo(x0+10,bot-40);g.lineTo(x0+10,bot-14);g.lineWidth=4;g.strokeStyle=K;g.stroke();
   g.restore();shape();ink(8);break}
  default:g.beginPath();g.moveTo(x0-34,y0+2);g.quadraticCurveTo(x0,y0+8,x0+34,y0+2);ink(8)}
 var t=new THREE.CanvasTexture(c);t.anisotropy=4;MOUTHS[mk]=t;return t}
/* ---------- poses ---------- */

/* ===== src/skin.js ===== */
/* ---------- one skinned mesh per player (performance) ----------
   buildChar makes ~50 jointed parts (each with its own outline) = ~100 draw calls per player.
   Here every opaque toon part is baked into ONE skinned mesh (vertex colours, rigid 1-bone weights, the joint Groups are the bones)
   plus ONE skinned outline mesh. Face/mouth decals and numbers stay separate. ~6 draw calls per player. */
var SKTOON=new THREE.MeshToonMaterial({gradientMap:GRAD,vertexColors:true,skinning:true});
var SKOL=new THREE.MeshBasicMaterial({color:0x111111,side:THREE.BackSide,skinning:true});
SKOL.onBeforeCompile=OL.onBeforeCompile;
function mergeGeos(list){var nv=0,ni=0;list.forEach(function(e){nv+=e.g.attributes.position.count;ni+=e.g.index?e.g.index.count:e.g.attributes.position.count});
 var pos=new Float32Array(nv*3),nor=new Float32Array(nv*3),col=new Float32Array(nv*3),si=new Uint16Array(nv*4),sw=new Float32Array(nv*4),idx=new Uint32Array(ni),slot=new Uint8Array(nv),v0=0,i0=0;
 list.forEach(function(e){var g=e.g,p=g.attributes.position,n=g.attributes.normal,c=e.c,cnt=p.count;
  for(var i=0;i<cnt;i++){pos[(v0+i)*3]=p.getX(i);pos[(v0+i)*3+1]=p.getY(i);pos[(v0+i)*3+2]=p.getZ(i);nor[(v0+i)*3]=n.getX(i);nor[(v0+i)*3+1]=n.getY(i);nor[(v0+i)*3+2]=n.getZ(i);
   col[(v0+i)*3]=c.r;col[(v0+i)*3+1]=c.g;col[(v0+i)*3+2]=c.b;si[(v0+i)*4]=e.b;sw[(v0+i)*4]=1;slot[v0+i]=e.s}
  if(g.index){var ix=g.index.array;for(i=0;i<ix.length;i++)idx[i0+i]=ix[i]+v0;i0+=ix.length}else{for(i=0;i<cnt;i++)idx[i0+i]=v0+i;i0+=cnt}v0+=cnt});
 var G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(pos,3));G.setAttribute('normal',new THREE.BufferAttribute(nor,3));G.setAttribute('color',new THREE.BufferAttribute(col,3));
 G.setAttribute('skinIndex',new THREE.BufferAttribute(si,4));G.setAttribute('skinWeight',new THREE.BufferAttribute(sw,4));G.setIndex(new THREE.BufferAttribute(nv>65535?idx:new Uint16Array(idx),1));G.userData.slot=slot;return G}
function optimizeChar(C){C.root.updateMatrixWorld(true);
 var bones=JN.map(function(n){return C.J[n]}).concat(C.fb||[]),boneOf=function(o){while(o&&o!==C.root){var i=bones.indexOf(o);if(i>=0)return i;o=o.parent}return 0};
 var palette=[],slotOf=function(m){var i=palette.indexOf(m);if(i<0){palette.push(m);i=palette.length-1}return i};
 var body=[],outl=[],kill=[];
 C.root.traverse(function(m){if(!m.isMesh||m.material===OL)return;var mt=m.material;if(!mt.isMeshToonMaterial||mt.map||mt.transparent)return;
  var g=m.geometry.index?m.geometry.clone():m.geometry.clone();g.applyMatrix4(m.matrixWorld);if(!g.attributes.normal)g.computeVertexNormals();
  var e={g:g,c:mt.color,b:boneOf(m.parent),s:slotOf(mt)};body.push(e);if(m.children.some(function(k){return k.material===OL}))outl.push(e);kill.push(m)});
 kill.forEach(function(m){m.parent.remove(m)});
 var GB=mergeGeos(body),GO=mergeGeos(outl),sk=new THREE.Skeleton(bones);
 var mb=new THREE.SkinnedMesh(GB,SKTOON),mo=new THREE.SkinnedMesh(GO,SKOL);[mb,mo].forEach(function(m){m.frustumCulled=false;C.root.add(m);m.bind(sk,new THREE.Matrix4())});
 C.skin={body:mb,outline:mo,palette:palette};
 C.recolor=function(){[GB,GO].forEach(function(G){var c=G.attributes.color,sl=G.userData.slot;for(var i=0;i<sl.length;i++){var k=palette[sl[i]].color;c.setXYZ(i,k.r,k.g,k.b)}c.needsUpdate=true})};
 /* the ponytail is also folded into one skinned mesh: its segment meshes become the bones */
 if(C.pony){var segs=C.pony.meshes.children.slice(),pl=[],po=[];C.pony.segs=segs;segs.forEach(function(m,i){m.updateMatrixWorld(true);var e={g:m.geometry.clone(),c:m.material.color,b:i,s:slotOf(m.material)};pl.push(e);po.push(e);m.visible=false;m.children.forEach(function(k){k.visible=false})});
  var PG=mergeGeos(pl),sk2=new THREE.Skeleton(segs,segs.map(function(){return new THREE.Matrix4()})),pm=new THREE.SkinnedMesh(PG,SKTOON),pom=new THREE.SkinnedMesh(PG,SKOL);
  [pm,pom].forEach(function(m){m.frustumCulled=false;C.pony.meshes.add(m);m.bind(sk2,new THREE.Matrix4())});
  var r0=C.recolor;C.recolor=function(){r0();var c=PG.attributes.color,sl=PG.userData.slot;for(var i=0;i<sl.length;i++){var k=palette[sl[i]].color;c.setXYZ(i,k.r,k.g,k.b)}c.needsUpdate=true}}}
function setOutlines(on){ALL.forEach(function(C){if(C.skin)C.skin.outline.visible=on;if(C.pony)C.pony.meshes.children.forEach(function(m){if(m.material===SKOL)m.visible=on})})}

/* ===== src/rig_pose.js ===== */
var NEUTRAL={p:0,py:0,pr:0,s:[0,0,0],c:[0,0,0],n:[0,0],h:[0,0,0],aL:[0,8,0,12,0],aR:[0,8,0,12,0],lL:[0,4,0,3,0,1],lR:[0,4,0,3,0,1],air:0,gnd:1,lift:0,fz:0,fx:0,yaw:0,mo:0};
function pad(a,n){a=a.slice();while(a.length<n)a.push(0);return a}
function P(o,base){var r={},b=base||NEUTRAL,k;for(k in b)r[k]=Array.isArray(b[k])?b[k].slice():(b[k]&&typeof b[k]==='object'?b[k]:b[k]);
 for(k in o){var v=o[k];if(k==='s'||k==='c'||k==='h')v=pad(v,3);else if(k==='n')v=pad(v,2);else if((k==='lL'||k==='lR')&&Array.isArray(v))v=pad(v,6);r[k]=v}return r}
var READY=P({p:18,s:[10],c:[6],n:[-12],h:[-12],aL:[35,18,0,80,15],aR:[35,18,0,80,15],lL:[50,14,-8,70,0,1],lR:[50,14,-8,70,0,1]});
function RD(o){return P(o,READY)}
var STAND=P({pr:2.5,aL:[4,9,0,14,0],aR:[-2,11,0,20,0],lL:[-2,3,0,2,0,1],lR:[7,10,8,14,0,1],h:[-4,10,0],n:[-2]});

var tmpV=new THREE.Vector3(),tmpM=new THREE.Matrix4();
function solveArm(C,s,ik){var sd=s==='L'?1:-1,H=C.H,sh=C.J['sh'+s],a=C.ua,b=C.fa;
 var S=sh.position.clone(),T=new THREE.Vector3(sd*ik.ik[0]*H,ik.ik[1]*H,ik.ik[2]*H),pl=new THREE.Vector3(sd*ik.pole[0],ik.pole[1],ik.pole[2]).normalize();
 var D=T.clone().sub(S),d=cl(D.length(),.05*H,(a+b)*.999);D.normalize();
 var cb=cl((a*a+d*d-b*b)/(2*a*d),-1,1),B=Math.acos(cb);
 var pp=pl.clone().sub(D.clone().multiplyScalar(pl.dot(D)));if(pp.lengthSq()<1e-6)pp.set(0,-1,0);pp.normalize();
 var u=D.clone().multiplyScalar(Math.cos(B)).add(pp.clone().multiplyScalar(Math.sin(B))).normalize();
 var E=S.clone().add(u.clone().multiplyScalar(a)),Tc=S.clone().add(D.clone().multiplyScalar(d)),f=Tc.sub(E).normalize();
 var zl=f.clone().sub(u.clone().multiplyScalar(f.dot(u)));if(zl.lengthSq()<1e-6)zl=pp.clone().sub(u.clone().multiplyScalar(pp.dot(u)));if(zl.lengthSq()<1e-6)zl.set(0,0,1);zl.normalize();
 var th=Math.acos(cl(f.dot(u),-1,1)),Y=u.clone().negate(),X=new THREE.Vector3().crossVectors(Y,zl);
 tmpM.makeBasis(X,Y,zl);sh.quaternion.setFromRotationMatrix(tmpM);C.J['el'+s].rotation.set(-th,0,0);C.J['wr'+s].rotation.set(-(ik.wr||0)*D2R,0,0)}
function applyFK(C,ps){var J=C.J;
 J.pelvis.rotation.set(ps.p*D2R,ps.py*D2R,ps.pr*D2R);J.spine.rotation.set(ps.s[0]*D2R,ps.s[1]*D2R,ps.s[2]*D2R);J.chest.rotation.set(ps.c[0]*D2R,ps.c[1]*D2R,ps.c[2]*D2R);
 J.neck.rotation.set(ps.n[0]*D2R,ps.n[1]*D2R,0);J.head.rotation.set(ps.h[0]*D2R,ps.h[1]*D2R,ps.h[2]*D2R);
 ['L','R'].forEach(function(s){var sd=s==='L'?1:-1,a=ps['a'+s],l=ps['l'+s];
  if(Array.isArray(a)){J['sh'+s].rotation.set(-a[0]*D2R,sd*a[2]*D2R,sd*a[1]*D2R);J['el'+s].rotation.set(-a[3]*D2R,0,0);J['wr'+s].rotation.set(-a[4]*D2R,0,0)}else solveArm(C,s,a);
  J['hip'+s].rotation.set(-l[0]*D2R,sd*l[2]*D2R,sd*l[1]*D2R);J['kn'+s].rotation.set(l[3]*D2R,0,0);
  var flat=l[4]-(ps.p-l[0]+l[3]);J['an'+s].rotation.set(lerp(l[4],flat,l[5])*D2R,0,0)})}
function ground(C,gnd,air,lift){C.J.pelvis.position.y=C.standHip;C.root.updateMatrixWorld(true);var m=1e9;C.mk.forEach(function(k){k.getWorldPosition(tmpV);if(tmpV.y<m)m=tmpV.y});
 var al=C.standHip-m+.004;C.J.pelvis.position.y=lerp(C.standHip+air,al,gnd)+lift;C.root.updateMatrixWorld(true)}
function poseStatic(C,ps){C.root.position.set(ps.fx,0,ps.fz);C.root.rotation.y=ps.yaw*D2R;applyFK(C,ps);ground(C,ps.gnd,ps.air,ps.lift);setMouth(C,ps.mo)}

/* ===== src/clips.js ===== */
/* ---------- clips ---------- */
function E(o){return o}

var TILT={w:-12,h:16,f:16};
function SPK(o){var TL=o.TL||{w:TILT.w,h:TILT.h,f:TILT.f},z0=o.z0||0,dr=o.drift||1.25,A=o.arms,tw=o.tw||{},air=o.air,zt=function(t){return z0+2.2+dr*(t-.84)};
 var LG=o.LG||{take:[[4,6,0,8,40,0],[4,6,0,8,40,0]],wind:[[10,10,0,70,30,0],[-14,10,0,100,30,0]],hit:[[35,10,0,45,30,0],[25,10,0,40,30,0]],fol:[[40,10,0,30,25,0],[35,10,0,30,25,0]]};
 return {id:o.id,name:o.name,desc:o.desc,net:4.0,keys:[
  {t:0,P:P({p:8,s:[5],aL:[10,10,0,30,0],aR:[10,10,0,30,0],lL:[10,6,0,15,0,1],lR:[-5,6,0,12,0,1],fz:z0})},
  {t:.26,P:P({p:15,s:[8],aL:[30,10,0,60,0],aR:[-30,10,0,40,0],lL:[40,6,0,20,-10,1],lR:[-25,6,0,45,30,0],fz:z0+.55})},
  {t:.5,P:P({p:26,s:[12],n:[-10],aL:[-55,14,0,15,0],aR:[-55,14,0,15,0],lR:[52,8,0,38,-10,1],lL:[-30,8,0,55,35,0],fz:z0+1.45})},
  {t:.68,P:P({p:42,s:[18],c:[5],n:[-22],h:[-15],aL:[-80,16,0,8,0],aR:A.plantR||[-86,16,0,8,0],lL:[75,10,0,102,0,1],lR:[70,10,0,96,0,1],fz:z0+2.02})},
  {t:.84,e:'out',P:P({p:0,s:[-5],c:[0,10,0],n:[-10],h:[-25],aL:A.take[0],aR:A.take[1],lL:LG.take[0],lR:LG.take[1],gnd:0,air:air[0],fz:zt(.84)})},
  {t:o.tW,e:'out',P:P({p:-8,s:[o.arch==null?-14:o.arch],c:[-8,tw.wind==null?-32:tw.wind,TL.w],n:[-10],h:[-22,25,0],aL:A.wind[0],aR:A.wind[1],lL:LG.wind[0],lR:LG.wind[1],gnd:0,air:air[1],fz:zt(o.tW)})},
  {t:o.tH,e:'in',fx:o.fx||'PALO!!',P:P({p:10,s:[o.crunch==null?18:o.crunch],c:[12,tw.hit==null?26:tw.hit,TL.h],n:[-6],h:[-12],aL:A.hit[0],aR:A.hit[1],lL:LG.hit[0],lR:LG.hit[1],gnd:0,air:air[2],fz:zt(o.tH)})},
  {t:o.tF,e:'in',P:P({p:15,s:[o.crunch==null?28:o.crunch+8],c:[10,tw.fol==null?30:tw.fol,TL.f],aL:A.fol[0],aR:A.fol[1],lL:LG.fol[0],lR:LG.fol[1],gnd:0,air:air[3],fz:zt(o.tF)})},
  {t:o.tL,P:P({p:30,s:[12],n:[-10],aL:A.land[0],aR:A.land[1],lL:[60,12,0,85,0,1],lR:[55,12,0,80,0,1],fz:zt(o.tL)})},
  {t:o.tL+.4,P:RD({aL:[35,18,0,80,15],aR:A.rec||[35,18,0,80,15],fz:zt(o.tL)+.12})},{t:o.tL+.8,P:RD({aL:[35,18,0,80,15],aR:A.rec||[35,18,0,80,15],fz:zt(o.tL)+.12})}],
  ball:[{t:.3,p:[-.6,5.8,z0+3.9],arc:0},{t:o.tH,at:'R',off:[0,.06,.04],arc:o.ballArc||0},{t:o.tH+(o.ballT||.24),p:o.ballEnd||[.4,.11,8.8]}]}}
var CLIPS=[
 {id:'idle',name:'Ready',desc:'Bouncing ready stance between plays.',loop:1,net:null,keys:[E({t:0,P:READY}),{t:.45,P:RD({p:21,lL:[54,14,-8,78,0,1],lR:[54,14,-8,78,0,1],h:[-14]})},{t:.9,P:READY}]},
 {id:'run',name:'Run',desc:'Athletic run cycle with arm drive.',loop:1,keys:[
  {t:0,P:P({p:12,s:[6],n:[-6],aL:[-40,10,0,85,0],aR:[45,10,0,95,0],lL:[42,6,0,18,-12,0],lR:[-28,6,0,40,32,0]})},
  {t:.13,P:P({p:12,s:[6],n:[-6],aL:[0,10,0,90,0],aR:[0,10,0,90,0],lL:[5,6,0,25,0,1],lR:[35,6,0,105,25,0],lift:.05})},
  {t:.26,P:P({p:12,s:[6],n:[-6],aR:[-40,10,0,85,0],aL:[45,10,0,95,0],lR:[42,6,0,18,-12,0],lL:[-28,6,0,40,32,0]})},
  {t:.39,P:P({p:12,s:[6],n:[-6],aL:[0,10,0,90,0],aR:[0,10,0,90,0],lR:[5,6,0,25,0,1],lL:[35,6,0,105,25,0],lift:.05})},
  {t:.52,P:P({p:12,s:[6],n:[-6],aL:[-40,10,0,85,0],aR:[45,10,0,95,0],lL:[42,6,0,18,-12,0],lR:[-28,6,0,40,32,0]})}]},
 {id:'walk',name:'Walk',desc:'Loose athletic walk used for repositioning — feet plant and roll, no sliding. Played backwards it is the backpedal.',loop:1,keys:[
  {e:'lin',t:0,P:P({p:12,s:[5],n:[-8],h:[-10],aL:[-16,12,0,36,5],aR:[32,12,0,60,8],lL:[40,7,0,14,-6,1],lR:[-18,7,0,28,22,0]})},
  {e:'lin',t:.24,P:P({p:12,s:[5],n:[-8],h:[-10],aL:[8,12,0,46,5],aR:[8,12,0,46,5],lL:[12,7,0,22,0,1],lR:[34,7,0,70,-8,0],lift:.012})},
  {e:'lin',t:.48,P:P({p:12,s:[5],n:[-8],h:[-10],aR:[-16,12,0,36,5],aL:[32,12,0,60,8],lR:[40,7,0,14,-6,1],lL:[-18,7,0,28,22,0]})},
  {e:'lin',t:.72,P:P({p:12,s:[5],n:[-8],h:[-10],aL:[8,12,0,46,5],aR:[8,12,0,46,5],lR:[12,7,0,22,0,1],lL:[34,7,0,70,-8,0],lift:.012})},
  {e:'lin',t:.96,P:P({p:12,s:[5],n:[-8],h:[-10],aL:[-16,12,0,36,5],aR:[32,12,0,60,8],lL:[40,7,0,14,-6,1],lR:[-18,7,0,28,22,0]})}]},
 {id:'shuffle',name:'Side shuffle',desc:'Low defensive side-step: lead foot opens, trail foot closes, chest stays square to the ball.',loop:1,keys:[
  {e:'lin',t:0,P:RD({lL:[50,4,-6,72,0,1],lR:[50,4,-6,72,0,1]})},
  {e:'lin',t:.16,P:RD({lL:[54,40,-6,60,0,0],lR:[50,-4,-6,74,0,1],pr:-4,lift:.03})},
  {e:'lin',t:.3,P:RD({lL:[50,30,-6,72,0,1],lR:[50,30,-6,72,0,1]})},
  {e:'lin',t:.46,P:RD({lL:[50,-4,-6,74,0,1],lR:[54,4,-6,60,0,0],pr:4,lift:.025})},
  {e:'lin',t:.6,P:RD({lL:[50,4,-6,72,0,1],lR:[50,4,-6,72,0,1]})}]},
 SPK({id:'spike',name:'Spike · Bow-and-arrow',desc:'The power swing: both arms up, elbow cocks back behind the head, whip through.',
  air:[.22,1.02,1.08,.72],tW:1.12,tH:1.26,tF:1.44,tL:1.7,
  arms:{take:[[140,14,0,12,0],[140,20,0,22,0]],wind:[[166,12,0,14,0],[152,34,0,125,25]],hit:[[25,20,0,95,0],[170,13,0,4,-28]],fol:[[10,20,0,60,0],[12,-6,0,30,0]],land:[[30,30,0,40,0],[30,30,0,40,0]]}}),
 SPK({id:'circle',name:'Spike · Circle swing',desc:'Windmill: the hitting arm stays low, loops back and over the top in one big circle.',
  air:[.22,1.0,1.08,.72],tW:1.1,tH:1.26,tF:1.44,tL:1.7,tw:{wind:-40,hit:30,fol:34},
  arms:{take:[[140,14,0,12,0],[-40,22,0,10,0]],wind:[[166,12,0,14,0],[-150,26,0,12,0]],hit:[[20,20,0,95,0],[-190,12,0,4,-30]],fol:[[10,20,0,60,0],[-330,-8,0,20,0]],land:[[30,30,0,40,0],[-330,28,0,40,0]],rec:[-325,18,0,80,15]}}),
 SPK({id:'reach',name:'Spike · Full reach',desc:'Big jump, body stretched toward the ball: the off-arm reaches long for balance and force while the hitting arm stays cocked and bent at the chest, knees trailing behind, eyes on the ball. Then the cocked arm whips through.',
  air:[.24,1.12,1.2,.84],tW:1.12,tH:1.3,tF:1.48,tL:1.74,arch:-20,crunch:-4,tw:{wind:-30,hit:24,fol:28},
  LG:{take:[[4,6,0,8,40,0],[4,6,0,8,40,0]],wind:[[12,8,0,98,35,0],[-12,8,0,118,35,0]],hit:[[30,10,0,70,30,0],[8,10,0,95,30,0]],fol:[[30,10,0,70,30,0],[10,10,0,90,30,0]]},
  arms:{take:[[150,14,0,12,0],[120,18,0,60,0]],wind:[[166,26,0,6,-24],[48,34,0,108,0]],hit:[[30,20,0,92,0],[170,14,0,4,-28]],fol:[[12,20,0,60,0],[12,-6,0,30,0]],land:[[30,30,0,40,0],[30,30,0,40,0]]}}),
 SPK({id:'snap',name:'Spike · Snap (quick)',desc:'Short, fast swing for a quick set: elbow high, tiny backswing, all wrist.',
  air:[.22,.84,.88,.55],tW:.98,tH:1.06,tF:1.18,tL:1.44,arch:-6,crunch:12,tw:{wind:-14,hit:14,fol:16},
  arms:{take:[[150,14,0,12,0],[165,18,0,20,0]],wind:[[160,12,0,20,0],[172,26,0,92,20]],hit:[[60,20,0,80,0],[175,12,0,4,-40]],fol:[[40,20,0,70,0],[95,6,0,40,-20]],land:[[30,30,0,40,0],[30,30,0,40,0]]}}),
 SPK({id:'backrow',name:'Spike · Back-row',desc:'Takes off behind the 3 m line and broad-jumps forward through the whole swing.',z0:-1.6,drift:2.1,
  air:[.24,1.0,1.06,.7],tW:1.12,tH:1.28,tF:1.46,tL:1.72,
  arms:{take:[[140,14,0,12,0],[140,20,0,22,0]],wind:[[166,12,0,14,0],[150,36,0,128,25]],hit:[[25,20,0,95,0],[168,13,0,4,-24]],fol:[[10,20,0,60,0],[12,-6,0,30,0]],land:[[30,30,0,40,0],[30,30,0,40,0]]},ballEnd:[.3,.11,9.5],ballT:.3}),
 SPK({id:'roll',name:'Spike · Roll shot',desc:'Sells the big swing, then slows the arm and rolls the wrist over the top for a soft drop.',fx:'ROLL~',
  air:[.22,1.02,1.08,.75],tW:1.12,tH:1.3,tF:1.5,tL:1.74,crunch:8,tw:{hit:10,fol:12},
  arms:{take:[[140,14,0,12,0],[140,20,0,22,0]],wind:[[166,12,0,14,0],[152,34,0,125,25]],hit:[[50,20,0,90,0],[165,12,0,25,-70]],fol:[[40,20,0,70,0],[140,12,0,30,-80]],land:[[30,30,0,40,0],[40,30,0,40,0]]},ballEnd:[.2,.11,6.2],ballArc:1.1,ballT:.75}),
 {id:'serve',name:'Serve · Float',desc:'Standing float: toss, cocked arm, step and pop. The arm stops dead so the ball wobbles.',net:10,keys:[
  {t:0,P:P({p:4,aL:{ik:[.05,-.03,.24],pole:[1,-1,0],wr:-10},aR:[60,45,0,100,0],lL:[18,8,0,12,0,1],lR:[-12,10,0,18,0,1],h:[-5]})},
  {t:.4,P:P({p:-2,s:[-6],c:[0,-28,0],n:[-8],h:[-30,15,0],aL:[166,10,0,5,0],aR:[150,34,0,125,10],lL:[10,8,0,8,0,1],lR:[-8,10,0,25,0,1]})},
  {t:.85,fx:'PAH!',P:P({p:8,s:[10],c:[6,20,0],h:[-25],aL:[30,20,0,70,0],aR:[170,12,0,3,-10],lL:[28,8,0,22,0,1],lR:[-25,10,0,35,40,0],fz:.25})},
  {t:1.1,P:P({p:8,s:[10],c:[4,16,0],h:[-15],aL:[25,20,0,70,0],aR:[150,15,0,10,0],lL:[28,8,0,22,0,1],lR:[-20,10,0,35,40,0],fz:.3})},
  {t:1.7,P:P({fz:.45})},{t:2.1,P:P({fz:.45})}],
  ball:[{t:0,at:'L',off:[0,.025,.03]},{t:.4,at:'L',off:[0,.06,0],arc:1.1},{t:.85,at:'R',off:[0,.05,.04],arc:.6},{t:2.0,p:[.3,.11,16.8]}]},
 {id:'topspin',name:'Serve · Topspin',desc:'Standing topspin: higher toss, full whip and wrist snap, arm follows through across the body.',net:10,keys:[
  {t:0,P:P({p:4,aL:{ik:[.05,-.03,.24],pole:[1,-1,0],wr:-10},aR:[60,45,0,100,0],lL:[18,8,0,12,0,1],lR:[-12,10,0,18,0,1],h:[-5]})},
  {t:.45,P:P({p:-4,s:[-10],c:[-4,-34,0],n:[-8],h:[-34,15,0],aL:[170,10,0,5,0],aR:[150,34,0,128,25],lL:[10,8,0,8,0,1],lR:[-8,10,0,30,0,1]})},
  {t:.95,fx:'ZIP!',P:P({p:12,s:[16],c:[10,26,0],h:[-22],aL:[30,20,0,80,0],aR:[172,12,0,3,-42],lL:[30,8,0,24,0,1],lR:[-25,10,0,35,40,0],fz:.3})},
  {t:1.15,P:P({p:20,s:[24],c:[8,30,0],h:[-10],aL:[20,20,0,70,0],aR:[15,-8,0,30,0],lL:[35,8,0,30,0,1],lR:[-15,10,0,40,40,0],fz:.4})},
  {t:1.7,P:P({fz:.5})},{t:2.1,P:P({fz:.5})}],
  ball:[{t:0,at:'L',off:[0,.025,.03]},{t:.45,at:'L',off:[0,.06,0],arc:1.5},{t:.95,at:'R',off:[0,.05,.04],arc:.5},{t:1.95,p:[-.4,.11,16]}]},
 {id:'jumpserve',name:'Serve · Jump (power)',desc:'High toss forward, three-step approach, full spike swing in the air. The scariest serve.',net:10,keys:[
  {t:0,P:P({p:4,aR:{ik:[.04,-.02,.25],pole:[1,-1,0],wr:-10},aL:[10,10,0,30,0],lL:[10,6,0,15,0,1],lR:[-5,6,0,12,0,1]})},
  {t:.35,P:P({p:-2,s:[-6],h:[-30],aR:[172,10,0,5,0],aL:[20,10,0,30,0],lL:[15,6,0,12,0,1],lR:[-10,6,0,20,20,0],fz:.1})},
  {t:.6,P:P({p:14,s:[8],n:[-15],h:[-25],aL:[30,10,0,60,0],aR:[-20,10,0,40,0],lL:[40,6,0,20,-10,1],lR:[-25,6,0,45,30,0],fz:.55})},
  {t:.82,P:P({p:26,s:[12],n:[-12],aL:[-55,14,0,15,0],aR:[-55,14,0,15,0],lR:[52,8,0,38,-10,1],lL:[-30,8,0,55,35,0],fz:1.35})},
  {t:.98,P:P({p:42,s:[18],c:[5],n:[-22],h:[-15],aL:[-80,16,0,8,0],aR:[-86,16,0,8,0],lL:[75,10,0,102,0,1],lR:[70,10,0,96,0,1],fz:1.85})},
  {t:1.12,e:'out',P:P({p:0,s:[-5],n:[-10],h:[-25],aL:[140,14,0,12,0],aR:[140,20,0,22,0],lL:[4,6,0,8,40,0],lR:[4,6,0,8,40,0],gnd:0,air:.2,fz:2.05})},
  {t:1.34,e:'out',P:P({p:-10,s:[-16],c:[-8,-34,0],n:[-10],h:[-22,25,0],aL:[166,12,0,14,0],aR:[150,36,0,128,25],lL:[10,10,0,70,30,0],lR:[-14,10,0,100,30,0],gnd:0,air:.9,fz:2.35})},
  {t:1.46,e:'in',fx:'BOOM!',P:P({p:10,s:[20],c:[12,28,0],n:[-6],h:[-12],aL:[25,20,0,95,0],aR:[170,13,0,4,-30],lL:[35,10,0,45,30,0],lR:[25,10,0,40,30,0],gnd:0,air:.95,fz:2.5})},
  {t:1.62,e:'in',P:P({p:15,s:[28],c:[10,30,0],aL:[10,20,0,60,0],aR:[12,-6,0,30,0],lL:[40,10,0,30,25,0],lR:[35,10,0,30,25,0],gnd:0,air:.6,fz:2.7})},
  {t:1.88,P:P({p:30,s:[12],n:[-10],aL:[30,30,0,40,0],aR:[30,30,0,40,0],lL:[60,12,0,85,0,1],lR:[55,12,0,80,0,1],fz:3.0})},
  {t:2.3,P:RD({fz:3.3})},{t:2.6,P:RD({fz:3.3})}],
  ball:[{t:0,at:'R',off:[0,.03,.03]},{t:.35,at:'R',off:[0,.06,0],arc:2.4},{t:1.46,at:'R',off:[0,.06,.04],arc:.2},{t:2.26,p:[.3,.11,16.5]}]},
 {id:'jumpfloat',name:'Serve · Jump float',desc:'Two-step approach, low toss, small jump. Firm palm, arm stops — no spin.',net:10,keys:[
  {t:0,P:P({p:4,aL:{ik:[.03,-.02,.24],pole:[1,-1,0],wr:-10},aR:{ik:[.03,-.02,.24],pole:[1,-1,0],wr:-10},lL:[10,6,0,15,0,1],lR:[-5,6,0,12,0,1]})},
  {t:.3,P:P({p:6,s:[2],h:[-25],aL:[125,12,0,10,0],aR:[150,34,0,125,20],lL:[38,6,0,20,-10,1],lR:[-20,6,0,40,30,0],fz:.4})},
  {t:.55,P:P({p:22,s:[10],h:[-25],c:[0,-24,0],aL:[130,12,0,10,0],aR:[150,34,0,128,20],lL:[60,10,0,80,0,1],lR:[55,10,0,75,0,1],fz:1.0})},
  {t:.7,e:'out',P:P({p:0,s:[-6],c:[-4,-28,0],h:[-28],aL:[140,12,0,10,0],aR:[150,34,0,128,20],lL:[4,6,0,8,40,0],lR:[4,6,0,8,40,0],gnd:0,air:.15,fz:1.15})},
  {t:.86,fx:'FLOAT~',P:P({p:6,s:[6],c:[4,16,0],h:[-18],aL:[40,20,0,80,0],aR:[172,12,0,3,-4],lL:[20,8,0,30,30,0],lR:[15,8,0,30,30,0],gnd:0,air:.45,fz:1.35})},
  {t:1.02,e:'in',P:P({p:6,s:[6],c:[4,14,0],h:[-14],aL:[40,20,0,80,0],aR:[160,12,0,5,-4],lL:[25,8,0,30,25,0],lR:[20,8,0,30,25,0],gnd:0,air:.3,fz:1.5})},
  {t:1.22,P:P({p:22,aL:[30,30,0,40,0],aR:[60,30,0,40,0],lL:[50,12,0,70,0,1],lR:[45,12,0,65,0,1],fz:1.65})},
  {t:1.7,P:RD({fz:1.9})},{t:2.0,P:RD({fz:1.9})}],
  ball:[{t:0,at:'LR',off:[0,.03,.03]},{t:.3,at:'LR',off:[0,.1,.05],arc:.7},{t:.86,at:'R',off:[0,.05,.04],arc:.5},{t:2.0,p:[.2,.11,17.2]}]},
 {id:'underhand',name:'Serve · Underhand',desc:'Safe beginner serve: ball low in the off hand, pendulum swing, pop it off the fist.',net:10,keys:[
  {t:0,P:P({p:22,s:[8],h:[-8],aL:{ik:[.0,-.17,.24],pole:[1,-1,0],wr:-20},aR:[-10,10,0,20,0],lL:[25,8,0,25,0,1],lR:[-15,10,0,25,0,1]})},
  {t:.45,P:P({p:26,s:[10],c:[0,-15,0],h:[-6],aL:{ik:[.0,-.17,.24],pole:[1,-1,0],wr:-20},aR:[-75,12,0,8,0],lL:[22,8,0,22,0,1],lR:[-18,10,0,35,0,1]})},
  {t:.78,fx:'PAK!',P:P({p:20,s:[8],c:[0,10,0],h:[-10],aL:[-25,20,0,20,0],aR:[38,4,0,4,0],lL:[30,8,0,30,0,1],lR:[-25,10,0,30,35,0],fz:.15})},
  {t:1.05,P:P({p:8,s:[0],c:[0,14,0],h:[-20],aL:[-15,20,0,20,0],aR:[115,10,0,10,0],lL:[25,8,0,20,0,1],lR:[-25,10,0,25,40,0],fz:.25})},
  {t:1.6,P:P({fz:.35})},{t:1.9,P:P({fz:.35})}],
  ball:[{t:0,at:'L',off:[0,.03,0]},{t:.78,at:'R',off:[0,-.02,.05],arc:3},{t:2.6,p:[0,.11,15.5]}]},
 {id:'skyball',name:'Serve · Sky ball',desc:'Crouch, swing straight up from the hip and send it into the sky — drops almost vertically.',net:10,keys:[
  {t:0,P:P({p:30,pr:8,s:[12],h:[-10],aL:{ik:[.02,-.18,.22],pole:[1,-1,0],wr:-20},aR:[-20,25,0,15,0],lL:[50,14,0,70,0,1],lR:[40,14,0,60,0,1]})},
  {t:.5,P:P({p:38,pr:12,s:[18],c:[0,-20,0],h:[-6],aL:{ik:[.02,-.18,.22],pole:[1,-1,0],wr:-20},aR:[-60,40,0,10,0],lL:[62,14,0,95,0,1],lR:[52,14,0,82,0,1]})},
  {t:.82,fx:'SKY BALL!',P:P({p:4,pr:0,s:[-8],c:[-4,12,0],n:[-25],h:[-35],aL:[-30,25,0,20,0],aR:[40,12,0,4,0],lL:[12,10,0,10,30,0],lR:[8,10,0,10,30,0],gnd:1})},
  {t:1.05,P:P({p:-4,s:[-12],c:[-4,10,0],n:[-30],h:[-45],aL:[10,25,0,30,0],aR:[175,10,0,6,0],lL:[4,8,0,4,35,0],lR:[2,8,0,4,35,0],gnd:0,air:.12})},
  {t:1.4,P:P({p:-2,s:[-10],n:[-30],h:[-48],aL:[20,25,0,40,0],aR:[160,12,0,10,0],lL:[8,8,0,8,0,1],lR:[8,8,0,8,0,1]})},
  {t:2.4,P:P({p:0,n:[-28],h:[-45],aL:[10,15,0,30,0],aR:[40,15,0,40,0]})},{t:2.8,P:P({h:[-20]})}],
  ball:[{t:0,at:'L',off:[0,.03,0]},{t:.82,at:'R',off:[0,-.01,.05],arc:9},{t:3.7,p:[.3,.11,13.5]}]},
 {id:'dig',name:'Dig',desc:'Shuffle, wide lunge, straight-arm platform under the ball.',net:null,keys:[
  {t:0,P:READY},{t:.22,P:RD({lL:[50,22,-8,70,0,1],lR:[50,10,-8,70,0,1],fx:-.35,lift:.04})},
  {t:.5,P:P({p:32,s:[18],c:[8],n:[-22],h:[-14],aL:{ik:[0,-.12,.24],pole:[1,-1,0],wr:12},aR:{ik:[0,-.12,.24],pole:[1,-1,0],wr:12},lR:[72,18,-12,108,0,1],lL:[14,46,0,4,0,1],fx:-.95})},
  {t:.58,fx:'DIG!',P:P({p:30,s:[16],c:[6],n:[-24],h:[-18],aL:{ik:[0,-.08,.25],pole:[1,-1,0],wr:12},aR:{ik:[0,-.08,.25],pole:[1,-1,0],wr:12},lR:[72,18,-12,105,0,1],lL:[14,46,0,4,0,1],fx:-.97})},
  {t:.85,P:P({p:26,s:[12],c:[4],n:[-24],h:[-22],aL:{ik:[0,-.02,.26],pole:[1,-1,0],wr:8},aR:{ik:[0,-.02,.26],pole:[1,-1,0],wr:8},lR:[66,16,-10,95,0,1],lL:[14,40,0,6,0,1],fx:-.97})},
  {t:1.3,P:RD({fx:-.85})},{t:1.6,P:RD({fx:-.85})}],
  ball:[{t:0,p:[-1.3,2.6,4.6],arc:.2},{t:.58,at:'LR',off:[0,.03,.05]},{t:1.5,p:[1.4,4.6,1.2],arc:1.4}]},
 {id:'set',name:'Set',desc:'Get under it, hands at the forehead, extend through the ball.',net:null,keys:[
  {t:0,P:P({p:6,s:[3],h:[-10],aL:[30,15,0,70,0],aR:[30,15,0,70,0],lL:[20,8,0,25,0,1],lR:[20,8,0,25,0,1]})},
  {t:.3,P:P({p:8,s:[-4],n:[-15],h:[-30],aL:{ik:[.07,.3,.1],pole:[1,-.4,.1],wr:-45},aR:{ik:[.07,.3,.1],pole:[1,-.4,.1],wr:-45},lL:[45,10,0,60,0,1],lR:[45,10,0,60,0,1]})},
  {t:.44,fx:'SET!',P:P({p:2,s:[-8],n:[-15],h:[-34],aL:{ik:[.05,.47,.08],pole:[1,-.2,0],wr:-20},aR:{ik:[.05,.47,.08],pole:[1,-.2,0],wr:-20},lL:[8,8,0,6,25,1],lR:[8,8,0,6,25,1]})},
  {t:.8,P:P({p:2,s:[-6],n:[-12],h:[-30],aL:[168,14,0,10,-15],aR:[168,14,0,10,-15],lL:[6,8,0,5,10,1],lR:[6,8,0,5,10,1]})},
  {t:1.3,P:P({p:6,s:[3],h:[-10],aL:[30,15,0,70,0],aR:[30,15,0,70,0],lL:[20,8,0,25,0,1],lR:[20,8,0,25,0,1]})}],
  ball:[{t:0,p:[.4,4.5,1.6]},{t:.44,at:'LR',off:[0,.13,.03],arc:1.3},{t:1.3,p:[3.6,4.4,.3]}]},
 {id:'block',name:'Block',desc:'Load, jump, press both hands over the net.',net:.48,keys:[
  {t:0,P:P({p:4,h:[-8],aL:{ik:[.11,.2,.1],pole:[1,-.6,-.2]},aR:{ik:[.11,.2,.1],pole:[1,-.6,-.2]},lL:[25,10,0,35,0,1],lR:[25,10,0,35,0,1]})},
  {t:.32,P:P({p:14,s:[6],h:[-12],aL:{ik:[.12,.17,.12],pole:[1,-.6,0]},aR:{ik:[.12,.17,.12],pole:[1,-.6,0]},lL:[60,12,0,90,0,1],lR:[60,12,0,90,0,1]})},
  {t:.5,e:'out',P:P({p:0,h:[-16],aL:{ik:[.08,.42,.08],pole:[1,-.2,0]},aR:{ik:[.08,.42,.08],pole:[1,-.2,0]},lL:[3,6,0,5,35,0],lR:[3,6,0,5,35,0],gnd:0,air:.18})},
  {t:.8,e:'in',fx:'BLOCK!',P:P({p:6,s:[10],c:[4],n:[-10],h:[-20],aL:{ik:[.07,.5,.18],pole:[1,0,0],wr:35},aR:{ik:[.07,.5,.18],pole:[1,0,0],wr:35},lL:[8,6,0,12,40,0],lR:[8,6,0,12,40,0],gnd:0,air:.88})},
  {t:1.1,P:P({p:20,aL:[60,30,0,40,0],aR:[60,30,0,40,0],lL:[55,12,0,85,0,1],lR:[55,12,0,85,0,1]})},
  {t:1.5,P:P({p:4,h:[-8],aL:{ik:[.11,.2,.1],pole:[1,-.6,-.2]},aR:{ik:[.11,.2,.1],pole:[1,-.6,-.2]},lL:[25,10,0,35,0,1],lR:[25,10,0,35,0,1]})}],
  ball:[{t:.3,p:[.4,3.8,3.6]},{t:.8,at:'LR',off:[0,.08,.1]},{t:1.15,p:[.2,.11,2.2]}]},
 {id:'dive',name:'Pancake dive',desc:'Push off, fly flat, palm on the floor, slide, kneel back up.',net:null,keys:[
  {t:0,P:P({p:15,s:[10],aL:[-30,10,0,60,0],aR:[40,10,0,80,0],lL:[35,8,0,25,-10,1],lR:[-20,8,0,60,30,0]})},
  {t:.22,P:P({p:45,s:[15],n:[-25],h:[-15],aL:[-60,15,0,20,0],aR:[-60,15,0,20,0],lL:[80,10,0,110,0,1],lR:[-5,10,0,50,30,0],fz:.45})},
  {t:.42,e:'lin',P:P({p:78,s:[-5],c:[-5],n:[-45],h:[-30],aR:[175,8,0,0,-30],aL:[150,35,0,20,0],lL:[-8,8,0,10,40,0],lR:[-5,8,0,25,40,0],lift:.42,fz:1.15})},
  {t:.62,fx:'PANCAKE!',P:P({p:86,s:[-5],c:[-5],n:[-45],h:[-30],aR:[178,6,0,0,-60],aL:[140,40,0,25,0],lL:[-8,8,0,10,40,0],lR:[-5,8,0,25,40,0],lift:.1,fz:2})},
  {t:.82,e:'out',P:P({p:90,s:[-10],n:[-40],h:[-25],aR:[170,10,0,10,-40],aL:[120,45,0,40,0],lL:[-10,8,0,20,40,0],lR:[-5,12,0,80,40,0],fz:2.7})},
  {t:1.2,P:P({p:90,s:[-10],n:[-40],h:[-25],aR:[165,12,0,15,-30],aL:[115,45,0,45,0],lL:[-10,8,0,20,40,0],lR:[-5,12,0,80,40,0],fz:2.95})},
  {t:1.7,P:P({p:20,s:[16],n:[-20],h:[-18],aL:[50,22,0,8,40],aR:[15,12,0,30,0],lL:[85,12,0,95,0,1],lR:[-12,8,0,98,40,0],fz:2.95})},
  {t:2.2,P:RD({fz:2.95})},{t:2.5,P:RD({fz:2.95})}],
  ball:[{t:.35,p:[0,1.1,2.9]},{t:.62,at:'R',off:[0,.06,0]},{t:1.25,p:[.3,3,1.4],arc:.5}]},
 {id:'celebrate',name:'Yes!!',desc:'Jump with both arms up, land, fist pump.',loop:1,keys:[
  {t:0,P:STAND},{t:.2,P:P({p:12,aL:[20,15,0,100,0],aR:[20,15,0,100,0],lL:[45,12,0,70,0,1],lR:[45,12,0,70,0,1],mo:.3})},
  {t:.42,e:'out',fx:'YES!!',P:P({p:-10,s:[-14],n:[-15],h:[-25],aL:[166,38,0,8,0],aR:[166,38,0,8,0],lL:[5,8,0,70,40,0],lR:[-10,8,0,85,40,0],gnd:0,air:.68,mo:1})},
  {t:.62,e:'in',P:P({p:-6,s:[-10],n:[-12],h:[-22],aL:[160,36,0,10,0],aR:[160,36,0,10,0],lL:[15,8,0,40,30,0],lR:[10,8,0,45,30,0],gnd:0,air:.48,mo:1})},
  {t:.8,P:P({p:15,aL:[60,30,0,90,0],aR:[60,30,0,90,0],lL:[45,12,0,65,0,1],lR:[45,12,0,65,0,1],mo:.6})},
  {t:1,P:P({p:18,s:[16],h:[2],aR:{ik:[.16,-.03,.12],pole:[.3,-1,-1.2]},aL:[20,20,0,40,0],lL:[40,14,0,55,0,1],lR:[30,12,0,45,0,1],mo:1})},
  {t:1.2,P:P({p:12,s:[10],h:[-2],aR:{ik:[.16,.04,.14],pole:[.3,-1,-1.2]},aL:[20,20,0,40,0],lL:[35,14,0,45,0,1],lR:[25,12,0,38,0,1],mo:1})},
  {t:1.4,P:P({p:18,s:[16],h:[2],aR:{ik:[.16,-.03,.12],pole:[.3,-1,-1.2]},aL:[20,20,0,40,0],lL:[40,14,0,55,0,1],lR:[30,12,0,45,0,1],mo:1})},
  {t:2,P:STAND}]},
 {id:'frust',name:'Frustrated',desc:'Hands on head after an error, then hands on knees.',loop:1,keys:[
  {t:0,P:STAND},{t:.45,P:P({s:[-6],n:[-10],h:[-25],aL:{ik:[.07,.31,-.01],pole:[1,.6,0],wr:20},aR:{ik:[.07,.31,-.01],pole:[1,.6,0],wr:20},lL:[0,8,0,4,0,1],lR:[4,8,0,8,0,1],mo:.5})},
  {t:1.3,P:P({s:[-6],n:[-12],h:[-28,12,0],aL:{ik:[.07,.31,-.01],pole:[1,.6,0],wr:20},aR:{ik:[.07,.31,-.01],pole:[1,.6,0],wr:20},lL:[0,8,0,4,0,1],lR:[4,8,0,8,0,1],mo:.5})},
  {t:1.8,P:P({p:38,s:[14],c:[6],n:[-25],h:[-10],aL:[42,12,0,8,0],aR:[42,12,0,8,0],lL:[38,12,0,40,0,1],lR:[38,12,0,40,0,1]})},
  {t:2.8,P:P({p:41,s:[15],c:[8],n:[-22],h:[-8,-10,0],aL:[44,12,0,8,0],aR:[44,12,0,8,0],lL:[40,12,0,44,0,1],lR:[40,12,0,44,0,1]})},
  {t:3.4,P:STAND}]}];


/* ---------- weak-stat versions (for the Skill levels tab) ---------- */
function clipById(id){return CLIPS.filter(function(c){return c.id===id})[0]}
/* straight standing pose for the player creator (gentle breathing only) */
CLIPS.push({id:'stand',hidden:1,name:'Stand',desc:'',loop:1,net:null,keys:[{t:0,P:P({aL:[0,7,0,8,0],aR:[0,7,0,8,0],lL:[0,3,0,2,0,1],lR:[0,3,0,2,0,1]})},{t:1.7,e:'io',P:P({s:[1.5],n:[-1],h:[-1.5],aL:[0,8,0,10,0],aR:[0,8,0,10,0],lL:[0,3,0,2,0,1],lR:[0,3,0,2,0,1]})},{t:3.4,P:P({aL:[0,7,0,8,0],aR:[0,7,0,8,0],lL:[0,3,0,2,0,1],lR:[0,3,0,2,0,1]})}]});
(function(){var uh=clipById('underhand');
 CLIPS.push({id:'serve_low',hidden:1,name:'Underhand (weak)',net:10,keys:uh.keys,ball:[{t:0,at:'L',off:[0,.03,0]},{t:.78,at:'R',off:[0,-.02,.05],arc:1.5},{t:2.2,p:[.6,.6,13],netFault:true}]});
 CLIPS.push(SPK({id:'spike_low',name:'Spike (weak)',desc:'',fx:'pok…',drift:.8,air:[.08,.3,.34,.16],tW:1.02,tH:1.16,tF:1.3,tL:1.46,arch:-4,crunch:6,tw:{wind:-12,hit:8,fol:10},
  arms:{take:[[110,14,0,30,0],[115,20,0,40,0]],wind:[[120,14,0,40,0],[140,28,0,70,8]],hit:[[60,20,0,80,0],[148,14,0,32,-5]],fol:[[40,20,0,70,0],[90,10,0,50,0]],land:[[30,30,0,40,0],[30,30,0,40,0]]},ballEnd:[.5,1.6,8],ballArc:.9,ballT:.75}));
 CLIPS[CLIPS.length-1].hidden=1;
 var dg=clipById('dig');
 CLIPS.push({id:'dig_low',hidden:1,name:'Dig (weak)',net:null,keys:[
  {t:0,P:P({p:8,s:[4],n:[-6],h:[-8],aL:[20,15,0,60,0],aR:[20,15,0,60,0],lL:[25,12,0,35,0,1],lR:[25,12,0,35,0,1]})},
  {t:.4,P:P({p:12,s:[6],n:[-10],h:[-10],aL:[30,15,0,40,0],aR:[30,15,0,40,0],lL:[30,14,0,40,0,1],lR:[22,10,0,30,0,1],fx:-.25})},
  {t:.58,fx:'OOF!',P:P({p:10,s:[4],n:[-14],h:[-6],aL:{ik:[.03,-.06,.17],pole:[1,-.6,.3],wr:5},aR:{ik:[.03,-.06,.17],pole:[1,-.6,.3],wr:5},lL:[25,14,0,30,0,1],lR:[18,10,0,24,0,1],fx:-.3,mo:.6})},
  {t:.74,P:P({p:-20,s:[-14],n:[-5],h:[10],aL:[110,45,0,40,0],aR:[95,40,0,40,0],lL:[-8,12,0,20,0,1],lR:[28,12,0,40,0,1],fx:-.3,fz:-.35,mo:.8})},
  {t:.98,e:'out',P:P({p:-8,s:[12],n:[-8],h:[-5],aL:[-45,28,0,12,-30],aR:[-45,28,0,12,-30],lL:[82,16,0,72,20,0],lR:[78,16,0,60,20,0],fx:-.3,fz:-.6,mo:.6})},
  {t:1.7,P:P({p:-6,s:[14],n:[-10],h:[6,-18,0],aL:[-45,28,0,12,-30],aR:[-45,28,0,12,-30],lL:[82,16,0,72,20,0],lR:[78,16,0,60,20,0],fx:-.3,fz:-.6,mo:.3})},
  {t:2.2,P:P({p:30,s:[12],n:[-10],h:[-6],aL:[40,20,0,15,40],aR:[10,15,0,30,0],lL:[85,12,0,95,0,1],lR:[-10,8,0,96,40,0],fx:-.3,fz:-.6})},
  {t:2.7,P:RD({fx:-.3,fz:-.6})},{t:2.9,P:RD({fx:-.3,fz:-.6})}],
  ball:[{t:0,p:[-.6,2.3,4.6],arc:.1},{t:.58,at:'LR',off:[0,.03,.05],arc:1.4},{t:1.5,p:[1.4,4.6,1.2]}]});
 CLIPS.push({id:'dig_high',hidden:1,name:'Dig (strong)',net:null,keys:dg.keys,ball:[{t:0,p:[-1.3,2.3,4.6],arc:.1},{t:.58,at:'LR',off:[0,.03,.05],arc:1.4},{t:1.5,p:[1.4,4.6,1.2]}]});
 var bk=clipById('block');
 CLIPS.push({id:'block_low',hidden:1,name:'Block (weak)',net:.48,keys:[
  bk.keys[0],
  {t:.4,P:P({p:8,s:[4],h:[-10],aL:{ik:[.13,.16,.08],pole:[1,-.6,0]},aR:{ik:[.13,.16,.08],pole:[1,-.6,0]},lL:[45,12,0,60,0,1],lR:[45,12,0,60,0,1]})},
  {t:.62,e:'out',P:P({p:0,h:[-18],aL:{ik:[.13,.38,.02],pole:[1,-.2,0]},aR:{ik:[.13,.38,.02],pole:[1,-.2,0]},lL:[3,6,0,5,30,0],lR:[3,6,0,5,30,0],gnd:0,air:.08})},
  {t:.8,e:'in',fx:'touch…',P:P({p:-4,s:[-4],n:[-12],h:[-22],aL:{ik:[.15,.45,.0],pole:[1,0,0],wr:-25},aR:{ik:[.15,.45,.0],pole:[1,0,0],wr:-25},lL:[8,6,0,14,35,0],lR:[8,6,0,14,35,0],gnd:0,air:.36})},
  {t:1.02,P:P({p:16,h:[-30,20,0],aL:[90,30,0,30,0],aR:[90,30,0,30,0],lL:[45,12,0,70,0,1],lR:[45,12,0,70,0,1]})},
  {t:1.5,P:bk.keys[0].P}],
  ball:[{t:.3,p:[.4,3.4,3.6]},{t:.8,at:'LR',off:[0,.1,.04],arc:.9},{t:1.45,p:[.8,1.2,-3.6]}]});
 CLIPS.push({id:'block_high',hidden:1,name:'Block (strong)',net:.48,keys:bk.keys,ball:[{t:.3,p:[.4,3.8,3.6]},{t:.8,at:'LR',off:[0,.08,.1]},{t:1.15,p:[.2,.11,2.2]}]});
 CLIPS.push({id:'set_low',hidden:1,name:'Set (weak)',net:null,keys:[
  {t:0,P:P({p:6,s:[3],h:[-10],aL:[30,15,0,70,0],aR:[30,15,0,70,0],lL:[20,8,0,25,0,1],lR:[20,8,0,25,0,1]})},
  {t:.32,P:P({p:6,s:[0],n:[-10],h:[-24],aL:{ik:[.09,.22,.13],pole:[1,-.6,.2],wr:-20},aR:{ik:[.09,.22,.13],pole:[1,-.6,.2],wr:-20},lL:[22,10,0,25,0,1],lR:[18,10,0,20,0,1],fx:.12})},
  {t:.42,fx:'oops',P:P({p:8,s:[2],n:[-10],h:[-24],aL:{ik:[.08,.33,.15],pole:[1,-.4,.2],wr:-30},aR:{ik:[.08,.33,.15],pole:[1,-.4,.2],wr:-30},lL:[18,10,0,18,0,1],lR:[14,10,0,15,0,1],fx:.12,mo:.4})},
  {t:.8,P:P({p:6,s:[3],h:[-14,20,0],aL:[140,22,0,30,-10],aR:[140,22,0,30,-10],lL:[15,8,0,15,0,1],lR:[15,8,0,15,0,1],fx:.12})},
  {t:1.3,P:P({p:6,s:[3],h:[-10],aL:[30,15,0,70,0],aR:[30,15,0,70,0],lL:[20,8,0,25,0,1],lR:[20,8,0,25,0,1],fx:.12})}],
  ball:[{t:0,p:[.9,4.5,1.9]},{t:.42,at:'LR',off:[0,.1,.08],arc:.4},{t:1.2,p:[1.7,2.6,1.6]}]});
 CLIPS.push({id:'set_high',hidden:1,name:'Set (strong)',net:null,keys:clipById('set').keys,ball:[{t:0,p:[.4,4.5,1.6]},{t:.44,at:'LR',off:[0,.13,.03],arc:1.5},{t:1.3,p:[3.6,4.4,.3]}]});
})();

/* ---------- spike polish: reach + draw-back, heavier staggered landing, look-down ---------- */
(function(){var LGR=[[12,8,0,98,35,0],[-12,8,0,118,35,0]];
 /* reach pose before the cock-back: off-arm stretches long, hitting arm bent at the chest */
 [['spike',0,1.0,.78],['backrow',-1.6,1.0,.76],['snap',0,.9,.5]].forEach(function(q){var c=clipById(q[0]);if(!c)return;var dr=q[0]==='backrow'?2.1:1.25,t=q[2],i=0;c.keys.forEach(function(k,j){if(k.t<t)i=j});
  c.keys.splice(i+1,0,{t:t,e:'out',P:P({p:-6,s:[-16],c:[-8,-26,-8],n:[-10],h:[-22,20,0],aL:[166,26,0,6,-24],aR:[48,34,0,108,0],lL:LGR[0],lR:LGR[1],gnd:0,air:q[3],fz:q[1]+2.2+dr*(t-.84)})})});
 /* full reach: extra draw-back key between the reach pose and the hit */
 (function(){var rc=clipById('reach'),i=0;rc.keys.forEach(function(k,j){if(k.t===1.12)i=j});
  rc.keys.splice(i+1,0,{t:1.2,e:'out',P:P({p:-8,s:[-20],c:[-8,-34,-12],n:[-10],h:[-22,25,0],aL:[163,26,0,6,-22],aR:[152,34,0,125,25],lL:LGR[0],lR:LGR[1],gnd:0,air:1.16,fz:2.2+1.25*(1.2-.84)})})})();
 /* landing: fall with gravity, reach for the floor looking down, plant a staggered stance, absorb, unwind */
 ['spike','circle','snap','backrow','reach','roll','spike_low'].forEach(function(id){var c=clipById(id);if(!c)return;var n=c.keys.length,F=c.keys[n-4],L=c.keys[n-3],tL=L.t,fz=L.P.fz,fa=Math.max(.04,(F.P.air||0)*Math.pow(.07/Math.max(.1,tL-F.t),2));c.ld=F.t;
  c.keys.splice(n-3,3,
   {t:tL-.07,e:'lin',P:P({p:20,s:[10],c:[6,-14,0],n:[8],h:[18],aL:[28,38,0,36,0],aR:[24,38,0,40,0],lL:[42,8,0,30,10,0],lR:[2,8,0,52,30,0],gnd:0,air:fa,fz:fz-.03})},
   {t:tL,e:'out',P:P({p:34,s:[16],c:[8,-18,0],n:[12],h:[16],aL:[48,26,0,50,0],aR:[44,26,0,54,0],lL:[66,12,0,78,0,1],lR:[-8,14,0,44,25,1],fz:fz})},
   {t:tL+.1,e:'out',P:P({p:38,s:[20],c:[8,-8,0],n:[14],h:[14],aL:[58,22,0,60,0],aR:[54,22,0,64,0],lL:[74,14,0,96,0,1],lR:[2,16,0,64,25,1],fz:fz+.04})},
   {t:tL+.32,e:'out',P:RD({p:26,h:[-8],aL:[30,22,0,60,10],aR:[30,22,0,60,10],fz:fz+.1})},
   {t:tL+.58,P:RD({fz:fz+.12})},{t:tL+.95,P:RD({fz:fz+.12})})})})();

/* ---------- setter clips: jump set / run-through set / back set ---------- */
(function(){
 var HU=function(y,x,z,wr){return {ik:[x==null?.07:x,y,z==null?.1:z],pole:[1,-.4,.1],wr:wr==null?-45:wr}};
 var STEPA={lL:[34,8,0,42,-5,1],lR:[-24,8,0,58,28,0]},STEPB={lL:[-24,8,0,58,28,0],lR:[34,8,0,42,-5,1]};
 function run(o,st){return P(Object.assign({p:11,s:[3],n:[-12],h:[-24],aL:HU(.13,.12,.18,-15),aR:HU(.13,.12,.18,-15)},st,o))}
 var JS=clipById('set');
 var jset={id:'jset',hand:{a:.76,r:.92},name:'Jump set (on the move)',desc:'Run into the ball, load, jump and set at the peak, drifting toward the net.',net:2.55,keys:[
  {t:0,P:run({fz:-0.5,yaw:0},STEPA)},
  {t:.16,P:run({fz:-0.12,yaw:25},STEPB)},
  {t:.32,P:run({fz:0.22,yaw:60,p:14,aL:HU(.2,.1,.16,-25),aR:HU(.2,.1,.16,-25)},STEPA)},
  {t:.44,P:P({p:25,s:[-2],n:[-16],h:[-28],aL:HU(.3,.07,.12,-45),aR:HU(.3,.07,.12,-45),lL:[72,12,0,102,0,1],lR:[66,12,0,96,0,1],fz:0.45,yaw:90})},
  {t:.58,e:'out',P:P({p:8,s:[-6],n:[-14],h:[-32],aL:HU(.36,.06,.1,-45),aR:HU(.36,.06,.1,-45),lL:[10,8,0,12,40,0],lR:[8,8,0,10,40,0],gnd:0,air:.12,fz:0.55,yaw:90})},
  {t:.72,e:'out',P:P({p:2,s:[-8],n:[-14],h:[-34],aL:HU(.42,.06,.08,-40),aR:HU(.42,.06,.08,-40),lL:[-2,8,0,16,34,0],lR:[-4,8,0,20,34,0],gnd:0,air:.42,fz:0.65,yaw:90})},
  {t:.84,e:'out',fx:'SET!',P:P({p:0,s:[-10],c:[0,-6,0],n:[-14],h:[-38],aL:HU(.45,.06,.06,-40),aR:HU(.45,.06,.06,-40),lL:[-4,8,0,22,34,0],lR:[-8,8,0,28,34,0],gnd:0,air:.56,fz:0.7,yaw:90})},
  {t:.96,e:'in',P:P({p:0,s:[-9],c:[0,-12,0],n:[-12],h:[-34],aL:[172,12,0,6,-32],aR:[172,12,0,6,-32],lL:[-2,8,0,16,34,0],lR:[-4,8,0,20,34,0],gnd:0,air:.5,fz:0.8,yaw:90})},
  {t:1.1,e:'in',P:P({p:4,s:[-4],c:[0,-8,0],n:[-8],h:[-20],aL:[150,18,0,14,-10],aR:[150,18,0,14,-10],lL:[4,8,0,12,34,0],lR:[3,8,0,12,34,0],gnd:0,air:.18,fz:0.9,yaw:90})},
  {t:1.22,P:P({p:28,s:[8],n:[-10],h:[-14],aL:[55,28,0,45,0],aR:[55,28,0,45,0],lL:[58,12,0,86,0,1],lR:[54,12,0,82,0,1],fz:0.98,yaw:90})},
  {t:1.5,P:RD({fz:1.05,yaw:90})},{t:1.85,P:RD({fz:1.05,yaw:90})}],
  ball:[{t:0,p:[.15,5.6,-1.8]},{t:.78,at:'LR',off:[0,.035,.02]},{t:.9,at:'LR',off:[0,.05,.0],arc:1.4},{t:1.55,p:[3.3,4.5,2.2]}]};
 var rset={id:'rset',hand:{a:.4,r:.56},name:'Run-through set',desc:'Two quick steps under the ball, then set without stopping.',net:2.55,keys:[
  {t:0,P:run({fz:-0.5,yaw:0},STEPA)},
  {t:.16,P:run({fz:-0.05,yaw:30},STEPB)},
  {t:.32,P:P({p:18,s:[0],n:[-16],h:[-28],aL:HU(.28,.07,.12,-45),aR:HU(.28,.07,.12,-45),lL:[50,10,0,70,0,1],lR:[44,10,0,62,0,1],fz:0.35,yaw:80})},
  {t:.46,e:'out',fx:'SET!',P:P({p:4,s:[-6],n:[-14],h:[-32],aL:HU(.45,.06,.06,-40),aR:HU(.45,.06,.06,-40),lL:[10,8,0,14,28,0],lR:[6,8,0,10,30,0],fz:0.55,yaw:90})},
  {t:.66,P:P({p:5,s:[-6],c:[0,-10,0],n:[-12],h:[-28],aL:[168,14,0,10,-20],aR:[168,14,0,10,-20],lL:[14,8,0,20,10,1],lR:[10,8,0,16,10,1],fz:0.65,yaw:90})},
  {t:.95,P:P({p:8,s:[0],n:[-8],h:[-14],aL:[60,22,0,40,0],aR:[60,22,0,40,0],lL:[24,8,0,30,0,1],lR:[20,8,0,26,0,1],fz:0.72,yaw:90})},
  {t:1.25,P:RD({fz:0.75,yaw:90})},{t:1.6,P:RD({fz:0.75,yaw:90})}],
  ball:[{t:0,p:[.1,4.0,-.8]},{t:.4,at:'LR',off:[0,.035,.02]},{t:.52,at:'LR',off:[0,.05,.0],arc:1.3},{t:1.2,p:[3.3,4.4,2.0]}]};
 var bset={id:'bset',hand:{a:.69,r:.85},name:'Back set (jump)',desc:'Run-in, square to zone 3, receive the ball upright above the forehead, then arch and push it back over the head to zone 2.',net:2.55,keys:[
  {t:0,P:run({fz:-.5,yaw:0},STEPA)},
  {t:.16,P:run({fz:-.12,yaw:25},STEPB)},
  {t:.32,P:run({fz:.22,yaw:60,p:14,aL:HU(.2,.1,.16,-25),aR:HU(.2,.1,.16,-25)},STEPA)},
  {t:.44,P:P({p:25,s:[-2],n:[-16],h:[-28],aL:HU(.3,.07,.12,-45),aR:HU(.3,.07,.12,-45),lL:[72,12,0,102,0,1],lR:[66,12,0,96,0,1],fz:.45,yaw:90})},
  {t:.58,e:'out',P:P({p:6,s:[-4],n:[-14],h:[-34],aL:HU(.36,.06,.08,-45),aR:HU(.36,.06,.08,-45),lL:[8,8,0,12,40,0],lR:[4,8,0,10,40,0],gnd:0,air:.12,fz:.55,yaw:90})},
  {t:.69,e:'out',P:P({p:3,s:[-6],n:[-14],h:[-38],aL:HU(.43,.06,.05,-42),aR:HU(.43,.06,.05,-42),lL:[-2,8,0,16,34,0],lR:[-4,8,0,20,34,0],gnd:0,air:.42,fz:.65,yaw:90})},
  {t:.77,P:P({p:-1,s:[-8],c:[0,-4,0],n:[-16],h:[-42],aL:HU(.47,.06,-.03,-38),aR:HU(.47,.06,-.03,-38),lL:[-4,8,0,22,34,0],lR:[-8,8,0,28,34,0],gnd:0,air:.52,fz:.7,yaw:90})},
  {t:.85,e:'out',fx:'BACK SET!',P:P({p:-4,s:[-15],c:[0,-6,0],n:[-20],h:[-48],aL:HU(.52,.06,-.18,-30),aR:HU(.52,.06,-.18,-30),lL:[-8,8,0,28,34,0],lR:[-12,8,0,34,34,0],gnd:0,air:.56,fz:.8,yaw:90})},
  {t:.98,e:'in',P:P({p:-3,s:[-12],c:[0,-5,0],n:[-18],h:[-44],aL:HU(.5,.06,-.24,-30),aR:HU(.5,.06,-.24,-30),lL:[-6,8,0,24,34,0],lR:[-10,8,0,30,34,0],gnd:0,air:.3,fz:.88,yaw:90})},
  {t:1.1,e:'in',P:P({p:2,s:[-10],c:[0,-8,0],n:[-10],h:[-24],aL:HU(.4,.06,-.1,-30),aR:HU(.4,.06,-.1,-30),lL:[4,8,0,12,34,0],lR:[3,8,0,12,34,0],gnd:0,air:.1,fz:.94,yaw:90})},
  {t:1.22,P:P({p:28,s:[8],n:[-10],h:[-14],aL:[55,28,0,45,0],aR:[55,28,0,45,0],lL:[58,12,0,86,0,1],lR:[54,12,0,82,0,1],fz:1.0,yaw:90})},
  {t:1.5,P:RD({fz:1.05,yaw:90})},{t:1.85,P:RD({fz:1.05,yaw:90})}],
  ball:[{t:0,p:[.15,5.6,-1.8]},{t:.69,at:'LR',off:[0,.035,.03]},{t:.77,at:'LR',off:[0,.035,0]},{t:.85,at:'LR',off:[0,.05,-.06],arc:1.4},{t:1.55,p:[-3.4,4.5,1.9]}]};

CLIPS.splice(CLIPS.indexOf(JS)+1,0,jset,rset,bset);
})();

/* ---------- dead-ball loops (huddles, scolding, celebrations) ---------- */
(function(){var HIP={ik:[.13,-.13,-.03],pole:[1,0,-1],wr:0};function L(id,keys){CLIPS.push({id:id,hidden:1,loop:1,name:id,net:null,keys:keys})}
 L('clap',[{t:0,P:P({p:4,h:[-6],aL:{ik:[.2,.1,.18],pole:[1,-.6,0]},aR:{ik:[.2,.1,.18],pole:[1,-.6,0]},mo:.5})},{t:.18,P:P({p:4,h:[-6],aL:{ik:[.015,.12,.22],pole:[1,-.6,0]},aR:{ik:[.015,.12,.22],pole:[1,-.6,0]},mo:.2,lift:.02})},{t:.36,P:P({p:4,h:[-6],aL:{ik:[.2,.1,.18],pole:[1,-.6,0]},aR:{ik:[.2,.1,.18],pole:[1,-.6,0]},mo:.5})}]);
 L('pump',[{t:0,P:P({p:12,s:[10],aR:{ik:[.17,.02,.1],pole:[.4,-1,-1]},aL:[20,20,0,60,0],lL:[35,12,0,45,0,1],lR:[25,12,0,35,0,1],mo:1})},{t:.32,P:P({p:4,s:[0],h:[-20],aR:{ik:[.16,.27,.08],pole:[.4,-1,-.6]},aL:[20,20,0,60,0],lL:[15,12,0,20,0,1],lR:[10,12,0,15,0,1],mo:.7,lift:.05})},{t:.7,P:P({p:12,s:[10],aR:{ik:[.17,.02,.1],pole:[.4,-1,-1]},aL:[20,20,0,60,0],lL:[35,12,0,45,0,1],lR:[25,12,0,35,0,1],mo:1})}]);
 L('flex',[{t:0,P:P({s:[-8],h:[-16],aL:{ik:[.22,.2,.02],pole:[1,-.3,-.3]},aR:{ik:[.22,.2,.02],pole:[1,-.3,-.3]},lL:[8,16,0,14,0,1],lR:[8,16,0,14,0,1],mo:1})},{t:.6,P:P({s:[-12],h:[-24],aL:{ik:[.22,.24,.03],pole:[1,-.3,-.3]},aR:{ik:[.22,.24,.03],pole:[1,-.3,-.3]},lL:[8,16,0,14,0,1],lR:[8,16,0,14,0,1],mo:.8,lift:.02})},{t:1.2,P:P({s:[-8],h:[-16],aL:{ik:[.22,.2,.02],pole:[1,-.3,-.3]},aR:{ik:[.22,.2,.02],pole:[1,-.3,-.3]},lL:[8,16,0,14,0,1],lR:[8,16,0,14,0,1],mo:1})}]);
 L('point',[{t:0,P:P({s:[-6],h:[-34],aR:[178,8,0,0,0],aL:[30,20,0,80,0],mo:.6})},{t:.5,P:P({s:[-8],h:[-28,10,0],aR:[170,14,0,6,0],aL:[30,20,0,80,0],mo:.3,lift:.02})},{t:1,P:P({s:[-6],h:[-34],aR:[178,8,0,0,0],aL:[30,20,0,80,0],mo:.6})}]);
 L('highfive',[{t:0,P:P({p:6,aR:[95,20,0,70,0],aL:[20,15,0,40,0],mo:.4})},{t:.3,P:P({p:-4,s:[-6],h:[-20],aR:[172,14,0,8,0],aL:[20,15,0,40,0],mo:.8,lift:.06})},{t:.42,P:P({p:8,s:[6],h:[-6],aR:[130,10,0,8,-30],aL:[20,15,0,40,0],mo:1})},{t:1,P:P({p:6,aR:[95,20,0,70,0],aL:[20,15,0,40,0],mo:.4})}]);
 L('huddle',[{t:0,P:P({p:32,s:[12],n:[8],h:[18],aL:[72,78,0,15,0],aR:[72,78,0,15,0],lL:[32,14,0,38,0,1],lR:[32,14,0,38,0,1]})},{t:.8,P:P({p:35,s:[14],n:[10],h:[24],aL:[72,80,0,18,0],aR:[72,80,0,18,0],lL:[36,14,0,44,0,1],lR:[36,14,0,44,0,1]})},{t:1.6,P:P({p:32,s:[12],n:[8],h:[18],aL:[72,78,0,15,0],aR:[72,78,0,15,0],lL:[32,14,0,38,0,1],lR:[32,14,0,38,0,1]})}]);
 L('huddleJump',[{t:0,P:P({p:18,s:[8],h:[-4],aL:[80,80,0,15,0],aR:[80,80,0,15,0],lL:[40,12,0,60,0,1],lR:[40,12,0,60,0,1],mo:.8})},{t:.33,e:'in',P:P({p:4,s:[0],h:[-16],aL:[95,80,0,10,0],aR:[95,80,0,10,0],lL:[5,8,0,25,30,0],lR:[5,8,0,25,30,0],gnd:0,air:.28,mo:1})},{t:.66,P:P({p:18,s:[8],h:[-4],aL:[80,80,0,15,0],aR:[80,80,0,15,0],lL:[40,12,0,60,0,1],lR:[40,12,0,60,0,1],mo:.8})}]);
 L('scold',[{t:0,P:P({s:[6],h:[-4,14,0],aR:[85,8,0,8,0],aL:HIP,mo:.9})},{t:.25,P:P({s:[10],h:[0,-12,0],aR:[68,8,0,28,0],aL:HIP,mo:.15})},{t:.5,P:P({s:[6],h:[-4,14,0],aR:[85,8,0,8,0],aL:HIP,mo:.9})},{t:.75,P:P({s:[10],h:[0,-10,0],aR:[70,8,0,25,0],aL:HIP,mo:.2})},{t:1,P:P({s:[6],h:[-4,14,0],aR:[85,8,0,8,0],aL:HIP,mo:.9})}]);
 L('scolded',[{t:0,P:P({p:4,s:[6],n:[10],h:[22],aL:HIP,aR:HIP})},{t:.7,P:P({p:5,s:[8],n:[12],h:[32],aL:HIP,aR:HIP})},{t:1.4,P:P({p:4,s:[6],n:[10],h:[22],aL:HIP,aR:HIP})}]);
 L('handsHips',[{t:0,P:P({p:2,h:[-4,18,0],aL:HIP,aR:HIP,lL:[0,6,0,4,0,1],lR:[6,10,0,12,0,1]})},{t:.9,P:P({p:2,h:[-6,-18,0],aL:HIP,aR:HIP,lL:[4,8,0,10,0,1],lR:[0,6,0,4,0,1]})},{t:1.8,P:P({p:2,h:[-4,18,0],aL:HIP,aR:HIP,lL:[0,6,0,4,0,1],lR:[6,10,0,12,0,1]})}]);
})();
var SKILLS={
 serve:{low:'serve_low',high:'jumpserve',lo:['Rating 2','Underhand only','Slow pendulum swing with no power. The ball drops into the net — dead ball, point to the other side.'],hi:['Rating 9','Jump power serve','High toss, 3-step approach, full spike swing in the air. Fast, heavy, with topspin.']},
 spike:{low:'spike_low',high:'spike',lo:['Rating 2','Small hop, bent arm','Barely leaves the floor, short backswing, contact low with a bent elbow. Ball loops softly.'],hi:['Rating 9','Bow-and-arrow, ~1.1 m jump','Big approach, long hang time, full cock and whip. Ball goes straight down.']},
 dig:{low:'dig_low',high:'dig_high',lo:['Rating 2','Perfect pass, but bowled over','Timed it right, so the pass still goes up perfectly to the setter. But the hit knocks them back onto their butt, and they are slow to get up for the next play.'],hi:['Rating 9','Perfect pass, stays on their feet','Reads early, wide lunge, straight platform. Absorbs the hit, passes to the setter and is ready again right away.']},
 block:{low:'block_low',high:'block_high',lo:['Rating 2','Late jump, hands apart','Jumps late and low, hands go straight up and wide. Ball deflects off the fingers and out behind.'],hi:['Rating 9','On time, hands over the net','Loads early, jumps high, presses both hands over the tape. Stuffs the ball straight down.']},
 set:{low:'set_low',high:'set_high',lo:['Rating 2','Lazy feet, low hands','Not under the ball, contact low and in front of the face. Set is short and off target.'],hi:['Rating 9','Square, hands at forehead','Gets under the ball early, extends through it. High, accurate set to the hitter.']}};
function ease(k,e){if(e==='lin')return k;if(e==='in')return k*k;if(e==='out')return 1-(1-k)*(1-k);return k*k*(3-2*k)}
function bake(C,clip){var keys=clip.keys.map(function(k){var ps=k.P;applyFK(C,ps);var q={};JN.forEach(function(n){q[n]=C.J[n].quaternion.clone()});
  return {t:k.t,e:k.e||'io',q:q,aL:ps.aL,aR:ps.aR,pp:ps.p,air:ps.air,gnd:ps.gnd,lift:ps.lift,fz:ps.fz,fx:ps.fx,yaw:ps.yaw,mo:ps.mo,fxT:k.fx}});
 var B={clip:clip,keys:keys,dur:keys[keys.length-1].t,ball:null,fx:keys.filter(function(k){return k.fxT}).map(function(k){return {t:k.t,txt:k.fxT}})};
 var par=C.root.parent,inv=null;if(par&&par.type!=='Scene'){par.updateMatrixWorld(true);inv=new THREE.Matrix4().copy(par.matrixWorld).invert()}
 if(clip.ball){B.ball=clip.ball.map(function(b){var p;if(b.p)p=new THREE.Vector3(b.p[0],b.p[1],b.p[2]);else{evalB(C,B,b.t);p=new THREE.Vector3();
   var hs=b.at==='LR'?['L','R']:[b.at];hs.forEach(function(s){C.hand[s].getWorldPosition(tmpV);if(inv)tmpV.applyMatrix4(inv);p.add(tmpV)});p.multiplyScalar(1/hs.length);
   if(b.off)p.add(new THREE.Vector3(b.off[0]*C.H,b.off[1]*C.H,b.off[2]*C.H))}return {t:b.t,p:p,arc:b.arc||0,netFault:!!b.netFault}})}
 if(B.ball&&clip.net!=null)for(var i=0;i<B.ball.length-1;i++){var a=B.ball[i],c=B.ball[i+1];
  if(c.netFault){var k0=(clip.net-a.p.z)/(c.p.z-a.p.z);if(k0>0&&k0<1){var hp=a.p.clone().lerp(c.p,k0);hp.y+=4*a.arc*k0*(1-k0);hp.y=Math.min(hp.y,NET_TOP-.25);a.hit={k:k0,p:hp,t:a.t+k0*(c.t-a.t),dir:Math.sign(c.p.z-a.p.z)};B.fx.push({t:a.hit.t,txt:'NET!'})}}
  else a.arc=netClear(a.p,c.p,a.arc,clip.net)}
 return B}
var NET_TOP=2.43;
function netClear(a,b,arc,nz){if((a.z-nz)*(b.z-nz)>=0||Math.abs(a.z-nz)<.6||Math.abs(b.z-nz)<.6)return arc;var k=(nz-a.z)/(b.z-a.z),y=lerp(a.y,b.y,k)+4*arc*k*(1-k),need=NET_TOP+.32;
 return y<need?arc+(need-y)/(4*k*(1-k)):arc}
var qa=new THREE.Quaternion();
function evalB(C,B,t,mir){mir=mir||1;var ks=B.keys,i=0;t=cl(t,0,B.dur);while(i<ks.length-2&&t>ks[i+1].t)i++;var a=ks[i],b=ks[i+1]||a,k=b.t>a.t?cl((t-a.t)/(b.t-a.t),0,1):0,kr=k;k=ease(k,a.e);
 JN.forEach(function(n){C.J[n].quaternion.copy(a.q[n]).slerp(b.q[n],k)});
 ['L','R'].forEach(function(s){var x=a['a'+s],y=b['a'+s];if(Array.isArray(x)&&Array.isArray(y)){var sd=s==='L'?1:-1,v=x.map(function(q,i){return lerp(q,y[i],k)});
  C.J['sh'+s].rotation.set(-v[0]*D2R,sd*v[2]*D2R,sd*v[1]*D2R);C.J['el'+s].rotation.set(-v[3]*D2R,0,0);C.J['wr'+s].rotation.set(-v[4]*D2R,0,0)}});
 C.root.position.set(lerp(a.fx,b.fx,kr)*mir,0,lerp(a.fz,b.fz,kr));C.root.rotation.y=lerp(a.yaw,b.yaw,k)*D2R*mir;
 ground(C,lerp(a.gnd,b.gnd,k),lerp(a.air,b.air,k),lerp(a.lift,b.lift,k));setMouth(C,lerp(a.mo,b.mo,k))}
/* ---- hand articulation: fan = finger spread, c1/c2 = knuckle / tip curl, tz/tc = thumb out/curl, wr = wrist ---- */
var FSHAPE={rel:{fan:.12,c1:.31,c2:.39,tz:.55,tc:.2,wr:0},open:{fan:.3,c1:.12,c2:.12,tz:.75,tc:.05,wr:0},ready:{fan:.34,c1:.41,c2:.49,tz:.45,tc:.25,wr:.05},
 reach:{fan:.52,c1:.1,c2:.1,tz:.8,tc:.05,wr:.18},absorb:{fan:.3,c1:.82,c2:.94,tz:.25,tc:.5,wr:.42},snap:{fan:.58,c1:.03,c2:.03,tz:.65,tc:0,wr:-.3}};
var _fv=new THREE.Vector3(),_hv=new THREE.Vector3(),FM=['fan','c1','c2','tz','tc','wr'];
function rmp(t,a,b){return cl((t-a)/(b-a),0,1)}function sst(k){return k*k*(3-2*k)}
function mixS(A,B,k){var o={};FM.forEach(function(n){o[n]=lerp(A[n],B[n],k)});return o}
function applyFing(C,s,S,wrist){var F=C.fing[s];F.g[0].rotation.x=S.c1;F.g[1].rotation.x=S.c2;F.g[0].scale.x=F.g[1].scale.x=.9+S.fan*.8;F.t[0].rotation.set(.5*S.tc,0,-F.sd*S.tz);F.t[1].rotation.set(S.tc,0,0);if(wrist){var w=C.J['wr'+s];if(w)w.rotation.x+=S.wr}}
function handShape(C,B,t){if(!C.fing||!C.J.head)return;var cp=B&&B.clip,id=(cp&&cp.id)||'',hp=cp&&cp.hand,Bm,mode=/block|spike|attack|tip|roll|snap|circle|reach|backrow|jset|rset|bset/.test(id)&&!hp?'open':'rel';
 if(hp){var ta=hp.a,tr=hp.r,wR=sst(rmp(t,ta-.24,ta-.08))*(1-sst(rmp(t,ta-.08,ta+.01))),wA=sst(rmp(t,ta-.03,ta+.07))*(1-sst(rmp(t,tr-.07,tr))),wS=sst(rmp(t,tr-.05,tr+.02))*(1-sst(rmp(t,tr+.06,tr+.22))),tot=Math.max(1,wR+wA+wS),P=FSHAPE.ready;
  P=mixS(P,FSHAPE.reach,wR/tot);P=mixS(P,FSHAPE.absorb,wA/tot);P=mixS(P,FSHAPE.snap,wS/tot);Bm=P}
 else Bm=FSHAPE[mode];
 C.J.head.getWorldPosition(_hv);var hy=_hv.y;
 ['L','R'].forEach(function(s){if(!C.fing[s])return;C.hand[s].getWorldPosition(_fv);var a=cl((_fv.y-hy+.3*C.H*.57)/(.3*C.H*.57),0,1);applyFing(C,s,mixS(FSHAPE.rel,Bm,a),!!hp)});C.fshape=null}
function fingRest(C){if(!C.fing||C.fshape==='rel')return;['L','R'].forEach(function(s){if(C.fing[s])applyFing(C,s,FSHAPE.rel,false)});C.fshape='rel'}
var _evalB0=evalB;evalB=function(C,B,t,mir){_evalB0(C,B,t,mir);handShape(C,B,t)};
function ballAt(B,t){var b=B.ball;if(!b||t<b[0].t)return null;for(var j=0;j<b.length;j++)if(b[j].hit&&t>=b[j].hit.t){var h=b[j].hit,e=t-h.t;if(e>1.6)return null;var q=h.p.clone();q.z-=h.dir*Math.min(e,.5)*.5;q.y=Math.max(.11,h.p.y-4.9*e*e);if(q.y<=.11)q.y=.11+Math.abs(Math.sin((e-Math.sqrt((h.p.y-.11)/4.9))*9))*.25*Math.exp(-e*3);return q}
 if(t>b[b.length-1].t+.25)return null;var i=0;while(i<b.length-2&&t>b[i+1].t)i++;var a=b[i],c=b[i+1];
 if(t>c.t){return c.p.clone().add(c.p.clone().sub(a.p).multiplyScalar((t-c.t)/(c.t-a.t)))}
 var k=(t-a.t)/(c.t-a.t),p=a.p.clone().lerp(c.p,k);p.y+=4*a.arc*k*(1-k);return p}


/* ===== src/look.js ===== */
/* ---------- head look-at ---------- */
var LQ=new THREE.Quaternion(),LP=new THREE.Quaternion(),LF=new THREE.Vector3(),LD=new THREE.Vector3(),LE=new THREE.Vector3(),ID=new THREE.Quaternion();
function lookStep(C,target,want,dt){C.lt=C.lt||new THREE.Vector3(0,1.6,5);C.lw=C.lw||0;
 if(target){if(!C.ltInit){C.lt.copy(target);C.ltInit=true}C.lt.lerp(target,Math.min(1,dt*9))}
 C.lw+=((target&&want?1:0)-C.lw)*Math.min(1,dt*6);if(C.lw<.01)return;
 C.root.updateMatrixWorld(true);var v=C.J.chest.worldToLocal(LE.copy(C.lt));v.y-=.2*C.H;
 var hz=Math.hypot(v.x,v.z),yaw=Math.atan2(v.x,v.z)*cl(hz/(.35*C.H),0,1),pit=Math.atan2(v.y,Math.max(hz,.15*C.H)),beh=Math.abs(yaw)>110*D2R;
 yaw=cl(yaw,-80*D2R,80*D2R);pit=cl(pit,-40*D2R,beh?20*D2R:60*D2R);var w=C.lw*(beh?.6:1);
 [['neck',.4],['head',.6]].forEach(function(js){var j=C.J[js[0]];LQ.setFromEuler(new THREE.Euler(-pit*js[1],yaw*js[1],0,'YXZ'));j.quaternion.slerp(LQ,w)});
 C.root.updateMatrixWorld(true)}
function headPos(c){var v=new THREE.Vector3();c.C.J.head.localToWorld(v.set(0,.06*c.C.H,0));return v}
/* ---------- ponytail physics ---------- */
var gV=new THREE.Vector3(0,-9.8,0),up=new THREE.Vector3(0,1,0),hq=new THREE.Quaternion();
function ponyStep(C,dt,reset){var P=C.pony;if(!P)return;var A=P.anchor.getWorldPosition(new THREE.Vector3());C.headJ.getWorldQuaternion(hq);
 var rest=new THREE.Vector3(0,-.55,-1).normalize().applyQuaternion(hq);
 if(reset||!P.init){for(var i=0;i<P.n;i++){P.pts[i].copy(A).addScaledVector(rest,P.seg*i);P.prev[i].copy(P.pts[i])}P.init=true}
 P.pts[0].copy(A);P.prev[0].copy(A);
 for(i=1;i<P.n;i++){var p=P.pts[i],v=p.clone().sub(P.prev[i]).multiplyScalar(.9);P.prev[i].copy(p);p.add(v).addScaledVector(gV,dt*dt*.6);
  var target=A.clone().addScaledVector(rest,P.seg*i);p.lerp(target,.06)}
 for(var it=0;it<3;it++)for(i=1;i<P.n;i++){var d=P.pts[i].clone().sub(P.pts[i-1]),L=d.length()||1e-6;P.pts[i].copy(P.pts[i-1]).addScaledVector(d,P.seg/L)}
 var ms=P.segs||P.meshes.children;for(i=0;i<P.n-1+1&&i<ms.length-1;i++){var a=P.pts[i],b=P.pts[Math.min(i+1,P.n-1)];var dir=b.clone().sub(a);if(dir.lengthSq()<1e-8)dir.set(0,-1,0);
  ms[i].position.copy(a).lerp(b,.5);ms[i].quaternion.setFromUnitVectors(up,dir.normalize())}
 ms[ms.length-1].position.copy(A)}
function settlePony(C){if(!C.pony)return;ponyStep(C,1/60,true);for(var i=0;i<90;i++)ponyStep(C,1/60)}

/* ===== src/loco.js ===== */
/* stride = how far the planted foot sweeps (relative to the body) over one cycle; measured from the clip itself per character */
function strideOf(c,id){c.strd=c.strd||{};if(c.strd[id]!=null)return c.strd[id];var C=c.C,B=c.bake(id),N=96,V=new THREE.Vector3(),ax=id==='shuffle'?'x':'z',P={L:[],R:[]};
 for(var i=0;i<N;i++){evalB(C,B,B.dur*i/N);ground(C,1,0,0);['L','R'].forEach(function(s){C.J['an'+s].getWorldPosition(V);P[s].push(C.root.worldToLocal(V.clone()))})}
 /* body speed = how fast a grounded foot sweeps backwards; distance per cycle = that speed x cycle time */
 var tot=0,n=0;['L','R'].forEach(function(s){var a=P[s],mn=Math.min.apply(null,a.map(function(p){return p.y})),sw=0,cnt=0;
  for(var i=0;i<N;i++){var b=a[i],nx=a[(i+1)%N];if(b.y<mn+.012*C.H/1.8&&nx.y<mn+.012*C.H/1.8){sw+=nx[ax]-b[ax];cnt++}}if(cnt){tot+=sw/cnt*N;n++}});
 return c.strd[id]=n?tot/n:-.5}
function frac(x){return ((x%1)+1)%1}
var IKV={a:new THREE.Vector3(),b:new THREE.Vector3(),c:new THREE.Vector3(),d:new THREE.Vector3(),q:new THREE.Quaternion(),q2:new THREE.Quaternion(),m:new THREE.Matrix4(),m2:new THREE.Matrix4(),X:new THREE.Vector3(1,0,0),Y:new THREE.Vector3(0,1,0)};
function basisQ(u,f,out){var y=u.clone().normalize(),z=f.clone().sub(y.clone().multiplyScalar(f.dot(y))).normalize(),x=new THREE.Vector3().crossVectors(y,z);IKV.m.makeBasis(x,y,z);return out.setFromRotationMatrix(IKV.m)}
/* two-bone leg IK: puts the ankle on a world point, knee pointing along the body's forward, foot flat at yaw fy */
function legIK(C,s,T,fy,toe){var hip=C.J['hip'+s],kn=C.J['kn'+s],an=C.J['an'+s],pel=hip.parent,sd=s==='L'?1:-1;
 var th=kn.position.length(),sh=an.position.length();pel.updateMatrixWorld(true);var hw=hip.getWorldPosition(new THREE.Vector3()),pq=pel.getWorldQuaternion(new THREE.Quaternion()),pqi=pq.clone().invert();
 var d=T.clone().sub(hw).applyQuaternion(pqi),L=cl(d.length(),Math.abs(th-sh)+.02,(th+sh)*.995),ci=cl((th*th+sh*sh-L*L)/(2*th*sh),-1,1),k=Math.PI-Math.acos(ci);
 var a=new THREE.Vector3(0,-th-sh*Math.cos(k),-sh*Math.sin(k));var fw=new THREE.Vector3(Math.sin(fy)+sd*.0,0,Math.cos(fy)).applyQuaternion(pqi);
 var qA=basisQ(a,new THREE.Vector3(0,0,1),new THREE.Quaternion()),qB=basisQ(d,fw,new THREE.Quaternion());hip.quaternion.copy(qB.multiply(qA.invert()));
 kn.quaternion.setFromAxisAngle(IKV.X,k);hip.updateMatrixWorld(true);var kq=kn.getWorldQuaternion(new THREE.Quaternion()).invert();
 an.quaternion.copy(kq.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(toe||0,fy,0,'YXZ'))))}
/* foot lock: the walk/shuffle cycles drive the legs (smooth); while a foot is down in the cycle it is pinned to the floor
   with a soft weight so it can't skate. Pins ease in/out and let go if the body drifts too far from them. */
function footIK(c,dt,w){var C=c.C,sc=C.H/1.8,J=C.J;if(w<.01){c.ik=null;return}
 if(!c.ik)c.ik={L:{lk:0,p:null},R:{lk:0,p:null}};var yaw=c.box.rotation.y;C.root.updateMatrixWorld(true);
 ['L','R'].forEach(function(s){var f=c.ik[s],fk=J['an'+s].getWorldPosition(new THREE.Vector3()),gy=c.homeL[s].y+.016*sc,down=fk.y<gy;
  if(down&&!f.p&&f.lk<.05){f.p=fk.clone();f.y=yaw}
  if(f.p&&(Math.hypot(fk.x-f.p.x,fk.z-f.p.z)>.11*sc||Math.abs(angTo(f.y,yaw,1)-f.y)>.6))down=false;
  f.lk+=((down&&f.p?1:0)-f.lk)*Math.min(1,dt*(down?16:10));if(f.lk<.03&&!down){f.p=null;f.lk=0}
  var k=f.lk*w;if(k<.01||!f.p)return;var q0=[J['hip'+s].quaternion.clone(),J['kn'+s].quaternion.clone(),J['an'+s].quaternion.clone()];
  var T=f.p.clone();T.y=fk.y;legIK(C,s,T,f.y,0);
  J['hip'+s].quaternion.copy(q0[0].slerp(J['hip'+s].quaternion,k));J['kn'+s].quaternion.copy(q0[1].slerp(J['kn'+s].quaternion,k));J['an'+s].quaternion.copy(q0[2].slerp(J['an'+s].quaternion,k));C.root.updateMatrixWorld(true)});
}
function locomote(c,dt,tI,baseId){var C=c.C,v=c.vel,sp=v.length(),r=c.box.rotation.y,fw=v.x*Math.sin(r)+v.z*Math.cos(r),sd=v.x*Math.cos(r)-v.z*Math.sin(r);
 /* cycle phase advances by distance travelled, so feet stay planted instead of skating */
 var dW=-strideOf(c,'walk'),dS=-strideOf(c,'shuffle'),dR=-strideOf(c,'run');
 var runT=fw>0?cl((sp-1.5)/1.1,0,1)*cl(fw/sp*1.4,0,1):0;c.runW=(c.runW||0)+(runT-(c.runW||0))*Math.min(1,dt*5);var run=c.runW;
 /* walk and run share one phase (both start on the left-foot contact) so blending between them never scrambles the legs */
 c.pW=(c.pW||0)+lerp(cl(fw/dW,-1.7,1.7),fw/2.2,run)*dt;c.pS=(c.pS||0)+cl(sd/dS,-2.2,2.2)*dt;
 var Bi=c.bake(baseId||'idle');evalB(C,Bi,tI);ground(C,1,0,0);c.box.updateMatrixWorld(true);
 var inv=new THREE.Matrix4().copy(c.box.matrixWorld).invert();c.homeL={};['L','R'].forEach(function(s){c.homeL[s]=C.J['an'+s].getWorldPosition(new THREE.Vector3()).applyMatrix4(inv)});
 var ikOn=baseId&&baseId!=='idle'?cl(sp/.25,0,1):1;
 var w=cl(sp/.35,0,1);if(w<.02){footIK(c,dt,ikOn);return}var qI=JN.map(function(n){return C.J[n].quaternion.clone()});
 var Bw=c.bake('walk'),Bs=c.bake('shuffle'),Br=c.bake('run');evalB(C,Bw,frac(c.pW)*Bw.dur);var qW=JN.map(function(n){return C.J[n].quaternion.clone()});
 var side=sp>.01?Math.abs(sd)/sp:0,sideW=cl((side-.35)/.45,0,1);
 if(sideW>.01){evalB(C,Bs,frac(c.pS)*Bs.dur);JN.forEach(function(n,i){qW[i].slerp(C.J[n].quaternion,sideW)})}
 if(run>.01){evalB(C,Br,frac(c.pW)*Br.dur);JN.forEach(function(n,i){qW[i].slerp(C.J[n].quaternion,run)})}
 JN.forEach(function(n,i){C.J[n].quaternion.copy(qI[i].slerp(qW[i],w))});C.root.position.set(0,0,0);ground(C,1,0,0);footIK(c,dt,ikOn*(1-run))}

/* ===== src/venue.js ===== */
/* ---------- venue: barangay covered court ---------- */
var SBOARD=null;
function drawBoard(a,b){if(!SBOARD)return;var g=SBOARD.c.getContext('2d'),w=300,h=140;g.fillStyle='#111';g.fillRect(0,0,w,h);[[10,a],[160,b]].forEach(function(d){g.fillStyle='#fff';g.fillRect(d[0],22,130,100);g.fillStyle='#111';g.font='92px Bangers, Impact';g.textAlign='center';g.fillText(String(d[1]),d[0]+65,108)});g.fillStyle='#fff';g.font='18px Bangers, Impact';g.textAlign='center';g.fillText('MPY',75,16);g.fillText('SRQ',225,16);SBOARD.t.needsUpdate=true}
var FLAGS=[],FANS=[],HOOPS=[];var venue=new THREE.Group();scene.add(venue);var roofParts=[];
(function(){var z,x;
 function V(geo,col,x,y,z,ol,par){var m=new THREE.Mesh(geo,typeof col==='string'?toon(col):col);m.position.set(x,y,z);if(ol!==false)m.add(new THREE.Mesh(geo,OL));(par||venue).add(m);return m}
 function F(w,d,x,z,y,col){var m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color:col}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);venue.add(m);return m}
 function ring(r,w,x,z,a0,al,col,y){var m=new THREE.Mesh(new THREE.RingGeometry(r-w/2,r+w/2,48,1,a0,al),new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(x,y||.0035,z);venue.add(m);return m}
 function tex(w,h,fn){var c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);var t=new THREE.CanvasTexture(c);t.anisotropy=4;return t}
 /* ground + concrete slab + painted basketball court */
 F(120,120,0,0,.0006,'#e9e6df');F(26,48,0,0,.0012,'#d8d3c9');F(15,28,0,0,.0018,'#ebe7df');
 var BL='#8c8880',lw=.06;
 F(lw,28,-7.5,0,.003,BL);F(lw,28,7.5,0,.003,BL);F(15,lw,0,-14,.003,BL);F(15,lw,0,14,.003,BL);F(15,lw,0,0,.0028,BL);
 ring(1.8,lw,0,0,0,Math.PI*2,BL);
 [-1,1].forEach(function(sd){var zb=sd*14,zf=sd*(14-5.8),key=F(4.9,5.8,0,sd*(14-2.9),.0024,'#d6d1c7');
  F(lw,5.8,-2.45,sd*(14-2.9),.003,BL);F(lw,5.8,2.45,sd*(14-2.9),.003,BL);F(4.9,lw,0,zf,.003,BL);
  ring(1.8,lw,0,zf,sd>0?0:Math.PI,Math.PI,BL);
  var bz=sd*(14-1.575),a=Math.asin(6.6/6.75);ring(6.75,lw,0,bz,sd>0?Math.PI+(Math.PI/2-a):Math.PI/2-a+0,2*a,BL);
  var cz=Math.cos(a)*6.75;F(lw,14-1.575-cz+0.02,-6.6,sd*(14-(14-1.575-cz)/2),.003,BL);F(lw,14-1.575-cz+.02,6.6,sd*(14-(14-1.575-cz)/2),.003,BL);
  /* hoop: stanchion, arm, board, ring, net (fades when it sits between the camera and the court) */
  var hg=new THREE.Group();venue.add(hg);HOOPS.push({g:hg,sd:sd});
  V(new THREE.BoxGeometry(.22,3.4,.22),'#2b2b2b',0,1.7,sd*15.4,true,hg);V(new THREE.BoxGeometry(.18,.18,1.3),'#2b2b2b',0,3.3,sd*14.8,true,hg);
  V(new THREE.BoxGeometry(.5,.12,.9),'#2b2b2b',0,.06,sd*15.6,true,hg);
  V(new THREE.BoxGeometry(1.8,1.05,.05),'#ffffff',0,3.45,sd*14.0,true,hg);
  var sq=new THREE.Mesh(new THREE.PlaneGeometry(.59,.45),new THREE.MeshBasicMaterial({color:'#111'}));sq.position.set(0,3.25,sd*(14.0-.03*sd));sq.rotation.y=sd>0?Math.PI:0;
  var sqi=new THREE.Mesh(new THREE.PlaneGeometry(.53,.39),new THREE.MeshBasicMaterial({color:'#fff'}));sqi.position.copy(sq.position);sqi.position.z-=sd*.002;sqi.rotation.y=sq.rotation.y;hg.add(sq);hg.add(sqi);
  var rim=V(new THREE.TorusGeometry(.23,.018,6,24),'#d62828',0,3.05,sd*(14-.3),true,hg);rim.rotation.x=Math.PI/2;
  var nt=new THREE.Mesh(new THREE.CylinderGeometry(.23,.15,.4,12,1,true),new THREE.MeshBasicMaterial({color:'#fff',wireframe:true}));nt.position.set(0,2.84,sd*(14-.3));hg.add(nt);
  hg.traverse(function(m){if(m.isMesh&&m.material!==OL){m.material=m.material.clone();m.material.transparent=true;m.userData.base=m.material.opacity}})});
 /* columns, eave beams, arched roof + trusses */
 var R=16,a=Math.asin(10/R),cy=8-R*Math.cos(a);
 var CZ=[-22.2,-19.25,-13.75,-8.25,-2.75,2.75,8.25,13.75,19.25,22.2];CZ.forEach(function(z){[-10,10].forEach(function(x){V(new THREE.BoxGeometry(.32,8,.32),'#3a3a3a',x,4,z)})});
 [-10,10].forEach(function(x){V(new THREE.BoxGeometry(.3,.4,44.4),'#3a3a3a',x,8,0)});
 var corr=tex(64,512,function(g,w,h){g.fillStyle='#d9d9d6';g.fillRect(0,0,w,h);for(var y=0;y<h;y+=16){g.fillStyle='#b9b9b4';g.fillRect(0,y,w,7)}});corr.wrapS=corr.wrapT=THREE.RepeatWrapping;corr.repeat.set(14,6);
 var roof=new THREE.Mesh(new THREE.CylinderGeometry(R,R,44.6,40,1,true,Math.PI-a,2*a),new THREE.MeshToonMaterial({map:corr,gradientMap:GRAD,side:THREE.DoubleSide}));roof.rotation.x=Math.PI/2;roof.position.set(0,cy,0);venue.add(roof);roofParts.push(roof);
 CZ.forEach(function(z){var tr=V(new THREE.TorusGeometry(R-.35,.1,5,40,2*a),'#3a3a3a',0,cy,z,false);tr.rotation.z=Math.PI/2-a;
  var tr2=V(new THREE.TorusGeometry(R-1.1,.06,4,40,2*a*.96),'#3a3a3a',0,cy,z,false);tr2.rotation.z=Math.PI/2-a*.96;
  var k;for(k=1;k<10;k++){var an=Math.PI/2-a+2*a*k/10,x1=Math.cos(an)*(R-.35),y1=Math.sin(an)*(R-.35)+cy,x2=Math.cos(an)*(R-1.1),y2=Math.sin(an)*(R-1.1)+cy;
   var w=V(new THREE.BoxGeometry(.05,Math.hypot(x2-x1,y2-y1),.05),'#3a3a3a',(x1+x2)/2,(y1+y2)/2,z,false);w.rotation.z=Math.atan2(y2-y1,x2-x1)-Math.PI/2+(k%2?.35:-.35)}});
 for(x=-8;x<=8.01;x+=4){var py=cy+Math.sqrt(R*R-x*x)-.35;V(new THREE.BoxGeometry(.12,.16,44.4),'#3a3a3a',x,py,0,false)}
 /* hanging lamps */
 for(z=-16.5;z<=16.6;z+=11)for(x=-5;x<=5;x+=10){var ly=cy+Math.sqrt(R*R-x*x)-1.3;V(new THREE.CylinderGeometry(.02,.02,1.6,4),'#222',x,ly+.4,z,false);
  var sh=V(new THREE.ConeGeometry(.45,.35,16,1,true),'#2b2b2b',x,ly-.4,z,false);sh.material.side=THREE.DoubleSide;var bl=new THREE.Mesh(new THREE.SphereGeometry(.14,10,8),new THREE.MeshBasicMaterial({color:'#fffbe8'}));bl.position.set(x,ly-.55,z);venue.add(bl)}
 /* banderitas (fiesta flags) */
 var FC=['#d62828','#ffffff','#e9c766','#1c1c1c','#3a6fd8'];
 [-5.5,0,5.5,11].forEach(function(z,zi){var pts=[];for(var i=0;i<=40;i++){var t=i/40,xx=-10+20*t,yy=7.6-Math.sin(t*Math.PI)*1.1;pts.push(new THREE.Vector3(xx,yy,z))}
  venue.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial(z<=0?{color:'#333',transparent:true,opacity:.2}:{color:'#333'})));
  for(i=1;i<40;i++){var p0=pts[i],tri=new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.17,0,0),new THREE.Vector3(.17,0,0),new THREE.Vector3(0,-.42,0)]),new THREE.MeshBasicMaterial({color:FC[(i+zi)%FC.length],side:THREE.DoubleSide}));
   tri.position.copy(p0);tri.rotation.y=(i%3-1)*.25;tri.userData.ph=i*.7+zi;venue.add(tri);FLAGS.push(tri)}});
 /* stage with tarpaulin at the far end */
 V(new THREE.BoxGeometry(13,1.1,4.2),'#cfc8bb',0,.55,20.2);V(new THREE.BoxGeometry(13.2,.12,4.4),'#9b9384',0,1.12,20.2,false);
 for(var st=0;st<3;st++)V(new THREE.BoxGeometry(2.4,.36,.35),'#cfc8bb',-4.5,.18+st*.36-.0,17.95+st*.0-.35*(2-st)*0,true).position.z=17.9-(2-st)*.35;
 V(new THREE.BoxGeometry(13,5.5,.3),'#efebe4',0,3.85,22.4);
 var tarp=new THREE.Mesh(new THREE.PlaneGeometry(10.5,3.3),new THREE.MeshBasicMaterial({map:tex(1050,330,function(g,w,h){g.fillStyle='#fff';g.fillRect(0,0,w,h);g.fillStyle='#d62828';g.fillRect(0,0,w,26);g.fillRect(0,h-26,w,26);
  g.fillStyle='#111';g.textAlign='center';g.font='46px Bangers, Impact, sans-serif';g.fillText('SANGGUNIANG BARANGAY NG SAN ROQUE',w/2,80);
  g.font='112px Bangers, Impact, sans-serif';g.fillText('PALO! LIGA 2026',w/2,200);g.font='40px Bangers, Impact, sans-serif';g.fillStyle='#d62828';g.fillText('INTER-BARANGAY VOLLEYBALL TOURNAMENT · COVERED COURT',w/2,262);
  g.fillStyle='#111';g.font='26px Inter, sans-serif';g.fillText('“Sama-sama sa laro, sama-sama sa barangay!”',w/2,298)})}));tarp.position.set(0,4.1,22.23);tarp.rotation.y=Math.PI;venue.add(tarp);
 /* side tarps on the columns */
 [['GOOD LUCK, MAPAYAPA!',-10,-8.25],['WELCOME TEAMS!',10,8.25],['NO SMOKING · BAWAL MANIGARILYO',10,-8.25]].forEach(function(t){var m=new THREE.Mesh(new THREE.PlaneGeometry(5,1.1),new THREE.MeshBasicMaterial({side:THREE.DoubleSide,map:tex(600,132,function(g,w,h){g.fillStyle='#fff';g.fillRect(0,0,w,h);g.strokeStyle='#d62828';g.lineWidth=10;g.strokeRect(5,5,w-10,h-10);g.fillStyle='#111';g.font='54px Bangers, Impact';g.textAlign='center';g.fillText(t[0],w/2,86)})}));
  m.position.set(t[1]+(t[1]<0?-.2:.2),6.6,t[2]);m.rotation.y=t[1]<0?Math.PI/2:-Math.PI/2;venue.add(m)});
 /* bleachers + seated crowd (east side) */
 for(var tier=0;tier<4;tier++)V(new THREE.BoxGeometry(2.2,.45*(tier+1),36),'#c9c2b5',10.9+tier*.95-.0,.225*(tier+1),0).position.x=11.0+tier*.95;
 var cb=new THREE.CylinderGeometry(.2,.24,.55,8),chd=new THREE.SphereGeometry(.15,8,6),CW=toon('#f4f4f4'),CB=toon('#1c1c1c'),CG=toon('#8a8a8a');
 for(tier=0;tier<4&&false;tier++)for(z=-16;z<=16;z+=.75){if(Math.random()<.42)continue;var gp=new THREE.Group();gp.position.set(11.0+tier*.95,.45*(tier+1),z+Math.random()*.2);
  var body=new THREE.Mesh(cb,[CW,CB,CG][Math.floor(Math.random()*3)]);body.position.y=.28;body.add(new THREE.Mesh(cb,OL));gp.add(body);var hh=new THREE.Mesh(chd,toon('#f6f3ee'));hh.position.y=.68;hh.add(new THREE.Mesh(chd,OL));gp.add(hh);
  var hr=new THREE.Mesh(new THREE.SphereGeometry(.155,8,6,0,6.283,0,1.6),toon('#151515'));hr.position.y=.7;gp.add(hr);gp.userData.ph=Math.random()*6;venue.add(gp);FANS.push(gp)}
 /* team benches: monobloc chairs (west side) + flip scoreboard */
 function chair(x,z){var g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=Math.PI/2;var c=toon('#f2f2f0');
  [[.42,.05,.42,0,.45,0],[.42,.45,.05,0,.7,-.2]].forEach(function(b){var m=new THREE.Mesh(new THREE.BoxGeometry(b[0],b[1],b[2]),c);m.position.set(b[3],b[4],b[5]);m.add(new THREE.Mesh(m.geometry,OL));g.add(m)});
  [[-.18,-.18],[.18,-.18],[-.18,.18],[.18,.18]].forEach(function(l){var m=new THREE.Mesh(new THREE.CylinderGeometry(.025,.03,.45,5),c);m.position.set(l[0],.22,l[1]);g.add(m)});venue.add(g)}
 for(z=-12;z<=-3;z+=.8)chair(-9.0,z);for(z=3;z<=12;z+=.8)chair(-9.0,z);
 V(new THREE.BoxGeometry(.8,.75,1.8),'#8a6a4a',-8.6,.375,0);
 var sbC=document.createElement('canvas');sbC.width=300;sbC.height=140;SBOARD={c:sbC,t:new THREE.CanvasTexture(sbC)};drawBoard(0,0);var sb=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.7),new THREE.MeshBasicMaterial({side:THREE.DoubleSide,map:SBOARD.t}));
 sb.position.set(-8.55,1.15,0);sb.rotation.y=Math.PI/2;venue.add(sb);
 /* outside: houses and coconut trees */
 [[-19,-14],[-21,-2],[-19,10],[-22,20],[19,-18],[21,-6],[19,6],[22,17],[-6,-30],[7,-31],[-4,30],[9,29]].forEach(function(h,i){var w=4+i%3,hh=3+i%2,col=['#f1eee8','#e6e1d8','#ddd6ca'][i%3];
  V(new THREE.BoxGeometry(w,hh,4),col,h[0],hh/2,h[1]);var rf=V(new THREE.ConeGeometry(Math.max(w,4)*.75,1.6,4),i%2?'#5a5a5a':'#9c3b30',h[0],hh+.8,h[1]);rf.rotation.y=Math.PI/4;rf.scale.set(1,1,.8)});
 [[-16,-22],[16,24],[-17,15],[17,-12],[-13,27]].forEach(function(t){V(new THREE.CylinderGeometry(.14,.22,7,6),'#7a6a55',t[0],3.5,t[1]);
  for(var k=0;k<7;k++){var lf=V(new THREE.ConeGeometry(.35,2.6,4),'#2f3a2a',t[0],7,t[1]);lf.rotation.set(1.15,k/7*Math.PI*2,0);lf.translateY(1.2)}});
})();

/* ---------- merge the static venue into a handful of draw calls (performance) ---------- */
var VTOON=new THREE.MeshToonMaterial({gradientMap:GRAD,vertexColors:true}),VBASIC=new THREE.MeshBasicMaterial({vertexColors:true}),VBASIC2=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide});
function flatGeo(g){g=g.index?g.toNonIndexed():g.clone();if(!g.attributes.normal)g.computeVertexNormals();return g}
function mergeFlat(list){var n=0;list.forEach(function(e){n+=e.g.attributes.position.count});var P=new Float32Array(n*3),N=new Float32Array(n*3),C=new Float32Array(n*3),v=0;
 list.forEach(function(e){var p=e.g.attributes.position,q=e.g.attributes.normal;for(var i=0;i<p.count;i++){P[v*3]=p.getX(i);P[v*3+1]=p.getY(i);P[v*3+2]=p.getZ(i);N[v*3]=q.getX(i);N[v*3+1]=q.getY(i);N[v*3+2]=q.getZ(i);C[v*3]=e.c.r;C[v*3+1]=e.c.g;C[v*3+2]=e.c.b;v++}});
 var G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(P,3));G.setAttribute('normal',new THREE.BufferAttribute(N,3));G.setAttribute('color',new THREE.BufferAttribute(C,3));return G}
function mergeGroup(root,skip){root.updateMatrixWorld(true);var inv=new THREE.Matrix4().copy(root.matrixWorld).invert(),T=[],O=[],Bs=[],B2=[],kill=[];
 root.traverse(function(m){if(!m.isMesh||m.material===OL||skip(m))return;var mt=m.material;if(mt.map||mt.transparent||mt.wireframe)return;
  var g=flatGeo(m.geometry);g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,m.matrixWorld));var e={g:g,c:mt.color};
  if(mt.isMeshToonMaterial){(mt.side===THREE.DoubleSide?B2:T).push(e);if(m.children.some(function(k){return k.material===OL}))O.push(e)}else if(mt.isMeshBasicMaterial)(mt.side===THREE.DoubleSide?B2:Bs).push(e);else return;kill.push(m)});
 kill.forEach(function(m){m.parent.remove(m)});
 var out=[];if(T.length)out.push(new THREE.Mesh(mergeFlat(T),VTOON));if(O.length){var om=new THREE.Mesh(mergeFlat(O),OL);om.userData.outline=1;out.push(om)}if(Bs.length)out.push(new THREE.Mesh(mergeFlat(Bs),VBASIC));if(B2.length)out.push(new THREE.Mesh(mergeFlat(B2),VBASIC2));
 out.forEach(function(m){root.add(m)});return out}
var FLAGMS=[],FLAGM=null;
(function(){var inHoop=function(m){var o=m;while(o){if(HOOPS.some(function(h){return h.g===o}))return true;o=o.parent}return false};
 /* flags -> one mesh per group, waved on the CPU. The two lines over the near half fade out so they never block the view. */
 venue.updateMatrixWorld(true);
 [[function(f){return f.position.z<=0},new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,transparent:true,opacity:.22,depthWrite:false})],[function(f){return f.position.z>0},VBASIC2]].forEach(function(gp){
  var list=FLAGS.filter(gp[0]);if(!list.length)return;var fl=list.map(function(f){venue.remove(f);return {g:flatGeo(f.geometry),c:f.material.color}});
  var m=new THREE.Mesh(mergeFlat(fl),gp[1]);venue.add(m);m.userData.src=list.map(function(f){return {p:f.position.clone(),ry:f.rotation.y,ph:f.userData.ph}});m.userData.loc=fl.map(function(e){return e.g.attributes.position.array.slice()});FLAGMS.push(m)});
 FLAGM=FLAGMS[0];
 mergeGroup(venue,function(m){return inHoop(m)||FLAGMS.indexOf(m)>=0});
 mergeGroup(courtLines,function(){return false});
})();
var FQ=new THREE.Quaternion(),FE=new THREE.Euler(),FV=new THREE.Vector3();
function waveFlags(now){FLAGMS.forEach(function(M0){var P=M0.geometry.attributes.position,src=M0.userData.src,loc=M0.userData.loc,v=0;
 for(var i=0;i<src.length;i++){var s=src[i];FE.set(Math.sin(now/600+s.ph)*.25,s.ry,0,'YXZ');FQ.setFromEuler(FE);var L=loc[i];for(var k=0;k<L.length;k+=3){FV.set(L[k],L[k+1],L[k+2]).applyQuaternion(FQ).add(s.p);P.setXYZ(v++,FV.x,FV.y,FV.z)}}P.needsUpdate=true})}

/* ===== src/play.js ===== */
/* ======================================================================
   GAME: 6v6 rules, rotation, touches, AI, scoring
   Team 0 = Brgy. Mapayapa (you, near side, z<0, facing +z)
   Team 1 = Brgy. San Roque (CPU, far side, z>0, facing -z)
   ====================================================================== */
var GRAV=9.8,NET_H=2.43,GRACE=.1,CX=4.5,CZ=9,STEP=1/120,DECK=.7;

/* ---------- settings ---------- */
var SET={ctl:'swipe',cam:'std',diff:1,sound:1,vib:1,gfx:'auto',res:1,fps:60,outl:1,venue:1,detail:2,fx:1};
try{var sv0=JSON.parse(localStorage.getItem('palo.settings.v2')||'null');if(sv0)for(var k0 in SET)if(k0 in sv0)SET[k0]=sv0[k0]}catch(e){}
function saveSet(){try{localStorage.setItem('palo.settings.v2',JSON.stringify(SET))}catch(e){}}
var DIFF=[
 {q:[.22,.43],recv:[.62,.88,.97],dig:[.32,.66,.86],tip:.68,block:[.04,.16],st:-1.5},
 {q:[.38,.42],recv:[.74,.93,.98],dig:[.46,.76,.92],tip:.78,block:[.09,.24],st:0},
 {q:[.55,.37],recv:[.85,.96,.99],dig:[.6,.85,.95],tip:.86,block:[.15,.3],st:1.2}];
function DF(T){return M.mode==='play'&&T===1?DIFF[SET.diff]:DIFF[1]}
var QI={perfect:0,good:1,bad:2,weak:2};
var FORMATS={short:{to:15,cap:17,sw:8,tos:1,name:'Short game · to 15'},long:{to:25,cap:30,sw:13,tos:2,name:'Long game · to 25'}};
var MODES={quick:{sets:['short'],name:'Quick match'},exhib:{sets:['long'],name:'Exhibition'},liga:{sets:['long','long','short'],name:'Liga · best of 3'}};

/* ---------- stats ---------- */
var STATS=[['serve','Serve'],['spike','Spike'],['jump','Jump'],['pass','Pass'],['dig','Dig'],['block','Block'],['set','Set'],['speed','Speed'],['read','Reading'],['stamina','Stamina'],['clutch','Clutch']];
var BASE_STATS={
 jun:{serve:5,spike:3,jump:4.5,pass:4,dig:4,block:3.5,set:7,speed:6,read:6,stamina:6,clutch:6},
 tala:{serve:4,spike:6,jump:6,pass:5,dig:4,block:4,set:3,speed:6,read:5,stamina:6,clutch:5},
 bogs:{serve:3.5,spike:5.5,jump:6.5,pass:2.5,dig:2.5,block:6.5,set:2,speed:4,read:4.5,stamina:5,clutch:4},
 migs:{serve:5.5,spike:6,jump:5.5,pass:3.5,dig:3.5,block:5,set:2.5,speed:5,read:5,stamina:5.5,clutch:5},
 rina:{serve:4.5,spike:5,jump:5,pass:5.5,dig:5,block:3.5,set:3,speed:6,read:5.5,stamina:6,clutch:5},
 paolo:{serve:3.5,spike:5,jump:6,pass:2.5,dig:2.5,block:6,set:2,speed:4.5,read:4.5,stamina:5,clutch:4},
 ising:{serve:5,spike:1.5,jump:3,pass:7,dig:7.5,block:1,set:4,speed:7,read:6.5,stamina:7,clutch:5}};
var CAPS={ising:{spike:3,block:2,jump:6},jun:{spike:7,block:7},bogs:{pass:6,dig:6,speed:7},paolo:{pass:6,dig:6,speed:7}};
var UNLOCK={serve:[[1,'Underhand'],[2,'Sky ball'],[3,'Float'],[4,'Jump float'],[5.5,'Topspin'],[7,'Jump power']],spike:[[1,'Tip'],[2,'Roll shot'],[3,'Bow-and-arrow'],[5,'Snap quick'],[6,'Circle swing'],[7,'Full reach'],[8,'Back-row']],
 set:[[1,'Front set'],[3,'Back set'],[5,'Quick set'],[6.5,'Jump set'],[7.5,'Setter dump']],dig:[[1,'Platform'],[4,'Sprawl'],[6,'Pancake dive']],block:[[1,'Touch'],[4,'Soft block'],[7,'Stuff block']]};
var SP_START=6;
BODIES.forEach(function(b){if(!b.stats)b.stats=Object.assign({},BASE_STATS[b.id]);if(b.sp==null)b.sp=SP_START});
var RSTATS={S:{serve:5,spike:3.5,jump:5,pass:4.5,dig:4.5,block:4,set:7,speed:6,read:6,stamina:6,clutch:6},OH:{serve:5,spike:6,jump:6,pass:5.5,dig:5,block:4.5,set:3,speed:6,read:5.5,stamina:6,clutch:5},
 MB:{serve:4,spike:5.5,jump:6.5,pass:3,dig:3,block:6.5,set:2,speed:4.5,read:5,stamina:5,clutch:5},OPP:{serve:5.5,spike:6,jump:6,pass:4,dig:4,block:5,set:2.5,speed:5,read:5,stamina:5.5,clutch:5},L:{serve:4,spike:1.5,jump:3,pass:7,dig:7.5,block:1,set:4.5,speed:7,read:6.5,stamina:7,clutch:5}};
function st(p,k){var v=p.team===0?(p.b.stats||BASE_STATS[p.b.id]||RSTATS[p.pos])[k]:RSTATS[p.pos][k]+(M.mode==='play'?DIFF[SET.diff].st:0);
 if(k!=='clutch'&&M.mode==='play'){var tired=Math.max(0,M.rallies-30)*.02*(1-(st0(p,'stamina')-1)/9);v-=tired}return cl(v,1,10)}
function st0(p,k){return p.team===0?(p.b.stats||BASE_STATS[p.b.id])[k]:RSTATS[p.pos][k]}

/* ---------- sound ---------- */
var AC=null,UIC=0;/* game sounds only during a match (the home-screen demo is silent); UI clicks always */
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();loadSamples();return AC}
/* recorded sound effects (sfx/*.ogg, Opus); the synth sounds below are the fallback until they load */
var SMP={},SMPLIST=['serve1','serve2','spike','spike_power','net','bounce','squeak','ambience','ui_select','ui_switch','ui_switch2','ui_tick','ui_error','ui_drop','ui_drop2','ui_dialog'],SQT=0;
function loadSamples(){if(!AC||loadSamples.done)return;loadSamples.done=1;SMPLIST.forEach(function(n){try{fetch('sfx/'+n+'.ogg').then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()}).then(function(b){return new Promise(function(res,rej){AC.decodeAudioData(b,res,rej)})}).then(function(buf){SMP[n]=buf}).catch(function(){})}catch(e){}})}
function play(n,vol,off,rate){if(!SET.sound||!AC||!SMP[n]||!LIVE())return false;var s=AC.createBufferSource(),g=AC.createGain();s.buffer=SMP[n];if(rate)s.playbackRate.value=rate;g.gain.value=vol==null?1:vol;s.connect(g);g.connect(AC.destination);s.start(AC.currentTime,off||0);return true}
/* menu + feedback sounds play everywhere (menus too), not only during a match */
function uiPlay(n,vol,rate){if(!SET.sound||!AC||!SMP[n])return false;var s=AC.createBufferSource(),g=AC.createGain();s.buffer=SMP[n];if(rate)s.playbackRate.value=rate;g.gain.value=vol==null?1:vol;s.connect(g);g.connect(AC.destination);s.start();return true}
var AMB=null;function ambUpdate(){var want=SET.sound&&AC&&SMP.ambience&&LIVE()&&!M.paused&&UI.screen==='game';
 if(want&&!AMB){var s=AC.createBufferSource(),g=AC.createGain();s.buffer=SMP.ambience;s.loop=true;g.gain.setValueAtTime(0,AC.currentTime);g.gain.linearRampToValueAtTime(.32,AC.currentTime+1.2);s.connect(g);g.connect(AC.destination);s.start();AMB={s:s,g:g}}
 else if(!want&&AMB){var a=AMB;AMB=null;try{a.g.gain.cancelScheduledValues(AC.currentTime);a.g.gain.setValueAtTime(a.g.gain.value,AC.currentTime);a.g.gain.linearRampToValueAtTime(0,AC.currentTime+.4);a.s.stop(AC.currentTime+.45)}catch(e){}}}
function tone(f,dur,type,vol,f2,delay){if(!SET.sound||!AC||(!LIVE()&&!UIC))return;var a=ac();if(!a)return;var t=a.currentTime+(delay||0),os=a.createOscillator(),g=a.createGain();os.type=type||'sine';os.frequency.setValueAtTime(f,t);if(f2)os.frequency.exponentialRampToValueAtTime(f2,t+dur);g.gain.setValueAtTime(vol||.2,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);os.connect(g);g.connect(a.destination);os.start(t);os.stop(t+dur+.02)}
var NB=null;
function noise(dur,freq,vol,type,attack){if(!SET.sound||!AC||(!LIVE()&&!UIC))return;var a=ac();if(!a)return;if(!NB){NB=a.createBuffer(1,a.sampleRate*2,a.sampleRate);var d=NB.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1}
 var t=a.currentTime,s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=NB;f.type=type||'bandpass';f.frequency.value=freq;f.Q.value=.8;
 g.gain.setValueAtTime(attack?.001:vol,t);if(attack)g.gain.linearRampToValueAtTime(vol,t+attack);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(a.destination);s.start(t);s.stop(t+dur+.05)}
var SFX={
 hit:function(){noise(.07,1600,.5);tone(190,.08,'triangle',.25,90)},
 set:function(){noise(.05,2400,.35);tone(320,.06,'sine',.15,220)},
 spike:function(sup,perf){if(sup||perf?play('spike_power',1,.4):play('spike',1))return;noise(.16,800,.9,'lowpass');tone(130,.22,'sine',.5,45);if(sup)noise(.4,300,.6,'lowpass')},
 serve:function(){if(play(chance(.5)?'serve1':'serve2',.95))return;SFX.hit()},
 squeak:function(){if(!AC||M.now-SQT<.6)return;SQT=M.now;play('squeak',.45,chance(.5)?0:.55,rnd(.92,1.08))},
 whistle:function(){if(!SET.sound||!AC||(!LIVE()&&!UIC))return;var a=ac();if(!a)return;var t=a.currentTime,os=a.createOscillator(),l=a.createOscillator(),lg=a.createGain(),g=a.createGain();os.type='square';os.frequency.value=2300;l.frequency.value=32;lg.gain.value=120;l.connect(lg);lg.connect(os.frequency);g.gain.setValueAtTime(.06,t);g.gain.setValueAtTime(.06,t+.3);g.gain.exponentialRampToValueAtTime(.001,t+.4);os.connect(g);g.connect(a.destination);os.start(t);l.start(t);os.stop(t+.42);l.stop(t+.42)},
 perfect:function(){if(uiPlay('ui_drop2',.75))return;tone(880,.08,'sine',.18);tone(1320,.14,'sine',.18,0,.07)},
 cheer:function(){noise(1.4,1100,.22,'bandpass',.25)},
 groan:function(){tone(260,.55,'sawtooth',.05,150)},
 net:function(){if(play('net',.9))return;noise(.2,500,.4)},
 thud:function(){if(play('bounce',.8))return;noise(.08,300,.5,'lowpass')},
 click:function(){ac();if(uiPlay('ui_select',.55))return;UIC=1;tone(700,.04,'square',.06);UIC=0},
 tab:function(){ac();if(!uiPlay('ui_switch',.5))SFX.click()},
 next:function(){ac();if(!uiPlay('ui_switch2',.6))SFX.click()},
 tick:function(){uiPlay('ui_tick',.8)},
 err:function(){uiPlay('ui_error',.55)},
 pop:function(q){uiPlay(q==='perfect'?'ui_drop2':'ui_drop',.7)},
 dialog:function(){uiPlay('ui_dialog',.55)}};
function vib(ms){if(!SET.vib||!ms)return;try{if(window.AndroidApp&&AndroidApp.vibrate){AndroidApp.vibrate(Array.isArray(ms)?ms.reduce(function(a,b){return a+b},0):ms)}else if(navigator.vibrate)navigator.vibrate(ms)}catch(e){}}

/* ---------- geometry of the court ---------- */
function side(T){return T===0?-1:1}         /* which half (z sign) */
function lx(T){return T===0?1:-1}           /* the team's LEFT, as world x sign */
function fwdYaw(T){return T===0?0:Math.PI}  /* facing the net */

/* ---------- state ---------- */
var B={p:{x:0,y:1,z:-9},v:{x:0,y:0,z:0},live:false,dead:false,held:null,heldClip:null,last:0,lastType:'serve',netHit:false,threat:null,spin:0,touches:0,side:0};
var M={mode:'demo',state:'idle',now:0,score:[0,0],sets:[0,0],setNo:0,fmt:'short',modeKey:'quick',serving:0,pend:[],stamps:[],fx:null,msg:null,hype:0,stats:null,rally:0,rallies:0,paused:false,nextT:0,blockEval:null,server:null,tos:[0,0],swDone:false,streak:[0,0]};
var PL=[],TEAM=[[],[]],ROT=[[],[]],ONC=[[],[]];

/* ---------- players ---------- */
function mkPlayer(spec,T){RIGQ=rigQ(T);var C=buildChar(spec),box=new THREE.Group();scene.add(box);box.add(C.root);applyKit(C);
 var p={team:T,b:spec,pos:spec.pos,C:C,box:box,vel:new THREE.Vector3(),bk:{},cl:{},phase:Math.random()*5,act:null,tgt:null,on:true,zone:0,key:spec.name};
 p.bake=function(id){if(!p.bk[id]){var c=clipById(id);p.bk[id]=bake(p.C,c)}return p.bk[id]};
 box.rotation.y=fwdYaw(T);return p}
function rigQ(T){var q=SET.gfx==='low'||SET.venue===0&&SET.fps<=30?.45:SET.gfx==='high'?.7:.6;return T===1?q*.8:q}
function rebuildPlayer(p,spec){RIGQ=rigQ(p.team);var keep={x:p.box.position.x,z:p.box.position.z,r:p.box.rotation.y};destroyChar(p.C);p.b=spec;p.C=buildChar(spec);p.box.add(p.C.root);applyKit(p.C);p.bk={};p.cl={};p.strd=null;p.fade=null;p.lastId=undefined;p.ik=null;
 p.box.position.set(keep.x,0,keep.z);p.box.rotation.y=keep.r}
function destroyChar(C){if(C.root.parent)C.root.parent.remove(C.root);scene.remove(C.shadow);if(C.pony)scene.remove(C.pony.meshes);var i=ALL.indexOf(C);if(i>=0)ALL.splice(i,1)}
function setupTeams(){BODIES.forEach(function(b){var p=mkPlayer(b,0);TEAM[0].push(p);PL.push(p)});RIVALS.forEach(function(b){var p=mkPlayer(b,1);TEAM[1].push(p);PL.push(p)})}
/* rotation order in zones 1..6: S, OH1, MB1, OPP, OH2, MB2 (setter opposite the opposite, OHs and MBs opposite each other) */
function initRot(T){var t=TEAM[T],by=function(pos,n){return t.filter(function(p){return p.pos===pos})[n||0]};ROT[T]=[by('S'),by('OH'),by('MB'),by('OPP'),by('OH',1),by('MB',1)]}
function rotate(T){var r=ROT[T];ROT[T]=[r[1],r[2],r[3],r[4],r[5],r[0]]}
function libero(T){return TEAM[T].filter(function(p){return p.pos==='L'})[0]}
/* who is on court: the libero replaces whichever middle is in the back row (not while that middle serves) */
function lineup(T){var on=[],lib=libero(T),used=false;PL.forEach(function(p){if(p.team===T){p.on=false;p.zone=0}});
 for(var z=1;z<=6;z++){var p=ROT[T][z-1];if(p.pos==='MB'&&!used&&(z===5||z===6||(z===1&&M.serving!==T))){lib.on=true;lib.zone=z;on[z]=lib;used=true;p.on=false;p.zone=0}else{p.on=true;p.zone=z;on[z]=p}}
 ONC[T]=on}
function front(p){return p.zone===2||p.zone===3||p.zone===4}
function onCourt(T){return TEAM[T].filter(function(p){return p.on})}
function setterOf(T){return TEAM[T].filter(function(p){return p.pos==='S'})[0]}

/* ---------- ball maths ---------- */
function trajTo(p0,p1,T){return {x:(p1.x-p0.x)/T,y:(p1.y-p0.y+.5*GRAV*T*T)/T,z:(p1.z-p0.z)/T}}
function posAt(p,v,t){return {x:p.x+v.x*t,y:p.y+v.y*t-.5*GRAV*t*t,z:p.z+v.z*t}}
function timeToY(p,v,h){var a=-.5*GRAV,b=v.y,c=p.y-h,d=b*b-4*a*c;if(d<0)return null;var t=(-b-Math.sqrt(d))/(2*a);return t>0?t:null}
function netY(p,v){if(!v.z||(p.z<0)===(p.z+v.z*9<0))return null;var t=-p.z/v.z;return t>0?posAt(p,v,t).y:null}
function d3(a,b){return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)}
function aim(from,to,speed,clear){var T=Math.max(.25,d3(from,to)/speed),v=trajTo(from,to,T),n=0;
 if(clear)while(n++<80){var y=netY(from,v);if(y===null||y>NET_H+BR+.2)break;T+=.04;v=trajTo(from,to,T)}return v}
function inCourt(p){return Math.abs(p.x)<=CX+.1&&Math.abs(p.z)<=CZ+.1}
function V3(p){return new THREE.Vector3(p.x,p.y,p.z)}

/* ---------- animation planning ----------
   Every touch is a keyframed clip whose contact frame lands exactly on the ball:
   the clip starts at (contact time - clip contact time) and the player is anchored so the hand meets the ball. */
var CONTACT={serve:[.85,'R',.05],topspin:[.95,'R',.05],jumpserve:[1.46,'R',.06],jumpfloat:[.86,'R',.05],underhand:[.78,'R',-.02],skyball:[.82,'R',-.01],
 dig:[.58,'LR',.03],dig_low:[.58,'LR',.03],dig_high:[.58,'LR',.03],dive:[.62,'R',.04],set:[.44,'LR',.13],set_low:[.42,'LR',.1],set_high:[.44,'LR',.13],
 jset:[.86,'LR',.04],rset:[.46,'LR',.04],bset:[.8,'LR',.04],block:[.8,'LR',.08],block_low:[.8,'LR',.1],block_high:[.8,'LR',.08],
 spike:[1.26,'R',.06],reach:[1.3,'R',.06],circle:[1.26,'R',.06],snap:[1.06,'R',.06],backrow:[1.28,'R',.06],roll:[1.3,'R',.06],spike_low:[1.16,'R',.05]};
function contactLocal(p,id){if(p.cl[id])return p.cl[id];var c=CONTACT[id],B=p.bake(id),C=p.C;var sv=C.root.position.clone(),sr=C.root.rotation.y;
 var qs=JN.map(function(n){return C.J[n].quaternion.clone()}),py=C.J.pelvis.position.y;
 evalB(C,B,c[0]);C.root.updateMatrixWorld(true);var w=new THREE.Vector3(),hs=c[1]==='LR'?['L','R']:[c[1]];
 /* hand position relative to the root's parent (box), as if the box were at the origin facing +z */
 var inv=new THREE.Matrix4().copy(p.box.matrixWorld).invert();hs.forEach(function(s){C.hand[s].getWorldPosition(tmpV);w.add(tmpV.applyMatrix4(inv))});w.multiplyScalar(1/hs.length);w.y+=c[2]*C.H;
 JN.forEach(function(n,i){C.J[n].quaternion.copy(qs[i])});C.J.pelvis.position.y=py;C.root.position.copy(sv);C.root.rotation.y=sr;C.root.updateMatrixWorld(true);
 return p.cl[id]=w}
function planAct(p,id,C,cp,yaw,mir){mir=mir||1;var c=CONTACT[id],tc=c?c[0]:0,L=c?contactLocal(p,id).clone():new THREE.Vector3(),cs=Math.cos(yaw),sn=Math.sin(yaw);L.x*=mir;
 var ax=cp.x-(L.x*cs+L.z*sn),az=cp.z-(-L.x*sn+L.z*cs);
 p.act={id:id,t0:C-tc,tc:tc,B:p.bake(id),anchor:{x:ax,z:az,yaw:yaw},from:null,C:C,mir:mir};return p.act}
function playAct(p,id,yaw,t0){var B=p.bake(id);p.act={id:id,t0:t0==null?M.now:t0,tc:0,B:B,anchor:{x:p.box.position.x,z:p.box.position.z,yaw:yaw==null?p.box.rotation.y:yaw},from:null,free:1};return p.act}
function handY(p,id){return contactLocal(p,id).y}

/* clip choice by rating */
function serveClip(p){var s=st(p,'serve');return s>=7?'jumpserve':s>=5.5?'topspin':s>=4?'jumpfloat':s>=3?'serve':s>=2?'skyball':'underhand'}
function spikeClip(p,kind){var s=st(p,'spike');if(s<3)return 'spike_low';if(kind==='quick')return s>=5?'snap':'spike';if(kind==='back')return 'backrow';if(kind==='tip')return 'roll';if(s>=6){var r=Math.random();return r<.3?'circle':(r<.6&&s>=7?'reach':'spike')}return 'spike'}
function digClip(p,strong,far){var s=st(p,'dig');if(far&&s>=6)return 'dive';if(strong&&s<4)return 'dig_low';return 'dig'}

/* ---------- pending touches (the timing circle) ---------- */
function addPend(p){p.done=false;p.pressT=null;M.pend.push(p);return p}
function isHuman(T){return M.mode==='play'&&T===0}
function activePend(){var best=null;M.pend.forEach(function(p){if(!p.done&&p.pressT===null&&isHuman(p.team)&&M.now>=p.S&&(!best||p.C<best.C))best=p});return best}
function nextHumanPend(){var best=null;M.pend.forEach(function(p){if(!p.done&&p.pressT===null&&isHuman(p.team)&&(!best||p.C<best.C))best=p});return best}
function cancelTeam(T){M.pend.forEach(function(p){if(p.team===T&&!p.done&&p.type!=='serve')p.done=true})}
/* timing window by rating: higher rating = wider green */
function windowOf(p,type){var k={serve:'serve',bump:'pass',dig:'dig',set:'set',spike:'spike',block:'block'}[type]||'pass',s=st(p.actor,k);
 var good=.55-(s-5)*.025,perf=.8-(s-5)*.022;if(setPoint())perf+=(6-st(p.actor,'clutch'))*.012;return {good:cl(good,.35,.68),perf:cl(perf,.62,.9),red:.28}}
function setPoint(){var f=FORMATS[M.fmt],s=M.score;return [0,1].some(function(t){return s[t]>=f.to-1&&s[t]>s[1-t]})}
function cpuQ(T,pl,k){var d=DF(T),r=Math.random(),bonus=pl?(st(pl,k)-5)*.03:0;return r<d.q[0]+bonus?'perfect':r<d.q[0]+d.q[1]+bonus*.5?'good':'bad'}

/* ---------- stamps / fx ---------- */
function stamp(txt,w,opt){opt=opt||{};M.stamps.push({txt:txt,w:w,t0:M.now,dur:opt.dur||.8,size:opt.size||26,col:opt.col||'#111',fill:opt.fill||'#fff',rot:opt.rot===undefined?rnd(-.12,.06):opt.rot})}
function headW(p){var v=new THREE.Vector3();p.C.J.head.getWorldPosition(v);v.y+=.45;return v}
function qStamp(q,pl){var y=headW(pl);if(pl.team===0&&(M.mode==='drill'||isHuman(0))){if(q==='good')SFX.pop('good');else if(q==='bad'||q==='miss')SFX.err()}if(q==='perfect')stamp('PERFECT!',y,{size:28});else if(q==='good')stamp('GOOD',y,{size:22});else if(q==='bad')stamp('EARLY!',y,{fill:'#d62828',size:22});else if(q==='miss')stamp('MISS!',y,{fill:'#d62828',size:26})}
function gainHype(q,T){if(isHuman(T)&&q==='perfect'){M.hype=Math.min(100,M.hype+20);M.stats.perfect++;SFX.perfect();if(M.hype>=100)stamp('SUPER READY!',{x:0,y:3,z:-3},{fill:'#d62828',size:30,dur:1.1})}}
function whistleCall(txt){stamp(txt,{x:0,y:3.4,z:0},{fill:'#d62828',size:34,dur:1.2,rot:-.06});SFX.whistle()}

/* ---------- touches ---------- */
function resolve(p,q){p.done=true;var a=p.actor;if(q!=='miss')B.lastP=a;
 if(isHuman(p.team)&&q!=='weak'&&p.type!=='block'){qStamp(q,a);gainHype(q,p.team)}
 ({serve:doServe,bump:doBump,set:doSet,spike:doSpike})[p.type](p,q)}
function faultRoll(p){if(p.k==null||p.k>=p.w.red)return false;var s=st(p.actor,{serve:'serve',set:'set',spike:'spike',bump:'pass'}[p.type]||'pass');return chance((p.w.red-p.k)/p.w.red*cl(.55-s*.045,.06,.5))}

function handWorld(p,which){var v=new THREE.Vector3(),hs=which==='LR'?['L','R']:[which||'R'];p.C.root.updateMatrixWorld(true);var s=new THREE.Vector3();hs.forEach(function(h){p.C.hand[h].getWorldPosition(v);s.add(v)});return s.multiplyScalar(1/hs.length)}

function doServe(p,q){var T=p.team,od=-side(T),a=p.actor,human=isHuman(T),kind=p.clip;
 var hp=handWorld(a,'R');B.p={x:hp.x,y:hp.y+.06,z:hp.z};B.held=null;B.heldClip=null;B.live=true;
 var sa=M.serveAim||{x:0,z:6.5},spr={perfect:.3,good:.7,bad:1.2,weak:1.4}[q==='miss'?'weak':q]||.8;
 var to=human?{x:cl(sa.x+rnd(-spr,spr),-4.4,4.4),y:0,z:od*cl(sa.z+rnd(-spr,spr),1.2,8.8)}:{x:cl(rnd(-3.5,3.5)+rnd(-.5,.5),-4,4),y:0,z:od*rnd(5.5,8.2)};
 if(q==='miss')q='weak';
 var SP={jumpserve:[20,17,14],topspin:[17,15,12.5],jumpfloat:[15,13,11.5],serve:[14,12.5,11],underhand:[10,9.5,9],skyball:[9,9,9]}[kind]||[14,12,11],speed=q==='weak'?9:SP[QI[q]],fault=null;
 if(faultRoll(p)||q==='bad'&&chance(human?.18:.1))fault=chance(.5)?'net':'out';
 if(kind==='jumpserve'&&p.k!=null&&p.k<.12&&chance(.4))fault='foot';
 if(fault==='foot'){B.live=false;stamp('FOOT FAULT!',{x:a.box.position.x,y:1.6,z:a.box.position.z},{fill:'#d62828',size:26});whistleCall('FOOT FAULT');M.state='rally';point(1-T,'FOOT FAULT');return}
 if(fault==='out'){to.z=od*rnd(9.8,11.5);if(chance(.4))to.x=(to.x<0?-1:1)*rnd(4.9,6)}
 if(kind==='skyball')B.v=trajTo(B.p,to,2.9);else if(kind==='underhand')B.v=aim(B.p,to,9.5,true);
 else B.v=fault==='net'?aim(B.p,{x:to.x*.4,y:rnd(1.4,2.1),z:0},speed,false):aim(B.p,to,speed,true);
 B.float=/float|serve$/.test(kind)?{a:rnd(.4,.9),ph:rnd(0,6)}:null;
 B.last=T;B.lastType='serve';B.threat={kind:'serve',q:q,power:kind==='jumpserve'};M.serveT=M.now;B.touches=0;B.side=T;SFX.serve();vib(human?20:0);
 if(q==='perfect'&&kind==='jumpserve')stamp('BOOM!',V3(B.p),{size:28});
 M.state='rally';planReceive(1-T)}

/* first contact on the receiving side (serve receive, dig, free ball) */
function planReceive(Rt){if(M.state!=='rally')return;
 var tl=timeToY(B.p,B.v,BR);if(tl===null)return;var land=posAt(B.p,B.v,tl),rs=side(Rt);
 if((land.z<0?-1:1)!==rs)return;var ny=netY(B.p,B.v);if(ny!==null&&ny<NET_H+BR)return;
 if(!inCourt(land)&&!(Math.abs(land.x)<CX+.6&&Math.abs(land.z)<CZ+.6&&chance(.35)))return;
 var th=B.threat||{kind:'free',q:'good'},strong=th.kind==='spike'&&!th.tip||th.power;
 /* pick the passer: libero / outsides first, never the setter if anyone else can, not players already committed (blockers) */
 var cands=onCourt(Rt).filter(function(p){return !(p.act&&!p.act.free)&&!p.blocking}),best=null,bs=1e9;
 cands.forEach(function(p){var d=Math.hypot(p.box.position.x-land.x,p.box.position.z-land.z),sc=d+(p.pos==='L'?-1.4:p.pos==='OH'?-.5:p.pos==='S'?2.5:0)+(front(p)&&th.kind==='serve'?.6:0);if(sc<bs){bs=sc;best=p}});
 if(!best)return;var dist=Math.hypot(best.box.position.x-land.x,best.box.position.z-land.z);
 var clip=digClip(best,strong,dist>3.2&&tl<1.2),hy=handY(best,clip),t=timeToY(B.p,B.v,Math.max(.35,hy));if(t===null||t<.25)return;
 var cp=posAt(B.p,B.v,t);if((cp.z<0?-1:1)!==rs)cp.z=rs*.7;
 var yaw=fwdYaw(Rt)+cl(Math.atan2(B.v.x,-B.v.z*rs)*-.35*rs,-.5,.5),C=M.now+t;
 planAct(best,clip,C,cp,yaw);
 var p=addPend({team:Rt,actor:best,type:'bump',S:Math.max(M.now,C-1.15),C:C,cp:cp,clip:clip});
 var d=DF(Rt),ok,pas=st(best,th.kind==='serve'?'pass':'dig');
 if(th.kind==='serve')ok=d.recv[QI[th.q]]+(pas-5)*.02;else if(th.kind==='spike')ok=(th.sup?.12:d.dig[QI[th.q]])+(pas-5)*.03+(st(best,'read')-5)*.01;else if(th.kind==='tip')ok=d.tip;else if(th.kind==='dump')ok=.8;else ok=.97;
 if(dist>4.5&&t<1)ok*=.35;p.cpuOk=chance(ok);p.w=windowOf(p,th.kind==='serve'?'bump':'dig');return p}

function setSpot(T){return {x:-.9*lx(T),z:side(T)*.85}}
function backupSetter(T,passer){var s=setterOf(T);if(s.on&&s!==passer&&!(s.act&&!s.act.free&&s.act.id!=='dig'))return s;
 var l=libero(T);if(l.on&&l!==passer)return l;var c=onCourt(T).filter(function(p){return p!==passer&&p.pos!=='MB'});return c.sort(function(a,b){return Math.hypot(a.box.position.x,a.box.position.z)-Math.hypot(b.box.position.x,b.box.position.z)})[0]||onCourt(T)[0]}

function doBump(p,q){var T=p.team,d=side(T),a=p.actor,human=isHuman(T);
 if(q==='miss'){if(!human&&chance(.5))stamp('NO!',headW(a),{size:22});return}
 B.netHit=false;SFX.hit();if(human)vib(15);B.touches=1;B.side=T;
 if((q==='bad'&&chance(human?.22:.1))||faultRoll(p)){var sx=chance(.5)?1:-1;B.v=trajTo(B.p,{x:sx*rnd(5.2,7),y:0,z:d*rnd(2,8)},1.3);B.last=T;B.lastType='bump';B.threat=null;stamp('SHANK!',headW(a),{fill:'#d62828',size:24});return}
 var setter=backupSetter(T,a),ss=setSpot(T),off={perfect:.25,good:.9,bad:1.8}[q],at0=human?null:pickAttack(T,setter,false);
 var sx={x:ss.x+rnd(-off,off),z:d*Math.max(.5,Math.abs(ss.z)+Math.random()*off*.7)},sclip=setClipFor(setter,sx,at0),hy=handY(setter,sclip),sp={x:sx.x,y:hy,z:sx.z},tt=1.35+(q==='bad'?.15:0);
 B.v=trajTo(B.p,sp,tt);B.last=T;B.lastType='bump';B.threat=null;M.poss=T;
 var C=M.now+tt,mir=sclip==='set'||sclip==='set_low'||sclip==='set_high'?1:setMir(T,sp.x),yaw=mir===1&&!/^(jset|rset|bset)$/.test(sclip)?Math.atan2(lx(T),0):fwdYaw(T);/* the classic clips already face the outside hitter; the move-and-set clips turn from the net to zone 3 */
 planAct(setter,sclip,C,sp,yaw,mir);
 var ps=addPend({team:T,actor:setter,type:'set',S:C-1.1,C:C,cp:sp,bq:q,w:windowOf({actor:setter},'set'),sclip:sclip});
 if(!human&&at0){ps.q0=cpuQ(T,setter,'set');if(at0.kind==='dump')ps.at=at0;else buildAttack(ps,at0,ps.q0)}
 setterGlance(setter,T,C)}
function setMir(T,ax){return Math.abs(ax)<.3?1:-(ax>0?1:-1)*lx(T)}
function setClipFor(setter,sp,at){var s=st(setter,'set');if(s<3)return chance(.6)?'set_low':'set';
 if(at&&at.p&&at.kind!=='dump'&&at.x*lx(setter.team)<-1.2&&s>=5)return 'bset';
 var dd=Math.hypot(setter.box.position.x-sp.x,setter.box.position.z-sp.z);
 if(dd>1.3&&s>=4)return 'rset';if(s>=6.5&&chance(.5))return 'jset';return 'set'}
function setterGlance(s,T,C){s.glance={T:T,t0:M.now,C:C}}

/* attack options for the team that is setting */
function attackOptions(T,setter){var on=onCourt(T).filter(function(p){return p!==setter&&p.pos!=='L'}),L=lx(T),o={};
 on.forEach(function(p){if(front(p)){if(p.pos==='OH'&&!o.left)o.left={p:p,x:3.3*L,kind:'out',z:1.0,T:1.15};else if(p.pos==='MB'&&!o.quick)o.quick={p:p,x:-.15*L,kind:'quick',z:.9,T:.62};else if((p.pos==='OPP'||p.pos==='OH')&&!o.right)o.right={p:p,x:-3.3*L,kind:'out',z:1.0,T:1.1}}
  else if(p.pos==='OH'&&!o.pipe&&st(p,'spike')>=4)o.pipe={p:p,x:-.2*L,kind:'back',z:3.4,T:1.0};else if(p.pos==='OPP'&&!o.backR&&st(p,'spike')>=4)o.backR={p:p,x:-2.6*L,kind:'back',z:3.4,T:1.05}});
 if(!o.right&&o.backR){o.right=o.backR}if(!o.left&&o.right)o.left=o.right;if(!o.left&&o.quick)o.left=o.quick;
 if(setter.pos==='S'&&front(setter)&&st(setter,'set')>=7.5)o.dump={p:setter,kind:'dump'};return o}
function setChoice(){var s=stick();if(s.y<-.5&&Math.abs(s.x)<.6)return 'up';if(s.y>.5&&Math.abs(s.x)<.6)return 'down';if(s.x>.35)return 'right';if(s.x<-.35)return 'left';return 'left'}
function busy(h){return !!(h.act&&!h.act.free&&M.now<h.act.C+.35)}
function pickAttack(T,setter,human,pend){var o=attackOptions(T,setter),c;
 if(human){var ch=setChoice();if(pend&&pend.aimPick)c=pend.aimPick;else c=ch==='left'?o.left:ch==='right'?(o.right||o.left):ch==='down'?(o.quick||o.left):(o.dump||o.pipe||o.left)}
 else{var l=[];[['left',2],['right',1],['quick',1]].forEach(function(e){var x=o[e[0]];if(x&&!busy(x.p))for(var i=0;i<e[1];i++)l.push(x)});if(o.pipe&&!busy(o.pipe.p)&&chance(.4))l.push(o.pipe);
  if(!l.length){if(o.left)l.push(o.left);if(o.right)l.push(o.right)}c=chance(.08)&&o.dump?o.dump:pick(l)}
 return c||o.left}

/* the whole attack: hitter, set point, flight time and the hitter's run-up. Built as soon as the target is known (CPU: at the pass, human: on release) so hitters start moving before the set */
function buildAttack(p,at,q){var T=p.team,d=side(T),a=p.actor,hit=at.p,kind=at.kind,clip=spikeClip(hit,kind),hy=handY(hit,clip),off={perfect:0,good:.4,bad:1}[q]*(1.2-st(a,'set')*.08);
 var ap={x:at.x+rnd(-off,off),y:hy-(q==='bad'?.25:0),z:d*(at.z+(q==='bad'?rnd(0,.7):rnd(0,.2)))},tt=at.T+(q==='bad'?.12:0),Cs=Math.max(M.now,p.C)+tt,yaw=fwdYaw(T)+cl(-(ap.x)*.06*(T?-1:1),-.3,.3);
 planAct(hit,clip,Cs,ap,yaw);
 var spk=addPend({team:T,actor:hit,type:'spike',S:Cs-.85,C:Cs,cp:ap,sq:{perfect:1,good:.9,bad:.75}[q],kind:kind,clip:clip,w:windowOf({actor:hit},'spike'),aimDef:p.aimDef||null});
 if(!isHuman(T))planCpuSpike(spk);
 return p.sp={at:at,hit:hit,kind:kind,clip:clip,ap:ap,tt:tt,Cs:Cs,spk:spk,q:q}}

function doSet(p,q){var T=p.team,d=side(T),a=p.actor,human=isHuman(T);
 if(q==='miss'){return}
 SFX.set();if(human)vib(15);B.touches=2;
 if(faultRoll(p)&&chance(.6)){whistleCall('DOUBLE!');B.live=false;point(1-T,'DOUBLE CONTACT');return}
 var at=p.at||(p.sp?p.sp.at:pickAttack(T,a,human,p));
 if(at.kind==='dump'){B.v=aim(B.p,{x:rnd(-3,3),y:0,z:-d*rnd(1.8,3)},5,true);B.last=T;B.lastType='dump';B.threat={kind:'dump',q:'good'};stamp('DUMP!',headW(a),{size:26});planReceive(1-T);return}
 var sp=p.sp||buildAttack(p,at,q);
 B.v=trajTo(B.p,sp.ap,sp.tt);B.last=T;B.lastType='set';B.threat=null;
 planBlock(1-T,sp.spk,sp.ap,sp.Cs)}

/* blockers: the front-row player in front of the hitter, plus a middle if close enough */
function planBlock(Rt,sp,ap,C){var fr=onCourt(Rt).filter(function(p){return front(p)&&!(p.act&&!p.act.free)});if(!fr.length)return;
 fr.sort(function(a,b){return Math.abs(a.box.position.x-ap.x)-Math.abs(b.box.position.x-ap.x)});
 var main=fr[0],second=fr.filter(function(p){return p!==main&&Math.abs(p.box.position.x-ap.x)<3.4})[0],d=side(Rt),yaw=fwdYaw(Rt);
 var bc=st(main,'block')<3?'block_low':'block';
 [main,second].forEach(function(b,i){if(!b)return;var x=cl(ap.x+(i?(ap.x>b.box.position.x?-.55:.55):0),-4,4),bp={x:x,y:handY(b,bc),z:d*.1};planAct(b,bc,C-.02+i*.03,bp,yaw);b.blocking=true});
 sp.block=addPend({team:Rt,actor:main,type:'block',S:C-.85,C:C,cp:{x:ap.x,y:3,z:d*.3},second:second,w:windowOf({actor:main},'block')})}

function planCpuSpike(sp){var T=sp.team,a=sp.actor,q=cpuQ(T,a,'spike'),tip=sp.kind!=='quick'&&chance(.12),rs=-side(T);
 sp.plan={q:q,tip:tip,to:{x:rnd(-3.8,3.8),y:0,z:rs*(tip?rnd(1.3,2.6):rnd(4.2,8.3))},speed:spikeSpeed(a,q)*sp.sq,error:q==='bad'&&chance(.22)?(chance(.5)?'net':'out'):null,sup:false};
 if(sp.plan.error==='out'){sp.plan.to.z=rs*rnd(9.8,11.5)}}
function spikeSpeed(a,q){return {perfect:24,good:19,bad:14.5}[q]*(.72+st(a,'spike')*.055)}
function attackVel(from,pl){if(pl.tip)return aim(from,pl.to,3.6,true);if(pl.error==='net')return aim(from,{x:pl.to.x*.4,y:rnd(1.3,2),z:0},pl.speed,false);
 var v=aim(from,pl.to,pl.speed,false),y=netY(from,v);if(y!==null&&y<NET_H+BR+.1){var T=d3(from,pl.to)/pl.speed,n=0;while(n++<40&&y!==null&&y<NET_H+BR+.1){T*=1.05;v=trajTo(from,pl.to,T);y=netY(from,v)}if(y!==null&&y<NET_H+BR+.1)v=aim(from,pl.to,pl.speed*.8,true)}return v}

function doSpike(p,q){var T=p.team,od=-side(T),a=p.actor,human=isHuman(T);
 if(q==='miss'){if(p.block)p.block.done=true;return}
 var plan=p.plan;
 if(!plan){var sa=spikeAim(p),tip=sa.tip,sup=M.hype>=100&&!tip,sc={perfect:.25,good:.6,bad:1.2}[q]||.8;
  plan={q:q,tip:tip,sup:sup,speed:sup?31:spikeSpeed(a,q)*p.sq,error:!sup&&q==='bad'&&chance(.28)?(chance(.5)?'net':'out'):null,
   to:{x:cl(sa.x+(swipeMode()&&(p.aim||p.aimDef)?rnd(-sc,sc):rnd(-.4,.4)),-4.1,4.1),y:0,z:od*(tip?cl(sa.depth+rnd(-.3,.3),1.2,2.6):cl(sa.depth+(swipeMode()&&(p.aim||p.aimDef)?rnd(-sc,sc):rnd(-.8,.8)),3.2,8.6))}};
  if(!plan.error&&faultRoll(p))plan.error=chance(.6)?'net':'out';
  if(plan.error==='out'){plan.to.z=od*rnd(9.8,12);if(chance(.4))plan.to.x=(plan.to.x<0?-1:1)*rnd(4.9,6)}
 if(sup)M.hype=0}
 if(p.k!=null&&p.k>1.02&&Math.abs(B.p.z)<.7&&chance(.35)){whistleCall('NET TOUCH!');B.live=false;point(1-T,'NET TOUCH');return}
 B.netHit=false;B.v=attackVel(B.p,plan);B.float=null;B.last=T;B.lastType=plan.tip?'tip':'spike';B.threat={kind:plan.tip?'tip':'spike',q:plan.q,sup:plan.sup,tip:plan.tip};B.touches=3;
 if(plan.tip){SFX.set();stamp('TIP!',headW(a),{size:24})}
 else{SFX.spike(plan.sup,plan.q==='perfect');M.fx={t0:M.now,team:T,sup:plan.sup,at:{x:B.p.x,y:B.p.y,z:B.p.z}};vib(plan.sup?[40,30,60]:human?35:0)}
 var tn=Math.abs(B.v.z)>.1?Math.max(.02,(Math.abs(B.p.z)-.15)/Math.abs(B.v.z)):.07;
 M.blockEval={t:M.now+Math.min(.16,tn),sp:p,plan:plan}}

function evalBlock(){var e=M.blockEval;M.blockEval=null;var bp=e.sp.block,A=e.sp.team;
 var after=function(){onCourt(1-A).forEach(function(p){p.blocking=false});planReceive(1-A)};
 if(!bp||bp.done&&bp.q===undefined){if(bp)bp.done=true;after();return}
 var Rt=bp.team,res='none',human=isHuman(Rt);bp.done=true;
 if(e.plan.tip||e.plan.error==='net'||Math.abs(B.p.z)>1.8)res='none';
 else if(human){if(bp.pressT!==null){var q=bp.q;qStamp(q,bp.actor);gainHype(q,Rt);var bs=st(bp.actor,'block');res=q==='perfect'?(chance(.35+bs*.05)?'stuff':'touch'):q==='good'?(chance(.45+bs*.03)?'touch':'none'):'none';if(bp.k!=null&&bp.k<.15&&SET.diff===2&&chance(.3))res='over'}}
 else{var d=DF(Rt),m=e.plan.sup?0:e.plan.q==='perfect'?.5:1,r=Math.random(),bk=(st(bp.actor,'block')-5)*.03;res=r<(d.block[0]+bk)*m?'stuff':r<(d.block[0]+d.block[1]+bk)*m?'touch':'none'}
 if(res==='over'){whistleCall('REACHING OVER!');B.live=false;point(A,'REACHING OVER');return}
 if(res==='none'){after();return}
 cancelTeam(Rt);onCourt(Rt).forEach(function(p){p.blocking=false});
 if(res==='stuff'){B.v=trajTo(B.p,{x:B.p.x+rnd(-1.5,1.5),y:0,z:side(A)*rnd(1,3.5)},.5);B.last=Rt;B.lastType='block';B.threat=null;M.fx=null;
  stamp('BLOCK!!',{x:B.p.x,y:3.6,z:B.p.z},{size:40,fill:'#fff',dur:1.1,rot:-.1});SFX.spike();vib(human?50:0);planReceive(A)}
 else{B.v=trajTo(B.p,{x:cl(B.p.x+rnd(-2,2),-4,4),y:0,z:side(Rt)*rnd(3,6)},1.5);B.last=Rt;B.lastType='touch';B.threat={kind:'free',q:'good'};
  stamp('TOUCH!',{x:B.p.x,y:3.4,z:B.p.z},{size:24});SFX.set();planReceive(Rt)}}

/* ---------- serve / point / sets ---------- */
function serveSpot(T,sv){var clip=serveClip(sv),back={jumpserve:3.6,jumpfloat:2.0,topspin:.7,serve:.8,underhand:.5,skyball:.6}[clip]||.8;return {x:-2.2*lx(T)+(clip==='skyball'?-.6*lx(T):0),z:side(T)*(9+back),clip:clip}}
function startServe(){var T=M.serving;lineup(0);lineup(1);var sv=ONC[T][1];M.server=sv;M.state='serve';M.pend=[];M.rally=0;M.fx=null;M.blockEval=null;M.poss=T;
 PL.forEach(function(p){p.blocking=false;p.glance=null});
 B.live=false;B.dead=false;B.held=sv;B.heldClip=null;B.netHit=false;B.last=T;B.lastType='serve';B.threat=null;B.float=null;B.touches=0;
 M.serveReadyT=null;M.serveWait=0;M.serveQ=0;M.serveWaitT=0;if(!M.serveAim)M.serveAim={x:0,z:6.5};M.serveSpot=serveSpot(T,sv);SFX.whistle();drawBoard(M.score[0],M.score[1])}
function serveUpdate(){var sv=M.server,s=M.serveSpot;if(M.state!=='serve'||M.pend.length)return;
 var d=Math.hypot(sv.box.position.x-s.x,sv.box.position.z-s.z),others=PL.every(function(p){return !p.on||p===sv||!p.tgt||Math.hypot(p.box.position.x-p.tgt.x,p.box.position.z-p.tgt.z)<.6});
 if(d<.25&&(others||M.now-M.pointT>5.5)){if(M.serveReadyT==null)M.serveReadyT=M.now+(isHuman(sv.team)?.5:.7)}
 if(M.serveReadyT!=null&&M.now>=M.serveReadyT&&isHuman(sv.team)&&!M.serveQ){if(!M.serveWait){M.serveWait=1;M.serveWaitT=M.now}if(M.now-M.serveWaitT<8)return;stamp('8 SECONDS!',headW(sv),{size:24,fill:'#d62828'});SFX.err()}
 if(M.serveReadyT!=null&&M.now>=M.serveReadyT){M.serveWait=0;var clip=s.clip,tc=CONTACT[clip][0],C=M.now+tc;
  sv.act={id:clip,t0:M.now,tc:tc,B:sv.bake(clip),anchor:{x:sv.box.position.x,z:sv.box.position.z,yaw:fwdYaw(sv.team)},C:C};B.heldClip=sv.act;
  addPend({team:sv.team,actor:sv,type:'serve',S:Math.max(M.now,C-1.1),C:C,clip:clip,w:windowOf({actor:sv},'serve')})}}
function land(){var side0=B.p.z<0?0:1,w,why,inB=inCourt(B.p);
 if(B.netHit){w=1-B.last;why='NET!'}
 else if(inB){w=1-side0;if(B.last===w)why={serve:'ACE!',spike:'KILL!',tip:'TIP KILL!',dump:'DUMP KILL!',block:'BLOCK!',touch:'KILL!'}[B.lastType]||'POINT!';else why=B.lastType==='touch'?'KILL!':'DROPPED!'}
 else{w=1-B.last;why='OUT!'}
 stamp(inB?'DOON!':'OUT!',{x:B.p.x,y:.6,z:B.p.z},{size:inB?34:30,dur:1,fill:inB?'#fff':'#d62828'});SFX.thud();
 point(w,why)}
function point(w,why){B.live=false;B.dead=true;M.pend=[];M.blockEval=null;M.state='point';M.score[w]++;M.rallies++;M.pointT=M.now;M.nextT=M.now+3.4;
 PL.forEach(function(p){p.blocking=false;if(p.act&&!p.act.free&&M.now<p.act.t0)p.act=null});
 var S=M.stats;if(M.mode==='play'){if(w===0){if(/KILL/.test(why))S.kills++;if(why==='ACE!')S.aces++;if(why==='BLOCK!')S.blocks++}else if(B.last===0)S.errors++;S.best=Math.max(S.best,M.rally)}
 M.lastErr=B.lastP&&B.lastP.team!==w?B.lastP:null;M.msg={w:w,why:why,t0:M.now};M.streak[w]++;M.streak[1-w]=0;
 if(w===0||M.mode!=='play'){SFX.cheer()}else{SFX.groan();vib(80)}
 if(w!==M.serving){rotate(w);M.serving=w}
 drawBoard(M.score[0],M.score[1]);assignPost(w,why);
 /* CPU timeout when the run gets away from them */
 if(M.mode==='play'&&w===0&&M.streak[0]>=4&&M.tos[1]>0&&M.score[0]+M.score[1]>4){M.tos[1]--;M.timeoutT=1;stamp('TIMEOUT · SAN ROQUE',{x:0,y:3,z:3},{size:26,dur:1.6})}}
function afterPoint(){var s=M.score,f=FORMATS[M.fmt];
 if(!M.swDone&&Math.max(s[0],s[1])===f.sw){M.swDone=true;stamp('SWITCH SIDES',{x:0,y:3,z:0},{size:30,dur:1.4,fill:'#fff'})}
 for(var t=0;t<2;t++)if((s[t]>=f.to&&s[t]-s[1-t]>=2)||s[t]>=f.cap){if(M.mode==='play')return endSet(t);M.score=[0,0];break}
 startServe()}
function endSet(w){M.sets[w]++;var need=Math.ceil(MODES[M.modeKey].sets.length/2);if(M.sets[w]>=need)return gameOver(w);
 M.setNo++;M.fmt=MODES[M.modeKey].sets[M.setNo];M.score=[0,0];M.swDone=false;M.tos=[FORMATS[M.fmt].tos,FORMATS[M.fmt].tos];M.serving=M.setNo%2;
 M.banner={t0:M.now,txt:'SET '+M.setNo+' · '+(w===0?'MAPAYAPA':'SAN ROQUE'),sub:'Sets '+M.sets[0]+' – '+M.sets[1]+' · next: '+FORMATS[M.fmt].name};startServe()}
function resetMatch(mode,modeKey){M.mode=mode;M.modeKey=modeKey||'quick';M.setNo=0;M.fmt=MODES[M.modeKey].sets[0];M.score=[0,0];M.sets=[0,0];M.serving=0;M.hype=0;M.stamps=[];M.msg=null;M.paused=false;M.rallies=0;M.swDone=false;M.banner=null;M.streak=[0,0];
 M.tos=[FORMATS[M.fmt].tos,FORMATS[M.fmt].tos];M.stats={perfect:0,kills:0,blocks:0,aces:0,errors:0,best:0};M.pointT=M.now;
 initRot(0);initRot(1);lineup(0);lineup(1);PL.forEach(function(p){p.act=null;p.fade=null;p.ik=null;p.post=null;var f=formation(p);p.box.position.set(f.x,0,f.z);p.box.rotation.y=fwdYaw(p.team);p.vel.set(0,0,0)});startServe()}
function gameOver(w){M.mode='over';$('#pauseBtn').style.display='none';
 var t=$('#oTitle');t.textContent=w===0?'YOU WIN!':'YOU LOSE';t.className='big '+(w===0?'win':'lose');
 $('#oScore').textContent=(MODES[M.modeKey].sets.length>1?'SETS '+M.sets[0]+' – '+M.sets[1]+' · ':'')+'MAPAYAPA '+M.score[0]+' – '+M.score[1]+' SAN ROQUE';
 var S=M.stats;$('#oStats').innerHTML=[['PERFECTS',S.perfect],['KILLS',S.kills],['BLOCKS',S.blocks],['ACES',S.aces],['ERRORS',S.errors],['BEST RALLY',S.best]].map(function(r){return '<div class="stat"><b>'+r[1]+'</b><span>'+r[0]+'</span></div>'}).join('');
 show('sOver');if(w===0)SFX.cheer();setTimeout(function(){if(M.mode==='over')resetMatch('demo')},300)}

/* ---------- dead-ball scenes (nobody stands still after a point) ---------- */
function assignPost(w){[0,1].forEach(function(T){var team=onCourt(T),win=T===w,sc=M.timeoutT&&T===1?'huddle':win?pick(['huddleW','scatter','scatter']):pick(['huddle','scold','shake']),cz=side(T)*4.6,ctr=new THREE.Vector3(0,0,cz);
 team.forEach(function(c,i){var p=c.box.position,ph=i*1.7;c.post={clip:'handsHips',x:p.x,z:p.z,faceP:ctr.clone(),look:ctr.clone().setY(1.5),wander:0,ph:ph,lookOn:true};
  if(sc==='huddle'||sc==='huddleW'){var a=i/team.length*Math.PI*2;c.post.x=Math.cos(a)*.8;c.post.z=cz+Math.sin(a)*.8;c.post.clip=sc==='huddle'?'huddle':'huddleJump';c.post.look=ctr.clone().setY(sc==='huddle'?.2:1.6)}
  else if(sc==='scatter'){c.post.x=p.x+(0-p.x)*.25;c.post.z=p.z+(cz-p.z)*.25;c.post.clip=['celebrate','pump','flex','clap','point','pump'][i%6];c.post.faceP=new THREE.Vector3(c.post.x*.3,0,0);c.post.lookOn=false;c.post.wander=.35}
  else if(sc==='shake'){var a2=i/team.length*Math.PI*2+.4;c.post.x=Math.cos(a2)*1.9;c.post.z=cz+Math.sin(a2)*1.6;c.post.clip=i%2?'clap':'handsHips';c.post.wander=.55}});
 if(sc==='scatter'&&team.length>1){var a=team[0],b=team[1],mx=(a.box.position.x+b.box.position.x)/2,mz=(a.box.position.z+b.box.position.z)/2;[a,b].forEach(function(c,k){c.post.x=mx+(k?.45:-.45);c.post.z=mz;c.post.clip='highfive';c.post.faceP=new THREE.Vector3(mx+(k?-5:5),0,mz);c.post.wander=0;c.post.lookOn=false})}
 if(sc==='scold'){var vic=team.filter(function(c){return c===M.lastErr})[0]||pick(team.filter(function(c){return c.pos!=='S'})),boss=setterOf(T).on&&setterOf(T)!==vic?setterOf(T):team.filter(function(c){return c!==vic})[0];
  var vp=new THREE.Vector3(cl(vic.box.position.x,-3.5,3.5),0,T?cl(vic.box.position.z,2,8):cl(vic.box.position.z,-8,-2)),dir=ctr.clone().sub(vp).setY(0);if(dir.lengthSq()<.01)dir.set(0,0,-side(T));dir.normalize();var bpp=vp.clone().addScaledVector(dir,1.15);
  vic.post={clip:'scolded',x:vp.x,z:vp.z,faceP:bpp.clone(),look:bpp.clone().setY(1.2),wander:0,lookOn:false,ph:0};boss.post={clip:'scold',x:bpp.x,z:bpp.z,faceP:vp.clone(),look:vp.clone().setY(1.6),wander:0,lookOn:true,ph:0};
  team.forEach(function(c){if(c!==vic&&c!==boss){c.post.look=vp.clone().setY(1.4);c.post.faceP=vp.clone();c.post.wander=.45}})}});M.timeoutT=0}

/* ---------- positions ---------- */
var ZX={1:-1,2:-1,3:0,4:1,5:1,6:0};/* zone -> left(+1)/middle/right(-1) */
function formation(p){var T=p.team,d=side(T),L=lx(T);
 if(!p.on){var bi=TEAM[T].filter(function(q){return !q.on}).indexOf(p);return {x:-8.4,z:d*(4.2+bi*1.3),face:Math.PI/2,bench:1}}
 if(M.state==='serve'){
  if(p===M.server)return {x:M.serveSpot.x,z:M.serveSpot.z,face:fwdYaw(T)};
  if(T===M.serving){var fr=front(p);return {x:ZX[p.zone]*2.6*L,z:d*(fr?1.2:6.6),face:fwdYaw(T)}}
  /* receive: setter hides near the net, middle stays front, three passers spread across the court */
  if(p.pos==='S')return {x:-1.2*L,z:d*(front(p)?.9:1.6),face:fwdYaw(T)};
  if(front(p)&&p.pos!=='OH')return {x:ZX[p.zone]*2.5*L,z:d*1.6,face:fwdYaw(T)};
  var passers=onCourt(T).filter(function(q){return q.pos==='L'||q.pos==='OH'||(!front(q)&&q.pos==='OPP')}).sort(function(a,b){return (ZX[b.zone]-ZX[a.zone])||(a.zone-b.zone)}),i=passers.indexOf(p);
  var lanes=[2.7,0,-2.7];if(i>=0&&i<3)return {x:lanes[i]*L,z:d*(i===1?6.6:5.9),face:fwdYaw(T)};return {x:ZX[p.zone]*2.6*L,z:d*6.8,face:fwdYaw(T)}}
 /* rally */
 var fr=front(p),poss=M.poss===T&&B.live&&(B.p.z<0?0:1)===T;
 if(poss){if(p.pos==='S'&&B.touches<2&&!(p.act&&!p.act.free)){var ss=setSpot(T);return {x:ss.x,z:ss.z}}
  if(fr){if(p.pos==='MB'&&!(p.act&&!p.act.free))return {x:-.5*L,z:d*2.4};var lane=p.pos==='OH'?3.4:p.pos==='MB'?-.2:-3.4;return {x:lane*L,z:d*3.4}}
  if(p.pos==='OH'||p.pos==='OPP')return {x:(p.pos==='OH'?.2:-2.4)*L,z:d*6.4};return {x:ZX[p.zone]*2.4*L,z:d*4.8}}
 /* defence: front row at the net shading toward the ball, back row deep */
 var bx=B.live?cl(B.p.x,-4,4):0;
 if(fr){var lane2=p.pos==='OH'?2.7:p.pos==='MB'?0:-2.7;return {x:lane2*L+cl((bx-lane2*L)*.25,-1,1),z:d*.75}}
 var bl=p.pos==='L'?2.6:p.pos==='OH'?0:p.pos==='MB'?0:-2.6;return {x:bl*L+cl((bx-bl*L)*.15,-.6,.6),z:d*(p.pos==='OH'||p.pos==='MB'?7.6:6.9)}}

/* ---------- input ---------- */

/* ---------- swipe / drag controls ----------
   Touch the court and drag to where you want the ball to go; a ring pulses big -> small -> big and the moment you let go decides the quality.
   Set: drag onto a teammate's zone (through the middle zone and over the net = quick). Spike / serve: drag to the landing spot. */
function swipeMode(){return SET.ctl==='swipe'&&M.mode==='play'}
var SWR=new THREE.Raycaster(),SWP=new THREE.Plane(new THREE.Vector3(0,1,0),0),SWV=new THREE.Vector3();
function floorAt(nx,ny){SWR.setFromCamera({x:nx,y:ny},cam);return SWR.ray.intersectPlane(SWP,SWV)?{x:SWV.x,z:SWV.z}:null}
function pulsePer(p){return p.type==='set'?.72:p.type==='spike'?.8:.88}
function pulseF(p){return .5*(1+Math.cos(6.2832*Math.max(0,M.now-p.S)/pulsePer(p)))}
function swipeKQ(p){var f=pulseF(p),w=p.w||{good:.55,perf:.8,red:.28},k=cl(1-f*.95,0,1);return {k:k,q:k<w.good?'bad':k<w.perf?'good':'perfect'}}
function swipeStart(e){if(!swipeMode()||M.paused)return;IN.sw={id:e.pointerId,path:[],end:null,len:0};
 if(M.state==='serve'&&M.server&&isHuman(M.server.team)&&!M.pend.length&&!M.serveQ){M.serveQ=1;vib(10);SFX.click()}}
function swipeMove(w){var sw=IN.sw;if(!sw||!w)return;var l=sw.path[sw.path.length-1];if(l)sw.len+=Math.hypot(w.x-l.x,w.z-l.z);if(sw.path.length<240)sw.path.push(w);sw.end=w;var tn=performance.now()/1000;IN.tr=IN.tr||[];IN.tr.push({x:w.x,z:w.z,t:tn});while(IN.tr.length&&tn-IN.tr[0].t>.35)IN.tr.shift();
 if(M.state==='serve'&&M.server&&isHuman(M.server.team)&&M.serveAim&&w.z>1){M.serveAim.x=cl(w.x,-4.2,4.2);M.serveAim.z=cl(w.z,1.6,8.6)}}
function swipeEnd(e){var sw=IN.sw;if(!sw||e&&e.pointerId!==sw.id)return;IN.sw=null;swipeCommit(sw)}
function swipeCommit(sw){if(!swipeMode()||M.paused||M.state==='point')return;var p=activePend();if(!p)return;
 var r=swipeKQ(p);p.k=r.k;p.q=r.q;p.pressT=M.now;vib(12);p.ticked=1;
 if(sw&&sw.end){p.aim=sw.end;p.path=sw.path;p.drag=sw.len>.8}
 if(p.type==='block'&&M.now>p.C+GRACE)p.done=true;
 if(p.type==='serve'&&p.aim&&p.aim.z>1){M.serveAim.x=cl(p.aim.x,-4.2,4.2);M.serveAim.z=cl(p.aim.z,1.6,8.6)}
 if(p.type==='set')commitSet(p)}
/* which hitter does this drag mean? */
function swipePick(T,setter,sw){var o=attackOptions(T,setter),L=lx(T),d=side(T),end=sw&&sw.end;if(!end)return null;
 var opp=end.z*d<-.2,pass=(sw.path||[]).some(function(q){return Math.abs(q.x)<1.6&&q.z*d>.3&&q.z*d<5.5}),ex=end.x*L,bk=end.z*d>3.1,res={};
 var any=function(){for(var i=0;i<arguments.length;i++)if(arguments[i]&&!busy(arguments[i].p))return arguments[i];return arguments[0]};
 if(opp){if(sw.len<1.2&&o.dump)return {at:o.dump};if(pass&&o.quick)return {at:o.quick,aimDef:{x:end.x,z:end.z}};
  return {at:ex>1.6?any(o.left,o.right):ex<-1.6?any(o.right,o.left):any(o.quick,o.left)}}
 if(bk)return {at:ex<-1.2?any(o.backR,o.right,o.left):any(o.pipe,o.backR,o.left)};
 return {at:ex>1.6?any(o.left,o.right):ex<-1.6?any(o.right,o.left):any(o.quick,o.left)}}
function commitSet(p){var T=p.team,a=p.actor,pk=swipePick(T,a,{end:p.aim,path:p.path,len:p.drag?2:0});
 if(!pk||!pk.at)return;p.aimPick=pk.at;p.aimDef=pk.aimDef||null;if(pk.at.kind==='dump'){p.at=pk.at;return}
 /* behind the setter: re-plan the setter's move as a back set while there is still time */
 var ac=a.act;if(ac&&ac.id!=='bset'&&pk.at.x*lx(T)<-1.2&&st(a,'set')>=5&&M.now<ac.t0-.02){var sp=p.cp;planAct(a,'bset',p.C,{x:sp.x,y:handY(a,'bset'),z:sp.z},fwdYaw(T),setMir(T,sp.x));p.cp={x:sp.x,y:handY(a,'bset'),z:sp.z}}
 if(p.sp&&p.sp.spk)p.sp.spk.done=true;buildAttack(p,pk.at,p.q)}
/* where does this spike go? (depth is measured from the net on the far side) */
function spikeAim(p){var od=-side(p.team),a=p.aim&&p.drag&&p.aim.z*od>.2?p.aim:p.aimDef;
 if(a&&a.z*od>.2)return {x:a.x,depth:Math.abs(a.z),tip:Math.abs(a.z)<2.8};
 var s=stick();return {x:-s.x*3.8,depth:s.y<-.5&&Math.abs(s.x)<.6?1.9:6.5,tip:s.y<-.5&&Math.abs(s.x)<.6}}
var IN={keys:{},touch:null,tx:0,ty:0};
function stick(){if(IN.ov)return IN.ov;if(IN.touch)return {x:IN.tx,y:IN.ty};var k=IN.keys,x=(k.ArrowRight||k.KeyD?1:0)-(k.ArrowLeft||k.KeyA?1:0),y=(k.ArrowDown||k.KeyS?1:0)-(k.ArrowUp||k.KeyW?1:0),m=Math.hypot(x,y);return m>1?{x:x/m,y:y/m}:{x:x,y:y}}
function press(){ac();if(M.mode!=='play'||M.paused||M.state==='point')return;
 if(swipeMode()&&!(M.state==='serve'&&M.server&&isHuman(M.server.team)&&!M.pend.length)){swipeCommit(null);return}
 /* serving: the first tap starts the toss (or queues it while the server walks out); the next tap is the timing press */
 if(M.state==='serve'&&M.server&&isHuman(M.server.team)&&!M.pend.length){if(!M.serveQ){M.serveQ=1;vib(10);SFX.click()}return}
 var p=activePend();if(!p)return;
 p.pressT=M.now;var k=(M.now-p.S)/(p.C-p.S),w=p.w||{good:.55,perf:.8,red:.28};p.k=k;p.q=k<w.good?'bad':k<w.perf?'good':'perfect';vib(12);
 if(p.type==='block'&&M.now>p.C+GRACE)p.done=true}

/* ---------- update (fixed step) ---------- */
function update(dt){M.now+=dt;if(M.mode==='drill'){drillUpdate(dt);return}
 if(M.state==='serve'){if(M.server&&isHuman(M.server.team)&&M.serveAim){var sk=stick();M.serveAim.x=cl(M.serveAim.x-sk.x*4.5*dt,-4.2,4.2);M.serveAim.z=cl(M.serveAim.z-sk.y*4.5*dt,1.6,8.6)}serveUpdate()}
 /* ball */
 if(B.held){var sv=B.held,ha=B.heldClip;if(ha){var tt=M.now-ha.t0,bp=ballAt(ha.B,tt);if(bp){var w=bp.clone().applyMatrix4(sv.box.matrixWorld);B.p={x:w.x,y:w.y,z:w.z}}}
  else{var hw=handWorld(sv,'L');B.p={x:hw.x,y:hw.y,z:hw.z}}}
 else if(B.live||B.dead){var pz=B.p.z;B.v.y-=GRAV*dt;B.p.x+=B.v.x*dt;B.p.y+=B.v.y*dt;B.p.z+=B.v.z*dt;B.spin+=dt*Math.hypot(B.v.x,B.v.z)*2;
  if(B.float&&B.live){B.p.x+=Math.sin(M.now*9+B.float.ph)*B.float.a*dt*.6}
  if(B.live&&M.state==='rally'&&(pz<0)!==(B.p.z<0)){if(Math.abs(B.p.x)<5&&B.p.y<NET_H+BR*.5){B.netHit=true;B.p.z=pz<0?-BR:BR;B.v.z*=-.15;B.v.x*=.4;B.v.y=Math.min(B.v.y,0)*.3;M.pend.forEach(function(p){p.done=true});M.blockEval=null;SFX.net();stamp('NET!',{x:B.p.x,y:2.8,z:0},{fill:'#d62828',size:30})}else{M.rally++;B.touches=0;M.poss=B.p.z<0?0:1}}
  if(B.p.y<=BR&&B.v.y<0){B.p.y=BR;if(B.live&&M.state==='rally'){land()}else{B.v.y*=-.45;B.v.x*=.7;B.v.z*=.7;if(Math.abs(B.v.y)<.6)B.v.y=0}}}
 /* pending touches */
 M.pend.forEach(function(p){if(p.done||p.type==='block')return;
  if(isHuman(p.team)){if(p.pressT!==null){if(M.now>=Math.max(p.pressT,p.C))resolve(p,p.q)}else if(M.now>p.C+GRACE){if(swipeMode()&&(p.type==='set'||p.type==='spike')){p.k=.25;p.q='bad';p.auto=1;resolve(p,'bad')}else resolve(p,p.type==='serve'?'weak':'miss')}}
  else if(M.now>=p.C){var q=p.type==='bump'?(p.cpuOk?cpuQ(p.team,p.actor,'pass'):'miss'):p.type==='spike'?p.plan.q:p.q0||cpuQ(p.team,p.actor,p.type==='set'?'set':'serve');resolve(p,q)}});
 if(M.blockEval&&M.now>=M.blockEval.t)evalBlock();
 M.pend=M.pend.filter(function(p){return !p.done||p.type==='block'&&M.now<p.C+.6});
 if(M.state==='point'&&M.now>=M.nextT)afterPoint();
 M.stamps=M.stamps.filter(function(s){return M.now-s.t0<s.dur})}

/* ===== src/frame.js ===== */
/* ======================================================================
   PER-FRAME: player movement, animation, look-at, camera
   ====================================================================== */
var CLIPLOOK=/celebrate|frust|serve|topspin|float|underhand|skyball|dive/;
function ss(k){return k*k*(3-2*k)}
function startOffset(a){var k=a.B.keys[0];var cs=Math.cos(a.anchor.yaw),sn=Math.sin(a.anchor.yaw);return {x:(k.fx||0)*cs+(k.fz||0)*sn,z:-(k.fx||0)*sn+(k.fz||0)*cs}}
function endAct(p){var C=p.C;C.root.updateMatrixWorld(true);C.root.getWorldPosition(tmpV);p.box.position.set(tmpV.x,0,tmpV.z);C.root.position.set(0,0,0);C.root.rotation.y=0;p.act=null;p.wasIn=null;p.vel.set(0,0,0)}
function moveTarget(p){
 if(p.act&&M.now<p.act.t0){var a=p.act,o=startOffset(a);return {x:a.anchor.x+o.x,z:a.anchor.z+o.z,face:a.anchor.yaw,anchor:true,dt:a.t0-M.now}}
 if(M.mode==='drill')return p.drillHome||null;
 if(M.state==='point'&&p.post&&M.now>M.pointT+.6&&M.now<M.nextT-1.2){var w=p.post.wander,tt=M.now-M.pointT;return {x:p.post.x+Math.sin(tt*.9+p.post.ph)*w,z:p.post.z+Math.cos(tt*.7+p.post.ph)*w*.7,post:true}}
 if(M.state==='point'&&M.now<M.pointT+.6)return null;
 var f=formation(p);return {x:f.x,z:f.z,face:f.face,slow:M.state!=='rally',bench:f.bench}}
function stepPlayer(p,dt,detail){var C=p.C,a=p.act;
 var inAct=a&&M.now>=a.t0;
 if(inAct){var t=M.now-a.t0,clip=a.B.clip,end=a.B.dur+(clip.loop?0:.2);
  if(t>end&&!clip.loop){endAct(p);inAct=false}
  else{if(p.wasIn!==a){p.wasIn=a;a.from={x:p.box.position.x,z:p.box.position.z,yaw:p.box.rotation.y};p.vel.set(0,0,0);p.ik=null;if(/dig|dive/.test(a.id)&&(a.id!=='dig'||chance(.6)))setTimeout(SFX.squeak,Math.max(0,(a.tc-.35)*1000))}
   /* slide the body onto its anchor during the lead-in so the hand meets the ball */
   if(a.slide==null){var dd0=Math.hypot(a.from.x-a.anchor.x,a.from.z-a.anchor.z),s0=Math.max(.12,Math.min(a.tc*.7,.55));a.slide=dd0>.45?Math.min(Math.max(s0,dd0/6),Math.max(.14,a.tc-.12)):s0;a.lin=dd0>.45}
   var k=a.free?1:cl(t/a.slide,0,1);k=a.lin?k*(2-k):ss(k);
   p.box.position.x=lerp(a.from.x,a.anchor.x,k);p.box.position.z=lerp(a.from.z,a.anchor.z,k);p.box.rotation.y=angTo(a.from.yaw,a.anchor.yaw,k);
   evalB(C,a.B,clip.loop?t%a.B.dur:t,a.mir)}}
 if(!inAct){var tg=moveTarget(p);p.tgt=tg;var des=new THREE.Vector3(),spd=4.2+st(p,'speed')*.25;
  if(tg){des.set(tg.x-p.box.position.x,0,tg.z-p.box.position.z);var dd=des.length(),vmax=tg.anchor?Math.min(8.2,Math.max(spd,dd/Math.max(.15,tg.dt-.05))):tg.slow?(p===M.server&&M.state==='serve'?3.8:dd>3?3.2:2.1):tg.post?1.6:spd;
   des.multiplyScalar(dd>.04?Math.min(vmax,dd*(tg.slow||tg.post?1.4:3.2))/dd:0)}
  p.vel.lerp(des,Math.min(1,dt*7));p.box.position.addScaledVector(p.vel,dt);var sp=p.vel.length();
  /* facing */
  var bp=B.p,fy;
  if(tg&&tg.post&&sp<1.4&&p.post&&p.post.faceP)fy=Math.atan2(p.post.faceP.x-p.box.position.x,p.post.faceP.z-p.box.position.z);
  else if(tg&&tg.bench)fy=tg.face;
  else if(sp>2.6||(tg&&!tg.anchor&&sp>.7&&dd>1.3))fy=Math.atan2(p.vel.x,p.vel.z);/* long walks: turn and walk forwards, never backpedal across the court */
  else if(tg&&tg.face!=null&&(tg.anchor||M.state==='serve'||M.mode==='drill'))fy=tg.face;
  else if(M.state==='rally'||B.held)fy=Math.atan2(bp.x-p.box.position.x,bp.z-p.box.position.z);else fy=fwdYaw(p.team);
  p.box.rotation.y=angTo(p.box.rotation.y,fy,Math.min(1,dt*(sp>2.6?8:5)));
  var inPost=M.state==='point'&&p.post&&tg&&tg.post,bid=inPost?p.post.clip:tg&&tg.bench?(M.state==='point'&&M.msg&&M.msg.w===p.team?'clap':'handsHips'):'idle',Bi=p.bake(bid);
  locomote(p,dt,((M.now)+p.phase*5+(inPost?p.post.ph:0))%Bi.dur,bid);fingRest(C)}
 /* cross-fade whenever the driving clip changes, so nobody snaps between poses */
 var curId=inAct?'a:'+a.id+':'+a.t0:(M.state==='point'&&p.post)?'post:'+p.post.clip:'loco';
 if(p.lastId!==undefined&&p.lastId!==curId&&!(inAct&&a.free===2)){p.fade={q:p.fadeQ||JN.map(function(n){return C.J[n].quaternion.clone()}),py:p.fadePy||C.J.pelvis.position.y,t:0}}
 p.lastId=curId;
 if(p.fade){p.fade.t+=dt;var fk=Math.min(1,p.fade.t/.3);fk=ss(fk);JN.forEach(function(n,i){C.J[n].quaternion.copy(p.fade.q[i].clone().slerp(C.J[n].quaternion,fk))});C.J.pelvis.position.y=lerp(p.fade.py,C.J.pelvis.position.y,fk);if(fk>=1)p.fade=null}
 /* look-at */
 if(detail){var lt=null,want=false;
  if(M.state==='serve'&&M.server&&p!==M.server){lt=headW(M.server);lt.y-=.4;want=true}
  else if(B.live||B.held){lt=V3(B.p);want=!(inAct&&(CLIPLOOK.test(a.id)||(a.B.clip.ld!=null&&M.now-a.t0>a.B.clip.ld)))}
  if(p.glance&&M.now<p.glance.C-.35){var g=M.now-p.glance.t0,hs=attackOptions(p.team,p),list=['left','quick','right'].map(function(k){return hs[k]}).filter(Boolean);if(list.length&&g>.1){var h=list[Math.floor(g/.3)%list.length];lt=headW(h.p);lt.y-=.4;want=true}}
  if(M.state==='point'){want=false;if(p.post&&p.post.lookOn&&M.now>M.pointT+.6){lt=p.post.look;want=true}}
  lookStep(C,lt,want,dt)}
 C.root.updateMatrixWorld(true);
 p.fadeQ=JN.map(function(n){return C.J[n].quaternion.clone()});p.fadePy=C.J.pelvis.position.y;
 C.root.getWorldPosition(tmpV);C.shadow.position.set(tmpV.x,.004,tmpV.z);
 if(detail)ponyStep(C,dt)}

/* ---------- camera: behind our baseline, raised (portrait) ---------- */
var CS={x:0,z:0};
/* camera settings (tuned with the camera config tool) */
var CAM={x:0,y:10.3,z:-14.7,fov:59,lookY:.4,lookZ:2.6,followX:0,posX:0,lookX:.7,followZ:0,lookFollowZ:.6,sway:3.2,serve:0};
/* camera angles (Settings -> Camera): presets laid over the tuned base */
var CAMBASE=Object.assign({},CAM),CAMP={std:{},high:{y:15.5,z:-13.5,fov:50,lookY:0,lookZ:1.2,lookX:.5},close:{y:6.4,z:-12.4,fov:62,lookY:1,lookZ:3.6,lookX:.55},
 corner:{x:-7.2,y:11.5,z:-14.5,fov:56,lookY:.3,lookZ:.8,lookX:.2}};
function camPreset(){var k=SET.cam&&CAMP[SET.cam]?SET.cam:'std';if(k==='corner'&&SET.ctl!=='swipe')k='std';if(CAM.__k===k)return;Object.keys(CAMBASE).forEach(function(n){CAM[n]=CAMBASE[n]});Object.assign(CAM,CAMP[k]);CAM.__k=k}
/* serve cam: while a serve is being set up, the camera frames the server, then eases back to the main view once the ball is in play */
var SV={w:0,pos:new THREE.Vector3(),look:new THREE.Vector3()},CP=new THREE.Vector3(),CL=new THREE.Vector3(),CLc=new THREE.Vector3(0,.4,2.6);
function serveFrame(){var s=M.server;if(!s)return null;var sp=s.box.position,T=s.team;
 if(T===0)return {pos:new THREE.Vector3(sp.x*.55-1.2*lx(0)*0,5.2,sp.z-6.2),look:new THREE.Vector3(sp.x*.4,1.2,sp.z+7.5),fov:52};
 return {pos:new THREE.Vector3(sp.x*.3,9.4,-6.5),look:new THREE.Vector3(sp.x*.6,.8,sp.z-1.5),fov:46}}
function placeCamera(rdt,demo){camPreset();var bx=B.p.x,bz=B.p.z;CS.x+=(bx*CAM.followX-CS.x)*Math.min(1,rdt*2.6);CS.z+=(cl(bz,-9,9)*CAM.followZ-CS.z)*Math.min(1,rdt*2.2);
 var sway=demo&&!window.CAMTOOL?Math.sin(M.now*.18)*CAM.sway:0;
 var mp=CP.set(CAM.x+CS.x*CAM.posX+sway,CAM.y,CAM.z+CS.z),ml=CL.set(CS.x*CAM.lookX,CAM.lookY,CAM.lookZ+CS.z*CAM.lookFollowZ),fov=CAM.fov;
 /* serve cam weight: on from the moment the server is walking out until shortly after contact */
 var mine=M.server&&(M.server.team===0||M.mode!=='play'),want=CAM.serve&&M.state==='serve'&&mine?1:0;if(B.live&&B.lastType==='serve'&&B.side===0&&M.state==='rally'&&!B.touches&&M.now-(M.serveT||0)<.35&&(M.mode!=='play'||B.side===0))want=1;
 SV.w+=(want-SV.w)*Math.min(1,rdt*(want?2.2:1.6));var w=SV.w*SV.w*(3-2*SV.w);
 if(w>.001){var f=serveFrame();if(f){mp=mp.clone().lerp(f.pos,w);ml=ml.clone().lerp(f.look,w);fov=lerp(fov,f.fov,w)}}
 if(GLH>=1&&M.mode==='play'){fov*=.9;ml=ml.clone();ml.z-=1.6}/* taller view in swipe mode: zoom a touch and tilt down so the court fills the screen */
 cam.fov=fov;cam.position.lerp(mp,Math.min(1,rdt*6));CLc.lerp(ml,Math.min(1,rdt*6));cam.lookAt(CLc);cam.updateProjectionMatrix()}

/* ===== src/hud.js ===== */
/* ======================================================================
   HUD: timing ring, aim arcs, stamps, scorebug, controls deck
   ====================================================================== */
var ringMat,timingRing,sweet,setPath,altA,altB,tgtRing,tgtFill,trail=[],TRAILP=[];
function buildCtrl(){
 ringMat=new THREE.MeshBasicMaterial({color:'#d62828',transparent:true,opacity:.95,side:THREE.DoubleSide,depthWrite:false});
 timingRing=new THREE.Mesh(new THREE.RingGeometry(.86,1,48),ringMat);timingRing.rotation.x=-Math.PI/2;timingRing.renderOrder=5;scene.add(timingRing);
 sweet=new THREE.Mesh(new THREE.RingGeometry(.7,.78,40),new THREE.MeshBasicMaterial({color:'#1f9d55',transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false}));sweet.rotation.x=-Math.PI/2;scene.add(sweet);
 function arcLine(col){var l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,1)]),new THREE.LineDashedMaterial({color:col,dashSize:.35,gapSize:.25,transparent:true}));l.frustumCulled=false;scene.add(l);return l}
 setPath=arcLine('#d62828');altA=arcLine('#111');altB=arcLine('#111');altA.material.opacity=altB.material.opacity=.3;
 tgtRing=new THREE.Mesh(new THREE.RingGeometry(.5,.62,36),new THREE.MeshBasicMaterial({color:'#d62828',side:THREE.DoubleSide,depthWrite:false,transparent:true}));tgtRing.rotation.x=-Math.PI/2;scene.add(tgtRing);
 tgtFill=new THREE.Mesh(new THREE.CircleGeometry(.5,36),new THREE.MeshBasicMaterial({color:'#d62828',transparent:true,opacity:.2,depthWrite:false}));tgtFill.rotation.x=-Math.PI/2;scene.add(tgtFill);
 for(var i=0;i<7;i++){var tm=new THREE.Mesh(new THREE.SphereGeometry(BR*.85,6,4),new THREE.MeshBasicMaterial({color:'#111',transparent:true,opacity:0}));scene.add(tm);trail.push(tm)}}
function arcPts(l,a,b,h){var pts=[];for(var i=0;i<=30;i++){var k=i/30;pts.push(new THREE.Vector3(lerp(a.x,b.x,k),lerp(a.y,b.y,k)+Math.sin(k*Math.PI)*h,lerp(a.z,b.z,k)))}l.geometry.setFromPoints(pts);l.computeLineDistances();l.visible=true}
function tgt(x,z){tgtRing.visible=tgtFill.visible=true;tgtRing.position.set(x,.06,z);tgtFill.position.set(x,.055,z)}
function ctrlFrame(){var p=M.mode==='play'&&M.state!=='point'?activePend():null;
 timingRing.visible=sweet.visible=setPath.visible=altA.visible=altB.visible=tgtRing.visible=tgtFill.visible=false;
 var hs=M.mode==='play'&&M.state==='serve'&&M.server&&isHuman(M.server.team)&&M.serveAim;if(hs){tgt(M.serveAim.x,M.serveAim.z);tgtRing.scale.setScalar(1)}
 if(!p)return null;
 var sw=swipeMode(),a=p.actor,k=sw?(p.pressT!==null?p.k:swipeKQ(p).k):cl((M.now-p.S)/(p.C-p.S),0,1),s=stick(),w=p.w||{good:.55,perf:.8},ax=a.act?a.act.anchor.x:a.box.position.x,az=a.act?a.act.anchor.z:a.box.position.z;
 timingRing.visible=sweet.visible=true;timingRing.scale.setScalar(lerp(2.1,.45,k));timingRing.position.set(ax,.05,az);sweet.position.set(ax,.045,az);
 sweet.scale.setScalar(lerp(2.1,.45,w.perf)/.82);
 ringMat.color.set(k<w.good?'#d62828':k<w.perf?'#e8a33a':'#1f9d55');if(k>=w.perf&&!p.ticked){p.ticked=1;SFX.tick()}
 if(sw&&p.type==='set'){var pk=IN.sw&&IN.sw.end?swipePick(0,a,IN.sw):null,at=pk&&pk.at;if(at){var tp=at.kind==='dump'?new THREE.Vector3(0,0,2.2):new THREE.Vector3(at.x,3,-(at.z||1));arcPts(setPath,V3(p.cp),tp,tp.y?1.4:.9);tgt(tp.x,tp.y?tp.z:2.2);p.hint=at.kind==='dump'?'DUMP':at.p.b.name}else p.hint=null}
 else if(p.type==='set'){var f=V3(p.cp),o=attackOptions(0,a),c=setChoice(),pts={};
  ['left','right','down','up'].forEach(function(key){var at=key==='left'?o.left:key==='right'?(o.right||o.left):key==='down'?(o.quick||o.left):(o.dump||o.pipe||o.left);if(!at)return;pts[key]=at.kind==='dump'?new THREE.Vector3(0,0,2.2):new THREE.Vector3(at.x,3,-(at.z||1))});
  var cur=pts[c]||pts.left,others=Object.keys(pts).filter(function(x){return pts[x]!==cur});if(cur){arcPts(setPath,f,cur,cur.y?1.4:.9);tgt(cur.x,cur.y?cur.z:2.2)}
  if(others[0])arcPts(altA,f,pts[others[0]],1.2);if(others[1])arcPts(altB,f,pts[others[1]],1.2)}
 if(sw&&p.type==='spike'){var q0=IN.sw&&IN.sw.end&&IN.sw.end.z>.2?IN.sw.end:p.aimDef,tx0=q0?cl(q0.x,-4.1,4.1):0,tz0=q0?cl(q0.z,.8,8.8):6.5,tp0=!!q0&&tz0<2.8;arcPts(setPath,V3(p.cp),new THREE.Vector3(tx0,0,tz0),tp0?.8:.15);tgt(tx0,tz0);p.hint=tp0?'TIP':q0?'AIM':'DRAG TO AIM'}
 else if(p.type==='spike'){var tip=s.y<-.5&&Math.abs(s.x)<.6,tx=cl(-s.x*3.8,-4.1,4.1),tz=tip?1.9:6.5;arcPts(setPath,V3(p.cp),new THREE.Vector3(tx,0,tz),tip?.8:.15);tgt(tx,tz)}
 if(p.type==='serve'){p.hint=null;var sa=M.serveAim||{x:0,z:6.8};arcPts(setPath,V3(B.p),new THREE.Vector3(sa.x,0,sa.z),3);tgt(sa.x,sa.z)}
 return {p:p,k:k,w:w}}

function scr(p){var v=new THREE.Vector3(p.x,p.y,p.z).project(cam);return [(v.x*.5+.5)*hud.width,(-v.y*.5+.5)*hud.height*GLH,v.z<1]}
function txt(s,x,y,size,fill,stroke,lw,align,rot){o.save();o.translate(x,y);if(rot)o.rotate(rot);o.font=size+'px Bangers, Impact, sans-serif';o.textAlign=align||'center';o.lineJoin='round';
 if(stroke){o.lineWidth=lw;o.strokeStyle=stroke;o.strokeText(s,0,0)}o.fillStyle=fill;o.fillText(s,0,0);o.restore()}
function inkText(s,x,y,size,fill,rot){o.save();o.translate(x,y);o.rotate(rot||0);o.font=size+'px Bangers, Impact, sans-serif';o.textAlign='center';o.lineJoin='round';
 o.lineWidth=size*.36;o.strokeStyle='#111';o.strokeText(s,0,0);o.lineWidth=size*.15;o.strokeStyle='#fff';o.strokeText(s,0,0);o.fillStyle=fill==='#fff'?'#111':fill;o.fillText(s,0,0);o.restore()}
var DOTS=null;
function drawHUD(CT){var W=hud.width,H0=hud.height,H=H0*GLH,u=W/300,play=M.mode==='play';o.clearRect(0,0,W,H0);
 if(UI.screen==='team')return;
 o.save();o.beginPath();o.rect(0,0,W,H);o.clip();
 /* spike splash */
 if(M.fx&&M.now-M.fx.t0<.6&&SET.fx){var f=M.fx,e=M.now-f.t0,c=scr(f.at),cx=c[0],cy=c[1];
  if(f.sup&&e<.12){o.fillStyle='#111';o.fillRect(0,0,W,H)}
  o.strokeStyle=f.sup&&e<.12?'#fff':'#111';for(var i=0;i<90;i++){var an=i/90*6.283+Math.sin(i*3.1)*.03,r0=H*.22+((i*37)%50)*u;o.lineWidth=(1+(i%3))*u;o.beginPath();o.moveTo(cx+Math.cos(an)*r0,cy+Math.sin(an)*r0);o.lineTo(cx+Math.cos(an)*W*1.4,cy+Math.sin(an)*W*1.4);o.stroke()}
  var kk=cl(e/.12,0,1),sz=(f.sup?62:52)*u*(.6+kk*.4);o.globalAlpha=e>.45?1-(e-.45)/.15:1;
  inkText(f.sup?'SUPER PALO!!':'PALO!!',W*.5,H*(f.team===0?.3:.24),sz,f.sup?'#d62828':'#fff',-.12);o.globalAlpha=1}
 /* stamps */
 M.stamps.forEach(function(s){var c=scr(s.w),e=(M.now-s.t0)/s.dur;if(!c[2])return;o.globalAlpha=e>.7?1-(e-.7)/.3:1;var sc0=e<.12?1.35-e/.12*.35:1;
  inkText(s.txt,c[0],c[1]-e*16*u,s.size*u*sc0,s.fill,s.rot);o.globalAlpha=1});
 /* point message */
 if(M.msg&&M.state==='point'&&M.now-M.msg.t0<2.4){var e2=M.now-M.msg.t0,ours=M.msg.w===0,lab=play?(ours?'YOUR POINT!':'THEIR POINT!'):(ours?'POINT MAPAYAPA':'POINT SAN ROQUE'),k2=cl(e2/.18,0,1);
  o.save();o.translate(W/2,H*.47);o.rotate(-.06);o.scale(.7+k2*.3,.7+k2*.3);o.fillStyle=ours?'#111':'#fff';o.strokeStyle='#111';o.lineWidth=4*u;o.fillRect(-W*.42,-30*u,W*.84,44*u);o.strokeRect(-W*.42,-30*u,W*.84,44*u);
  txt(lab,0,4*u,36*u,ours?'#fff':'#111');o.font=22*u+'px Bangers';var ww=o.measureText(M.msg.why).width+20*u;o.fillStyle='#d62828';o.fillRect(-ww/2,18*u,ww,26*u);txt(M.msg.why,0,38*u,22*u,'#fff');o.restore()}
 /* set banner */
 if(M.banner&&M.now-M.banner.t0<3.2){var bk=cl((M.now-M.banner.t0)/.2,0,1);o.save();o.globalAlpha=M.now-M.banner.t0>2.8?(3.2-(M.now-M.banner.t0))/.4:1;o.translate(W/2,H*.3);o.rotate(-.05);o.scale(.8+bk*.2,.8+bk*.2);
  o.fillStyle='#111';o.fillRect(-W*.45,-34*u,W*.9,70*u);txt(M.banner.txt,0,2*u,32*u,'#fff');txt(M.banner.sub,0,26*u,13*u,'#d62828');o.restore();o.globalAlpha=1}
 /* scorebug */
 var bx=M.mode==='drill'?-9999:W-150*u,by=10*u,multi=MODES[M.modeKey].sets.length>1&&play;o.fillStyle='#111';o.fillRect(bx,by,140*u,38*u);o.fillStyle='#fff';o.fillRect(bx+70*u,by+4*u,2*u,30*u);
 txt('MPY',bx+20*u,by+16*u,11*u,'#bbb');txt('SRQ',bx+120*u,by+16*u,11*u,'#bbb');txt(String(M.score[0]),bx+46*u,by+31*u,28*u,'#fff');txt(String(M.score[1]),bx+96*u,by+31*u,28*u,'#fff');
 o.fillStyle='#fff';o.beginPath();o.arc(M.serving===0?bx+14*u:bx+126*u,by+28*u,4*u,0,6.28);o.fill();
 var yy=by+40*u;if(multi){o.fillStyle='#fff';o.fillRect(bx,yy,140*u,16*u);o.strokeStyle='#111';o.lineWidth=2*u;o.strokeRect(bx,yy,140*u,16*u);txt('SETS '+M.sets[0]+' – '+M.sets[1]+' · SET '+(M.setNo+1),bx+70*u,yy+12*u,12*u,'#111');yy+=18*u}
 var f=FORMATS[M.fmt],mp=setPoint();
 if(mp&&M.state!=='point'&&play){var last=MODES[M.modeKey].sets.length===1||[0,1].some(function(t){return M.sets[t]===Math.ceil(MODES[M.modeKey].sets.length/2)-1&&M.score[t]>M.score[1-t]});o.fillStyle='#d62828';o.fillRect(bx,yy,140*u,18*u);txt(last?'MATCH POINT':'SET POINT',bx+70*u,yy+14*u,14*u,'#fff');yy+=20*u}
 if(M.rally>=4&&M.state==='rally')txt('RALLY '+M.rally,bx+70*u,yy+14*u,15*u,'#111','#fff',4*u);
 if(play){txt(f.to+' PTS · CAP '+f.cap,10*u+44*u,by+16*u,11*u,'#111','#fff',3*u,'left');txt('TIMEOUTS '+M.tos[0],10*u+44*u,by+30*u,11*u,'#111','#fff',3*u,'left')}
 o.restore();
 /* ---- deck ---- */
 if(!DOTS||DOTS.u!==u){var pc=document.createElement('canvas'),s0=Math.round(9*u);pc.width=pc.height=s0*2;var pg=pc.getContext('2d');pg.fillStyle='#f3f1ec';pg.fillRect(0,0,s0*2,s0*2);pg.fillStyle='rgba(17,17,17,.13)';[[s0*.5,s0*.5],[s0*1.5,s0*1.5]].forEach(function(q){pg.beginPath();pg.arc(q[0],q[1],1.2*u,0,6.28);pg.fill()});DOTS={u:u,pat:o.createPattern(pc,'repeat')}}
 o.fillStyle=DOTS.pat;o.fillRect(0,H,W,H0-H);o.fillStyle='#111';o.fillRect(0,H-2*u,W,5*u);
 var DT=H,DH=H0-H;if(GLH>=1&&play){DT=H0-100*u;DH=100*u}
 if(M.mode==='drill'){drillDeck(o,W,u,DT,DH);return}
 if(!play){txt('PALO!',W/2,DT+DH*.55,56*u,'#111','#d62828',0);return}
 var act=CT?CT.p:null,k=CT?CT.k:0,w=CT?CT.w:{good:.55,perf:.8},green=act&&k>=w.perf,nxt=act||nextHumanPend(),s=stick();
 var pr='';if(act)pr={serve:'SERVE! stick aims · press on green',block:'BLOCK! jump on green',bump:'PASS! press on green',set:'SET! stick picks the hitter',spike:M.hype>=100?'SUPER SPIKE! press on green':'SPIKE! stick aims · press on green'}[act.type];
 if(act&&swipeMode())pr={serve:'SERVE! release on the small ring',block:'BLOCK! tap on small',bump:'PASS! tap on small',set:'SET! swipe to a hitter',spike:M.hype>=100?'SUPER SPIKE! swipe to aim':'SPIKE! swipe to aim'}[act.type];
 else if(M.state==='serve'&&M.server&&isHuman(M.server.team))pr=M.serveQ?'GET READY…':swipeMode()?'TOUCH TO SERVE':'AIM · TAP TO SERVE';
 else if(M.state==='point')pr=M.msg&&M.msg.w===0?'NICE!':'SHAKE IT OFF';else if(nxt)pr='GET READY…';else if(M.state==='serve'&&M.serving===1)pr='RECEIVE';else if(B.live&&B.p.z>0)pr='DEFEND!';
 if(pr){o.font=20*u+'px Bangers, Impact';var tw=o.measureText(pr).width+28*u;o.fillStyle=act?'#111':'#fff';o.strokeStyle='#111';o.lineWidth=3*u;o.fillRect(W/2-tw/2,DT+12*u,tw,30*u);o.strokeRect(W/2-tw/2,DT+12*u,tw,30*u);txt(pr,W/2,DT+34*u,20*u,act?'#fff':'#111')}
 if(act&&!swipeMode()){var who=act.actor.b.name+' #'+act.actor.b.num;txt(who,W/2,DT+56*u,13*u,'#555')}
 if(swipeMode()){var hint=act?(act.hint||{serve:'DRAG TO AIM · LET GO ON SMALL',block:'TAP ON SMALL',bump:'TAP ON SMALL',set:'DRAG TO A TEAMMATE',spike:'DRAG WHERE IT GOES'}[act.type]):'';
  if(hint)txt(hint,W/2,DT+56*u,16*u,'#d62828','#fff',4*u);
  if(IN.tr&&IN.tr.length){var tn2=performance.now()/1000;while(IN.tr.length&&tn2-IN.tr[0].t>.35)IN.tr.shift();var tr=IN.tr;o.lineCap='round';
   for(var ti=1;ti<tr.length;ti++){var ag=1-(tn2-tr[ti].t)/.35,c0=scr({x:tr[ti-1].x,y:0,z:tr[ti-1].z}),c1=scr({x:tr[ti].x,y:0,z:tr[ti].z});o.strokeStyle='rgba(214,40,40,'+(.9*ag).toFixed(2)+')';o.lineWidth=(2+9*ag)*u;o.beginPath();o.moveTo(c0[0],c0[1]);o.lineTo(c1[0],c1[1]);o.stroke()}}
  var hw0=W*.42,hx0=W/2-hw0/2,hy0=DT+DH-26*u;txt('HYPE',hx0-6*u,hy0+9*u,13*u,'#111',null,0,'right');
  o.fillStyle='#fff';o.fillRect(hx0,hy0,hw0,11*u);o.fillStyle=M.hype>=100?(Math.sin(M.now*12)>0?'#d62828':'#111'):'#111';o.fillRect(hx0,hy0,hw0*M.hype/100,11*u);o.strokeStyle='#111';o.lineWidth=2*u;o.strokeRect(hx0,hy0,hw0,11*u);
  if(act&&green&&SET.fx){var c3=scr(headW(act.actor));inkText('NOW!',c3[0],c3[1],24*u,'#1f9d55',-.06)}
  return}
 /* stick */
 var dpr=W/hud.getBoundingClientRect().width||1,jx=IN.touch?IN.touch.ox*dpr:W*.25,jy=IN.touch?IN.touch.oy*dpr:DT+DH*.6;
 o.fillStyle='rgba(255,255,255,.9)';o.strokeStyle='#111';o.lineWidth=3*u;o.beginPath();o.arc(jx,jy,44*u,0,6.28);o.fill();o.stroke();
 o.setLineDash([4*u,5*u]);o.beginPath();o.moveTo(jx-44*u,jy);o.lineTo(jx+44*u,jy);o.moveTo(jx,jy-44*u);o.lineTo(jx,jy+44*u);o.lineWidth=1.5*u;o.stroke();o.setLineDash([]);
 var aimT=act&&(act.type==='set'||act.type==='spike'||act.type==='serve');
 o.fillStyle='#fff';o.strokeStyle=aimT?'#d62828':'#111';o.lineWidth=3.5*u;o.beginPath();o.arc(jx+s.x*24*u,jy+s.y*24*u,20*u,0,6.28);o.fill();o.stroke();
 var al=null;if(act){if(act.type==='set'){var op=attackOptions(0,act.actor),c=setChoice(),at=c==='left'?op.left:c==='right'?(op.right||op.left):c==='down'?(op.quick||op.left):(op.dump||op.pipe||op.left);al=at?(at.kind==='dump'?'DUMP':(at.kind==='quick'?'QUICK: ':at.kind==='back'?'BACK ROW: ':c==='right'?'RIGHT: ':'LEFT: ')+at.p.b.name):'SET'}
  else if(act.type==='spike')al=s.y<-.5&&Math.abs(s.x)<.6?'AIM: TIP':s.x<-.35?'AIM: LEFT':s.x>.35?'AIM: RIGHT':'AIM: MIDDLE';
  else if(act.type==='serve')al=(s.x<-.35?'LEFT':s.x>.35?'RIGHT':'MIDDLE')+' · '+({jumpserve:'JUMP',topspin:'TOPSPIN',jumpfloat:'JUMP FLOAT',serve:'FLOAT',underhand:'UNDERHAND',skyball:'SKY BALL'}[act.clip]||'')}
 txt(al||'AIM',jx,jy-54*u,(al&&al.length>14?14:17)*u,al?'#d62828':'#888');
 /* button */
 var bxp=W*.75,byp=DT+DH*.6,BRr=46*u,sup=M.hype>=100&&act&&act.type==='spike',lab=act?(act.type==='bump'?'PASS':act.type.toUpperCase()):nxt?(nxt.type==='bump'?'PASS':nxt.type.toUpperCase()):'READY';if(sup)lab='SUPER';if(!act&&M.state==='serve'&&M.server&&isHuman(M.server.team))lab='SERVE';
 o.fillStyle=green?'#1f9d55':sup?'#d62828':'#fff';o.strokeStyle='#111';o.lineWidth=4*u;o.beginPath();o.arc(bxp,byp,BRr,0,6.28);o.fill();o.stroke();
 if(act){o.strokeStyle=k<w.good?'#d62828':k<w.perf?'#e8a33a':'#1f9d55';o.lineWidth=5*u;o.beginPath();o.arc(bxp,byp,BRr+lerp(24,5,k)*u,0,6.28);o.stroke()}
 txt(lab,bxp,byp+8*u,(lab.length>5?21:27)*u,green||sup?'#fff':act?'#111':'#999');
 if(act&&green&&SET.fx){var c2=scr(headW(act.actor));inkText('NOW!',c2[0],c2[1],24*u,'#1f9d55',-.06)}
 /* hype meter */
 var hw=W*.42,hx=W/2-hw/2,hy=DT+DH-26*u;txt('HYPE',hx-6*u,hy+9*u,13*u,'#111',null,0,'right');
 o.fillStyle='#fff';o.fillRect(hx,hy,hw,11*u);o.fillStyle=M.hype>=100?(Math.sin(M.now*12)>0?'#d62828':'#111'):'#111';o.fillRect(hx,hy,hw*M.hype/100,11*u);o.strokeStyle='#111';o.lineWidth=2*u;o.strokeRect(hx,hy,hw,11*u);
 for(var hi=1;hi<5;hi++){o.fillStyle='#f3f1ec';o.fillRect(hx+hw*hi/5-u,hy,2*u,11*u)}}

/* ===== src/ui.js ===== */
/* ======================================================================
   SCREENS: title, mode select, My Team, settings, pause, game over
   ====================================================================== */
var UI={screen:'sTitle'};
function show(id){UI.screen=id==='sTeam'?'team':id;document.querySelectorAll('.scr').forEach(function(s){s.classList.toggle('hide',s.id!==id)});
 var g=id==='sTeam'?.44:id==='sPause'?GLH:DECK;if(g!==GLH){GLH=g;size()}if(id==='sTeam')teamOpen()}
function deckFor(drill){return SET.ctl==='swipe'&&!drill?1:DECK}
function hideScreens(drill){UI.screen='game';document.querySelectorAll('.scr').forEach(function(s){s.classList.add('hide')});var g=deckFor(drill);if(GLH!==g){GLH=g;size()}}
function startMatch(modeKey){hideScreens();$('#pauseBtn').style.display='block';resetMatch('play',modeKey||M.modeKey);autoQ.start()}
function togglePause(){if(M.mode!=='play'&&M.mode!=='drill')return;M.paused=!M.paused;if(M.paused){show('sPause');$('#toBtn').hidden=M.mode==='drill';$('#toBtn').textContent='Timeout ('+M.tos[0]+' left)';$('#toBtn').disabled=!(M.tos[0]>0&&M.state!=='rally')}else hideScreens()}
document.querySelectorAll('[data-go]').forEach(function(b){b.addEventListener('click',function(){SFX.click();show(b.dataset.go)})});
document.querySelectorAll('[data-act]').forEach(function(b){b.addEventListener('click',function(){ac();SFX.click();var a=b.dataset.act;
 if(a==='quick'||a==='exhib'||a==='liga')startMatch(a);else if(a==='restart'){if(M.mode==='drill')startDrill();else startMatch()}else if(a==='resume')togglePause();
 else if(a==='timeout'){if(M.tos[0]>0&&M.state!=='rally'){M.tos[0]--;M.timeoutT=1;M.state='point';M.pointT=M.now;M.nextT=M.now+4.2;M.msg=null;assignPost(1);[0].forEach(function(){onCourt(0).forEach(function(p,i){var a2=i/6*Math.PI*2;p.post={clip:'huddle',x:Math.cos(a2)*.8,z:-4.6+Math.sin(a2)*.8,faceP:new THREE.Vector3(0,0,-4.6),look:new THREE.Vector3(0,.2,-4.6),wander:0,ph:i,lookOn:true}})});stamp('TIMEOUT · MAPAYAPA',{x:0,y:3,z:-3},{size:26,dur:1.6})}togglePause()}
 else if(a==='quit'&&M.mode==='drill'){endDrill()}
 else if(a==='quit'){$('#pauseBtn').style.display='none';resetMatch('demo');show('sTitle')}})});
/* settings segments */
function markSeg(sg){var key=sg.dataset.set;sg.querySelectorAll('button').forEach(function(b){b.classList.toggle('on',String(SET[key])===b.dataset.v)})}
document.querySelectorAll('.seg[data-set]').forEach(function(sg){var key=sg.dataset.set;
 sg.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){var v=b.dataset.v;SET[key]=isNaN(+v)?v:+v;if(key==='ctl'&&UI.screen==='game'){var g0=deckFor(M.mode==='drill');if(GLH!==g0){GLH=g0;size()}}if(key==='gfx'&&v!=='auto')applyPreset(v);if(key!=='gfx'&&/res|fps|outl|venue|detail|fx/.test(key))SET.gfx='custom';saveSet();applyGfx();document.querySelectorAll('.seg[data-set]').forEach(markSeg);SFX.click()})});markSeg(sg)});
$('#pauseBtn').addEventListener('click',togglePause);
document.addEventListener('visibilitychange',function(){if(document.hidden&&M.mode==='play'&&!M.paused)togglePause()});
window.onAndroidBack=function(){var vis=[].filter.call(document.querySelectorAll('.scr'),function(s){return !s.classList.contains('hide')})[0];
 if(M.mode==='play'&&!vis){togglePause();return true}if(M.mode==='play'&&vis&&vis.id==='sPause'){togglePause();return true}if(vis&&vis.id!=='sTitle'){show('sTitle');return true}return false};

/* ---------- graphics settings ---------- */
var PRESETS={low:{res:.75,fps:30,outl:1,venue:0,detail:1,fx:0},medium:{res:1,fps:60,outl:1,venue:1,detail:1,fx:1},high:{res:1.25,fps:60,outl:1,venue:1,detail:2,fx:1}};
function applyPreset(n){var p=PRESETS[n];if(!p)return;for(var k in p)SET[k]=p[k];SET.gfx=n}
function applyGfx(){venue.visible=!!SET.venue;floor.visible=!SET.venue;var q=rigQ(0);if(PL.length&&UI.rq!==q){UI.rq=q;PL.forEach(function(p){rebuildPlayer(p,p.b)})}UI.rq=q;setOutlines(!!SET.outl);size()}
var autoQ={t0:0,n:0,on:false,start:function(){if(SET.gfx!=='auto'){this.on=false;return}this.on=true;this.t0=performance.now();this.n=0;this.skip=20},
 tick:function(){if(!this.on)return;if(this.skip>0){this.skip--;this.t0=performance.now();return}this.n++;var e=(performance.now()-this.t0)/1000;if(e>4){var fps=this.n/e;this.on=false;applyPreset(fps<34?'low':fps<52?'medium':'high');SET.gfx='auto';applyGfx();document.querySelectorAll('.seg[data-set]').forEach(markSeg);UI.autoMsg='Auto quality: '+(fps<34?'Low':fps<52?'Medium':'High')+' ('+Math.round(fps)+' fps)'}}};

/* ---------- input ---------- */
function pt(e){var r=hud.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,px:e.clientX-r.left,py:e.clientY-r.top,w:r.width,h:r.height}}
function swFloor(e){var p=pt(e);return floorAt(p.x*2-1,-(2*Math.min(p.y,GLH-.002)/GLH-1))}
hud.addEventListener('pointerdown',function(e){var p=pt(e);e.preventDefault();ac();
 if(swipeMode()&&!M.paused){try{hud.setPointerCapture(e.pointerId)}catch(_){}swipeStart(e);swipeMove(swFloor(e));return}
 var btn=function(){if(M.mode==='drill'){IN.btn=e.pointerId;try{hud.setPointerCapture(e.pointerId)}catch(_){}drillBtn(1)}else press()};
 if(p.y>GLH){if(p.x<.5){IN.touch={id:e.pointerId,ox:cl(p.px,p.w*.12,p.w*.4),oy:cl(p.py,p.h*(GLH+.08),p.h*.92)};IN.tx=IN.ty=0;try{hud.setPointerCapture(e.pointerId)}catch(_){};move(e)}else btn()}
 else btn()});
function move(e){if(IN.sw&&e.pointerId===IN.sw.id){swipeMove(swFloor(e));return}if(!IN.touch||e.pointerId!==IN.touch.id)return;var p=pt(e),r=44*p.w/300,dx=(p.px-IN.touch.ox)/r,dy=(p.py-IN.touch.oy)/r,m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m}IN.tx=dx;IN.ty=dy}
hud.addEventListener('pointermove',move);
function up(e){if(IN.sw&&e.pointerId===IN.sw.id){swipeMove(swFloor(e));swipeEnd(e);return}if(IN.touch&&e.pointerId===IN.touch.id){IN.touch=null;IN.tx=IN.ty=0}if(IN.btn!=null&&e.pointerId===IN.btn){IN.btn=null;drillBtn(0)}}
hud.addEventListener('pointerup',up);hud.addEventListener('pointercancel',up);
/* phones can lose the pointerup of a long hold (long-press handling, capture quirks): also watch window + touch events */
addEventListener('pointerup',up);addEventListener('pointercancel',up);
function touchUp(e){var r=hud.getBoundingClientRect(),L=false,Rt=false;for(var i=0;i<e.touches.length;i++){var t=e.touches[i],x=(t.clientX-r.left)/r.width,y=(t.clientY-r.top)/r.height;if(y>GLH&&x<.6)L=true;if(x>=.5||y<=GLH)Rt=true}
 if(IN.touch&&!L){IN.touch=null;IN.tx=IN.ty=0}if(M.mode==='drill'&&IN.btn!=null&&!Rt){IN.btn=null;drillBtn(0)}}
addEventListener('touchend',touchUp,{passive:true});addEventListener('touchcancel',touchUp,{passive:true});
hud.addEventListener('contextmenu',function(e){e.preventDefault()});hud.addEventListener('lostpointercapture',up);
addEventListener('keydown',function(e){if(e.target&&/INPUT/.test(e.target.tagName))return;if(e.code==='Escape'||e.code==='KeyP'){togglePause();return}
 if(e.code==='Space'||e.code==='KeyJ'||e.code==='KeyK'||e.code==='Enter'){if(!e.repeat){if(M.mode==='drill'){IN.keyBtn=true;drillBtn(1)}else press()}e.preventDefault();return}IN.keys[e.code]=true;if(/Arrow/.test(e.code))e.preventDefault()});
addEventListener('keyup',function(e){IN.keys[e.code]=false;if(M.mode==='drill'&&/Space|KeyJ|KeyK|Enter/.test(e.code)){IN.keyBtn=false;drillBtn(0)}});
addEventListener('blur',function(){IN.keys={};IN.keyBtn=false;if(M.mode==='drill'&&IN.btn!=null){IN.btn=null;drillBtn(0)}});

/* ======================================================================
   MY TEAM (cosmetics, kit, attributes) with a live 3D preview
   ====================================================================== */
var pScene=new THREE.Scene();pScene.add(new THREE.HemisphereLight('#ffffff','#9a9a9a',.72));var pdl=new THREE.DirectionalLight('#ffffff',.72);pdl.position.set(-4,8,5);pScene.add(pdl);
(function(){var f=new THREE.Mesh(new THREE.CircleGeometry(2.2,40),new THREE.MeshBasicMaterial({color:'#ebe7df'}));f.rotation.x=-Math.PI/2;pScene.add(f);var r=new THREE.Mesh(new THREE.RingGeometry(2.17,2.22,48),INK);r.rotation.x=-Math.PI/2;r.position.y=.002;pScene.add(r)})();
function curB(){return TM.mode==='career'?CAREER.look:BODIES[TM.sel]}
var TM={mode:'team',sel:0,view:'face',pose:'idle',yaw:-20,t:0,C:null,B:{},drag:null,tab:'look'};
var SHOECOLS=[['Kit',''],['White','#ffffff'],['Black','#1c1c1c'],['Gray','#8a8a8a'],['Red','#d62828'],['Orange','#e8762c'],['Yellow','#e9c23a'],['Green','#2e9d5b'],['Blue','#2f62d8'],['Purple','#7a45c2'],['Pink','#e0569a']];
var OPT={shoeCut:[['low','Low-top'],['mid','Mid-top'],['high','High-top']],hair:[['pony','Ponytail'],['bun','Bun'],['bob','Bob'],['twin','Twin tails'],['long','Long'],['spike','Spiky'],['mohawk','Mohawk'],['messy','Messy'],['buzz','Buzz']],
 eyes:[['round','Dot'],['big','Shiny'],['sharp','Sharp'],['sleepy','Sleepy'],['toon','Wide'],['wink','Wink'],['angry','Angry'],['determined','Focused'],['bored','Bored'],['tired','Tired'],['sad','Sad'],['teary','Teary'],['shocked','Shocked'],['suspicious','Suspicious'],['happy','Happy'],['closed','Closed'],['dizzy','Dizzy']],brows:[['normal','Normal'],['angry','Fierce'],['worried','Worried'],['thick','Thick']],mouth:[['line','Line'],['smile','Smile'],['cat','Cat'],['frown','Frown'],['grin','Toothy grin'],['smirk','Smirk'],['gritted','Gritted'],['nervous','Nervous'],['laugh','Laugh'],['shout','Shout'],['scream','Scream']],
 gear:[['headband','Headband'],['wrist','Wristbands'],['sleeves','Full arm sleeves'],['forearm','Forearm sleeves'],['pads','Knee pads'],['glasses','Sports glasses'],['plaster','Cheek plaster'],['ankle','Ankle braces']]};
function previewBuild(){if(TM.C){destroyChar(TM.C);pScene.remove(TM.C.root);pScene.remove(TM.C.shadow);if(TM.C.pony)pScene.remove(TM.C.pony.meshes)}
 RIGQ=Math.max(.75,rigQ(0));var C=buildChar(curB());applyKit(C);scene.remove(C.shadow);if(C.pony){scene.remove(C.pony.meshes);pScene.add(C.pony.meshes)}pScene.add(C.root);pScene.add(C.shadow);TM.C=C;TM.B={}}
function teamB(){var id=TM.mode==="career"&&TM.pose==="idle"?"stand":TM.pose;if(!TM.B[id])TM.B[id]=bake(TM.C,clipById(id));return TM.B[id]}
function teamOpen(){if(!TM.C)previewBuild();renderRoster()}
function rebuildMine(i){if(TM.mode==='career'){saveCareer();previewBuild();renderRoster();return}var b=BODIES[i];saveTeam();previewBuild();var p=TEAM[0].filter(function(q){return q.b.id===b.id})[0];if(p)rebuildPlayer(p,b);renderRoster()}
function renderRoster(){var car=TM.mode==='career';if($('#attrs').parentNode.id!=='tp_attr')$('#tp_attr').appendChild($('#attrs'));$('#crPanel').hidden=!car;['#roster','#tTabsRow','.tform','#teamNote'].forEach(function(q){$(q).hidden=car});$('#tNext').hidden=true;$('#tBack').dataset.back=car?(CAREER.created?'sCareer':'sMode'):'sTitle';if(car){renderCreator();return}document.querySelectorAll('#tView button').forEach(function(y){y.classList.toggle('on',y.dataset.v===TM.view)});$('#roster').innerHTML=BODIES.map(function(b,i){return '<button class="chip'+(i===TM.sel?' on':'')+'" data-i="'+i+'">'+b.name+' #'+b.num+'<small>'+b.pos+'</small></button>'}).join('');
 document.querySelectorAll('#tTabs button').forEach(function(x){x.classList.toggle('on',x.dataset.v===TM.tab)});document.querySelectorAll('.tpage').forEach(function(pg){pg.hidden=pg.id!=='tp_'+TM.tab});renderForm();renderKit();renderAttrs()}
function renderForm(){var b=curB();$('#fName').value=b.name;$('#fNum').value=b.num;$('#tRole').textContent=b.role;
 document.querySelectorAll('.tform .opts[data-k]').forEach(function(el){var k=el.dataset.k,html='';
  if(k==='hairC')html=HAIRC.map(function(c,i){return '<button aria-label="Hair colour '+(i+1)+'" style="background:'+c+'" data-v="'+i+'" class="'+((b.hairC||0)===i?'on':'')+'"></button>'}).join('');
  else if(k==='shoeCol')html=SHOECOLS.map(function(c){var cur=b.shoeCol||'';return '<button aria-label="'+c[0]+' shoes" title="'+c[0]+'" style="background:'+(c[1]||'repeating-linear-gradient(45deg,#fff 0 4px,#111 4px 8px)')+'" data-v="'+c[1]+'" class="'+(cur===c[1]?'on':'')+'"></button>'}).join('');
  else if(k==='skin')html=SKINS.map(function(c,i){return '<button aria-label="Skin tone '+(i+1)+'" style="background:'+c+'" data-v="'+i+'" class="'+((b.skin||0)===i?'on':'')+'"></button>'}).join('');
  else if(k==='gear')html=OPT.gear.map(function(o){var on=o[0]==='pads'?b.pads:o[0]==='sleeves'?b.sleeves:(b.acc||{})[o[0]];return '<button data-v="'+o[0]+'" class="'+(on?'on':'')+'">'+o[1]+'</button>'}).join('');
  else html=OPT[k].map(function(o){var cur=b[k]||OPT[k][0][0];return '<button data-v="'+o[0]+'" class="'+(cur===o[0]?'on':'')+'">'+o[1]+'</button>'}).join('');
  el.innerHTML=html})}
$('#roster').addEventListener('click',function(e){var x=e.target.closest('button');if(!x)return;TM.sel=+x.dataset.i;previewBuild();renderRoster();SFX.click()});
$('#tTabs').addEventListener('click',function(e){var x=e.target.closest('button');if(!x)return;TM.tab=x.dataset.v;if(TM.tab==='attr'||TM.tab==='kit')TM.view='body';renderRoster();SFX.click()});
document.querySelector('.tform').addEventListener('click',function(e){var x=e.target.closest('.opts[data-k] button');if(!x)return;var k=x.parentNode.dataset.k,b=curB(),v=x.dataset.v;
 if(k==='gear'){if(v==='pads')b.pads=b.pads?0:1;else if(v==='sleeves')b.sleeves=b.sleeves?0:1;else{b.acc=Object.assign({},b.acc);b.acc[v]=b.acc[v]?0:1}}
 else if(k==='hairC'||k==='skin')b[k]=+v;else if(k==='shoeCol')b.shoeCol=v||null;else b[k]=v;if(k==='shoeCut'||k==='shoeCol')TM.view='feet';else if(k!=='gear')TM.view='face';rebuildMine(TM.sel)});
var nameT;$('#fName').addEventListener('input',function(){var v=this.value.replace(/[<>&"]/g,'').slice(0,12);if(!v.trim())return;curB().name=v;clearTimeout(nameT);nameT=setTimeout(function(){rebuildMine(TM.sel)},300)});
$('#fNum').addEventListener('change',function(){var n=cl(Math.round(+this.value||0),0,99);this.value=n;curB().num=n;rebuildMine(TM.sel)});
$('#tView').addEventListener('click',function(e){var x=e.target.closest('button');if(!x)return;TM.view=x.dataset.v;document.querySelectorAll('#tView button').forEach(function(y){y.classList.toggle('on',y===x)})});
$('#tPose').addEventListener('click',function(e){var x=e.target.closest('button');if(!x)return;TM.pose=x.dataset.v;TM.t=0;document.querySelectorAll('#tPose button').forEach(function(y){y.classList.toggle('on',y===x)});if(TM.C.pony)TM.C.pony.init=false});
$('#tRand').addEventListener('click',function(){var b=curB(),pk=function(a){return a[Math.floor(Math.random()*a.length)][0]};b.hair=pk(OPT.hair);b.eyes=pk(OPT.eyes);b.brows=pk(OPT.brows);b.mouth=pk(OPT.mouth);b.hairC=Math.random()<.5?0:Math.floor(Math.random()*HAIRC.length);b.skin=Math.floor(Math.random()*4);
 b.acc={};['headband','wrist','glasses','plaster','ankle'].forEach(function(g){if(Math.random()<.3)b.acc[g]=1});b.shoeCut=pk(OPT.shoeCut);b.shoeCol=Math.random()<.5?null:pick(SHOECOLS.slice(1))[1];rebuildMine(TM.sel)});
$('#tReset').addEventListener('click',function(){if(TM.mode==='career'){careerResetLook();return}var b=curB(),d=DEFAULTS[b.id];FIELDS.forEach(function(f){if(f!=='stats'&&f!=='sp')b[f]=d[f]===null?(f==='shoeCol'?null:b[f]):JSON.parse(JSON.stringify(d[f]))});rebuildMine(TM.sel)});
/* team kit accent */
var KSEL=0;
function renderKit(){var K=KITSET[KSEL],h='<h4>Team kit <small>uniform accent colour</small></h4>';
 h+='<div class="row"><div class="seg" id="kitTeam"><button data-v="0" class="'+(KSEL===0?'on':'')+'">Mapayapa</button><button data-v="1" class="'+(KSEL===1?'on':'')+'">San Roque</button></div></div>';
 h+='<div class="row"><span class="lbl">Accent</span><div class="opts sw" id="kitCol"><button data-v="none" class="'+(K.on?'':'on')+'" aria-label="No accent" style="background:'+(KSEL?'#1c1c1c':'#fff')+';color:'+(KSEL?'#fff':'#111')+'">∅</button>'+
  ACCOLS.map(function(c){return '<button data-v="'+c[1]+'" aria-label="'+c[0]+'" title="'+c[0]+'" style="background:'+c[1]+'" class="'+(K.on&&K.col===c[1]?'on':'')+'"></button>'}).join('')+'</div></div>';
 h+='<div class="row"><span class="lbl">Applies to</span><div class="opts" id="kitParts">'+[['trim','Collar + hem'],['num','Numbers'],['shorts','Shorts'],['gear','Pads + sleeves']].map(function(p){return '<button data-v="'+p[0]+'" class="'+(K.parts[p[0]]?'on':'')+'">'+p[1]+'</button>'}).join('')+'</div></div>';
 $('#kitPanel').innerHTML=h}
$('#kitPanel').addEventListener('click',function(e){var x=e.target.closest('button');if(!x)return;var K=KITSET[KSEL];
 if(x.parentNode.id==='kitTeam')KSEL=+x.dataset.v;else if(x.parentNode.id==='kitCol'){if(x.dataset.v==='none')K.on=0;else{K.on=1;K.col=x.dataset.v}}else if(x.parentNode.id==='kitParts'){K.parts[x.dataset.v]=K.parts[x.dataset.v]?0:1;K.on=1}
 saveKit();ALL.forEach(applyKit);renderKit();SFX.click()});
/* attributes (2K-style chevrons) */
function renderAttrs(){var b=curB(),cap=TM.mode==='career'?POSCAPS[CAREER.pos]||{}:CAPS[b.id]||{},sts=b.stats,ovr=0;STATS.forEach(function(k){ovr+=sts[k[0]]});ovr=Math.round(ovr/STATS.length*10);
 var h='<h4>Attributes · '+b.name+' <small>OVR '+ovr+' · '+b.sp+' skill points</small></h4>';
 STATS.forEach(function(k){var v=sts[k[0]],c=cap[k[0]]||10,n=Math.round(v*2),cn=Math.round(c*2),ch='';
  for(var i=0;i<20;i++)ch+='<i class="chev'+(i<n?' f':i===n&&n<cn&&b.sp>0?' n':i>=cn?' cap':'')+'"></i>';if(c<10)ch+='<span class="cap-m" title="Position cap">›</span>';
  h+='<div class="arow"><span class="an">'+k[1]+'</span><div class="chevs" aria-label="'+k[1]+' '+v+' of 10">'+ch+'</div><span class="av">'+v.toFixed(1).replace('.0','')+'</span><span class="pm"><button data-k="'+k[0]+'" data-d="-1" aria-label="Lower '+k[1]+'"'+(v<=1?' disabled':'')+'>−</button><button data-k="'+k[0]+'" data-d="1" aria-label="Raise '+k[1]+'"'+(v>=c||b.sp<=0?' disabled':'')+'>+</button></span></div>';
  if(UNLOCK[k[0]])h+='<div class="unl">'+UNLOCK[k[0]].map(function(u){var ok=v>=u[0];return '<span class="'+(ok?'':'lk')+'">'+(ok?'':'🔒 ')+u[1]+(ok?'':' · '+u[0])+'</span>'}).join('')+'</div>'});
 h+='<div class="row" style="justify-content:flex-end"><button class="chip" id="spReset">Reset attributes</button></div>';$('#attrs').innerHTML=h}
$('#attrs').addEventListener('click',function(e){var x=e.target.closest('button');if(!x)return;var b=curB();
 if(x.id==='spReset'){if(TM.mode==='career'){careerResetStats()}else{b.stats=Object.assign({},BASE_STATS[b.id]);b.sp=SP_START;saveTeam()}renderAttrs();return}
 var k=x.dataset.k,d=+x.dataset.d,c=(TM.mode==='career'?POSCAPS[CAREER.pos]||{}:CAPS[b.id]||{})[k]||10,v=b.stats[k];
 if(d>0&&b.sp>0&&v<c){b.stats[k]=Math.min(c,v+.5);b.sp--}else if(d<0&&v>1){b.stats[k]=v-.5;b.sp++}b.stats=Object.assign({},b.stats);if(TM.mode==='career')saveCareer();else saveTeam();renderAttrs();SFX.click()});
/* drag to spin the preview */
$('#teamTop').addEventListener('pointerdown',function(e){if(e.target.closest('button'))return;TM.drag={x:e.clientX,yaw:TM.yaw};try{this.setPointerCapture(e.pointerId)}catch(_){}});
$('#teamTop').addEventListener('pointermove',function(e){if(TM.drag)TM.yaw=TM.drag.yaw-(e.clientX-TM.drag.x)*.5});
['pointerup','pointercancel'].forEach(function(ev){$('#teamTop').addEventListener(ev,function(){TM.drag=null})});
function renderTeamPreview(dt){var C=TM.C;if(!C)return;var B=teamB();TM.t=(TM.t+dt)%(B.dur+(B.clip.loop?0:.6));evalB(C,B,Math.min(TM.t,B.dur));C.root.position.x=0;C.root.position.z=0;C.root.updateMatrixWorld(true);
 C.shadow.position.set(0,.004,0);ponyStep(C,dt);
 var face=TM.view==='face',feet=TM.view==='feet',tg;C.J.head.getWorldPosition(tmpV);
 if(face)tg=tmpV.clone().add(new THREE.Vector3(0,.09,0));else if(feet)tg=new THREE.Vector3(0,.16,.05);else tg=new THREE.Vector3(0,C.H*.5+Math.max(0,C.J.pelvis.position.y-C.standHip),0);
 var pt=(face?4:feet?14:8),dt2=face?1.0:feet?1.7:C.H*2.3,now=performance.now();if(!TM.tgt||TM.lv==null){TM.tgt=tg.clone();TM.cp=pt;TM.cd=dt2;TM.lv=TM.view}
 if(TM.view!==TM.lv){TM.lv=TM.view;TM.fr={t:TM.tgt.clone(),p:TM.cp,d:TM.cd};TM.tw0=now}
 var u=TM.fr?cl((now-TM.tw0)/550,0,1):1;u=u*u*(3-2*u);if(u>=1)TM.fr=null;
 if(TM.fr){TM.tgt.copy(TM.fr.t).lerp(tg,u);TM.cp=TM.fr.p+(pt-TM.fr.p)*u;TM.cd=TM.fr.d+(dt2-TM.fr.d)*u}else{TM.tgt.copy(tg);TM.cp=pt;TM.cd=dt2}var yaw=TM.yaw*D2R,pit=TM.cp*D2R,dist=TM.cd;
 cam.fov=30;cam.position.set(TM.tgt.x+Math.sin(yaw)*Math.cos(pit)*dist,TM.tgt.y+Math.sin(pit)*dist,TM.tgt.z+Math.cos(yaw)*Math.cos(pit)*dist);cam.lookAt(TM.tgt);cam.updateProjectionMatrix();R.render(pScene,cam)}

/* ---------- version + over-the-air updates (Android shell) ---------- */
function updInfo(){try{return window.AndroidApp&&AndroidApp.updateInfo?JSON.parse(AndroidApp.updateInfo()):null}catch(e){return null}}
function renderVersion(){var i=updInfo(),el=$('#verLine'),msg='v'+GAME_VERSION+' · build '+GAME_BUILD;
 if(i){var st=i.status||'';if(/^ready/.test(st)&&UI.screen==='sTitle'&&M.mode!=='play'){var n0=$('#updNote');if(n0.classList.contains('hide'))SFX.dialog();n0.innerHTML='<b>Update downloaded.</b> <button class="chip" id="rsNow">Restart now</button>';n0.classList.remove('hide');$('#rsNow').onclick=function(){try{AndroidApp.restartGame()}catch(e){}};el.textContent='v'+GAME_VERSION+' · build '+GAME_BUILD;return}msg+=st==='latest'?' · up to date':/^ready/.test(st)?' · update ready, restart the game':st==='downloading'?' · downloading update…':st==='offline'?' · offline':''}
 el.textContent=msg;
 var n=$('#updNote');n.classList.add('hide');if(!i)return;
 if(/^updated/.test(i.note)){n.innerHTML='<b>Updated to v'+GAME_VERSION+'!</b>';n.classList.remove('hide');setTimeout(function(){try{AndroidApp.clearNote()}catch(e){}},4000)}
 else if(/^rolledback/.test(i.note)){n.innerHTML='An update failed to start, so the previous version is back.';n.classList.remove('hide');try{AndroidApp.clearNote()}catch(e){}}
 if(i.shellUrl){n.innerHTML=(i.shellNeeded?'<b>Please update the app</b> to get the latest game.':'A new app version is available.')+' <button class="chip" id="getApk">Download</button>';n.classList.remove('hide');$('#getApk').onclick=function(){try{AndroidApp.openUrl(i.shellUrl)}catch(e){}}}}
renderVersion();setTimeout(renderVersion,6000);setTimeout(renderVersion,20000);
try{if(window.AndroidApp&&AndroidApp.gameReady)AndroidApp.gameReady()}catch(e){}

/* ---------- player profile (first launch) + the MyLiga jersey ---------- */
var PROFILE=null;try{PROFILE=JSON.parse(localStorage.getItem('palo.profile.v1')||'null')}catch(e){}
function jerseySVG(name,num){var n=String(name||'').toUpperCase().slice(0,10),fs=n.length>7?11:n.length>5?13:15,x=String(num==null||num===''?'':num);
 return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M30 10l-24 14 9 20 11-6v52h48V38l11 6 9-20-24-14c-3 7-11 11-20 11s-17-4-20-11z" fill="#7a1f2b" stroke="#111" stroke-width="5" stroke-linejoin="round"/>'+
  '<path d="M30 10c3 7 11 11 20 11s17-4 20-11" fill="none" stroke="#fff" stroke-width="4"/><path d="M6 24l9 20M94 24l-9 20" stroke="#fff" stroke-width="3"/>'+
  '<text x="50" y="40" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="'+fs+'" fill="#fff" letter-spacing="1">'+n.replace(/[<>&"]/g,'')+'</text>'+
  '<text x="50" y="80" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="38" fill="#fff" stroke="#111" stroke-width="1.5">'+x+'</text></svg>'}
function renderJersey(){var p=PROFILE||{name:'',num:''};$('#jerseyIco').innerHTML=jerseySVG(p.name||'YOU',p.num===''?'?':p.num)}
function welcomePreview(){$('#jerseyPrev').innerHTML=jerseySVG($('#wName').value||'NAME',$('#wNum').value===''?'?':cl(Math.round(+$('#wNum').value),0,99))}
['wName','wNum'].forEach(function(id){$('#'+id).addEventListener('input',welcomePreview)});
$('#wGo').addEventListener('click',function(){var n=$('#wName').value.replace(/[<>&"]/g,'').trim().slice(0,10),num=$('#wNum').value;
 if(!n){$('#wName').focus();$('#wName').style.borderColor='#d62828';return}if(num===''||isNaN(+num)){$('#wNum').focus();$('#wNum').style.borderColor='#d62828';return}
 PROFILE={name:n,num:cl(Math.round(+num),0,99)};try{localStorage.setItem('palo.profile.v1',JSON.stringify(PROFILE))}catch(e){}ac();SFX.click();renderJersey();show('sTitle')});
renderJersey();if(!PROFILE){welcomePreview();show('sWelcome')}

/* Classic expands in place to Fast / Long */
$('#classicBtn').addEventListener('click',function(){var o=$('#classicOpts'),open=o.classList.contains('hide');o.classList.toggle('hide',!open);this.setAttribute('aria-expanded',open?'true':'false');ac();SFX.click()});
document.querySelectorAll('[data-go="sMode"]').forEach(function(b){b.addEventListener('click',function(){$('#classicOpts').classList.add('hide');$('#classicBtn').setAttribute('aria-expanded','false')})});

/* ===== src/career.js ===== */
/* ======================================================================
   MYLIGA — your player's career.  Creation flow: look > position > barangay > hub
   ====================================================================== */
var POSDEF={
 OH:{name:'Outside Hitter',short:'OH',desc:'Attacks from the left, passes serves. The busiest player on the court.',
  base:{serve:5,spike:6,jump:6,pass:5.5,dig:5,block:4.5,set:3,speed:6,read:5,stamina:6,clutch:5},key:['spike','pass','jump']},
 OPP:{name:'Opposite',short:'OPP',desc:'The big scorer on the right side. Hits hard, blocks the other team\'s best hitter.',
  base:{serve:5.5,spike:6.5,jump:6,pass:3.5,dig:4,block:5.5,set:2.5,speed:5,read:5,stamina:5.5,clutch:5.5},key:['spike','block','serve']},
 MB:{name:'Middle Blocker',short:'MB',desc:'Lives at the net. Quick attacks and the most blocks.',
  base:{serve:4,spike:5.5,jump:6.5,pass:2.5,dig:3,block:6.5,set:2,speed:4.5,read:5.5,stamina:5,clutch:5},key:['block','jump','read']},
 S:{name:'Setter',short:'S',desc:'Touches the ball every rally and decides who attacks. The brain of the team.',
  base:{serve:5,spike:3.5,jump:5,pass:4.5,dig:4.5,block:4,set:7,speed:6,read:6.5,stamina:6,clutch:5.5},key:['set','read','speed']},
 L:{name:'Libero',short:'L',desc:'Back-row defender in a different jersey. Digs everything, never attacks.',
  base:{serve:3,spike:1.5,jump:3,pass:7,dig:7.5,block:1,set:4.5,speed:7,read:6.5,stamina:7,clutch:5},key:['dig','pass','speed']}};
var POSCAPS={OH:{},OPP:{pass:8},MB:{pass:6,dig:6,speed:7},S:{spike:7,block:7},L:{spike:3,block:2,jump:6}};
var STARTERS={OH:2,OPP:1,MB:2,S:1,L:1};
/* barangays: team ratings (out of 10) and the players already at each position (their OVR) */
var BRGYS=[
 {id:'mapayapa',name:'Brgy. Mapayapa',spec:'Balanced',tag:'Underdogs with heart. Hanz runs the offence.',stars:3,col:'#ffffff',ink:'#111111',kit:{team:0},
  r:{Serve:6,Attack:6,Block:6,Receive:6,Defense:6,Setting:6.5},depth:{OH:[55,49],OPP:[52],MB:[56,50],S:[58],L:[53]},bonus:1.15},
 {id:'sanroque',name:'Brgy. San Roque',spec:'Blocking',tag:'Tall, strict and stubborn at the net.',stars:3,col:'#1c1c1c',ink:'#ffffff',kit:{team:1},
  r:{Serve:5.5,Attack:6,Block:8,Receive:5,Defense:5.5,Setting:6},depth:{OH:[54,51],OPP:[55],MB:[62,59],S:[50],L:[46]},bonus:1.15},
 {id:'pagasa',name:'Brgy. Bagong Pag-asa',spec:'Receiving',tag:'Scrappy diggers who never let the ball drop. Needs a hitter.',stars:2,col:'#2e9d5b',ink:'#ffffff',kit:{team:0,kitOv:{jersey:'#2e9d5b',num:'#ffffff',trim:'#ffffff'}},
  r:{Serve:5,Attack:4.5,Block:5,Receive:8,Defense:8,Setting:6},depth:{OH:[47],OPP:[45],MB:[50,46],S:[53],L:[60,57]},bonus:1.3},
 {id:'malaya',name:'Brgy. Malaya',spec:'Attacking',tag:'Jump servers and big hitters. Flashy, and a lot of errors.',stars:4,col:'#2f62d8',ink:'#ffffff',kit:{team:0,kitOv:{jersey:'#2f62d8',num:'#ffffff',trim:'#111111'}},
  r:{Serve:8,Attack:8,Block:6,Receive:4.5,Defense:5,Setting:6},depth:{OH:[60,57],OPP:[62],MB:[49,44],S:[54],L:[46]},bonus:1}];
var STAGES=['Barangay Liga','Municipal Cup','Provincial Meet','College League','Pro League','National Team Tryouts'];
var CAREER=null;
function loadCareer(){try{CAREER=JSON.parse(localStorage.getItem('palo.career.v1')||'null')}catch(e){CAREER=null}}
function saveCareer(){if(!CAREER)return;try{localStorage.setItem('palo.career.v1',JSON.stringify(CAREER))}catch(e){}}
loadCareer();
function bodyTemplate(sex,H){var src=BODIES.filter(function(b){return b.id===(sex==='f'?'tala':'jun')})[0],o={};
 ['sh','hip','waist','rib','chest','limb','arm','sex'].forEach(function(k){o[k]=src[k]});o.H=H;return o}
function newCareer(){var p=PROFILE||{name:'Player',num:7},look=Object.assign(bodyTemplate('m',1.80),{id:'career',name:p.name,num:p.num,role:'Rookie',pos:'OH',team:0,hair:'spike',hairC:0,skin:1,eyes:'round',brows:'normal',mouth:'line',acc:{},pads:1,sleeves:0,shoeCut:'mid',shoeCol:null,stats:Object.assign({},POSDEF.OH.base),sp:6});
 return {v:1,created:0,look:look,pos:null,brgy:null,stats:null,sp:6,pawis:0,stage:0,games:0,wins:0}}
function careerOVR(st){if(!st)return 0;var s=0;STATS.forEach(function(k){s+=st[k[0]]});return Math.round(s/STATS.length*10)}
function careerResetLook(){var keep={name:CAREER.look.name,num:CAREER.look.num,sex:CAREER.look.sex,H:CAREER.look.H};CAREER.look=Object.assign(newCareer().look,bodyTemplate(keep.sex,keep.H),keep);saveCareer();previewBuild();renderRoster()}
function careerResetStats(){var b=CAREER.look;b.stats=Object.assign({},POSDEF[CAREER.pos].base);b.sp=6;CAREER.stats=b.stats;saveCareer()}
/* ---------- creator: sections > icon tabs > picture grid (+ swatches) ---------- */
function hTag(H){return H<1.70?'Libero size: quick and low':H<1.80?'Setter size: quick hands, good balance':H<1.90?'Hitter size: good reach, still fast':'Middle size: huge at the net, slower'}
var IC={
 build:'<svg viewBox="0 0 32 32"><circle cx="16" cy="7" r="4.5" fill="#111"/><path d="M8 28V17q0-5 8-5t8 5v11z" fill="#111"/></svg>',
 height:'<svg viewBox="0 0 32 32"><rect x="11" y="3" width="10" height="26" rx="2" fill="none" stroke="#111" stroke-width="3"/><path d="M11 9h5M11 14h3M11 19h5M11 24h3" stroke="#111" stroke-width="2.5"/></svg>',
 eyes:'<svg viewBox="0 0 32 32"><ellipse cx="10" cy="17" rx="4" ry="6" fill="#111"/><ellipse cx="22" cy="17" rx="4" ry="6" fill="#111"/><circle cx="11.5" cy="14.5" r="1.6" fill="#fff"/><circle cx="23.5" cy="14.5" r="1.6" fill="#fff"/></svg>',
 brows:'<svg viewBox="0 0 32 32"><path d="M4 15q6-6 11-2M17 13q5-4 11 2" fill="none" stroke="#111" stroke-width="4" stroke-linecap="round"/></svg>',
 mouth:'<svg viewBox="0 0 32 32"><path d="M6 13q10 14 20 0z" fill="#111"/><path d="M10 15q6 5 12 0" fill="#e66" /></svg>',
 hair:'<svg viewBox="0 0 32 32"><path d="M5 22q-2-16 11-17t11 13l-4-5-3 4-3-5-4 5-3-4z" fill="#111"/></svg>',
 gear:'<svg viewBox="0 0 32 32"><circle cx="16" cy="17" r="9" fill="none" stroke="#111" stroke-width="3"/><path d="M6 13h20v5H6z" fill="#d62828" stroke="#111" stroke-width="2"/></svg>',
 shoes:'<svg viewBox="0 0 32 32"><path d="M4 22V11h7q2 5 8 5l8 3q2 1 2 3v3H4z" fill="#111"/><path d="M4 26h25" stroke="#111" stroke-width="3"/></svg>'};
var CSECS=[{id:'body',t:'Body',tabs:['build','height']},{id:'face',t:'Face',tabs:['eyes','brows','mouth']},{id:'hair',t:'Hair',tabs:['hair']},{id:'gear',t:'Gear',tabs:['gear','shoes'],locker:1}];
var CTABS={build:{t:'Build',view:'body',sw:'skin'},height:{t:'Height',view:'body',sw:'skin'},eyes:{t:'Eyes',view:'face'},brows:{t:'Brows',view:'face'},mouth:{t:'Mouth',view:'face'},hair:{t:'Hair style',view:'face',sw:'hairC'},gear:{t:'Gear',view:'body'},shoes:{t:'Shoes',view:'feet',sw:'shoeCol'}};
var CR={sec:0,tab:'build',page:0};
var TUNE={eyes:[['es','Size'],['ew','Width'],['ey','Up / down'],['ex','Spacing']],brows:[['bs','Size'],['bw','Width'],['by','Up / down']],mouth:[['ms','Size'],['mw','Width'],['my','Up / down']]};
function crSecs(){return CSECS.filter(function(s){return !s.locker||CAREER.created})}
function careerOpenCreator(){CR.sec=0;CR.tab='build';CR.page=0;TM.view='body';TM.yaw=-12;TM.pose='idle';TM.t=0;document.querySelectorAll('#tPose button').forEach(function(y){y.classList.toggle('on',y.dataset.v==='idle')})}
/* 2D thumbnails from the face decals */
function decalThumb(tex,crop){var c=document.createElement('canvas');c.width=c.height=120;var g=c.getContext('2d');g.fillStyle=SKINS[CAREER.look.skin||0];g.fillRect(0,0,120,120);var im=tex.image,sw=im.width*crop[2],sh=im.height*crop[3];
 var k=Math.min(120/sw,120/sh)*.95;g.drawImage(im,im.width*crop[0],im.height*crop[1],sw,sh,(120-sw*k)/2,(120-sh*k)/2,sw*k,sh*k);return c}
/* 3D thumbnails (hair, build) rendered off-screen, one per frame */
var TH={rt:null,cache:{},q:[]};
function thumb3d(spec,mode){var S=128;if(!TH.rt){TH.rt=new THREE.WebGLRenderTarget(S,S);TH.sc=new THREE.Scene();TH.sc.add(new THREE.HemisphereLight('#ffffff','#9a9a9a',.72));var d=new THREE.DirectionalLight('#ffffff',.72);d.position.set(-4,8,5);TH.sc.add(d);TH.cam=new THREE.PerspectiveCamera(30,1,.05,50)}
 var C=buildChar(spec);applyKit(C);scene.remove(C.shadow);TH.sc.add(C.root);if(C.pony){scene.remove(C.pony.meshes);TH.sc.add(C.pony.meshes)}
 evalB(C,bake(C,clipById('stand')),0);C.root.position.set(0,0,0);C.root.updateMatrixWorld(true);if(C.pony)for(var i=0;i<40;i++)ponyStep(C,1/30);
 var h=new THREE.Vector3(),tg;C.J.head.getWorldPosition(h);var a=.75,dist;
 if(mode==='head'){tg=h.clone().add(new THREE.Vector3(0,.07,-.02));dist=.95}else{tg=new THREE.Vector3(0,C.H*.5,0);dist=C.H*2.25;a=.35}
 TH.cam.position.set(tg.x+Math.sin(a)*dist,tg.y+dist*.1,tg.z+Math.cos(a)*dist);TH.cam.lookAt(tg);TH.cam.updateMatrixWorld();
 R.setRenderTarget(TH.rt);R.setClearColor('#f4f1ea',1);R.clear();R.render(TH.sc,TH.cam);var px=new Uint8Array(S*S*4);R.readRenderTargetPixels(TH.rt,0,0,S,S,px);R.setRenderTarget(null);R.setClearColor('#f7f6f3');
 destroyChar(C);TH.sc.remove(C.root);if(C.pony)TH.sc.remove(C.pony.meshes);
 var c=document.createElement('canvas');c.width=c.height=S;var g=c.getContext('2d'),id=g.createImageData(S,S);for(var y=0;y<S;y++)id.data.set(px.subarray((S-1-y)*S*4,(S-y)*S*4),y*S*4);g.putImageData(id,0,0);return c}
function thumbJob(key,make,el){if(TH.cache[key]){el.innerHTML='';el.appendChild(TH.cache[key].cloneNode?cloneCanvas(TH.cache[key]):TH.cache[key]);return}TH.q.push({key:key,make:make,el:el});if(!TH.run){TH.run=1;requestAnimationFrame(thumbTick)}}
function cloneCanvas(c){var d=document.createElement('canvas');d.width=c.width;d.height=c.height;d.getContext('2d').drawImage(c,0,0);return d}
function thumbTick(){var j=TH.q.shift();if(!j){TH.run=0;return}if(document.body.contains(j.el)){if(!TH.cache[j.key])TH.cache[j.key]=j.make();j.el.innerHTML='';j.el.appendChild(cloneCanvas(TH.cache[j.key]))}requestAnimationFrame(thumbTick)}
function lookWith(o){return Object.assign({},CAREER.look,{acc:{},kitOv:null},o)}
function crItems(tab){var b=CAREER.look;
 if(tab==='build')return [['m','Male'],['f','Female']].map(function(o){return {v:o[0],on:b.sex===o[0],label:o[1],thumb:'b|'+o[0]+'|'+(b.skin||0),make:function(){var t=bodyTemplate(o[0],o[0]==='f'?1.72:1.80);return thumb3d(lookWith(Object.assign(t,{hair:o[0]===b.sex?b.hair:(o[0]==='f'?'pony':'spike')})),'body')}}});
 if(tab==='height')return [[1.66,'Libero'],[1.76,'Setter'],[1.86,'Hitter'],[1.96,'Middle']].map(function(o){return {v:o[0],on:Math.abs(b.H-o[0])<.005,txt:o[1],sub:o[0].toFixed(2)+' m'}});
 if(tab==='eyes')return OPT.eyes.map(function(o){return {v:o[0],on:(b.eyes||'round')===o[0],label:o[1],canvas:function(){return decalThumb(faceTex(o[0],'normal'),[.05,.15,.9,.8])}}});
 if(tab==='brows')return OPT.brows.map(function(o){return {v:o[0],on:(b.brows||'normal')===o[0],label:o[1],canvas:function(){return decalThumb(faceTex(b.eyes||'round',o[0]),[.05,0,.9,.7])}}});
 if(tab==='mouth')return OPT.mouth.map(function(o){return {v:o[0],on:(b.mouth||'line')===o[0],label:o[1],canvas:function(){return decalThumb(mouthTex(o[0]),[.15,.1,.7,.8])}}});
 if(tab==='hair')return OPT.hair.map(function(o){return {v:o[0],on:b.hair===o[0],label:o[1],thumb:'h|'+o[0]+'|'+b.sex+'|'+(b.hairC||0)+'|'+(b.skin||0),make:function(){return thumb3d(lookWith({hair:o[0]}),'head')}}});
 if(tab==='gear')return OPT.gear.map(function(o){var on=o[0]==='pads'?b.pads:o[0]==='sleeves'?b.sleeves:(b.acc||{})[o[0]];return {v:o[0],on:!!on,txt:o[1]}});
 if(tab==='shoes')return OPT.shoeCut.map(function(o){return {v:o[0],on:(b.shoeCut||'mid')===o[0],txt:o[1]}})}
function renderCreator(){var secs=crSecs(),sec=secs[CR.sec]||secs[0],tab=CTABS[CR.tab],b=CAREER.look,cr=!CAREER.created;
 TM.view=tab.view;$('#tRole').textContent=b.name+' #'+b.num;document.querySelectorAll('#tView button').forEach(function(y){y.classList.toggle('on',y.dataset.v===TM.view)});
 var h='<div class="crSec">'+secs.map(function(s,i){return '<button data-sec="'+i+'" class="'+(i===CR.sec?'on':cr&&i<CR.sec?'done':'')+'">'+(cr&&i<CR.sec?'✓ ':'')+s.t+'</button>'}).join('')+'</div>';
 h+='<div class="crMain"><div class="crTabs">'+sec.tabs.map(function(t){return '<button data-tab="'+t+'" class="'+(t===CR.tab?'on':'')+'" aria-label="'+CTABS[t].t+'">'+IC[t]+'</button>'}).join('')+'</div><div class="crCard"><div class="crHead">'+tab.t+'<button id="crRand" aria-label="Randomize">🎲</button></div>';
 var items=crItems(CR.tab),per=CR.tab==='build'?2:CR.tab==='height'?4:TUNE[CR.tab]?8:12,pages=Math.ceil(items.length/per);CR.page=Math.min(CR.page,pages-1);
 if(CR.tab==='height')h+='<div class="crH"><div class="hrow"><b>'+b.H.toFixed(2)+' m</b><small>'+hTag(b.H)+'</small></div><input type="range" id="crHt" min="1.60" max="2.02" step="0.01" value="'+b.H+'"></div>';
 h+='<div class="crGrid'+(per<=4?' c'+(per===2?'2':'4'):'')+'"'+(per===2?' style="grid-template-columns:1fr 1fr"':'')+'>';
 items.slice(CR.page*per,CR.page*per+per).forEach(function(it,i){var idx=CR.page*per+i;
  h+=it.txt?'<button class="crT txt'+(it.on?' on':'')+'" data-i="'+idx+'">'+it.txt+(it.sub?'<small>'+it.sub+'</small>':'')+'</button>':'<button class="crT'+(it.on?' on':'')+'" data-i="'+idx+'" aria-label="'+it.label+'"><span class="th"><span class="ld"></span></span><span class="tl">'+it.label+'</span></button>'});
 h+='</div>'+(pages>1?'<div class="crPg"><button id="crPrev"'+(CR.page<=0?' disabled':'')+'>◀</button><span>'+(CR.page+1)+'/'+pages+'</span><button id="crNext"'+(CR.page>=pages-1?' disabled':'')+'>▶</button></div>':'')+'</div></div>';
 if(tab.sw){var arr=tab.sw==='skin'?SKINS.map(function(c,i){return [i,c]}):tab.sw==='hairC'?HAIRC.map(function(c,i){return [i,c]}):SHOECOLS.map(function(c){return [c[1],c[1]||'repeating-linear-gradient(45deg,#fff 0 4px,#111 4px 8px)']}),cur=tab.sw==='shoeCol'?(b.shoeCol||''):(b[tab.sw]||0);
  h+='<div class="crSwL">'+(tab.sw==='skin'?'Skin tone':tab.sw==='hairC'?'Hair colour':'Shoe colour')+'</div><div class="crSw">'+arr.map(function(x){return '<button data-sw="'+x[0]+'" style="background:'+x[1]+'" class="'+(String(cur)===String(x[0])?'on':'')+'"></button>'}).join('')+'</div>'}
 if(TUNE[CR.tab]){var F=b.face||{};h+='<div class="crTune">'+TUNE[CR.tab].map(function(t){var v=+F[t[0]]||0;return '<label><span>'+t[1]+'</span><input type="range" min="-5" max="5" step="1" data-tune="'+t[0]+'" value="'+v+'"><b>'+(v>0?'+':'')+v+'</b></label>'}).join('')+'<button class="chip" id="crTuneReset">Reset</button></div>'}
 var last=CR.sec>=secs.length-1;h+='<div class="crOk"><button class="btn main" id="crOk">'+(!cr?'OK ✓':last?'Next: Position ›':'OK › '+secs[CR.sec+1].t)+'</button></div>';
 var P=$('#crPanel');P.innerHTML=h;P._items=items;
 P.querySelectorAll('.crT .th').forEach(function(el){var it=items[+el.parentNode.dataset.i];if(it.canvas){el.innerHTML='';el.appendChild(it.canvas())}else if(it.make)thumbJob(it.thumb,it.make,el)});
 P.querySelectorAll('[data-tune]').forEach(function(inp){var tT;inp.addEventListener('input',function(){var v=+this.value;b.face=Object.assign({},b.face);b.face[this.dataset.tune]=v;SFX.tick();this.nextSibling.textContent=(v>0?'+':'')+v;clearTimeout(tT);tT=setTimeout(function(){saveCareer();previewBuild()},90)})});
 var hs=$('#crHt');if(hs){var hT;hs.addEventListener('input',function(){b.H=+this.value;P.querySelector('.crH b').textContent=b.H.toFixed(2)+' m';P.querySelector('.crH small').textContent=hTag(b.H);clearTimeout(hT);SFX.tick();hT=setTimeout(function(){saveCareer();previewBuild();P.querySelectorAll('.crT.txt').forEach(function(x){x.classList.toggle('on',Math.abs(items[+x.dataset.i].v-b.H)<.005)})},120)})}}
function crApply(tab,v){var b=CAREER.look;
 if(tab==='build'){if(b.sex===v)return;Object.assign(b,bodyTemplate(v,v==='f'?Math.min(b.H,1.80):Math.max(b.H,1.76)));if(v==='f'&&/spike|mohawk|buzz|messy/.test(b.hair))b.hair='pony';if(v==='m'&&/pony|twin|long|bun/.test(b.hair))b.hair='spike'}
 else if(tab==='height')b.H=v;else if(tab==='eyes'||tab==='brows'||tab==='mouth'||tab==='hair')b[tab==='hair'?'hair':tab]=v;
 else if(tab==='gear'){if(v==='pads')b.pads=b.pads?0:1;else if(v==='sleeves')b.sleeves=b.sleeves?0:1;else{b.acc=Object.assign({},b.acc);b.acc[v]=b.acc[v]?0:1}}
 else if(tab==='shoes')b.shoeCut=v;rebuildMine(0)}
function crGoSec(i){var secs=crSecs();CR.sec=i;CR.tab=secs[i].tabs[0];CR.page=0;renderCreator()}
$('#crPanel').addEventListener('click',function(e){var x=e.target.closest('button');if(!x)return;if(x.dataset.sec!=null||x.id==='crOk')SFX.next();else if(x.id==='crPrev'||x.id==='crNext'||x.id==='crTuneReset')SFX.tick();else SFX.tab();var b=CAREER.look;
 if(x.dataset.sec!=null){crGoSec(+x.dataset.sec);return}
 if(x.dataset.tab){CR.tab=x.dataset.tab;CR.page=0;renderCreator();return}
 if(x.id==='crPrev'){CR.page--;renderCreator();return}if(x.id==='crNext'){CR.page++;renderCreator();return}
 if(x.dataset.sw!=null){var k=CTABS[CR.tab].sw,v=x.dataset.sw;if(k==='shoeCol')b.shoeCol=v||null;else b[k]=+v;rebuildMine(0);return}
 if(x.dataset.i!=null){var it=$('#crPanel')._items[+x.dataset.i];crApply(CR.tab,it.v);return}
 if(x.id==='crRand'){var pk=function(a){return a[Math.floor(Math.random()*a.length)][0]};if(CR.tab==='hair')b.hair=pk(OPT.hair);else if(CR.tab==='eyes')b.eyes=pk(OPT.eyes);else if(CR.tab==='brows')b.brows=pk(OPT.brows);else if(CR.tab==='mouth')b.mouth=pk(OPT.mouth);
  else if(CR.tab==='build'||CR.tab==='height'){b.skin=Math.floor(Math.random()*SKINS.length);b.H=Math.round((1.64+Math.random()*.34)*100)/100}else if(CR.tab==='shoes'){b.shoeCut=pk(OPT.shoeCut);b.shoeCol=pick(SHOECOLS.slice(1))[1]}else{b.acc={};['headband','wrist','glasses','plaster','ankle'].forEach(function(g){if(Math.random()<.3)b.acc[g]=1})}rebuildMine(0);return}
 if(x.id==='crTuneReset'){b.face=Object.assign({},b.face);TUNE[CR.tab].forEach(function(t){delete b.face[t[0]]});rebuildMine(0);return}
 if(x.id==='crOk'){var secs=crSecs();if(CAREER.created){saveCareer();openHub();return}if(CR.sec<secs.length-1){crGoSec(CR.sec+1);return}show('sPos');renderPos()}});
/* back walks back through the sections while creating */
$('#tBack').addEventListener('click',function(){SFX.click();if(TM.mode==='career'&&CAREER&&!CAREER.created&&CR.sec>0){crGoSec(CR.sec-1);return}show(this.dataset.back)});
/* ---------- creation flow ---------- */
function startCareer(){if(CAREER&&CAREER.created){openHub();return}CAREER=newCareer();TM.mode='career';careerOpenCreator();destroyPreview();show('sTeam')}
function destroyPreview(){if(!TM.C)return;destroyChar(TM.C);pScene.remove(TM.C.root);pScene.remove(TM.C.shadow);if(TM.C.pony)pScene.remove(TM.C.pony.meshes);TM.C=null}
var PSEL=null;
function bars(obj,keys,max){return '<div class="bars">'+keys.map(function(k){var v=obj[k];return '<span class="bl">'+k+'</span><span class="bt"><i style="width:'+(v/(max||10)*100)+'%"></i></span><span class="bv">'+(Math.round(v*10)/10)+'</span>'}).join('')+'</div>'}
function renderPos(){var h='';Object.keys(POSDEF).forEach(function(k){var d=POSDEF[k],o={};d.key.forEach(function(s){o[STATS.filter(function(x){return x[0]===s})[0][1]]=d.base[s]});
  h+='<button class="pcard'+(PSEL===k?' on':'')+'" data-p="'+k+'"><span class="ptag">'+k+'</span><b>'+d.name+'</b><small>'+d.desc+'</small>'+bars(o,Object.keys(o))+'</button>'});
 $('#posList').innerHTML=h;$('#posNext').disabled=!PSEL}
$('#posList').addEventListener('click',function(e){var x=e.target.closest('.pcard');if(!x)return;PSEL=x.dataset.p;renderPos();SFX.tab()});
$('#posNext').addEventListener('click',function(){if(!PSEL)return;CAREER.pos=PSEL;SFX.click();show('sBrgy');renderBrgy()});
var BSEL=null;
function outlook(b,pos,ovr){var dep=b.depth[pos]||[],ahead=dep.filter(function(v){return v>=ovr}).length,n=STARTERS[pos];
 return ahead<n?{t:'Starter',c:'#1f9d55',d:'You start right away'}:ahead===n?{t:'Fight for a spot',c:'#e8a33a',d:ahead+' ahead of you at '+pos}:{t:'Bench start',c:'#d62828',d:ahead+' ahead of you at '+pos}}
function renderBrgy(){var ovr=careerOVR(POSDEF[CAREER.pos].base),h='';
 BRGYS.forEach(function(b){var o=outlook(b,CAREER.pos,ovr);
  h+='<button class="bcard'+(BSEL===b.id?' on':'')+'" data-b="'+b.id+'"><span class="bkit" style="background:'+b.col+';color:'+b.ink+'">'+b.spec.toUpperCase()+'</span><b>'+b.name+'</b><span class="stars">'+'★★★★★'.slice(0,b.stars)+'<span>'+'★★★★★'.slice(b.stars)+'</span></span><small>'+b.tag+'</small>'+bars(b.r,Object.keys(b.r))+
   '<span class="out" style="border-color:'+o.c+'"><b style="color:'+o.c+'">'+o.t+'</b> · '+o.d+(b.bonus>1?' · <b>+'+Math.round((b.bonus-1)*100)+'% Pawis</b>':'')+'</span></button>'});
 $('#brgyList').innerHTML=h;$('#brgyGo').disabled=!BSEL;$('#brgyPos').textContent=POSDEF[CAREER.pos].name+' · OVR '+ovr}
$('#brgyList').addEventListener('click',function(e){var x=e.target.closest('.bcard');if(!x)return;BSEL=x.dataset.b;renderBrgy();SFX.tab()});
$('#brgyGo').addEventListener('click',function(){if(!BSEL)return;var b=BRGYS.filter(function(x){return x.id===BSEL})[0],L=CAREER.look;CAREER.brgy=BSEL;
 L.pos=CAREER.pos;L.role=POSDEF[CAREER.pos].name;L.team=CAREER.pos==='L'?(b.kit.team===1?3:2):b.kit.team;L.kitOv=CAREER.pos==='L'?null:(b.kit.kitOv||null);
 L.stats=Object.assign({},POSDEF[CAREER.pos].base);L.sp=6;CAREER.stats=L.stats;CAREER.created=Date.now();saveCareer();SFX.dialog();openHub()});
/* ---------- hub ---------- */
function openHub(){TM.mode='career';TM.view='body';TM.pose='idle';destroyPreview();show('sCareer');renderHub()}
function renderHub(){var c=CAREER,L=c.look,b=BRGYS.filter(function(x){return x.id===c.brgy})[0],ovr=careerOVR(L.stats);
 $('#hubCard').innerHTML='<span class="ico">'+jerseySVG(L.name,L.num)+'</span><span class="hc"><b>'+L.name.toUpperCase()+' #'+L.num+'</b><small>'+POSDEF[c.pos].name+' · '+b.name+'</small><span class="ovr">OVR <b>'+ovr+'</b></span></span>';
 $('#hubStage').innerHTML='<b>'+STAGES[c.stage]+'</b> · Season 1 · '+c.wins+'-'+(c.games-c.wins)+'<span>Pawis '+c.pawis+' · '+L.sp+' skill points</span>';
 $('#hubAttrs').hidden=true}
function hubTop(){var h=$('#hubAttrs').hidden;renderHub();$('#hubAttrs').hidden=h}
$('#attrs').addEventListener('click',function(){if(TM.mode==='career'&&UI.screen==='sCareer')setTimeout(hubTop,0)});
$('#hubBtns').addEventListener('click',function(e){var x=e.target.closest('button');if(!x)return;var a=x.dataset.h;SFX.click();
 if(a==='attr'){var el=$('#hubAttrs');el.hidden=!el.hidden;if(!el.hidden){TM.sel=0;renderAttrsInto()}}
 else if(a==='locker'){careerOpenCreator();destroyPreview();show('sTeam')}
 else if(a==='train'){startDrill()}
 else if(a==='retire'){$('#retireBox').hidden=false;SFX.dialog()}});
function renderAttrsInto(){/* reuse the chevron UI */var tmp=$('#attrs');$('#hubAttrs').appendChild(tmp);renderAttrs()}
$('#retireNo').addEventListener('click',function(){$('#retireBox').hidden=true});
$('#retireYes').addEventListener('click',function(){try{localStorage.removeItem('palo.career.v1')}catch(e){}$('#tp_attr').appendChild($('#attrs'));CAREER=null;$('#retireBox').hidden=true;TM.mode='team';destroyPreview();show('sMode')});
/* MyLiga button */
(function(){var b=document.querySelector('[data-mode="myliga"]');if(!b)return;b.disabled=false;b.classList.remove('soon');var t=b.querySelector('i');if(t)t.remove();b.addEventListener('click',function(){ac();SFX.click();startCareer()})})();

/* ===== src/drill.js ===== */
/* ======================================================================
   ENSAYO — spike drill.  You control your MyLiga player:
   stick = move · hold the button = approach · release = leap · press again = swing
   Ica passes, Hanz sets, you hit into an empty court.
   ====================================================================== */
var DR=null;
function LIVE(){return M.mode==='play'||M.mode==='drill'}
var DSPOT={OH:{start:{x:3.9,z:-4.3},land:{x:3.45,z:-.45},T:1.95,name:'Outside (left)'},
 OPP:{start:{x:-3.9,z:-4.3},land:{x:-3.45,z:-.45},T:1.8,name:'Opposite (right)'},
 MB:{start:{x:.6,z:-4.2},land:{x:.35,z:-.9},T:1.45,name:'Middle (quick)'},
 S:{start:{x:3.9,z:-4.3},land:{x:3.45,z:-.45},T:1.95,name:'Outside (left)'},
 L:{start:{x:3.9,z:-4.3},land:{x:3.45,z:-.45},T:1.95,name:'Outside (left)'}};
function startDrill(){ac();var pos=CAREER.pos||'OH';
 if(DR&&DR.me){destroyChar(DR.me.C);scene.remove(DR.me.box)}
 hideScreens(true);$('#pauseBtn').style.display='block';
 resetMatch('demo');M.mode='drill';M.state='drill';M.paused=false;M.pend=[];M.blockEval=null;M.stamps=[];M.fx=null;M.hype=0;
 B.live=false;B.dead=false;B.held=null;B.v={x:0,y:0,z:0};B.p={x:0,y:-5,z:0};
 PL.forEach(function(p){p.act=null;p.post=null;p.drillHome=null});
 var me=mkPlayer(CAREER.look,0),sp=DSPOT[pos];me.box.position.set(sp.start.x,0,sp.start.z);me.box.rotation.y=0;me.drill=1;
 var setter=BODIES.filter(function(b){return b.id==='jun'})[0],S=PL.filter(function(p){return p.b===setter})[0],L=PL.filter(function(p){return p.pos==='L'&&p.team===0})[0];
 var ss=setSpot(0);S.drillHome={x:ss.x,z:ss.z-.25,face:0};S.box.position.set(ss.x,0,ss.z-.25);S.box.rotation.y=0;
 L.drillHome={x:-2.6,z:-6.2,face:Math.atan2(ss.x+2.6,ss.z+6.2)};L.box.position.set(-2.6,0,-6.2);
 DR={me:me,S:S,L:L,spot:sp,st:'free',ct:0,t:0,reps:0,kills:0,perf:0,streak:0,best:0,pawis:0,next:M.now+1.6,phase:'wait',ring:null,msg:'Start on the green ring · hold to approach · let go to jump · tap to spike',msgT:M.now+14};
 autoQ.start()}
function endDrill(){if(!DR)return;var got=DR.pawis;if(got){CAREER.pawis=(CAREER.pawis||0)+got;saveCareer()}
 destroyChar(DR.me.C);scene.remove(DR.me.box);DR=null;$('#pauseBtn').style.display='none';M.paused=false;resetMatch('demo');openHub();
 if(got)$('#hubStage').insertAdjacentHTML('beforeend','<span style="color:#1f9d55">Ensayo: +'+got+' Pawis</span>')}

/* ---------- the feed: Ica passes, Hanz sets ---------- */
function drillFeed(){var S=DR.S,L=DR.L,ss=setSpot(0),tp=M.now+.75,
  P0={x:L.drillHome.x+.15,y:handY(L,'dig'),z:L.drillHome.z+.35},P1={x:ss.x,y:handY(S,'set'),z:ss.z},T1=1.5;
 planAct(L,'dig',tp,P0,L.drillHome.face);
 var tgt=DR.spot.land,yaw=Math.atan2(tgt.x-P1.x,tgt.z-P1.z);planAct(S,'set',tp+T1,P1,yaw);
 var L2={x:DR.spot.land.x,y:BR,z:DR.spot.land.z};DR.feed={tp:tp,P0:P0,P1:P1,T1:T1,ts:tp+T1,v1:trajTo(P1,L2,DR.spot.T)};DR.phase='pass';DR.reps++;
 /* the set is known ahead, so the ring shows early (quick hitters start before the set) */DR.ring=drillRing(P1,DR.feed.v1,DR.feed.ts)}
function drillUpdate(dt){var d=DR;if(!d)return;drillLogic(dt);if(!DR)return;
 if((d.phase==='wait'||d.phase==='done')&&M.now>=d.next&&d.st!=='air'&&d.st!=='swing')drillFeed();
 var f=d.feed;
 if(d.phase==='pass'&&M.now>=f.tp){B.p={x:f.P0.x,y:f.P0.y,z:f.P0.z};B.v=trajTo(f.P0,f.P1,f.T1);B.live=true;B.dead=false;B.lastType='pass';SFX.hit&&SFX.hit();d.phase='toSet'}
 if(d.phase==='toSet'&&M.now>=f.ts){B.p={x:f.P1.x,y:f.P1.y,z:f.P1.z};B.v={x:f.v1.x,y:f.v1.y,z:f.v1.z};SFX.set&&SFX.set();d.phase='set'}
 if(B.live||B.dead){var pz=B.p.z;B.v.y-=GRAV*dt;B.p.x+=B.v.x*dt;B.p.y+=B.v.y*dt;B.p.z+=B.v.z*dt;B.spin+=dt*Math.hypot(B.v.x,B.v.z)*2;
  if(B.live&&(pz<0)!==(B.p.z<0)&&Math.abs(B.p.x)<5&&B.p.y<NET_H+BR*.5){B.p.z=pz<0?-BR:BR;B.v.z*=-.15;B.v.x*=.4;B.v.y=Math.min(B.v.y,0)*.3;SFX.net();if(d.phase==='hit')drillResult('net')}
  if(B.p.y<=BR&&B.v.y<0){B.p.y=BR;if(B.live){B.live=false;B.dead=true;SFX.thud&&SFX.thud();
    if(d.phase==='hit')drillResult(B.p.z>0&&inCourt(B.p)?'kill':'out');else if(d.phase==='set'){drillResult('drop')}}
   B.v.y*=-.45;B.v.x*=.7;B.v.z*=.7;if(Math.abs(B.v.y)<.6)B.v.y=0}}
 M.stamps=M.stamps.filter(function(s){return M.now-s.t0<s.dur})}
function drillResult(r){var d=DR;if(d.phase==='done')return;d.phase='done';d.ring=null;d.next=M.now+2.2;
 var at={x:B.p.x,y:1.2,z:B.p.z};
 if(r==='kill'){d.kills++;d.streak++;var g=d.hitQ==='perfect'?3:d.hitQ==='good'?2:1;d.pawis+=g+(d.streak>=3?1:0);stamp('KILL! '+d.kmh+' km/h',at,{size:30,fill:'#1f9d55'});if(d.kmh>d.best)d.best=d.kmh;SFX.cheer&&SFX.cheer()}
 else{d.streak=0;SFX.err();stamp(r==='net'?'NET!':r==='out'?'OUT!':'MISSED',at,{size:30,fill:'#d62828'});SFX.groan&&SFX.groan()}}
/* where the ball comes down to your reach: the red ring */
function drillRing(p,v,t0){var me=DR.me,id=drillClip(),cl0=CONTACT[id],L=contactLocal(me,id),reach=L.y-clipAir(me.bake(id).clip,cl0[0]).air+drillApex(1)*.95;
 var a=-.5*GRAV,b=v.y,c=p.y-reach,D=b*b-4*a*c;if(D<0)return null;var t=(-b-Math.sqrt(D))/(2*a);var q=posAt(p,v,t);return {x:q.x,z:q.z,y:reach,t:t0+t}}

/* ---------- your player ---------- */
function drillClip(){var s=st(DR.me,'spike');return s<3?'spike_low':'spike'}
function drillApex(pw){return (.85+st(DR.me,'jump')*.065)*pw}
/* linear air/ground from the clip's keys (the jump height is ours, from physics) */
function clipAir(clip,t){var k=clip.keys,i=0;while(i<k.length-2&&t>k[i+1].t)i++;var a=k[i],b=k[i+1]||a,f=b.t>a.t?cl((t-a.t)/(b.t-a.t),0,1):0;
 var ga=a.P.gnd==null?1:a.P.gnd,gb=b.P.gnd==null?1:b.P.gnd;return {air:lerp(a.P.air||0,b.P.air||0,f),gnd:lerp(ga,gb,f)}}
function drillBtn(down){var d=DR;if(!d||M.paused)return;var me=d.me;
 if(down){if(d.st==='free'){var id=drillClip(),Bk=me.bake(id),k=Bk.clip.keys;
   var yaw=0,s=stick();if(d.ring){/* aim so the hitting hand (not the body) runs through the ring */var Lh=contactLocal(me,id),px=me.box.position.x,pz=me.box.position.z;yaw=Math.atan2(d.ring.x-px,d.ring.z-pz);for(var it=0;it<3;it++){var cs=Math.cos(yaw),sn=Math.sin(yaw),tx=d.ring.x-Lh.x*cs,tz=d.ring.z+Lh.x*sn;yaw=Math.atan2(tx-px,tz-pz)}}if(Math.hypot(s.x,s.y)>.5)yaw=Math.atan2(-s.x,-s.y);
   d.act={id:id,B:Bk,tP:k[3].t,tT:k[4].t,tW:k[5].t,tH:k[6].t,tF:k[7].t,tL:k[8].t,yaw:yaw,ax:me.box.position.x,az:me.box.position.z};d.st='app';d.ct=0;d.ct0=0;d.ta=null;d.plantT=null;me.box.rotation.y=yaw;vib(10)}
  else if((d.st==='air'||d.st==='take')&&!d.swung){d.swung=1;d.st='swing';d.swR=Math.max(1,(d.act.tH-d.ct)/.15);vib(12)}}
 else{if(d.st==='app'){var a=d.act,late=d.plantT==null?0:d.ct0-d.plantT;
   d.pw=d.plantT==null?.45+.5*(d.ct/a.tP):late<.3?1:Math.max(.7,1-(late-.3)*.4);d.st='take';d.swung=0;d.hitDone=0}}}
/* timeline + movement run on the fixed game clock (same clock as the ball); the pose is drawn per frame */
function drillLogic(dt){var d=DR,me=d.me,a=d.act;
 if(d.st==='free'){var s=stick(),spd=4.2+st(me,'speed')*.25,des=new THREE.Vector3(-s.x,0,-s.y).multiplyScalar(spd);
  me.vel.lerp(des,Math.min(1,dt*8));me.box.position.addScaledVector(me.vel,dt);me.box.position.x=cl(me.box.position.x,-6,6);me.box.position.z=cl(me.box.position.z,-10,-.3);
  var sp=me.vel.length(),fy=sp>.6?Math.atan2(me.vel.x,me.vel.z):d.ring?Math.atan2(d.ring.x-me.box.position.x,d.ring.z-me.box.position.z):0;
  me.box.rotation.y=angTo(me.box.rotation.y,fy,Math.min(1,dt*(sp>2.6?8:5)));me.box.position.y=0;return}
 /* if the release got lost (no finger or key is down any more), jump anyway */
 if(d.st==='app'&&IN.btn==null&&!IN.keyBtn){drillBtn(0)}
 if(d.st==='app'){d.ct=Math.min(d.ct+dt,a.tP);d.ct0=(d.ct0||0)+dt;if(d.ct>=a.tP&&d.plantT==null)d.plantT=d.ct0}
 else if(d.st==='take'){d.ct+=dt*(d.ct<a.tP?1.6:1);if(d.ct>=a.tT)d.st='air'}
 else if(d.st==='air'){d.ct=Math.min(a.tW,d.ct+dt*.75)}
 else if(d.st==='swing'){d.ct+=dt*(d.ct<a.tH?d.swR:1);if(!d.hitDone&&d.ct>=a.tH){d.hitDone=1;drillContact()}if(d.ct>a.tF&&d.ta!=null)d.ct=Math.min(d.ct,a.tF)}
 else if(d.st==='land'){d.ct+=dt;if(d.ct>=a.B.dur){drillEndAct();return}}
 if(d.ta==null&&d.st!=='app'&&d.st!=='land'&&d.ct>=a.tT-.05){d.ta=0;d.v0=Math.sqrt(2*GRAV*drillApex(d.pw))}
 var h=0;if(d.ta!=null){d.ta+=dt;h=d.v0*d.ta-.5*GRAV*d.ta*d.ta;
  var fw=1.1*d.pw*dt;me.box.position.x+=Math.sin(a.yaw)*fw;me.box.position.z+=Math.cos(a.yaw)*fw;
  if(h<=0&&d.ta>.1){h=0;d.ta=null;if(!d.hitDone){d.hitDone=1}d.st='land';d.ct=Math.max(d.ct,a.tF);SFX.squeak&&SFX.squeak()}}
 var ca=clipAir(a.B.clip,d.ct);me.box.position.y=d.ta!=null?h-ca.air*(1-ca.gnd):0;/* the clip lifts the pelvis by its own air value; offset it so the body follows our jump arc */
 if(d.st==='app'||d.st==='take'){me.box.position.x=a.ax;me.box.position.z=a.az}me.box.rotation.y=a.yaw}
function drillPose(dt){var d=DR,me=d.me,C=me.C,a=d.act;
 if(d.st==='free'||!a)locomote(me,dt,(M.now+me.phase)%me.bake('idle').dur,'idle');
 else{evalB(C,a.B,d.ct);
  /* never through the net: slide the whole act back if the body would cross */
  C.root.updateMatrixWorld(true);C.root.getWorldPosition(tmpV);if(tmpV.z>-.18){var dz=tmpV.z+.18;me.box.position.z-=dz;a.az-=dz}}
 C.root.updateMatrixWorld(true);C.root.getWorldPosition(tmpV);C.shadow.position.set(tmpV.x,.004,tmpV.z);C.shadow.scale.setScalar(1/(1+me.box.position.y*.6));
 lookStep(C,B.live?V3(B.p):null,!!B.live,dt);ponyStep(C,dt)}
/* the approach moves the root forward inside the box; when the act ends, put the box where the body is */
function drillEndAct(){var d=DR,me=d.me,C=me.C;C.root.updateMatrixWorld(true);C.root.getWorldPosition(tmpV);me.box.position.set(tmpV.x,0,Math.min(tmpV.z,-.15));C.root.position.set(0,0,0);C.root.rotation.y=0;d.act=null;d.st='free';d.ct=0;d.ct0=0;d.ta=null;me.vel.set(0,0,0);me.fade=null}
function drillContact(){var d=DR,me=d.me,C=me.C,hw=new THREE.Vector3();evalB(C,d.act.B,d.act.tH);me.box.updateMatrixWorld(true);C.root.updateMatrixWorld(true);C.hand.R.getWorldPosition(hw);
 /* forgiving contact: look a little before/after this instant along the ball's path for the closest meeting point */
 var best=null;if(B.live&&d.phase==='set')for(var dl=-.14;dl<=.1401;dl+=.01){var bp=posAt(B.p,B.v,dl),dist=Math.hypot(hw.x-bp.x,hw.y-bp.y,hw.z-bp.z),sc=dist+Math.abs(dl)*2.2;if(!best||sc<best.sc)best={sc:sc,dist:dist,dl:dl}}
 d.dbg={hand:[hw.x,hw.y,hw.z].map(function(v){return +v.toFixed(2)}),sc:best&&+best.sc.toFixed(2),dist:best&&+best.dist.toFixed(2),dl:best&&+best.dl.toFixed(2)};
 if(!best||best.sc>.75){SFX.err();stamp(!best?'WHIFF!':best.dl>0?'TOO EARLY':'TOO LATE',headW(me),{size:22,fill:'#d62828'});return}
 var q=best.sc<.3?'perfect':best.sc<.5?'good':'bad';d.hitQ=q;if(q==='perfect')d.perf++;
 var s=stick(),tip=s.y<-.5&&Math.abs(s.x)<.6,plan={q:q,tip:tip,speed:spikeSpeed(me,q)*(.8+.2*d.pw),to:{x:cl(-s.x*3.8+rnd(-.4,.4),-4.1,4.1),y:0,z:tip?rnd(1.3,2.4):rnd(5,8)},error:q==='bad'&&chance(.3)?(chance(.5)?'net':'out'):null};
 if(plan.error==='out')plan.to.z=rnd(9.8,12);
 B.p={x:hw.x,y:hw.y,z:hw.z};B.v=attackVel(B.p,plan);d.kmh=Math.round(Math.hypot(B.v.x,B.v.y,B.v.z)*3.6);d.dbg.v=[B.v.x,B.v.y,B.v.z].map(function(v){return +v.toFixed(1)});d.dbg.plan=plan.speed.toFixed(1);d.phase='hit';d.ring=null;B.lastType=tip?'tip':'spike';
 qStamp(q,me);if(q==='perfect')SFX.perfect();if(tip){SFX.set();stamp('TIP!',headW(me),{size:24})}else{SFX.spike(false,q==='perfect');M.fx={t0:M.now,team:0,sup:false,at:{x:B.p.x,y:B.p.y,z:B.p.z}};vib(35)}}

/* ---------- per-frame: players, camera ---------- */
function drillRender(rdt){var d=DR;ctrlFrame();PL.forEach(function(p){var on=p===d.S||p===d.L;setVisible(p.C,on);if(on)stepPlayer(p,rdt,true)});
 setVisible(d.me.C,true);drillPose(rdt);
 /* ring: where to meet the ball */
 if(d.ring&&/pass|toSet|set/.test(d.phase)){tgt(d.ring.x,d.ring.z);var live=d.phase==='set',pul=live?1+Math.sin(M.now*10)*.06:1;tgtRing.scale.setScalar(pul);tgtRing.material.opacity=live?1:.45;tgtFill.material.opacity=live?.2:.08}
 /* green ring: where to start the approach so your hand meets the ball at the top of the jump */
 sweet.visible=false;d.startM=null;
 if(d.ring&&/pass|toSet|set/.test(d.phase)&&d.st==='free'){var me=d.me,id=drillClip(),Lh=contactLocal(me,id),ta=Math.sqrt(2*drillApex(1)/GRAV),lz=Lh.z+1.1*ta,
   px=me.box.position.x,pz=me.box.position.z,yaw=Math.atan2(d.ring.x-px,d.ring.z-pz);
  for(var it=0;it<3;it++){var cs=Math.cos(yaw),sn=Math.sin(yaw),sx=d.ring.x-(Lh.x*cs+lz*sn),sz=d.ring.z-(-Lh.x*sn+lz*cs);yaw=Math.atan2(d.ring.x-sx,d.ring.z-sz)}
  if(sz>-.6){sz=-.6}d.startM={x:sx,z:sz};sweet.visible=true;sweet.position.set(sx,.05,sz);sweet.scale.setScalar(.75);sweet.material.opacity=Math.hypot(px-sx,pz-sz)<.35?.95:.6}
 /* camera: behind and above your player, looking past the net */
 var mp=d.me.box.position,want=new THREE.Vector3(mp.x*.5,6.6,mp.z-8.6),look=new THREE.Vector3(mp.x*.45,1.6,mp.z+6.5);
 cam.fov=54;cam.position.lerp(want,Math.min(1,rdt*3));CLc.lerp(look,Math.min(1,rdt*3));cam.lookAt(CLc);cam.updateProjectionMatrix()}

/* ---------- deck: stick + approach/spike button ---------- */
function drillDeck(o,W,u,DT,DH){var d=DR;if(!d)return;var s=stick();
 /* top line: reps and kills */
 txt('ENSAYO · '+d.spot.name.toUpperCase(),W/2,DT+26*u,17*u,'#111');
 txt('Kills '+d.kills+'/'+Math.max(0,d.reps-(d.phase==='done'||d.phase==='wait'?0:1))+'   Perfect '+d.perf+'   Streak '+d.streak+'   Best '+(d.best?d.best+' km/h':'-'),W/2,DT+46*u,12*u,'#555');
 if(d.msg&&M.now<d.msgT)txt(d.msg,W/2,DT+DH-18*u,11.5*u,'#111','#fff',3*u);
 /* stick */
 var dpr=W/hud.getBoundingClientRect().width||1,jx=IN.touch?IN.touch.ox*dpr:W*.25,jy=IN.touch?IN.touch.oy*dpr:DT+DH*.6;
 o.fillStyle='rgba(255,255,255,.9)';o.strokeStyle='#111';o.lineWidth=3*u;o.beginPath();o.arc(jx,jy,44*u,0,6.28);o.fill();o.stroke();
 o.fillStyle='#fff';o.strokeStyle='#111';o.lineWidth=3.5*u;o.beginPath();o.arc(jx+s.x*24*u,jy+s.y*24*u,20*u,0,6.28);o.fill();o.stroke();
 var air=d.st==='air'||d.st==='swing'||d.st==='take';txt(air?(s.y<-.5&&Math.abs(s.x)<.6?'AIM: TIP':s.x<-.35?'AIM: LEFT':s.x>.35?'AIM: RIGHT':'AIM: MIDDLE'):'MOVE',jx,jy-54*u,15*u,air?'#d62828':'#888');
 /* button */
 var bx=W*.75,by=DT+DH*.6,R0=48*u,lab,sub,fill='#fff',ink='#111',ring=null;
 if(d.st==='free'){lab='APPROACH';sub='hold';if(d.phase==='set'){fill='#111';ink='#fff'}}
 else if(d.st==='app'){var a=d.act,k=d.ct/a.tP;ring=k;if(d.plantT!=null){lab='JUMP!';sub='let go';fill='#1f9d55';ink='#fff'}else{lab='STEP…';sub='keep holding'}}
 else if(d.st==='take'||d.st==='air'){lab='SPIKE!';sub='tap';fill='#d62828';ink='#fff'}
 else{lab='…';sub=''}
 o.fillStyle=fill;o.strokeStyle='#111';o.lineWidth=4*u;o.beginPath();o.arc(bx,by,R0,0,6.28);o.fill();o.stroke();
 if(ring!=null){o.strokeStyle=ring>=1?'#1f9d55':'#111';o.lineWidth=6*u;o.beginPath();o.arc(bx,by,R0+8*u,-Math.PI/2,-Math.PI/2+6.283*Math.min(1,ring));o.stroke()}
 txt(lab,bx,by+6*u,(lab.length>6?19:24)*u,ink);if(sub)txt(sub,bx,by+24*u,11*u,ink==='#fff'?'#fff':'#777')}

/* ===== src/main.js ===== */
/* ======================================================================
   SIZE + LOOP
   ====================================================================== */
var GLH=DECK;
function size(){var r=app.getBoundingClientRect(),w=r.width,h=r.height,dp=devicePixelRatio||1,d=SET.res==='native'?dp:Math.max(.6,Math.min(dp,1.25)*(+SET.res||1));
 R.setPixelRatio(d);glc.style.height=(GLH*100)+'%';R.setSize(w,h*GLH,false);cam.aspect=w/(h*GLH);cam.updateProjectionMatrix();
 var hd=Math.min(2,dp);hud.width=Math.round(w*hd);hud.height=Math.round(h*hd);DOTS=null}
addEventListener('resize',size);
var lastR=performance.now(),acc=0,lastDraw=0;
function render(rdt){
 if(UI.screen==='team'){renderTeamPreview(rdt);drawHUD(null);ambUpdate();return}
 var demo=M.mode!=='play',near=SET.detail;
 if(M.mode==='drill'&&DR)drillRender(rdt);else PL.forEach(function(p){setVisible(p.C,true);stepPlayer(p,rdt,near===2||(near===1&&p.team===0))});
 /* ball */
 var showBall=B.live||B.held||B.dead;ballM.visible=ballSh.visible=showBall;if(showBall){ballM.position.set(B.p.x,B.p.y,B.p.z);ballM.userData.m.rotation.set(B.spin,B.spin*.6,0);ballSh.position.set(B.p.x,.006,B.p.z);ballSh.scale.setScalar(1-Math.min(.7,B.p.y*.15))}
 var fast=Math.hypot(B.v.x,B.v.y,B.v.z)>13&&B.live&&!B.held&&SET.fx;TRAILP.unshift({x:B.p.x,y:B.p.y,z:B.p.z});TRAILP.length=Math.min(TRAILP.length,trail.length*2);
 trail.forEach(function(m,i){var q=TRAILP[i*2+1];if(q)m.position.set(q.x,q.y,q.z);m.material.opacity=fast&&q?.32*(1-i/trail.length):0;m.scale.setScalar(1-i*.1)});
 if(venue.visible&&SET.detail)waveFlags(performance.now());
 if(M.mode!=='drill')placeCamera(rdt,demo);
 roofParts.forEach(function(r){r.visible=cam.position.y<10.5});
 HOOPS.forEach(function(h){var near2=Math.sign(cam.position.z)===h.sd&&Math.abs(cam.position.z)>12.5,tg=near2?.18:1;h.op=h.op==null?tg:h.op+(tg-h.op)*Math.min(1,rdt*6);h.g.traverse(function(m){if(!m.isMesh)return;if(m.material===OL){m.visible=h.op>.6&&!!SET.outl;return}m.material.opacity=h.op;m.material.depthWrite=h.op>.95})});
 var CT=M.mode==='drill'?null:ctrlFrame();R.render(scene,cam);drawHUD(CT);autoQ.tick();ambUpdate()}
function loop(t){var rdt=Math.min(.05,(t-lastR)/1000);
 var minDt=SET.fps<=30?1/31:0;if(t-lastDraw<minDt*1000-1){requestAnimationFrame(loop);return}lastDraw=t;lastR=t;
 if(!window.PAUSE){if(!M.paused&&UI.screen!=='team'){acc+=rdt;var n=0;while(acc>=STEP&&n++<12){update(STEP);acc-=STEP}if(n>=12)acc=0}render(rdt||.016)}
 requestAnimationFrame(loop)}
function init(){setupTeams();buildCtrl();if(SET.gfx!=='auto'&&SET.gfx!=='custom')applyPreset(SET.gfx);applyGfx();size();resetMatch('demo');requestAnimationFrame(loop);
 window.G={dr:function(){return DR},drillBtn:function(v){IN.keyBtn=!!v;drillBtn(v)},TM:TM,M:M,B:B,PL:PL,SET:SET,TEAM:TEAM,ROT:ROT,step:function(dt,n){for(var i=0;i<(n||1);i++)update(dt||STEP)},render:function(dt){render(dt||1/60)},press:press,start:startMatch,stick:function(x,y){IN.ov=x===null?null:{x:x,y:y}},activePend:activePend,show:show,CAM:CAM,cs:CS,serveScene:function(T){M.pend=[];M.blockEval=null;PL.forEach(function(p){p.act=null;p.post=null});M.serving=T;startServe()},hide:hideScreens,R:R,scene:scene,TM:TM,BODIES:BODIES}}
var fontReady=document.fonts&&document.fonts.load?Promise.race([document.fonts.load('40px Bangers'),new Promise(function(r){setTimeout(r,1500)})]):Promise.resolve();
fontReady.then(init,init);

})();
