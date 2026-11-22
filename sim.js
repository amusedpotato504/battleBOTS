'use strict';
// ================= battle =================
const CELL=40;let G=null,loopGen=0,uid=1;
const cv=$('#cv'),ctx=cv.getContext('2d');let view={s:1,ox:0,oy:0,dpr:1};
function startBattle(cfg){
 $$('.screen').forEach(s=>s.classList.remove('on'));$('#battle').classList.add('on');$('#nav').style.display='none';$('#topbar').style.display='none';
 const portrait=cv.clientHeight>cv.clientWidth*1.05,W=portrait?800:1200,H=portrait?1200:800,M=MAPS[cfg.map];
 const tr=portrait?(a=>[a[1],1200-a[0]-a[2],a[3],a[2]]):(a=>a.slice());
 const tc=portrait?(a=>[a[1],1200-a[0],a[2]]):(a=>a.slice());
 G={cfg,W,H,portrait,t:0,bots:[],proj:[],parts:[],texts:[],beams:[],bolts:[],mines:[],pickups:[],flashes:[],fields:{},
  walls:M.walls.map(tr).map(a=>({x:a[0],y:a[1],w:a[2],h:a[3],crate:false})),slag:[],saws:[],ice:[],
  cols:W/CELL,rows:H/CELL,over:false,overT:0,winner:-1,speed:1,paused:false,shake:0,pickT:9,sel:null,acc:0,last:performance.now(),shown:false};
 for(const h of M.hz){const [x,y,r]=tc(h.slice(1));({slag:G.slag,saw:G.saws,ice:G.ice})[h[0]].push({x,y,r,a:Math.random()*TAU})}
 M.crates.map(a=>tr([a[0],a[1],40,40])).forEach(a=>G.walls.push({x:a[0],y:a[1],w:40,h:40,crate:true,hp:80,max:80,hit:0}));
 const mods=new Set(cfg.mods||[]);G.mods=mods;G.stormStart=mods.has('sudden')?25:60;G.barT=4;G.marks=[];G.kcCd=0;G.firstBlood=false;
 buildGrid();
 const spawn=(team,list)=>list.forEach((u,i)=>{const n=list.length,off=(i-(n-1)/2)*115;let x,y;
  if(portrait){x=W/2+off;y=team?95:H-95}else{x=team?W-95:95;y=H/2+off}G.bots.push(makeUnit(u,team,x,y))});
 spawn(0,cfg.p);spawn(1,cfg.e);
 G.floor=genArena(G,M,hashStr(cfg.map)+S.matches);
 if(mods.has('minefield'))for(let k=0,n=0;k<200&&n<16;k++){const x=rnd(G.W*.15,G.W*.85),y=rnd(G.H*.12,G.H*.88);if(wallAt(x,y,20)||onHazard(x,y,20)||G.bots.some(b=>Math.hypot(b.x-x,b.y-y)<130))continue;G.mines.push({x,y,team:-1,src:null,arm:0,t:rnd(0,3),neutral:1});n++}
 if(mods.has('supply'))G.pickT=4;G.decals=mkCanvas(W*FS,H*FS);
 $('#tnP').textContent=S.team;$('#tnE').textContent=cfg.eTeam;
 resize();setSpeed(1);G.paused=false;$('#pauseBtn').textContent='❚❚';$('#feed').innerHTML='';$('#inspect').style.display='none';
 showBanner(cfg.title||'FIGHT','#ffb020');sfx('horn');setTimeout(()=>{if(G)announce(M.n,'#c3ccd7')},600);if(mods.size)setTimeout(()=>{for(const m of mods)announce(MODIFIERS[m].i+' '+MODIFIERS[m].n,'#c9a7ff')},900);G.gen=++loopGen;requestAnimationFrame(loop);
}
function endBattle(){G=null}
function makeUnit(u,team,x,y){
 const o=u.o||compute(u.design,u.inv),d=u.design,vis=makeVis(d,o,u.inv);
 const face=G.portrait?(team?Math.PI/2:-Math.PI/2):(team?Math.PI:0);
 const U=o.util;
 const b={id:uid++,team,u,rec:u.rec,name:d.name,rep:u.rec.rep,paint:d.paint,o,vis,ai:d.ai,x,y,vx:0,vy:0,angle:face,r:o.r,
  hp:o.hp,maxHp:o.hp,abl:o.abl,shield:(U.shield?U.shield.val:0)+(U.aegis?U.aegis.val:0),shieldMax:(U.shield?U.shield.val:0)+(U.aegis?U.aegis.val:0),slow:0,shieldHit:0,lastHit:-9,lastAtk:null,lastAtkT:-9,
  speed:o.speed,stun:0,burn:0,burnSrc:null,dash:0,target:null,retarget:0,orbit:Math.random()<.5?1:-1,stuckT:0,ph:0,flash:0,dmgAcc:0,txtT:0,marks:[],
  mod:{}, home:{x:lerp(x,G.W/2,.3),y:lerp(y,G.H/2,.3)},idle:0,skT:0,skPhase:0,cloak:0,
  st:{dmg:0,kills:[],taken:0,heal:0},dead:false,deathT:0,smokeT:0,
  knockRes:clamp((o.knock||0)+(U.gyro?U.gyro.val:0),-.5,.9)};
 b.weps=o.weps.map((w,i)=>({...w,cdB:w.cd,cd:rnd(.2,.9),spin:0,charge:0,burst:0,burstT:0,recoil:0,aim:face,vis:vis.weps[i]}));
 b.pk=o.perks||new Set();if(G.mods.has('overdrive'))b.speed*=1.15;
 if(u.dummy){b.speed=0;b.hp=b.maxHp=b.maxHp*6;b.dummy=1}
 for(const k in U)if(U[k].cd)b.mod[k]=rnd(1.5,3);
 if(U.gundrone)b.drone={a:0,cd:1,x,y,val:U.gundrone.val};
 if(U.medidrone)b.medic={a:Math.PI,x,y,val:U.medidrone.val,tgt:null};
 if(U.mines)b.myMines=0;
 return b;
}
// ---------- pathing ----------
function onHazard(x,y,p=0){return G.slag.some(l=>Math.hypot(x-l.x,y-l.y)<l.r+p)||G.saws.some(l=>Math.hypot(x-l.x,y-l.y)<l.r+p)}
function buildGrid(){const N=G.cols*G.rows;G.block=new Uint8Array(N);G.slagC=new Uint8Array(N);G.sawC=new Uint8Array(N);
 for(let j=0;j<G.rows;j++)for(let i=0;i<G.cols;i++){const cx=i*CELL+CELL/2,cy=j*CELL+CELL/2,k=j*G.cols+i;
  for(const w of G.walls)if(cx>w.x-19&&cx<w.x+w.w+19&&cy>w.y-19&&cy<w.y+w.h+19){G.block[k]=1;break}
  for(const l of G.slag)if(Math.hypot(cx-l.x,cy-l.y)<l.r+18)G.slagC[k]=1;for(const l of G.saws)if(Math.hypot(cx-l.x,cy-l.y)<l.r+20)G.sawC[k]=1}G.fields={}}
const cellOf=(x,y)=>clamp((y/CELL)|0,0,G.rows-1)*G.cols+clamp((x/CELL)|0,0,G.cols-1);
const DIRS=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
function field(tx,ty,hz,key){const c=G.fields[key];if(c&&G.t-c.t<.5)return c.d;
 const cols=G.cols,rows=G.rows,d=new Float32Array(cols*rows).fill(1e9),st=cellOf(tx,ty);d[st]=0;const hk=[st],hd=[0];
 const push=(k,v)=>{hk.push(k);hd.push(v);let i=hk.length-1;while(i>0){const p=(i-1)>>1;if(hd[p]<=hd[i])break;[hk[p],hk[i]]=[hk[i],hk[p]];[hd[p],hd[i]]=[hd[i],hd[p]];i=p}};
 const pop=()=>{const k=hk[0],v=hd[0],lk=hk.pop(),lv=hd.pop();if(hk.length){hk[0]=lk;hd[0]=lv;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<hk.length&&hd[l]<hd[m])m=l;if(r<hk.length&&hd[r]<hd[m])m=r;if(m===i)break;[hk[m],hk[i]]=[hk[i],hk[m]];[hd[m],hd[i]]=[hd[i],hd[m]];i=m}}return [k,v]};
 const sc=1+6*(1-hz);
 while(hk.length){const [k,v]=pop();if(v>d[k])continue;const x=k%cols,y=(k/cols)|0;
  for(const [dx,dy,cst] of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;const nk=ny*cols+nx;if(G.block[nk])continue;if(dx&&dy&&(G.block[y*cols+nx]||G.block[ny*cols+x]))continue;
   const nv=v+cst*(G.slagC[nk]?sc:1)*(G.sawC[nk]?6:1);if(nv<d[nk]){d[nk]=nv;push(nk,nv)}}}
 G.fields[key]={t:G.t,d};return d}
function pathDir(b,tx,ty,key){const hz=b.o.haz||0,d=field(tx,ty,hz,key+'_'+hz),k=cellOf(b.x,b.y),x=k%G.cols,y=(k/G.cols)|0;let best=d[k],bx=null,by=null;
 for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=G.cols||ny>=G.rows)continue;const nk=ny*G.cols+nx;if(G.block[nk])continue;if(dx&&dy&&(G.block[y*G.cols+nx]||G.block[ny*G.cols+x]))continue;if(d[nk]<best){best=d[nk];bx=nx;by=ny}}
 if(bx===null){const a=Math.atan2(ty-b.y,tx-b.x);return [Math.cos(a),Math.sin(a)]}const cx=bx*CELL+CELL/2-b.x,cy=by*CELL+CELL/2-b.y,l=Math.hypot(cx,cy)||1;return [cx/l,cy/l]}
// ---------- geometry ----------
function segRect(x0,y0,dx,dy,r){let tmin=0,tmax=1;
 if(Math.abs(dx)<1e-9){if(x0<r.x||x0>r.x+r.w)return Infinity}else{let t1=(r.x-x0)/dx,t2=(r.x+r.w-x0)/dx;if(t1>t2)[t1,t2]=[t2,t1];tmin=Math.max(tmin,t1);tmax=Math.min(tmax,t2);if(tmin>tmax)return Infinity}
 if(Math.abs(dy)<1e-9){if(y0<r.y||y0>r.y+r.h)return Infinity}else{let t1=(r.y-y0)/dy,t2=(r.y+r.h-y0)/dy;if(t1>t2)[t1,t2]=[t2,t1];tmin=Math.max(tmin,t1);tmax=Math.min(tmax,t2);if(tmin>tmax)return Infinity}return tmin}
function segCircle(x0,y0,dx,dy,cx,cy,r){const fx=x0-cx,fy=y0-cy,a=dx*dx+dy*dy,b=2*(fx*dx+fy*dy),c=fx*fx+fy*fy-r*r;let D=b*b-4*a*c;if(D<0)return Infinity;D=Math.sqrt(D);const t1=(-b-D)/(2*a),t2=(-b+D)/(2*a);if(t1>=0&&t1<=1)return t1;if(t1<0&&t2>=0)return 0;return Infinity}
function rayWall(x0,y0,dx,dy){let bt=Infinity,bw=null;for(const w of G.walls){const t=segRect(x0,y0,dx,dy,w);if(t<bt){bt=t;bw=w}}return [bt,bw]}
// thick line test: is there room for a body of radius r to travel straight from a to (tx,ty)?
function clearLine(a,tx,ty,r){const dx=tx-a.x,dy=ty-a.y,L=Math.hypot(dx,dy)||1,px=-dy/L*r*.85,py=dx/L*r*.85;
 for(const [ox,oy] of [[0,0],[px,py],[-px,-py]])if(rayWall(a.x+ox,a.y+oy,dx,dy)[0]<=1)return false;return true}
// fraction (0..1) of a probe of length L in direction (ux,uy) that is free of walls, arena edges and (optionally) slag
function freeFrac(b,ux,uy,L,avoidSlag){let t=1;const px=-uy*b.r*.8,py=ux*b.r*.8;
 for(const [ox,oy] of [[0,0],[px,py],[-px,-py]]){const x0=b.x+ox,y0=b.y+oy,dx=ux*L,dy=uy*L;const [tw]=rayWall(x0,y0,dx,dy);if(tw<t)t=tw;
  if(dx>0)t=Math.min(t,(G.W-b.r*.6-x0)/dx);if(dx<0)t=Math.min(t,(b.r*.6-x0)/dx);if(dy>0)t=Math.min(t,(G.H-b.r*.6-y0)/dy);if(dy<0)t=Math.min(t,(b.r*.6-y0)/dy)}
 for(const l of avoidSlag?G.slag.concat(G.saws):G.saws){const tt=segCircle(b.x,b.y,ux*L,uy*L,l.x,l.y,l.r+b.r*.6);if(tt<t)t=tt}
 return clamp(t,0,1)}
const STEER_DIRS=Array.from({length:16},(_,i)=>[Math.cos(i/16*TAU),Math.sin(i/16*TAU)]);
// context steering: choose the open direction that best matches the desired one
function steer(b,mx,my){const ml=Math.hypot(mx,my);if(ml<.05)return [0,0];const ux=mx/ml,uy=my/ml,L=b.r+30+Math.min(60,b.speed*.35),slag=(b.o.haz||0)<.9;
 let best=-1e9,bx=ux,by=uy;const pv=b.steerDir||[ux,uy];
 for(const [dx,dy] of STEER_DIRS){const want=dx*ux+dy*uy;if(want<-.2)continue;const f=freeFrac(b,dx,dy,L,slag);const sc=want-(1-f)*1.8+.18*(dx*pv[0]+dy*pv[1]);if(sc>best){best=sc;bx=dx;by=dy}}
 const fd=freeFrac(b,ux,uy,L,slag);if(fd>.98){bx=ux;by=uy}
 b.steerDir=[bx,by];const m=Math.min(1,ml);return [bx*m,by*m]}
function los(a,b){return rayWall(a.x,a.y,b.x-a.x,b.y-a.y)[0]>1}
function wallAt(x,y,p=0){for(const w of G.walls)if(x>w.x-p&&x<w.x+w.w+p&&y>w.y-p&&y<w.y+w.h+p)return w;return null}
function pushOut(b,R){const cx=clamp(b.x,R.x,R.x+R.w),cy=clamp(b.y,R.y,R.y+R.h);let dx=b.x-cx,dy=b.y-cy,d2=dx*dx+dy*dy;if(d2>=b.r*b.r)return false;let nx,ny,p;
 if(d2<1e-6){const L=b.x-R.x,Rr=R.x+R.w-b.x,T=b.y-R.y,Bm=R.y+R.h-b.y,m=Math.min(L,Rr,T,Bm);if(m===L){nx=-1;ny=0;p=L+b.r}else if(m===Rr){nx=1;ny=0;p=Rr+b.r}else if(m===T){nx=0;ny=-1;p=T+b.r}else{nx=0;ny=1;p=Bm+b.r}}
 else{const d=Math.sqrt(d2);nx=dx/d;ny=dy/d;p=b.r-d}b.x+=nx*p;b.y+=ny*p;const vn=b.vx*nx+b.vy*ny;if(vn<0){b.vx-=vn*nx;b.vy-=vn*ny}return true}
// ---------- combat ----------
const alive=b=>!b.dead;
const enemiesOf=b=>G.bots.filter(o=>!o.dead&&o.team!==b.team);
const alliesOf=b=>G.bots.filter(o=>!o.dead&&o.team===b.team&&o!==b);
const visible=(b,o)=>o.cloak<=0||dist(b,o)<(b.o.util.sensor?300:90);
function guardAnchor(b){const al=alliesOf(b);if(!al.length)return null;return al.reduce((a,o)=>o.hp/o.maxHp<a.hp/a.maxHp?o:a)}
function chooseTarget(b){
 const es=enemiesOf(b).filter(o=>visible(b,o));if(!es.length)return null;
 const dec=es.filter(o=>o.o.util.decoy&&dist(o,b)<320);if(dec.length)return dec.reduce((a,o)=>dist(o,b)<dist(a,b)?o:a);
 const sc=o=>dist(b,o)*(los(b,o)?1:(b.ai.beh==='sniper'?3:1.6));
 if(b.ai.beh==='guard'){const anc=guardAnchor(b);if(anc)return es.reduce((a,o)=>dist(o,anc)<dist(a,anc)?o:a)}
 const by=(f,max)=>es.reduce((a,o)=>(max?f(o)>f(a):f(o)<f(a))?o:a);
 switch(b.ai.tgt){
  case 'weak':return by(o=>o.hp);
  case 'threat':return by(o=>o.o.dps,1);
  case 'heavy':return by(o=>o.maxHp,1);
  case 'fragile':return by(o=>o.o.arPct);
  case 'famous':return by(o=>o.rep,1);
  case 'focus':{const cnt={};alliesOf(b).forEach(a=>{if(a.target&&!a.target.dead)cnt[a.target.id]=(cnt[a.target.id]||0)+1});let best=null,bc=0;for(const o of es)if((cnt[o.id]||0)>bc){bc=cnt[o.id];best=o}if(best)return best}
 }
 return es.reduce((a,o)=>sc(o)<sc(a)?o:a);
}
const ARMORED={kinetic:1,explosive:1,energy:.5,thermal:.5};
function damage(t,amt,src,ty,w){
 if(t.dead||G.over&&G.overT>1.2)return 0;
 const pierce=w?w.pierce:0;
 if(src&&src.pk&&src.team!==t.team&&ty!=='burn'){const pk=src.pk;if(pk.has('laststand')&&src.hp/src.maxHp<.3)amt*=1.3;if(pk.has('executioner')&&t.hp/t.maxHp<.25)amt*=1.3;if(pk.has('giantkiller')&&t.rep>src.rep)amt*=1.15}
 if(ty==='rail')amt*=1;else if(ARMORED[ty])amt*=1-t.o.arPct*ARMORED[ty]*(1-pierce);
 if(ty==='slag')amt*=1-(t.o.haz||0);
 const rk=ty==='rail'?'kinetic':ty==='burn'?'thermal':ty;if(t.o.res[rk])amt*=1-Math.min(.8,t.o.res[rk]);
 if(amt<=0)return 0;
 if(t.abl>0&&ty!=='storm'&&ty!=='slag'){const ab=Math.min(t.abl,amt);t.abl-=ab;amt-=ab*.9}
 if(t.shield>0&&!['slag','storm','burn','saw'].includes(ty)){const mul=w&&w.W.shieldX||1,ab=Math.min(t.shield,amt*mul);t.shield-=ab;amt-=ab/mul;t.shieldHit=.12}
 t.hp-=amt;t.flash=.06;t.dmgAcc+=amt;t.st.taken+=amt;
 if(src&&src.team!==t.team){src.st.dmg+=amt;t.lastAtk=src;t.lastAtkT=G.t;t.lastHit=G.t;
  if(w){if(w.leech&&!src.dead){const h=Math.min(amt*w.leech,src.maxHp-src.hp);src.hp+=h;src.st.heal+=h}
   if(w.burn&&Math.random()<w.burn&&!t.o.util.cooling){t.burn=2.5;t.burnSrc=src}
   if(w.shock&&Math.random()<w.shock){stunT(t,.5)}
   if(w.W.slow){t.slow=1.4}}}
 else if(ty!=='burn')t.lastHit=G.t;
 if(t.hp<=0)kill(t,src&&src.team!==t.team?src:(G.t-t.lastAtkT<4?t.lastAtk:null),ty);
 return amt;
}
function stunT(t,x){t.stun=Math.max(t.stun,x*(t.pk&&t.pk.has('steady')?.5:1))}
function knock(t,ax,ay,f){f*=1-t.knockRes;t.vx+=ax*f;t.vy+=ay*f}
function mark(t,x,y,s){if(t.marks.length>14)t.marks.shift();const dx=x-t.x,dy=y-t.y,c=Math.cos(-t.angle),sn=Math.sin(-t.angle);t.marks.push({x:(dx*c-dy*sn)*.8,y:(dx*sn+dy*c)*.8,s})}
function kill(t,src,ty){
 t.dead=true;t.hp=0;t.deathT=G.t;t.killedBy=src;if(src)src.st.kills.push(t);
 killEvents(t,src);
 explosionFx(t.x,t.y,t.r*2.4,true);sfx('big',t.x,t.y);
 t.vis.tint='rgba(18,12,8,.72)';t.weps.forEach(w=>{if(Math.random()<.6)debris(t.x,t.y,4,'#2b2e32',true)});
 for(let i=0;i<10;i++)debris(t.x,t.y,1,pick(['#3a3f45',shadeHex(t.paint.p,-.3),'#222']));
 scorch(t.x,t.y,t.r*2.6,.75);G.shake=Math.max(G.shake,12);
 if(t.o.boom){explode(t.x,t.y,t.o.boom,t.o.boom*.7,t,-1,'explosive');addFeed(`<span style="color:#ffb020">${esc(t.name)}'s core detonated!</span>`)}
 const how=ty==='slag'?'melted in the slag':ty==='saw'?'shredded by a floor saw':ty==='storm'?'fried by the barrier':ty==='burn'?'burned down':'destroyed';
 addFeed(src?`<b style="color:${tc(src)}">${esc(src.name)}</b> ⨯ <b style="color:${tc(t)}">${esc(t.name)}</b>`:`<b style="color:${tc(t)}">${esc(t.name)}</b> ${how}`);
}
function shadeHex(h,f){return shade(h,f)}
const tc=b=>b.team?'#ff6b7f':'#5ff0cf';
function addFeed(html){const d=document.createElement('div');d.innerHTML=html;const f=$('#feed');f.prepend(d);while(f.children.length>3)f.lastChild.remove();setTimeout(()=>d.remove(),3500)}
function explode(x,y,R,dmg,src,team,ty='explosive'){
 if(ty==='energy'){flashL(x,y,R*2.6,'#7fd8ff',.25);spark(x,y,14,'#bff4ff',R*6);G.bolts.push({ring:true,x,y,r:R*.3,max:R*1.3,life:.25,ml:.25,col:'#9fe8ff'});sfx('boom',x,y,.6)}else
 explosionFx(x,y,R,false);scorch(x,y,R*.8,.5);sfx(R>60?'big':'boom',x,y,R>40?1:.6);G.shake=Math.max(G.shake,R/9);
 for(const o of G.bots)if(!o.dead&&o.team!==team&&o!==src){const d=Math.hypot(o.x-x,o.y-y);if(d<R+o.r){const f=1-.5*d/(R+o.r);damage(o,dmg*f,src,ty);const a=Math.atan2(o.y-y,o.x-x);knock(o,Math.cos(a),Math.sin(a),140*f);mark(o,x,y,4)}}
 for(const w of [...G.walls])if(w.crate){const cx=clamp(x,w.x,w.x+w.w),cy=clamp(y,w.y,w.y+w.h);if(Math.hypot(cx-x,cy-y)<R)hitCrate(w,dmg*.8)}
}
function hitCrate(w,d){if(!w.crate)return;w.hp-=d;w.hit=.08;
 if(w.hp<=0&&G.walls.includes(w)){G.walls.splice(G.walls.indexOf(w),1);for(let i=0;i<12;i++)debris(w.x+20,w.y+20,1.3,pick(['#4f5a3a','#3d4630','#5c6745']));explosionFx(w.x+20,w.y+20,26,false);scorch(w.x+20,w.y+20,30,.4);buildGrid()}}
// ---------- fx ----------
function P(p){if(G.parts.length<650)G.parts.push(p)}
function spark(x,y,n,col='#ffd890',sp=200){for(let i=0;i<n;i++){const a=rnd(0,TAU),s=rnd(sp*.3,sp);P({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(.12,.3),max:.3,size:rnd(.8,1.6),col,type:'spark'})}}
function smoke(x,y,s,life=1.4,dark=.5){P({x,y,vx:rnd(-12,12),vy:rnd(-12,12),life:rnd(life*.7,life),max:life,size:s,col:dark,type:'smoke',rot:rnd(0,TAU)})}
function fire(x,y,s,vx=0,vy=0,life=.4){P({x,y,vx:vx+rnd(-20,20),vy:vy+rnd(-20,20),life:rnd(life*.6,life),max:life,size:s,type:'fire',rot:rnd(0,TAU)})}
function debris(x,y,sz,col,big){const a=rnd(0,TAU),s=rnd(90,300);P({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:3,max:3,size:rnd(2,4.5)*sz,col,type:'debris',rot:rnd(0,TAU),vr:rnd(-14,14),big})}
function shell(x,y,a){const s=rnd(70,130),aa=a+Math.PI/2+rnd(-.4,.4);P({x,y,vx:Math.cos(aa)*s,vy:Math.sin(aa)*s,life:2,max:2,size:1.3,col:'#c9a227',type:'shell',rot:rnd(0,TAU),vr:rnd(-20,20)})}
function flashL(x,y,r,col,life=.06){G.flashes.push({x,y,r,col,life,max:life})}
function explosionFx(x,y,R,big){
 flashL(x,y,R*2.4,'#ff9a40',.3);
 for(let i=0;i<(big?12:7);i++){const a=rnd(0,TAU),s=rnd(20,R*2.2);fire(x+Math.cos(a)*R*.2,y+Math.sin(a)*R*.2,rnd(R*.22,R*.5),Math.cos(a)*s,Math.sin(a)*s,rnd(.3,.55))}
 for(let i=0;i<(big?12:6);i++)smoke(x+rnd(-R/2,R/2),y+rnd(-R/2,R/2),rnd(R*.6,R*1.3),rnd(1.5,3),.75);
 spark(x,y,big?24:12,'#ffcf7a',R*7);
 for(let i=0;i<(big?6:2);i++)debris(x,y,.7,'#2a2d31');
 G.bolts.push({ring:true,x,y,r:R*.3,max:R*1.4,life:.25,ml:.25});
}
function scorch(x,y,r,a){const c=G.decals.getContext('2d');c.setTransform(FS,0,0,FS,0,0);for(let i=0;i<5;i++){const px=x+rnd(-r*.3,r*.3),py=y+rnd(-r*.3,r*.3),rr=r*rnd(.5,1),g=c.createRadialGradient(px,py,0,px,py,rr);g.addColorStop(0,`rgba(8,6,4,${a*.7})`);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.arc(px,py,rr,0,TAU);c.fill()}
 c.strokeStyle=`rgba(5,5,5,${a*.18})`;c.lineWidth=1;for(let i=0;i<5;i++){const aa=rnd(0,TAU);c.beginPath();c.moveTo(x+Math.cos(aa)*r*.3,y+Math.sin(aa)*r*.3);c.lineTo(x+Math.cos(aa)*r*rnd(.8,1.3),y+Math.sin(aa)*r*rnd(.8,1.3));c.stroke()}}
function bake(p){const c=G.decals.getContext('2d');c.setTransform(FS,0,0,FS,0,0);c.save();c.translate(p.x,p.y);c.rotate(p.rot);
 if(p.type==='shell'){c.fillStyle='#8a6d1a';c.fillRect(-1.3,-.5,2.6,1);c.fillStyle='#e0c060';c.fillRect(-1.3,-.5,2.6,.35)}else{c.fillStyle=p.col;c.globalAlpha=.9;c.beginPath();c.moveTo(-p.size/2,-p.size*.3);c.lineTo(p.size*.4,-p.size*.4);c.lineTo(p.size/2,p.size*.3);c.lineTo(-p.size*.2,p.size*.4);c.fill();c.fillStyle='rgba(255,255,255,.15)';c.fillRect(-p.size*.3,-p.size*.3,p.size*.5,p.size*.15)}c.restore()}
// ---------- weapons ----------
function mountPos(b,w){const c=Math.cos(b.angle),s=Math.sin(b.angle);return [b.x+w.vis.mx*c-w.vis.my*s,b.y+w.vis.mx*s+w.vis.my*c]}
function muzzleOf(b,w){const [mx,my]=mountPos(b,w),L=w.W.len;return [mx+Math.cos(w.aim)*L,my+Math.sin(w.aim)*L]}
function fireWeapon(b,w,t){
 const W=w.W,[mx,my]=muzzleOf(b,w),a0=w.aim;b.lastShot=G.t;w.recoil=W.sz*1.5;if(WSND[w.k]&&W.kind!=='missile')sfx(WSND[w.k],mx,my,W.sz===1?.6:1);
 if(W.kind==='proj'||W.kind==='flame'){const n=W.pellets||1;
  for(let i=0;i<n;i++){const a=a0+rnd(-w.spr/2,w.spr/2),sp=W.spd*(W.kind==='flame'?rnd(.8,1.2):n>1?rnd(.85,1.1):1);
   G.proj.push({x:mx,y:my,px:mx,py:my,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,team:b.team,src:b,w,life:w.rng/W.spd*(W.kind==='flame'?1:1.15),k:w.k,ty:W.ty,r:W.kind==='flame'?3:W.splash?4:2,age:0,dmg:w.dmg})}
  if(W.kind==='proj'){flashL(mx,my,W.sz*28,W.ty==='energy'?'#6ff3ff':'#ffc070');G.flashes.push({spr:1,x:mx,y:my,a:a0,s:6+W.sz*4,life:.05,max:.05,col:W.ty==='energy'?'#6ff3ff':null});
   if(W.shell)shell(mx-Math.cos(a0)*W.len*.6,my-Math.sin(a0)*W.len*.6,a0);if(W.sz>=2)smoke(mx,my,4+W.sz*3,.5,.4);}
  if(W.knock){knock(b,-Math.cos(a0),-Math.sin(a0),W.knock*.4)}
  if(k3(W))G.shake=Math.max(G.shake,3);
 }else if(W.kind==='missile'){w.burst=W.salvo;w.burstT=0}
 else if(W.kind==='arc'){if(dist(b,t)<(W.minr||0))return;const gx=t.x+t.vx*W.flight*.6+rnd(-W.scatter,W.scatter),gy=t.y+t.vy*W.flight*.6+rnd(-W.scatter,W.scatter);
  G.proj.push({arc:true,z:0,sx:mx,sy:my,gx,gy,x:mx,y:my,t:0,T:W.flight*(.6+.4*Math.hypot(gx-mx,gy-my)/w.rng),h:W.sz*30+30,team:b.team,src:b,w,k:w.k,ty:W.ty,dmg:w.dmg});
  flashL(mx,my,50,'#ffb35c');smoke(mx,my,10,1,.5);G.flashes.push({spr:1,x:mx,y:my,a:a0,s:12,life:.06,max:.06})}
 else if(W.kind==='beam'){const L=w.rng,dx=Math.cos(a0)*L,dy=Math.sin(a0)*L;const [tw,wall]=rayWall(mx,my,dx,dy);let hit=null,ht=tw;
  for(const o of G.bots)if(!o.dead&&o.team!==b.team){const tt=segCircle(mx,my,dx,dy,o.x,o.y,o.r);if(tt<ht){ht=tt;hit=o}}ht=Math.min(ht,1);const ex=mx+dx*ht,ey=my+dy*ht;
  if(hit){damage(hit,w.dmg,b,W.ty,w);if(W.burnW&&Math.random()<.08&&!hit.o.util.cooling){hit.burn=2;hit.burnSrc=b}if(Math.random()<.1)mark(hit,ex,ey,2.5)}else if(wall&&tw<=1){hitCrate(wall,w.dmg*.6);if(Math.random()<.3)scorch(ex,ey,4,.4)}
  const col=w.k==='lance'?'#c070ff':w.k==='ion'?'#7fb8ff':'#ff4dff';G.beams.push({x1:mx,y1:my,x2:ex,y2:ey,life:.11,ml:.11,col,w:w.k==='lance'?4:2.6});if(Math.random()<.5)spark(ex,ey,2,'#ffc0ff',120);if(Math.random()<.2)smoke(ex,ey,5,.6,.35)}
 else if(W.kind==='rail'){const L=w.rng,dx=Math.cos(a0)*L,dy=Math.sin(a0)*L,[tw,wall]=rayWall(mx,my,dx,dy),end=Math.min(tw,1);
  for(const o of G.bots)if(!o.dead&&o.team!==b.team){const tt=segCircle(mx,my,dx,dy,o.x,o.y,o.r);if(tt<=end){damage(o,w.dmg,b,'rail',w);knock(o,Math.cos(a0),Math.sin(a0),160);spark(o.x,o.y,10,'#cfeaff',260);mark(o,o.x-Math.cos(a0)*o.r,o.y-Math.sin(a0)*o.r,5)}}
  if(wall&&tw<=1)hitCrate(wall,w.dmg);const ex=mx+dx*end,ey=my+dy*end;G.beams.push({x1:mx,y1:my,x2:ex,y2:ey,life:.45,ml:.45,col:'#8fd0ff',w:4.5,rail:true});
  for(let i=0;i<12;i++){const f=Math.random();smoke(lerp(mx,ex,f),lerp(my,ey,f),5,1.2,.35)}flashL(mx,my,90,'#8fd0ff',.12);knock(b,-Math.cos(a0),-Math.sin(a0),110);G.shake=Math.max(G.shake,5)}
 else if(W.kind==='tesla'){let cur=t,hit=[t],dmg=w.dmg,pts=[[mx,my]];damage(t,dmg,b,'energy',w);if(Math.random()<W.stun)stunT(t,.6);pts.push([t.x,t.y]);
  for(let j=1;j<W.chain;j++){const nx=G.bots.filter(o=>!o.dead&&o.team!==b.team&&!hit.includes(o)&&dist(o,cur)<130&&los(o,cur));if(!nx.length)break;cur=nx.reduce((a,o)=>dist(o,cur)<dist(a,cur)?o:a);hit.push(cur);dmg*=.7;damage(cur,dmg,b,'energy',w);pts.push([cur.x,cur.y])}
  G.bolts.push({pts,life:.18,ml:.18});pts.slice(1).forEach(([x,y])=>{spark(x,y,6,'#bfe0ff',180);flashL(x,y,60,'#8fc8ff',.1)})}
}
const k3=W=>W.sz===3;
function meleeHit(b,w,t){const W=w.W;b.lastShot=G.t;sfx(w.k==='saw'||w.k==='drill'?'saw':'clank',t.x,t.y,W.sz===3?1.4:1);const d=damage(t,w.dmg,b,'kinetic',w);const a=Math.atan2(t.y-b.y,t.x-b.x);knock(t,Math.cos(a),Math.sin(a),W.knock||70);if(W.stunT)stunT(t,W.stunT);
 if(t.o.util.spikes&&!b.dead)damage(b,w.dmg*t.o.util.spikes.val,t,'kinetic');
 const hx=(b.x+t.x)/2,hy=(b.y+t.y)/2;spark(hx,hy,W.sz*5,'#ffe9a8',260);mark(t,hx,hy,3);if(W.sz===3){G.shake=Math.max(G.shake,7);flashL(hx,hy,60,'#ffd890',.08)}w.recoil=-4}
// ---------- step ----------
function step(dt){
 G.t+=dt;G.stormR=G.t<G.stormStart?Infinity:lerp(Math.hypot(G.W,G.H)/2+20,150,clamp((G.t-G.stormStart)/45,0,1));
 G.pickT-=dt;if(G.pickT<=0&&!G.over){const sup=G.mods.has('supply');G.pickT=sup?5:11;if(G.pickups.length<(sup?4:2))for(let k=0;k<40;k++){const x=rnd(G.W*.25,G.W*.75),y=rnd(G.H*.2,G.H*.8);if(!wallAt(x,y,22)&&!onHazard(x,y,25)&&Math.hypot(x-G.W/2,y-G.H/2)<G.stormR-40){G.pickups.push({x,y,t:0});break}}}
 if(G.mods.has('barrage')&&!G.over){G.barT-=dt;if(G.barT<=0){G.barT=rnd(5,7);sfx('siren');for(let k=0;k<3;k++){const al=G.bots.filter(alive),tgt=pick(al);const x=clamp((tgt?tgt.x:G.W/2)+rnd(-120,120),40,G.W-40),y=clamp((tgt?tgt.y:G.H/2)+rnd(-120,120),40,G.H-40);G.marks.push({x,y,t:1.8+k*.35,m:1.8+k*.35})}}}
 for(let i=G.marks.length-1;i>=0;i--){const m=G.marks[i];m.t-=dt;if(m.t<=0){explode(m.x,m.y,72,46,null,-1);G.marks.splice(i,1)}}
 for(const b of G.bots)if(!b.dead)updateBot(b,dt);
 const al=G.bots.filter(alive);
 for(let i=0;i<al.length;i++)for(let j=i+1;j<al.length;j++){const a=al[i],c=al[j],dx=c.x-a.x,dy=c.y-a.y,d=Math.hypot(dx,dy)||.01,m=a.r+c.r;if(d<m){const p=(m-d)/2,nx=dx/d,ny=dy/d,wa=c.r/m*2,wc=a.r/m*2;a.x-=nx*p*wa;a.y-=ny*p*wa;c.x+=nx*p*wc;c.y+=ny*p*wc}}
 for(const b of al){for(const w of G.walls)pushOut(b,w);b.x=clamp(b.x,b.r,G.W-b.r);b.y=clamp(b.y,b.r,G.H-b.r)}
 // projectiles
 for(let i=G.proj.length-1;i>=0;i--){const p=G.proj[i];let dead=false;
  if(p.arc){p.t+=dt;const f=Math.min(1,p.t/p.T);p.x=lerp(p.sx,p.gx,f);p.y=lerp(p.sy,p.gy,f);p.z=p.h*4*f*(1-f);if(Math.random()<.5)smoke(p.x,p.y-p.z*.6,2.5,.5,.4);
   if(f>=1){explode(p.gx,p.gy,p.w.W.splash,p.dmg,p.src,p.team);G.proj.splice(i,1)}continue}
  p.age+=dt;p.life-=dt;p.px=p.x;p.py=p.y;
  if(p.homing&&p.target&&!p.target.dead&&p.age>.12){const a=Math.atan2(p.vy,p.vx),ta=Math.atan2(p.target.y-p.y,p.target.x-p.x),na=a+clamp(angDiff(a,ta),-p.homing*dt,p.homing*dt),s=Math.hypot(p.vx,p.vy);p.vx=Math.cos(na)*s;p.vy=Math.sin(na)*s;
   const T=p.target;if(T.o.util.flares&&!p.flared&&dist(p,T)<85){p.flared=1;if(Math.random()<T.o.util.flares.val){p.target=null;p.vx=Math.cos(a+rnd(-1.2,1.2))*s;p.vy=Math.sin(a+rnd(-1.2,1.2))*s;for(let k=0;k<4;k++)P({x:T.x,y:T.y,vx:rnd(-160,160),vy:rnd(-160,160),life:.8,max:.8,size:2.5,col:'#ffe0a0',type:'flare'})}}
   if(T&&T.o.dodge&&!p.dodged&&dist(p,T)<70){p.dodged=1;const pa=Math.atan2(p.vy,p.vx)+Math.PI/2*(Math.random()<.5?1:-1);T.vx+=Math.cos(pa)*T.speed*1.4;T.vy+=Math.sin(pa)*T.speed*1.4}}
  if(p.w.W.kind==='missile'){if(Math.random()<.8)smoke(p.x,p.y,p.k==='microm'||p.k==='swarm'?2:3.2,.7,.55)}
  if(p.ty==='thermal'){p.vx*=1-1.8*dt;p.vy*=1-1.8*dt;p.r+=dt*24}
  p.x+=p.vx*dt;p.y+=p.vy*dt;
  const wl=wallAt(p.x,p.y,1);
  if(wl||p.x<0||p.y<0||p.x>G.W||p.y>G.H){dead=true;if(wl){hitCrate(wl,p.ty==='thermal'?p.dmg*.4:p.dmg);if(!p.w.W.splash&&p.ty!=='thermal'){spark(p.x,p.y,3,p.ty==='energy'?'#9ff':'#ffd890',150);if(Math.random()<.3)scorch(p.x,p.y,2.5,.5)}}if(p.w.W.splash)explode(p.x,p.y,p.w.W.splash,p.dmg,p.src,p.team,p.ty)}
  else for(const o of G.bots){if(o.dead||o.team===p.team)continue;if(Math.hypot(o.x-p.x,o.y-p.y)<o.r+p.r){dead=true;
   if(p.w.W.splash)explode(p.x,p.y,p.w.W.splash,p.dmg,p.src,p.team,p.ty);
   else{damage(o,p.dmg,p.src,p.ty,p.w);if(p.ty==='thermal'&&!o.o.util.cooling&&Math.random()<.5){o.burn=2;o.burnSrc=p.src}
    if(p.w.W.knock){const s=Math.hypot(p.vx,p.vy)||1;knock(o,p.vx/s,p.vy/s,p.w.W.knock*.35)}
    if(p.ty!=='thermal'){spark(p.x,p.y,3,p.ty==='energy'?'#9ff':'#ffd890',170);if(Math.random()<.25)mark(o,p.x,p.y,2)}}break}}
  if(!dead&&p.life<=0){dead=true;if(p.w.W.splash)explode(p.x,p.y,p.w.W.splash,p.dmg,p.src,p.team,p.ty)}
  if(dead)G.proj.splice(i,1)}
 // mines
 for(let i=G.mines.length-1;i>=0;i--){const m=G.mines[i];m.arm-=dt;m.t+=dt;if(m.arm>0)continue;if(G.bots.some(o=>!o.dead&&o.team!==m.team&&Math.hypot(o.x-m.x,o.y-m.y)<o.r+16&&!(o.o.hover&&m.neutral))){explode(m.x,m.y,62,34,m.src,m.team);if(m.src)m.src.myMines--;G.mines.splice(i,1)}}
 // pickups
 for(let i=G.pickups.length-1;i>=0;i--){const pk=G.pickups[i];pk.t+=dt;const b=G.bots.find(o=>!o.dead&&Math.hypot(o.x-pk.x,o.y-pk.y)<o.r+12);
  if(b){const h=Math.min(45*(b.pk.has('scavenger')?2:1),b.maxHp-b.hp);sfx('pickup',pk.x,pk.y);b.hp+=h;b.st.heal+=h;G.texts.push({x:b.x,y:b.y-b.r-10,txt:'+'+Math.round(h),col:'#7dff9a',life:1,vy:-30});spark(pk.x,pk.y,10,'#7dff9a',120);G.pickups.splice(i,1)}}
 // particles
 for(let i=G.parts.length-1;i>=0;i--){const p=G.parts[i];p.life-=dt;
  if(p.type==='debris'||p.type==='shell'){p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;const f=Math.pow(.02,dt);p.vx*=f;p.vy*=f;p.vr*=f;if(wallAt(p.x,p.y)){p.vx*=-.4;p.vy*=-.4}
   if(Math.hypot(p.vx,p.vy)<6||p.life<=0){bake(p);G.parts.splice(i,1)}if(p.big&&Math.random()<.2)smoke(p.x,p.y,3,.6,.5);continue}
  if(p.life<=0){G.parts.splice(i,1);continue}p.x+=p.vx*dt;p.y+=p.vy*dt;const f=p.type==='smoke'?Math.pow(.6,dt):Math.pow(.05,dt);p.vx*=f;p.vy*=f;if(p.type==='smoke')p.size+=dt*10;if(p.type==='fire')p.size*=1+dt*.6}
 for(let i=G.texts.length-1;i>=0;i--){const t=G.texts[i];t.life-=dt;t.y+=t.vy*dt;if(t.life<=0)G.texts.splice(i,1)}
 for(const arr of [G.beams,G.bolts,G.flashes])for(let i=arr.length-1;i>=0;i--){arr[i].life-=dt;if(arr[i].ring)arr[i].r=lerp(arr[i].max,arr[i].r,arr[i].life/arr[i].ml);if(arr[i].life<=0)arr.splice(i,1)}
 for(const w of G.walls)if(w.hit>0)w.hit-=dt;
 G.shake*=Math.pow(.86,dt*60);
 if(!G.over){const a0=G.bots.some(b=>!b.dead&&b.team===0),a1=G.bots.some(b=>!b.dead&&b.team===1);
  if(!a0||!a1||G.t>=150||(G.cfg.limit&&G.t>=G.cfg.limit)){G.over=true;G.winner=!a1&&a0?0:!a0&&a1?1:(teamPct(0)>=teamPct(1)?0:1);if(a0&&a1)addFeed(G.cfg.limit?'Test complete':'Time! Decided on remaining HP');showBanner(G.winner===0?'VICTORY':'DEFEAT',G.winner===0?'#3ee6c1':'#ff3b5c')}}
 else G.overT+=dt;
}
function teamPct(t){let h=0,m=0;for(const b of G.bots)if(b.team===t){h+=Math.max(0,b.hp);m+=b.maxHp}return m?h/m:0}

function updateBot(b,dt){
 const o=b.o,U=o.util;b.flash-=dt;b.shieldHit-=dt;b.txtT-=dt;
 if(b.dmgAcc>=1&&b.txtT<=0){G.texts.push({x:b.x+rnd(-6,6),y:b.y-b.r-8,txt:Math.round(b.dmgAcc),col:b.team?'#ffe08a':'#ff9a9a',life:.8,vy:-36});b.dmgAcc=0;b.txtT=.22}
 // damage state fx
 const hpP=b.hp/b.maxHp;b.smokeT-=dt;if(b.smokeT<=0){b.smokeT=hpP<.2?.05:hpP<.4?.12:hpP<.6?.3:9;if(hpP<.6)smoke(b.x+rnd(-b.r/2,b.r/2),b.y+rnd(-b.r/2,b.r/2),rnd(4,8),1.2,hpP<.3?.8:.45);if(hpP<.25){fire(b.x+rnd(-b.r/2,b.r/2),b.y+rnd(-b.r/2,b.r/2),rnd(4,8),0,-10,.3);if(Math.random()<.3)spark(b.x,b.y,2,'#ffd890',120)}}
 if(b.burn>0){b.burn-=dt;damage(b,5*dt,b.burnSrc,'burn');if(Math.random()<.4)fire(b.x+rnd(-b.r,b.r)*.6,b.y+rnd(-b.r,b.r)*.6,rnd(4,7),0,-15,.35);if(b.dead)return}
 for(const l of G.slag)if(Math.hypot(b.x-l.x,b.y-l.y)<l.r){damage(b,22*dt,null,'slag');if(Math.random()<.25)fire(b.x,b.y,5,0,-20,.4);if(b.dead)return}
 for(const l of G.saws){const dx=b.x-l.x,dy=b.y-l.y,dd=Math.hypot(dx,dy)||1;if(dd<l.r+b.r*.5){damage(b,30*dt,null,'saw');knock(b,dx/dd,dy/dd,260*dt);if(Math.random()<.5)spark(b.x-dx/dd*b.r*.5,b.y-dy/dd*b.r*.5,2,'#ffe9a8',240);if(Math.random()<.08)sfx('saw',b.x,b.y,.5);if(b.dead)return}}
 b.onIce=!o.hover&&G.ice.some(l=>Math.hypot(b.x-l.x,b.y-l.y)<l.r);if(b.slow>0)b.slow-=dt;
 if(Math.hypot(b.x-G.W/2,b.y-G.H/2)>G.stormR){damage(b,(6+10*clamp((G.t-G.stormStart)/45,0,1))*dt,null,'storm');if(Math.random()<.2)spark(b.x,b.y,2,'#d9a0ff',140);if(b.dead)return}
 if(b.pk.has('regen')&&b.hp<b.maxHp){const h=Math.min(1.5*dt,b.maxHp-b.hp);b.hp+=h;b.st.heal+=h}
 if(b.dummy){b.vx=b.vy=0;b.target=null;return}
 const rp=(U.repair?U.repair.val:0)+(U.nanoforge?U.nanoforge.val:0);if(rp&&b.hp<b.maxHp){const h=Math.min(rp*dt,b.maxHp-b.hp);b.hp+=h;b.st.heal+=h}
 if(b.shieldMax&&G.t-b.lastHit>3.5)b.shield=Math.min(b.shieldMax,b.shield+14*dt);
 if(b.cloak>0)b.cloak-=dt;
 // drones
 if(b.drone){const d=b.drone;d.a+=dt*2.3;d.x=b.x+Math.cos(d.a)*(b.r+24);d.y=b.y+Math.sin(d.a)*(b.r+24);d.cd-=dt;const t=b.target;
  if(t&&!t.dead&&d.cd<=0&&Math.hypot(t.x-d.x,t.y-d.y)<240&&los(d,t)){d.cd=.55;const a=Math.atan2(t.y-d.y,t.x-d.x);G.proj.push({x:d.x,y:d.y,vx:Math.cos(a)*560,vy:Math.sin(a)*560,team:b.team,src:b,w:{W:{},pierce:0},life:.5,k:'drone',ty:'kinetic',r:2,age:0,dmg:d.val});flashL(d.x,d.y,20,'#ffc070')}}
 if(b.medic){const m=b.medic;const al=[b,...alliesOf(b)].filter(a=>a.hp<a.maxHp*.98);m.tgt=al.length?al.reduce((a,x)=>x.hp/x.maxHp<a.hp/a.maxHp?x:a):b;
  if(m.tgt&&dist(m.tgt,b)>260)m.tgt=b;const T=m.tgt;m.a+=dt*2;const tx=T.x+Math.cos(m.a)*(T.r+18),ty=T.y+Math.sin(m.a)*(T.r+18);m.x=lerp(m.x,tx,Math.min(1,dt*5));m.y=lerp(m.y,ty,Math.min(1,dt*5));
  if(T.hp<T.maxHp){const h=Math.min(m.val*dt,T.maxHp-T.hp);T.hp+=h;b.st.heal+=h;m.healing=T}else m.healing=null}
 b.ph+=Math.hypot(b.vx,b.vy)*dt/b.r;
 for(const w of b.weps){w.recoil=Math.max(0,w.recoil-dt*30);if(w.spin&&!w.firing)w.spin=Math.max(0,w.spin-dt*.8);w.firing=false}
 if(b.stun>0){b.stun-=dt;b.vx*=.9;b.vy*=.9;b.x+=b.vx*dt;b.y+=b.vy*dt;if(Math.random()<.3)spark(b.x+rnd(-b.r,b.r),b.y+rnd(-b.r,b.r),1,'#9fd0ff',90);return}
 // target
 b.retarget-=dt;if(b.retarget<=0||!b.target||b.target.dead||!visible(b,b.target)){b.target=chooseTarget(b);b.retarget=o.react}
 const t=b.target,beh=b.ai.beh,eng=b.ai.eng;
 let mx=0,my=0,goal=null,haveLos=false,d=0;
 if(t){d=dist(b,t);haveLos=los(b,t)}
 const pref=(o.melee&&(beh==='aggro'||beh==='berserk'||!o.range))?0:o.range*eng*({aggro:.55,berserk:.3,kite:.9,sniper:.95,flank:.68,skirm:b.skPhase?1.25:.55,guard:.75,sentinel:.85}[beh]||.7);
 const retreating=beh!=='berserk'&&b.hp/b.maxHp<b.ai.ret;
 const pk=(retreating||b.hp<b.maxHp*.4)&&beh!=='berserk'?G.pickups.filter(p=>Math.hypot(p.x-b.x,p.y-b.y)<400).sort((p,q)=>Math.hypot(p.x-b.x,p.y-b.y)-Math.hypot(q.x-b.x,q.y-b.y))[0]:null;
 const anchor=beh==='guard'?guardAnchor(b):null;
 if(beh==='skirm'){b.skT-=dt;if(b.skT<=0){b.skPhase^=1;b.skT=b.skPhase?2:4}}
 if(pk){goal=pk;b.mode='Grabbing repair kit'}
 else if(anchor&&dist(b,anchor)>150){goal=anchor;b.mode='Regrouping with '+anchor.name}
 else if(beh==='sentinel'&&(!t||!haveLos||d>o.range*1.05)&&b.idle<2.5){b.idle+=dt;if(dist(b,b.home)>30)goal=b.home;b.mode='Holding position'}
 if(t&&haveLos&&d<o.range)b.idle=0;
 // stuck watchdog: if we have barely moved for a second while trying to, path-find for a while
 b.wdT=(b.wdT||0)+dt;if(b.wdT>1){if(b._want&&Math.hypot(b.x-(b.wdX??b.x),b.y-(b.wdY??b.y))<b.speed*.18){b.unstick=1.6;b.orbit*=-1}b.wdT=0;b.wdX=b.x;b.wdY=b.y}
 if(b.unstick>0)b.unstick-=dt;
 // nothing fired for a while although we have a target: push in closer
 const restless=t&&G.t-(b.lastShot??-9)>4&&G.t>3&&beh!=='sentinel';
 const pathTo=(x,y,key)=>pathDir(b,x,y,key);
 if(goal){const gk='g'+(goal.id||Math.round(goal.x)+'_'+Math.round(goal.y));if(b.unstick<=0&&clearLine(b,goal.x,goal.y,b.r)){const a=Math.atan2(goal.y-b.y,goal.x-b.x);mx=Math.cos(a);my=Math.sin(a)}else[mx,my]=pathTo(goal.x,goal.y,gk)}
 else if(t){
  const canDirect=haveLos&&b.unstick<=0&&!(restless&&!clearLine(b,t.x,t.y,b.r));
  if(canDirect){const ux=(t.x-b.x)/(d||1),uy=(t.y-b.y)/(d||1);let f=0;const p2=restless?Math.min(pref,d*.6):pref;
   if(retreating){f=-1;b.mode='Retreating!'}else{if(d>p2+15)f=1;else if(d<p2-15)f=beh==='kite'||beh==='sniper'?-1:beh==='aggro'||beh==='berserk'?-.1:-.6;b.mode=restless?'Pressing in on '+t.name:f>0?'Closing on '+t.name:f<0?'Backing off from '+t.name:'Engaging '+t.name}
   const tang=beh==='flank'?.95:beh==='sniper'||beh==='berserk'?0:beh==='kite'||beh==='skirm'?.45:o.range&&pref>0?.28:0;
   if(f>0&&!clearLine(b,t.x,t.y,b.r)){[mx,my]=pathTo(t.x,t.y,'t'+t.id);mx*=f;my*=f}else{mx=ux*f;my=uy*f}
   // strafe only if there is room on that side, otherwise flip
   if(tang){let sx=-uy*b.orbit,sy=ux*b.orbit;if(freeFrac(b,sx,sy,b.r+40,true)<.6){b.orbit*=-1;sx=-sx;sy=-sy}mx+=sx*tang;my+=sy*tang}
   // backing into a wall? slide sideways instead
   if(f<0&&freeFrac(b,-ux,-uy,b.r+40,true)<.5){mx=-uy*b.orbit*.9+ux*.1;my=ux*b.orbit*.9+uy*.1}}
  else{[mx,my]=pathTo(t.x,t.y,'t'+t.id);b.mode=b.unstick>0?'Finding a way around':'Hunting '+t.name}
 }else b.mode='Searching';
 for(const a of alliesOf(b)){const dx=b.x-a.x,dy=b.y-a.y,dd=Math.hypot(dx,dy);const R=b.r+a.r+26;if(dd<R&&dd>0){const k=(R-dd)/R;mx+=dx/dd*k*1.2;my+=dy/dd*k*1.2}}
 for(const l of G.saws){const dx=b.x-l.x,dy=b.y-l.y,dd=Math.hypot(dx,dy);if(dd<l.r+b.r+14){mx+=dx/(dd||1)*2;my+=dy/(dd||1)*2}}
 if((o.haz||0)<1)for(const l of G.slag){const dx=b.x-l.x,dy=b.y-l.y,dd=Math.hypot(dx,dy);if(dd<l.r+b.r*.5){mx+=dx/(dd||1)*1.5;my+=dy/(dd||1)*1.5}}
 if(G.stormR<1e5){const dx=G.W/2-b.x,dy=G.H/2-b.y,dd=Math.hypot(dx,dy);if(dd>G.stormR-60){const k=clamp((dd-(G.stormR-60))/60,0,2);mx+=dx/dd*k*1.4;my+=dy/dd*k*1.4}}
 [mx,my]=steer(b,mx,my);const ml=Math.hypot(mx,my);b._want=ml>.3;
 // active modules
 for(const k in b.mod){b.mod[k]-=dt;if(b.mod[k]>0)continue;
  if(k==='booster'){let dir=null;if(t&&(beh==='aggro'||beh==='berserk'||beh==='flank'||o.melee)&&d>pref+80&&haveLos)dir=Math.atan2(t.y-b.y,t.x-b.x);else if(t&&enemiesOf(b).some(e=>dist(e,b)<110)&&(beh!=='berserk'))dir=Math.atan2(b.y-t.y,b.x-t.x)+rnd(-.6,.6);else if(retreating&&t)dir=Math.atan2(b.y-t.y,b.x-t.x);
   if(dir!=null){sfx('dash',b.x,b.y,.6);b.dash=.22;b.vx=Math.cos(dir)*b.speed*3.2;b.vy=Math.sin(dir)*b.speed*3.2;b.mod[k]=U.booster.cd;for(let i=0;i<8;i++)fire(b.x-Math.cos(dir)*b.r,b.y-Math.sin(dir)*b.r,rnd(3,6),-Math.cos(dir)*120,-Math.sin(dir)*120,.25);flashL(b.x,b.y,50,'#9fe8ff',.15)}else b.mod[k]=.4}
  else if(k==='mines'){if(b.myMines<3){G.mines.push({x:b.x,y:b.y,team:b.team,src:b,arm:.9,t:0});b.myMines++}b.mod[k]=U.mines.cd}
  else if(k==='emp'){const near=enemiesOf(b).filter(e=>dist(e,b)<140);if(near.length){near.forEach(e=>{stunT(e,1.4);e.shield*=.5;e.weps.forEach(w=>w.charge=0)});G.bolts.push({ring:true,x:b.x,y:b.y,r:5,max:140,life:.45,ml:.45,col:'#8cf'});sfx('emp',b.x,b.y);flashL(b.x,b.y,160,'#7fb8ff',.25);b.mod[k]=U.emp.cd}else b.mod[k]=.5}
  else if(k==='repulsor'){const near=enemiesOf(b).filter(e=>dist(e,b)<120);if(near.length){near.forEach(e=>{const a=Math.atan2(e.y-b.y,e.x-b.x);knock(e,Math.cos(a),Math.sin(a),420);damage(e,6,b,'energy')});G.bolts.push({ring:true,x:b.x,y:b.y,r:b.r,max:125,life:.35,ml:.35,col:'#ffd27a'});flashL(b.x,b.y,120,'#ffcf7a',.18);sfx('emp',b.x,b.y,.6);b.mod[k]=U.repulsor.cd}else b.mod[k]=.4}
  else if(k==='stealth'){b.cloak=3;b.mod[k]=U.stealth.cd;flashL(b.x,b.y,40,'#9fd0ff',.2)}
 }
 // move
 const berserkBoost=beh==='berserk'&&b.hp<b.maxHp*.5?1.12:1;
 const slowK=b.slow>0?.6:1;
 if(b.dash>0)b.dash-=dt;else{const k=Math.min(1,dt*o.acc*.9*(b.onIce?.22:1));b.vx+=(mx*b.speed*berserkBoost*slowK-b.vx)*k;b.vy+=(my*b.speed*berserkBoost*slowK-b.vy)*k}
 if(b.o.hover){b.vx*=1-dt*.3;b.vy*=1-dt*.3}
 if(b.onIce&&Math.hypot(b.vx,b.vy)>40&&Math.random()<.15)P({x:b.x+rnd(-b.r,b.r)*.5,y:b.y+rnd(-b.r,b.r)*.5,vx:rnd(-20,20),vy:rnd(-20,20),life:.5,max:.5,size:1.4,col:'#dff4ff',type:'spark'});
 const px=b.x,py=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;const sp=Math.hypot(b.vx,b.vy);
 let face=null;if(o.omni){if(t)face=Math.atan2(t.y-b.y,t.x-b.x)}else if(sp>14)face=Math.atan2(b.vy,b.vx);
 if(face!=null){b.angle+=clamp(angDiff(b.angle,face),-o.turn*dt,o.turn*dt)}
 if(o.hover&&Math.random()<.25)smoke(b.x+rnd(-b.r,b.r),b.y+rnd(-b.r,b.r),3,.4,.3);

 // weapons
 const rate=o.rate*(o.burst&&G.t<8?1.5:1)*(b.pk.has('firststrike')&&G.t<6?1.4:1)*(G.mods.has('overdrive')?1.35:1);
 for(const w of b.weps){const W=w.W;const [wx,wy]=mountPos(b,w);
  if(W.kind==='missile'&&w.burst>0){w.burstT-=dt;if(w.burstT<=0){w.burst--;w.burstT=.1;sfx('rocket',b.x,b.y,.7);const [mx2,my2]=muzzleOf(b,w),a=w.aim+rnd(-.35,.35)*(W.salvo>1?1:.2);
   G.proj.push({x:mx2,y:my2,vx:Math.cos(a)*W.spd,vy:Math.sin(a)*W.spd,team:b.team,src:b,w,life:w.rng/W.spd*1.3,k:w.k,ty:'explosive',r:3,age:0,dmg:w.dmg,homing:W.homing,target:t&&!t.dead?t:null});flashL(mx2,my2,40,'#ffb35c');smoke(mx2,my2,6,.8,.5);w.recoil=2}}
  if(!t){w.aim+=angDiff(w.aim,b.angle)*Math.min(1,dt*3);continue}
  const dd=Math.hypot(t.x-wx,t.y-wy);let ax=t.x,ay=t.y;if(W.spd){const tt=dd/W.spd*o.lead;ax+=t.vx*tt;ay+=t.vy*tt}
  const want=Math.atan2(ay-wy,ax-wx),tr=[0,7,5,3.2][W.sz]*o.aim*dt;w.aim+=clamp(angDiff(w.aim,want),-tr,tr);
  const aligned=Math.abs(angDiff(w.aim,want))<(W.kind==='rail'?.05:W.kind==='arc'?.4:.22);
  w.cd-=dt*rate;
  if(W.kind==='melee'){if(dd<=t.r+W.len+W.reach&&w.cd<=0&&aligned){w.cd=w.cdB;meleeHit(b,w,t)}w.spin=(w.spin||0)+dt*(dd<120?30:12);continue}
  const inR=dd<=w.rng+t.r&&dd>=(W.minr||0);const canSee=W.kind==='arc'?true:haveLos||los({x:wx,y:wy},t);
  if(inR&&canSee&&aligned){w.firing=true;
   if(W.kind==='rail'){if(w.cd<=0){if(w.charge===0)sfx('charge',b.x,b.y,.6);w.charge+=dt;if(w.charge>=W.charge){fireWeapon(b,w,t);w.charge=0;w.cd=w.cdB}}}
   else if(w.cd<=0){fireWeapon(b,w,t);let c=w.cdB;if(W.spin){w.spin=Math.min(1,w.spin+.08);c*=1+1.6*(1-w.spin)}w.cd=c}
  }else{w.charge=Math.max(0,w.charge-dt*2)}
 }
}

// ---------- announcer & kill cam ----------
function announce(txt,col='#ffb020',big){const box=$('#announce');if(!box)return;const d=document.createElement('div');d.className='ann'+(big?' big':'');d.style.color=col;d.textContent=txt;box.appendChild(d);while(box.children.length>3)box.firstChild.remove();setTimeout(()=>d.remove(),2600)}
function killEvents(t,src){
 if(G.cfg.test)return;
 if(G.kcCd<=0&&!G.dummyMode){G.kc={x:t.x,y:t.y,t:.9};G.kcCd=4}
 if(!G.firstBlood){G.firstBlood=true;announce('FIRST BLOOD'+(src?' · '+src.name:''),'#ff6a6a')}
 if(!src)return;
 if(src.lastKillT!=null&&G.t-src.lastKillT<7){src.multi=(src.multi||1)+1;announce((src.multi===2?'DOUBLE':src.multi===3?'TRIPLE':'RAMPAGE')+' KO · '+src.name,'#ffb020',1)}else src.multi=1;src.lastKillT=G.t;
 if(t.rep>src.rep*1.5+40)announce('GIANT SLAYER · '+src.name+' fells '+t.name,'#c9a7ff');
 if(src.team===0&&src.rec&&S.nemesis[src.rec.id]&&S.nemesis[src.rec.id].name===t.name&&S.nemesis[src.rec.id].team===G.cfg.eTeam){src.st.revenge=true;announce('REVENGE! '+src.name+' settles the score','#3ee6c1',1)}
 if(t.team===0&&S.nemesis[t.rec.id]&&S.nemesis[t.rec.id].name===src.name)announce(src.name+' strikes again','#ff6a6a');
 const left=G.bots.filter(b=>!b.dead&&b.team===src.team).length,eLeft=G.bots.filter(b=>!b.dead&&b.team!==src.team).length;
 if(left===1&&eLeft>=2&&!G.over)announce('LAST ONE STANDING · '+G.bots.find(b=>!b.dead&&b.team===src.team).name,'#ffd890');
}
