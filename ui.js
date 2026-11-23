'use strict';
// ================= shell =================
let TAB='career',SHEET_R=null,DLG_R=null;
const SCREENS={career:()=>renderCareer(),garage:()=>renderGarage(),shop:()=>renderShop(),records:()=>renderRecords()};
function hideAll(){$$('.screen').forEach(s=>s.classList.remove('on'))}
function show(tab){TAB=tab;hideAll();$('#'+tab).classList.add('on');document.body.classList.remove('titlemode');$('#nav').style.display='';$('#topbar').style.display='';
 $$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));refreshTop();SCREENS[tab]()}
$$('#nav button').forEach(b=>b.onclick=()=>show(b.dataset.tab));
function refreshTop(){if(!S)return;$('#tTeam').innerHTML=`${esc(S.team)}<small>${LEAGUES[S.league].n}${S.crowned?' · ♛×'+S.crowned:''} · Slot ${ACTIVE}</small>`;$('#tCred').textContent='¢ '+fmt(S.credits);$('#tFame').textContent='★ '+fmt(fame())}
function openSheet(html,center,fn,tall=true){const m=center?$('#dlgM'):$('#sheetM'),b=center?$('#dlg'):$('#sheet');b.className='sheet'+(tall?' tall':'');b.innerHTML=html;m.classList.add('on');if(center)DLG_R=fn||null;else SHEET_R=fn||null;return b}
function closeSheet(){$('#sheetM').classList.remove('on');SHEET_R=null}
function closeDlg(){$('#dlgM').classList.remove('on');DLG_R=null}
$('#sheetM').onclick=e=>{if(e.target.id==='sheetM')closeSheet()};
$('#dlgM').onclick=e=>{if(e.target.id==='dlgM'&&DLG_R!==showResults&&DLG_R!==renderTestEnd)closeDlg()};
function confirmBox(title,msg,yes,fn){openSheet(`<div class="sheet-h"><h3 class="grow">${esc(title)}</h3></div><p class="dim" style="margin:2px 0 16px">${msg}</p><div class="row"><button class="btn grow" id="cNo">Cancel</button><button class="btn danger grow" id="cYes">${esc(yes)}</button></div>`,true,null,false);
 $('#cNo').onclick=closeDlg;$('#cYes').onclick=()=>{closeDlg();fn()}}
function toast(msg){const d=document.createElement('div');d.className='toast';d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),2200)}
function rankHtml(rep){const r=rankOf(rep);return `<span class="rank" style="color:${r[2]}">${r[1]}</span>`}
function afterPaint(fn){requestAnimationFrame(()=>requestAnimationFrame(fn))}
function rerender(){if(!S&&!$('#title').classList.contains('on'))return;
 if($('#title').classList.contains('on'))renderTitle();else if($('#builder').classList.contains('on'))renderBuilder();else if(!$('#battle').classList.contains('on')&&SCREENS[TAB])SCREENS[TAB]();
 if($('#sheetM').classList.contains('on')&&SHEET_R)SHEET_R();if($('#dlgM').classList.contains('on')&&DLG_R)DLG_R()}
let rzT;addEventListener('resize',()=>{clearTimeout(rzT);rzT=setTimeout(rerender,160)});
// ---------- pager: fits a list into the space available, flips pages instead of scrolling ----------
const PG={};
const pbox=(id,cls='')=>`<div class="pbox ${cls}" id="${id}"><div class="plist"></div><div class="pctl"></div></div>`;
function pager(box,items,key,opt={}){if(typeof box==='string')box=$(box);if(!box)return;
 const list=box.querySelector('.plist'),ctl=box.querySelector('.pctl');
 if(!items.length){list.style.gridTemplateColumns='1fr';list.innerHTML=opt.empty?`<div class="empty">${opt.empty}</div>`:'';ctl.innerHTML='';return}
 const W=list.clientWidth||300,cols=opt.minW?Math.max(1,Math.floor((W+6)/(opt.minW+6))):1;list.style.gridTemplateColumns=`repeat(${cols},minmax(0,1fr))`;
 list.innerHTML=items[0];const ih=list.firstElementChild.getBoundingClientRect().height||56,H=list.clientHeight;
 const rows=Math.max(1,Math.floor((H+6)/(ih+6))),per=rows*cols,pages=Math.max(1,Math.ceil(items.length/per));
 const p=clamp(PG[key]||0,0,pages-1);PG[key]=p;list.innerHTML=items.slice(p*per,p*per+per).join('');
 ctl.innerHTML=pages>1?`<button class="pgb" data-d="-1" ${p?'':'disabled'}>‹</button><span class="mono">${p+1} / ${pages}</span><button class="pgb" data-d="1" ${p<pages-1?'':'disabled'}>›</button>`:'';
 const go=np=>{np=clamp(np,0,pages-1);if(np!==p){PG[key]=np;pager(box,items,key,opt)}};
 ctl.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>go(p+ +b.dataset.d));
 list.ontouchstart=e=>{list._x=e.touches[0].clientX;list._y=e.touches[0].clientY};
 list.ontouchend=e=>{if(list._x==null)return;const dx=e.changedTouches[0].clientX-list._x,dy=e.changedTouches[0].clientY-list._y;list._x=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4)go(p+(dx<0?1:-1))};
 if(opt.after)afterPaint(()=>opt.after(list));
}
const subtabs=(list,cur,attr)=>`<div class="subtabs">${list.map(([k,n])=>`<button class="${cur===k?'on':''}" data-${attr}="${k}">${n}</button>`).join('')}</div>`;

// ================= title / save slots =================
function famOf(s){return Math.round(s.bots.reduce((a,b)=>a+b.rep,0)+s.retired.reduce((a,b)=>a+b.rep*.5,0)+s.trophies.length*150)}
function showTitle(){if(S)persist();closeSheet();closeDlg();$('#builder').classList.remove('on');hideAll();$('#title').classList.add('on');document.body.classList.add('titlemode');$('#nav').style.display='none';$('#topbar').style.display='none';renderTitle()}
function renderTitle(){
 const slots=[1,2,3].map(n=>[n,readSlot(n)]);
 $('#slots').innerHTML=slots.map(([n,s])=>s?`<div class="slotc ${n===ACTIVE?'last':''}"><div class="sn">SLOT ${n}${n===ACTIVE?' · LAST PLAYED':''}</div><div class="st1">${esc(s.team)}</div>
  <div class="st2">${LEAGUES[s.league].n}${s.crowned?' · ♛×'+s.crowned:''} · ${s.matches} match${s.matches===1?'':'es'}</div>
  <div class="st3"><span class="cr">¢ ${fmt(s.credits)}</span><span class="fm">★ ${fmt(famOf(s))}</span><span>${s.bots.length} bot${s.bots.length===1?'':'s'}</span><span>🏆 ${s.trophies.length}</span></div>
  <div class="sa"><button class="btn primary grow" data-play="${n}">Continue</button><button class="btn" data-opts="${n}" title="Options">⋯</button></div></div>`
  :`<div class="slotc empty-s"><div class="sn">SLOT ${n}</div><div class="st1 dim">Empty slot</div><div class="st2">Start a new team from the Scrap League.</div><div class="sa"><button class="btn grow" data-new="${n}">+ New career</button><button class="btn" data-imp="${n}" title="Import a save code">⇩</button></div></div>`).join('');
 $$('#slots [data-play]').forEach(b=>b.onclick=()=>{ACTIVE=+b.dataset.play;S=readSlot(ACTIVE);persist();show('career')});
 $$('#slots [data-new]').forEach(b=>b.onclick=()=>newCareerDlg(+b.dataset.new));
 $$('#slots [data-imp]').forEach(b=>b.onclick=()=>importSave(+b.dataset.imp));
 $$('#slots [data-opts]').forEach(b=>b.onclick=()=>slotOpts(+b.dataset.opts));
 drawTitleArt();
}
function newCareerDlg(n){openSheet(`<div class="sheet-h"><h3 class="grow">New career · Slot ${n}</h3></div><label class="small dim">Team name</label><input id="ncName" class="tin" maxlength="22" value="Garage Rats"><p class="small dim" style="margin:8px 0 14px">You start in the Scrap League with ¢${fmt(STARTING_CREDITS)} and an empty garage. Build one strong bot or two basic ones.</p>
 <div class="row"><button class="btn grow" onclick="closeDlg()">Cancel</button><button class="btn primary grow" id="ncGo">Start</button></div>`,true,null,false);
 $('#ncGo').onclick=()=>{ACTIVE=n;newCareer(($('#ncName').value||'').trim().slice(0,22)||'Garage Rats');persist();closeDlg();show('career');showTutorial(0)}}
function slotOpts(n){const s=readSlot(n);openSheet(`<div class="sheet-h"><h3 class="grow">Slot ${n} · ${esc(s.team)}</h3><button class="btn small ghost" onclick="closeDlg()">✕</button></div>
 <div class="optlist"><button class="btn" id="soExp">Export save code</button><button class="btn" id="soImp">Import a save into this slot</button><button class="btn danger" id="soDel">Delete this career</button></div>`,true,null,false);
 $('#soExp').onclick=()=>exportSave(s);$('#soImp').onclick=()=>importSave(n);
 $('#soDel').onclick=()=>confirmBox('Delete '+s.team+'?','This erases the team, bots, parts and records in slot '+n+'. It cannot be undone.','Delete',()=>{deleteSlot(n);if(ACTIVE===n)S=null;renderTitle()})}
let TART=null;
function drawTitleArt(){const c=$('#tArt');if(!c)return;if(!TART){const inv={};let k=0;const P=(cc,kk,t=1)=>{const id='t'+(k++);inv[id]={id,c:cc,k:kk,t,af:{}};return id};
  TART={d:{name:'Hero',frame:P('frame','golem',4),drive:P('drive','treads'),core:P('core','reactor'),armor:P('armor','titanium'),chip:P('chip','neural'),weps:[P('weapon','cannon',4),P('weapon','lmg'),P('weapon','lmg')],utils:[],paint:{p:'#d9831f',s:'#1f2328',fin:'weathered',num:1},ai:{}},inv}}
 previewBot(c,TART.d,TART.inv,{angle:-Math.PI/2-.35,aim:-Math.PI/2-.55,zoom:1.15,floor:1})}

// ================= career hub =================
let PENDING=null;
function renderCareer(){
 const L=LEAGUES[S.league],opp=opponentFor(S.league,S.ladder),rv=S.rivals[opp],avg=Math.round(rv.bots.reduce((a,b)=>a+b.rep,0)/rv.bots.length);
 const ready=S.bots.filter(b=>compute(b).ok).length,purse=matchPurse({li:S.league,ladder:S.ladder,exh:false}),step=nextSteps()[0];
 const form=S.log.slice(0,5);
 $('#careerBody').innerHTML=`<div class="frame cgap">
 ${step?`<div class="stepc"><span class="si">${step[0]}</span><span class="grow">${step[1]}</span><button class="btn small" data-go="${step[3]}">${step[2]}</button></div>`:''}
 <div class="card"><div class="league"><div class="crest">${['⚙','⛓','⚒','♜','♛'][S.league]}</div><div class="grow"><div class="dim small caps">League ${S.league+1} of 5${S.crowned?' · defending crown':''}</div><h2>${L.n}</h2><div class="dim small">${L.sq} bots per side</div></div></div>
 <div class="ladder">${[0,1,2,3,4].map(i=>`<div class="${i<S.ladder?'done':i===S.ladder?'cur':''} ${i===4?'champ':''}"><b>${i===4?'♛ Final':'Match '+(i+1)}</b><span>${esc(opponentFor(S.league,i))}</span></div>`).join('')}</div></div>
 <div class="card nextm"><div class="dim small caps">${S.ladder>=4?'Championship final':'Match '+(S.ladder+1)} vs</div><div class="opp">${esc(opp)}</div>
  <div class="small dim">Avg reputation ${avg} · ${rankHtml(avg)} · Purse <b class="cr">¢${fmt(purse)}</b></div>
  ${ready?'':`<div class="warnline">${S.bots.length?'No bot is battle-ready. Fix one in the Garage.':'You have no bots yet. Build one in the Garage.'}</div>`}
  <div class="row" style="margin-top:12px"><button class="btn primary" style="flex:2" id="prepBtn" ${ready?'':'disabled'}>Prepare match</button><button class="btn" style="flex:1" id="exhBtn" ${ready?'':'disabled'} title="Practice for half pay">Exhibition</button></div></div>
 <div class="tiles"><button class="tile" id="tTro"><b>🏆 ${S.trophies.length}</b><span>Trophies</span></button>
  <button class="tile" id="tForm"><b class="form">${form.length?form.map(l=>`<i class="${l.win?'w':'l'}">${l.win?'W':'L'}</i>`).join(''):'—'}</b><span>Recent form</span></button>
  <button class="tile" id="tGuide"><b>?</b><span>How to play</span></button></div>
 </div>`;
 $('#prepBtn').onclick=()=>prepMatch(false);$('#exhBtn').onclick=()=>prepMatch(true);
 $$('#careerBody [data-go]').forEach(b=>b.onclick=()=>{if(b.dataset.go==='shop')SHOPTAB=/Storage/.test(b.textContent)?'storage':'market';show(b.dataset.go)});
 $('#tTro').onclick=()=>{RECTAB='trophies';show('records')};$('#tForm').onclick=()=>{RECTAB='history';show('records')};$('#tGuide').onclick=()=>openHelp();
}
function matchPurse(P){const L=LEAGUES[P.li];let p=L.purse*(1+.15*P.ladder)*(P.ladder>=4&&!P.exh?1.6:1)*(1+(P.li===4?.15*S.crowned:0));if(P.exh)p*=.5;return Math.round(p)}

function teamPower(units){let hp=0,dps=0;for(const u of units){hp+=u.o.hp;dps+=u.o.dps}return Math.sqrt(hp*dps)}

function wagerOdds(P){const mine=P.sel.map(id=>({o:compute(S.bots.find(b=>b.id===id))}));if(!mine.length)return 2;const r=teamPower(P.enemies)/Math.max(1,teamPower(mine));return Math.round(clamp(1.5*r+.4,1.2,4)*100)/100}

const HZNAME={slag:'slag pits',saw:'floor saws',ice:'ice'};
function arenaHazards(M){return [...new Set((M.hz||[]).map(h=>h[0]))].map(h=>HZNAME[h]).join(', ')}
function nemesisOf(team,name){return S.bots.filter(b=>S.nemesis[b.id]&&S.nemesis[b.id].team===team&&S.nemesis[b.id].name===name)}

function evalBounty(k,Gm,win,mvp){const my=Gm.bots.filter(u=>u.team===0),en=Gm.bots.filter(u=>u.team===1),alive=my.filter(u=>!u.dead);
 switch(k){case 'flawless':return win&&alive.length===my.length;case 'quick':return win&&Gm.t<40;case 'mvp':return mvp.team===0;case 'lone':return win&&alive.length===1;case 'dominant':return win&&alive.every(u=>u.hp/u.maxHp>.5);
  case 'giant':{const star=en.reduce((a,b)=>b.rep>a.rep?b:a);return star.dead&&star.killedBy&&star.killedBy.team===0}}return false}

function launch(){
 const P=PENDING;closeSheet();P.odds=wagerOdds(P);if(P.bet>S.credits)P.bet=0;
 const p=P.sel.map(id=>{const b=S.bots.find(x=>x.id===id);return {design:b,inv:S.inv,rec:b}});
 const e=P.enemies.map(x=>({design:x.design,inv:x.inv,rec:x.rb,o:x.o}));
 startBattle({p,e,map:P.map,mods:P.mod?[P.mod]:[],eTeam:P.team,title:P.ladder>=4&&!P.exh?'FINAL':'FIGHT',onEnd:finishMatch});
}

function equip(b,key,idx,id){const p=S.inv[id];if(p.on&&p.on!==b.id){const ob=S.bots.find(x=>x.id===p.on);if(ob)unequipPart(ob,id)}else if(p.on===b.id)unequipPart(b,id);
 if(key==='weps'||key==='utils')b[key][idx]=id;else b[key]=id;if(key==='frame')fitFrame(b);syncEquip();persist()}

function unequipPart(b,id){for(const k of ['frame','drive','core','armor','chip'])if(b[k]===id)b[k]=null;b.weps=b.weps.map(x=>x===id?null:x);b.utils=b.utils.map(x=>x===id?null:x);if(!b.frame){b.weps=[];b.utils=[]}}

function fitFrame(b){const F=FRAMES[S.inv[b.frame].k];b.weps=F.mounts.map((m,i)=>{const id=b.weps[i];return id&&S.inv[id]&&WEAPONS[S.inv[id].k].sz<=SZ[m[0]]?id:null});b.utils=Array.from({length:F.util},(_,i)=>b.utils[i]||null)}

function dummyUnit(){const inv={};let n=0;const P=(c,k)=>{const id='d'+(n++);inv[id]={id,c,k,t:1,af:{}};return id};
 const d={name:'Target Dummy',frame:P('frame','citadel'),drive:P('drive','treads'),core:P('core','battery'),armor:P('armor','steel'),chip:P('chip','basic'),weps:[],utils:[],paint:{p:'#e3b51c',s:'#1f2328',fin:'hazard',num:0},ai:{beh:'sentinel',tgt:'near',eng:1,ret:0}};
 return {design:d,inv,rec:{rep:0,name:'Target Dummy'},dummy:true}}

function startTest(){closeSheet();const me=S.bots.find(b=>b.id===TR.bot);const p=[{design:me,inv:S.inv,rec:{rep:me.rep}}];let e,eTeam='Test Range',limit=0;
 if(TR.opp==='dummy'){e=[dummyUnit()];limit=30;eTeam='Target Dummy'}
 else if(TR.opp==='mate'){const m=S.bots.find(b=>b.id===TR.mate);e=[{design:{...m,paint:{...m.paint}},inv:S.inv,rec:{rep:m.rep}}];eTeam=m.name}
 else{const L=LEAGUES[S.league],team=pick(L.teams),x=enemySquad(team,S.league,2,true)[0];e=[{design:x.design,inv:x.inv,rec:{rep:x.rb.rep},o:x.o}];eTeam=team}
 startBattle({test:true,limit,p,e,map:TR.map,mods:TR.mod?[TR.mod]:[],eTeam,title:'TEST',onEnd:testEnd})}

function saveCode(){return 'BA4:'+btoa(unescape(encodeURIComponent(JSON.stringify(S))))}
function prepMatch(exh){
 const li=S.league,L=LEAGUES[li],team=exh?pick(L.teams.filter(t=>t!==opponentFor(li,S.ladder))):opponentFor(li,S.ladder);
 PENDING={exh,li,ladder:S.ladder,team,map:pick(Object.keys(MAPS)),enemies:enemySquad(team,li,S.ladder,exh),sel:[],mod:Math.random()<.6?pick(Object.keys(MODIFIERS)):null,bounty:pick(Object.keys(BOUNTIES)),bet:0};
 PENDING.sel=S.bots.filter(b=>compute(b).ok).sort((a,b)=>b.rep-a.rep).slice(0,L.sq).map(b=>b.id);PREPTAB='brief';renderPrep();
}
let PREPTAB='brief';
function renderPrep(){
 const P=PENDING,L=LEAGUES[P.li],purse=matchPurse(P),odds=wagerOdds(P),bReward=Math.round(purse*.4);
 const cap=Math.min(S.credits,purse*3),bets=[0,.1,.25,.5].map(f=>Math.round(cap*f/10)*10);if(!bets.includes(P.bet))P.bet=0;
 const tabs=[['brief','Briefing'],['squad',`Squad ${P.sel.length}/${L.sq}`],['bet','Side bet'+(P.bet?' ✓':'')]];
 let body='';
 if(PREPTAB==='brief')body=`<div class="mods">${P.mod?`<div class="modc"><b>${MODIFIERS[P.mod].i} ${MODIFIERS[P.mod].n}</b><span>${MODIFIERS[P.mod].d}</span></div>`:`<div class="modc std"><b>Standard conditions</b><span>No special arena rules.</span></div>`}
  <div class="modc b"><b>◆ Bounty: ${BOUNTIES[P.bounty].n}</b><span>${BOUNTIES[P.bounty].d} Pays ¢${fmt(bReward)} + 8 rep each.</span></div></div>
  <div class="lab">Enemy squad</div>${pbox('pEn')}`;
 else if(PREPTAB==='squad')body=`<div class="lab">Pick up to ${L.sq} bots</div>${pbox('pSq')}`;
 else body=`<div class="lab">Bet on your squad · pays ×${odds}</div><div class="chips">${bets.map((v,i)=>`<button class="chip ${P.bet===v?'on':''}" data-bet="${v}" ${i&&v<10?'disabled':''}>${v?'¢'+fmt(v):'No bet'}</button>`).join('')}</div>
  <p class="small dim" style="margin-top:10px">Odds compare the two squads' strength. Win and you collect stake × ${odds}. Lose and the stake is gone.</p><div class="grow"></div>`;
 const b=openSheet(`<div class="sheet-h"><div class="grow"><div class="dim small">${P.exh?'Exhibition':P.ladder>=4?'Championship final':'Match '+(P.ladder+1)} · ${MAPS[P.map].n}${arenaHazards(MAPS[P.map])?' ('+arenaHazards(MAPS[P.map])+')':''} · purse ¢${fmt(purse)}</div><h3>vs ${esc(P.team)}</h3></div><button class="btn small ghost" onclick="closeSheet()">✕</button></div>
 ${subtabs(tabs,PREPTAB,'pt')}<div class="sbody">${body}</div><button class="btn primary" id="goBtn" ${P.sel.length?'':'disabled'}>Enter the arena${P.sel.length?'':' (pick a bot)'}</button>`,false,renderPrep);
 b.querySelectorAll('[data-pt]').forEach(el=>el.onclick=()=>{PREPTAB=el.dataset.pt;renderPrep()});
 b.querySelectorAll('[data-bet]').forEach(el=>el.onclick=()=>{P.bet=+el.dataset.bet;renderPrep()});
 $('#goBtn').onclick=launch;
 if(PREPTAB==='brief')pager('#pEn',P.enemies.map((e,i)=>{const o=e.o,nv=nemesisOf(P.team,e.rb.name);return `<div class="erow"><canvas data-e="${i}"></canvas><div class="grow"><div class="nm1">${esc(e.rb.name)} ${rankHtml(e.rb.rep)} <span class="mono small dim">${e.rb.rep}</span></div><div class="ln1">${FRAMES[o.fk].n.split(' ')[0]} · ${o.weps.map(w=>WEAPONS[w.k].n).join(', ')}</div><div class="ln1 dim">${Math.round(o.hp)} HP · ${Math.round(o.dps)} DPS · ${BEHAVIORS[e.design.ai.beh].n}${nv.length?` · <span class="nem">☠ nemesis of ${nv.map(x=>esc(x.name)).join(', ')}</span>`:''}</div></div></div>`}),'pEn',{minW:300,after:l=>l.querySelectorAll('canvas[data-e]').forEach(c=>{const e=P.enemies[+c.dataset.e];previewBot(c,e.design,e.inv,{zoom:1.2,angle:Math.PI/2})})});
 if(PREPTAB==='squad'){pager('#pSq',S.bots.map(bt=>{const o=compute(bt),on=P.sel.includes(bt.id),nm=S.nemesis[bt.id];return `<button class="erow pick ${on?'on':''} ${o.ok?'':'bad'}" data-id="${bt.id}"><div class="check">${on?'✓':''}</div><canvas data-b="${bt.id}"></canvas><div class="grow"><div class="nm1">${esc(bt.name)} ${rankHtml(bt.rep)}</div><div class="ln1 dim">${Math.round(o.hp)} HP · ${Math.round(o.dps)} DPS · ${Math.round(o.speed)} speed</div><div class="ln1">${o.ok?(nm&&nm.team===P.team?`<span class="nem">☠ revenge chance vs ${esc(nm.name)}</span>`:'<span class="up">Ready</span>'):`<span class="down">${esc(o.warn[0])}</span>`}</div></div></button>`}),'pSq',{minW:300,after:l=>l.querySelectorAll('canvas[data-b]').forEach(c=>previewBot(c,S.bots.find(x=>x.id===c.dataset.b),S.inv,{zoom:1.2}))});
  $('#pSq').onclick=e=>{const el=e.target.closest('[data-id]');if(!el)return;const id=el.dataset.id,bt=S.bots.find(x=>x.id===id);if(!compute(bt).ok)return toast('That bot is not battle-ready');const i=P.sel.indexOf(id);if(i<0&&P.sel.length>=L.sq)return toast(`Max ${L.sq} bots in ${L.n}`);if(i>=0)P.sel.splice(i,1);else P.sel.push(id);renderPrep()}}
}
// ================= results =================
let RES=null,RESTAB='mine';
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
 RES={win,P,Gm,headline,purse,sponsor,fm,bountyOk,bountyCr,wager,repair,net,rows,mvp};RESTAB='mine';showResults();
}
function showResults(){const R=RES,P=R.P,win=R.win;
 const rows=R.rows.filter(r=>(r.u.team===0)===(RESTAB==='mine'));
 const b=openSheet(`<div class="res-h" style="color:${win?'var(--teal)':'var(--red)'}">${win?'VICTORY':'DEFEAT'}</div>
 <div class="dim small center">vs ${esc(P.team)} · ${MAPS[P.map].n}${P.mod?' · '+MODIFIERS[P.mod].n:''} · ${Math.floor(R.Gm.t)}s</div>
 ${R.headline?`<div class="trophy center" style="margin-top:8px">${esc(R.headline)}</div>`:''}
 <div class="money"><span>${win?'Purse':'Appearance fee'}</span><b>+${fmt(R.purse)}</b>${R.sponsor?`<span>Sponsor bonus</span><b>+${fmt(R.sponsor)}</b>`:''}<span>Bounty ${R.bountyOk?'✓':'✗'} <i class="dim">${BOUNTIES[P.bounty].n}</i></span><b class="${R.bountyOk?'up':'dim'}">${R.bountyOk?'+'+fmt(R.bountyCr):'0'}</b>${P.bet?`<span>Side bet ×${P.odds}</span><b class="${R.wager>=0?'up':'down'}">${R.wager>=0?'+':'−'}${fmt(Math.abs(R.wager))}</b>`:''}<span>Repairs</span><b class="down">−${fmt(R.repair)}</b><span class="tot">Net credits</span><b class="tot ${R.net>=0?'up':'down'}">${R.net>=0?'+':''}${fmt(R.net)}</b></div>
 ${subtabs([['mine',esc(S.team)],['enemy',esc(P.team)]],RESTAB,'rt')}
 <div class="rhead"><span>Bot</span><span>Dmg</span><span>KO</span><span>Rep</span></div>${pbox('rList')}
 <button class="btn primary" id="contBtn">Continue</button>`,true,showResults);
 b.querySelectorAll('[data-rt]').forEach(el=>el.onclick=()=>{RESTAB=el.dataset.rt;showResults()});
 pager('#rList',rows.map(r=>`<div class="rrow ${r.u.dead?'ko':''}"><div class="grow"><div class="nm1">${esc(r.u.name)}${r.u===R.mvp?'<span class="badge">MVP</span>':''}${r.u.dead?' <span class="down small">✕</span>':''}</div><div class="ln1">${r.rankUp?`<span class="badge">▲ ${rankOf(r.after)[1]} · perk point</span>`:''}${r.ep?`<span class="badge">"${esc(r.ep)}"</span>`:''}${r.rv?'<span class="badge up">Revenge</span>':''}${r.nem?`<span class="nem">☠ nemesis: ${esc(r.nem)}</span>`:''}${!r.rankUp&&!r.ep&&!r.rv&&!r.nem?`<span class="dim">rep ${r.after}</span>`:''}</div></div><span class="mono">${Math.round(r.u.st.dmg)}</span><span class="mono">${r.u.st.kills.length}</span><span class="mono ${r.g>=0?'up':'down'}">${r.g>=0?'+':''}${r.g}</span></div>`),'rList');
 $('#contBtn').onclick=()=>{closeDlg();endBattle();show('career')};
}

// ================= garage =================
function renderGarage(){
 $('#garageBody').innerHTML=`<div class="frame"><div class="hrow"><h2 class="grow">Garage <span class="dim small mono">${S.bots.length}/8</span></h2><button class="btn small" id="testBtn">⌖ Test range</button>${S.bots.length<8?'<button class="btn small primary" id="newBot">+ New</button>':''}</div>${pbox('gBox')}</div>`;
 pager('#gBox',S.bots.map(b=>{const o=compute(b),a=buildAdvice(b,o),pp=perkPts(b),bad=a.issues.find(x=>x[0]!=='tip');
  return `<button class="bcard" data-id="${b.id}"><canvas data-b="${b.id}"></canvas><div class="grow"><div class="nm1">${esc(b.name)} ${rankHtml(b.rep)}</div><div class="ln1" style="color:#9db8d8">${a.role?a.role[0]:'Unfinished'}${epithet(b)?` · <i class="cr">${esc(epithet(b))}</i>`:''}</div>
   <div class="ln1 dim">${o.ok?`${Math.round(o.hp)} HP · ${Math.round(o.dps)} DPS · ${Math.round(o.speed)} spd`:''} ${b.st.m?`· ${b.st.w}W-${b.st.m-b.st.w}L`:''}</div>
   <div class="ln1">${!o.ok?`<span class="down">✖ ${esc(o.warn[0])}</span>`:pp?`<span class="cr">● ${pp} perk point${pp>1?'s':''}</span>`:bad?`<span class="cr">▲ Needs attention</span>`:'<span class="up">✓ Ready</span>'}${S.nemesis[b.id]?` <span class="nem">☠</span>`:''}</div></div></button>`}),'garage',{minW:290,empty:'No bots yet. Tap + New, then tap each slot to buy a part. A bot needs a frame, drive, power core, AI chip and a weapon (about ¢820 for the cheapest).',after:l=>l.querySelectorAll('canvas[data-b]').forEach(c=>previewBot(c,S.bots.find(x=>x.id===c.dataset.b),S.inv,{zoom:1.15}))});
 $('#gBox').onclick=e=>{const el=e.target.closest('[data-id]');if(el)openBuilder(el.dataset.id)};
 $('#testBtn').onclick=openTestRange;
 if($('#newBot'))$('#newBot').onclick=()=>{const used=new Set(S.bots.map(b=>b.name));const nm=pick(['Talon','Bastion','Comet','Wrench','Pike','Halo','Nova','Gizmo','Atlas','Echo','Blitz','Ferrum','Hammerhead','Ratchet','Sprocket','Tycho','Volt'].filter(n=>!used.has(n)))||'Unit';
  const b=mkBot(nm,{p:pick(PAINTS),s:pick(PAINTS),fin:pick(Object.keys(FINISHES)),num:(Math.random()*99|0)+1});S.bots.push(b);persist();openBuilder(b.id)};
}
// ================= builder =================
let BB=null,bAnim=0,BTAB='parts',BSUB={parts:'core',tactics:'beh',check:'status'};
function openBuilder(id){BB=S.bots.find(b=>b.id===id);$('#builder').classList.add('on');renderBuilder();const g=++bAnim,t0=performance.now();
 const tick=now=>{if(g!==bAnim||!$('#builder').classList.contains('on'))return;const t=(now-t0)/1000,c=$('#bPrev');if(c&&BB&&BB.frame)previewBot(c,BB,S.inv,{angle:-Math.PI/2+Math.sin(t*.35)*.5,aim:-Math.PI/2+Math.sin(t*.9)*.7,ph:t*2,t,zoom:1.25,floor:1});requestAnimationFrame(tick)};requestAnimationFrame(tick)}
function closeBuilder(){$('#builder').classList.remove('on');bAnim++;BB=null;persist();renderGarage();refreshTop()}
function srow(label,id,key,idx,badge='',hint=''){const p=id&&S.inv[id];return `<button class="srow ${p?'':'empty'}" data-k="${key}" data-i="${idx??''}"><canvas data-p="${p?p.id:''}"></canvas><div class="grow"><div class="lbl">${label} ${badge}</div><div class="nm1" style="${p&&p.t>1?'color:'+TIERS[p.t].col:''}">${p?esc(partName(p)):'Empty · tap to add'}</div><div class="ln1 dim">${p?partBrief(p):hint}</div></div><span class="dim">›</span></button>`}
function renderBuilder(){
 const b=BB,o=compute(b),F=o.F,pts=perkPts(b),adv=buildAdvice(b,o),nIss=adv.issues.filter(x=>x[0]!=='tip').length;
 const st=(k,v)=>`<div><span>${k}</span><b>${v}</b></div>`;
 const bar=(lbl,a,bv)=>{const r=bv?a/bv:0;return `<div class="mbar"><div class="k"><span>${lbl}</span><b>${Math.round(a)}/${Math.round(bv)}</b></div><div class="bar ${r>1?'over':r>.9?'warn':''}"><i style="width:${Math.min(100,r*100)}%"></i></div></div>`};
 const tabs=[['parts','Parts'],['tactics','Tactics'],['perks','Perks'+(pts?` <span class="dotn">${pts}</span>`:'')],['paint','Paint'],['check','Check'+(nIss?` <span class="dotn red">${nIss}</span>`:'')]];
 let sub='',body='';
 if(BTAB==='parts'){sub=subtabs([['core','Core'],['weapons','Weapons'+(F?' '+b.weps.filter(Boolean).length+'/'+F.mounts.length:'')],['utility','Utility'+(F?' '+b.utils.filter(Boolean).length+'/'+F.util:'')]],BSUB.parts,'bs');
  body=(BSUB.parts==='weapons'&&F?`<div class="legend">${szBadge('S')} small only · ${szBadge('M')} small or medium · ${szBadge('L')} any size</div>`:'')+pbox('bList')}
 else if(BTAB==='tactics'){sub=subtabs([['beh','Behavior'],['tgt','Targeting'],['tune','Fine tuning']],BSUB.tactics,'bs');
  body=BSUB.tactics==='tune'?`<div class="tune"><div class="slider"><span>Engage distance</span><input type="range" min="50" max="110" value="${Math.round(b.ai.eng*100)}" id="sEng"><b id="vEng">${Math.round(b.ai.eng*100)}%</b></div><p class="small dim">How close it fights, as a share of its weapon range. Lower is more aggressive.</p>
   <div class="slider"><span>Retreat below</span><input type="range" min="0" max="60" value="${Math.round(b.ai.ret*100)}" id="sRet"><b id="vRet">${Math.round(b.ai.ret*100)}% HP</b></div><p class="small dim">Below this HP it backs off and looks for repair kits. 0% means never.</p></div>`:pbox('bList')}
 else if(BTAB==='perks'){const i=rankIdx(b.rep),nx=RANKS[i+1];sub=`<div class="perkhead">${rankHtml(b.rep)} <span class="mono small dim">rep ${b.rep}</span><span class="grow small dim">${nx?`next: ${nx[1]} at ${nx[0]}`:'max rank'}</span><b class="cr mono">${pts} pt${pts===1?'':'s'}</b>${b.perks.length?`<button class="btn small" id="pReset">Reset ¢${fmt(250*b.perks.length)}</button>`:''}</div>`;body=pbox('bList')}
 else if(BTAB==='paint'){body=`<div class="paint"><div class="lab">Primary</div><div class="swatches">${PAINTS.map(c=>`<button class="sw ${b.paint.p===c?'on':''}" data-pp="${c}" style="background:${c}"></button>`).join('')}</div>
  <div class="lab">Secondary</div><div class="swatches">${PAINTS.map(c=>`<button class="sw ${b.paint.s===c?'on':''}" data-ps="${c}" style="background:${c}"></button>`).join('')}</div>
  <div class="lab">Finish</div><div class="chips">${Object.entries(FINISHES).map(([k,v])=>`<button class="chip ${b.paint.fin===k?'on':''}" data-fin="${k}">${v}</button>`).join('')}</div>
  <div class="slider"><span>Hull number</span><input type="range" min="0" max="99" value="${b.paint.num||0}" id="sNum"><b id="vNum">${b.paint.num||0}</b></div></div>`}
 else{sub=subtabs([['status','Status'],['record','Record'],['history','History']],BSUB.check,'bs');
  if(BSUB.check==='status')body=(adv.role?`<div class="role"><b>${adv.role[0]}</b><span>${adv.role[1]}</span></div>`:'')+pbox('bList');
  else if(BSUB.check==='record')body=`${S.nemesis[b.id]?`<div class="nem" style="margin-bottom:8px">☠ Nemesis: ${esc(S.nemesis[b.id].name)} of ${esc(S.nemesis[b.id].team)}. Destroy it for +25 rep.</div>`:''}
   <div class="recgrid">${[['Matches',b.st.m],['Wins',b.st.w],['KOs',b.st.k],['Deaths',b.st.d],['MVP',b.st.mvp],['Damage',fmt(b.st.dmg)],['Best streak',b.st.best||0],['Titles',b.titles.length]].map(([k,v])=>`<div><b class="mono">${v}</b><span>${k}</span></div>`).join('')}</div>
   ${b.titles.length?`<div class="small cr" style="margin-top:8px">🏆 ${[...new Set(b.titles)].map(esc).join(', ')}</div>`:''}<div class="grow"></div>
   <div class="row" style="margin-top:10px"><button class="btn danger small" id="bRetire">${b.st.m?'Retire to Hall of Fame':'Scrap bot'}</button><span class="small dim grow">Parts go back to storage.</span></div>`;
  else body=pbox('bList')}
 $('#builder').innerHTML=`<div class="bhead"><button class="btn small" id="bBack">‹ Done</button><input id="bName" maxlength="16" value="${esc(b.name)}"><button class="spill ${o.ok&&!nIss?'ok':o.ok?'warn':'bad'}" id="bStat">${o.ok&&!nIss?'✓ Ready':o.ok?'▲ '+nIss:'✖ Not ready'}</button><button class="btn small" id="bHelp">?</button></div>
 <div class="bmain"><div class="hero"><canvas id="bPrev"></canvas><div class="hstats"><div class="sg">${st('Health',Math.round(o.hp||0))}${st('Armor',Math.round((o.arPct||0)*100)+'%')}${st('Speed',Math.round(o.speed||0))}${st('Dmg/sec',Math.round(o.dps||0))}${st('Range',o.range?Math.round(o.range):o.melee?'melee':'—')}${st('Value','¢'+fmt(o.value||0))}</div>
  ${F?bar('Weight',o.weight,o.load)+bar('Power',o.draw,o.pow):'<div class="small dim">Install a frame to begin.</div>'}</div></div>
  <div class="bpanel"><div class="tabs">${tabs.map(([k,n])=>`<button class="${BTAB===k?'on':''}" data-bt="${k}">${n}</button>`).join('')}</div>${sub}<div class="bcontent">${body}</div></div></div>`;
 // lists
 if(BTAB==='parts'){let items=[];
  if(BSUB.parts==='core')items=[srow('Frame',b.frame,'frame',null,'','Sets health, carry limit, mounts and bays'),srow('Drive',b.drive,'drive',null,'','Wheels, treads, legs, hover or omni'),srow('Power core',b.core,'core',null,'','Powers weapons and modules'),srow('Armor',b.armor,'armor',null,'<span class="opt-l">optional</span>','Blocks incoming damage'),srow('AI chip',b.chip,'chip',null,'','Reaction speed and aim')];
  else if(!F)items=[];else if(BSUB.parts==='weapons')items=F.mounts.map((m,i)=>srow('Mount '+(i+1),b.weps[i],'weps',i,szBadge(m[0]),'Takes '+SZFITS[m[0]]));
  else items=Array.from({length:F.util},(_,i)=>srow('Bay '+(i+1),b.utils[i],'utils',i,'<span class="opt-l">optional</span>','Shields, repair, boosters, drones…'));
  pager('#bList',items,'bp_'+BSUB.parts,{minW:330,empty:'Install a frame first (Core tab). It sets how many weapons and modules fit.',after:l=>l.querySelectorAll('canvas[data-p]').forEach(c=>{const p=S.inv[c.dataset.p];if(p)partIcon(c,p,b.paint);else emptyIcon(c)})});
  $('#bList').onclick=e=>{const el=e.target.closest('.srow');if(el)openPicker(el.dataset.k,el.dataset.i===''?null:+el.dataset.i)}}
 if(BTAB==='tactics'&&BSUB.tactics!=='tune'){const obj=BSUB.tactics==='beh'?BEHAVIORS:TARGETS,cur=BSUB.tactics==='beh'?b.ai.beh:b.ai.tgt;
  pager('#bList',Object.entries(obj).map(([k,v])=>`<button class="ocard ${cur===k?'on':''}" data-o="${k}"><b>${v.n}</b><small>${v.d}</small></button>`),'bt_'+BSUB.tactics,{minW:170});
  $('#bList').onclick=e=>{const el=e.target.closest('[data-o]');if(!el)return;if(BSUB.tactics==='beh')b.ai.beh=el.dataset.o;else b.ai.tgt=el.dataset.o;persist();renderBuilder()}}
 if(BTAB==='perks'){pager('#bList',Object.entries(PERKS).map(([k,v])=>{const has=b.perks.includes(k),can=!has&&pts>0;return `<button class="ocard perk ${has?'on':can?'':'lock'}" data-perk="${k}"><b><i>${v.i}</i> ${v.n}${has?' ✓':''}</b><small>${v.d}</small></button>`}),'bperk',{minW:170});
  $('#bList').onclick=e=>{const el=e.target.closest('[data-perk]');if(!el)return;const k=el.dataset.perk;if(b.perks.includes(k))return toast(PERKS[k].n+' already learned');if(perkPts(b)<=0)return toast('No perk points yet. Earn reputation to rank up.');b.perks.push(k);sfx('level');persist();renderBuilder()};
  if($('#pReset'))$('#pReset').onclick=()=>{const c=250*b.perks.length;if(S.credits<c)return toast('Not enough credits');confirmBox('Reset perks?',`Refund all perk points for ¢${fmt(c)}.`,'Reset',()=>{S.credits-=c;b.perks=[];persist();refreshTop();renderBuilder()})}}
 if(BTAB==='check'&&BSUB.check==='status'){const ico={bad:'✖',warn:'▲',tip:'•'};pager('#bList',[...(o.ok&&!nIss?['<div class="adv good">✓ Battle-ready</div>']:[]),...adv.issues.map(([l,m])=>`<div class="adv ${l}"><i>${ico[l]}</i><span>${m}</span></div>`)],'bchk',{empty:'Nothing to fix.'})}
 if(BTAB==='check'&&BSUB.check==='history')pager('#bList',(b.hist||[]).slice().reverse().map(h=>`<div class="hrowi"><span class="${h.win?'up':'down'} mono">${h.win?'W':'L'}</span><span class="grow">vs ${esc(h.vs)}</span><span class="mono dim">${h.k} KO · ${h.dmg} dmg</span><span class="mono ${h.rep>=0?'up':'down'}">${h.rep>=0?'+':''}${h.rep}</span></div>`),'bhist',{empty:'No matches yet.'});
 // wiring
 $('#bBack').onclick=closeBuilder;$('#bHelp').onclick=()=>openHelp(BTAB==='tactics'?6:BTAB==='perks'?8:BTAB==='parts'&&BSUB.parts==='weapons'?2:1);$('#bName').oninput=e=>{b.name=e.target.value.slice(0,16)||'Unit'};
 $('#bStat').onclick=()=>{BTAB='check';BSUB.check='status';renderBuilder()};
 $$('#builder [data-bt]').forEach(el=>el.onclick=()=>{BTAB=el.dataset.bt;renderBuilder()});
 $$('#builder [data-bs]').forEach(el=>el.onclick=()=>{BSUB[BTAB]=el.dataset.bs;renderBuilder()});
 $$('#builder [data-pp]').forEach(el=>el.onclick=()=>{b.paint.p=el.dataset.pp;persist();renderBuilder()});
 $$('#builder [data-ps]').forEach(el=>el.onclick=()=>{b.paint.s=el.dataset.ps;persist();renderBuilder()});
 $$('#builder [data-fin]').forEach(el=>el.onclick=()=>{b.paint.fin=el.dataset.fin;persist();renderBuilder()});
 if($('#sEng')){$('#sEng').oninput=e=>{b.ai.eng=e.target.value/100;$('#vEng').textContent=e.target.value+'%'};$('#sEng').onchange=persist}
 if($('#sRet')){$('#sRet').oninput=e=>{b.ai.ret=e.target.value/100;$('#vRet').textContent=e.target.value+'% HP'};$('#sRet').onchange=persist}
 if($('#sNum')){$('#sNum').oninput=e=>{b.paint.num=+e.target.value;$('#vNum').textContent=e.target.value};$('#sNum').onchange=()=>{persist();renderBuilder()}}
 if($('#bRetire'))$('#bRetire').onclick=()=>confirmBox(b.st.m?'Retire '+b.name+'?':'Scrap '+b.name+'?',b.st.m?'Its record and reputation go to the Hall of Fame. All parts return to storage.':'All parts return to storage.',b.st.m?'Retire':'Scrap',()=>{
  S.bots=S.bots.filter(x=>x!==b);if(b.st.m)S.retired.push({name:b.name,rep:b.rep,st:b.st,titles:b.titles,paint:b.paint,ret:S.matches});syncEquip();persist();closeBuilder()});
}
function emptyIcon(c){const x=c.getContext('2d');c.width=c.clientWidth*2;c.height=c.clientHeight*2;x.fillStyle='#0d1116';x.fillRect(0,0,c.width,c.height);x.strokeStyle='#3a4553';x.lineWidth=2;x.setLineDash([5,5]);x.strokeRect(4,4,c.width-8,c.height-8);x.fillStyle='#55657a';x.font='600 30px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('+',c.width/2,c.height/2+2)}
// ================= part rows, detail card, picker =================
function lrow(p,right,attrs=''){return `<button class="lrow ${p._cls||''}" ${attrs}><canvas data-pi="${p.id||''}" data-ck="${p.k}" data-cc="${p.c}" data-ct="${p.t||1}"></canvas><div class="grow"><div class="nm1" style="${p.t>1?'color:'+TIERS[p.t].col:''}">${esc(p.id?partName(p):baseOf(p).n)}${Object.keys(p.af||{}).length?` <span class="afx">+${Object.keys(p.af).length}</span>`:''}</div><div class="ln1 dim">${partBrief(p)}</div></div><div class="pr">${right}</div></button>`}
function drawIcons(l,paint){l.querySelectorAll('canvas[data-ck]').forEach(c=>{const p=c.dataset.pi?(S.inv[c.dataset.pi]||S.market.find(m=>m.id===c.dataset.pi)):{c:c.dataset.cc,k:c.dataset.ck,t:+c.dataset.ct||1,af:{}};if(p)partIcon(c,p,paint)})}
// mode: market|catalog|storage|workshop|pick ; ctx for pick
function partDetail(p,mode,ctx={}){const B=baseOf(p),own=!!p.id&&S.inv[p.id],on=own&&p.on?S.bots.find(x=>x.id===p.on):null;
 let acts='';const price=mode==='market'?partValue(p):B.cost;
 if(mode==='market')acts=`<button class="btn primary grow" id="dAct" ${S.credits<price?'disabled':''}>Buy ¢${fmt(price)}</button>`;
 else if(mode==='catalog')acts=B.lv>S.unlocked?`<div class="small dim grow">🔒 Unlocks in ${LEAGUES[B.lv].n}</div>`:`<button class="btn primary grow" id="dAct" ${S.credits<price?'disabled':''}>Buy ¢${fmt(price)}</button>`;
 else if(mode==='storage')acts=on?`<div class="small dim grow">Installed on ${esc(on.name)}. Remove it in the Garage to sell.</div>`:`<button class="btn grow" id="dAct">Sell for ¢${fmt(partValue(p)*.5)}</button>`;
 else if(mode==='workshop'){const uc=upgradeCost(p),rc=Object.keys(p.af).length?rerollCost(p):0;acts=(uc?`<button class="btn primary grow" id="dUp" ${S.credits<uc?'disabled':''}>▲ Upgrade to ${TIERS[p.t+1].mk} ¢${fmt(uc)}</button>`:'<div class="small cr grow">Max tier</div>')+(rc?`<button class="btn grow" id="dRr" ${S.credits<rc?'disabled':''}>⟳ Reroll ¢${fmt(rc)}</button>`:'')}
 else if(mode==='pick'){if(ctx.tooBig)acts=`<div class="small dim grow">Needs a ${SZNAME[B.sz].toLowerCase()} ${szBadge(B.sz)} mount.</div>`;else if(ctx.installed)acts=ctx.optional?`<button class="btn danger grow" id="dRm">Remove</button>`:'<div class="small dim grow">Installed. Pick another part to swap it.</div>';else if(own)acts=`<button class="btn primary grow" id="dAct">${on&&on!==BB?'Move from '+esc(on.name):'Install'}</button>`;else acts=B.lv>S.unlocked?`<div class="small dim grow">🔒 Unlocks in ${LEAGUES[B.lv].n}</div>`:`<button class="btn primary grow" id="dAct" ${S.credits<B.cost?'disabled':''}>Buy & install ¢${fmt(B.cost)}</button>`}
 const back=mode==='pick'?()=>openPicker(ctx.key,ctx.idx):null;
 const d=openSheet(`<div class="pdh"><canvas id="pdIc"></canvas><div class="grow"><div class="small dim caps">${CATNAME[p.c]}${p.t>1?` · <span style="color:${TIERS[p.t].col}">${TIERS[p.t].n}</span>`:''}</div><h3 style="${p.t>1?'color:'+TIERS[p.t].col:''}">${esc(p.id?partName(p):B.n)}</h3>${on?`<div class="small dim">On ${esc(on.name)}</div>`:''}</div><button class="btn small ghost" id="pdX">✕</button></div>
 ${Object.keys(p.af||{}).length?`<div class="afl">${affixText(p).map(t=>`<span>◆ ${t}</span>`).join('')}</div>`:''}${partLine(p)}
 <div class="row" style="margin-top:14px">${back?'<button class="btn" id="pdB">‹ Back</button>':''}${acts}</div>`,mode!=='pick',null,false);
 afterPaint(()=>partIcon($('#pdIc'),p,BB?BB.paint:undefined));
 const done=()=>{if(mode==='pick')closeSheet();else{closeDlg();refreshTop();renderShop()}};
 $('#pdX').onclick=()=>mode==='pick'?closeSheet():closeDlg();if($('#pdB'))$('#pdB').onclick=back;
 const A=$('#dAct');if(A)A.onclick=()=>{
  if(mode==='market'){const i=S.market.indexOf(p);if(buyMarket(i)){sfx('buy');toast('Bought '+partName(p));done()}}
  else if(mode==='catalog'){if(buyCatalog(p.c,p.k)){sfx('buy');toast('Bought '+B.n);done()}}
  else if(mode==='storage'){sellPart(p.id);sfx('buy');toast('Sold '+partName(p));done()}
  else if(mode==='pick'){let id=p.id;if(!own){if(S.credits<B.cost)return toast('Not enough credits');id=buyCatalog(p.c,p.k).id;refreshTop()}equip(BB,ctx.key,ctx.idx,id);sfx('buy');closeSheet();renderBuilder()}};
 if($('#dUp'))$('#dUp').onclick=()=>{if(upgradePart(p)){sfx('level');toast(partName(p)+': '+affixText(p).slice(-1)[0]);refreshTop();partDetail(p,'workshop');renderShop()}};
 if($('#dRr'))$('#dRr').onclick=()=>{if(rerollPart(p)){sfx('buy');refreshTop();partDetail(p,'workshop');renderShop()}};
 if($('#dRm'))$('#dRm').onclick=()=>{const b=BB,k=ctx.key;if(k==='weps'||k==='utils')b[k][ctx.idx]=null;else b[k]=null;syncEquip();persist();closeSheet();renderBuilder()};
}
const SLOTCAT={frame:'frame',drive:'drive',core:'core',armor:'armor',chip:'chip',weps:'weapon',utils:'util'};
let PICKTAB='own';
function openPicker(key,idx,keepTab){
 const b=BB,cat=SLOTCAT[key],cur=key==='weps'||key==='utils'?b[key][idx]:b[key];if(!keepTab&&openPicker._k!==key+idx){PICKTAB='own'}openPicker._k=key+idx;
 const mountSz=key==='weps'?SZ[FRAMES[S.inv[b.frame].k].mounts[idx][0]]:3,fits=k=>cat!=='weapon'||WEAPONS[k].sz<=mountSz;
 const optional=!['frame','drive','core','chip'].includes(key);
 const own=Object.values(S.inv).filter(p=>p.c===cat&&fits(p.k)&&p.id!==cur).sort((x,y)=>(x.on?1:0)-(y.on?1:0)||partValue(y)-partValue(x));
 const cats=Object.keys(CATS[cat]).filter(fits).sort((x,y)=>CATS[cat][x].lv-CATS[cat][y].lv||CATS[cat][x].cost-CATS[cat][y].cost);
 const big=cat==='weapon'?Object.keys(WEAPONS).filter(k=>!fits(k)):[];
 const tabs=[['own',`Your parts (${own.length})`],['buy','Buy new'],...(big.length?[['big',`Too big (${big.length})`]]:[])];
 const title=cat==='weapon'?`Mount ${idx+1} ${szBadge(mountSz)}`:CATNAME[cat];
 const c=cur&&S.inv[cur];
 openSheet(`<div class="sheet-h"><h3 class="grow">${title}</h3><span class="pill cr">¢ ${fmt(S.credits)}</span><button class="btn small ghost" onclick="closeSheet()">✕</button></div>
 ${cat==='weapon'?`<div class="legend">This mount takes ${SZFITS['SML'[mountSz-1]]}.</div>`:''}
 ${c?`<div class="lab">Installed</div>${lrow(c,optional?'<span class="btn small">Remove</span>':'<span class="dim small">info</span>','id="pkCur"')}`:''}
 ${subtabs(tabs,PICKTAB,'pk')}<div class="sbody">${pbox('pkList')}</div>`,false,()=>openPicker(key,idx,true));
 const rows=PICKTAB==='own'?own.map(p=>lrow(p,p.on?`<span class="small dim">on ${esc(S.bots.find(x=>x.id===p.on)?.name||'?')}</span>`:'<span class="btn small primary">Install</span>',`data-own="${p.id}"`))
  :PICKTAB==='buy'?cats.map(k=>{const B=CATS[cat][k],lock=B.lv>S.unlocked;return lrow({c:cat,k,t:1,af:{},_cls:lock?'locked':S.credits<B.cost?'cant':''},lock?'<span class="small">🔒</span>':`<span class="btn small">¢${fmt(B.cost)}</span>`,`data-buy="${k}"`)})
  :big.map(k=>lrow({c:cat,k,t:1,af:{},_cls:'locked'},`<span class="small">needs ${szBadge(WEAPONS[k].sz)}</span>`,`data-big="${k}"`));
 pager('#pkList',rows,'pk_'+key+'_'+PICKTAB,{minW:320,empty:PICKTAB==='own'?'No spare parts that fit. Check Buy new.':'',after:l=>drawIcons(l,b.paint)});
 $$('#sheet [data-pk]').forEach(el=>el.onclick=()=>{PICKTAB=el.dataset.pk;openPicker(key,idx,true)});
 if($('#pkCur')){afterPaint(()=>drawIcons($('#pkCur').parentElement,b.paint));$('#pkCur').onclick=()=>partDetail(c,'pick',{key,idx,installed:1,optional})}
 $('#pkList').onclick=e=>{const el=e.target.closest('.lrow');if(!el)return;
  if(el.dataset.own){const p=S.inv[el.dataset.own];if(e.target.closest('.btn')){equip(b,key,idx,p.id);sfx('buy');closeSheet();renderBuilder()}else partDetail(p,'pick',{key,idx})}
  else if(el.dataset.buy){const k=el.dataset.buy,B=CATS[cat][k];if(e.target.closest('.btn')&&B.lv<=S.unlocked){if(S.credits<B.cost)return toast('Not enough credits');const p=buyCatalog(cat,k);refreshTop();equip(b,key,idx,p.id);sfx('buy');closeSheet();renderBuilder()}else partDetail({c:cat,k,t:1,af:{}},'pick',{key,idx})}
  else if(el.dataset.big)partDetail({c:cat,k:el.dataset.big,t:1,af:{}},'pick',{key,idx,tooBig:1})};
}
// ================= parts shop =================
let SHOPTAB='market',SHOPCAT='all';
function renderShop(){
 const tabs=[['market','Market'],['catalog','Catalog'],['workshop','Workshop'],['storage','Storage']];
 const catSel=`<select id="catSel" class="sel"><option value="all">All parts</option>${Object.keys(CATS).map(c=>`<option value="${c}" ${SHOPCAT===c?'selected':''}>${CATNAME[c]}s</option>`).join('')}</select>`;
 const head=SHOPTAB==='market'?`<div class="hrow2"><span class="small dim grow">Rare parts with bonus affixes. Restocks after each match.</span><button class="btn small" id="reroll" ${S.credits<150?'disabled':''}>Restock ¢150</button></div>`
  :`<div class="hrow2">${catSel}<span class="small dim grow">${SHOPTAB==='catalog'?'Standard Mk I parts.':SHOPTAB==='workshop'?'Upgrade tier or reroll affixes.':'Unused parts. Sell for 50%.'}</span></div>`;
 $('#shopBody').innerHTML=`<div class="frame"><div class="tabs">${tabs.map(([k,n])=>`<button class="${SHOPTAB===k?'on':''}" data-st="${k}">${n}</button>`).join('')}</div>${head}${pbox('sList')}</div>`;
 if($('#catSel')){$('#catSel').value=SHOPCAT;$('#catSel').onchange=e=>{SHOPCAT=e.target.value;renderShop()}}
 const inCat=p=>SHOPCAT==='all'||p.c===SHOPCAT;let rows=[],key='s_'+SHOPTAB+SHOPCAT;
 if(SHOPTAB==='market')rows=S.market.map((p,i)=>lrow(p,`<span class="pricet ${S.credits<partValue(p)?'down':''}">¢${fmt(partValue(p))}</span>`,`data-m="${i}"`));
 else if(SHOPTAB==='catalog'){const cs=SHOPCAT==='all'?Object.keys(CATS):[SHOPCAT];for(const c of cs){const ks=Object.keys(CATS[c]).sort((x,y)=>(c==='weapon'?WEAPONS[x].sz-WEAPONS[y].sz:0)||CATS[c][x].lv-CATS[c][y].lv||CATS[c][x].cost-CATS[c][y].cost);ks.forEach(k=>{const B=CATS[c][k],lock=B.lv>S.unlocked;rows.push(lrow({c,k,t:1,af:{},_cls:lock?'locked':''},lock?'<span class="small">🔒</span>':`<span class="pricet ${S.credits<B.cost?'down':''}">¢${fmt(B.cost)}</span>`,`data-c="${c}" data-k="${k}"`))})}}
 else if(SHOPTAB==='workshop')rows=Object.values(S.inv).filter(inCat).sort((a,b)=>(b.on?1:0)-(a.on?1:0)||b.t-a.t||partValue(b)-partValue(a)).map(p=>{const uc=upgradeCost(p);return lrow(p,uc?`<span class="pricet">▲ ¢${fmt(uc)}</span>`:'<span class="small cr">max</span>',`data-w="${p.id}"`)});
 else rows=Object.values(S.inv).filter(p=>!p.on&&inCat(p)).sort((a,b)=>a.c.localeCompare(b.c)||partValue(b)-partValue(a)).map(p=>lrow(p,`<span class="pricet up">+¢${fmt(partValue(p)*.5)}</span>`,`data-s="${p.id}"`));
 pager('#sList',rows,key,{minW:320,empty:SHOPTAB==='market'?'Sold out. Restock or play a match.':SHOPTAB==='storage'?'Storage is empty.':'Nothing here.',after:l=>drawIcons(l)});
 $$('[data-st]').forEach(b=>b.onclick=()=>{SHOPTAB=b.dataset.st;renderShop()});
 if($('#reroll'))$('#reroll').onclick=()=>{S.credits-=150;refreshMarket();persist();refreshTop();renderShop()};
 $('#sList').onclick=e=>{const el=e.target.closest('.lrow');if(!el)return;const d=el.dataset;
  if(d.m!=null)partDetail(S.market[+d.m],'market');else if(d.c)partDetail({c:d.c,k:d.k,t:1,af:{}},'catalog');else if(d.w)partDetail(S.inv[d.w],'workshop');else if(d.s)partDetail(S.inv[d.s],'storage')};
}
// ================= records =================
let RECTAB='board';
function renderRecords(){
 const tabs=[['board','Leaderboard'],['hof','Hall of Fame'],['trophies','Trophies'],['history','History']];
 $('#recordsBody').innerHTML=`<div class="frame"><div class="tabs">${tabs.map(([k,n])=>`<button class="${RECTAB===k?'on':''}" data-rt="${k}">${n}</button>`).join('')}</div>${pbox('rcList')}</div>`;
 let rows=[];
 if(RECTAB==='board'){const all=S.bots.map(b=>({n:b.name,t:S.team,rep:b.rep,st:b.st,me:1,ep:epithet(b)}));for(const [tn,t] of Object.entries(S.rivals))if(t.li<=Math.min(4,S.unlocked+1))t.bots.forEach(b=>all.push({n:b.name,t:tn,rep:b.rep,st:b.st,ep:epithet(b)}));all.sort((a,b)=>b.rep-a.rep);
  rows=all.map((b,i)=>`<div class="trow ${b.me?'me':''}"><span class="mono rk">${i+1}</span><div class="grow"><div class="nm1">${esc(b.n)}${b.ep?` <i class="small cr">${esc(b.ep)}</i>`:''}</div><div class="ln1 dim">${esc(b.t)} · ${rankHtml(b.rep)}</div></div><span class="mono">${b.rep}</span><span class="mono dim">${b.st.w}-${b.st.m-b.st.w}</span></div>`)}
 else if(RECTAB==='hof')rows=S.retired.slice().sort((a,b)=>b.rep-a.rep).map(b=>`<div class="trow"><div class="grow"><div class="nm1">${esc(b.name)} ${rankHtml(b.rep)} <i class="small cr">${esc(epithet(b))}</i></div><div class="ln1 dim">rep ${b.rep} · ${b.st.w}W-${b.st.m-b.st.w}L · ${b.st.k} KOs · ${b.st.mvp} MVP${b.titles.length?' · 🏆 '+b.titles.length:''}</div></div></div>`);
 else if(RECTAB==='trophies')rows=S.trophies.slice().reverse().map(t=>`<div class="trow"><span style="font-size:20px">🏆</span><div class="grow"><div class="nm1">${esc(t.n)}</div><div class="ln1 dim">Won after match ${t.m+1}</div></div></div>`);
 else rows=S.log.map(l=>`<div class="trow"><span class="mono ${l.win?'up':'down'} rk">${l.win?'W':'L'}</span><div class="grow"><div class="nm1">vs ${esc(l.vs)}</div><div class="ln1 dim">${esc(l.lg)}</div></div><span class="mono ${l.net>=0?'up':'down'}">${l.net>=0?'+':''}${fmt(l.net)}¢</span></div>`);
 pager('#rcList',rows,'rec_'+RECTAB,{minW:340,empty:{board:'',hof:'Retire a veteran bot from the Garage to enshrine it here.',trophies:'Win a league final to claim a trophy.',history:'No matches played yet.'}[RECTAB]});
 $$('[data-rt]').forEach(b=>b.onclick=()=>{RECTAB=b.dataset.rt;renderRecords()});
}
// ================= help (paged topics, no scrolling) =================
function openHelp(topic){if(topic==null){const b=openSheet(`<div class="sheet-h"><h3 class="grow">How to play</h3><button class="btn small ghost" onclick="closeSheet()">✕</button></div><div class="sbody">${pbox('hList')}</div><button class="btn" id="replayTut">Replay intro tour</button>`,false,()=>openHelp());
  pager('#hList',HELP.map(([i,t],k)=>`<button class="hbtn" data-h="${k}"><span>${i}</span>${t}</button>`),'help',{minW:160});$('#hList').onclick=e=>{const el=e.target.closest('[data-h]');if(el)openHelp(+el.dataset.h)};$('#replayTut').onclick=()=>{closeSheet();showTutorial(0)};return}
 const [i,t,h]=HELP[topic];openSheet(`<div class="sheet-h"><button class="btn small" id="hBack">‹</button><h3 class="grow">${i} ${t}</h3><button class="btn small ghost" onclick="closeSheet()">✕</button></div><div class="help helpview">${h}</div>
 <div class="row"><button class="btn grow" id="hPrev" ${topic?'':'disabled'}>‹ ${topic?HELP[topic-1][1]:''}</button><button class="btn grow" id="hNext" ${topic<HELP.length-1?'':'disabled'}>${topic<HELP.length-1?HELP[topic+1][1]:''} ›</button></div>`,false,()=>openHelp(topic));
 $('#hBack').onclick=()=>openHelp();$('#hPrev').onclick=()=>openHelp(topic-1);$('#hNext').onclick=()=>openHelp(topic+1)}
// ================= test range =================
let TR={bot:null,opp:'dummy',mate:null,map:'neon',mod:''};
function openTestRange(){const ready=S.bots.filter(b=>compute(b).ok);if(!ready.length)return toast('Build a battle-ready bot first');if(!TR.bot||!ready.find(b=>b.id===TR.bot))TR.bot=ready[0].id;renderTR()}
function renderTR(){const ready=S.bots.filter(b=>compute(b).ok),others=ready.filter(b=>b.id!==TR.bot);if(TR.opp==='mate'&&!others.length)TR.opp='dummy';if(TR.opp==='mate'&&!others.find(b=>b.id===TR.mate))TR.mate=others[0]?.id;
 const sel=(id,opts,cur)=>`<select class="sel" id="${id}">${opts.map(([v,n])=>`<option value="${v}" ${cur===v?'selected':''}>${n}</option>`).join('')}</select>`;
 openSheet(`<div class="sheet-h"><h3 class="grow">⌖ Test range</h3><button class="btn small ghost" onclick="closeDlg()">✕</button></div><p class="small dim" style="margin-bottom:10px">Free practice. No credits, reputation or repairs.</p>
 <div class="form2"><label>Test bot</label>${sel('trBot',ready.map(b=>[b.id,b.name]),TR.bot)}
 <label>Opponent</label>${sel('trOpp',[['dummy','Target dummy (30s damage test)'],['spar','Sparring partner ('+LEAGUES[S.league].n+')'],...(others.length?[['mate','Squad mate']]:[])],TR.opp)}
 ${TR.opp==='mate'?`<label>Squad mate</label>${sel('trMate',others.map(b=>[b.id,b.name]),TR.mate)}`:''}
 <label>Arena</label>${sel('trMap',Object.entries(MAPS).map(([k,m])=>[k,m.n]),TR.map)}
 <label>Conditions</label>${sel('trMod',[['','Standard'],...Object.entries(MODIFIERS).map(([k,m])=>[k,m.i+' '+m.n])],TR.mod||'')}</div>
 <button class="btn primary" style="width:100%;margin-top:14px" id="trGo">Start test</button>`,true,renderTR,false);
 const on=(id,k)=>{$('#'+id).onchange=e=>{TR[k]=e.target.value;renderTR()}};on('trBot','bot');on('trOpp','opp');on('trMap','map');on('trMod','mod');if($('#trMate'))on('trMate','mate');
 $('#trGo').onclick=()=>{closeDlg();startTest()}}
let TEND=null;
function testEnd(Gm){TEND=Gm;renderTestEnd()}
function renderTestEnd(){const Gm=TEND,me=Gm.bots.filter(b=>b.team===0),t=Math.max(1,Gm.t);
 openSheet(`<div class="res-h" style="font-size:24px">TEST RESULTS</div><div class="dim small center">${Math.floor(Gm.t)}s · ${MAPS[TR.map].n}${TR.mod?' · '+MODIFIERS[TR.mod].n:''}</div>
 <div class="money">${me.map(b=>`<span>${esc(b.name)} damage dealt</span><b>${fmt(b.st.dmg)}</b><span>Average damage/sec</span><b>${(b.st.dmg/t).toFixed(1)}</b><span>Damage taken</span><b>${fmt(b.st.taken)}</b><span>Result</span><b>${TR.opp==='dummy'?'—':Gm.winner===0?'Win':'Loss'}</b>`).join('')}</div>
 <div class="row" style="margin-top:12px"><button class="btn grow" id="trBack">Garage</button><button class="btn primary grow" id="trAgain">Run again</button></div>`,true,renderTestEnd,false);
 $('#trBack').onclick=()=>{closeDlg();endBattle();show('garage')};$('#trAgain').onclick=()=>{closeDlg();endBattle();startTest()}}
// ================= save codes =================
function exportSave(s){const code='BA4:'+btoa(unescape(encodeURIComponent(JSON.stringify(s))));openSheet(`<div class="sheet-h"><h3 class="grow">Export · ${esc(s.team)}</h3></div><p class="small dim" style="margin-bottom:8px">Copy this code. Import it into any slot, on this device or another.</p>
 <textarea id="saveTxt" class="code" readonly>${code}</textarea><div class="row" style="margin-top:10px"><button class="btn grow" onclick="closeDlg()">Close</button><button class="btn primary grow" id="copyBtn">Copy</button></div>`,true,null,false);
 $('#copyBtn').onclick=async()=>{const t=$('#saveTxt');t.select();t.setSelectionRange(0,code.length);let ok=false;try{await navigator.clipboard.writeText(code);ok=true}catch(e){try{ok=document.execCommand('copy')}catch(e2){}}toast(ok?'Save code copied':'Select the text and copy it manually')}}
function importSave(n){openSheet(`<div class="sheet-h"><h3 class="grow">Import into slot ${n}</h3></div><p class="small dim" style="margin-bottom:8px">Paste a save code.${readSlot(n)?' This replaces the career in this slot.':''}</p><textarea id="impTxt" class="code"></textarea>
 <div class="row" style="margin-top:10px"><button class="btn grow" onclick="closeDlg()">Cancel</button><button class="btn primary grow" id="doImp">Import</button></div>`,true,null,false);
 $('#doImp').onclick=()=>{try{const raw=$('#impTxt').value.trim().replace(/^BA[0-9]:/,'');const s=JSON.parse(decodeURIComponent(escape(atob(raw))));if(!s||s.v!==2||!s.bots)throw 0;ACTIVE=n;S=migrate(s);persist();closeDlg();toast('Career imported to slot '+n);renderTitle()}catch(e){toast('That code is not a valid save')}}}
// ================= boot =================
$('#menuBtn').onclick=showTitle;$('#helpTop').onclick=()=>openHelp();$('#tHelp').onclick=()=>openHelp();
$$('.sndBtn').forEach(b=>b.onclick=e=>{e.stopPropagation();audioInit();setSound(!SND.on)});setSound(SND.on);
document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.classList.contains('sndBtn'))sfx('click')});
showTitle();
