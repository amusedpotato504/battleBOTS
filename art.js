'use strict';
// ================= shared textures =================
const HS=3; // hull/weapon sprite pixels per unit
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w));c.height=Math.max(1,Math.ceil(h));return c}
const GRAIN=(()=>{const c=mkCanvas(96,96),x=c.getContext('2d'),d=x.createImageData(96,96);for(let i=0;i<d.data.length;i+=4){const v=110+Math.random()*90|0;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}x.putImageData(d,0,0);return c})();
let grainPat=null;function grain(c){return c.createPattern(GRAIN,'repeat')}
const GLOW={};
function glowSprite(col){if(GLOW[col])return GLOW[col];const c=mkCanvas(128,128),x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);
 g.addColorStop(0,rgba(col,1));g.addColorStop(.25,rgba(col,.45));g.addColorStop(.6,rgba(col,.1));g.addColorStop(1,rgba(col,0));x.fillStyle=g;x.fillRect(0,0,128,128);return GLOW[col]=c}
const PUFF=(()=>{const c=mkCanvas(96,96),x=c.getContext('2d');for(let i=0;i<14;i++){const px=48+rnd(-18,18),py=48+rnd(-18,18),r=rnd(14,28),g=x.createRadialGradient(px,py,0,px,py,r);const v=rnd(60,110)|0;
 g.addColorStop(0,`rgba(${v},${v},${v+4},.35)`);g.addColorStop(1,`rgba(${v},${v},${v},0)`);x.fillStyle=g;x.fillRect(0,0,96,96)}return c})();
const FIREB=(()=>{const c=mkCanvas(96,96),x=c.getContext('2d');const g=x.createRadialGradient(48,48,0,48,48,48);g.addColorStop(0,'rgba(255,255,230,1)');g.addColorStop(.2,'rgba(255,220,120,.95)');g.addColorStop(.45,'rgba(255,130,40,.7)');g.addColorStop(.75,'rgba(200,50,10,.25)');g.addColorStop(1,'rgba(120,20,0,0)');x.fillStyle=g;x.fillRect(0,0,96,96);return c})();
const FLASH=(()=>{const c=mkCanvas(64,64),x=c.getContext('2d');x.translate(32,32);x.globalCompositeOperation='lighter';
 for(const [w,a] of [[30,.5],[18,.8]]){x.fillStyle=`rgba(255,220,140,${a})`;x.beginPath();x.moveTo(w,0);x.lineTo(4,-4);x.lineTo(0,-w*.45);x.lineTo(-4,-4);x.lineTo(-w*.4,0);x.lineTo(-4,4);x.lineTo(0,w*.45);x.lineTo(4,4);x.closePath();x.fill()}
 const g=x.createRadialGradient(0,0,0,0,0,10);g.addColorStop(0,'#fff');g.addColorStop(1,'rgba(255,200,100,0)');x.fillStyle=g;x.fillRect(-10,-10,20,20);return c})();

// ================= material helpers =================
function polyPath(pts,r){const p=new Path2D();pts.forEach(([x,y],i)=>i?p.lineTo(x*r,y*r):p.moveTo(x*r,y*r));p.closePath();return p}
function bounds(pts,r){let a=1e9,b=1e9,c=-1e9,d=-1e9;for(const [x,y] of pts){a=Math.min(a,x*r);b=Math.min(b,y*r);c=Math.max(c,x*r);d=Math.max(d,y*r)}return [a,b,c,d]}
function material(c,path,bb,col,fin,sec,R,opt={}){
 const [x0,y0,x1,y1]=bb,cx=(x0+x1)/2,cy=(y0+y1)/2,rad=Math.max(x1-x0,y1-y0)*.75;
 c.save();c.clip(path);
 let g=c.createRadialGradient(cx-rad*.12,cy-rad*.1,rad*.05,cx,cy,rad);
 if(fin==='chrome'){g=c.createLinearGradient(x0,y0,x1,y1);const t=shade(col,.55);[[0,'#f5f7fa'],[.18,'#7c838b'],[.32,t],[.48,'#eef1f4'],[.62,'#4c535b'],[.8,'#c7ccd2'],[1,'#3a3f45']].forEach(([o,cc])=>g.addColorStop(o,cc))}
 else if(fin==='matte'){g.addColorStop(0,shade(col,.08));g.addColorStop(1,shade(col,-.28))}
 else{g.addColorStop(0,shade(col,.28));g.addColorStop(.55,col);g.addColorStop(1,shade(col,-.5))}
 c.fillStyle=g;c.fillRect(x0-2,y0-2,x1-x0+4,y1-y0+4);
 const W=x1-x0,H=y1-y0;
 if(fin==='camo'&&!opt.noFin){for(let i=0;i<18;i++){const px=x0+R()*W,py=y0+R()*H,cc=i%3?sec:shade(col,-.45);c.fillStyle=cc;c.globalAlpha=.85;c.beginPath();for(let k=0;k<4;k++)c.arc(px+(R()-.5)*W*.12,py+(R()-.5)*H*.12,W*.05+R()*W*.05,0,TAU);c.fill()}c.globalAlpha=1}
 if(fin==='hazard'&&!opt.noFin){c.save();c.beginPath();c.rect(x0+W*.68,y0,W*.4,H);c.clip();c.strokeStyle=sec;c.lineWidth=W*.06;for(let i=-H;i<W+H;i+=W*.16){c.beginPath();c.moveTo(x0+i,y0);c.lineTo(x0+i+H,y1);c.stroke()}c.restore()}
 if(fin==='carbon'){c.globalAlpha=.35;for(let yy=y0;yy<y1;yy+=1.6)for(let xx=x0+((yy/1.6|0)%2)*.8;xx<x1;xx+=1.6){c.fillStyle=((xx+yy)|0)%2?'#000':'#666';c.fillRect(xx,yy,.8,.8)}c.globalAlpha=1}
 if(fin==='rusted'){for(let i=0;i<22;i++){const px=x0+R()*W,py=y0+R()*H,rr=W*(.03+R()*.09),gg=c.createRadialGradient(px,py,0,px,py,rr);gg.addColorStop(0,'rgba(110,52,18,.85)');gg.addColorStop(.6,'rgba(140,70,25,.45)');gg.addColorStop(1,'rgba(120,60,20,0)');c.fillStyle=gg;c.fillRect(px-rr,py-rr,rr*2,rr*2)}
  c.strokeStyle='rgba(90,40,10,.35)';c.lineWidth=.5;for(let i=0;i<10;i++){const px=x0+R()*W,py=y0+R()*H;c.beginPath();c.moveTo(px,py);c.lineTo(px-W*.12*R(),py+(R()-.5)*1.5);c.stroke()}}
 if(fin==='weathered'||fin==='rusted'){c.strokeStyle='rgba(220,225,230,.32)';c.lineWidth=.3;for(let i=0;i<30;i++){const px=x0+R()*W,py=y0+R()*H,a=R()*TAU,l=1+R()*4;c.beginPath();c.moveTo(px,py);c.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);c.stroke()}
  c.fillStyle='rgba(30,25,20,.18)';for(let i=0;i<8;i++){c.beginPath();c.arc(x0+R()*W,y0+R()*H,.5+R()*2,0,TAU);c.fill()}}
 // grain
 c.globalAlpha=fin==='matte'?.5:.3;c.globalCompositeOperation='overlay';c.fillStyle=grain(c);c.save();c.scale(.25,.25);c.fillRect((x0-2)*4,(y0-2)*4,(W+4)*4,(H+4)*4);c.restore();
 c.globalCompositeOperation='source-over';c.globalAlpha=1;
 // specular sheen
 if(fin!=='matte'){const sg=c.createLinearGradient(x0,y0,x1,y1);sg.addColorStop(.25,'rgba(255,255,255,0)');sg.addColorStop(.38,`rgba(255,255,255,${fin==='chrome'?.28:fin==='factory'?.14:.07})`);sg.addColorStop(.5,'rgba(255,255,255,0)');c.fillStyle=sg;c.fillRect(x0,y0,W,H)}
 // ambient occlusion along edges
 for(let i=0;i<3;i++){c.strokeStyle=`rgba(0,0,0,${.16})`;c.lineWidth=(opt.ao||3.2)-i;c.stroke(path)}
 c.restore();
 // edge wear and rim
 if(fin==='weathered'){c.save();c.setLineDash([R()*3+.5,R()*4+1,R()*1.5+.3,R()*5+2]);c.strokeStyle='rgba(170,176,182,.6)';c.lineWidth=.7;c.stroke(path);c.restore()}
 c.strokeStyle='rgba(255,255,255,.2)';c.lineWidth=.45;c.stroke(path);
 c.strokeStyle='rgba(0,0,0,.65)';c.lineWidth=.6;c.stroke(path);
}
function engrave(c,path){c.save();c.translate(.25,.25);c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=.4;c.stroke(path);c.restore();c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=.45;c.stroke(path)}
function rivet(c,x,y,s=.7){const g=c.createRadialGradient(x-s*.3,y-s*.3,0,x,y,s);g.addColorStop(0,'#dfe3e6');g.addColorStop(.5,'#7a8088');g.addColorStop(1,'#25292d');c.fillStyle=g;c.beginPath();c.arc(x,y,s,0,TAU);c.fill()}
function gunmetal(c,x,y,w,h,horiz=true,tone=0){const g=horiz?c.createLinearGradient(0,y,0,y+h):c.createLinearGradient(x,0,x+w,0);
 const k=v=>shade('#7d848c',v+tone);g.addColorStop(0,'#141619');g.addColorStop(.3,k(-.25));g.addColorStop(.48,k(.35));g.addColorStop(.62,k(-.15));g.addColorStop(1,'#101214');return g}
function cyl(c,x,y,len,w,tone=0){c.fillStyle=gunmetal(c,x,y-w/2,len,w,true,tone);c.fillRect(x,y-w/2,len,w);c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=.35;c.strokeRect(x,y-w/2,len,w)}
function muzzle(c,x,y,w){c.fillStyle=gunmetal(c,x,y-w/2-.4,1.8,w+.8,true,-.1);c.fillRect(x,y-w/2-.4,1.8,w+.8);c.fillStyle='#050505';c.fillRect(x+1.5,y-w*.25,.4,w*.5)}
function box(c,x,y,w,h,col='#5b6168',rr=1.2){const p=new Path2D();p.roundRect?p.roundRect(x,y,w,h,rr):p.rect(x,y,w,h);
 const g=c.createRadialGradient(x+w*.4,y+h*.35,0,x+w/2,y+h/2,Math.max(w,h)*.8);g.addColorStop(0,shade(col,.35));g.addColorStop(.6,col);g.addColorStop(1,shade(col,-.55));c.fillStyle=g;c.fill(p);
 c.save();c.clip(p);c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=1.2;c.stroke(p);c.restore();c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=.35;c.stroke(p);c.strokeStyle='rgba(0,0,0,.7)';c.lineWidth=.4;c.stroke(p);return p}
function disc(c,x,y,r,col){const g=c.createRadialGradient(x-r*.3,y-r*.3,0,x,y,r);g.addColorStop(0,shade(col,.4));g.addColorStop(.6,col);g.addColorStop(1,shade(col,-.6));c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.strokeStyle='rgba(0,0,0,.7)';c.lineWidth=.4;c.stroke()}
function led(c,x,y,col,s=.9){c.save();c.globalCompositeOperation='lighter';c.drawImage(glowSprite(col),x-s*4,y-s*4,s*8,s*8);c.restore();c.fillStyle='#fff';c.beginPath();c.arc(x,y,s*.45,0,TAU);c.fill()}

// ================= hull sprites =================
const HULLS=new Map();
function hullSprite(fk,ak,paint,tier=1){
 const key=[fk,ak,paint.p,paint.s,paint.fin,paint.num,tier].join('|');if(HULLS.has(key))return HULLS.get(key);
 const F=FRAMES[fk],r=F.r,hs=r*1.45+4,cv=mkCanvas(hs*2*HS,hs*2*HS),c=cv.getContext('2d');c.setTransform(HS,0,0,HS,hs*HS,hs*HS);
 const R=mulberry(hashStr(key)),body=polyPath(F.body,r),bb=bounds(F.body,r);
 // under-plate (dark chassis skirt slightly larger)
 c.save();c.scale(1.04,1.06);c.fillStyle='#16191c';c.fill(body);c.restore();
 material(c,body,bb,paint.p,paint.fin,paint.s,R);
 // armor overlay
 c.save();c.clip(body);const [x0,y0,x1,y1]=bb,W=x1-x0,H=y1-y0;
 if(ak==='steel'){for(const sy of [-1,1]){const p=new Path2D();p.rect(x0+W*.18,sy<0?y0+1:y1-H*.28-1,W*.55,H*.28);c.fillStyle='rgba(255,255,255,.05)';c.fill(p);engrave(c,p);for(const [px,py] of [[x0+W*.2,0],[x0+W*.71,0]]){const yy=sy<0?y0+2.2:y1-2.2;rivet(c,px,yy,.55);rivet(c,px,yy+sy*-(H*.28-2.4),.55)}}}
 else if(ak==='composite'){c.strokeStyle='rgba(0,0,0,.18)';c.lineWidth=.35;for(let i=-H;i<W+H;i+=1.4){c.beginPath();c.moveTo(x0+i,y0);c.lineTo(x0+i+H,y1);c.stroke();c.beginPath();c.moveTo(x0+i,y1);c.lineTo(x0+i+H,y0);c.stroke()}}
 else if(ak==='reactive'){const s=r*.24;for(let xx=x0+2;xx<x1-s;xx+=s+.6)for(const yy of [y0+1,y1-s-1]){const p=box(c,xx,yy,s,s,shade(paint.p,-.15),.5);}}
 else if(ak==='ceramic'){c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=.35;const s=r*.13;for(let yy=y0,row=0;yy<y1+s;yy+=s*1.5,row++)for(let xx=x0+(row%2)*s*.87;xx<x1+s;xx+=s*1.73){c.beginPath();for(let k=0;k<6;k++){const a=k/6*TAU+Math.PI/6;c.lineTo(xx+Math.cos(a)*s,yy+Math.sin(a)*s)}c.closePath();c.stroke()}c.fillStyle='rgba(235,230,215,.12)';c.fillRect(x0,y0,W,H)}
 else if(ak==='ablative'){for(let i=1;i<4;i++){c.save();c.scale(1-i*.13,1-i*.13);c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=.7;c.stroke(body);c.restore()}c.fillStyle='rgba(30,30,30,.2)';c.fillRect(x0,y0,W,H)}
 else if(ak==='titanium'){c.strokeStyle='rgba(255,255,255,.09)';c.lineWidth=.25;for(let yy=y0;yy<y1;yy+=.6){c.beginPath();c.moveTo(x0,yy+R()*.3);c.lineTo(x1,yy+R()*.3);c.stroke()}c.fillStyle='rgba(120,150,190,.14)';c.fillRect(x0,y0,W,H)}
 else if(ak==='neutronium'){const g=c.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,'rgba(120,60,200,.3)');g.addColorStop(.5,'rgba(20,10,40,.15)');g.addColorStop(1,'rgba(160,80,255,.3)');c.fillStyle=g;c.fillRect(x0,y0,W,H);
  c.save();c.scale(.82,.82);c.strokeStyle='rgba(190,120,255,.8)';c.lineWidth=.45;c.setLineDash([3,2]);c.stroke(body);c.restore()}
 c.restore();
 // panels in secondary
 for(const pp of F.panels||[]){const p=polyPath(pp,r);material(c,p,bounds(pp,r),paint.s,paint.fin==='chrome'?'chrome':paint.fin==='camo'||paint.fin==='hazard'?'factory':paint.fin,paint.p,R,{ao:2,noFin:1});}
 // seams
 const seam=new Path2D();seam.moveTo(x0+W*.3,y0+H*.12);seam.lineTo(x0+W*.3,y1-H*.12);engrave(c,seam);
 // vents
 for(const [vx,vy,vw,vh] of F.vents||[]){const X=vx*r,Y=vy*r,Wd=vw*r,Hd=vh*r;c.fillStyle='#0b0d0f';c.fillRect(X,Y,Wd,Hd);c.strokeStyle='#3a4047';c.lineWidth=.4;
  if(Wd<Hd)for(let yy=Y+.8;yy<Y+Hd;yy+=1.1){c.beginPath();c.moveTo(X+.3,yy);c.lineTo(X+Wd-.3,yy);c.stroke()}else for(let xx=X+.8;xx<X+Wd;xx+=1.1){c.beginPath();c.moveTo(xx,Y+.3);c.lineTo(xx,Y+Hd-.3);c.stroke()}
  c.strokeStyle='rgba(255,255,255,.15)';c.strokeRect(X,Y,Wd,Hd)}
 // rivets along edges
 const pts=F.body;for(let i=0;i<pts.length;i++){const [ax,ay]=pts[i],[bx,by]=pts[(i+1)%pts.length];const L=Math.hypot(bx-ax,by-ay)*r,n=Math.floor(L/5);
  for(let k=1;k<n;k++){const t=k/n,px=lerp(ax,bx,t)*r*.86,py=lerp(ay,by,t)*r*.86;rivet(c,px,py,.42)}}
 // mount rings
 F.mounts.forEach(([s,mx,my])=>{const rr=s==='S'?4.2:s==='M'?5.6:7.4;const X=mx*r,Y=my*r;c.fillStyle='rgba(0,0,0,.55)';c.beginPath();c.arc(X+.4,Y+.6,rr+.8,0,TAU);c.fill();
  disc(c,X,Y,rr,'#3b4147');c.strokeStyle='#15181b';c.lineWidth=.6;c.beginPath();c.arc(X,Y,rr*.72,0,TAU);c.stroke();for(let k=0;k<8;k++){const a=k/8*TAU;rivet(c,X+Math.cos(a)*rr*.86,Y+Math.sin(a)*rr*.86,.32)}});
 // number decal
 c.save();c.translate(x0+W*.18,0);c.rotate(Math.PI/2);c.font=`700 ${r*.42}px "Chakra Petch",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.globalAlpha=.75;c.fillStyle=paint.s===paint.p?'#eee':shade(paint.s,.2);c.fillText(String(paint.num??''),0,0);
 if(paint.fin==='weathered'||paint.fin==='rusted'){c.globalCompositeOperation='destination-out';for(let i=0;i<12;i++){c.beginPath();c.arc((R()-.5)*r*.6,(R()-.5)*r*.4,.4+R()*.7,0,TAU);c.fill()}}c.restore();
 // lights
 for(const [lx,ly] of F.lights||[])led(c,lx*r,ly*r,'#fff2c8',.9);
 // tier trim
 if(tier>=3){c.save();c.scale(.93,.93);c.strokeStyle=rgba(TIERS[tier].col,.6);c.lineWidth=.5;c.stroke(body);c.restore()}
 const out={cv,hs};HULLS.set(key,out);return out;
}

// ================= weapon sprites =================
const WSPR=new Map();
function weaponSprite(k,sec='#555',tier=1){
 const key=k+sec+tier;if(WSPR.has(key))return WSPR.get(key);
 const ext=44,cv=mkCanvas(ext*2*HS,32*HS),c=cv.getContext('2d');c.setTransform(HS,0,0,HS,ext*HS,16*HS);
 const S2=shade(sec,-.1);
 const base=(rr)=>{disc(c,0,0,rr,'#4a5057');c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=.4;c.beginPath();c.arc(0,0,rr*.55,0,TAU);c.stroke()};
 switch(k){
  case 'lmg':box(c,-5,-3.6,11,7.2,'#4e545b');cyl(c,5,0,10,2.4);muzzle(c,14,0,2.4);box(c,-3,3.2,6,3.4,S2,.6);base(3);break;
  case 'pulse':box(c,-5,-3.8,10,7.6,'#50565e');cyl(c,3,0,9,3.2);for(let i=0;i<3;i++){c.fillStyle='#2b8fa8';c.fillRect(5+i*2.4,-2,1,4)}led(c,12.6,0,'#6ff3ff',1);base(3);break;
  case 'spike':box(c,-4,-4,7,8,S2);{const g=c.createLinearGradient(0,-3,0,3);g.addColorStop(0,'#2a2e33');g.addColorStop(.5,'#d6dbe0');g.addColorStop(1,'#2a2e33');c.fillStyle=g;c.beginPath();c.moveTo(2,-3.2);c.lineTo(17,0);c.lineTo(2,3.2);c.closePath();c.fill();c.strokeStyle='#111';c.lineWidth=.4;c.stroke()}break;
  case 'needle':box(c,-5,-3,10,6,'#4a5057');cyl(c,3,0,17,1.8);muzzle(c,19,0,1.8);cyl(c,-2,-3.6,8,2.2,.1);c.fillStyle='#7fd0ff';c.fillRect(5.6,-4.2,.7,1.2);base(2.6);break;
  case 'microm':box(c,-5,-6,13,12,S2);for(const y of [-2.7,2.7]){disc(c,6,y,2.2,'#202326');c.fillStyle='#b52a1a';c.beginPath();c.arc(6.4,y,1.1,0,TAU);c.fill()}break;
  case 'torch':disc(c,-2,0,4,S2);cyl(c,1,0,9,2.6);c.fillStyle='#1a1a1a';c.fillRect(9.5,-1.8,2,3.6);led(c,11.8,0,'#5fb0ff',.7);break;
  case 'minigun':box(c,-7,-5.5,11,11,'#4c5259');for(let i=0;i<6;i++){const y=-2.6+i*1.04;cyl(c,3,y,14,1.05,i%2?-.1:.1)}box(c,13,-3.6,2.4,7.2,'#3a3f45',.4);box(c,4.5,-3.6,2,7.2,'#3a3f45',.4);box(c,-6,5,7,3.5,S2,.6);base(4);break;
  case 'shotgun':cyl(c,2,-2.2,15,3.2);cyl(c,2,2.2,15,3.2);muzzle(c,16.5,-2.2,3.2);muzzle(c,16.5,2.2,3.2);box(c,-6,-5,10,10,'#4f555c');box(c,5,-4.6,4,9.2,S2,.6);base(3.6);break;
  case 'autocannon':box(c,-8,-5.5,13,11,'#4a5057');cyl(c,4,0,19,4);box(c,21,-3.4,4.5,6.8,'#353a40',.5);c.fillStyle='#0a0a0a';c.fillRect(22,-3.4,.7,6.8);c.fillRect(23.6,-3.4,.7,6.8);box(c,-6,5,8,3.2,S2,.6);base(4.4);break;
  case 'laser':box(c,-7,-5,14,10,'#454b52');c.strokeStyle='#1d2024';c.lineWidth=.5;for(let x=-5;x<5;x+=1.3){c.beginPath();c.moveTo(x,-5);c.lineTo(x,5);c.stroke()}cyl(c,7,0,12,3);disc(c,19.5,0,2.2,'#552255');led(c,19.8,0,'#ff4dff',1.2);base(4);break;
  case 'rockets':box(c,-6,-7,16,14,S2);for(let i=0;i<2;i++)for(let j=0;j<3;j++){disc(c,7.5-i*4.2,-4.4+j*4.4,1.7,'#1d2023');c.fillStyle='#c0451c';c.beginPath();c.arc(7.7-i*4.2,-4.4+j*4.4,.8,0,TAU);c.fill()}break;
  case 'grenade':disc(c,-1,0,5.2,'#4b5158');for(let i=0;i<6;i++){const a=i/6*TAU;disc(c,-1+Math.cos(a)*3,Math.sin(a)*3,1.1,'#1d2023')}cyl(c,3,0,13,4.6);muzzle(c,15.5,0,4.6);box(c,-3,4.2,6,2.6,S2,.6);break;
  case 'flamer':disc(c,-4,0,5,S2);c.fillStyle='rgba(255,255,255,.3)';c.fillRect(-6,-4.3,4,.8);cyl(c,0,0,12,3.2);c.fillStyle=gunmetal(c,12,-3,6,6);c.beginPath();c.moveTo(12,-1.8);c.lineTo(18,-3.2);c.lineTo(18,3.2);c.lineTo(12,1.8);c.fill();led(c,18.2,2.6,'#5fb0ff',.6);break;
  case 'tesla':box(c,-5,-5.5,9,11,'#3e444b');for(let i=0;i<4;i++){const rr=5-i*1;c.strokeStyle=['#b87333','#d48a42','#9c5a25','#e0a060'][i];c.lineWidth=1.1;c.beginPath();c.arc(6,0,rr,0,TAU);c.stroke()}disc(c,6,0,2,'#c0d8ff');led(c,6,0,'#9fd0ff',1.4);break;
  case 'saw':box(c,-5,-3.6,9,7.2,'#4a5057');cyl(c,2,0,11,3.4);box(c,11,-4,5,8,S2,.8);break;
  case 'rail':box(c,-10,-6.5,14,13,'#40464d');cyl(c,0,-3.6,35,2.4);cyl(c,0,3.6,35,2.4);for(let x=4;x<32;x+=4.5){box(c,x,-4.6,2,9.2,'#2a2f35',.3);c.fillStyle='rgba(120,200,255,.85)';c.fillRect(x+.6,-1.4,.8,2.8)}c.fillStyle='rgba(140,210,255,.5)';c.fillRect(2,-.6,32,1.2);box(c,-8,6,9,3.4,S2,.6);base(6);break;
  case 'cannon':box(c,-10,-9,14,18,S2,2);cyl(c,2,0,27,6.4);box(c,28,-4.8,5,9.6,'#353a40',.6);c.fillStyle='#090909';c.fillRect(29.2,-4.8,.8,9.6);c.fillRect(31,-4.8,.8,9.6);c.fillStyle='#060606';c.beginPath();c.arc(33,0,2,0,TAU);c.fill();base(7);break;
  case 'missiles':box(c,-9,-10,24,20,S2,2);for(let i=0;i<3;i++)for(let j=0;j<2;j++){disc(c,11-i*6,-4.6+j*9.2,2.5,'#1b1e21');c.fillStyle='#d8d8d8';c.beginPath();c.arc(11.3-i*6,-4.6+j*9.2,1.2,0,TAU);c.fill();c.fillStyle='#c23b22';c.beginPath();c.arc(11.3-i*6,-4.6+j*9.2,.55,0,TAU);c.fill()}break;
  case 'mortar':box(c,-9,-8,13,16,'#454b52',2);cyl(c,-2,-6.6,10,2,.1);cyl(c,-2,6.6,10,2,.1);disc(c,7,0,6.5,'#3b4148');c.fillStyle='#050505';c.beginPath();c.arc(7,0,4.4,0,TAU);c.fill();c.strokeStyle='#7d848c';c.lineWidth=.6;c.beginPath();c.arc(7,0,5.3,0,TAU);c.stroke();break;
  case 'lance':box(c,-10,-7,15,14,'#3d4249');cyl(c,4,0,26,4.4);for(let x=7;x<28;x+=3.5){c.fillStyle='#1b1d20';c.fillRect(x,-3.4,1.2,6.8);c.fillStyle='rgba(200,120,255,.9)';c.fillRect(x+.2,-.8,.8,1.6)}disc(c,31,0,2.8,'#4a2a6a');led(c,31.3,0,'#d080ff',1.6);box(c,-8,7,9,3,S2,.6);base(6);break;
  case 'hammer':box(c,-7,-6,10,12,'#454b52');cyl(c,1,0,17,3.6);cyl(c,1,0,10,5,.1);box(c,17,-8,9,16,S2,1);c.fillStyle='rgba(0,0,0,.4)';c.fillRect(24,-8,2,16);base(5);break;
  case 'inferno':disc(c,-6,-4,5,S2);disc(c,-6,4,5,S2);cyl(c,-1,0,16,5);c.fillStyle=gunmetal(c,15,-6,10,12);c.beginPath();c.moveTo(15,-3);c.lineTo(26,-6);c.lineTo(26,6);c.lineTo(15,3);c.fill();c.strokeStyle='#111';c.lineWidth=.4;c.stroke();led(c,26,5,'#5fb0ff',.8);break;
 }
 if(tier>=2){c.fillStyle=TIERS[tier].col;c.fillRect(-3,-1.2,1,2.4)}
 const out={cv,ext};WSPR.set(key,out);return out;
}

// ================= drives (per frame) =================
function drawDrive(c,dk,r,ph,t){
 const rub=(x,y,w,h,ang=0,lug=1)=>{c.save();c.translate(x,y);c.rotate(ang);const g=c.createLinearGradient(0,-h/2,0,h/2);g.addColorStop(0,'#0c0d0e');g.addColorStop(.5,'#3a3c3f');g.addColorStop(1,'#0c0d0e');
  c.fillStyle=g;c.beginPath();c.roundRect?c.roundRect(-w/2,-h/2,w,h,h*.3):c.rect(-w/2,-h/2,w,h);c.fill();c.strokeStyle='rgba(0,0,0,.8)';c.lineWidth=.6;c.stroke();
  c.save();c.clip();c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=.55*lug;const step=1.6*lug;for(let xx=-w/2-step+((ph*6)%step+step)%step;xx<w/2+step;xx+=step){c.beginPath();c.moveTo(xx,-h/2);c.lineTo(xx-.5,h/2);c.stroke()}c.restore();
  c.fillStyle='#6e747b';c.fillRect(-w*.12,-h/2-.2,w*.24,.6);c.restore()};
 if(dk==='wheels'){for(const sx of [-1,1])for(const sy of [-1,1])rub(sx*r*.62,sy*r*.92,r*.56,r*.3)}
 else if(dk==='offroad'){for(const sx of [-1,0,1])for(const sy of [-1,1])rub(sx*r*.68,sy*r*.98,r*.48,r*.36,0,1.5)}
 else if(dk==='treads'){for(const sy of [-1,1]){const y=sy*r*.92,w=r*2.15,h=r*.44;c.fillStyle='#121314';c.beginPath();c.roundRect?c.roundRect(-w/2,y-h/2,w,h,h/2):c.rect(-w/2,y-h/2,w,h);c.fill();
  c.save();c.clip();const step=2.2;for(let xx=-w/2+((ph*8)%step+step)%step-step;xx<w/2+step;xx+=step){const g=c.createLinearGradient(0,y-h/2,0,y+h/2);g.addColorStop(0,'#232527');g.addColorStop(.5,'#5a5e63');g.addColorStop(1,'#1d1f21');c.fillStyle=g;c.fillRect(xx,y-h/2,step*.72,h)}c.restore();
  for(const ex of [-w/2+h/2,w/2-h/2])disc(c,ex,y,h*.36,'#3a3f45')}}
 else if(dk==='legs'){const legs=[[1,-1,0],[1,1,Math.PI],[-1,-1,Math.PI],[-1,1,0]];for(const [sx,sy,off] of legs){const hx=sx*r*.5,hy=sy*r*.55,sw=Math.sin(ph*1.6+off)*r*.38,lift=Math.max(0,Math.cos(ph*1.6+off));
  const fx=sx*r*.95+sw,fy=sy*r*(1.18+lift*.08),kx=(hx+fx)/2+sx*r*.12,ky=(hy+fy)/2+sy*r*.35;
  c.lineCap='round';for(const [ax,ay,bx,by,w] of [[hx,hy,kx,ky,r*.26],[kx,ky,fx,fy,r*.2]]){c.strokeStyle='#1b1d20';c.lineWidth=w+1;c.beginPath();c.moveTo(ax,ay);c.lineTo(bx,by);c.stroke();c.strokeStyle='#5b6168';c.lineWidth=w*.6;c.stroke();c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=w*.15;c.stroke()}
  disc(c,kx,ky,r*.14,'#3c4248');disc(c,fx,fy,r*.17+lift*.03,'#2b2f33')}}
 else if(dk==='omni'){for(const sx of [-1,1])for(const sy of [-1,1]){c.save();c.translate(sx*r*.66,sy*r*.86);c.rotate(sx*sy*Math.PI/4);rub(0,0,r*.5,r*.3,0,.8);c.restore()}}
 else if(dk==='hover'){c.save();c.scale(1.15,1.2);const g=c.createRadialGradient(0,0,r*.6,0,0,r*1.05);g.addColorStop(0,'#111');g.addColorStop(.85,'#26292c');g.addColorStop(1,'#0a0a0a');c.fillStyle=g;c.beginPath();c.ellipse(0,0,r*1.02,r*.92,0,0,TAU);c.fill();c.restore();
  for(const sx of [-1,1])for(const sy of [-1,1]){const a=.6+.4*Math.sin(t*20+sx*3+sy);c.save();c.globalCompositeOperation='lighter';c.globalAlpha=a;c.drawImage(glowSprite('#64c8ff'),sx*r*.75-r*.35,sy*r*.75-r*.35,r*.7,r*.7);c.restore()}}
}

// ================= composite bot renderer =================
function botExt(v){return v.r*1.6+v.maxLen+6}
function renderBot(ctx,v,t,SS,opt={}){
 const ext=v.ext,size=Math.ceil(ext*2*SS);
 if(!v.tc||v.tc.width!==size){v.tc=mkCanvas(size,size);v.sc=mkCanvas(size/3,size/3)}
 const c=v.tc.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,size,size);
 c.setTransform(SS,0,0,SS,size/2,size/2);c.rotate(v.angle);
 drawDrive(c,v.dk,v.r,v.ph||0,t);
 const h=v.hull;c.drawImage(h.cv,-h.hs,-h.hs,h.hs*2,h.hs*2);
 if(v.marks&&v.marks.length){c.save();c.globalCompositeOperation='source-atop';for(const m of v.marks){const g=c.createRadialGradient(m.x,m.y,0,m.x,m.y,m.s);g.addColorStop(0,'rgba(10,8,6,.85)');g.addColorStop(.5,'rgba(25,18,12,.45)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(m.x-m.s,m.y-m.s,m.s*2,m.s*2)}c.restore()}
 for(const w of v.weps){c.save();c.translate(w.mx,w.my);c.rotate((w.aim??v.angle)-v.angle);c.translate(-(w.recoil||0),0);
  c.drawImage(w.spr.cv,-w.spr.ext,-16,w.spr.ext*2,32);
  if(w.k==='saw'){c.translate(18,0);c.rotate(w.spin||0);const R=8.5;c.fillStyle='#9aa1a8';c.beginPath();for(let i=0;i<20;i++){const a=i/20*TAU,rr=i%2?R*.82:R;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}c.closePath();c.fill();
   const g=c.createRadialGradient(-2,-2,0,0,0,R);g.addColorStop(0,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(0,0,0,.4)');c.fillStyle=g;c.fill();c.strokeStyle='#222';c.lineWidth=.4;c.stroke();for(let i=0;i<4;i++){const a=i/4*TAU;c.fillStyle='#2a2d31';c.beginPath();c.arc(Math.cos(a)*R*.5,Math.sin(a)*R*.5,1,0,TAU);c.fill()}disc(c,0,0,2.2,'#3a3f45')}
  if(w.k==='minigun'&&w.spin){c.fillStyle=`rgba(255,255,255,${.12*w.spin})`;c.fillRect(3,-3.2,14,6.4)}
  if(w.k==='rail'&&w.charge>0){c.globalCompositeOperation='lighter';c.globalAlpha=Math.min(1,w.charge);c.drawImage(glowSprite('#7fc8ff'),-4,-10,40,20);c.globalCompositeOperation='source-over'}
  c.restore()}
 // world-space lighting
 c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-atop';
 const lg=c.createLinearGradient(0,0,size,size);lg.addColorStop(0,'rgba(255,244,225,.2)');lg.addColorStop(.48,'rgba(0,0,0,0)');lg.addColorStop(1,'rgba(0,0,12,.38)');c.fillStyle=lg;c.fillRect(0,0,size,size);
 if(v.flash>0){c.fillStyle=`rgba(255,255,255,${Math.min(.5,v.flash*5)})`;c.fillRect(0,0,size,size)}
 if(v.tint){c.fillStyle=v.tint;c.fillRect(0,0,size,size)}
 c.globalCompositeOperation='source-over';
 // shadow
 const sc=v.sc.getContext('2d'),ss=v.sc.width;sc.globalCompositeOperation='source-over';sc.clearRect(0,0,ss,ss);sc.drawImage(v.tc,0,0,ss,ss);sc.globalCompositeOperation='source-in';sc.fillStyle='#000';sc.fillRect(0,0,ss,ss);
 const hov=v.dk==='hover'?2:1,a=opt.alpha??1;
 ctx.imageSmoothingQuality='high';ctx.globalAlpha=.5*a;ctx.drawImage(v.sc,v.x-ext+4*hov,v.y-ext+6*hov,ext*2,ext*2);ctx.globalAlpha=.25*a;ctx.drawImage(v.sc,v.x-ext+7*hov,v.y-ext+10*hov,ext*2+4,ext*2+4);
 ctx.globalAlpha=a;ctx.drawImage(v.tc,v.x-ext,v.y-ext,ext*2,ext*2);ctx.globalAlpha=1;
}
// Build a visual descriptor from a design + computed stats
function makeVis(design,o,inv){
 const F=o.F,r=F.r;const ak=design.armor&&inv[design.armor]?inv[design.armor].k:null;const ft=inv[design.frame]?inv[design.frame].t:1;
 const weps=[];design.weps.forEach((id,i)=>{const p=id&&inv[id];if(!p)return;const [s,mx,my]=F.mounts[i];weps.push({k:p.k,spr:weaponSprite(p.k,design.paint.s,p.t),mx:mx*r,my:my*r,aim:null,len:WEAPONS[p.k].len})});
 const v={r,hull:hullSprite(o.fk,ak,design.paint,ft),weps,dk:o.dk||'wheels',angle:0,ph:0,x:0,y:0,maxLen:Math.max(10,...weps.map(w=>w.len+Math.hypot(w.mx,w.my)-r*.6))};v.ext=botExt(v);return v;
}
function previewBot(cv,design,inv=S.inv,opt={}){
 const o=compute(design,inv);if(!o.F){const c=cv.getContext('2d');c.clearRect(0,0,cv.width,cv.height);return}
 const dpr=Math.min(2.5,window.devicePixelRatio||1),W=cv.clientWidth||80,H=cv.clientHeight||80;if(cv.width!==W*dpr){cv.width=W*dpr;cv.height=H*dpr}
 const c=cv.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,cv.width,cv.height);
 const v=opt.vis||makeVis(design,o,inv);v.angle=opt.angle??-Math.PI/2;v.weps.forEach((w,i)=>w.aim=opt.aim!=null?opt.aim+(i%2?.06:-.06):v.angle);v.ph=opt.ph||0;
 const k=Math.min(W,H)/(v.ext*2)*(opt.zoom||1.05);c.setTransform(dpr*k,0,0,dpr*k,dpr*W/2,dpr*H/2);v.x=0;v.y=0;
 if(opt.floor){const g=c.createRadialGradient(0,0,0,0,0,v.ext*1.2);g.addColorStop(0,'rgba(255,240,210,.09)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(-v.ext*2,-v.ext*2,v.ext*4,v.ext*4)}
 renderBot(c,v,opt.t||0,Math.max(1,Math.min(3,dpr*k)));return v;
}

// ================= part icons =================
function partIcon(cv,p,paint={p:'#6d747c',s:'#2a2e33',fin:'factory',num:''}){
 const dpr=Math.min(2.5,window.devicePixelRatio||1),W=cv.clientWidth||52,H=cv.clientHeight||52;cv.width=W*dpr;cv.height=H*dpr;
 const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,W/2*dpr,H/2*dpr);
 const g=c.createRadialGradient(0,0,0,0,0,W*.7);g.addColorStop(0,'#2a3039');g.addColorStop(1,'#12161b');c.fillStyle=g;c.fillRect(-W/2,-H/2,W,H);
 const sc=W/52;c.scale(sc,sc);
 if(p.c==='frame'){const h=hullSprite(p.k,null,paint,p.t),F=FRAMES[p.k],k=21/(F.r*1.25);c.save();c.rotate(-Math.PI/2);c.drawImage(h.cv,-h.hs*k,-h.hs*k,h.hs*2*k,h.hs*2*k);c.restore()}
 else if(p.c==='weapon'){const s=weaponSprite(p.k,'#5a3a22',p.t),L=WEAPONS[p.k].len+8,k=Math.min(1.5,40/L);c.save();c.rotate(-Math.PI/4);c.scale(k,k);c.translate(-L/2+6,0);c.drawImage(s.cv,-s.ext,-16,s.ext*2,32);c.restore()}
 else if(p.c==='drive'){c.save();c.rotate(-Math.PI/2);drawDrive(c,p.k,13,1.3,0);box(c,-10,-8,20,16,'#3a4047',2);c.restore()}
 else if(p.c==='core'){const col={battery:'#58d68d',cell:'#5dade2',capacitor:'#f4d03f',fusion:'#ff9a3c',reactor:'#d26bff'}[p.k];box(c,-11,-15,22,30,'#40464d',3);c.fillStyle='#0d0f12';c.fillRect(-7,-11,14,22);
  const gg=c.createLinearGradient(-7,0,7,0);gg.addColorStop(0,shade(col,-.5));gg.addColorStop(.5,col);gg.addColorStop(1,shade(col,-.5));c.fillStyle=gg;c.fillRect(-6,-10+20*(1-CORES[p.k].pow/34),12,20*CORES[p.k].pow/34);c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.6;c.drawImage(glowSprite(col),-20,-20,40,40);c.restore();for(const y of [-14,14])box(c,-5,y-1.5,10,3,'#8a9097',.6)}
 else if(p.c==='armor'){const pts=[[1,-.7],[1,.7],[-1,.8],[-1,-.8]],path=polyPath(pts,15);const col={steel:'#8a9097',composite:'#3c4a3c',reactive:'#6b5b3a',ceramic:'#d9d2c0',ablative:'#3a3a3a',titanium:'#9fb0c4',neutronium:'#4b2e7a'}[p.k];material(c,path,bounds(pts,15),col,'factory','#222',mulberry(3));for(const [x,y] of [[-12,-9],[12,-8],[-12,9],[12,8]])rivet(c,x,y,1.2)}
 else if(p.c==='util'){box(c,-14,-12,28,24,'#4a5058',3);const sym={shield:'⬡',repair:'✚',booster:'➤',plating:'▦',gyro:'◎',spikes:'✷',mines:'◉',overclock:'⚡',cooling:'❄',targeting:'⌖',flares:'✦',decoy:'◈',emp:'ϟ',gundrone:'✈',medidrone:'✚',stealth:'◐'}[p.k]||'■';
  c.fillStyle=p.k==='medidrone'||p.k==='repair'?'#7dff9a':'#ffcf6a';c.font='700 16px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(sym,0,1)}
 else if(p.c==='chip'){c.fillStyle='#9aa0a6';for(let i=-3;i<=3;i++){c.fillRect(i*3.6-.8,-17,1.6,4);c.fillRect(i*3.6-.8,13,1.6,4);c.fillRect(-17,i*3.6-.8,4,1.6);c.fillRect(13,i*3.6-.8,4,1.6)}box(c,-13,-13,26,26,'#1d2a22',2);
  const col={basic:'#7dff9a',tactical:'#4da3ff',neural:'#d26bff'}[p.k];c.strokeStyle=rgba(col,.6);c.lineWidth=.6;for(let i=0;i<6;i++){c.beginPath();c.moveTo(-10,-8+i*3);c.lineTo(-3,-8+i*3);c.lineTo(0,-5+i*2);c.stroke()}box(c,-4,-4,8,8,'#2a2f35',1);c.save();c.globalCompositeOperation='lighter';c.drawImage(glowSprite(col),-10,-10,20,20);c.restore()}
 if(p.t>1){c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle=TIERS[p.t].col;c.fillRect(0,H-3,W,3)}
}

// ================= arena floor =================
const FS=1.5;
function genArena(G,M,seed){
 const W=G.W,H=G.H,cv=mkCanvas(W*FS,H*FS),c=cv.getContext('2d'),N=makeNoise(seed),R=mulberry(seed);
 // concrete base from noise
 const nw=Math.ceil(W/5),nh=Math.ceil(H/5),nc=mkCanvas(nw,nh),nx=nc.getContext('2d'),d=nx.createImageData(nw,nh);
 for(let y=0;y<nh;y++)for(let x=0;x<nw;x++){const n=N(x/14,y/14,5),m=N(x/3+50,y/3+50,2),i=(y*nw+x)*4,v=48+n*42+m*10;d.data[i]=v*1.02;d.data[i+1]=v;d.data[i+2]=v*.94;d.data[i+3]=255}
 nx.putImageData(d,0,0);c.imageSmoothingEnabled=true;c.drawImage(nc,0,0,W*FS,H*FS);
 c.setTransform(FS,0,0,FS,0,0);
 c.globalAlpha=.22;c.globalCompositeOperation='overlay';c.fillStyle=grain(c);c.save();c.scale(.5,.5);c.fillRect(0,0,W*2,H*2);c.restore();c.globalCompositeOperation='source-over';c.globalAlpha=1;
 // slabs
 const S=160;for(let x=0;x<W;x+=S)for(let y=0;y<H;y+=S){c.fillStyle=`rgba(${R()<.5?0:255},${R()<.5?0:255},${R()<.5?0:255},${R()*.035})`;c.fillRect(x,y,S,S)}
 for(let x=S;x<W;x+=S){c.fillStyle='rgba(0,0,0,.45)';c.fillRect(x-1,0,2,H);c.fillStyle='rgba(255,255,255,.06)';c.fillRect(x+1,0,1,H)}
 for(let y=S;y<H;y+=S){c.fillStyle='rgba(0,0,0,.45)';c.fillRect(0,y-1,W,2);c.fillStyle='rgba(255,255,255,.06)';c.fillRect(0,y+1,W,1)}
 // steel inlay plates at slab corners
 for(let x=S;x<W;x+=S)for(let y=S;y<H;y+=S){c.fillStyle='#34383c';c.fillRect(x-7,y-7,14,14);c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=.8;c.strokeRect(x-7,y-7,14,14);for(const [dx,dy] of [[-4,-4],[4,-4],[-4,4],[4,4]])rivet(c,x+dx,y+dy,1)}
 // stains
 for(let i=0;i<55;i++){const x=R()*W,y=R()*H,r=8+R()*45,g=c.createRadialGradient(x,y,0,x,y,r);const oil=R()<.4;g.addColorStop(0,oil?'rgba(10,12,18,.32)':'rgba(30,24,18,.2)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.ellipse(x,y,r,r*(.5+R()*.5),R()*3,0,TAU);c.fill()}
 // tire marks
 c.lineCap='round';for(let i=0;i<26;i++){const x=R()*W,y=R()*H,rr=60+R()*200,a=R()*TAU,sp=.4+R()*.9;c.strokeStyle=`rgba(8,8,8,${.06+R()*.08})`;c.lineWidth=4+R()*4;for(const off of [0,9]){c.beginPath();c.arc(x,y,rr+off,a,a+sp);c.stroke()}}
 // cracks
 c.strokeStyle='rgba(10,10,10,.5)';c.lineWidth=.8;for(let i=0;i<14;i++){let x=R()*W,y=R()*H,a=R()*TAU;c.beginPath();c.moveTo(x,y);for(let k=0;k<12;k++){a+=(R()-.5)*1.2;x+=Math.cos(a)*6;y+=Math.sin(a)*6;c.lineTo(x,y)}c.stroke()}
 // painted markings (worn)
 const paintWorn=(fn)=>{const pc=mkCanvas(W,H),p=pc.getContext('2d');fn(p);p.globalCompositeOperation='destination-out';for(let i=0;i<900;i++){p.globalAlpha=R()*.8;p.beginPath();p.arc(R()*W,R()*H,1+R()*5,0,TAU);p.fill()}p.globalAlpha=1;c.drawImage(pc,0,0)};
 paintWorn(p=>{p.strokeStyle='rgba(225,180,40,.55)';p.lineWidth=5;p.strokeRect(24,24,W-48,H-48);p.strokeStyle='rgba(225,225,215,.35)';p.lineWidth=3;p.beginPath();p.arc(W/2,H/2,110,0,TAU);p.stroke();p.beginPath();p.arc(W/2,H/2,58,0,TAU);p.stroke();
  if(G.portrait){p.beginPath();p.moveTo(24,H/2);p.lineTo(W/2-110,H/2);p.moveTo(W/2+110,H/2);p.lineTo(W-24,H/2);p.stroke()}else{p.beginPath();p.moveTo(W/2,24);p.lineTo(W/2,H/2-110);p.moveTo(W/2,H/2+110);p.lineTo(W/2,H-24);p.stroke()}
  const bay=(x,y,w,h,col)=>{p.save();p.beginPath();p.rect(x,y,w,h);p.clip();p.strokeStyle=rgba(col,.4);p.lineWidth=12;for(let i=-h-w;i<w+h;i+=34){p.beginPath();p.moveTo(x+i,y);p.lineTo(x+i+h,y+h);p.stroke()}p.restore();p.strokeStyle=rgba(col,.6);p.lineWidth=3;p.strokeRect(x,y,w,h)};
  if(G.portrait){bay(90,H-150,W-180,118,'#3ee6c1');bay(90,32,W-180,118,'#ff3b5c')}else{bay(32,90,118,H-180,'#3ee6c1');bay(W-150,90,118,H-180,'#ff3b5c')}
  p.save();p.translate(W/2,H/2);p.font='700 30px "Chakra Petch",sans-serif';p.textAlign='center';p.textBaseline='middle';p.fillStyle='rgba(230,230,220,.28)';p.fillText('ARENA',0,0);p.restore()});
 // slag pits baked
 for(const s of G.slag){const g=c.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r+16);g.addColorStop(0,'rgba(0,0,0,.0)');g.addColorStop(.8,'rgba(0,0,0,.6)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.arc(s.x,s.y,s.r+16,0,TAU);c.fill();
  c.save();c.beginPath();c.arc(s.x,s.y,s.r,0,TAU);c.clip();const m=c.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r);m.addColorStop(0,'#ffe27a');m.addColorStop(.35,'#ff9a2a');m.addColorStop(.75,'#c8360c');m.addColorStop(1,'#4a0f05');c.fillStyle=m;c.fillRect(s.x-s.r,s.y-s.r,s.r*2,s.r*2);
  for(let i=0;i<30;i++){const a=R()*TAU,rr=R()*s.r,x=s.x+Math.cos(a)*rr,y=s.y+Math.sin(a)*rr,sz=3+R()*s.r*.28;c.fillStyle=`rgba(${30+R()*30|0},${15+R()*10|0},10,${.55+R()*.35})`;c.beginPath();for(let k=0;k<7;k++){const aa=k/7*TAU;c.lineTo(x+Math.cos(aa)*sz*(.6+R()*.5),y+Math.sin(aa)*sz*(.6+R()*.5))}c.fill()}
  c.restore();for(let i=0;i<22;i++){const a=i/22*TAU+R()*.2;disc(c,s.x+Math.cos(a)*(s.r+3),s.y+Math.sin(a)*(s.r+3),3+R()*3,'#3a3632')}
  c.strokeStyle='rgba(225,180,40,.4)';c.setLineDash([8,7]);c.lineWidth=2.5;c.beginPath();c.arc(s.x,s.y,s.r+14,0,TAU);c.stroke();c.setLineDash([])}
 // walls baked
 for(const w of G.walls.filter(w=>!w.crate))drawWall(c,w,R);
 // overhead light pools + vignette
 c.globalCompositeOperation='soft-light';for(let i=0;i<6;i++){const x=W*(.17+.33*(i%3)),y=H*(i<3?.28:.72),g=c.createRadialGradient(x,y,0,x,y,330);g.addColorStop(0,'rgba(255,240,215,.5)');g.addColorStop(1,'rgba(255,240,215,0)');c.fillStyle=g;c.fillRect(0,0,W,H)}
 c.globalCompositeOperation='multiply';const vg=c.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.hypot(W,H)*.62);vg.addColorStop(0,'#fff');vg.addColorStop(1,'#4a4a52');c.fillStyle=vg;c.fillRect(0,0,W,H);c.globalCompositeOperation='source-over';
 return cv;
}
function drawWall(c,w,R){
 c.save();c.shadowColor='rgba(0,0,0,.75)';c.shadowBlur=16;c.shadowOffsetX=7*FS;c.shadowOffsetY=10*FS;c.fillStyle='#000';c.fillRect(w.x,w.y,w.w,w.h);c.restore();
 const p=new Path2D();p.rect(w.x,w.y,w.w,w.h);
 const g=c.createLinearGradient(w.x,w.y,w.x+w.w,w.y+w.h);g.addColorStop(0,'#8a8780');g.addColorStop(1,'#5c5a55');c.fillStyle=g;c.fill(p);
 c.save();c.clip(p);c.globalCompositeOperation='overlay';c.globalAlpha=.55;c.fillStyle=grain(c);c.fillRect(w.x,w.y,w.w,w.h);c.globalAlpha=1;c.globalCompositeOperation='source-over';
 for(let i=0;i<Math.max(3,w.w*w.h/900);i++){const x=w.x+R()*w.w,y=w.y+R()*w.h,r=2+R()*7;c.fillStyle=`rgba(${R()<.5?20:60},${R()<.5?20:55},20,${R()*.18})`;c.beginPath();c.arc(x,y,r,0,TAU);c.fill()}
 // hazard ends
 const long=w.w>w.h;c.save();c.beginPath();if(long){c.rect(w.x,w.y,10,w.h);c.rect(w.x+w.w-10,w.y,10,w.h)}else{c.rect(w.x,w.y,w.w,10);c.rect(w.x,w.y+w.h-10,w.w,10)}c.clip();c.fillStyle='rgba(210,165,30,.75)';c.fillRect(w.x,w.y,w.w,w.h);c.strokeStyle='rgba(20,20,20,.85)';c.lineWidth=4;for(let i=-60;i<w.w+w.h+60;i+=10){c.beginPath();c.moveTo(w.x+i,w.y);c.lineTo(w.x+i-30,w.y+30+w.h);c.stroke()}c.restore();
 c.globalCompositeOperation='destination-out';c.restore();
 // bevel
 c.fillStyle='rgba(255,255,255,.22)';c.fillRect(w.x,w.y,w.w,2);c.fillRect(w.x,w.y,2,w.h);c.fillStyle='rgba(0,0,0,.4)';c.fillRect(w.x,w.y+w.h-2.5,w.w,2.5);c.fillRect(w.x+w.w-2.5,w.y,2.5,w.h);
 c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=1;c.strokeRect(w.x+.5,w.y+.5,w.w-1,w.h-1);
 // steel caps & bolts
 const inset=5;for(const [x,y] of [[w.x+inset,w.y+inset],[w.x+w.w-inset,w.y+inset],[w.x+inset,w.y+w.h-inset],[w.x+w.w-inset,w.y+w.h-inset]])rivet(c,x,y,1.6);
 if(long&&w.w>80)for(let x=w.x+40;x<w.x+w.w-20;x+=40){c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x,w.y+2,1.2,w.h-4)}
 if(!long&&w.h>80)for(let y=w.y+40;y<w.y+w.h-20;y+=40){c.fillStyle='rgba(0,0,0,.35)';c.fillRect(w.x+2,y,w.w-4,1.2)}
}
let CRATE=null;
function crateSprite(){if(CRATE)return CRATE;const pad=16,s=40,cv=mkCanvas((s+pad*2)*HS,(s+pad*2)*HS),c=cv.getContext('2d');c.setTransform(HS,0,0,HS,pad*HS,pad*HS);
 c.save();c.shadowColor='rgba(0,0,0,.75)';c.shadowBlur=10*HS;c.shadowOffsetX=6*HS;c.shadowOffsetY=8*HS;c.fillStyle='#000';c.fillRect(1,1,s-2,s-2);c.restore();
 const p=box(c,0,0,s,s,'#4f5a3a',2);c.save();c.clip(p);c.globalCompositeOperation='overlay';c.globalAlpha=.4;c.fillStyle=grain(c);c.fillRect(0,0,s,s);c.restore();
 for(let x=7;x<s;x+=6.5){c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x,4,1.6,s-8);c.fillStyle='rgba(255,255,255,.12)';c.fillRect(x+1.6,4,.6,s-8)}
 for(const [x,y] of [[0,0],[s-7,0],[0,s-7],[s-7,s-7]]){box(c,x,y,7,7,'#3a3f45',1);rivet(c,x+3.5,y+3.5,1)}
 c.fillStyle='rgba(230,220,180,.55)';c.font='700 6px monospace';c.textAlign='center';c.fillText('AMMO',s/2,s/2+2);
 c.strokeStyle='rgba(200,205,210,.35)';c.lineWidth=.4;for(let i=0;i<10;i++){const x=Math.random()*s,y=Math.random()*s;c.beginPath();c.moveTo(x,y);c.lineTo(x+rnd(-3,3),y+rnd(-3,3));c.stroke()}
 CRATE={cv,pad,s};return CRATE}
