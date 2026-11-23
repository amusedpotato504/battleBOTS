'use strict';
function resize(){const dpr=Math.min(2.5,window.devicePixelRatio||1),W=cv.clientWidth,H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;
 if(!G)return;const top=46,bot=60,s=Math.min(W/G.W,(H-top-bot)/G.H);view={s,ox:(W-G.W*s)/2,oy:top+(H-top-bot-G.H*s)/2,dpr};G.cam=G.cam||{s,cx:G.W/2,cy:G.H/2};if(G.camAuto==null)G.camAuto=true}
function updateCam(dt){const W=cv.clientWidth,H=cv.clientHeight,top=46,bot=60,vh=H-top-bot,fit=Math.min(W/G.W,vh/G.H),c=G.cam;
 let ts=fit,tx=G.W/2,ty=G.H/2;
 if(G.camAuto){const al=G.bots.filter(b=>!b.dead);if(al.length){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const b of al){x0=Math.min(x0,b.x);y0=Math.min(y0,b.y);x1=Math.max(x1,b.x);y1=Math.max(y1,b.y)}
  const m=G.sel&&!G.sel.dead?200:240;ts=clamp(Math.min(W/(x1-x0+m*2),vh/(y1-y0+m*2)),fit,fit*2.6);tx=(x0+x1)/2;ty=(y0+y1)/2;if(G.sel&&!G.sel.dead){tx=lerp(tx,G.sel.x,.5);ty=lerp(ty,G.sel.y,.5)}}}
 if(G.kc){ts=Math.min(fit*2.6,Math.max(fit*1.8,ts));tx=G.kc.x;ty=G.kc.y}
 const k=Math.min(1,dt*(G.kc?4:2.2));c.s+=(ts-c.s)*k;c.cx+=(tx-c.cx)*k;c.cy+=(ty-c.cy)*k;
 const hw=W/2/c.s,hh=vh/2/c.s;const cx=G.W*c.s>W?clamp(c.cx,hw,G.W-hw):G.W/2,cy=G.H*c.s>vh?clamp(c.cy,hh,G.H-hh):G.H/2;
 view.s=c.s;view.ox=W/2-cx*c.s;view.oy=top+vh/2-cy*c.s}
addEventListener('resize',()=>{if(G)resize()});
function syncVis(b){const v=b.vis;v.x=b.x;v.y=b.y;v.angle=b.angle;v.ph=b.ph;v.flash=b.flash;v.marks=b.marks;b.weps.forEach(w=>{w.vis.aim=w.aim;w.vis.recoil=w.recoil;w.vis.spin=w.spin;w.vis.charge=w.charge/(w.W.charge||1)})}
function render(){
 const {s,ox,oy,dpr}=view,t=G.t,SS=clamp(s*dpr,1,2.4);
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#050607';ctx.fillRect(0,0,cv.width,cv.height);
 const sx=G.shake>.3?rnd(-G.shake,G.shake):0,sy=G.shake>.3?rnd(-G.shake,G.shake):0;
 ctx.setTransform(dpr*s,0,0,dpr*s,dpr*(ox+sx*s),dpr*(oy+sy*s));
 ctx.drawImage(G.floor,0,0,G.W,G.H);ctx.drawImage(G.decals,0,0,G.W,G.H);
 // slag animation
 for(const l of G.slag){ctx.save();ctx.beginPath();ctx.arc(l.x,l.y,l.r,0,TAU);ctx.clip();ctx.globalCompositeOperation='lighter';
  for(let i=0;i<5;i++){const a=t*.4+i*1.3,rr=l.r*.45*(.5+.5*Math.sin(t*.7+i*2));ctx.globalAlpha=.25+.15*Math.sin(t*2+i);ctx.drawImage(glowSprite('#ff8a2a'),l.x+Math.cos(a)*rr-l.r*.5,l.y+Math.sin(a)*rr-l.r*.5,l.r,l.r)}
  ctx.restore();if(Math.random()<.06)P({x:l.x+rnd(-l.r,l.r)*.6,y:l.y+rnd(-l.r,l.r)*.6,vx:0,vy:-8,life:1.6,max:1.6,size:6,col:.35,type:'smoke',rot:0})}
 // floor saws
 for(const l of G.saws){const R=l.r*.86,a=t*14+l.a;ctx.save();ctx.translate(l.x,l.y);ctx.rotate(a);ctx.beginPath();for(let i=0;i<28;i++){const an=i/28*TAU,rr=i%2?R*.84:R;ctx.lineTo(Math.cos(an)*rr,Math.sin(an)*rr)}ctx.closePath();
  const g=ctx.createRadialGradient(-R*.3,-R*.3,0,0,0,R);g.addColorStop(0,'#e6eaee');g.addColorStop(.6,'#8d949b');g.addColorStop(1,'#3c4147');ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#1a1c1f';ctx.lineWidth=.8;ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,R*.62,0,1.2);ctx.stroke();for(let i=0;i<5;i++){const an=i/5*TAU;ctx.fillStyle='#2a2d31';ctx.beginPath();ctx.arc(Math.cos(an)*R*.42,Math.sin(an)*R*.42,R*.08,0,TAU);ctx.fill()}disc(ctx,0,0,R*.2,'#c23b22');ctx.restore()}
 // pickups
 for(const p of G.pickups){const b=Math.sin(p.t*3)*.6;ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(p.x-8,p.y-5,18,14);box(ctx,p.x-10,p.y-9+b,20,16,'#d8dcd8',2);ctx.fillStyle='#1d9a4a';ctx.fillRect(p.x-2,p.y-6+b,4,10);ctx.fillRect(p.x-5,p.y-3+b,10,4);rivet(ctx,p.x-7,p.y-6+b,.8);rivet(ctx,p.x+7,p.y-6+b,.8)}
 // barrage markers
 for(const m of G.marks){const f=1-m.t/m.m,p=.5+.5*Math.sin(G.t*18);ctx.save();ctx.strokeStyle=`rgba(255,60,40,${.4+.5*p})`;ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.beginPath();ctx.arc(m.x,m.y,72,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(m.x,m.y,72*(1-f),0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(m.x-14,m.y);ctx.lineTo(m.x+14,m.y);ctx.moveTo(m.x,m.y-14);ctx.lineTo(m.x,m.y+14);ctx.stroke();ctx.fillStyle=`rgba(255,40,20,${.08+.08*p})`;ctx.beginPath();ctx.arc(m.x,m.y,72,0,TAU);ctx.fill();
  if(m.t<.35){const h=m.t/.35*260;ctx.strokeStyle='rgba(255,220,160,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(m.x+h*.3,m.y-h);ctx.lineTo(m.x+h*.3-6,m.y-h+22);ctx.stroke()}ctx.restore()}
 // mines
 for(const m of G.mines){disc(ctx,m.x,m.y,6.5,'#3a3f44');ctx.strokeStyle='#15181b';ctx.lineWidth=1;ctx.beginPath();ctx.arc(m.x,m.y,4,0,TAU);ctx.stroke();ctx.fillStyle=m.arm>0?'#555':(Math.sin(m.t*10)>0?(m.team?'#ff3b5c':'#3ee6c1'):'#300');ctx.beginPath();ctx.arc(m.x,m.y,1.6,0,TAU);ctx.fill()}
 // crates
 const cs=crateSprite();for(const w of G.walls)if(w.crate){ctx.drawImage(cs.cv,w.x-cs.pad,w.y-cs.pad,cs.s+cs.pad*2,cs.s+cs.pad*2);const dm=1-w.hp/w.max;if(dm>0){ctx.fillStyle=`rgba(15,10,5,${dm*.55})`;ctx.fillRect(w.x,w.y,40,40)}if(w.hit>0){ctx.fillStyle='rgba(255,220,160,.25)';ctx.fillRect(w.x,w.y,40,40)}}
 // wrecks
 for(const b of G.bots)if(b.dead){renderBot(ctx,b.vis,t,SS)}
 // bots
 for(const b of G.bots)if(!b.dead){syncVis(b);const a=b.cloak>0?(b.team===0?.35:.12):1;
  if(b.dead)continue;renderBot(ctx,b.vis,t,SS,{alpha:a});
  if(b.shield>0){ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(b.x,b.y,b.r*.6,b.x,b.y,b.r+10);g.addColorStop(0,'rgba(80,170,255,0)');g.addColorStop(.85,`rgba(110,190,255,${.08+(b.shieldHit>0?.25:0)})`);g.addColorStop(1,`rgba(160,220,255,${.25*b.shield/b.shieldMax+(b.shieldHit>0?.3:0)})`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r+10,0,TAU);ctx.fill();ctx.restore()}
  if(b.drone){const d=b.drone;ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.arc(d.x+5,d.y+9,5,0,TAU);ctx.fill();disc(ctx,d.x,d.y,5,'#4a5057');ctx.fillStyle='#222';for(let i=0;i<4;i++){const a=i/4*TAU+t*30;ctx.fillRect(d.x+Math.cos(a)*5-1,d.y+Math.sin(a)*5-1,2,2)}led(ctx,d.x,d.y,'#ff5040',.7)}
  if(b.medic){const m=b.medic;ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.arc(m.x+5,m.y+9,5,0,TAU);ctx.fill();disc(ctx,m.x,m.y,5,'#d8dcd8');ctx.fillStyle='#1d9a4a';ctx.fillRect(m.x-1,m.y-3,2,6);ctx.fillRect(m.x-3,m.y-1,6,2);
   if(m.healing){ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(120,255,160,.5)';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.lineDashOffset=-t*30;ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(m.healing.x,m.healing.y);ctx.stroke();ctx.restore()}}
  if(b.stun>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#9fd0ff';ctx.lineWidth=1.2;for(let i=0;i<3;i++){const a=t*9+i*2.1;ctx.beginPath();ctx.moveTo(b.x+Math.cos(a)*b.r,b.y+Math.sin(a)*b.r);ctx.lineTo(b.x+Math.cos(a+.5)*b.r*.4,b.y+Math.sin(a+.5)*b.r*.4);ctx.lineTo(b.x+Math.cos(a+1)*b.r*1.1,b.y+Math.sin(a+1)*b.r*1.1);ctx.stroke()}ctx.restore()}
  for(const w of b.weps)if(w.W.kind==='rail'&&w.charge>0){const [mx,my]=muzzleOf(b,w);ctx.save();ctx.strokeStyle=`rgba(150,210,255,${w.charge/w.W.charge*.5})`;ctx.lineWidth=.8;ctx.setLineDash([4,6]);const L=w.rng,[tw]=rayWall(mx,my,Math.cos(w.aim)*L,Math.sin(w.aim)*L),e=Math.min(1,tw);ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(mx+Math.cos(w.aim)*L*e,my+Math.sin(w.aim)*L*e);ctx.stroke();ctx.restore()}
 }
 // projectiles
 for(const p of G.proj){
  if(p.arc){ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(p.x,p.y,3+p.z*.02,2+p.z*.015,0,0,TAU);ctx.fill();const yy=p.y-p.z*.55,sz=2.6+p.z*.02+(p.k==='mortar'?1.4:0);disc(ctx,p.x,yy,sz,'#3a3f44');continue}
  if(p.ty==='thermal')continue;
  const sp=Math.hypot(p.vx,p.vy)||1,ux=p.vx/sp,uy=p.vy/sp;
  if(p.w.W.kind==='missile'){const L=p.k==='rockets'?7:5;ctx.strokeStyle='#d0d4d8';ctx.lineWidth=p.k==='rockets'?2.6:1.8;ctx.lineCap='butt';ctx.beginPath();ctx.moveTo(p.x-ux*L,p.y-uy*L);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.fillStyle='#b52a1a';ctx.beginPath();ctx.arc(p.x,p.y,ctx.lineWidth*.5,0,TAU);ctx.fill();
   ctx.save();ctx.globalCompositeOperation='lighter';ctx.drawImage(FIREB,p.x-ux*L-5,p.y-uy*L-5,10,10);ctx.restore();continue}
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
  if(p.k==='plasma'){ctx.strokeStyle='rgba(120,200,255,.55)';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(p.x-ux*14,p.y-uy*14);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.strokeStyle='#f0fbff';ctx.lineWidth=3.5;ctx.stroke()}
  else if(p.k==='cryo'){ctx.strokeStyle='rgba(190,235,255,.45)';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(p.x-ux*7,p.y-uy*7);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.strokeStyle='#ffffff';ctx.lineWidth=1.4;ctx.stroke()}
  else if(p.ty==='energy'){ctx.strokeStyle='rgba(90,240,255,.5)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(p.x-ux*9,p.y-uy*9);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.strokeStyle='#e8ffff';ctx.lineWidth=1.6;ctx.stroke()}
  else if(p.k==='cannon'||p.k==='autocannon'||p.k==='flak'){ctx.strokeStyle='rgba(255,170,80,.6)';ctx.lineWidth=p.k==='cannon'?4:2.6;ctx.beginPath();ctx.moveTo(p.x-ux*16,p.y-uy*16);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.strokeStyle='#fff3d0';ctx.lineWidth=1.2;ctx.stroke()}
  else{ctx.strokeStyle='rgba(255,200,110,.75)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(p.x-ux*13,p.y-uy*13);ctx.lineTo(p.x,p.y);ctx.stroke()}
  ctx.restore()}
 // particles
 for(const p of G.parts){if(p.type==='debris'||p.type==='shell'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);if(p.type==='shell'){ctx.fillStyle='#d8b54a';ctx.fillRect(-1.3,-.5,2.6,1)}else{ctx.fillStyle=p.col;ctx.beginPath();ctx.moveTo(-p.size/2,-p.size*.3);ctx.lineTo(p.size*.4,-p.size*.4);ctx.lineTo(p.size/2,p.size*.3);ctx.lineTo(-p.size*.2,p.size*.4);ctx.fill();ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(-p.size*.3,-p.size*.3,p.size*.5,p.size*.15)}ctx.restore()}}
 for(const p of G.parts)if(p.type==='smoke'){const f=p.life/p.max;ctx.globalAlpha=Math.min(1,f*1.5)*p.col*.9;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot+(1-f));ctx.drawImage(PUFF,-p.size,-p.size,p.size*2,p.size*2);ctx.restore()}ctx.globalAlpha=1;
 ctx.globalCompositeOperation='lighter';
 for(const p of G.proj)if(p.ty==='thermal'&&!p.arc){const f=clamp(p.life/(p.w.rng/p.w.W.spd),0,1);ctx.globalAlpha=.25+.5*f;const s2=p.r*2.2;ctx.drawImage(FIREB,p.x-s2,p.y-s2,s2*2,s2*2);if(Math.random()<.03)smoke(p.x,p.y,4,.8,.35)}
 ctx.globalAlpha=1;
 for(const p of G.parts){const f=clamp(p.life/p.max,0,1);
  if(p.type==='fire'){ctx.globalAlpha=f*.75;ctx.drawImage(FIREB,p.x-p.size,p.y-p.size,p.size*2,p.size*2)}
  else if(p.type==='spark'){ctx.globalAlpha=f;ctx.strokeStyle=p.col;ctx.lineWidth=p.size;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.03,p.y-p.vy*.03);ctx.stroke()}
  else if(p.type==='flare'){ctx.globalAlpha=f;ctx.drawImage(glowSprite('#ffd890'),p.x-8,p.y-8,16,16)}}
 ctx.globalAlpha=1;
 for(const bm of G.beams){const f=bm.life/bm.ml;ctx.lineCap='round';for(const [w,a,c] of [[bm.w*3.5,.18,bm.col],[bm.w*1.6,.5,bm.col],[bm.w*.55,1,'#ffffff']]){ctx.globalAlpha=a*f;ctx.strokeStyle=c;ctx.lineWidth=w*(bm.rail?(.4+f):1);ctx.beginPath();ctx.moveTo(bm.x1,bm.y1);ctx.lineTo(bm.x2,bm.y2);ctx.stroke()}}
 for(const bo of G.bolts){const f=bo.life/bo.ml;if(bo.ring){ctx.globalAlpha=f*.7;ctx.strokeStyle=bo.col||'#ffe0b0';ctx.lineWidth=3*f+1;ctx.beginPath();ctx.arc(bo.x,bo.y,bo.r,0,TAU);ctx.stroke();continue}
  for(const [lw,col] of [[4,'rgba(120,180,255,.35)'],[1.4,'#eef6ff']]){ctx.globalAlpha=f;ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();for(let i=0;i<bo.pts.length-1;i++){const [x1,y1]=bo.pts[i],[x2,y2]=bo.pts[i+1];ctx.moveTo(x1,y1);for(let k=1;k<6;k++){ctx.lineTo(lerp(x1,x2,k/6)+rnd(-7,7),lerp(y1,y2,k/6)+rnd(-7,7))}ctx.lineTo(x2,y2)}ctx.stroke()}}
 // night lightmap
 if(G.mods.has('night'))nightPass(t);
 // lights
 for(const f of G.flashes){const k=f.life/f.max;if(f.spr){ctx.globalAlpha=k;ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.a);ctx.drawImage(f.col?glowSprite(f.col):FLASH,-f.s*.4,-f.s/2,f.s*1.4,f.s);ctx.restore();continue}ctx.globalAlpha=k*.55;ctx.drawImage(glowSprite(f.col),f.x-f.r/2,f.y-f.r/2,f.r,f.r)}
 for(const l of G.slag){ctx.globalAlpha=.35+.08*Math.sin(t*2+l.x);ctx.drawImage(glowSprite('#ff7a20'),l.x-l.r*2.4,l.y-l.r*2.4,l.r*4.8,l.r*4.8)}
 for(const p of G.proj){if(p.arc)continue;if(p.ty==='energy'){const z=p.k==='plasma'?30:14;ctx.globalAlpha=.4;ctx.drawImage(glowSprite(p.k==='cryo'?'#cfefff':'#40d8ff'),p.x-z,p.y-z,z*2,z*2)}else if(p.w.W.homing){ctx.globalAlpha=.5;ctx.drawImage(glowSprite('#ff9a40'),p.x-16,p.y-16,32,32)}else if(p.ty==='thermal'&&Math.random()<.3){ctx.globalAlpha=.15;ctx.drawImage(glowSprite('#ff8020'),p.x-30,p.y-30,60,60)}}
 for(const bm of G.beams){ctx.globalAlpha=.35*bm.life/bm.ml;ctx.drawImage(glowSprite(bm.col),bm.x2-25,bm.y2-25,50,50);ctx.drawImage(glowSprite(bm.col),bm.x1-18,bm.y1-18,36,36)}
 for(const b of G.bots)if(!b.dead){if(b.burn>0||b.hp/b.maxHp<.25){ctx.globalAlpha=.3+.1*Math.sin(t*20);ctx.drawImage(glowSprite('#ff7020'),b.x-40,b.y-40,80,80)}for(const [lx,ly] of b.o.F.lights||[]){const c=Math.cos(b.angle),sn=Math.sin(b.angle),X=b.x+(lx*c-ly*sn)*b.r,Y=b.y+(lx*sn+ly*c)*b.r;ctx.globalAlpha=.25;ctx.drawImage(glowSprite('#fff0c8'),X+Math.cos(b.angle)*16-22,Y+Math.sin(b.angle)*16-22,44,44)}}
 for(const p of G.pickups){ctx.globalAlpha=.25+.1*Math.sin(p.t*4);ctx.drawImage(glowSprite('#60ff90'),p.x-24,p.y-24,48,48)}
 ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 // storm barrier
 if(G.stormR<1e5){ctx.save();ctx.beginPath();ctx.rect(-50,-50,G.W+100,G.H+100);ctx.arc(G.W/2,G.H/2,G.stormR,0,TAU,true);ctx.fillStyle='rgba(60,10,70,.38)';ctx.fill('evenodd');ctx.restore();
  ctx.save();ctx.globalCompositeOperation='lighter';for(const [lw,a] of [[10,.12],[4,.35],[1.5,.9]]){ctx.strokeStyle=`rgba(220,120,255,${a*(.7+.3*Math.sin(t*9))})`;ctx.lineWidth=lw;ctx.beginPath();for(let i=0;i<=90;i++){const an=i/90*TAU,rr=G.stormR+Math.sin(an*14+t*12)*2.5*(lw<2?1:0);ctx.lineTo(G.W/2+Math.cos(an)*rr,G.H/2+Math.sin(an)*rr)}ctx.stroke()}ctx.restore()}
 // hp bars & labels
 ctx.textAlign='center';
 for(const b of G.bots)if(!b.dead&&(b.cloak<=0||b.team===0)){const bw=Math.max(30,b.r*2.4),bx=b.x-bw/2,by=b.y-b.r-16;ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(bx-1,by-1,bw+2,6);const pct=Math.max(0,b.hp/b.maxHp);
  ctx.fillStyle=pct>.5?(b.team?'#ff4d64':'#3ee6c1'):pct>.25?'#ffb020':'#ff3b3b';ctx.fillRect(bx,by,bw*pct,4);if(b.abl>0){ctx.fillStyle='#c8b090';ctx.fillRect(bx,by-2.5,bw*Math.min(1,b.abl/b.o.abl),1.5)}if(b.shieldMax){ctx.fillStyle='#8cd2ff';ctx.fillRect(bx,by-2.5,bw*(b.shield/b.shieldMax),1.5)}
  if(G.sel===b||G.speed===1){ctx.font='600 8px "Chakra Petch",sans-serif';ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillText(b.name,b.x+.6,by-3.4);ctx.fillStyle=b.team?'#ffc0c8':'#c8fff0';ctx.fillText(b.name,b.x,by-4)}
  if(G.sel===b){ctx.strokeStyle='#ffb020';ctx.lineWidth=1.2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(b.x,b.y,b.r+13,0,TAU);ctx.stroke();ctx.setLineDash([]);if(b.target&&!b.target.dead){ctx.strokeStyle='rgba(255,176,32,.4)';ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.target.x,b.target.y);ctx.stroke()}}}
 ctx.font='700 12px "JetBrains Mono",monospace';
 for(const tx of G.texts){ctx.globalAlpha=clamp(tx.life*1.6,0,1);ctx.fillStyle='#000';ctx.fillText(tx.txt,tx.x+1,tx.y+1);ctx.fillStyle=tx.col;ctx.fillText(tx.txt,tx.x,tx.y)}ctx.globalAlpha=1;
}
// ---------- HUD & loop ----------
let hudTick=0;
function hud(){const p=teamPct(0),e=teamPct(1);$('#pHp').style.width=p*100+'%';$('#eHp').style.width=e*100+'%';
 const cnt=t=>G.bots.filter(b=>b.team===t&&!b.dead).length+'/'+G.bots.filter(b=>b.team===t).length;$('#pCnt').textContent=cnt(0);$('#eCnt').textContent=cnt(1);
 const tt=Math.floor(G.t);$('#clock').innerHTML=`${(tt/60)|0}:${String(tt%60).padStart(2,'0')}`+(G.t>=G.stormStart?'<small>BARRIER</small>':G.t>G.stormStart-15?`<small>BARRIER ${G.stormStart-tt}s</small>`:'');
 const b=G.sel,ins=$('#inspect');if(!b){ins.style.display='none';return}const rk=rankOf(b.rep);ins.style.display='block';
 ins.innerHTML=`<b style="color:${tc(b)}">${esc(b.name)}</b> <span style="color:${rk[2]}">${rk[1]}</span>${b.dead?' <span style="color:var(--red)">· destroyed</span>':''}
 <div class="ln">${FRAMES[b.o.fk].n} · ${DRIVES[b.o.dk]?.n||''}</div><div class="ln">${b.weps.map(w=>WEAPONS[w.k].n).join(', ')}</div><div class="ln">${BEHAVIORS[b.ai.beh].n} · ${TARGETS[b.ai.tgt].n}</div>
 <div class="mono" style="margin-top:3px">HP ${Math.max(0,Math.round(b.hp))}/${Math.round(b.maxHp)}${b.shieldMax?' · SH '+Math.round(b.shield):''} · ARM ${Math.round(b.o.arPct*100)}%</div><div class="mono">DMG ${Math.round(b.st.dmg)} · KO ${b.st.kills.length}</div>${b.dead?'':`<div style="color:var(--amber)">${esc(b.stun>0?'Stunned!':b.cloak>0?'Cloaked':b.slow>0?'Frozen':b.onIce?'Sliding on ice':b.mode||'')}</div>`}`}
function loop(now){if(!G||G.gen!==loopGen||!$('#battle').classList.contains('on'))return;
 const real=Math.min(.05,(now-G.last)/1000);G.last=now;
 if(G.kc){G.kc.t-=real;if(G.kc.t<=0)G.kc=null}if(G.kcCd>0)G.kcCd-=real*G.speed;
 if(!G.paused){G.acc+=real*G.speed*(G.over?.4:1)*(G.kc?.22:1);let n=0;while(G.acc>=1/60&&n<14){step(1/60);G.acc-=1/60;n++}if(n>=14)G.acc=0}
 updateCam(real);render();if(hudTick%3===0){$('#battle').classList.toggle('kc',!!G.kc);$('#killcam').classList.toggle('on',!!G.kc)}if(++hudTick%4===0)hud();
 if(G.over&&G.overT>2.2&&!G.shown){G.shown=true;G.cfg.onEnd(G)}
 requestAnimationFrame(loop)}
function showBanner(txt,col){const b=$('#banner');b.textContent=txt;b.style.color=col;b.style.opacity=1;clearTimeout(b._t);b._t=setTimeout(()=>b.style.opacity=0,1400)}
function setSpeed(s){G.speed=s;$$('[data-sp]').forEach(b=>b.classList.toggle('on',+b.dataset.sp===s))}
$$('[data-sp]').forEach(b=>b.onclick=()=>setSpeed(+b.dataset.sp));
$('#camBtn').onclick=()=>{if(!G)return;G.camAuto=!G.camAuto;$('#camBtn').classList.toggle('on',G.camAuto)};
$('#pauseBtn').onclick=()=>{G.paused=!G.paused;$('#pauseBtn').textContent=G.paused?'▶':'❚❚';G.last=performance.now()};
$('#quitBtn').onclick=()=>confirmBox('Forfeit match?','Leaving now counts as a loss and you still pay repairs.','Forfeit',()=>{if(!G)return;G.over=true;G.winner=1;G.forfeit=true;G.shown=true;G.cfg.onEnd(G)});
cv.addEventListener('pointerdown',e=>{if(!G)return;const r=cv.getBoundingClientRect(),x=(e.clientX-r.left-view.ox)/view.s,y=(e.clientY-r.top-view.oy)/view.s;let best=null,bd=45;for(const b of G.bots){const d=Math.hypot(b.x-x,b.y-y)-(b.dead?20:0);if(d<bd){bd=d;best=b}}G.sel=best;hud()});

// ---------- night lighting ----------
let LM=null;
function nightPass(t){
 if(!LM||LM.width!==cv.width||LM.height!==cv.height)LM=mkCanvas(cv.width,cv.height);
 const c=LM.getContext('2d'),tr=ctx.getTransform();
 c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-over';c.fillStyle='#161b28';c.fillRect(0,0,LM.width,LM.height);
 c.setTransform(tr);c.globalCompositeOperation='lighter';
 const L=(x,y,r,col,a=1)=>{c.globalAlpha=a;c.drawImage(glowSprite(col),x-r,y-r,r*2,r*2)};
 for(const b of G.bots){if(b.dead){if(G.t-b.deathT<8)L(b.x,b.y,60,'#ff7020',.6*(1-(G.t-b.deathT)/8));continue}
  const a=b.angle,fx=b.x+Math.cos(a)*b.r,fy=b.y+Math.sin(a)*b.r,R=240;
  c.save();c.globalAlpha=.95;c.beginPath();c.moveTo(fx,fy);c.arc(fx,fy,R,a-.42,a+.42);c.closePath();const g=c.createRadialGradient(fx,fy,0,fx,fy,R);g.addColorStop(0,'rgba(255,245,220,.95)');g.addColorStop(.5,'rgba(255,240,210,.35)');g.addColorStop(1,'rgba(255,240,210,0)');c.fillStyle=g;c.fill();c.restore();
  L(b.x,b.y,b.r*3,'#9aa8c0',.5);if(b.burn>0||b.hp/b.maxHp<.25)L(b.x,b.y,70,'#ff7020',.8)}
 for(const l of G.slag)L(l.x,l.y,l.r*3.2,'#ff7a20',.9+.1*Math.sin(t*2+l.x));for(const l of G.saws)L(l.x,l.y,l.r*1.6,'#ff4030',.45);
 for(const f of G.flashes)if(!f.spr)L(f.x,f.y,f.r*.9,f.col,f.life/f.max);
 for(const p of G.parts)if(p.type==='fire')L(p.x,p.y,p.size*3,'#ff9a40',p.life/p.max*.7);
 for(const bm of G.beams){const n=4;for(let i=0;i<=n;i++)L(lerp(bm.x1,bm.x2,i/n),lerp(bm.y1,bm.y2,i/n),40,bm.col,bm.life/bm.ml*.7)}
 for(const p of G.proj)if(!p.arc&&(p.ty==='energy'||p.w.W.homing||p.ty==='thermal'))L(p.x,p.y,p.ty==='thermal'?40:30,p.ty==='energy'?'#40d8ff':'#ff9a40',.6);
 for(const p of G.pickups)L(p.x,p.y,40,'#60ff90',.7);for(const m of G.mines)if(m.arm<=0)L(m.x,m.y,14,m.team===0?'#3ee6c1':'#ff3b5c',.6);
 for(const m of G.marks)L(m.x,m.y,90,'#ff3020',.5);
 if(G.stormR<1e5){c.globalAlpha=.5;c.strokeStyle='#c070ff';c.lineWidth=30;c.beginPath();c.arc(G.W/2,G.H/2,G.stormR,0,TAU);c.stroke()}
 c.globalAlpha=1;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='multiply';ctx.drawImage(LM,0,0);ctx.restore();
 ctx.globalCompositeOperation='lighter';
}
