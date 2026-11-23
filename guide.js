'use strict';
// ================= presentation helpers: chips, size badges, build advice, help, tutorial =================
const SZNAME={1:'Small',2:'Medium',3:'Large'};
const SZFITS={S:'small weapons only',M:'small or medium weapons',L:'any weapon'};
const TYCOL={kinetic:'#c9d1db',explosive:'#ff9a4a',energy:'#5fe3ff',thermal:'#ff6a3d'};
function szBadge(s){const L=typeof s==='number'?'SML'[s-1]:s;return `<span class="szb sz${L}" title="${SZNAME[SZ[L]]} hardpoint">${L}</span>`}
function ch(k,v){return `<span class="ch"><b>${k}</b>${v}</span>`}
function tyTag(t){return `<span class="ty" style="color:${TYCOL[t]};border-color:${TYCOL[t]}55">${t}</span>`}
const PDESC={
 frame:{wasp:'Small, fast and cheap. Carries one medium weapon, but breaks easily.',jackal:'Balanced starter frame. One medium and one small weapon, plus two utility bays.',mantis:'Light and quick with three weapon mounts: two small claw guns and one medium.',phantom:'The fastest frame. Two medium weapons, but not much health.',rhino:'Tough bruiser. Carries one large weapon plus a small rear gun.',viper:'Built around one large weapon, with three bays for support gear.',hydra:'Four small weapon mounts. Lots of guns, each one light.',bastion:'Sturdy all-rounder with three medium weapon mounts and three bays.',golem:'Heavy siege frame: one large weapon, two small side guns, lots of health.',citadel:'The biggest, toughest frame. Two large weapon mounts. Slow.'},
 drive:{wheels:'Fast and cheap on flat ground. Adds no carrying capacity.',offroad:'Grippier wheels. Carry a little more and take less damage from slag.',treads:'Slow, but carry much more weight and are hard to push around.',legs:'Turn very sharply and step around slag. Average speed.',omni:'Move in any direction while staying pointed at the target.',hover:'Fast, and floats over slag and mines. Slides a little when turning.'},
 core:{battery:'Basic power. Enough for one or two light weapons.',cell:'Solid power for most mid-sized builds.',capacitor:'Moderate power, plus 50% faster firing for the first 8 seconds of a match.',fusion:'High power for heavy weapons. Explodes a little when destroyed.',reactor:'Huge power for the biggest builds. Explodes violently when destroyed, hurting everyone nearby.'},
 armor:{steel:'Cheap and solid, but heavy.',composite:'Light armor that also shrugs off some energy damage.',reactive:'Cuts explosive damage from rockets, cannons and mines.',ceramic:'Resists lasers, tesla and fire.',ablative:'Soaks up the first 70 damage the bot takes, and resists fire.',titanium:'Strong protection at a low weight.',neutronium:'The best armor available. Tough against everything.'},
 weapon:{lmg:'A fast stream of light bullets. A good all-rounder.',pulse:'Accurate energy shots at medium range.',spike:'A ram on the front. Hits whatever the bot drives into.',needle:'Long-range rifle. Its shots ignore half of the target\'s armor.',microm:'Fires two small homing missiles at a time.',torch:'Tiny flamethrower. Very short range, sets targets on fire.',minigun:'Starts slow, then spins up into a hail of bullets.',shotgun:'Fires 7 pellets at once. Devastating up close and pushes targets back.',autocannon:'Heavy shells with strong damage at medium to long range.',laser:'A beam that hits instantly. Never misses a target it can see.',rockets:'A homing rocket that explodes, hurting everything nearby.',grenade:'Lobs grenades over walls. They explode in an area.',flamer:'Short-range cone of fire that sets bots ablaze.',tesla:'Lightning that jumps between up to 3 nearby enemies and can stun them.',saw:'Spinning blade for close combat. Steady damage up close.',rail:'Charges up, then fires a shot that goes through bots and ignores armor.',cannon:'Huge explosive shell. Big damage and knockback, slow to reload.',missiles:'Fires a salvo of 6 homing missiles.',mortar:'Long-range artillery that fires over walls. Cannot hit targets that are very close.',lance:'Heavy plasma beam that can set targets on fire.',hammer:'Massive melee strike that knocks targets back and stuns them.',inferno:'Huge flamethrower with a wide cone.'},
 util:{shield:'A 50-point energy shield. Recharges when the bot avoids damage for a few seconds.',repair:'Repairs the bot during battle, 4 health every second.',booster:'Short bursts of speed to charge in or escape.',plating:'Adds 25% more health, but is heavy.',gyro:'Less knockback and steadier aim.',spikes:'Melee attackers take half their own damage back.',mines:'Drops proximity mines behind the bot, up to 3 at once.',overclock:'Weapons fire 25% faster. Uses a lot of power.',cooling:'Weapons fire 15% faster, and the bot cannot be set on fire.',targeting:'Weapons reach 15% farther and are more accurate.',flares:'Each homing missile aimed at this bot has a 45% chance to be thrown off.',decoy:'Nearby enemies focus their fire on this bot. Best on tough bots.',emp:'Every 9 seconds, stuns nearby enemies and drains their shields.',gundrone:'A small drone circles the bot and shoots at its target.',medidrone:'A drone that repairs whichever teammate is most damaged.',stealth:'Turns nearly invisible for 3 seconds out of every 10.'},
 chip:{basic:'Slow to react and aim. Fine for starting out.',tactical:'Reacts faster and leads moving targets better.',neural:'Top-tier reflexes and aim. Dodges incoming missiles.'}};
// one-line summary used in compact lists
function partBrief(p){const B=baseOf(p),m=TIERS[p.t].mul,a=p.af||{};
 switch(p.c){
  case 'frame':return `${Math.round(B.hp*m*2.2)} HP · carries ${B.load} · ${B.mounts.map(x=>szBadge(x[0])).join('')} · ${B.util} bay${B.util>1?'s':''}`;
  case 'drive':return `Speed ${Math.round(B.speed*(1+(m-1)*.5))} · carry ${B.load>0?'+'+B.load:B.load<0?B.load:'+0'} · ${turnWord(B.turn)} turns`;
  case 'core':return `Supplies ${Math.round(B.pow*m*10)/10} power · weight ${B.w}${B.boom?' · explodes':''}`;
  case 'armor':return `Blocks ${Math.round(B.ar*m)*5}% · ${B.hp?'+'+Math.round(B.hp*m*100)+'% HP · ':''}weight ${B.w}`;
  case 'weapon':{const d=B.dmg*m*(1+(a.dmg||0)),rate=1/B.cd*(1+(a.rate||0)),dps=B.kind==='rail'?d/(B.cd+B.charge):d*(B.pellets||1)*(B.salvo||1)*rate,rg=Math.round(B.rng*(1+(a.range||0)));return `${szBadge(B.sz)} ~${Math.round(dps)} dmg/s · ${B.kind==='melee'?'melee':rangeWord(rg)+' range'} · wt ${B.w}`}
  default:return PDESC[p.c][p.k];
 }}

Object.assign(PDESC.frame,{scarab:'Cheap, armored and steady. Two small guns and two utility bays.',warlord:'Huge command platform: one large weapon and two medium side guns.'});
Object.assign(PDESC.drive,{lighttracks:'Narrow treads. A middle ground between wheels and full tank treads.',racing:'The fastest wheels, but they turn wide and carry a little less.',gyroball:'Rolls on one big sphere. Very fast and nimble, but carries less and gets shoved around.',hexapod:'Six sturdy legs. Carries a lot, turns sharply and steps around slag.',maglev:'Floats on magnets: immune to slag and mines, and strafes in any direction.'});
Object.assign(PDESC.core,{solar:'Very light and cheap, but weak. Fine for a single small gun.',diesel:'Cheap, decent power, but very heavy.',twin:'Two batteries in one pack. Good power for its price.',plasma:'Strong power at a light weight. Small explosion when destroyed.',quantum:'High power, light, and completely stable.',singularity:'The most power available. Very heavy, and explodes massively when destroyed.'});
Object.assign(PDESC.armor,{scrap:'Junk metal welded on. Cheap, a little protection.',aluminum:'Light panels. A little protection without slowing you down.',spaced:'Layered plates that blunt explosions and bullets.',mirror:'Mirror finish that deflects lasers and other energy weapons.',nano:'Self-knitting fibers. Strong and light, resists fire and energy.'});
Object.assign(PDESC.chip,{salvaged:'Pulled from a scrapyard. Slow and shaky, but almost free.',veteran:'A cheap upgrade over the basic board. Quicker to react.',hunter:'Excellent at leading moving targets.',reflex:'Lightning-fast reactions, average aim.',marksman:'Steady, fast-turning aim. Great for big guns.',swarm:'Fast reactions and good aim for team play.',predictive:'Calculates exactly where targets will be.',quantummind:'The best mind available. Near-instant reactions, perfect aim, dodges missiles.'});
Object.assign(PDESC.weapon,{smg:'Sprays light bullets at short range. Very fast firing.',sawnoff:'Short-barreled shotgun. 5 pellets, brutal point-blank.',drill:'A spinning drill bit for close combat. Fast, steady hits.',zapper:'Small tesla coil. Lightning jumps between 2 enemies and can stun.',minilaser:'A compact beam laser. Short range, never misses.'});
Object.assign(PDESC.frame,{raptor:'Fast hunter with two medium weapons and a small rear gun.',leviathan:'Colossal and slow: one large and two medium weapons, plus four utility bays.'});
Object.assign(PDESC.core,{dynamo:'Very light, modest power. Good for fast builds.'});
Object.assign(PDESC.armor,{mesh:'Very light armor that stops some bullets.',adaptive:'Light, very strong armor that resists every damage type.'});
Object.assign(PDESC.weapon,{dart:'Accurate energy darts that can stun.',claw:'Crushing melee grip that briefly stuns.',flak:'Three exploding shells per shot. Great against groups.',cryo:'Freezing bolts that slow the target down.',gauss:'Quick-charging magnetic rifle. Ignores armor.',gatling:'Giant rotary gun. Spins up into a storm of bullets.',ion:'Heavy beam that rips through shields three times faster.',plasma:'Slow, massive plasma bolt that explodes on impact.',swarm:'Launches 10 homing mini-missiles at once.'});
Object.assign(PDESC.util,{ammofeed:'All weapons deal 12% more damage.',servos:'12% faster, with sharper turning.',sensor:'Weapons reach 10% farther, and cloaked enemies are spotted.',repulsor:'Every 6 seconds, blasts nearby enemies away.',aegis:'A strong 90-point shield that recharges.',nanoforge:'Repairs the bot fast, 8 health every second.'});
function rangeWord(r){return r<=200?'short':r<=400?'medium':'long'}
function turnWord(x){return x<.9?'slow':x<1.15?'normal':x<1.3?'quick':'very quick'}
const kv=(k,v)=>`<div><span>${k}</span><b>${v}</b></div>`;
// p: part. compact: stats only (no sentence)
function partLine(p,compact){const B=baseOf(p),m=TIERS[p.t].mul,a=p.af||{};let rows='';
 switch(p.c){
  case 'frame':rows=kv('Health',Math.round(B.hp*m*2.2))+kv('Carry limit',B.load)+kv('Armor',B.armor?B.armor+' ('+B.armor*5+'% block)':'none')+kv('Weapon mounts',B.mounts.map(x=>szBadge(x[0])).join(''))+kv('Utility bays',B.util);break;
  case 'drive':rows=kv('Top speed',Math.round(B.speed*(1+(m-1)*.5)))+kv('Carry bonus',B.load>0?'+'+B.load:B.load<0?B.load:'none')+kv('Turning',turnWord(B.turn))+kv('Slag damage',B.haz>=1?'immune':B.haz?'-'+B.haz*100+'%':'full');break;
  case 'core':rows=kv('Power supplied',Math.round(B.pow*m*10)/10)+kv('Weight',B.w)+(B.boom?kv('On destruction','explodes'):'');break;
  case 'armor':{const ar=Math.round(B.ar*m);rows=kv('Damage blocked',ar*5+'%')+kv('Extra health',B.hp?'+'+Math.round(B.hp*m*100)+'%':'none')+kv('Weight',B.w)+(B.abl?kv('Soaks first',B.abl+' dmg'):'')+(Object.keys(B.res).length?kv('Resists',Object.entries(B.res).map(([k,v])=>k+' '+v*100+'%').join(', ')):'');break}
  case 'weapon':{const d=B.dmg*m*(1+(a.dmg||0)),rate=1/B.cd*(1+(a.rate||0)),dps=B.kind==='rail'?d/(B.cd+B.charge):d*(B.pellets||1)*(B.salvo||1)*rate,rg=Math.round(B.rng*(1+(a.range||0)));
   rows=kv('Size',szBadge(B.sz)+' '+SZNAME[B.sz])+kv('Damage/sec','~'+Math.round(dps))+kv('Per hit',(Math.round(d*10)/10)+(B.pellets?' × '+B.pellets+' pellets':B.salvo>1?' × '+B.salvo+' missiles':''))+kv('Range',B.kind==='melee'?'melee (touch)':rg+' · '+rangeWord(rg))+kv('Type',`<span style="color:${TYCOL[B.ty]}">${B.ty}</span>`)+kv('Weight',B.w)+kv('Power use',B.p);break}
  case 'util':rows=kv('Weight',B.w)+kv('Power use',B.p);break;
  case 'chip':rows=kv('Reaction time',B.react+' s')+kv('Aim speed','×'+Math.round(B.aim*m*100)/100);break;
 }
 return (compact?'':`<div class="pdesc">${PDESC[p.c][p.k]}</div>`)+`<div class="kv">${rows}</div>`}

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
function adviceHtml(b,o){const a=buildAdvice(b,o),ico={bad:'✖',warn:'▲',tip:'•'};const top=a.issues.find(x=>x[0]==='bad')||a.issues.find(x=>x[0]==='warn');
 return `<div class="advice">${top?`<div class="adv ${top[0]}"><i>${ico[top[0]]}</i><span>${top[1]}</span></div>`:o.ok?`<div class="adv good">✓ Battle-ready${a.role?` <span class="dim" style="font-weight:500">· ${a.role[0]}</span>`:''}</div>`:''}</div>`}
// ---------- help ----------
const HELP=[
 ['🏁','The basics',`<p>You run a robot fighting team. You <b>build bots</b> in the Garage, send them into matches, and they <b>fight on their own</b>. You never control them during a match. Your job is the build and the tactics.</p><p>Win matches to earn <b>credits</b>, buy better parts, and climb from the Scrap League to the Grand Championship.</p>`],
 ['🔧','Building a bot',`<p>Every bot needs five core parts:</p><ul><li><b>Frame</b>: the body. Sets HP, load limit, and how many weapon mounts and utility bays you get.</li><li><b>Drive</b>: wheels, treads, legs, hover or omni. Sets speed and adds load capacity.</li><li><b>Power core</b>: supplies power for weapons and modules.</li><li><b>AI chip</b>: reaction time and aim.</li><li><b>Armor</b> (optional): cuts incoming damage.</li></ul><p>Then fill the <b>hardpoints</b> with weapons and the <b>utility bays</b> with modules.</p>`],
 ['⬡','Hardpoint sizes',`<p>Each weapon has a size, and each mount on a frame has a size. A weapon fits a mount the <b>same size or bigger</b>.</p><table class="t"><tr><th>Mount</th><th>Takes</th></tr><tr><td>${szBadge('S')} Small</td><td style="text-align:left">S weapons</td></tr><tr><td>${szBadge('M')} Medium</td><td style="text-align:left">S or M weapons</td></tr><tr><td>${szBadge('L')} Large</td><td style="text-align:left">S, M or L weapons</td></tr></table><p>The weapon size badge shows on every weapon in the shop and the picker. Frames list their mounts as badges.</p>`],
 ['⚖','Weight and power',`<p><b>Weight</b>: every part has weight. Total weight must stay under the frame's load limit plus the drive's bonus. Over 100% you slow down. Over 140% the bot cannot move at all.</p><p><b>Power</b>: weapons and modules draw power. If they draw more than the core supplies, weapons fire slower in proportion.</p><p>Both meters are shown under the bot preview in the builder.</p>`],
 ['◆','Part quality',`<p>Parts come in four tiers: <b style="color:${TIERS[1].col}">Mk I Standard</b>, <b style="color:${TIERS[2].col}">Mk II Refined</b>, <b style="color:${TIERS[3].col}">Mk III Prototype</b> and <b style="color:${TIERS[4].col}">Mk IV Masterwork</b>. Higher tiers have better base stats plus 1–3 random <b>affixes</b> like "+15% damage" or "lifesteal".</p><p>Buy Mk I parts straight from a bot's slot in the builder. The <b>Market</b> in the Parts tab has rarer parts and restocks after every match. Tap any part under <b>My parts</b> to upgrade, reroll or sell it.</p>`],
 ['✹','Damage and armor',`<p>Weapons deal one of four damage types: <b style="color:${TYCOL.kinetic}">kinetic</b>, <b style="color:${TYCOL.explosive}">explosive</b>, <b style="color:${TYCOL.energy}">energy</b> or <b style="color:${TYCOL.thermal}">thermal</b>.</p><ul><li>Each <b>armor point</b> blocks 5% of kinetic and explosive damage (half as well against energy and thermal), up to 60%.</li><li>Some armor adds <b>resistances</b> to specific types.</li><li><b>Railguns</b> ignore armor. <b>Thermal</b> weapons set bots on fire.</li></ul>`],
 ['♞','Tactics',`<p><b>Behavior</b> sets how a bot moves: Aggressive closes in, Kiter keeps max range, Flanker circles, Sniper hangs back, Bodyguard protects a weak ally, and so on.</p><p><b>Targeting</b> sets who it shoots. <b>Engage distance</b> scales how close it likes to fight. <b>Retreat below</b> makes it back off and look for repair kits when its HP drops below that level.</p><p>Match the behavior to the weapons: melee bots want Aggressive or Berserker, long-range bots want Sniper or Kiter.</p>`],
 ['⚑','Career and money',`<p>Each league has <b>4 matches and a final</b>. Win the final to unlock the next league, its new parts and bigger purses.</p><ul><li>Wins pay a <b>purse</b>. Losses pay a small appearance fee.</li><li><b>Repairs</b> come out of your winnings, more for bots that were destroyed.</li><li><b>Bounties</b> give extra credits for a side objective.</li><li><b>Side bets</b> let you gamble credits on the result.</li><li><b>Exhibition</b> matches are practice for half pay.</li></ul>`],
 ['★','Reputation, ranks and perks',`<p>Every bot, yours and the rivals', earns <b>reputation</b> from wins, knockouts, damage and MVP awards. Knocking out a famous bot is worth more.</p><p>Reputation unlocks <b>ranks</b>, from Rookie to Immortal. Each new rank gives a <b>perk point</b> to spend in the builder's Perks tab.</p><p>If a rival destroys your bot, it becomes that bot's <b>nemesis</b>. Getting revenge pays bonus reputation.</p>`],
 ['☾','Match conditions',`<p>Many matches roll a special condition, shown before the match:</p><ul>${Object.values(MODIFIERS).map(m=>`<li><b>${m.i} ${m.n}</b>: ${m.d}</li>`).join('')}</ul><p>In every match, <b>repair kits</b> spawn mid-arena and a closing <b>barrier</b> starts at 60 seconds.</p>`],
 ['▦','Arenas',`<p>Each arena has its own layout and hazards:</p><ul><li><b>Slag pits</b> burn. Hover and mag-lev drives float over them.</li><li><b>Floor saws</b> shred anything that touches them.</li><li><b>Ice</b> makes bots slide and lose grip, except floating drives.</li><li><b>Crates</b> block shots until destroyed.</li></ul>`],
 ['⌖','Test range',`<p>In the Garage, the <b>Test range</b> lets you try any bot for free against a target dummy (a 30-second damage test), a league sparring partner or one of your own bots. Use it to check a new build before a real match.</p>`]
];
// ---------- first-run tour ----------
const TUT=[
 ['Welcome to Bot Arena','You manage a robot fighting team. Your bots fight on their own. You win by building them well and choosing smart tactics.','⚙'],
 ['Build your first bot',`You start with an empty garage and ¢${fmt(STARTING_CREDITS)}. In the <b>Garage</b>, tap <b>+ New bot</b>, then tap each slot to buy a part. That's enough for one well-armed bot or two basic ones.`,'🔧'],
 [`Hardpoints: ${szBadge('S')}${szBadge('M')}${szBadge('L')}`,'Weapons fit mounts of the <b>same size or bigger</b>. A medium mount takes S or M weapons. The size badge is on every weapon.','⬡'],
 ['Fight and earn','On the <b>Career</b> tab, tap <b>Prepare</b> to scout the enemy, pick your squad and start. A bot needs a frame, drive, power core, AI chip and a weapon to fight. Later ones need upgrades, so spend your winnings on better parts.','⚑'],
 ['Need help?','The <b>☰</b> menu at the top has a short guide to every system. The builder also tells you what each bot needs.','?']];
function showTutorial(i=0){if(i>=TUT.length){S.tut=1;persist();closeDlg();return}const [t,d,ic]=TUT[i];
 openSheet(`<div class="tut"><div class="tut-ic">${ic}</div><h3>${t}</h3><p>${d}</p><div class="dots">${TUT.map((_,k)=>`<i class="${k===i?'on':''}"></i>`).join('')}</div>
 <div class="row"><button class="btn ghost grow" id="tutSkip">${i<TUT.length-1?'Skip':''}</button><button class="btn primary grow" id="tutNext">${i<TUT.length-1?'Next':"Let's go"}</button></div></div>`,true,null,false);
 $('#tutNext').onclick=()=>showTutorial(i+1);$('#tutSkip').onclick=()=>showTutorial(TUT.length)}
// ---------- what to do next ----------
function nextSteps(){const out=[];
 if(!S.bots.length)return [['🔧','Build your first bot to start your career','Garage','garage']];
 const notReady=S.bots.filter(b=>!compute(b).ok);
 const pp=S.bots.filter(b=>perkPts(b)>0);
 if(notReady.length)out.push(['⚠',`${notReady.map(b=>esc(b.name)).join(', ')} ${notReady.length>1?'are':'is'} not battle-ready`,'Fix in Garage','garage']);
 if(pp.length)out.push(['★',`${pp.map(b=>esc(b.name)).join(', ')} ${pp.length>1?'have':'has'} perk points to spend`,'Open Garage','garage']);
 const spare=Object.values(S.inv).filter(p=>!p.on).length;
 if(S.credits>=800&&S.matches>0&&out.length<2)out.push(['⛁',`You have ¢${fmt(S.credits)} to spend on upgrades`,'Browse parts','shop']);
 if(spare>=3&&out.length<2)out.push(['⚙',`${spare} unused parts in storage. Install or sell them`,'Storage','shop']);
 return out.slice(0,1)}
