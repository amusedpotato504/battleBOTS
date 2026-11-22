'use strict';
// ================= navigation =================
let TAB='career';
function show(tab){TAB=tab;$$('.screen').forEach(s=>s.classList.remove('on'));$('#'+tab).classList.add('on');$('#nav').style.display='';$('#topbar').style.display='';
 $$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));refreshTop();({career:renderCareer,garage:renderGarage,shop:renderShop,records:renderRecords}[tab]||(()=>0))();$('#'+tab).scrollTop=0}
$$('#nav button').forEach(b=>b.onclick=()=>show(b.dataset.tab));
function refreshTop(){$('#tTeam').innerHTML=`${esc(S.team)}<small>${LEAGUES[S.league].n}${S.crowned?' · ♛×'+S.crowned:''}</small>`;$('#tCred').textContent='¢ '+fmt(S.credits);$('#tFame').textContent='★ '+fmt(fame())}
function openSheet(html,center){const m=center?$('#dlgM'):$('#sheetM'),b=center?$('#dlg'):$('#sheet');b.innerHTML=html;m.classList.add('on');b.scrollTop=0;return b}
function closeSheet(){$('#sheetM').classList.remove('on')}
function closeDlg(){$('#dlgM').classList.remove('on')}
$('#sheetM').onclick=e=>{if(e.target.id==='sheetM')closeSheet()};
function confirmBox(title,msg,yes,fn){const b=openSheet(`<h3>${esc(title)}</h3><p class="dim small" style="margin:8px 0 14px">${msg}</p><div class="row"><button class="btn grow" id="cNo">Cancel</button><button class="btn danger grow" id="cYes">${esc(yes)}</button></div>`,true);
 $('#cNo').onclick=closeDlg;$('#cYes').onclick=()=>{closeDlg();fn()}}
function toast(msg){const d=document.createElement('div');d.textContent=msg;Object.assign(d.style,{position:'fixed',left:'50%',bottom:'90px',transform:'translateX(-50%)',background:'#1d242e',border:'1px solid #3a4656',padding:'9px 14px',borderRadius:'9px',zIndex:60,fontSize:'13px',maxWidth:'90vw'});document.body.appendChild(d);setTimeout(()=>d.remove(),2200)}
function rankHtml(rep){const r=rankOf(rep);return `<span class="rank" style="color:${r[2]}">${r[1]}</span>`}
function afterPaint(fn){requestAnimationFrame(()=>requestAnimationFrame(fn))}

// ================= career hub =================
let PENDING=null;
function renderCareer(){
 const L=LEAGUES[S.league],opp=opponentFor(S.league,S.ladder),rv=S.rivals[opp],avg=Math.round(rv.bots.reduce((a,b)=>a+b.rep,0)/rv.bots.length);
 const ready=S.bots.filter(b=>compute(b).ok).length;
 const purse=Math.round(L.purse*(1+.15*S.ladder)*(S.ladder>=4?1.6:1)*(1+(S.league===4?.15*S.crowned:0)));
 const steps=nextSteps();
 $('#careerBody').innerHTML=`
 ${steps.length?`<div class="steps">${steps.map(([i,t,btn,tab])=>`<div class="stepc"><span class="si">${i}</span><span class="grow">${t}</span><button class="btn small" data-go="${tab}">${btn}</button></div>`).join('')}</div>`:''}
 <div class="card"><div class="league"><div class="crest">${['⚙','⛓','⚒','♜','♛'][S.league]}</div><div class="grow"><div class="dim small" style="letter-spacing:.14em">LEAGUE ${S.league+1} OF 5${S.crowned?' · DEFENDING CROWN':''}</div><h2>${L.n}</h2><div class="dim small">${L.sq} bots per side · Win purse up to ¢${fmt(purse)}</div></div></div>
 <div class="ladder">${[0,1,2,3,4].map(i=>`<div class="${i<S.ladder?'done':i===S.ladder?'cur':''} ${i===4?'champ':''}">${i===4?'♛ FINAL':'Match '+(i+1)}<br><span style="font-size:9.5px">${esc(opponentFor(S.league,i))}</span></div>`).join('')}</div></div>
 <div class="sect">Next match</div>
 <div class="card next"><div class="grow"><div class="dim small">${S.ladder>=4?'CHAMPIONSHIP FINAL':'MATCH '+(S.ladder+1)} VS</div><h3 style="font-size:19px">${esc(opp)}</h3><div class="small dim">Avg reputation ${avg} · ${rankHtml(avg)} · Purse ¢${fmt(purse)}</div></div>
  <button class="btn primary" id="prepBtn" ${ready?'':'disabled'}>Prepare</button></div>
 ${ready?'':'<div class="warnline" style="margin-top:6px">None of your bots are battle-ready. Fix them in the Garage.</div>'}
 <div class="row" style="margin-top:8px"><button class="btn small grow" id="exhBtn" ${ready?'':'disabled'}>Exhibition match</button><span class="small dim grow">Practice vs a random ${L.n} team. Half purse, half reputation.</span></div>
 <div class="sect">Trophy cabinet</div>
 ${S.trophies.length?`<div class="trophies">${S.trophies.map(t=>`<div class="trophy">🏆 ${esc(t.n)}</div>`).join('')}</div>`:'<div class="empty">No trophies yet. Win a league final to claim one.</div>'}
 <div class="sect">Recent results</div>
 ${S.log.length?`<div class="card log">${S.log.slice(0,8).map(l=>`<div><span class="${l.win?'up':'down'}" style="width:16px">${l.win?'W':'L'}</span><span class="grow">vs ${esc(l.vs)} <span class="dim">· ${esc(l.lg)}</span></span><span class="mono ${l.net>=0?'up':'down'}">${l.net>=0?'+':''}${fmt(l.net)}¢</span></div>`).join('')}</div>`:'<div class="empty">No matches played yet.</div>'}
 <div class="sect">Guide</div>
 <div class="helpgrid">${HELP.map(([i,t],k)=>`<button class="hbtn" data-help="${k}"><span>${i}</span>${t}</button>`).join('')}</div>
 <div class="sect">Save backup</div>
 <div class="row" style="flex-wrap:wrap"><button class="btn small" id="expBtn">Export save code</button><button class="btn small" id="impBtn">Import save code</button><span class="small dim grow">Move your career between devices or app versions.</span></div>
 <div style="margin-top:16px"><button class="btn small danger" id="resetBtn">Abandon career</button></div>`;
 $$('#careerBody [data-go]').forEach(b=>b.onclick=()=>{if(b.dataset.go==='shop'){SHOPTAB=b.textContent==='Storage'?'storage':'market'}show(b.dataset.go)});$$('#careerBody [data-help]').forEach(b=>b.onclick=()=>openHelp(+b.dataset.help));
 $('#expBtn').onclick=exportSave;$('#impBtn').onclick=importSave;
 $('#prepBtn').onclick=()=>prepMatch(false);$('#exhBtn').onclick=()=>prepMatch(true);
 $('#resetBtn').onclick=()=>confirmBox('Abandon career?','Deletes your team, bots, parts and records. This cannot be undone.','Delete everything',()=>{try{localStorage.removeItem(SAVE_KEY)}catch(e){}S=null;showIntro()});
}
function matchPurse(P){const L=LEAGUES[P.li];let p=L.purse*(1+.15*P.ladder)*(P.ladder>=4&&!P.exh?1.6:1)*(1+(P.li===4?.15*S.crowned:0));if(P.exh)p*=.5;return Math.round(p)}
function teamPower(units){let hp=0,dps=0;for(const u of units){hp+=u.o.hp;dps+=u.o.dps}return Math.sqrt(hp*dps)}
function wagerOdds(P){const mine=P.sel.map(id=>({o:compute(S.bots.find(b=>b.id===id))}));if(!mine.length)return 2;const r=teamPower(P.enemies)/Math.max(1,teamPower(mine));return Math.round(clamp(1.5*r+.4,1.2,4)*100)/100}
function nemesisOf(team,name){return S.bots.filter(b=>S.nemesis[b.id]&&S.nemesis[b.id].team===team&&S.nemesis[b.id].name===name)}
function prepMatch(exh){
 const li=S.league,L=LEAGUES[li],team=exh?pick(L.teams.filter(t=>t!==opponentFor(li,S.ladder))):opponentFor(li,S.ladder);
 PENDING={exh,li,ladder:S.ladder,team,map:pick(Object.keys(MAPS)),enemies:enemySquad(team,li,S.ladder,exh),sel:[],mod:Math.random()<.6?pick(Object.keys(MODIFIERS)):null,bounty:pick(Object.keys(BOUNTIES)),bet:0};
 PENDING.sel=S.bots.filter(b=>compute(b).ok).sort((a,b)=>b.rep-a.rep).slice(0,L.sq).map(b=>b.id);
 renderPrep();
}
function renderPrep(){
 const P=PENDING,L=LEAGUES[P.li],purse=matchPurse(P),odds=wagerOdds(P),bReward=Math.round(purse*.4);
 const cap=Math.min(S.credits,purse*3),bets=[0,.1,.25,.5].map(f=>Math.round(cap*f/10)*10);if(!bets.includes(P.bet))P.bet=0;
 const b=openSheet(`<div class="sheet-h"><div class="grow"><div class="dim small">${P.exh?'EXHIBITION':P.ladder>=4?'CHAMPIONSHIP FINAL':'MATCH '+(P.ladder+1)} · ${MAPS[P.map].n} · purse ¢${fmt(purse)}</div><h3>vs ${esc(P.team)}</h3></div><button class="btn small ghost" onclick="closeSheet()">✕</button></div>
 <div class="mods">${P.mod?`<div class="modc"><div class="h">${MODIFIERS[P.mod].i} ${MODIFIERS[P.mod].n}</div><div class="d">${MODIFIERS[P.mod].d}</div></div>`:`<div class="modc" style="border-color:var(--line);background:var(--panel2)"><div class="h">Standard conditions</div><div class="d">No special arena rules this match.</div></div>`}
  <div class="modc b"><div class="h">◆ Bounty: ${BOUNTIES[P.bounty].n}</div><div class="d">${BOUNTIES[P.bounty].d} Reward ¢${fmt(bReward)} and +8 rep per bot.</div></div></div>
 <div class="sect">Choose squad <span class="mono" style="color:var(--amber)">${P.sel.length}/${L.sq}</span></div>
 <div id="pickList">${S.bots.map(bt=>{const o=compute(bt),on=P.sel.includes(bt.id),nm=S.nemesis[bt.id];return `<button class="pick ${on?'on':''} ${o.ok?'':'bad'}" data-id="${bt.id}"><div class="check">${on?'✓':''}</div><canvas data-b="${bt.id}"></canvas><div class="grow"><div style="font-weight:700">${esc(bt.name)} ${rankHtml(bt.rep)}</div><div class="small dim">${Math.round(o.hp)} HP · ${Math.round(o.dps)} DPS · ${Math.round(o.speed)} SPD · rep ${bt.rep}</div>${nm&&nm.team===P.team?`<div class="nem">☠ Revenge chance vs ${esc(nm.name)}</div>`:''}${o.ok?'':`<div class="warnline">${esc(o.warn[0])}</div>`}</div></button>`}).join('')}</div>
 <div class="sect">Scout report</div>
 <div class="scout">${P.enemies.map((e,i)=>{const o=e.o,nv=nemesisOf(P.team,e.rb.name);return `<div class="card bot"><canvas data-e="${i}"></canvas><div class="grow"><div class="nm" style="font-size:15px">${esc(e.rb.name)}</div><div>${rankHtml(e.rb.rep)} <span class="small dim mono">rep ${e.rb.rep}</span></div>${nv.length?`<div class="nem">☠ Nemesis of ${nv.map(x=>esc(x.name)).join(', ')}</div>`:''}<div class="ln">${FRAMES[o.fk].n.split(' ')[0]} · ${DRIVES[o.dk].n}<br>${o.weps.map(w=>(w.t>1?TIERS[w.t].mk+' ':'')+WEAPONS[w.k].n).join(', ')}<br>${Math.round(o.hp)} HP · ${Math.round(o.dps)} DPS · ${BEHAVIORS[e.design.ai.beh].n}</div></div></div>`}).join('')}</div>
 <div class="sect">Side bet <span class="mono" style="color:var(--amber)">pays ×${odds}</span></div>
 <div class="chips">${bets.map((v,i)=>`<button class="chip ${P.bet===v?'on':''}" data-bet="${v}" ${i&&v<10?'disabled':''}>${v?'¢'+fmt(v):'No bet'}</button>`).join('')}</div>
 <div class="small dim" style="margin-top:5px">Odds come from comparing squad strength. Win and you collect stake × ${odds}; lose and the stake is gone.</div>
 <button class="btn primary" style="width:100%;margin-top:14px" id="goBtn" ${P.sel.length?'':'disabled'}>Enter the arena</button>`);
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
   if(P.li<4){S.unlocked=Math.max(S.unlocked,P.li+1);S.league=P.li+1;headline=`${L.n} conquered! ${LEAGUES[P.li+1].n} unlocked and new parts are in the catalog.`}else{S.crowned++;headline=S.crowned===1?'GRAND CHAMPIONS! Now defend the crown: every defense gets harder.':`Crown defended (${S.crowned})!`}
   S.ladder=0}else S.ladder++}
 if(Gm.forfeit)headline='Forfeited.';
 S.matches++;S.log.unshift({win,vs:P.team,lg:L.n+(P.exh?' exhibition':''),net});S.log=S.log.slice(0,30);refreshMarket();persist();
 sfx(win?'win':'lose');if(rows.some(r=>r.rankUp))setTimeout(()=>sfx('level'),900);
 const my=rows.filter(r=>r.u.team===0),en=rows.filter(r=>r.u.team===1);
 const line=r=>`<tr class="${r.u.dead?'ko':''}"><td>${esc(r.u.name)}${r.u===mvp?'<span class="badge">MVP</span>':''}${r.rankUp?`<span class="badge">▲ ${rankOf(r.after)[1]} · perk point</span>`:''}${r.ep?`<span class="badge">"${esc(r.ep)}"</span>`:''}${r.rv?'<span class="badge" style="color:var(--teal)">Revenge +25</span>':''}${r.nem?`<div class="nem">☠ New nemesis: ${esc(r.nem)}</div>`:''}</td><td>${Math.round(r.u.st.dmg)}</td><td>${r.u.st.kills.length}</td><td class="${r.g>=0?'up':'down'}">${r.g>=0?'+':''}${r.g}</td><td>${r.after}</td></tr>`;
 openSheet(`<div class="res-h" style="color:${win?'var(--teal)':'var(--red)'}">${win?'VICTORY':'DEFEAT'}</div>
 <div class="dim small" style="text-align:center">vs ${esc(P.team)} · ${MAPS[P.map].n}${P.mod?' · '+MODIFIERS[P.mod].n:''} · ${Math.floor(Gm.t)}s</div>
 ${headline?`<div class="trophy" style="margin-top:10px;text-align:center">${esc(headline)}</div>`:''}
 <div class="money"><span>${win?'Winner\'s purse':'Appearance fee'}</span><b>+${fmt(purse)}¢</b>${sponsor?`<span>Sponsor bonus (fame ${fmt(fm)})</span><b>+${fmt(sponsor)}¢</b>`:''}
 <span>Bounty: ${BOUNTIES[P.bounty].n} ${bountyOk?'✓':'✗'}</span><b class="${bountyOk?'up':'dim'}">${bountyOk?'+'+fmt(bountyCr):'0'}¢</b>
 ${P.bet?`<span>Side bet (×${P.odds})</span><b class="${wager>=0?'up':'down'}">${wager>=0?'+':'−'}${fmt(Math.abs(wager))}¢</b>`:''}
 <span>Repairs</span><b class="down">−${fmt(repair)}¢</b><span class="tot">Net</span><b class="tot ${net>=0?'up':'down'}">${net>=0?'+':''}${fmt(net)}¢</b></div>
 <table class="t"><tr><th>Bot</th><th>Dmg</th><th>KO</th><th>Rep</th><th>Total</th></tr><tr class="grp"><td colspan="5">${esc(S.team)}</td></tr>${my.map(line).join('')}<tr class="grp"><td colspan="5">${esc(P.team)}</td></tr>${en.map(line).join('')}</table>
 ${my.some(r=>r.rankUp)?'<div class="small" style="color:var(--amber);margin-top:8px">Spend new perk points in the Garage.</div>':''}
 <button class="btn primary" style="width:100%;margin-top:14px" id="contBtn">Continue</button>`,true);
 $('#contBtn').onclick=()=>{closeDlg();endBattle();show('career')};
}

// ================= garage =================
function renderGarage(){
 $('#garageBody').innerHTML=`<div class="row"><h2 class="grow">Garage</h2><span class="dim small">${S.bots.length}/8 bots</span></div>
 <div class="row" style="margin-top:10px"><button class="btn small" id="testBtn">⌖ Test range</button><span class="small dim grow">Free practice. No rewards, no repairs.</span></div><div class="sect">Your bots</div><div class="bots">${S.bots.map(b=>{const o=compute(b),ep=epithet(b);return `<button class="card bot" data-id="${b.id}"><canvas data-b="${b.id}"></canvas><div class="grow">
  <div class="nm">${esc(b.name)}</div>${ep?`<div class="ep">${esc(ep)}</div>`:''}<div>${rankHtml(b.rep)} <span class="mono small dim">rep ${b.rep}</span></div>
  ${perkPts(b)>0?`<div class="small" style="color:var(--amber)">● ${perkPts(b)} perk point${perkPts(b)>1?'s':''} to spend</div>`:''}${S.nemesis[b.id]?`<div class="nem">☠ ${esc(S.nemesis[b.id].name)}</div>`:''}${(()=>{const r=buildAdvice(b,o).role;return r?`<div class="small" style="color:#9db8d8">${r[0]}</div>`:""})()}<div class="ln">${b.st.w}W-${b.st.m-b.st.w}L · ${b.st.k} KOs · ¢${fmt(o.value)}</div>${o.ok?`<div class="ln">${Math.round(o.hp)} HP · ${Math.round(o.dps)} DPS · ${Math.round(o.speed)} SPD</div>`:`<div class="warnline">${esc(o.warn[0])}</div>`}</div></button>`}).join('')}
 ${S.bots.length<8?'<button class="card bot add" id="newBot">+ BUILD NEW BOT</button>':''}</div>
 <div class="sect">Spare parts</div><div class="dim small">${Object.values(S.inv).filter(p=>!p.on).length} parts in storage. Buy and sell in the Parts tab.</div>`;
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
function slotRow(label,id,key,idx,extra='',hint=''){const p=id&&S.inv[id];return `<button class="slot ${p?'':'empty'}" data-k="${key}" data-i="${idx??''}"><canvas data-p="${p?p.id:''}"></canvas><div class="grow"><div class="lbl">${label} ${extra}</div><div class="pn" style="${p&&p.t>1?'color:'+TIERS[p.t].col:''}">${p?esc(partName(p)):'Empty · tap to add'}</div>${p&&Object.keys(p.af).length?`<div class="af">${affixText(p).join(' · ')}</div>`:''}${p?`<div class="chips2">${partLine(p,true)}</div>`:hint?`<div class="small dim">${hint}</div>`:''}</div><span class="dim">›</span></button>`}
function renderBuilder(){
 const b=BB,o=compute(b),F=o.F,ep=epithet(b),y=$('#builder').scrollTop;
 const st=(lbl,v,max,disp,tip)=>`<div class="stat" title="${tip||''}"><div class="k"><span>${lbl}</span><b>${disp??Math.round(v)}</b></div><div class="bar"><i style="width:${Math.min(100,v/max*100)}%"></i></div></div>`;
 const meter=(lbl,a,bv,help)=>{const r=bv?a/bv:0;return `<div class="meter"><div class="k"><span>${lbl} <span class="dim">· ${help}</span></span><b>${Math.round(a)} / ${Math.round(bv)}</b></div><div class="bar ${r>1?'over':r>.9?'warn':''}"><i style="width:${Math.min(100,r*100)}%"></i></div></div>`};
 const res=o.res||{},pts=perkPts(b);
 const tabs=[['loadout','Loadout'],['tactics','Tactics'],['perks','Perks'+(pts?` <span class="dotn">${pts}</span>`:'')],['paint','Paint'],['record','Record']];
 let body='';
 if(BTAB==='loadout'){body=`<div class="sect" style="margin-top:0">Core systems</div>
  ${slotRow('Frame',b.frame,'frame',null,'','Sets HP, load limit, mounts and bays')}${slotRow('Drive',b.drive,'drive',null,'','Wheels, treads, legs, hover or omni')}${slotRow('Power core',b.core,'core',null,'','Powers weapons and modules')}${slotRow('Armor',b.armor,'armor',null,'<span class="opt-l">optional</span>','Cuts incoming damage')}${slotRow('AI chip',b.chip,'chip',null,'','Reaction speed and aim')}
  ${F?`<div class="sect">Hardpoints</div><div class="legend">${szBadge('S')} small weapons · ${szBadge('M')} small or medium · ${szBadge('L')} any size</div>
  ${F.mounts.map((m,i)=>slotRow('Mount '+(i+1),b.weps[i],'weps',i,szBadge(m[0]),'Takes '+SZFITS[m[0]])).join('')}
  <div class="sect">Utility bays</div>${Array.from({length:F.util},(_,i)=>slotRow('Bay '+(i+1),b.utils[i],'utils',i,'<span class="opt-l">optional</span>','Shields, repair, boosters, drones…')).join('')}`:'<div class="empty" style="margin-top:10px">Install a frame first. It decides how many weapons and modules the bot can carry.</div>'}`}
 else if(BTAB==='tactics'){body=`<div class="sect" style="margin-top:0">Behavior <span class="dim small" style="letter-spacing:0;text-transform:none">how it moves</span></div><div class="optgrid">${Object.entries(BEHAVIORS).map(([k,v])=>`<button class="opt ${b.ai.beh===k?'on':''}" data-beh="${k}"><b>${v.n}</b><small>${v.d}</small></button>`).join('')}</div>
  <div class="sect">Targeting <span class="dim small" style="letter-spacing:0;text-transform:none">who it shoots</span></div><div class="optgrid">${Object.entries(TARGETS).map(([k,v])=>`<button class="opt ${b.ai.tgt===k?'on':''}" data-tgt="${k}"><b>${v.n}</b><small>${v.d}</small></button>`).join('')}</div>
  <div class="sect">Fine tuning</div>
  <div class="slider"><span class="dim" style="width:120px">Engage distance</span><input type="range" min="50" max="110" value="${Math.round(b.ai.eng*100)}" id="sEng"><b id="vEng">${Math.round(b.ai.eng*100)}%</b></div><div class="small dim">How close it fights, as a share of its weapon range. Lower means more aggressive.</div>
  <div class="slider"><span class="dim" style="width:120px">Retreat below</span><input type="range" min="0" max="60" value="${Math.round(b.ai.ret*100)}" id="sRet"><b id="vRet">${Math.round(b.ai.ret*100)}% HP</b></div><div class="small dim">Below this HP it backs off and looks for repair kits. 0% means it never retreats.</div>`}
 else if(BTAB==='perks'){const i=rankIdx(b.rep),nx=RANKS[i+1];body=`<div class="card" style="margin-bottom:10px"><div class="row"><div class="grow">${rankHtml(b.rep)} <span class="mono small dim">rep ${b.rep}</span><div class="small dim">${nx?`Next rank: <b style="color:${nx[2]}">${nx[1]}</b> at ${nx[0]} rep`:'Highest rank reached'}</div></div><div style="text-align:right"><div class="mono" style="font-size:22px;color:var(--amber)">${pts}</div><div class="small dim">point${pts===1?'':'s'}</div></div></div>${nx?`<div class="bar" style="margin-top:8px"><i style="width:${Math.min(100,(b.rep-RANKS[i][0])/(nx[0]-RANKS[i][0])*100)}%;background:var(--amber)"></i></div>`:''}</div>
  <div class="small dim" style="margin-bottom:8px">Each new rank gives one perk point. Tap a perk to learn it.</div>
  <div class="optgrid">${Object.entries(PERKS).map(([k,v])=>{const has=b.perks.includes(k),can=!has&&pts>0;return `<button class="opt perk ${has?'on':can?'':'lock'}" data-perk="${k}"><span class="ic">${v.i}</span><b>${v.n}${has?' ✓':''}</b><small>${v.d}</small></button>`}).join('')}</div>
  ${b.perks.length?`<button class="btn small" style="margin-top:8px" id="pReset">Reset perks · ¢${fmt(250*b.perks.length)}</button>`:''}`}
 else if(BTAB==='paint'){body=`<div class="small dim" style="margin-bottom:5px">Primary</div><div class="swatches">${PAINTS.map(c=>`<button class="sw ${b.paint.p===c?'on':''}" data-pp="${c}" style="background:${c}"></button>`).join('')}</div>
  <div class="small dim" style="margin:12px 0 5px">Secondary</div><div class="swatches">${PAINTS.map(c=>`<button class="sw ${b.paint.s===c?'on':''}" data-ps="${c}" style="background:${c}"></button>`).join('')}</div>
  <div class="small dim" style="margin:12px 0 5px">Finish</div><div class="chips">${Object.entries(FINISHES).map(([k,v])=>`<button class="chip ${b.paint.fin===k?'on':''}" data-fin="${k}">${v}</button>`).join('')}</div>
  <div class="slider"><span class="dim" style="width:120px">Hull number</span><input type="range" min="0" max="99" value="${b.paint.num||0}" id="sNum"><b id="vNum">${b.paint.num||0}</b></div>`}
 else{body=`${S.nemesis[b.id]?`<div class="nem" style="margin-bottom:8px;font-size:13px">☠ Nemesis: ${esc(S.nemesis[b.id].name)} of ${esc(S.nemesis[b.id].team)}. Destroy it for +25 rep.</div>`:''}
  <div class="recgrid">${[['Matches',b.st.m],['Wins',b.st.w],['KOs',b.st.k],['Deaths',b.st.d],['MVP',b.st.mvp],['Damage',fmt(b.st.dmg)],['Best streak',b.st.best||0],['Value','¢'+fmt(o.value||0)]].map(([k,v])=>`<div><b class="mono">${v}</b><span>${k}</span></div>`).join('')}</div>
  ${b.titles.length?`<div style="margin-top:10px">${[...new Set(b.titles)].map(t=>`<span class="trophy" style="display:inline-block;margin:2px">🏆 ${esc(t)}${b.titles.filter(x=>x===t).length>1?' ×'+b.titles.filter(x=>x===t).length:''}</span>`).join('')}</div>`:''}
  ${(b.hist||[]).length?`<div class="sect">Recent matches</div><div class="card log">${b.hist.slice().reverse().slice(0,8).map(h=>`<div><span class="${h.win?'up':'down'}">${h.win?'W':'L'}</span><span class="grow">vs ${esc(h.vs)}</span><span class="mono dim">${h.k} KO · ${h.dmg} dmg</span><span class="mono ${h.rep>=0?'up':'down'}">${h.rep>=0?'+':''}${h.rep}</span></div>`).join('')}</div>`:'<div class="empty" style="margin-top:10px">No matches yet.</div>'}
  <div class="row" style="margin-top:16px"><button class="btn danger small" id="bRetire">${b.st.m?'Retire to Hall of Fame':'Scrap bot'}</button><span class="small dim grow">All parts go back to storage.</span></div>`}
 $('#builder').innerHTML=`<div class="bhead"><button class="btn small" id="bBack">‹ Done</button><input id="bName" maxlength="16" value="${esc(b.name)}"><button class="btn small" id="bHelp">?</button></div>
 <div class="wrap"><div class="bgrid"><div class="bstick">
  <canvas id="bPrev"></canvas>
  <div class="row" style="margin-top:8px"><div class="grow">${rankHtml(b.rep)} <span class="mono small dim">rep ${b.rep}</span>${ep?` <span class="small" style="color:var(--amber);font-style:italic">${esc(ep)}</span>`:''}</div><span class="mono small" style="color:var(--amber)">¢${fmt(o.value||0)}</span></div>
  <div class="stats">${st('HP',o.hp||0,800)}${st('Armor',(o.arPct||0)*100,60,Math.round((o.arPct||0)*100)+'%')}${st('Speed',o.speed||0,200)}${st('DPS',o.dps||0,140)}${st('Range',o.range||0,700,o.range?Math.round(o.range):o.melee?'melee':'—')}${st('Turn',(o.turn||0),10,(o.turn||0).toFixed(1))}</div>
  ${F?meter('Weight',o.weight,o.load,'must stay under load')+meter('Power',o.draw,o.pow,'draw vs core output'):''}
  ${F&&(res.kinetic||res.explosive||res.energy||res.thermal||o.abl)?`<div class="chips2" style="margin-top:6px">${['kinetic','explosive','energy','thermal'].filter(k=>res[k]).map(k=>ch(k.toUpperCase()+' RES',Math.round(res[k]*100)+'%')).join('')}${o.abl?ch('SOAK',Math.round(o.abl)):''}</div>`:''}
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
 if($('#sRet')){$('#sRet').oninput=e=>{b.ai.ret=e.target.value/100;$('#vRet').textContent=e.target.value+'% HP'};$('#sRet').onchange=persist}
 if($('#sNum')){$('#sNum').oninput=e=>{b.paint.num=+e.target.value;$('#vNum').textContent=e.target.value};$('#sNum').onchange=()=>{persist();renderBuilder()}}
 if($('#bRetire'))$('#bRetire').onclick=()=>confirmBox(b.st.m?'Retire '+b.name+'?':'Scrap '+b.name+'?',b.st.m?'Its record and reputation go to the Hall of Fame. All parts return to storage.':'All parts return to storage.',b.st.m?'Retire':'Scrap',()=>{
  S.bots=S.bots.filter(x=>x!==b);if(b.st.m)S.retired.push({name:b.name,rep:b.rep,st:b.st,titles:b.titles,paint:b.paint,ret:S.matches});syncEquip();persist();closeBuilder()});
 afterPaint(()=>$$('#builder canvas[data-p]').forEach(c=>{const p=S.inv[c.dataset.p];if(p)partIcon(c,p,b.paint);else{const x=c.getContext('2d');c.width=c.clientWidth*2;c.height=c.clientHeight*2;x.fillStyle='#0d1116';x.fillRect(0,0,c.width,c.height);x.strokeStyle='#2a3340';x.lineWidth=2;x.setLineDash([5,5]);x.strokeRect(5,5,c.width-10,c.height-10);x.fillStyle='#3a4656';x.font='600 34px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('+',c.width/2,c.height/2+2)}}));
}
// ================= part picker =================
const SLOTCAT={frame:'frame',drive:'drive',core:'core',armor:'armor',chip:'chip',weps:'weapon',utils:'util'};
function openPicker(key,idx){
 const b=BB,cat=SLOTCAT[key],cur=key==='weps'||key==='utils'?b[key][idx]:b[key];
 const mountSz=key==='weps'?SZ[FRAMES[S.inv[b.frame].k].mounts[idx][0]]:3;
 const fits=k=>cat!=='weapon'||WEAPONS[k].sz<=mountSz;
 const own=Object.values(S.inv).filter(p=>p.c===cat&&fits(p.k)&&p.id!==cur).sort((x,y)=>(x.on?1:0)-(y.on?1:0)||partValue(y)-partValue(x));
 const cats=Object.keys(CATS[cat]).filter(fits).sort((x,y)=>CATS[cat][x].lv-CATS[cat][y].lv||CATS[cat][x].cost-CATS[cat][y].cost);
 const big=cat==='weapon'?Object.keys(WEAPONS).filter(k=>!fits(k)):[];
 const optional=key!=='frame'&&key!=='drive'&&key!=='core'&&key!=='chip';
 const row=(p,right,cls='',attrs='')=>`<button class="prow ${cls}" ${attrs}><canvas data-pi="${p.id||''}" data-ck="${p.k}" data-ct="${p.t||1}"></canvas><div class="grow"><div class="pn" style="${p.t>1?'color:'+TIERS[p.t].col:''}">${esc(p.id?partName(p):baseOf(p).n)}</div>${p.af&&Object.keys(p.af).length?`<div class="af">${affixText(p).join(' · ')}</div>`:''}<div class="chips2">${partLine(p)}</div></div><div class="pr">${right}</div></button>`;
 const title=cat==='weapon'?`Weapon for Mount ${idx+1} ${szBadge(mountSz)}`:CATNAME[cat];
 const body=openSheet(`<div class="sheet-h"><h3 class="grow">${title}</h3><span class="pill cr">¢ ${fmt(S.credits)}</span><button class="btn small ghost" onclick="closeSheet()">✕</button></div>
 ${cat==='weapon'?`<div class="legend" style="margin-bottom:8px">This mount takes ${SZFITS['SML'[mountSz-1]]}.</div>`:''}
 ${cur?`<div class="small dim" style="margin-bottom:6px">Installed now</div>${row(S.inv[cur],optional?'<span class="btn small">Remove</span>':'',' ','data-rm="1"')}`:''}
 <div class="sect">Your parts</div>${own.length?own.map(p=>row(p,p.on?`<span class="dim small">swap from<br>${esc(S.bots.find(x=>x.id===p.on)?.name||'?')}</span>`:'<span class="btn small primary">Install</span>','',`data-own="${p.id}"`)).join(''):'<div class="empty">No spare parts that fit. Buy one below.</div>'}
 <div class="sect">Buy new · Mk I</div>${cats.map(k=>{const B=CATS[cat][k],lock=B.lv>S.unlocked,cant=!lock&&S.credits<B.cost;return row({c:cat,k,t:1,af:{}},lock?`<span class="small">🔒 ${LEAGUES[B.lv].n}</span>`:`<span class="btn small">¢${fmt(B.cost)}</span>`,lock?'locked':cant?'cant':'',lock?'':`data-buy="${k}"`)}).join('')}
 ${big.length?`<div class="sect">Too big for this mount</div><div class="small dim" style="margin-bottom:6px">These need a bigger mount. Frames like Rhino, Viper, Golem and Citadel have ${szBadge('L')} mounts.</div>${big.map(k=>row({c:cat,k,t:1,af:{}},`<span class="small">needs ${szBadge(WEAPONS[k].sz)}</span>`,'locked')).join('')}`:''}
 <div class="small dim" style="margin-top:8px">Better versions (Mk II–IV) with bonus affixes show up in the Parts market.</div>`);
 const install=id=>{equip(b,key,idx,id);sfx('buy');closeSheet();renderBuilder()};
 body.querySelectorAll('[data-own]').forEach(el=>el.onclick=()=>install(el.dataset.own));
 body.querySelectorAll('[data-buy]').forEach(el=>el.onclick=()=>{const k=el.dataset.buy;if(S.credits<CATS[cat][k].cost)return toast('Not enough credits');const p=buyCatalog(cat,k);refreshTop();install(p.id)});
 const rm=body.querySelector('[data-rm]');if(rm&&optional)rm.onclick=()=>{if(key==='weps'||key==='utils')b[key][idx]=null;else b[key]=null;syncEquip();persist();closeSheet();renderBuilder()};
 afterPaint(()=>body.querySelectorAll('canvas[data-ck]').forEach(c=>{const p=c.dataset.pi?S.inv[c.dataset.pi]:{c:cat,k:c.dataset.ck,t:1,af:{}};partIcon(c,p,b.paint)}));
}
function equip(b,key,idx,id){const p=S.inv[id];if(p.on&&p.on!==b.id){const ob=S.bots.find(x=>x.id===p.on);if(ob)unequipPart(ob,id)}else if(p.on===b.id)unequipPart(b,id);
 if(key==='weps'||key==='utils')b[key][idx]=id;else b[key]=id;if(key==='frame')fitFrame(b);syncEquip();persist()}
function unequipPart(b,id){for(const k of ['frame','drive','core','armor','chip'])if(b[k]===id)b[k]=null;b.weps=b.weps.map(x=>x===id?null:x);b.utils=b.utils.map(x=>x===id?null:x);if(!b.frame){b.weps=[];b.utils=[]}}
function fitFrame(b){const F=FRAMES[S.inv[b.frame].k];b.weps=F.mounts.map((m,i)=>{const id=b.weps[i];return id&&S.inv[id]&&WEAPONS[S.inv[id].k].sz<=SZ[m[0]]?id:null});b.utils=Array.from({length:F.util},(_,i)=>b.utils[i]||null)}

// ================= shop =================
let SHOPTAB='market',SHOPCAT='weapon';
function renderShop(){
 const tabs=`<div class="tabs">${[['market','Market'],['catalog','Catalog'],['workshop','Workshop'],['storage','Storage']].map(([k,n])=>`<button class="${SHOPTAB===k?'on':''}" data-st="${k}">${n}</button>`).join('')}</div>`;
 const catChips=`<div class="chips" style="margin-bottom:10px">${Object.keys(CATS).map(c=>`<button class="chip ${SHOPCAT===c?'on':''}" data-sc="${c}">${CATNAME[c]}</button>`).join('')}</div>`;
 const row=(p,right,attrs='',cls='')=>`<div class="prow ${cls}" ${attrs}><canvas data-pi="${p.id||''}" data-ck="${p.k}" data-cc="${p.c}"></canvas><div class="grow"><div class="pn" style="${p.t>1?'color:'+TIERS[p.t].col:''}">${esc(p.id?partName(p):baseOf(p).n)} ${p.t>1?`<span class="tag" style="color:${TIERS[p.t].col}">${TIERS[p.t].n}</span>`:''}</div>${Object.keys(p.af||{}).length?`<div class="af">${affixText(p).join(' · ')}</div>`:''}<div class="st">${CATNAME[p.c]}${p.on?' · on '+esc(S.bots.find(x=>x.id===p.on)?.name||''):''}</div><div class="chips2">${partLine(p)}</div></div>${right}</div>`;
 let html=`<h2>Parts</h2><div style="height:10px"></div>`+tabs;
 if(SHOPTAB==='market'){html+=`<div class="row small dim" style="margin-bottom:8px"><span class="grow">Rare stock with random affixes. Restocks after every match.</span><button class="btn small" id="reroll" ${S.credits<150?'disabled':''}>Restock ¢150</button></div>`+(S.market.length?S.market.map((p,i)=>row(p,`<button class="btn small ${S.credits<partValue(p)?'':'primary'}" data-bm="${i}" ${S.credits<partValue(p)?'disabled':''}>¢${fmt(partValue(p))}</button>`)).join(''):'<div class="empty">Sold out. Restock or play a match.</div>')}
 else if(SHOPTAB==='catalog'){const crow=k=>{const B=CATS[SHOPCAT][k],lock=B.lv>S.unlocked;return row({c:SHOPCAT,k,t:1,af:{}},lock?`<span class="small dim">🔒 ${LEAGUES[B.lv].n}</span>`:`<button class="btn small" data-bc="${k}" ${S.credits<B.cost?'disabled':''}>¢${fmt(B.cost)}</button>`,'',lock?'locked':'')};
  const keys=Object.keys(CATS[SHOPCAT]).sort((x,y)=>CATS[SHOPCAT][x].lv-CATS[SHOPCAT][y].lv||CATS[SHOPCAT][x].cost-CATS[SHOPCAT][y].cost);
  html+=catChips+(SHOPCAT==='weapon'?[1,2,3].map(z=>`<div class="sect">${szBadge(z)} ${SZNAME[z]} weapons</div><div class="small dim" style="margin:-4px 0 8px">Fit ${z===1?'any mount (S, M or L)':z===2?'M or L mounts':'L mounts only'}.</div>`+keys.filter(k=>WEAPONS[k].sz===z).map(crow).join('')).join(''):keys.map(crow).join(''))}
 else if(SHOPTAB==='workshop'){const all=Object.values(S.inv).sort((a,b)=>(b.on?1:0)-(a.on?1:0)||b.t-a.t||partValue(b)-partValue(a));
  html+=`<div class="small dim" style="margin-bottom:8px">Upgrade a part one tier (it gains a new random affix) or reroll its affixes. Works on installed parts too.</div>`+all.map(p=>{const uc=upgradeCost(p),rc=Object.keys(p.af).length?rerollCost(p):0;
   return row(p,`<div style="display:flex;flex-direction:column;gap:5px;align-items:stretch">${uc?`<button class="btn small ${S.credits>=uc?'primary':''}" data-up="${p.id}" ${S.credits<uc?'disabled':''}>▲ ${TIERS[p.t+1].mk} ¢${fmt(uc)}</button>`:'<span class="small" style="color:var(--amber)">Max tier</span>'}${rc?`<button class="btn small" data-rr="${p.id}" ${S.credits<rc?'disabled':''}>⟳ ¢${fmt(rc)}</button>`:''}</div>`,p.on?'':'')+(p.on?'':'')}).join('')}
 else{const spare=Object.values(S.inv).filter(p=>!p.on).sort((a,b)=>a.c.localeCompare(b.c)||partValue(b)-partValue(a));html+=`<div class="small dim" style="margin-bottom:8px">Unequipped parts. Sell for 50% of value.</div>`+(spare.length?spare.map(p=>row(p,`<button class="btn small" data-sell="${p.id}">Sell ¢${fmt(partValue(p)*.5)}</button>`)).join(''):'<div class="empty">Storage is empty.</div>')}
 $('#shopBody').innerHTML=html;
 $$('[data-st]').forEach(b=>b.onclick=()=>{SHOPTAB=b.dataset.st;renderShop()});$$('[data-sc]').forEach(b=>b.onclick=()=>{SHOPCAT=b.dataset.sc;renderShop()});
 $$('[data-bm]').forEach(b=>b.onclick=()=>{const p=buyMarket(+b.dataset.bm);if(p){sfx('buy');toast('Bought '+partName(p));refreshTop();renderShop()}});
 $$('[data-bc]').forEach(b=>b.onclick=()=>{const p=buyCatalog(SHOPCAT,b.dataset.bc);if(p){toast('Bought '+partName(p));refreshTop();renderShop()}});
 $$('[data-sell]').forEach(b=>b.onclick=()=>{const p=S.inv[b.dataset.sell];sellPart(p.id);toast('Sold '+partName(p));refreshTop();renderShop()});
 $$('[data-up]').forEach(b=>b.onclick=()=>{const p=S.inv[b.dataset.up];if(upgradePart(p)){sfx('level');toast(partName(p)+': '+affixText(p).slice(-1)[0]);refreshTop();renderShop()}});
 $$('[data-rr]').forEach(b=>b.onclick=()=>{const p=S.inv[b.dataset.rr];if(rerollPart(p)){sfx('buy');toast(affixText(p).join(' · '));refreshTop();renderShop()}});
 if($('#reroll'))$('#reroll').onclick=()=>{S.credits-=150;refreshMarket();persist();refreshTop();renderShop()};
 afterPaint(()=>$$('#shopBody canvas[data-ck]').forEach(c=>{const p=c.dataset.pi?(S.inv[c.dataset.pi]||S.market.find(m=>m.id===c.dataset.pi)):{c:c.dataset.cc,k:c.dataset.ck,t:1,af:{}};if(p)partIcon(c,p)}));
}
// ================= records =================
let RECTAB='board';
function renderRecords(){
 const tabs=`<div class="tabs">${[['board','Leaderboard'],['hof','Hall of Fame']].map(([k,n])=>`<button class="${RECTAB===k?'on':''}" data-rt="${k}">${n}</button>`).join('')}</div>`;
 let html=`<h2>Records</h2><div style="height:10px"></div>`+tabs;
 if(RECTAB==='board'){
  const all=[...S.bots.map(b=>({n:b.name,t:S.team,rep:b.rep,st:b.st,me:1,ep:epithet(b)}))];
  for(const [tn,t] of Object.entries(S.rivals))if(t.li<=Math.min(4,S.unlocked+1))t.bots.forEach(b=>all.push({n:b.name,t:tn,rep:b.rep,st:b.st,ep:epithet(b)}));
  all.sort((a,b)=>b.rep-a.rep);
  html+=`<div class="small dim" style="margin-bottom:6px">Every bot in the leagues you can see, ranked by reputation.</div><table class="t"><tr><th>#</th><th style="text-align:left">Bot</th><th>Rep</th><th>W-L</th><th>KO</th></tr>${all.slice(0,60).map((b,i)=>`<tr class="${b.me?'me':''}"><td class="mono">${i+1}</td><td style="text-align:left;font-family:'Chakra Petch'"><b>${esc(b.n)}</b>${b.ep?` <i class="small" style="color:var(--amber)">${esc(b.ep)}</i>`:''}<div class="small dim" style="font-weight:500">${esc(b.t)} · ${rankHtml(b.rep)}</div></td><td>${b.rep}</td><td>${b.st.w}-${b.st.m-b.st.w}</td><td>${b.st.k}</td></tr>`).join('')}</table>`}
 else{html+=S.retired.length?`<div class="bots">${S.retired.slice().sort((a,b)=>b.rep-a.rep).map(b=>`<div class="card"><div class="nm" style="font-weight:700;font-size:16px">${esc(b.name)} ${rankHtml(b.rep)}</div><div class="small" style="color:var(--amber);font-style:italic">${esc(epithet(b))}</div><div class="small dim">rep ${b.rep} · ${b.st.w}W-${b.st.m-b.st.w}L · ${b.st.k} KOs · ${b.st.mvp} MVP · ${fmt(b.st.dmg)} dmg</div>${b.titles.length?`<div class="small" style="margin-top:4px">🏆 ${[...new Set(b.titles)].map(esc).join(', ')}</div>`:''}</div>`).join('')}</div>`:'<div class="empty">Retire a veteran bot from the Garage to enshrine it here.</div>'}
 $('#recordsBody').innerHTML=html;$$('[data-rt]').forEach(b=>b.onclick=()=>{RECTAB=b.dataset.rt;renderRecords()});
}
// ================= boot =================
function showIntro(){$$('.screen').forEach(s=>s.classList.remove('on'));$('#intro').classList.add('on');$('#nav').style.display='none';$('#topbar').style.display='none'}
$('#introImp').onclick=importSave;
$('#startCareer').onclick=()=>{newCareer(($('#teamName').value||'').trim().slice(0,22)||'Garage Rats');show('career');showTutorial(0)};
$('#helpTop').onclick=()=>openHelp();
$$('.sndBtn').forEach(b=>b.onclick=e=>{e.stopPropagation();audioInit();setSound(!SND.on)});setSound(SND.on);
document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.classList.contains('sndBtn'))sfx('click')});
S=loadSave();if(S)show('career');else showIntro();

// ================= test range =================
let TR={bot:null,opp:'dummy',mate:null,map:'pillars',mod:null};
function openTestRange(){const ready=S.bots.filter(b=>compute(b).ok);if(!ready.length)return toast('Build a battle-ready bot first');if(!TR.bot||!ready.find(b=>b.id===TR.bot))TR.bot=ready[0].id;renderTR()}
function renderTR(){const ready=S.bots.filter(b=>compute(b).ok),others=ready.filter(b=>b.id!==TR.bot);if(TR.opp==='mate'&&!others.length)TR.opp='dummy';if(TR.opp==='mate'&&!others.find(b=>b.id===TR.mate))TR.mate=others[0]?.id;
 const b=openSheet(`<div class="sheet-h"><h3 class="grow">⌖ Test range</h3><button class="btn small ghost" onclick="closeSheet()">✕</button></div>
 <div class="sect" style="margin-top:0">Test bot</div><div class="chips">${ready.map(x=>`<button class="chip ${TR.bot===x.id?'on':''}" data-tb="${x.id}">${esc(x.name)}</button>`).join('')}</div>
 <div class="sect">Opponent</div><div class="optgrid">${[['dummy','Target dummy','Armored, unarmed, stationary. 30-second DPS test.'],['spar','League sparring partner','A random '+LEAGUES[S.league].n+' bot.'],['mate','Squad mate','Fight one of your own bots.']].map(([k,n,d])=>`<button class="opt ${TR.opp===k?'on':''}" data-to="${k}" ${k==='mate'&&!others.length?'disabled':''}><b>${n}</b><small>${d}</small></button>`).join('')}</div>
 ${TR.opp==='mate'?`<div class="chips" style="margin-top:8px">${others.map(x=>`<button class="chip ${TR.mate===x.id?'on':''}" data-tm="${x.id}">${esc(x.name)}</button>`).join('')}</div>`:''}
 <div class="sect">Arena</div><div class="chips">${Object.entries(MAPS).map(([k,m])=>`<button class="chip ${TR.map===k?'on':''}" data-tmap="${k}">${m.n}</button>`).join('')}</div>
 <div class="sect">Conditions</div><div class="chips"><button class="chip ${!TR.mod?'on':''}" data-tmod="">Standard</button>${Object.entries(MODIFIERS).map(([k,m])=>`<button class="chip ${TR.mod===k?'on':''}" data-tmod="${k}">${m.i} ${m.n}</button>`).join('')}</div>
 <button class="btn primary" style="width:100%;margin-top:14px" id="trGo">Start test</button>`);
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
 openSheet(`<h3 style="text-align:center">Test results</h3><div class="dim small" style="text-align:center">${Math.floor(Gm.t)}s · ${MAPS[TR.map].n}${TR.mod?' · '+MODIFIERS[TR.mod].n:''}</div>
 <div class="money">${me.map(b=>`<span>${esc(b.name)} damage dealt</span><b>${fmt(b.st.dmg)}</b><span>Average DPS</span><b>${(b.st.dmg/t).toFixed(1)}</b><span>Damage taken</span><b>${fmt(b.st.taken)}</b><span>Result</span><b>${TR.opp==='dummy'?'—':Gm.winner===0?'Win':'Loss'}</b>`).join('')}</div>
 <div class="small dim">Test matches never change credits, reputation or records.</div>
 <div class="row" style="margin-top:12px"><button class="btn grow" id="trBack">Garage</button><button class="btn primary grow" id="trAgain">Run again</button></div>`,true);
 $('#trBack').onclick=()=>{closeDlg();endBattle();show('garage')};$('#trAgain').onclick=()=>{closeDlg();endBattle();startTest()}}

// ================= save backup =================
function saveCode(){return 'BA4:'+btoa(unescape(encodeURIComponent(JSON.stringify(S))))}
function exportSave(){const code=saveCode();const b=openSheet(`<h3>Export save</h3><p class="small dim" style="margin:6px 0 10px">Copy this code and paste it into Import on the other copy of the game.</p>
 <textarea id="saveTxt" readonly style="width:100%;height:120px;background:#0b0f14;color:var(--text);border:1px solid var(--line);border-radius:8px;padding:8px;font:11px 'JetBrains Mono',monospace;word-break:break-all">${code}</textarea>
 <div class="row" style="margin-top:10px"><button class="btn grow" onclick="closeDlg()">Close</button><button class="btn primary grow" id="copyBtn">Copy</button></div>`,true);
 $('#copyBtn').onclick=async()=>{const t=$('#saveTxt');t.select();t.setSelectionRange(0,code.length);let ok=false;try{await navigator.clipboard.writeText(code);ok=true}catch(e){try{ok=document.execCommand('copy')}catch(e2){}}toast(ok?'Save code copied':'Select the text and copy it manually')}}
function importSave(){openSheet(`<h3>Import save</h3><p class="small dim" style="margin:6px 0 10px">Paste a save code. This replaces the career on this device.</p>
 <textarea id="impTxt" style="width:100%;height:120px;background:#0b0f14;color:var(--text);border:1px solid var(--line);border-radius:8px;padding:8px;font:11px 'JetBrains Mono',monospace"></textarea>
 <div class="row" style="margin-top:10px"><button class="btn grow" onclick="closeDlg()">Cancel</button><button class="btn primary grow" id="doImp">Import</button></div>`,true);
 $('#doImp').onclick=()=>{try{const raw=$('#impTxt').value.trim().replace(/^BA[0-9]:/,'');const s=JSON.parse(decodeURIComponent(escape(atob(raw))));if(!s||s.v!==2||!s.bots)throw 0;S=migrate(s);persist();closeDlg();toast('Career imported');show('career')}catch(e){toast('That code is not a valid save')}}}
