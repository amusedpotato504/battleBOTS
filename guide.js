'use strict';
// ================= presentation helpers: chips, size badges, build advice, help, tutorial =================
const SZNAME={1:'Small',2:'Medium',3:'Large'};
const SZFITS={S:'small weapons only',M:'small or medium weapons',L:'any weapon'};
const TYCOL={kinetic:'#c9d1db',explosive:'#ff9a4a',energy:'#5fe3ff',thermal:'#ff6a3d'};
function szBadge(s){const L=typeof s==='number'?'SML'[s-1]:s;return `<span class="szb sz${L}" title="${SZNAME[SZ[L]]} hardpoint">${L}</span>`}
function ch(k,v){return `<span class="ch"><b>${k}</b>${v}</span>`}
function tyTag(t){return `<span class="ty" style="color:${TYCOL[t]};border-color:${TYCOL[t]}55">${t}</span>`}
function partLine(p){const B=baseOf(p),m=TIERS[p.t].mul,a=p.af||{};
 switch(p.c){
  case 'frame':return ch('HP',Math.round(B.hp*m*2.2))+ch('LOAD',B.load)+ch('ARMOR',B.armor)+`<span class="ch"><b>MOUNTS</b>${B.mounts.map(x=>szBadge(x[0])).join('')}</span>`+ch('BAYS',B.util);
  case 'drive':return ch('SPEED',Math.round(B.speed*(1+(m-1)*.5)))+ch('LOAD',(B.load>=0?'+':'')+B.load)+ch('TURN','×'+B.turn)+(B.haz?ch('SLAG RES',B.haz*100+'%'):'')+(B.omni?ch('STRAFE','yes'):'');
  case 'core':return ch('POWER',Math.round(B.pow*m*10)/10)+ch('WT',B.w)+(B.boom?'<span class="ty" style="color:#ff6a3d;border-color:#ff6a3d55">volatile</span>':'');
  case 'armor':return ch('ARMOR','+'+Math.round(B.ar*m))+ch('HP','+'+Math.round(B.hp*m*100)+'%')+ch('WT',B.w)+(B.abl?ch('SOAK',B.abl):'')+Object.entries(B.res).map(([k,v])=>ch(k.slice(0,4).toUpperCase()+' RES',v*100+'%')).join('');
  case 'weapon':{const d=Math.round(B.dmg*m*(1+(a.dmg||0))*10)/10;return szBadge(B.sz)+tyTag(B.ty)+ch('DMG',d+(B.pellets?'×'+B.pellets:'')+(B.salvo>1?'×'+B.salvo:''))+ch('RATE',(1/B.cd*(1+(a.rate||0))).toFixed(1)+'/s')+(B.kind==='melee'?ch('RANGE','melee'):ch('RANGE',Math.round(B.rng*(1+(a.range||0)))))+ch('WT',B.w)+ch('PWR',B.p)}
  case 'util':return `<span class="desc">${B.desc}</span>`+ch('WT',B.w)+ch('PWR',B.p);
  case 'chip':return `<span class="desc">${B.desc}</span>`+ch('REACT',B.react+'s')+ch('AIM','×'+B.aim);
 }}
// ---------- build advice ----------
function buildAdvice(b,o){const out=[],F=o.F;
 const bad=m=>out.push(['bad',m]),warn=m=>out.push(['warn',m]),tip=m=>out.push(['tip',m]);
 if(!b.frame){bad('No frame. Tap the Frame slot to install one.');return {role:null,issues:out}}
 if(!b.drive)bad('No drive, so it cannot move. Tap the Drive slot.');
 if(!b.core)bad('No power core. Weapons and modules need one.');
 if(!b.chip)bad('No AI chip. It needs one to think.');
 const wn=b.weps.filter(Boolean).length;if(!wn)bad('No weapons. Tap a hardpoint below to add one.');
 if(o.wr>1.4)bad(`Too heavy to move: ${Math.round(o.weight-o.load*1.4)} over the hard limit. Remove heavy parts or use a drive with more load (Tank Treads +45).`);
 else if(o.wr>1)warn(`Overloaded by ${Math.round(o.weight-o.load)} weight, so it moves slower. Lighter parts or Tank Treads (+45 load) fix this.`);
 if(o.pow>0&&o.draw>o.pow)warn(`Needs ${Math.round((o.draw-o.pow)*10)/10} more power. Weapons fire at ${Math.round(o.powMul*100)}% speed. A bigger power core fixes this.`);
 F.mounts.forEach((m,i)=>{if(!b.weps[i])warn(`Mount ${i+1} ${szBadge(m[0])} is empty. It takes ${SZFITS[m[0]]}.`)});
 const eb=b.utils.filter(x=>!x).length;if(eb)tip(`${eb} utility bay${eb>1?'s are':' is'} empty. Shields, repair or boosters help a lot.`);
 if(!b.armor&&b.frame)tip('No armor. Steel Plating is a cheap +2 armor (10% less damage).');
 const meleeOnly=o.weps.length&&o.weps.every(w=>w.W.kind==='melee');
 if(meleeOnly&&['kite','sniper','sentinel','skirm'].includes(b.ai.beh))warn(`${BEHAVIORS[b.ai.beh].n} keeps its distance, but this bot only has melee weapons. Try Aggressive or Berserker.`);
 if(o.range>=450&&['aggro','berserk'].includes(b.ai.beh))tip('Long-range guns work better with Sniper or Kiter behavior.');
 if(perkPts(b)>0)tip(`${perkPts(b)} perk point${perkPts(b)>1?'s':''} to spend in the Perks tab.`);
 let role=null;if(o.weps.length){const heavy=o.hp>=420,fast=o.speed>=150,glass=o.dps>0&&o.hp/o.dps<5;
  const base=meleeOnly?['Brawler','Rams in and fights at point-blank range.']:o.range>=450?['Artillery','Hits hard from far away. Weak if enemies get close.']:o.range<=200?['Close-quarters','Short-range weapons. Needs to get near the enemy.']:['Gunner','Steady mid-range firepower.'];
  role=[(heavy?'Heavy ':fast?'Fast ':glass?'Glass-cannon ':'')+base[0],base[1]+(heavy?' Built to soak damage.':fast?' Quick to reposition.':glass?' Lots of damage, not much HP.':'')]}
 return {role,issues:out};
}
function adviceHtml(b,o){const a=buildAdvice(b,o);const ico={bad:'✖',warn:'▲',tip:'•'};
 return `<div class="advice">${a.role?`<div class="role"><b>${a.role[0]}</b><span>${a.role[1]}</span></div>`:''}
 ${o.ok&&!a.issues.some(x=>x[0]!=='tip')?'<div class="adv good">✓ Battle-ready</div>':''}
 ${a.issues.map(([l,m])=>`<div class="adv ${l}"><i>${ico[l]}</i><span>${m}</span></div>`).join('')}</div>`}
// ---------- help ----------
const HELP=[
 ['🏁','The basics',`<p>You run a robot fighting team. You <b>build bots</b> in the Garage, send them into matches, and they <b>fight on their own</b>. You never control them during a match. Your job is the build and the tactics.</p><p>Win matches to earn <b>credits</b>, buy better parts, and climb from the Scrap League to the Grand Championship.</p>`],
 ['🔧','Building a bot',`<p>Every bot needs five core parts:</p><ul><li><b>Frame</b>: the body. Sets HP, load limit, and how many weapon mounts and utility bays you get.</li><li><b>Drive</b>: wheels, treads, legs, hover or omni. Sets speed and adds load capacity.</li><li><b>Power core</b>: supplies power for weapons and modules.</li><li><b>AI chip</b>: reaction time and aim.</li><li><b>Armor</b> (optional): cuts incoming damage.</li></ul><p>Then fill the <b>hardpoints</b> with weapons and the <b>utility bays</b> with modules.</p>`],
 ['⬡','Hardpoint sizes',`<p>Each weapon has a size, and each mount on a frame has a size. A weapon fits a mount the <b>same size or bigger</b>.</p><table class="t"><tr><th>Mount</th><th>Takes</th></tr><tr><td>${szBadge('S')} Small</td><td style="text-align:left">S weapons</td></tr><tr><td>${szBadge('M')} Medium</td><td style="text-align:left">S or M weapons</td></tr><tr><td>${szBadge('L')} Large</td><td style="text-align:left">S, M or L weapons</td></tr></table><p>The weapon size badge shows on every weapon in the shop and the picker. Frames list their mounts as badges.</p>`],
 ['⚖','Weight and power',`<p><b>Weight</b>: every part has weight. Total weight must stay under the frame's load limit plus the drive's bonus. Over 100% you slow down. Over 140% the bot cannot move at all.</p><p><b>Power</b>: weapons and modules draw power. If they draw more than the core supplies, weapons fire slower in proportion.</p><p>Both meters are shown under the bot preview in the builder.</p>`],
 ['◆','Part quality',`<p>Parts come in four tiers: <b style="color:${TIERS[1].col}">Mk I Standard</b>, <b style="color:${TIERS[2].col}">Mk II Refined</b>, <b style="color:${TIERS[3].col}">Mk III Prototype</b> and <b style="color:${TIERS[4].col}">Mk IV Masterwork</b>. Higher tiers have better base stats plus 1–3 random <b>affixes</b> like "+15% damage" or "lifesteal".</p><p>The <b>Catalog</b> sells Mk I parts. The <b>Market</b> has rarer parts and restocks after every match. The <b>Workshop</b> upgrades a part's tier or rerolls its affixes.</p>`],
 ['✹','Damage and armor',`<p>Weapons deal one of four damage types: <b style="color:${TYCOL.kinetic}">kinetic</b>, <b style="color:${TYCOL.explosive}">explosive</b>, <b style="color:${TYCOL.energy}">energy</b> or <b style="color:${TYCOL.thermal}">thermal</b>.</p><ul><li>Each <b>armor point</b> blocks 5% of kinetic and explosive damage (half as well against energy and thermal), up to 60%.</li><li>Some armor adds <b>resistances</b> to specific types.</li><li><b>Railguns</b> ignore armor. <b>Thermal</b> weapons set bots on fire.</li></ul>`],
 ['♞','Tactics',`<p><b>Behavior</b> sets how a bot moves: Aggressive closes in, Kiter keeps max range, Flanker circles, Sniper hangs back, Bodyguard protects a weak ally, and so on.</p><p><b>Targeting</b> sets who it shoots. <b>Engage distance</b> scales how close it likes to fight. <b>Retreat below</b> makes it back off and look for repair kits when its HP drops below that level.</p><p>Match the behavior to the weapons: melee bots want Aggressive or Berserker, long-range bots want Sniper or Kiter.</p>`],
 ['⚑','Career and money',`<p>Each league has <b>4 matches and a final</b>. Win the final to unlock the next league, its new parts and bigger purses.</p><ul><li>Wins pay a <b>purse</b>. Losses pay a small appearance fee.</li><li><b>Repairs</b> come out of your winnings, more for bots that were destroyed.</li><li><b>Bounties</b> give extra credits for a side objective.</li><li><b>Side bets</b> let you gamble credits on the result.</li><li><b>Exhibition</b> matches are practice for half pay.</li></ul>`],
 ['★','Reputation, ranks and perks',`<p>Every bot, yours and the rivals', earns <b>reputation</b> from wins, knockouts, damage and MVP awards. Knocking out a famous bot is worth more.</p><p>Reputation unlocks <b>ranks</b>, from Rookie to Immortal. Each new rank gives a <b>perk point</b> to spend in the builder's Perks tab.</p><p>If a rival destroys your bot, it becomes that bot's <b>nemesis</b>. Getting revenge pays bonus reputation.</p>`],
 ['☾','Match conditions',`<p>Many matches roll a special condition, shown before the match:</p><ul>${Object.values(MODIFIERS).map(m=>`<li><b>${m.i} ${m.n}</b>: ${m.d}</li>`).join('')}</ul><p>In every match, <b>repair kits</b> spawn mid-arena, <b>slag pits</b> burn bots without hover drives, and a closing <b>barrier</b> starts at 60 seconds.</p>`],
 ['⌖','Test range',`<p>In the Garage, the <b>Test range</b> lets you try any bot for free against a target dummy (a 30-second damage test), a league sparring partner or one of your own bots. Use it to check a new build before a real match.</p>`]
];
function openHelp(topic){const b=openSheet(`<div class="sheet-h"><h3 class="grow">How to play</h3><button class="btn small ghost" onclick="closeSheet()">✕</button></div>
 ${HELP.map(([i,t,h],k)=>`<details class="help-d" ${topic===k?'open':''}><summary><span class="hi">${i}</span>${t}</summary><div class="help">${h}</div></details>`).join('')}
 <button class="btn small" style="margin-top:12px" id="replayTut">Replay intro tour</button>`);$('#replayTut').onclick=()=>{closeSheet();showTutorial(0)}}
// ---------- first-run tour ----------
const TUT=[
 ['Welcome to Bot Arena','You manage a robot fighting team. Your bots fight on their own. You win by building them well and choosing smart tactics.','⚙'],
 ['Your starter bots','You start with two bots, <b>Rook</b> and <b>Sparrow</b>, and ¢1,500. Open the <b>Garage</b> tab to see them. Tap a bot to change its parts, tactics and paint.','🔧'],
 [`Hardpoints: ${szBadge('S')}${szBadge('M')}${szBadge('L')}`,'Weapons fit mounts of the <b>same size or bigger</b>. A medium mount takes S or M weapons. The size badge is on every weapon.','⬡'],
 ['Fight and earn','On the <b>Career</b> tab, tap <b>Prepare</b> to scout the enemy, pick your squad and start. The first match is easy. Later ones need upgrades, so spend your winnings in the <b>Parts</b> tab.','⚑'],
 ['Need help?','The <b>?</b> button at the top opens a short guide to every system. The builder also tells you what each bot needs.','?']];
function showTutorial(i=0){if(i>=TUT.length){S.tut=1;persist();closeDlg();return}const [t,d,ic]=TUT[i];
 openSheet(`<div class="tut"><div class="tut-ic">${ic}</div><h3>${t}</h3><p>${d}</p><div class="dots">${TUT.map((_,k)=>`<i class="${k===i?'on':''}"></i>`).join('')}</div>
 <div class="row"><button class="btn ghost grow" id="tutSkip">${i<TUT.length-1?'Skip':''}</button><button class="btn primary grow" id="tutNext">${i<TUT.length-1?'Next':"Let's go"}</button></div></div>`,true);
 $('#tutNext').onclick=()=>showTutorial(i+1);$('#tutSkip').onclick=()=>showTutorial(TUT.length)}
// ---------- what to do next ----------
function nextSteps(){const out=[];
 const notReady=S.bots.filter(b=>!compute(b).ok);
 const pp=S.bots.filter(b=>perkPts(b)>0);
 if(notReady.length)out.push(['⚠',`${notReady.map(b=>esc(b.name)).join(', ')} ${notReady.length>1?'are':'is'} not battle-ready`,'Fix in Garage','garage']);
 if(pp.length)out.push(['★',`${pp.map(b=>esc(b.name)).join(', ')} ${pp.length>1?'have':'has'} perk points to spend`,'Open Garage','garage']);
 const spare=Object.values(S.inv).filter(p=>!p.on).length;
 if(S.credits>=800&&S.matches>0&&out.length<2)out.push(['⛁',`You have ¢${fmt(S.credits)} to spend on upgrades`,'Browse parts','shop']);
 if(spare>=3&&out.length<2)out.push(['⚙',`${spare} unused parts in storage. Install or sell them`,'Storage','shop']);
 return out.slice(0,2)}
