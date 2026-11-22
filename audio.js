'use strict';
// ================= procedural sound =================
const SND={ctx:null,master:null,on:true,last:{},noise:null,comp:null};
try{SND.on=localStorage.getItem('botarena_sound')!=='0'}catch(e){}
function audioInit(){if(SND.ctx)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;SND.ctx=new C();
 SND.comp=SND.ctx.createDynamicsCompressor();SND.comp.threshold.value=-18;SND.comp.ratio.value=6;SND.master=SND.ctx.createGain();SND.master.gain.value=SND.on?.55:0;SND.master.connect(SND.comp);SND.comp.connect(SND.ctx.destination);
 const len=SND.ctx.sampleRate*1.5,buf=SND.ctx.createBuffer(1,len,SND.ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;SND.noise=buf}catch(e){SND.ctx=null}}
addEventListener('pointerdown',()=>{audioInit();if(SND.ctx&&SND.ctx.state==='suspended')SND.ctx.resume().catch(()=>{})},{capture:true});
function setSound(on){SND.on=on;try{localStorage.setItem('botarena_sound',on?'1':'0')}catch(e){}if(SND.master)SND.master.gain.value=on?.55:0;$$('.sndBtn').forEach(b=>b.textContent=on?'🔊':'🔇')}
function env(g,t,a,peak,d){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+d)}
function noiseSrc(t,dur,type,freq,q=1){const c=SND.ctx,s=c.createBufferSource();s.buffer=SND.noise;s.playbackRate.value=rnd(.8,1.2);const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;s.connect(f);s.start(t,Math.random()*.5,dur+.05);return f}
function osc(t,dur,type,f0,f1){const o=SND.ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);o.start(t);o.stop(t+dur+.05);return o}
function out(node,vol,pan){const c=SND.ctx,g=c.createGain();g.gain.value=vol;node.connect(g);if(c.createStereoPanner&&pan){const p=c.createStereoPanner();p.pan.value=clamp(pan,-1,1);g.connect(p);p.connect(SND.master)}else g.connect(SND.master);return g}
// x: world position for panning/attenuation (optional)
function sfx(name,x,y,vol=1){
 if(!SND.ctx||!SND.on)return;const c=SND.ctx,t=c.currentTime,min={gun:.045,small:.05,laser:.09,flame:.12,hit:.04,clank:.06,zap:.08,boom:.05,big:.08,rocket:.06,thump:.08}[name]??.03;
 if(SND.last[name]&&t-SND.last[name]<min)return;SND.last[name]=t;
 let pan=0;if(x!=null&&typeof G!=='undefined'&&G&&G.cam){pan=(x-G.cam.cx)/(G.W*.6);const d=Math.hypot(x-G.cam.cx,y-G.cam.cy);vol*=clamp(1.3-d/900,.35,1)}
 const g=(node,v,a,d)=>{const gg=out(node,1,pan);env(gg,t,a,v*vol,d)};
 switch(name){
  case 'gun':g(noiseSrc(t,.06,'bandpass',rnd(1800,2600),.8),.35,.002,.05);g(osc(t,.05,'square',rnd(160,200),60),.08,.002,.04);break;
  case 'small':g(noiseSrc(t,.05,'highpass',3000),.25,.002,.04);break;
  case 'heavy':g(noiseSrc(t,.25,'lowpass',900),.7,.003,.22);g(osc(t,.25,'sine',120,40),.6,.003,.22);break;
  case 'shotgun':g(noiseSrc(t,.25,'lowpass',2200),.7,.002,.2);g(osc(t,.15,'sine',90,40),.4,.002,.12);break;
  case 'laser':g(osc(t,.12,'sawtooth',rnd(900,1100),rnd(600,700)),.06,.005,.1);break;
  case 'pulse':g(osc(t,.15,'square',rnd(700,800),220),.12,.003,.13);break;
  case 'zap':{const o=osc(t,.18,'square',rnd(80,140));g(o,.15,.002,.16);g(noiseSrc(t,.18,'highpass',4000),.2,.002,.15);break}
  case 'rail':g(osc(t,.35,'sawtooth',2400,90),.25,.002,.33);g(noiseSrc(t,.4,'bandpass',1500,.5),.5,.002,.35);g(osc(t,.3,'sine',70,30),.5,.002,.28);break;
  case 'charge':g(osc(t,.5,'sine',300,1800),.06,.05,.4);break;
  case 'rocket':g(noiseSrc(t,.45,'bandpass',900,.7),.35,.02,.4);break;
  case 'thump':g(osc(t,.2,'sine',150,45),.5,.002,.18);g(noiseSrc(t,.12,'lowpass',600),.4,.002,.1);break;
  case 'flame':g(noiseSrc(t,.2,'bandpass',700,.4),.18,.03,.15);break;
  case 'boom':g(noiseSrc(t,.9,'lowpass',700),.9,.005,.8);g(osc(t,.6,'sine',90,28),.8,.005,.55);break;
  case 'big':g(noiseSrc(t,1.6,'lowpass',500),1,.005,1.5);g(osc(t,1.1,'sine',70,22),1,.005,1);g(noiseSrc(t,.4,'highpass',2000),.3,.002,.3);break;
  case 'hit':g(noiseSrc(t,.04,'bandpass',rnd(3000,4500),2),.18,.001,.03);break;
  case 'clank':g(osc(t,.15,'square',rnd(320,380),rnd(200,260)),.12,.001,.13);g(osc(t,.15,'square',rnd(510,560)),.08,.001,.1);g(noiseSrc(t,.08,'highpass',2500),.3,.001,.06);break;
  case 'saw':g(osc(t,.12,'sawtooth',rnd(280,330)),.08,.005,.1);g(noiseSrc(t,.1,'highpass',5000),.12,.002,.08);break;
  case 'emp':g(osc(t,.6,'sine',1200,60),.35,.002,.55);g(noiseSrc(t,.5,'bandpass',300,.5),.4,.01,.45);break;
  case 'dash':g(noiseSrc(t,.3,'bandpass',1200,.6),.35,.02,.25);break;
  case 'pickup':g(osc(t,.08,'triangle',660),.2,.002,.07);g(osc(t+.08,.12,'triangle',990),.2,.002,.1);break;
  case 'click':g(osc(t,.04,'square',1200,900),.05,.001,.03);break;
  case 'buy':g(osc(t,.06,'triangle',880),.15,.002,.05);g(osc(t+.06,.12,'triangle',1320),.15,.002,.1);break;
  case 'win':[523,659,784,1046].forEach((f,i)=>{const o=SND.ctx.createOscillator();o.type='triangle';o.frequency.value=f;o.start(t+i*.13);o.stop(t+i*.13+.4);const gg=out(o,1,0);env(gg,t+i*.13,.01,.22,.35)});break;
  case 'lose':[392,330,262,196].forEach((f,i)=>{const o=SND.ctx.createOscillator();o.type='sawtooth';o.frequency.value=f;o.start(t+i*.18);o.stop(t+i*.18+.4);const gg=out(o,1,0);env(gg,t+i*.18,.01,.08,.35)});break;
  case 'horn':{const o=osc(t,.9,'sawtooth',220,215);g(o,.18,.04,.85);const o2=osc(t,.9,'sawtooth',277,275);g(o2,.12,.04,.85);break}
  case 'siren':g(osc(t,.7,'sine',600,1100),.12,.05,.6);break;
  case 'level':[660,880,1100].forEach((f,i)=>{const o=SND.ctx.createOscillator();o.type='square';o.frequency.value=f;o.start(t+i*.09);o.stop(t+i*.09+.15);const gg=out(o,1,0);env(gg,t+i*.09,.005,.07,.12)});break;
 }
}
const WSND={lmg:'gun',minigun:'gun',needle:'small',pulse:'pulse',autocannon:'heavy',cannon:'heavy',shotgun:'shotgun',laser:'laser',lance:'laser',rockets:'rocket',microm:'rocket',missiles:'rocket',grenade:'thump',mortar:'thump',flamer:'flame',torch:'flame',inferno:'flame',tesla:'zap',rail:'rail',smg:'gun',gatling:'gun',sawnoff:'shotgun',dart:'pulse',cryo:'pulse',plasma:'heavy',flak:'shotgun',gauss:'rail',ion:'laser'};
