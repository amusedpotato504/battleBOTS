'use strict';
// ================= navigation =================
let TAB='career';
function show(tab){TAB=tab;$$('.screen').forEach(s=>s.classList.remove('on'));$('#'+tab).classList.add('on');$('#nav').style.display='';$('#topbar').style.display='';
 $$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));refreshTop();({career:renderCareer,garage:renderGarage,shop:renderShop,records:renderRecords}[tab]||(()=>0))();$('#'+tab).scrollTop=0}
$$('#nav button').forEach(b=>b.onclick=()=>show(b.dataset.tab));
function refreshTop(){$('#tTeam').innerHTML=`${esc(S.team)}<small>${LEAGUES[S.league].n}${S.crowned?' · ♛×'+S.crowned:''}</small>`;$('#tCred').textContent='¢ '+fmt(S.credits)}
function openSheet(html,center){const m=center?$('#dlgM'):$('#sheetM'),b=center?$('#dlg'):$('#sheet');b.innerHTML=html;m.classList.add('on');b.scrollTop=0;return b}
function closeSheet(){$('#sheetM').classList.remove('on')}
function closeDlg(){$('#dlgM').classList.remove('on')}
$('#sheetM').onclick=e=>{if(e.target.id==='sheetM')closeSheet()};
function sheetHead(title,sub=''){return `<div class="sheet-h"><div class="grow">${sub?`<div class="eyebrow">${sub}</div>`:''}<h3>${title}</h3></div><button class="btn small ghost" onclick="closeSheet()">✕</button></div>`}
function confirmBox(title,msg,yes,fn){openSheet(`<h3>${esc(title)}</h3><p class="dim small" style="margin:8px 0 14px">${msg}</p><div class="row"><button class="btn grow" id="cNo">Cancel</button><button class="btn danger grow" id="cYes">${esc(yes)}</button></div>`,true);
 $('#cNo').onclick=closeDlg;$('#cYes').onclick=()=>{closeDlg();fn()}}
function toast(msg){const d=document.createElement('div');d.className='toast';d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),2200)}
function rankHtml(rep){const r=rankOf(rep);return `<span class="rank" style="color:${r[2]}">${r[1]}</span>`}
function afterPaint(fn){requestAnimationFrame(()=>requestAnimationFrame(fn))}
const statLine=o=>`${Math.round(o.hp)} HP · ${Math.round(o.dps)} DPS · ${Math.round(o.speed)} SPD`;

// ================= menu (help, sound, saves) =================
function openMenu(){const b=openSheet(sheetHead('Menu')+`<div class="menu">
 <button data-m="help"><span>?</span>How to play</button>
 <button data-m="tour"><span>▶</span>Replay intro tour</button>
 <button data-m="snd"><span>${SND.on?'🔊':'🔇'}</span>Sound ${SND.on?'on':'off'}</button>
 <button data-m="exp"><span>⇪</span>Export save code</button>
 <button data-m="imp"><span>⇩</span>Import save code</button>
 <button data-m="reset" class="danger"><span>✖</span>Abandon career</button></div>`);
 const act={help:()=>openHelp(),tour:()=>{closeSheet();showTutorial(0)},snd:()=>{audioInit();setSound(!SND.on);openMenu()},exp:()=>{closeSheet();exportSave()},imp:()=>{closeSheet();importSave()},
  reset:()=>{closeSheet();confirmBox('Abandon career?','Deletes your team, bots, parts and records. This cannot be undone.','Delete everything',()=>{try{localStorage.removeItem(SAVE_KEY)}catch(e){}S=null;showIntro()})}};
 b.querySelectorAll('[data-m]').forEach(el=>el.onclick=()=>act[el.dataset.m]())}
$('#menuBtn').onclick=openMenu;

// ================= career hub =================
let PENDING=null;
function renderCareer(){
 const L=LEAGUES[S.league],opp=opponentFor(S.league,S.ladder),rv=S.rivals[opp],avg=Math.round(rv.bots.reduce((a,b)=>a+b.rep,0)/rv.bots.length);
 const ready=S.bots.filter(b=>compute(b).ok).length,purse=matchPurse({li:S.league,ladder:S.ladder,exh:false}),step=nextSteps()[0];
 $('#careerBody').innerHTML=`
 ${step?`<button class="hint" data-go="${step[3]}"><span class="si">${step[0]}</span><span class="grow">${step[1]}</span><span class="dim">›</span></button>`:''}
 <div class="card hero">
  <div class="eyebrow">League ${S.league+1} of 5${S.crowned?' · defending crown':''}</div>
  <h2>${L.n}</h2>
  <div class="prog">${[0,1,2,3,4].map(i=>`<i class="${i<S.ladder?'done':i===S.ladder?'cur':''}${i===4?' fin':''}"></i>`).join('')}</div>
  <div class="eyebrow">${S.ladder>=4?'♛ Championship final':'Match '+(S.ladder+1)+' of 4'}</div>
  <div class="vs"><span class="dim">vs</span> <b>${esc(opp)}</b> ${rankHtml(avg)}</div>
  <div class="dim small">Win ¢${fmt(purse)} · ${L.sq} bots per side</div>
  <button class="btn primary big" id="prepBtn" ${ready?'':'disabled'}>Prepare match</button>
  ${ready?'<button class="link" id="exhBtn">Exhibition match · half pay</button>':'<div class="warnline" style="margin-top:10px">No bot is battle-ready yet. Fix one in the Garage.</div>'}
 </div>`;
 $$('#careerBody [data-go]').forEach(b=>b.onclick=()=>{if(b.dataset.go==='shop')SHOPTAB=b.textContent.includes('unused')?'mine':'market';show(b.dataset.go)});
 $('#prepBtn').onclick=()=>prepMatch(false);if($('#exhBtn'))$('#exhBtn').onclick=()=>prepMatch(true);
}
function matchPurse(P){const L=LEAGUES[P.li];let p=L.purse*(1+.15*P.ladder)*(P.ladder>=4&&!P.exh?1.6:1)*(1+(P.li===4?.15*S.crowned:0));if(P.exh)p*=.5;return Math.round(p)}
function teamPower(units){let hp=0,dps=0;for(const u of units){hp+=u.o.hp;dps+=u.o.dps}return Math.sqrt(hp*dps)}
function wagerOdds(P){const mine=P.sel.map(id=>({o:compute(S.bots.find(b=>b.id===id))}));if(!mine.length)return 2;const r=teamPower(P.enemies)/Math.max(1,teamPower(mine));return Math.round(clamp(1.5*r+.4,1.2,4)*100)/100}
function nemesisOf(team,name){return S.bots.filter(b=>S.nemesis[b.id]&&S.nemesis[b.id].team===team&&S.nemesis[b.id].name===name)}
const HZNAME={slag:'Slag pits',saw:'Floor saws',ice:'Ice'};
function arenaHazards(M){return [...new Set(M.hz.map(h=>h[0]))].map(h=>HZNAME[h]).join(' · ')}
function prepMatch(exh){
 const li=S.league,L=LEAGUES[li],team=exh?pick(L.teams.filter(t=>t!==opponentFor(li,S.ladder))):opponentFor(li,S.ladder);
 PENDING={exh,li,ladder:S.ladder,team,map:pick(Object.keys(MAPS)),enemies:enemySquad(team,li,S.ladder,exh),sel:[],mod:Math.random()<.6?pick(Object.keys(MODIFIERS)):null,bounty:pick(Object.keys(BOUNTIES)),bet:0};
 PENDING.sel=S.bots.filter(b=>compute(b).ok).sort((a,b)=>b.rep-a.rep).slice(0,L.sq).map(b=>b.id);
 renderPrep();
}
function renderPrep(){
 const P=PENDING,L=LEAGUES[P.li],M=MAPS[P.map],purse=matchPurse(P),odds=wagerOdds(P),bReward=Math.round(purse*.4);
 const cap=Math.min(S.credits,purse*3),bets=[0,.1,.25,.5].map(f=>Math.round(cap*f/10)*10);if(!bets.includes(P.bet))P.bet=0;
 const b=openSheet(sheetHead('vs '+esc(P.team),`${P.exh?'Exhibition':P.ladder>=4?'Final':'Match '+(P.ladder+1)} · win ¢${fmt(purse)}`)+`
 <div class="conds">
  <div class="cond"><b>▦ ${M.n}</b><span>${arenaHazards(M)||'No hazards'}</span></div>
  ${P.mod?`<div class="cond mod"><b>${MODIFIERS[P.mod].i} ${MODIFIERS[P.mod].n}</b><span>${MODIFIERS[P.mod].d}</span></div>`:''}
  <div class="cond bty"><b>◆ ${BOUNTIES[P.bounty].n} · +¢${fmt(bReward)}</b><span>${BOUNTIES[P.bounty].d}</span></div>
 </div>
 <div class="sect">Your squad <span class="mono amber">${P.sel.length}/${L.sq}</span></div>
 ${S.bots.map(bt=>{const o=compute(bt),on=P.sel.includes(bt.id),nm=S.nemesis[bt.id];return `<button class="pick ${on?'on':''} ${o.ok?'':'bad'}" data-id="${bt.id}"><div class="check">${on?'✓':''}</div><canvas data-b="${bt.id}"></canvas><div class="grow"><div><b>${esc(bt.name)}</b> ${rankHtml(bt.rep)}</div>${o.ok?`<div class="small dim">${statLine(o)}</div>`:`<div class="warnline">${esc(o.warn[0])}</div>`}${nm&&nm.team===P.team?`<div class="nem">☠ Revenge vs ${esc(nm.name)}</div>`:''}</div></button>`}).join('')}
 <div class="sect">Opponents</div>
 <div class="foes">${P.enemies.map((e,i)=>{const nv=nemesisOf(P.team,e.rb.name);return `<div class="foe"><canvas data-e="${i}"></canvas><div class="grow"><div><b>${esc(e.rb.name)}</b> ${rankHtml(e.rb.rep)}</div><div class="small dim">${Math.round(e.o.hp)} HP · ${Math.round(e.o.dps)} DPS</div>${nv.length?`<div class="nem">☠ Your nemesis</div>`:''}</div></div>`}).join('')}</div>
 <div class="sect">Side bet <span class="mono amber">pays ×${odds}</span></div>
 <div class="chips">${bets.map((v,i)=>`<button class="chip ${P.bet===v?'on':''}" data-bet="${v}" ${i&&v<10?'disabled':''}>${v?'¢'+fmt(v):'No bet'}</button>`).join('')}</div>
 <button class="btn primary big" id="goBtn" ${P.sel.length?'':'disabled'}>Enter the arena</button>`);
 const keep=fn=>{const y=$('#sheet').scrollTop;fn();renderPrep();$('#sheet').scrollTop=y};
 b.querySelectorAll('.pick').forEach(el=>el.onclick=()=>{const id=el.dataset.id,bt=S.bots.find(x=>x.id===id);if(!compute(bt).ok)return toast('That bot is not battle-ready');
  const i=P.sel.indexOf(id);if(i<0&&P.sel.length>=L.sq)return toast(`Max ${L.sq} bots in ${L.n}`);keep(()=>{if(i>=0)P.sel.splice(i,1);else P.sel.push(id)})});
 b.querySelectorAll('[data-bet]').forEach(el=>el.onclick=()=>keep(()=>{P.bet=+el.dataset.bet}));
 $('#goBtn').onclick=launch;
 afterPaint(()=>{b.querySelectorAll('canvas[data-b]').forEach(c=>previewBot(c,S.bots.find(x=>x.id===c.dataset.b),S.inv,{zoom:1.15}));b.querySelectorAll('canvas[data-e]').forEach(c=>{const e=P.enemies[+c.dataset.e];previewBot(c,e.design,e.inv,{zoom:1.15,angle:Math.PI/2})})});
}
function launch(){
 const P=PENDING;closeSheet();P.odds=wagerOdds(P);if(P.bet>S.credits)P.bet=0;
 const p=P.sel.map(id=>{const b=S.bots.find(x=>x.id===id);return {design:b,inv:S.inv,rec:b}});
 const e=P.enemies.map(x=>({design:x.design,inv:x.inv,rec:x.rb,o:x.o}));
 startBattle({p,e,map:P.map,mods:P.mod?[P.mod]:[],eTeam:P.team,title:P.ladder>=4&&!P.exh?'FINAL':'FIGHT',onEnd:finishMatch});
}
// ================= results =================
function evalBounty(k,Gm,win,mvp){const my=Gm.bots.filter(u=>u.team===0),en=Gm.bots.filter(u=>u.team===1),alive=my.filter(u=>!u.dead);
 switch(k){case 'flawless':return win&&alive.length===my.length;case 'quick':return win&&Gm.t<40;case 'mvp':return mvp.team===0;case 'lone':return win&&alive.length===1;case 'dominant':return win&&alive.every(u=>u.hp/u.maxHp>.5);
  case 'giant':{const star=en.reduce((a,b)=>b.rep>a.rep?b:a);return star.dead&&star.killedBy&&star.killedBy.team===0}}return false}
function finishMatch(Gm){
 const P=PENDING,L=LEAGUES[P.li],win=Gm.winner===0&&!Gm.forfeit;
 const mvp=Gm.bots.reduce((a,b)=>(b.st.dmg+b.st.kills.length*60)>(a.st.dmg+a.st.kills.length*60)?b:a);
 const fm=fame(),full=matchPurse(P);
 const purse=Math.round(full*(win?1:.25)),sponsor=win?Math.round(purse*Math.min(1,fm/3000)):0;
 const bountyOk=!Gm.forfeit&&evalBounty(P.bounty,Gm,win,mvp),bountyCr=bountyOk?Math.round(full*.4):0;if(bountyOk)S.stats.bounties++;
 const wager=P.bet?(win?Math.round(P.bet*(P.odds-1)):-P.bet):0;S.stats.wagerNet+=wager;
 let repair=0;const rows=[];
 for(const u of Gm.bots){
  const rec=u.rec,before=rec.rep,won=(u.team===Gm.winner);
  let g=(won?10:3)+u.st.kills.reduce((a,v)=>a+8+.06*v.rep,0)+u.st.dmg/45+(u===mvp?15:0)+(won&&!u.dead?4:0)-(u.dead?5:0)+(u.team===0&&bountyOk?8:0)+(u.st.revenge?25:0);
  g*=L.repMul*(P.exh?.5:1)*(u.pk&&u.pk.has('showman')?1.25:1);g=Math.round(g);rec.rep=Math.max(0,rec.rep+g);
  const s=rec.st;s.m++;if(won){s.w++;s.streak=(s.streak||0)+1;s.best=Math.max(s.best||0,s.streak)}else s.streak=0;s.k+=u.st.kills.length;s.d+=u.dead?1:0;s.dmg+=Math.round(u.st.dmg);if(u===mvp)s.mvp++;
  if(u.team===0){const ep0=epithet({st:{...s,k:s.k-u.st.kills.length}});rec.hist=(rec.hist||[]).concat([{vs:P.team,win:won,k:u.st.kills.length,dmg:Math.round(u.st.dmg),rep:g}]).slice(-12);
   let cost=Math.round(u.o.value*(u.dead?.12:.1*(1-Math.max(0,u.hp)/u.maxHp)));if(u.pk&&u.pk.has('thrifty'))cost=Math.round(cost*.65);repair+=cost;
   let rv='';if(u.st.revenge){delete S.nemesis[rec.id];S.stats.revenge++;rv='revenge'}
   let nem='';if(u.dead&&u.killedBy&&u.killedBy.team===1&&!Gm.forfeit){S.nemesis[rec.id]={name:u.killedBy.name,team:P.team};nem=u.killedBy.name}
   const ru=rankIdx(rec.rep)>rankIdx(before);
   rows.push({u,g,before,after:rec.rep,cost,rankUp:ru,ep:epithet(rec)!==ep0?epithet(rec):'',rv,nem})}
  else rows.push({u,g,before,after:rec.rep})}
 let net=purse+sponsor+bountyCr+wager-repair;S.credits=Math.max(0,S.credits+net);
 let headline='';
 if(!P.exh&&win){if(P.ladder>=4){S.trophies.push({n:L.n+(P.li===4&&S.crowned?' (defense #'+S.crowned+')':''),m:S.matches});
   Gm.bots.filter(u=>u.team===0).forEach(u=>u.rec.titles.push(L.n+' Champion'));
   if(P.li<4){S.unlocked=Math.max(S.unlocked,P.li+1);S.league=P.li+1;headline=`${L.n} conquered! ${LEAGUES[P.li+1].n} unlocked, with new parts.`}else{S.crowned++;headline=S.crowned===1?'GRAND CHAMPIONS! Now defend the crown.':`Crown defended (${S.crowned})!`}
   S.ladder=0}else S.ladder++}
 if(Gm.forfeit)headline='Forfeited.';
 S.matches++;S.log.unshift({win,vs:P.team,lg:L.n+(P.exh?' exhibition':''),net});S.log=S.log.slice(0,30);refreshMarket();persist();
 sfx(win?'win':'lose');if(rows.some(r=>r.rankUp))setTimeout(()=>sfx('level'),900);
 const my=rows.filter(r=>r.u.team===0);
 const line=r=>`<tr class="${r.u.dead?'ko':''}"><td>${esc(r.u.name)}${r.u===mvp?'<span class="badge">MVP</span>':''}${r.rankUp?`<span class="badge">▲ ${rankOf(r.after)[1]}</span>`:''}${r.ep?`<span class="badge">"${esc(r.ep)}"</span>`:''}${r.rv?'<span class="badge" style="color:var(--teal)">Revenge</span>':''}${r.nem?`<div class="nem">☠ Nemesis: ${esc(r.nem)}</div>`:''}</td><td>${r.u.st.kills.length}</td><td class="${r.g>=0?'up':'down'}">${r.g>=0?'+':''}${r.g}</td></tr>`;
 const m=(k,v,cls='')=>`<span>${k}</span><b class="${cls}">${v}</b>`;
 openSheet(`<div class="res-h" style="color:${win?'var(--teal)':'var(--red)'}">${win?'VICTORY':'DEFEAT'}</div>
 <div class="dim small" style="text-align:center">vs ${esc(P.team)} · ${MAPS[P.map].n} · ${Math.floor(Gm.t)}s</div>
 ${headline?`<div class="trophy" style="margin-top:10px;text-align:center">${esc(headline)}</div>`:''}
 <div class="money">${m(win?'Purse':'Appearance fee','+'+fmt(purse+sponsor)+'¢')}${bountyOk?m('Bounty ✓','+'+fmt(bountyCr)+'¢','up'):''}${P.bet?m('Side bet',(wager>=0?'+':'−')+fmt(Math.abs(wager))+'¢',wager>=0?'up':'down'):''}${m('Repairs','−'+fmt(repair)+'¢','down')}<span class="tot">Net</span><b class="tot ${net>=0?'up':'down'}">${net>=0?'+':''}${fmt(net)}¢</b></div>
 <table class="t"><tr><th>Bot</th><th>KO</th><th>Rep</th></tr>${my.map(line).join('')}</table>
 ${my.some(r=>r.rankUp)?'<div class="small" style="color:var(--amber);margin-top:8px">New perk points are waiting in the Garage.</div>':''}
 <button class="btn primary big" id="contBtn">Continue</button>`,true);
 $('#contBtn').onclick=()=>{closeDlg();endBattle();show('career')};
}

// ================= garage =================
function renderGarage(){
 $('#garageBody').innerHTML=`<div class="row"><h2 class="grow">Garage</h2><button class="btn small" id="testBtn">⌖ Test range</button></div>
 <div class="bots" style="margin-top:12px">${S.bots.map(b=>{const o=compute(b),pp=perkPts(b);return `<button class="card bot" data-id="${b.id}"><canvas data-b="${b.id}"></canvas><div class="grow">
  <div class="nm">${esc(b.name)}</div><div>${rankHtml(b.rep)}${pp?` <span class="dotn" title="Perk points">${pp}</span>`:''}</div>
  ${o.ok?`<div class="ln">${statLine(o)}</div>`:`<div class="warnline">${esc(o.warn[0])}</div>`}</div><span class="dim">›</span></button>`}).join('')}
 ${S.bots.length<8?'<button class="card bot add" id="newBot">+ New bot</button>':''}</div>`;
 $('#testBtn').onclick=openTestRange;
 $$('#garageBody .bot[data-id]').forEach(el=>el.onclick=()=>openBuilder(el.dataset.id));
 if($('#newBot'))$('#newBot').onclick=()=>{const used=new Set(S.bots.map(b=>b.name));const nm=pick(['Talon','Bastion','Comet','Wrench','Pike','Halo','Nova','Gizmo','Atlas','Echo','Blitz','Rook II','Ferrum','Hammerhead','Ratchet','Sprocket','Tycho','Volt'].filter(n=>!used.has(n)))||'Unit';
  const b=mkBot(nm,{p:pick(PAINTS),s:pick(PAINTS),fin:pick(Object.keys(FINISHES)),num:(Math.random()*99|0)+1});S.bots.push(b);persist();openBuilder(b.id)};
 afterPaint(()=>$$('#garageBody canvas[data-b]').forEach(c=>previewBot(c,S.bots.find(x=>x.id===c.dataset.b),S.inv,{zoom:1.12})));
}
// ================= builder =================
let BB=null,bAnim=0;
function openBuilder(id){BB=S.bots.find(b=>b.id===id);$('#builder').classList.add('on');renderBuilder();const g=++bAnim;let t0=performance.now();
 const tick=now=>{if(g!==bAnim||!$('#builder').classList.contains('on'))return;const t=(now-t0)/1000,c=$('#bPrev');if(c&&BB&&BB.frame){previewBot(c,BB,S.inv,{angle:-Math.PI/2+Math.sin(t*.35)*.5,aim:-Math.PI/2+Math.sin(t*.9)*.7,ph:t*2,t,zoom:1.6,floor:1})}requestAnimationFrame(tick)};requestAnimationFrame(tick)}
function closeBuilder(){$('#builder').classList.remove('on');bAnim++;BB=null;persist();renderGarage();refreshTop()}
let BTAB='loadout';
function slotRow(label,id,key,idx){const p=id&&S.inv[id];return `<button class="slot ${p?'':'empty'}" data-k="${key}" data-i="${idx??''}"><canvas data-p="${p?p.id:''}"></canvas><div class="grow"><div class="lbl">${label}</div><div class="pn" style="${p&&p.t>1?'color:'+TIERS[p.t].col:''}">${p?esc(partName(p)):'Empty · tap to add'}</div>${p?partBrief(p):''}</div><span class="dim">›</span></button>`}
function renderBuilder(){
 const b=BB,o=compute(b),F=o.F,ep=epithet(b),y=$('#builder').scrollTop,pts=perkPts(b);
 const tile=(k,v)=>`<div><b>${v}</b><span>${k}</span></div>`;
 const meter=(lbl,a,bv)=>{const r=bv?a/bv:0;return `<div class="meter"><div class="k"><span>${lbl}</span><b>${Math.round(a)}/${Math.round(bv)}</b></div><div class="bar ${r>1?'over':r>.9?'warn':''}"><i style="width:${Math.min(100,r*100)}%"></i></div></div>`};
 const tabs=[['loadout','Loadout'],['tactics','Tactics'],['perks','Perks'+(pts?` <span class="dotn">${pts}</span>`:'')],['paint','Paint']];
 let body='';
 if(BTAB==='loadout'){body=`${slotRow('Frame',b.frame,'frame')}${slotRow('Drive',b.drive,'drive')}${slotRow('Power core',b.core,'core')}${slotRow('Armor',b.armor,'armor')}${slotRow('AI chip',b.chip,'chip')}
  ${F?`<div class="sect">Weapons</div>${F.mounts.map((m,i)=>slotRow(szBadge(m[0])+' Mount '+(i+1),b.weps[i],'weps',i)).join('')}
  <div class="sect">Modules</div>${Array.from({length:F.util},(_,i)=>slotRow('Bay '+(i+1),b.utils[i],'utils',i)).join('')}`:'<div class="empty" style="margin-top:10px">Pick a frame first. It sets how many weapons and modules fit.</div>'}`}
 else if(BTAB==='tactics'){body=`<div class="sect" style="margin-top:0">Movement</div><div class="optgrid">${Object.entries(BEHAVIORS).map(([k,v])=>`<button class="opt ${b.ai.beh===k?'on':''}" data-beh="${k}"><b>${v.n}</b><small>${v.d}</small></button>`).join('')}</div>
  <div class="sect">Targets</div><div class="optgrid">${Object.entries(TARGETS).map(([k,v])=>`<button class="opt ${b.ai.tgt===k?'on':''}" data-tgt="${k}"><b>${v.n}</b><small>${v.d}</small></button>`).join('')}</div>
  <div class="sect">Fine tuning</div>
  <div class="slider"><span class="dim" style="width:110px">Fight distance</span><input type="range" min="50" max="110" value="${Math.round(b.ai.eng*100)}" id="sEng"><b id="vEng">${Math.round(b.ai.eng*100)}%</b></div>
  <div class="slider"><span class="dim" style="width:110px">Retreat below</span><input type="range" min="0" max="60" value="${Math.round(b.ai.ret*100)}" id="sRet"><b id="vRet">${Math.round(b.ai.ret*100)}%</b></div>`}
 else if(BTAB==='perks'){const i=rankIdx(b.rep),nx=RANKS[i+1];body=`<div class="card" style="margin-bottom:10px"><div class="row"><div class="grow">${rankHtml(b.rep)} <span class="mono small dim">${b.rep} rep</span><div class="small dim">${nx?`Next: <b style="color:${nx[2]}">${nx[1]}</b> at ${nx[0]}`:'Top rank'}</div></div><div style="text-align:right"><div class="mono" style="font-size:22px;color:var(--amber)">${pts}</div><div class="small dim">to spend</div></div></div>${nx?`<div class="bar" style="margin-top:8px"><i style="width:${Math.min(100,(b.rep-RANKS[i][0])/(nx[0]-RANKS[i][0])*100)}%;background:var(--amber)"></i></div>`:''}</div>
  <div class="optgrid">${Object.entries(PERKS).map(([k,v])=>{const has=b.perks.includes(k),can=!has&&pts>0;return `<button class="opt perk ${has?'on':can?'':'lock'}" data-perk="${k}"><span class="ic">${v.i}</span><b>${v.n}${has?' ✓':''}</b><small>${v.d}</small></button>`}).join('')}</div>
  ${b.perks.length?`<button class="btn small" style="margin-top:8px" id="pReset">Reset perks · ¢${fmt(250*b.perks.length)}</button>`:''}`}
 else{body=`<div class="small dim" style="margin-bottom:5px">Primary</div><div class="swatches">${PAINTS.map(c=>`<button class="sw ${b.paint.p===c?'on':''}" data-pp="${c}" style="background:${c}"></button>`).join('')}</div>
  <div class="small dim" style="margin:12px 0 5px">Secondary</div><div class="swatches">${PAINTS.map(c=>`<button class="sw ${b.paint.s===c?'on':''}" data-ps="${c}" style="background:${c}"></button>`).join('')}</div>
  <div class="small dim" style="margin:12px 0 5px">Finish</div><div class="chips">${Object.entries(FINISHES).map(([k,v])=>`<button class="chip ${b.paint.fin===k?'on':''}" data-fin="${k}">${v}</button>`).join('')}</div>
  <div class="slider"><span class="dim" style="width:110px">Hull number</span><input type="range" min="0" max="99" value="${b.paint.num||0}" id="sNum"><b id="vNum">${b.paint.num||0}</b></div>
  <button class="btn danger small" style="margin-top:22px" id="bRetire">${b.st.m?'Retire to Hall of Fame':'Scrap bot'}</button>`}
 $('#builder').innerHTML=`<div class="bhead"><button class="btn small" id="bBack">‹ Done</button><input id="bName" maxlength="16" value="${esc(b.name)}"><button class="btn small" id="bHelp">?</button></div>
 <div class="wrap"><div class="bgrid"><div class="bstick">
  <canvas id="bPrev"></canvas>
  <div class="row" style="margin-top:8px"><div class="grow">${rankHtml(b.rep)}${ep?` <span class="small" style="color:var(--amber);font-style:italic">${esc(ep)}</span>`:''}</div>${b.st.m?`<span class="small dim mono">${b.st.w}W-${b.st.m-b.st.w}L · ${b.st.k} KO</span>`:''}</div>
  <div class="tiles">${tile('HP',Math.round(o.hp||0))}${tile('DPS',Math.round(o.dps||0))}${tile('Speed',Math.round(o.speed||0))}${tile('Range',o.range?Math.round(o.range):o.melee?'melee':'—')}</div>
  ${F?`<div class="meters">${meter('Weight',o.weight,o.load)}${meter('Power',o.draw,o.pow)}</div>`:''}
  ${adviceHtml(b,o)}
 </div><div>
  <div class="tabs btabs">${tabs.map(([k,n])=>`<button class="${BTAB===k?'on':''}" data-bt="${k}">${n}</button>`).join('')}</div>
  ${body}
 </div></div></div>`;
 $('#builder').scrollTop=y;
 $('#bBack').onclick=closeBuilder;$('#bHelp').onclick=()=>openHelp(BTAB==='tactics'?6:BTAB==='perks'?8:1);$('#bName').oninput=e=>{b.name=e.target.value.slice(0,16)||'Unit'};
 $$('#builder [data-bt]').forEach(el=>el.onclick=()=>{BTAB=el.dataset.bt;renderBuilder()});
 $$('#builder .slot').forEach(el=>el.onclick=()=>openPicker(el.dataset.k,el.dataset.i===''?null:+el.dataset.i));
 $$('#builder [data-perk]').forEach(el=>el.onclick=()=>{const k=el.dataset.perk;if(b.perks.includes(k))return toast(PERKS[k].n+' already learned');if(perkPts(b)<=0)return toast('No perk points yet. Earn reputation to rank up.');b.perks.push(k);sfx('level');persist();renderBuilder()});
 if($('#pReset'))$('#pReset').onclick=()=>{const c=250*b.perks.length;if(S.credits<c)return toast('Not enough credits');confirmBox('Reset perks?',`Refund all perk points for ¢${fmt(c)}.`,'Reset',()=>{S.credits-=c;b.perks=[];persist();refreshTop();renderBuilder()})};
 $$('#builder [data-beh]').forEach(el=>el.onclick=()=>{b.ai.beh=el.dataset.beh;persist();renderBuilder()});
 $$('#builder [data-tgt]').forEach(el=>el.onclick=()=>{b.ai.tgt=el.dataset.tgt;persist();renderBuilder()});
 $$('#builder [data-pp]').forEach(el=>el.onclick=()=>{b.paint.p=el.dataset.pp;persist();renderBuilder()});
 $$('#builder [data-ps]').forEach(el=>el.onclick=()=>{b.paint.s=el.dataset.ps;persist();renderBuilder()});
 $$('#builder [data-fin]').forEach(el=>el.onclick=()=>{b.paint.fin=el.dataset.fin;persist();renderBuilder()});
 if($('#sEng')){$('#sEng').oninput=e=>{b.ai.eng=e.target.value/100;$('#vEng').textContent=e.target.value+'%'};$('#sEng').onchange=()=>{persist();renderBuilder()}}
 if($('#sRet')){$('#sRet').oninput=e=>{b.ai.ret=e.target.value/100;$('#vRet').textContent=e.target.value+'%'};$('#sRet').onchange=persist}
 if($('#sNum')){$('#sNum').oninput=e=>{b.paint.num=+e.target.value;$('#vNum').textContent=e.target.value};$('#sNum').onchange=()=>{persist();renderBuilder()}}
 if($('#bRetire'))$('#bRetire').onclick=()=>confirmBox(b.st.m?'Retire '+b.name+'?':'Scrap '+b.name+'?',b.st.m?'Its record goes to the Hall of Fame. All parts return to storage.':'All parts return to storage.',b.st.m?'Retire':'Scrap',()=>{
  S.bots=S.bots.filter(x=>x!==b);if(b.st.m)S.retired.push({name:b.name,rep:b.rep,st:b.st,titles:b.titles,paint:b.paint,ret:S.matches});syncEquip();persist();closeBuilder()});
 afterPaint(()=>$$('#builder canvas[data-p]').forEach(c=>{const p=S.inv[c.dataset.p];if(p)partIcon(c,p,b.paint);else{const x=c.getContext('2d');c.width=c.clientWidth*2;c.height=c.clientHeight*2;x.fillStyle='#0d1116';x.fillRect(0,0,c.width,c.height);x.strokeStyle='#2a3340';x.lineWidth=2;x.setLineDash([5,5]);x.strokeRect(5,5,c.width-10,c.height-10);x.fillStyle='#3a4656';x.font='600 34px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('+',c.width/2,c.height/2+2)}}));
}
// ================= part picker =================
const SLOTCAT={frame:'frame',drive:'drive',core:'core',armor:'armor',chip:'chip',weps:'weapon',utils:'util'};
// shared row: icon, name, affixes, short description and one stat line
function partRow(p,right,attrs='',cls='',desc=true){return `<div class="prow ${cls}" ${attrs}><canvas data-pi="${p.id||''}" data-ck="${p.k}" data-cc="${p.c}"></canvas><div class="grow"><div class="pn" style="${p.t>1?'color:'+TIERS[p.t].col:''}">${esc(p.id?partName(p):baseOf(p).n)}</div>${Object.keys(p.af||{}).length?`<div class="af">${affixText(p).join(' · ')}</div>`:''}${desc?`<div class="pd">${PDESC[p.c][p.k]}</div>`:''}${partBrief(p)}</div>${right?`<div class="pr">${right}</div>`:''}</div>`}
function paintIcons(root,paint){afterPaint(()=>root.querySelectorAll('canvas[data-ck]').forEach(c=>{const p=c.dataset.pi?(S.inv[c.dataset.pi]||S.market.find(m=>m.id===c.dataset.pi)):{c:c.dataset.cc,k:c.dataset.ck,t:1,af:{}};if(p)partIcon(c,p,paint)}))}
function openPicker(key,idx){
 const b=BB,cat=SLOTCAT[key],cur=key==='weps'||key==='utils'?b[key][idx]:b[key];
 const mountSz=key==='weps'?SZ[FRAMES[S.inv[b.frame].k].mounts[idx][0]]:3;
 const fits=k=>cat!=='weapon'||WEAPONS[k].sz<=mountSz;
 const own=Object.values(S.inv).filter(p=>p.c===cat&&fits(p.k)&&p.id!==cur).sort((x,y)=>(x.on?1:0)-(y.on?1:0)||partValue(y)-partValue(x));
 const all=Object.keys(CATS[cat]).filter(fits).sort((x,y)=>CATS[cat][x].lv-CATS[cat][y].lv||CATS[cat][x].cost-CATS[cat][y].cost);
 const shop=all.filter(k=>CATS[cat][k].lv<=S.unlocked),locked=all.length-shop.length,tooBig=cat==='weapon'&&mountSz<3;
 const optional=key==='armor'||key==='weps'||key==='utils';
 const title=cat==='weapon'?`${szBadge(mountSz)} Weapon · mount ${idx+1}`:CATNAME[cat];
 const body=openSheet(`<div class="sheet-h"><h3 class="grow">${title}</h3><span class="pill cr">¢ ${fmt(S.credits)}</span><button class="btn small ghost" onclick="closeSheet()">✕</button></div>
 ${cur?`<div class="sect" style="margin-top:0">Installed</div>${partRow(S.inv[cur],optional?'<button class="btn small" data-rm="1">Remove</button>':'','','',false)}`:''}
 ${own.length?`<div class="sect">Your parts</div>${own.map(p=>partRow(p,p.on?`<span class="small dim">on ${esc(S.bots.find(x=>x.id===p.on)?.name||'?')}</span>`:'<span class="btn small primary">Install</span>',`data-own="${p.id}" role="button"`,'tap',false)).join('')}`:''}
 <div class="sect">Buy new</div>${shop.map(k=>{const B=CATS[cat][k],cant=S.credits<B.cost;return partRow({c:cat,k,t:1,af:{}},`<span class="btn small ${cant?'':'primary'}">¢${fmt(B.cost)}</span>`,`data-buy="${k}" role="button"`,'tap'+(cant?' cant':''))}).join('')}
 ${locked||tooBig?`<div class="small dim" style="margin-top:10px">${locked?`${locked} more unlock in later leagues.`:''}${tooBig?` Bigger weapons need a bigger mount.`:''}</div>`:''}`);
 const install=id=>{equip(b,key,idx,id);sfx('buy');closeSheet();renderBuilder()};
 body.querySelectorAll('[data-own]').forEach(el=>el.onclick=()=>install(el.dataset.own));
 body.querySelectorAll('[data-buy]').forEach(el=>el.onclick=()=>{const k=el.dataset.buy;if(S.credits<CATS[cat][k].cost)return toast('Not enough credits');const p=buyCatalog(cat,k);refreshTop();install(p.id)});
 const rm=body.querySelector('[data-rm]');if(rm)rm.onclick=()=>{if(key==='weps'||key==='utils')b[key][idx]=null;else b[key]=null;syncEquip();persist();closeSheet();renderBuilder()};
 paintIcons(body,b.paint);
}
function equip(b,key,idx,id){const p=S.inv[id];if(p.on&&p.on!==b.id){const ob=S.bots.find(x=>x.id===p.on);if(ob)unequipPart(ob,id)}else if(p.on===b.id)unequipPart(b,id);
 if(key==='weps'||key==='utils')b[key][idx]=id;else b[key]=id;if(key==='frame')fitFrame(b);syncEquip();persist()}
function unequipPart(b,id){for(const k of ['frame','drive','core','armor','chip'])if(b[k]===id)b[k]=null;b.weps=b.weps.map(x=>x===id?null:x);b.utils=b.utils.map(x=>x===id?null:x);if(!b.frame){b.weps=[];b.utils=[]}}
function fitFrame(b){const F=FRAMES[S.inv[b.frame].k];b.weps=F.mounts.map((m,i)=>{const id=b.weps[i];return id&&S.inv[id]&&WEAPONS[S.inv[id].k].sz<=SZ[m[0]]?id:null});b.utils=Array.from({length:F.util},(_,i)=>b.utils[i]||null)}

// ================= parts tab =================
let SHOPTAB='market',SHOPCAT='all';
function renderShop(){
 const inv=Object.values(S.inv);
 let html=`<h2>Parts</h2><div class="tabs" style="margin-top:10px">${[['market','Market'],['mine','My parts · '+inv.length]].map(([k,n])=>`<button class="${SHOPTAB===k?'on':''}" data-st="${k}">${n}</button>`).join('')}</div>`;
 if(SHOPTAB==='market'){html+=`<div class="row" style="margin-bottom:10px"><span class="grow small dim">Rare parts with bonus stats. New stock after every match.</span><button class="btn small" id="reroll" ${S.credits<150?'disabled':''}>Restock ¢150</button></div>`+
  (S.market.length?S.market.map((p,i)=>partRow(p,`<button class="btn small ${S.credits<partValue(p)?'':'primary'}" data-bm="${i}" ${S.credits<partValue(p)?'disabled':''}>¢${fmt(partValue(p))}</button>`)).join(''):'<div class="empty">Sold out. Restock or play a match.</div>')}
 else{const have=Object.keys(CATS).filter(c=>inv.some(p=>p.c===c));if(SHOPCAT!=='all'&&!have.includes(SHOPCAT))SHOPCAT='all';
  const list=inv.filter(p=>SHOPCAT==='all'||p.c===SHOPCAT).sort((a,b)=>(a.on?1:0)-(b.on?1:0)||a.c.localeCompare(b.c)||partValue(b)-partValue(a));
  html+=`<div class="chips" style="margin-bottom:10px">${['all',...have].map(c=>`<button class="chip ${SHOPCAT===c?'on':''}" data-sc="${c}">${c==='all'?'All':CATNAME[c]}</button>`).join('')}</div>`+
  (list.length?list.map(p=>partRow(p,p.on?`<span class="tag" style="color:var(--teal)">${esc(S.bots.find(x=>x.id===p.on)?.name||'')}</span>`:'<span class="dim">›</span>',`data-part="${p.id}" role="button"`,'tap',false)).join(''):'<div class="empty">No parts yet.</div>')}
 $('#shopBody').innerHTML=html;
 $$('[data-st]').forEach(b=>b.onclick=()=>{SHOPTAB=b.dataset.st;renderShop()});$$('[data-sc]').forEach(b=>b.onclick=()=>{SHOPCAT=b.dataset.sc;renderShop()});
 $$('[data-bm]').forEach(b=>b.onclick=()=>{const p=buyMarket(+b.dataset.bm);if(p){sfx('buy');toast('Bought '+partName(p));refreshTop();renderShop()}});
 $$('[data-part]').forEach(b=>b.onclick=()=>openPart(b.dataset.part));
 if($('#reroll'))$('#reroll').onclick=()=>{S.credits-=150;refreshMarket();persist();refreshTop();renderShop()};
 paintIcons($('#shopBody'));
}
// part detail: full stats and the upgrade / reroll / sell actions
function openPart(id){const p=S.inv[id];if(!p){closeSheet();return}const uc=upgradeCost(p),rc=Object.keys(p.af).length?rerollCost(p):0,bot=p.on&&S.bots.find(x=>x.id===p.on);
 const b=openSheet(sheetHead(`<span style="color:${TIERS[p.t].col}">${esc(partName(p))}</span>`,`${CATNAME[p.c]} · ${TIERS[p.t].n}${bot?' · on '+esc(bot.name):''}`)+`
 <div class="row" style="align-items:flex-start"><canvas class="bigicon" data-pi="${p.id}" data-ck="${p.k}" data-cc="${p.c}"></canvas><div class="grow"><div class="pdesc">${PDESC[p.c][p.k]}</div>${Object.keys(p.af).length?`<div class="af">${affixText(p).join(' · ')}</div>`:''}</div></div>
 ${partLine(p,true)}
 <div class="acts">${uc?`<button class="btn ${S.credits>=uc?'primary':''}" id="pUp" ${S.credits<uc?'disabled':''}>▲ Upgrade to ${TIERS[p.t+1].mk} · ¢${fmt(uc)}</button>`:'<div class="small" style="color:var(--amber)">Max tier reached</div>'}
 ${rc?`<button class="btn" id="pRr" ${S.credits<rc?'disabled':''}>⟳ Reroll bonuses · ¢${fmt(rc)}</button>`:''}
 ${p.on?'':`<button class="btn danger" id="pSell">Sell · ¢${fmt(partValue(p)*.5)}</button>`}</div>
 ${uc?'<div class="small dim" style="margin-top:6px">Upgrading adds a random bonus.</div>':''}`);
 const done=msg=>{if(msg)toast(msg);refreshTop();renderShop();openPart(id)};
 if($('#pUp'))$('#pUp').onclick=()=>{if(upgradePart(p)){sfx('level');done(partName(p)+': '+affixText(p).slice(-1)[0])}};
 if($('#pRr'))$('#pRr').onclick=()=>{if(rerollPart(p)){sfx('buy');done(affixText(p).join(' · '))}};
 if($('#pSell'))$('#pSell').onclick=()=>{sellPart(p.id);toast('Sold '+partName(p));closeSheet();refreshTop();renderShop()};
 paintIcons(b);
}
// ================= records =================
let RECTAB='career';
function renderRecords(){
 const tabs=`<div class="tabs" style="margin-top:10px">${[['career','Career'],['board','Leaderboard'],['hof','Hall of Fame']].map(([k,n])=>`<button class="${RECTAB===k?'on':''}" data-rt="${k}">${n}</button>`).join('')}</div>`;
 let html=`<h2>Records</h2>`+tabs;
 if(RECTAB==='career'){const w=S.log.filter(l=>l.win).length;
  html+=`<div class="recgrid">${[['Matches',S.matches],['Win rate',S.log.length?Math.round(w/S.log.length*100)+'%':'—'],['Trophies',S.trophies.length],['Fame',fmt(fame())]].map(([k,v])=>`<div><b class="mono">${v}</b><span>${k}</span></div>`).join('')}</div>
  ${S.trophies.length?`<div class="sect">Trophies</div><div class="trophies">${S.trophies.map(t=>`<div class="trophy">🏆 ${esc(t.n)}</div>`).join('')}</div>`:''}
  <div class="sect">Recent results</div>${S.log.length?`<div class="card log">${S.log.slice(0,6).map(l=>`<div><span class="${l.win?'up':'down'}" style="width:16px">${l.win?'W':'L'}</span><span class="grow">${esc(l.vs)}</span><span class="mono ${l.net>=0?'up':'down'}">${l.net>=0?'+':''}${fmt(l.net)}¢</span></div>`).join('')}</div>`:'<div class="empty">No matches played yet.</div>'}`}
 else if(RECTAB==='board'){
  const all=[...S.bots.map(b=>({n:b.name,t:S.team,rep:b.rep,st:b.st,me:1}))];
  for(const [tn,t] of Object.entries(S.rivals))if(t.li<=Math.min(4,S.unlocked+1))t.bots.forEach(b=>all.push({n:b.name,t:tn,rep:b.rep,st:b.st}));
  all.sort((a,b)=>b.rep-a.rep);const top=all.map((b,i)=>({...b,i})).filter((b,i)=>i<20||b.me);
  html+=`<table class="t"><tr><th>#</th><th style="text-align:left">Bot</th><th>Rep</th><th>W-L</th></tr>${top.map(b=>`<tr class="${b.me?'me':''}"><td class="mono">${b.i+1}</td><td style="text-align:left"><b>${esc(b.n)}</b><div class="small dim" style="font-weight:500">${esc(b.t)}</div></td><td>${b.rep}</td><td>${b.st.w}-${b.st.m-b.st.w}</td></tr>`).join('')}</table>`}
 else{html+=S.retired.length?`<div class="bots">${S.retired.slice().sort((a,b)=>b.rep-a.rep).map(b=>`<div class="card"><div class="nm" style="font-weight:700;font-size:16px">${esc(b.name)} ${rankHtml(b.rep)}</div><div class="small dim">${b.st.w}W-${b.st.m-b.st.w}L · ${b.st.k} KOs · ${b.rep} rep</div>${b.titles.length?`<div class="small" style="margin-top:4px">🏆 ${[...new Set(b.titles)].map(esc).join(', ')}</div>`:''}</div>`).join('')}</div>`:'<div class="empty">Retire a veteran bot from the Garage to enshrine it here.</div>'}
 $('#recordsBody').innerHTML=html;$$('[data-rt]').forEach(b=>b.onclick=()=>{RECTAB=b.dataset.rt;renderRecords()});
}
// ================= boot =================
function showIntro(){$$('.screen').forEach(s=>s.classList.remove('on'));$('#intro').classList.add('on');$('#nav').style.display='none';$('#topbar').style.display='none'}
$('#introImp').onclick=importSave;
$('#startCareer').onclick=()=>{newCareer(($('#teamName').value||'').trim().slice(0,22)||'Garage Rats');show('career');showTutorial(0)};
document.addEventListener('click',e=>{const b=e.target.closest('button');if(b)sfx('click')});
S=loadSave();if(S)show('career');else showIntro();

// ================= test range =================
let TR={bot:null,opp:'dummy',mate:null,map:'neon',mod:null};
function openTestRange(){const ready=S.bots.filter(b=>compute(b).ok);if(!ready.length)return toast('Build a battle-ready bot first');if(!TR.bot||!ready.find(b=>b.id===TR.bot))TR.bot=ready[0].id;if(!MAPS[TR.map])TR.map='neon';renderTR()}
function renderTR(){const ready=S.bots.filter(b=>compute(b).ok),others=ready.filter(b=>b.id!==TR.bot);if(TR.opp==='mate'&&!others.length)TR.opp='dummy';if(TR.opp==='mate'&&!others.find(b=>b.id===TR.mate))TR.mate=others[0]?.id;
 const b=openSheet(sheetHead('⌖ Test range','Free practice · no rewards or repairs')+`
 <div class="sect" style="margin-top:0">Bot</div><div class="chips">${ready.map(x=>`<button class="chip ${TR.bot===x.id?'on':''}" data-tb="${x.id}">${esc(x.name)}</button>`).join('')}</div>
 <div class="sect">Opponent</div><div class="chips">${[['dummy','Target dummy'],['spar','Sparring partner'],['mate','Squad mate']].filter(([k])=>k!=='mate'||others.length).map(([k,n])=>`<button class="chip ${TR.opp===k?'on':''}" data-to="${k}">${n}</button>`).join('')}</div>
 ${TR.opp==='mate'?`<div class="chips" style="margin-top:8px">${others.map(x=>`<button class="chip ${TR.mate===x.id?'on':''}" data-tm="${x.id}">${esc(x.name)}</button>`).join('')}</div>`:''}
 <div class="sect">Arena</div><div class="chips">${Object.entries(MAPS).map(([k,m])=>`<button class="chip ${TR.map===k?'on':''}" data-tmap="${k}">${m.n}</button>`).join('')}</div>
 <div class="sect">Conditions</div><div class="chips"><button class="chip ${!TR.mod?'on':''}" data-tmod="">Standard</button>${Object.entries(MODIFIERS).map(([k,m])=>`<button class="chip ${TR.mod===k?'on':''}" data-tmod="${k}">${m.i} ${m.n}</button>`).join('')}</div>
 <button class="btn primary big" id="trGo">Start test</button>`);
 const set=(k,v)=>{const y=$('#sheet').scrollTop;TR[k]=v;renderTR();$('#sheet').scrollTop=y};
 b.querySelectorAll('[data-tb]').forEach(e=>e.onclick=()=>set('bot',e.dataset.tb));b.querySelectorAll('[data-to]').forEach(e=>e.onclick=()=>set('opp',e.dataset.to));b.querySelectorAll('[data-tm]').forEach(e=>e.onclick=()=>set('mate',e.dataset.tm));
 b.querySelectorAll('[data-tmap]').forEach(e=>e.onclick=()=>set('map',e.dataset.tmap));b.querySelectorAll('[data-tmod]').forEach(e=>e.onclick=()=>set('mod',e.dataset.tmod||null));
 $('#trGo').onclick=startTest}
function dummyUnit(){const inv={};let n=0;const P=(c,k)=>{const id='d'+(n++);inv[id]={id,c,k,t:1,af:{}};return id};
 const d={name:'Target Dummy',frame:P('frame','citadel'),drive:P('drive','treads'),core:P('core','battery'),armor:P('armor','steel'),chip:P('chip','basic'),weps:[],utils:[],paint:{p:'#e3b51c',s:'#1f2328',fin:'hazard',num:0},ai:{beh:'sentinel',tgt:'near',eng:1,ret:0}};
 return {design:d,inv,rec:{rep:0,name:'Target Dummy'},dummy:true}}
function startTest(){closeSheet();const me=S.bots.find(b=>b.id===TR.bot);const p=[{design:me,inv:S.inv,rec:{rep:me.rep}}];let e,eTeam='Test Range',limit=0;
 if(TR.opp==='dummy'){e=[dummyUnit()];limit=30;eTeam='Target Dummy'}
 else if(TR.opp==='mate'){const m=S.bots.find(b=>b.id===TR.mate);e=[{design:{...m,paint:{...m.paint}},inv:S.inv,rec:{rep:m.rep}}];eTeam=m.name}
 else{const L=LEAGUES[S.league],team=pick(L.teams),x=enemySquad(team,S.league,2,true)[0];e=[{design:x.design,inv:x.inv,rec:{rep:x.rb.rep},o:x.o}];eTeam=team}
 startBattle({test:true,limit,p,e,map:TR.map,mods:TR.mod?[TR.mod]:[],eTeam,title:'TEST',onEnd:testEnd})}
function testEnd(Gm){const me=Gm.bots.filter(b=>b.team===0),t=Math.max(1,Gm.t);
 openSheet(`<h3 style="text-align:center">Test results</h3><div class="dim small" style="text-align:center">${Math.floor(Gm.t)}s · ${MAPS[TR.map].n}</div>
 <div class="money">${me.map(b=>`<span>Damage dealt</span><b>${fmt(b.st.dmg)}</b><span>Average DPS</span><b>${(b.st.dmg/t).toFixed(1)}</b><span>Damage taken</span><b>${fmt(b.st.taken)}</b>${TR.opp==='dummy'?'':`<span>Result</span><b>${Gm.winner===0?'Win':'Loss'}</b>`}`).join('')}</div>
 <div class="row" style="margin-top:12px"><button class="btn grow" id="trBack">Garage</button><button class="btn primary grow" id="trAgain">Run again</button></div>`,true);
 $('#trBack').onclick=()=>{closeDlg();endBattle();show('garage')};$('#trAgain').onclick=()=>{closeDlg();endBattle();startTest()}}

// ================= save backup =================
function saveCode(){return 'BA4:'+btoa(unescape(encodeURIComponent(JSON.stringify(S))))}
function exportSave(){const code=saveCode();openSheet(`<h3>Export save</h3><p class="small dim" style="margin:6px 0 10px">Copy this code and paste it into Import on the other copy of the game.</p>
 <textarea id="saveTxt" readonly class="code">${code}</textarea>
 <div class="row" style="margin-top:10px"><button class="btn grow" onclick="closeDlg()">Close</button><button class="btn primary grow" id="copyBtn">Copy</button></div>`,true);
 $('#copyBtn').onclick=async()=>{const t=$('#saveTxt');t.select();t.setSelectionRange(0,code.length);let ok=false;try{await navigator.clipboard.writeText(code);ok=true}catch(e){try{ok=document.execCommand('copy')}catch(e2){}}toast(ok?'Save code copied':'Select the text and copy it manually')}}
function importSave(){openSheet(`<h3>Import save</h3><p class="small dim" style="margin:6px 0 10px">Paste a save code. This replaces the career on this device.</p>
 <textarea id="impTxt" class="code"></textarea>
 <div class="row" style="margin-top:10px"><button class="btn grow" onclick="closeDlg()">Cancel</button><button class="btn primary grow" id="doImp">Import</button></div>`,true);
 $('#doImp').onclick=()=>{try{const raw=$('#impTxt').value.trim().replace(/^BA[0-9]:/,'');const s=JSON.parse(decodeURIComponent(escape(atob(raw))));if(!s||s.v!==2||!s.bots)throw 0;S=migrate(s);persist();closeDlg();toast('Career imported');show('career')}catch(e){toast('That code is not a valid save')}}}
