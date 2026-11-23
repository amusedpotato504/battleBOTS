'use strict';
// ================= save state =================
// ---- save slots ----
const SLOTS=3;let ACTIVE=1;
const slotKey=n=>'botarena_slot_'+n;
try{['botarena_career_v2','botarena_v1'].forEach(k=>localStorage.removeItem(k));
 // move the single save from the previous version into slot 1
 const old=localStorage.getItem('botarena_career_v4');if(old){if(!localStorage.getItem(slotKey(1)))localStorage.setItem(slotKey(1),old);localStorage.removeItem('botarena_career_v4')}
 const a=+localStorage.getItem('botarena_active');if(a>=1&&a<=SLOTS)ACTIVE=a}catch(e){}
let S=null;
function persist(){if(!S)return;S.saved=Date.now();try{localStorage.setItem(slotKey(ACTIVE),JSON.stringify(S));localStorage.setItem('botarena_active',ACTIVE)}catch(e){}}
function readSlot(n){try{const s=JSON.parse(localStorage.getItem(slotKey(n))||'null');if(s&&s.v===2&&s.bots)return migrate(s)}catch(e){}return null}
function deleteSlot(n){try{localStorage.removeItem(slotKey(n))}catch(e){}}
function migrate(s){s.nemesis=s.nemesis||{};s.stats=s.stats||{bounties:0,wagerNet:0,revenge:0};for(const b of s.bots){b.perks=b.perks||[];b.hist=b.hist||[]}for(const t of Object.values(s.rivals||{}))for(const b of t.bots)b.st=b.st||{m:0,w:0,k:0,d:0,dmg:0,mvp:0,streak:0,best:0};return s}
function perkPts(b){return rankIdx(b.rep)-(b.perks||[]).length}
function upgradeCost(p){if(p.t>=4)return 0;return Math.round(baseOf(p).cost*(TIERS[p.t+1].price-TIERS[p.t].price)*1.1/10)*10}
function upgradePart(p){const c=upgradeCost(p);if(!c||S.credits<c)return false;S.credits-=c;p.t++;rollAffixes(p,1);persist();return true}
function rerollCost(p){return Math.max(50,Math.round(partValue(p)*.22/10)*10)}
function rerollPart(p){const n=Object.keys(p.af).length;if(!n)return false;const c=rerollCost(p);if(S.credits<c)return false;S.credits-=c;p.af={};rollAffixes(p,n);persist();return true}

function newPart(c,k,t=1,af=null,R=Math.random){
 const p={id:'p'+(S.nid++),c,k,t,af:af||{}};
 if(!af&&t>1)rollAffixes(p,TIERS[t].af,R);
 return p;
}
function rollAffixes(p,n,R=Math.random){
 const B=CATS[p.c][p.k];const pool=Object.entries(AFFIX).filter(([k,a])=>!(k in p.af)&&a.c.includes(p.c)&&!(k==='quick'&&!B.cdv)&&!(k==='amp'&&!B.val)&&!(k==='eff'&&B.p===0)&&!(p.c==='weapon'&&k==='acc'&&!B.spr)&&!(a.no&&p.c==='weapon'&&WEAPONS[p.k].kind===a.no)&&!(k==='range'&&p.c==='weapon'&&WEAPONS[p.k].kind==='melee'));
 for(let i=0;i<n&&pool.length;i++){const j=(R()*pool.length)|0;const [k,a]=pool.splice(j,1)[0];let v=a.a+(a.b-a.a)*R();if(a.int)v=Math.round(v);else v=Math.round(v*100)/100;p.af[k]=v}
}
const baseOf=p=>CATS[p.c][p.k];
function partValue(p){return Math.round(baseOf(p).cost*TIERS[p.t].price/10)*10}
function partName(p){return (p.t>1?TIERS[p.t].mk+' ':'')+baseOf(p).n}
function affixText(p){return Object.entries(p.af).map(([k,v])=>{const a=AFFIX[k];return a.f.replace('{p}',Math.round(v*100)).replace('{v}',v)})}
function affixNames(p){return Object.keys(p.af).map(k=>AFFIX[k].n)}

// enough for one well-equipped bot (~¢1,700-2,300) or two bare-bones ones (~¢820 each)
const STARTING_CREDITS=2500;
function newCareer(team){
 S={v:2,nemesis:{},stats:{bounties:0,wagerNet:0,revenge:0},team:team||'Garage Rats',credits:STARTING_CREDITS,nid:1,inv:{},bots:[],retired:[],league:0,ladder:0,unlocked:0,trophies:[],rivals:{},market:[],log:[],matches:0,crowned:0,nbid:1};
 genRivals();refreshMarket();persist();
}
function mkBot(name,paint){return {id:'b'+(S.nbid++),perks:[],name,frame:null,drive:null,core:null,armor:null,chip:null,weps:[],utils:[],paint,ai:{beh:'aggro',tgt:'near',eng:1,ret:.2},rep:0,st:{m:0,w:0,k:0,d:0,dmg:0,mvp:0,streak:0,best:0},titles:[],hist:[],born:S.matches}}
function syncEquip(){
 for(const id in S.inv)S.inv[id].on=null;
 for(const b of S.bots){for(const id of [b.frame,b.drive,b.core,b.armor,b.chip,...b.weps,...b.utils])if(id&&S.inv[id])S.inv[id].on=b.id}
}
function botValue(b,inv=S.inv){let v=0;for(const id of [b.frame,b.drive,b.core,b.armor,b.chip,...b.weps,...b.utils])if(id&&inv[id])v+=partValue(inv[id]);return v}

// ================= stats =================
function compute(b,inv=S.inv){
 const g=id=>id&&inv[id]||null,A=p=>p?p.af:{};
 const f=g(b.frame),dr=g(b.drive),co=g(b.core),ar=g(b.armor),chip=g(b.chip);
 const o={warn:[],ok:true,weps:[],util:{},weight:0,draw:0,res:{kinetic:0,explosive:0,energy:0,thermal:0},abl:0};
 if(!f){o.ok=false;o.warn.push('Needs a frame');o.r=15;o.hp=0;o.speed=0;o.dps=0;o.range=0;o.load=1;o.pow=0;o.armor=0;o.arPct=0;return o}
 const F=FRAMES[f.k];o.F=F;o.fk=f.k;o.r=F.r;
 let hpMul=1+(A(f).hp||0),armor=F.armor+(A(f).armor||0),load=F.load*(1+(A(f).load||0)),spdMul=F.spd*(1+(A(f).speed||0)),hp=F.hp*TIERS[f.t].mul;
 if(dr){const D=DRIVES[dr.k];o.dk=dr.k;load+=D.load*(1+(A(dr).load||0));o.base=D.speed*(1+(TIERS[dr.t].mul-1)*.5)*(1+(A(dr).speed||0));o.acc=D.acc*(1+(A(dr).accel||0));o.turn=F.turn*D.turn;o.knock=D.knock;o.haz=D.haz;o.omni=!!D.omni;o.hover=!!D.hover}
 else{o.ok=false;o.warn.push('Needs a drive');o.base=0;o.acc=5;o.turn=F.turn;o.knock=0;o.haz=0}
 if(co){const C=CORES[co.k];o.pow=C.pow*TIERS[co.t].mul*(1+(A(co).pow||0));o.weight+=C.w*(1-(A(co).light||0));o.boom=A(co).stable?0:C.boom;o.burst=!!C.burst;o.ck=co.k}
 else{o.ok=false;o.warn.push('Needs a power core');o.pow=0}
 if(ar){const R=ARMORS[ar.k],m=TIERS[ar.t].mul,af=A(ar);o.ak=ar.k;armor+=Math.round(R.ar*m)+(af.armor||0);hpMul+=R.hp*m+(af.hp||0);o.weight+=R.w*(1-(af.light||0));
  for(const k in R.res)o.res[k]+=R.res[k];if(af.res){o.res.energy+=af.res;o.res.thermal+=af.res}if(af.blast)o.res.explosive+=af.blast;o.abl=(R.abl||0)*m}
 const U=o.util;
 b.utils.forEach(id=>{const p=g(id);if(!p)return;const D=UTILS[p.k],af=A(p),m=TIERS[p.t].mul;o.weight+=D.w*(1-(af.light||0));o.draw+=D.p*(1-(af.eff||0));
  const val=(D.val||0)*m*(1+(af.amp||0)),cd=(D.cdv||0)*(1-(af.quick||0));
  if(U[p.k]){U[p.k].val+=val;U[p.k].cd=Math.min(U[p.k].cd,cd)*.85;U[p.k].n++}else U[p.k]={val,cd,n:1}});
 if(U.plating)hpMul+=U.plating.val;
 if(U.cooling)o.res.thermal+=.5;
 b.weps.forEach((id,i)=>{const p=g(id);if(!p)return;const W=WEAPONS[p.k],af=A(p),m=TIERS[p.t].mul;
  o.weight+=W.w*(1-(af.light||0));o.draw+=W.p*(1-(af.eff||0));
  const tg=(U.targeting?U.targeting.val:0)+(U.sensor?U.sensor.val:0),feed=1+(U.ammofeed?U.ammofeed.val:0);
  o.weps.push({slot:i,k:p.k,W,t:p.t,dmg:W.dmg*m*(1+(af.dmg||0))*feed,cd:W.cd/(1+(af.rate||0)),rng:(W.rng||0)*(1+(af.range||0)+tg),
   spr:(W.spr||0)*(1-(af.acc||0))*(U.targeting?.6:1)*(U.gyro?.8:1),pierce:(W.pierce||0)+(af.pierce||0),burn:af.burn||0,shock:(W.shock||0)+(af.shock||0),leech:af.leech||0})});
 if(chip){const C=CHIPS[chip.k],af=A(chip);o.react=C.react*(1-(af.react||0));o.aim=C.aim*TIERS[chip.t].mul*(1+(af.cal||0));o.lead=C.lead;o.dodge=!!C.dodge}
 else{o.ok=false;o.warn.push('Needs an AI chip');o.react=1;o.aim=1;o.lead=.5}
 o.load=load;o.hp=hp*hpMul*2.2;o.armor=armor;o.arPct=Math.min(.6,armor*.05);
 o.wr=o.weight/load;
 if(U.servos){spdMul*=1+U.servos.val;o.turn*=1.15}
 let sp=o.base*spdMul*(1-.12*Math.min(1,o.wr));if(o.wr>1)sp*=Math.max(0,1-(o.wr-1)*2);o.speed=sp;
 if(o.wr>1.4){o.ok=false;o.warn.push('Too heavy to move (over 140% load)')}else if(o.wr>1)o.warn.push('Overloaded: speed penalty');
 o.powMul=o.draw>o.pow&&o.pow>0?o.pow/o.draw:1;if(o.pow>0&&o.draw>o.pow)o.warn.push(`Underpowered: weapons cycle at ${Math.round(o.powMul*100)}%`);
 o.rate=o.powMul*(1+(U.overclock?U.overclock.val:0)+(U.cooling?U.cooling.val:0));
 if(!o.weps.length){o.ok=false;o.warn.push('Needs at least one weapon')}
 const pk=new Set(b.perks||[]);o.perks=pk;
 if(pk.has('tough'))o.hp*=1.12;if(pk.has('plated')){o.armor+=1;o.arPct=Math.min(.6,o.armor*.05)}
 if(pk.has('nimble')){o.speed*=1.08;o.turn*=1.2}if(pk.has('tactician')){o.react*=.6;o.lead=Math.min(1,o.lead+.15)}if(pk.has('steady'))o.knock=(o.knock||0)+.25;
 if(pk.has('trigger'))o.rate*=1.1;for(const w of o.weps){if(pk.has('gunner'))w.dmg*=1.08;if(pk.has('eagle')){w.rng*=1.1;w.spr*=.8}}
 o.range=0;
 o.dps=o.weps.reduce((s,w)=>s+wdps(w)*o.rate,0)+(U.gundrone?U.gundrone.val/.55:0);
 const rr=o.weps.filter(w=>w.W.kind!=='melee').map(w=>w.rng);o.range=rr.length?Math.max(...rr):0;
 o.melee=o.weps.some(w=>w.W.kind==='melee');
 o.value=botValue(b,inv);
 return o;
}
function wdps(w){const W=w.W;if(W.kind==='rail')return w.dmg/(w.cd+W.charge);return w.dmg*(W.pellets||1)*(W.salvo||1)/w.cd*(W.splash?1.25:1)*(W.kind==='tesla'?1.6:1)}

// ================= rivals & enemy generation =================
function genRivals(){
 const used=new Set();const R=mulberry(hashStr(S.team)+7);
 const nm=()=>{let n=BOT_NAMES[(R()*BOT_NAMES.length)|0],k=0;const base=n;while(used.has(n)){k++;n=k<8?BOT_NAMES[(R()*BOT_NAMES.length)|0]:base+' '+['II','III','IV','V','VI'][(k-8)%5]+(k>12?k:'')}used.add(n);return n};
 LEAGUES.forEach((L,li)=>{[...L.teams,L.champ].forEach((t,ti)=>{
  const champ=ti===4,c1=PAINTS[(R()*PAINTS.length)|0],c2=PAINTS[(R()*PAINTS.length)|0];
  S.rivals[t]={li,champ,paint:{p:c1,s:c2===c1?'#1f2328':c2,fin:pick(Object.keys(FINISHES))},
   bots:Array.from({length:4},()=>({name:nm(),rep:Math.round(lerp(L.rep[0],L.rep[1],R())*(champ?1.4:1)),st:{m:0,w:0,k:0,d:0,dmg:0,mvp:0,streak:0,best:0},num:(R()*99|0)+1}))};
 })});
}
function opponentFor(li,ladder){const L=LEAGUES[li];return ladder>=4?L.champ:L.teams[ladder]}
function genEnemyBot(budget,li,seed,paint){
 const L=LEAGUES[li],R=mulberry(seed);
 const ok=(o,k)=>o[k].lv<=L.lv;
 const tier=()=>1+wpick(R,L.tw);
 let best=null,bs=-1e9,cheap=null;
 for(let tries=0;tries<110;tries++){
  const inv={};let n=0;const P=(c,k)=>{const t=tier();const p={id:'e'+(n++),c,k,t,af:{}};if(t>1)rollAffixes(p,TIERS[t].af,R);inv[p.id]=p;return p.id};
  const fr=Object.keys(FRAMES).filter(k=>ok(FRAMES,k)&&FRAMES[k].cost<=budget*.45);if(!fr.length)continue;
  const fk=fr[wpick(R,fr.map(k=>Math.pow(FRAMES[k].cost+300,li*.45)))],F=FRAMES[fk];
  const b={frame:P('frame',fk),drive:null,core:null,armor:null,chip:null,weps:[],utils:[]};
  const ex=li*.5;const wp=(obj,ks)=>ks[wpick(R,ks.map(k=>Math.pow(obj[k].cost+150,ex)))];const pk=obj=>wp(obj,Object.keys(obj).filter(k=>ok(obj,k)));
  if(R()<.85)b.armor=P('armor',pk(ARMORS));b.chip=P('chip',pk(CHIPS));
  F.mounts.forEach(([s])=>{const cands=Object.keys(WEAPONS).filter(k=>ok(WEAPONS,k)&&WEAPONS[k].sz<=SZ[s]);const same=cands.filter(k=>WEAPONS[k].sz===SZ[s]);
   const pool=(R()<.75&&same.length)?same:cands;b.weps.push(P('weapon',wp(WEAPONS,pool)))});
  for(let i=0;i<F.util;i++)b.utils.push(R()<.55+li*.1?P('util',pk(UTILS)):null);
  let wt=0,dr=0;for(const id of [b.armor,...b.weps,...b.utils]){if(!id)continue;const q=inv[id],B=CATS[q.c][q.k];wt+=B.w||0;dr+=B.p||0}
  const cks=Object.keys(CORES).filter(k=>ok(CORES,k)).sort((x,y)=>CORES[x].pow-CORES[y].pow);const ck=cks.find(k=>CORES[k].pow>=dr*(R()<.3?1.15:1))||cks[cks.length-1];b.core=P('core',ck);wt+=CORES[ck].w;
  const dks=Object.keys(DRIVES).filter(k=>ok(DRIVES,k));let fitD=dks.filter(k=>F.load+DRIVES[k].load>=wt*.98);if(!fitD.length)fitD=['treads'];b.drive=P('drive',wp(DRIVES,fitD));
  const o=compute(b,inv);if(!o.ok)continue;
  const v=o.value;if(!cheap||v<cheap.o.value)cheap={b,inv,o};if(v>budget*1.1)continue;const pw=Math.sqrt(o.hp*o.dps)*(.75+Math.min(o.range,450)/900)*(.8+.2*Math.min(1,o.speed/120));let sc=pw*(1+R()*.12)*Math.min(1,o.powMul+.1)*(o.wr>1.02?.85:1)*(.85+.15*v/budget);
  if(sc>bs){bs=sc;best={b,inv,o}}
 }
 return best||cheap;
}
function enemySquad(team,li,ladder,exhibition){
 const L=LEAGUES[li],rv=S.rivals[team];
 const mult=exhibition?.85:ladder>=4?1.3:(.72+ladder*.12);
 const per=L.bud*mult/L.sq;
 const bots=rv.bots.slice().sort((a,b)=>b.rep-a.rep).slice(0,L.sq);
 return bots.map((rb,i)=>{const g=genEnemyBot(per*(i===0?1.12:.96),li,hashStr(team+rb.name)+S.matches*31+i,rv.paint);
  return {rb,design:Object.assign(g.b,{name:rb.name,paint:{...rv.paint,num:rb.num},ai:{beh:pickBeh(g.o),tgt:pick(Object.keys(TARGETS)),eng:rnd(.85,1),ret:rnd(0,.3)}}),inv:g.inv,o:g.o}});
}
function pickBeh(o){
 if(o.melee&&o.weps.every(w=>w.W.kind==='melee'))return pick(['aggro','berserk','flank']);
 if(o.range>=480)return pick(['sniper','kite','sentinel']);
 if(o.range<=200)return pick(['aggro','berserk','flank']);
 return pick(['aggro','kite','flank','skirm','guard','sentinel']);
}

// ================= market =================
function refreshMarket(){
 const li=S.unlocked,L=LEAGUES[Math.min(li+1,4)];S.market=[];
 const cats=['frame','drive','core','armor','weapon','weapon','weapon','util','util','chip'];
 for(let i=0;i<6;i++){const c=pick(cats),obj=CATS[c];const ks=Object.keys(obj).filter(k=>obj[k].lv<=Math.min(3,li+1)&&obj[k].cost>0);
  const t=2+wpick(Math.random,[.55,.32,.13]);const p=newPart(c,pick(ks),t);S.market.push(p)}
}
function catalogFor(c){const obj=CATS[c];return Object.keys(obj).filter(k=>obj[k].lv<=S.unlocked)}
function buyCatalog(c,k){const cost=CATS[c][k].cost;if(S.credits<cost)return null;S.credits-=cost;const p=newPart(c,k,1);S.inv[p.id]=p;persist();return p}
function buyMarket(i){const p=S.market[i];const cost=partValue(p);if(S.credits<cost)return null;S.credits-=cost;S.inv[p.id]=p;S.market.splice(i,1);persist();return p}
function sellPart(id){const p=S.inv[id];if(!p||p.on)return;S.credits+=Math.round(partValue(p)*.5);delete S.inv[id];persist()}
function fame(){return Math.round(S.bots.reduce((a,b)=>a+b.rep,0)+S.retired.reduce((a,b)=>a+b.rep*.5,0)+S.trophies.length*150)}
