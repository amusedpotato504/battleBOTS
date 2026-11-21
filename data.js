'use strict';
// ================= utils =================
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const TAU=Math.PI*2;
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[(Math.random()*a.length)|0];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function angDiff(a,b){let d=(b-a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function hexRgb(h){const n=parseInt(h.slice(1),16);return [n>>16,n>>8&255,n&255]}
function shade(hex,f){let [r,g,b]=hexRgb(hex);if(f<0){r*=1+f;g*=1+f;b*=1+f}else{r+=(255-r)*f;g+=(255-g)*f;b+=(255-b)*f}return `rgb(${r|0},${g|0},${b|0})`}
function rgba(hex,a){const [r,g,b]=hexRgb(hex);return `rgba(${r},${g},${b},${a})`}
function fmt(n){return Math.round(n).toLocaleString('en-US')}
function wpick(R,weights){let s=weights.reduce((a,b)=>a+b,0),x=R()*s;for(let i=0;i<weights.length;i++){x-=weights[i];if(x<=0)return i}return weights.length-1}
// value noise
function makeNoise(seed){
 const hv=(x,y)=>{let n=Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(seed,2246822519);n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return (n>>>0)/4294967296};
 const sm=t=>t*t*(3-2*t);
 const vn=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=sm(x-xi),yf=sm(y-yi);
  const a=hv(xi,yi),b=hv(xi+1,yi),c=hv(xi,yi+1),d=hv(xi+1,yi+1);return lerp(lerp(a,b,xf),lerp(c,d,xf),yf)};
 return (x,y,oct=4)=>{let s=0,amp=.5,f=1,norm=0;for(let i=0;i<oct;i++){s+=vn(x*f,y*f)*amp;norm+=amp;amp*=.5;f*=2.03}return s/norm};
}

// ================= parts =================
const SZ={S:1,M:2,L:3};
const FRAMES={
 wasp:{n:'Wasp Light Frame',cost:250,lv:0,hp:80,load:60,armor:0,r:14,spd:1.1,turn:7,mounts:[['M',.25,0]],util:1,desc:'Nimble single-mount scout.',
  body:[[1.15,0],[.35,-.72],[-.75,-.66],[-.98,-.25],[-.98,.25],[-.75,.66],[.35,.72]],panels:[[[.7,0],[.1,-.38],[-.6,-.34],[-.6,.34],[.1,.38]]],vents:[[-.75,-.18,.22,.36]],lights:[[1.0,-.12],[1.0,.12]]},
 jackal:{n:'Jackal Skirmisher',cost:600,lv:0,hp:105,load:85,armor:1,r:16,spd:1,turn:6,mounts:[['M',.15,-.42],['S',.15,.45]],util:2,desc:'Two hardpoints, two utility bays.',
  body:[[1.05,-.2],[1.05,.2],[.6,.85],[-.75,.85],[-1,.4],[-1,-.4],[-.75,-.85],[.6,-.85]],panels:[[[-.6,-.55],[.0,-.55],[.0,.55],[-.6,.55]]],vents:[[-.92,-.3,.18,.6]],lights:[[.98,-.3],[.98,.3]]},
 mantis:{n:'Mantis Striker',cost:950,lv:1,hp:95,load:85,armor:0,r:16,spd:1.05,turn:7,mounts:[['S',.62,-.6],['S',.62,.6],['M',-.18,0]],util:1,desc:'Three mounts on forward claw arms.',
  body:[[.55,-.25],[.95,-.75],[.65,-.95],[.1,-.62],[-.85,-.55],[-1,0],[-.85,.55],[.1,.62],[.65,.95],[.95,.75],[.55,.25]],panels:[[[-.7,-.35],[.2,-.35],[.2,.35],[-.7,.35]]],vents:[[-.95,-.15,.15,.3]],lights:[[.6,0]]},
 phantom:{n:'Phantom Interceptor',cost:1300,lv:1,hp:90,load:75,armor:0,r:15,spd:1.18,turn:8,mounts:[['M',.2,-.45],['M',.2,.45]],util:2,desc:'Fastest frame. Twin medium mounts.',
  body:[[1.25,0],[.6,-.3],[.55,-.75],[-.7,-.8],[-1,-.45],[-1,.45],[-.7,.8],[.55,.75],[.6,.3]],panels:[[[1.0,0],[.4,-.18],[-.8,-.15],[-.8,.15],[.4,.18]]],vents:[[-.95,-.65,.2,.3],[-.95,.35,.2,.3]],lights:[[1.12,0]]},
 rhino:{n:'Rhino Bruiser',cost:1200,lv:1,hp:155,load:130,armor:2,r:19,spd:.92,turn:4.5,mounts:[['L',.12,0],['S',-.5,.55]],util:2,desc:'Plow-nosed bruiser with a heavy mount.',
  body:[[1.15,0],[.8,-.95],[-.8,-.88],[-1,-.6],[-1,.6],[-.8,.88],[.8,.95]],panels:[[[1.08,0],[.82,-.7],[.82,.7]],[[-.85,-.7],[-.2,-.7],[-.2,-.2],[-.85,-.2]]],vents:[[-.95,.15,.15,.35]],lights:[[.95,-.4],[.95,.4]]},
 viper:{n:'Viper Lancer',cost:1400,lv:1,hp:100,load:100,armor:1,r:16,spd:1.02,turn:5.5,mounts:[['L',.3,0]],util:3,desc:'Long chassis built around one big gun.',
  body:[[1.35,-.12],[1.35,.12],[.9,.42],[-.95,.52],[-1.12,.2],[-1.12,-.2],[-.95,-.52],[.9,-.42]],panels:[[[-.9,-.32],[-.25,-.32],[-.25,.32],[-.9,.32]]],vents:[[-1.05,-.12,.12,.24],[.7,-.36,.3,.1],[.7,.26,.3,.1]],lights:[[1.28,0]]},
 hydra:{n:'Hydra Gunship',cost:1800,lv:2,hp:125,load:120,armor:1,r:19,spd:.95,turn:5,mounts:[['S',.48,-.58],['S',.48,.58],['S',-.38,-.58],['S',-.38,.58]],util:2,desc:'Four small hardpoints in sponsons.',
  body:[[.9,-.35],[.9,.35],[.75,.85],[.2,.95],[-.2,.95],[-.75,.85],[-.95,.35],[-.95,-.35],[-.75,-.85],[-.2,-.95],[.2,-.95],[.75,-.85]],panels:[[[-.5,-.3],[.5,-.3],[.5,.3],[-.5,.3]]],vents:[[-.9,-.2,.15,.4]],lights:[[.86,-.18],[.86,.18]]},
 bastion:{n:'Bastion Warden',cost:2300,lv:2,hp:175,load:155,armor:2,r:21,spd:.9,turn:4,mounts:[['M',.42,0],['M',-.22,-.55],['M',-.22,.55]],util:3,desc:'Three medium mounts, sturdy hull.',
  body:[[1.0,-.45],[1.0,.45],[.6,.95],[-.6,.95],[-1,.5],[-1,-.5],[-.6,-.95],[.6,-.95]],panels:[[[1.0,-.4],[1.12,-.2],[1.12,.2],[1.0,.4]],[[-.85,-.25],[-.5,-.25],[-.5,.25],[-.85,.25]]],vents:[[.1,-.85,.3,.12],[.1,.73,.3,.12]],lights:[[1.08,0]]},
 golem:{n:'Golem Siegebreaker',cost:2800,lv:3,hp:200,load:180,armor:3,r:23,spd:.86,turn:3.5,mounts:[['L',.22,0],['S',-.3,-.65],['S',-.3,.65]],util:3,desc:'Heavy siege platform with flank guns.',
  body:[[.95,-.6],[1.08,0],[.95,.6],[.5,.9],[-.3,1],[-.9,.75],[-1.05,0],[-.9,-.75],[-.3,-1],[.5,-.9]],panels:[[[-.85,-.35],[-.45,-.35],[-.45,.35],[-.85,.35]]],vents:[[-1,-.2,.12,.4],[.55,-.78,.25,.12],[.55,.66,.25,.12]],lights:[[1.0,-.3],[1.0,.3]]},
 citadel:{n:'Citadel Fortress',cost:3600,lv:3,hp:250,load:230,armor:4,r:25,spd:.8,turn:3,mounts:[['L',.22,-.42],['L',.22,.42]],util:3,desc:'Twin heavy mounts. A rolling bunker.',
  body:[[1.0,-.8],[1.08,-.25],[1.08,.25],[1.0,.8],[.7,1],[-.8,1],[-1.05,.75],[-1.05,-.75],[-.8,-1],[.7,-1]],panels:[[[-.9,-.5],[-.35,-.5],[-.35,.5],[-.9,.5]],[[.85,-.12],[1.06,-.12],[1.06,.12],[.85,.12]]],vents:[[-1,-.3,.1,.6]],lights:[[1.05,-.55],[1.05,.55]]}
};
const DRIVES={
 wheels:{n:'Street Wheels',cost:150,lv:0,speed:150,acc:5,turn:1,load:0,knock:0,haz:0,desc:'Quick and cheap on flat ground.'},
 offroad:{n:'All-Terrain Wheels',cost:450,lv:0,speed:138,acc:6,turn:1.1,load:15,knock:.15,haz:.3,desc:'Grippy, more load, partial slag resist.'},
 treads:{n:'Tank Treads',cost:550,lv:0,speed:98,acc:4,turn:.75,load:45,knock:.6,haz:.2,desc:'Slow, hauls heavy loads, hard to shove.'},
 legs:{n:'Quad Walker',cost:800,lv:1,speed:110,acc:9,turn:1.4,load:25,knock:.35,haz:.5,desc:'Agile legs. Steps around slag.'},
 omni:{n:'Omni Rollers',cost:900,lv:1,speed:128,acc:7,turn:1.2,load:5,knock:.1,haz:0,omni:true,desc:'Strafes in any direction.'},
 hover:{n:'Hover Skirt',cost:1100,lv:2,speed:144,acc:3,turn:1.2,load:-10,knock:-.3,haz:1,desc:'Floats over slag. Slides around.'}
};
const CORES={
 battery:{n:'Li-Ion Battery',cost:120,lv:0,pow:10,w:8,boom:0,desc:'10 power. Basic.'},
 cell:{n:'Hydrogen Fuel Cell',cost:450,lv:0,pow:16,w:12,boom:0,desc:'16 power.'},
 capacitor:{n:'Supercapacitor Bank',cost:750,lv:1,pow:14,w:10,boom:0,burst:true,desc:'14 power. +50% fire rate for the first 8s.'},
 fusion:{n:'Fusion Core',cost:1300,lv:2,pow:24,w:18,boom:60,desc:'24 power. Small blast on death.'},
 reactor:{n:'Antimatter Reactor',cost:2600,lv:3,pow:34,w:22,boom:115,desc:'34 power. Huge blast on death.'}
};
const ARMORS={
 steel:{n:'Steel Plating',cost:200,lv:0,ar:2,hp:.1,w:15,res:{},desc:'Heavy but solid.'},
 composite:{n:'Composite Weave',cost:650,lv:1,ar:2,hp:.05,w:7,res:{energy:.15},desc:'Light, some energy resist.'},
 reactive:{n:'Reactive Armor',cost:850,lv:1,ar:1,hp:.05,w:14,res:{explosive:.4},desc:'Blunts explosions.'},
 ceramic:{n:'Ceramic Tiles',cost:750,lv:1,ar:1,hp:.05,w:10,res:{energy:.3,thermal:.25},desc:'Beats lasers and fire.'},
 ablative:{n:'Ablative Shell',cost:950,lv:2,ar:1,hp:0,w:9,abl:70,res:{thermal:.3},desc:'Soaks the first 70 damage.'},
 titanium:{n:'Titanium Hull',cost:1600,lv:2,ar:4,hp:.18,w:12,res:{},desc:'High armor, light weight.'},
 neutronium:{n:'Neutronium Lattice',cost:3200,lv:3,ar:5,hp:.25,w:16,res:{kinetic:.1,explosive:.15,energy:.1},desc:'The best money can buy.'}
};
const WEAPONS={
 lmg:{n:'Light Machine Gun',sz:1,ty:'kinetic',kind:'proj',cost:200,lv:0,w:6,p:2,dmg:3,cd:.1,rng:260,spd:780,spr:.12,shell:true,len:15},
 pulse:{n:'Pulse Pistol',sz:1,ty:'energy',kind:'proj',cost:300,lv:0,w:5,p:3,dmg:8,cd:.45,rng:300,spd:620,spr:.04,len:13},
 spike:{n:'Ram Spike',sz:1,ty:'kinetic',kind:'melee',cost:150,lv:0,w:7,p:0,dmg:12,cd:.5,reach:9,len:16},
 needle:{n:'Needle Rifle',sz:1,ty:'kinetic',kind:'proj',cost:550,lv:1,w:5,p:2,dmg:7,cd:.32,rng:390,spd:1000,spr:.02,pierce:.5,len:19},
 microm:{n:'Micro-Missile Pod',sz:1,ty:'explosive',kind:'missile',cost:500,lv:1,w:8,p:2,dmg:8,cd:1.2,rng:360,spd:330,splash:30,homing:3.2,salvo:2,len:11},
 torch:{n:'Plasma Torch',sz:1,ty:'thermal',kind:'flame',cost:380,lv:1,w:6,p:3,dmg:1.1,cd:.05,rng:95,spd:260,spr:.3,len:12},
 minigun:{n:'Rotary Minigun',sz:2,ty:'kinetic',kind:'proj',cost:750,lv:0,w:14,p:4,dmg:3.6,cd:.07,rng:280,spd:800,spr:.15,spin:true,shell:true,len:22},
 shotgun:{n:'Scattergun',sz:2,ty:'kinetic',kind:'proj',cost:500,lv:0,w:11,p:2,dmg:6,cd:.95,rng:175,spd:650,spr:.45,pellets:7,knock:90,shell:true,len:18},
 autocannon:{n:'Autocannon',sz:2,ty:'kinetic',kind:'proj',cost:850,lv:1,w:16,p:3,dmg:14,cd:.55,rng:360,spd:720,spr:.05,shell:true,len:24},
 laser:{n:'Beam Laser',sz:2,ty:'energy',kind:'beam',cost:950,lv:1,w:10,p:7,dmg:3.4,cd:.1,rng:300,len:21},
 rockets:{n:'Rocket Pod',sz:2,ty:'explosive',kind:'missile',cost:900,lv:1,w:14,p:3,dmg:22,cd:1.6,rng:430,spd:300,splash:55,homing:2.4,salvo:1,len:16},
 grenade:{n:'Grenade Launcher',sz:2,ty:'explosive',kind:'arc',cost:700,lv:1,w:12,p:2,dmg:24,cd:1.5,rng:330,splash:60,flight:.75,scatter:30,len:17},
 flamer:{n:'Flamethrower',sz:2,ty:'thermal',kind:'flame',cost:700,lv:0,w:12,p:4,dmg:1.7,cd:.045,rng:130,spd:300,spr:.38,len:18},
 tesla:{n:'Tesla Coil',sz:2,ty:'energy',kind:'tesla',cost:1200,lv:2,w:13,p:8,dmg:15,cd:.9,rng:190,chain:3,stun:.2,len:14},
 saw:{n:'Buzzsaw',sz:2,ty:'kinetic',kind:'melee',cost:450,lv:0,w:12,p:2,dmg:15,cd:.32,reach:13,len:20},
 rail:{n:'Railgun',sz:3,ty:'kinetic',kind:'rail',cost:2100,lv:2,w:22,p:10,dmg:55,cd:2.6,charge:.5,rng:700,len:36},
 cannon:{n:'Heavy Cannon',sz:3,ty:'explosive',kind:'proj',cost:1600,lv:1,w:28,p:5,dmg:40,cd:2.0,rng:480,spd:560,spr:.03,splash:45,knock:160,len:32},
 missiles:{n:'Missile Battery',sz:3,ty:'explosive',kind:'missile',cost:2300,lv:2,w:26,p:6,dmg:15,cd:2.6,rng:520,spd:270,splash:40,homing:3,salvo:6,len:20},
 mortar:{n:'Siege Mortar',sz:3,ty:'explosive',kind:'arc',cost:1900,lv:2,w:24,p:4,dmg:46,cd:3,rng:650,minr:140,splash:85,flight:1.4,scatter:45,len:20},
 lance:{n:'Plasma Lance',sz:3,ty:'energy',kind:'beam',cost:2600,lv:3,w:18,p:12,dmg:8,cd:.1,rng:380,burnW:true,len:32},
 hammer:{n:'Pneumatic Hammer',sz:3,ty:'kinetic',kind:'melee',cost:1300,lv:1,w:26,p:3,dmg:48,cd:1.3,reach:22,knock:260,stunT:.6,len:28},
 inferno:{n:'Inferno Cannon',sz:3,ty:'thermal',kind:'flame',cost:2000,lv:2,w:22,p:7,dmg:3.2,cd:.05,rng:175,spd:330,spr:.5,len:26}
};
const WDESC={lmg:'Fast, light bullets.',pulse:'Accurate energy bolts.',spike:'Melee ram.',needle:'Long range, half armor pierce.',microm:'2 homing micro-missiles.',torch:'Tiny flamer. Ignites.',
 minigun:'Spins up to a bullet hose.',shotgun:'7 pellets, knockback.',autocannon:'Hard-hitting mid-range shells.',laser:'Instant continuous beam.',rockets:'Homing rocket, splash.',grenade:'Lobs over walls. Splash.',flamer:'Cone of fire. Ignites.',tesla:'Chains between 3 targets. Can stun.',saw:'Spinning melee blade.',
 rail:'Charged shot. Pierces bots, ignores armor.',cannon:'Explosive shell, big knockback.',missiles:'6-missile homing salvo.',mortar:'Indirect fire over walls. Huge splash.',lance:'Heavy beam that ignites.',hammer:'Huge melee hit. Stuns.',inferno:'Massive flame cone.'};
const UTILS={
 shield:{n:'Shield Projector',cost:900,lv:0,w:8,p:5,val:50,desc:'Regenerating 50-pt barrier.'},
 repair:{n:'Nanorepair Swarm',cost:800,lv:0,w:5,p:3,val:4,desc:'Heals 4 HP/s.'},
 booster:{n:'Thruster Pack',cost:450,lv:0,w:6,p:2,cdv:4,desc:'Dash to engage or escape.'},
 plating:{n:'Bolt-on Plating',cost:400,lv:0,w:14,p:0,val:.25,desc:'+25% HP. Heavy.'},
 gyro:{n:'Gyro Stabilizer',cost:400,lv:0,w:4,p:1,val:.7,desc:'Resists knockback, tighter spread.'},
 spikes:{n:'Spiked Bumpers',cost:300,lv:0,w:8,p:0,val:.5,desc:'Reflects 50% of melee damage.'},
 mines:{n:'Mine Dispenser',cost:600,lv:1,w:9,p:1,cdv:5,desc:'Drops proximity mines.'},
 overclock:{n:'Overclock Chip',cost:700,lv:1,w:1,p:4,val:.25,desc:'+25% fire rate.'},
 cooling:{n:'Cryo Cooling',cost:550,lv:1,w:6,p:0,val:.15,desc:'+15% fire rate, fire immune.'},
 targeting:{n:'Targeting Computer',cost:650,lv:1,w:3,p:2,val:.15,desc:'+15% range, -40% spread.'},
 flares:{n:'Countermeasure Flares',cost:450,lv:1,w:4,p:1,val:.45,desc:'45% chance to decoy missiles.'},
 decoy:{n:'Decoy Beacon',cost:600,lv:1,w:4,p:1,desc:'Draws enemy fire to this bot.'},
 emp:{n:'EMP Emitter',cost:1100,lv:2,w:7,p:4,cdv:9,desc:'Stuns nearby foes, drains shields.'},
 gundrone:{n:'Gun Drone Bay',cost:1000,lv:2,w:7,p:3,val:4,desc:'Orbiting drone shoots your target.'},
 medidrone:{n:'Medic Drone',cost:1100,lv:2,w:7,p:3,val:6,desc:'Heals the most damaged ally.'},
 stealth:{n:'Stealth Field',cost:1500,lv:3,w:5,p:6,cdv:10,desc:'Cloaks for 3s every 10s.'}
};
const CHIPS={
 basic:{n:'Basic Logic Board',cost:100,lv:0,react:.9,aim:1,lead:.55,desc:'Slow reactions.'},
 tactical:{n:'Tactical Processor',cost:700,lv:1,react:.55,aim:1.3,lead:.85,desc:'Faster aim, better leading.'},
 neural:{n:'Combat Neural Net',cost:1800,lv:2,react:.3,aim:1.6,lead:1,dodge:true,desc:'Elite aim. Dodges missiles.'}
};
const CATS={frame:FRAMES,drive:DRIVES,core:CORES,armor:ARMORS,weapon:WEAPONS,util:UTILS,chip:CHIPS};
const CATNAME={frame:'Frame',drive:'Drive',core:'Power Core',armor:'Armor',weapon:'Weapon',util:'Utility',chip:'AI Chip'};
const AFFIX={
 dmg:{n:'Heavy-hitting',c:['weapon'],a:.08,b:.2,f:'+{p}% damage'},
 rate:{n:'Rapid',c:['weapon'],a:.08,b:.18,f:'+{p}% fire rate'},
 range:{n:'Long-barrel',c:['weapon'],a:.08,b:.2,f:'+{p}% range',no:'melee'},
 acc:{n:'Precise',c:['weapon'],a:.25,b:.5,f:'-{p}% spread'},
 pierce:{n:'Piercing',c:['weapon'],a:.2,b:.4,f:'ignores {p}% armor'},
 burn:{n:'Incendiary',c:['weapon'],a:.1,b:.25,f:'{p}% ignite chance'},
 shock:{n:'Shocking',c:['weapon'],a:.04,b:.1,f:'{p}% stun chance'},
 leech:{n:'Vampiric',c:['weapon'],a:.05,b:.12,f:'{p}% lifesteal'},
 light:{n:'Lightweight',c:['weapon','util','armor','core'],a:.15,b:.35,f:'-{p}% weight'},
 eff:{n:'Efficient',c:['weapon','util'],a:.2,b:.45,f:'-{p}% power draw'},
 hp:{n:'Reinforced',c:['frame','armor'],a:.06,b:.15,f:'+{p}% HP'},
 load:{n:'Hauler',c:['frame','drive'],a:.08,b:.2,f:'+{p}% load capacity'},
 armor:{n:'Hardened',c:['frame','armor'],a:1,b:2,int:1,f:'+{v} armor'},
 speed:{n:'Turbo',c:['drive','frame'],a:.05,b:.12,f:'+{p}% speed'},
 accel:{n:'Grippy',c:['drive'],a:.15,b:.35,f:'+{p}% acceleration'},
 pow:{n:'Overcharged',c:['core'],a:.12,b:.3,f:'+{p}% power'},
 stable:{n:'Stabilized',c:['core'],a:1,b:1,int:1,f:'no death blast'},
 res:{n:'Insulated',c:['armor'],a:.1,b:.2,f:'+{p}% energy/thermal resist'},
 blast:{n:'Blastproof',c:['armor'],a:.1,b:.25,f:'+{p}% explosive resist'},
 amp:{n:'Amplified',c:['util'],a:.15,b:.35,f:'+{p}% effect'},
 quick:{n:'Quick-cycle',c:['util'],a:.15,b:.3,f:'-{p}% cooldown'},
 react:{n:'Quickened',c:['chip'],a:.15,b:.3,f:'-{p}% reaction time'},
 cal:{n:'Calibrated',c:['chip'],a:.1,b:.25,f:'+{p}% aim speed'}
};
const TIERS=[null,{n:'Standard',mk:'Mk I',col:'#a3acb7',mul:1,price:1,af:0},{n:'Refined',mk:'Mk II',col:'#4da3ff',mul:1.08,price:1.9,af:1},{n:'Prototype',mk:'Mk III',col:'#b07cff',mul:1.16,price:3.2,af:2},{n:'Masterwork',mk:'Mk IV',col:'#ffb020',mul:1.25,price:5.5,af:3}];
const BEHAVIORS={
 aggro:{n:'Aggressive',d:'Closes in and stays on target.'},
 berserk:{n:'Berserker',d:'Charges, never retreats. Faster when hurt.'},
 kite:{n:'Kiter',d:'Holds max range, backs off when rushed.'},
 sniper:{n:'Sniper',d:'Stays far back, prefers clear lines of fire.'},
 flank:{n:'Flanker',d:'Circles the target while firing.'},
 skirm:{n:'Skirmisher',d:'Hit and run in timed bursts.'},
 guard:{n:'Bodyguard',d:'Shadows the weakest ally.'},
 sentinel:{n:'Sentinel',d:'Holds ground; only hunts when nothing is in range.'}
};
const TARGETS={
 near:{n:'Nearest',d:'Whatever is closest.'},
 weak:{n:'Weakest',d:'Lowest HP. Finishes kills.'},
 threat:{n:'Biggest threat',d:'Highest damage output.'},
 focus:{n:'Team focus',d:'Whatever allies are shooting.'},
 heavy:{n:'Heaviest',d:'Largest max HP. Tank hunter.'},
 fragile:{n:'Least armored',d:'Lowest armor.'},
 famous:{n:'Most famous',d:'Highest reputation. Glory hunter.'}
};
const FINISHES={factory:'Factory',weathered:'Weathered',rusted:'Rusted',chrome:'Chrome',matte:'Matte',camo:'Camo',hazard:'Hazard',carbon:'Carbon'};
const PAINTS=['#c9cdd2','#3d4248','#1f2328','#8b1e1e','#c23b22','#d9831f','#e3b51c','#5b6b2e','#2f5d3a','#1f6f6a','#2a5fa8','#1d2f5c','#5b3a8c','#8c3a6b','#e8e2d0','#7a5b3a'];
const MAPS={
 foundry:{n:'Foundry',walls:[[560,170,80,150],[560,480,80,150],[250,370,150,60],[800,370,150,60]],crates:[[190,150],[970,610],[190,610],[970,150],[580,380]],slag:[[430,190,52],[770,610,52]]},
 pillars:{n:'Pillar Hall',walls:[[275,225,50,50],[575,225,50,50],[875,225,50,50],[275,525,50,50],[575,525,50,50],[875,525,50,50]],crates:[[420,380],[740,380],[580,90],[580,670]],slag:[[600,400,58]]},
 crossfire:{n:'Crossfire',walls:[[150,230,330,28],[720,542,330,28],[586,90,28,190],[586,520,28,190]],crates:[[300,440],[860,320],[530,380],[630,380]],slag:[[250,630,50],[950,170,50]]},
 scrapyard:{n:'Scrapyard',walls:[[480,140,240,24],[480,636,240,24]],crates:[[380,220],[380,540],[780,220],[780,540],[560,300],[600,300],[560,460],[600,460],[290,380],[870,380],[480,380],[680,380]],slag:[[600,400,40],[170,120,38],[1030,680,38]]},
 reactor:{n:'Reactor Core',walls:[[520,250,160,26],[520,524,160,26],[440,330,26,140],[734,330,26,140]],crates:[[300,200],[860,560],[300,560],[860,200]],slag:[[600,400,48],[160,400,34],[1040,400,34]]},
 canyon:{n:'Canyon',walls:[[260,0,30,250],[260,550,30,250],[910,0,30,250],[910,550,30,250],[520,300,160,30],[520,470,160,30]],crates:[[400,120],[760,640],[400,640],[760,120]],slag:[[600,120,44],[600,680,44]]}
};

// ================= career data =================
const LEAGUES=[
 {n:'Scrap League',sq:2,bud:2700,purse:450,repMul:1,tw:[1,.0,0,0],lv:0,rep:[5,45],teams:['Rustbucket Raiders','Junkyard Dogs','Bolt Brothers','Spare Parts Co.'],champ:'The Scrap King'},
 {n:'Steel Circuit',sq:3,bud:8000,purse:1200,repMul:1.3,tw:[.75,.25,0,0],lv:1,rep:[60,220],teams:['Chrome Syndicate','Voltage Vandals','Gearhead Gang','Piston Union'],champ:'Steel Tyrants'},
 {n:'Iron Majors',sq:3,bud:18000,purse:2400,repMul:1.6,tw:[.5,.38,.12,0],lv:2,rep:[200,480],teams:['Iron Legion','Thunder Works','Red Dynamo','Blackforge'],champ:'Ironclad Dynasty'},
 {n:'Titan Series',sq:4,bud:38000,purse:4500,repMul:2,tw:[.3,.42,.23,.05],lv:3,rep:[420,950],teams:['Titan Forge','Neon Reapers','Omega Labs','Atlas Heavy'],champ:'Colossus Corp'},
 {n:'Grand Championship',sq:4,bud:64000,purse:7500,repMul:2.5,tw:[.12,.4,.34,.14],lv:3,rep:[850,1700],teams:['Apex Robotics','Eclipse Engineering','Vanguard Prime','Obsidian Order'],champ:'The Undefeated'}
];
const RANKS=[[0,'Unknown','#6b7684'],[30,'Rookie','#9aa3ad'],[90,'Contender','#8fd18f'],[200,'Pro','#4da3ff'],[380,'Veteran','#3ee6c1'],[650,'Star','#b07cff'],[1000,'Champion','#ffb020'],[1500,'Legend','#ff6a3d'],[2200,'Immortal','#ff3b8a']];
function rankOf(rep){let r=RANKS[0];for(const x of RANKS)if(rep>=x[0])r=x;return r}
const BOT_NAMES=['Scrapjaw','Rust Fang','Hex-9','Mauler','Ironclad','Vex','Ripper','Gnasher','Torque','Shard','Havoc','Cinder','Dread','Bolt-Eater','Grinder','Sputter','Kilowatt','Magnetar','Crank','Slagheart','Rivet','Tinpot','Sledge','Wrecker','Gauss','Ember','Tempest','Monolith','Jolt','Krait','Banshee','Warden','Nimbus','Brimstone','Riptide','Static','Furnace','Lockjaw','Quake','Vulture','Specter','Ravager','Anvil','Talon','Mirage','Cyclone','Goliath','Paladin','Inferno','Apex','Zenith','Oblivion','Harbinger','Titanus','Nemesis','Valkyrie','Behemoth','Overlord','Sovereign','Eclipse','Requiem','Colossus','Leviathan','Juggernaut','Phalanx','Cerberus','Hydra Prime','Omega'];
function epithet(b){const s=b.st;
 if(s.k>=40)return 'the Annihilator';if(s.mvp>=12)return 'the Ace';if(s.k>=25)return 'the Executioner';if(s.m>=8&&s.d===0)return 'the Unbreakable';
 if(s.dmg>=15000)return 'the Wrecker';if(s.w>=20)return 'the Conqueror';if(s.best>=8)return 'the Relentless';if(s.k>=12)return 'the Hunter';if(s.mvp>=4)return 'the Showstopper';if(s.m>=15)return 'the Veteran';return ''}

// ================= v3: perks, modifiers, bounties =================
const PERKS={
 tough:{n:'Hardened Chassis',d:'+12% max HP.',i:'⛨'},
 gunner:{n:'Gunnery',d:'+8% weapon damage.',i:'✹'},
 trigger:{n:'Hair Trigger',d:'+10% fire rate.',i:'⚡'},
 eagle:{n:'Eagle Eye',d:'+10% range, tighter spread.',i:'◎'},
 nimble:{n:'Nimble',d:'+8% speed, +20% turning.',i:'➶'},
 plated:{n:'Thick Skin',d:'+1 armor.',i:'▦'},
 regen:{n:'Field Repair',d:'Regenerates 1.5 HP/s.',i:'✚'},
 laststand:{n:'Last Stand',d:'+30% damage below 30% HP.',i:'♥'},
 executioner:{n:'Executioner',d:'+30% damage to targets under 25% HP.',i:'☠'},
 steady:{n:'Iron Nerves',d:'Stuns last half as long, +25% knockback resist.',i:'⚓'},
 scavenger:{n:'Scavenger',d:'Repair kits heal double.',i:'♺'},
 showman:{n:'Showman',d:'+25% reputation earned.',i:'★'},
 thrifty:{n:"Mechanic's Pet",d:'-35% repair costs.',i:'🔧'},
 firststrike:{n:'First Strike',d:'+40% fire rate for the first 6 seconds.',i:'⏱'},
 giantkiller:{n:'Giant Killer',d:'+15% damage vs bots with more reputation.',i:'⚔'},
 tactician:{n:'Tactician',d:'-40% reaction time, better target leading.',i:'♞'}
};
const MODIFIERS={
 night:{n:'Night Match',d:'Floodlights are off. Only headlights, fire and muzzle flashes light the arena.',i:'☾'},
 minefield:{n:'Minefield',d:'Neutral mines are scattered across the floor. They hurt everyone.',i:'✸'},
 barrage:{n:'Artillery Barrage',d:'Shells rain down on marked spots every few seconds.',i:'☄'},
 sudden:{n:'Sudden Death',d:'The barrier starts closing at 25 seconds.',i:'⌛'},
 supply:{n:'Supply Drops',d:'Repair kits drop often, up to 4 at once.',i:'✚'},
 overdrive:{n:'Overdrive',d:'All bots fire 35% faster and move 15% faster.',i:'⚡'}
};
const BOUNTIES={
 flawless:{n:'Flawless',d:'Win without losing a bot.'},
 quick:{n:'Blitz',d:'Win in under 40 seconds.'},
 giant:{n:'Topple the Star',d:"Destroy the enemy's most famous bot."},
 mvp:{n:'Spotlight',d:'One of your bots is match MVP.'},
 lone:{n:'Lone Wolf',d:'Win with only one bot still standing.'},
 dominant:{n:'Dominant',d:'Win with every surviving bot above 50% HP.'}
};
function rankIdx(rep){let i=0;RANKS.forEach((r,k)=>{if(rep>=r[0])i=k});return i}
