import * as T from './vendor/three.module.js';
import {Space,Vec2} from './vendor/nape/index.js';
import Game,{controller,sites} from './parking-source.mjs';
import {KEY,profile,mergeProfile,paints,canPaint,unlock} from './core.mjs';
import {YardAudio} from './audio.mjs';
import {bridge} from './sdk.mjs';
const $=id=>document.getElementById(id),safe=(fn)=>{try{return fn();}catch{return undefined;}};
let p=profile(safe(()=>JSON.parse(localStorage.getItem(KEY)))||{}),running=false,paused=false,everDriven=false,disposed=false,last=0,acc=0,autoSave=0,resultDelay=0,resultShown=false,lastNear=false,redraw=true,pointer=null;
const audio=new YardAudio();audio.mute(p.muted);
if(!canPaint(p,p.paint))p.paint='mint';
let sdk,space,renderer,scene,camera;
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),1800);}
function localSave(){safe(()=>localStorage.setItem(KEY,JSON.stringify(p)));}
function checkpoint(cloud=false){if(running&&!resultShown){const s=controller.snapshot();if(s){s.updatedAt=Date.now();p.active=s;}}localSave();if(cloud)sdk?.save();}
function stopInput(){controller.release();pointer=null;$('knob').style.transform='translate(-50%,-50%)';}
function vibrate(t){safe(()=>navigator.vibrate?.(t));}
function event(e){
 if(e.type==='drive'){everDriven=true;sdk.start();audio.setActive(!paused);}
 if(e.type==='win'){
   p.best[e.level]=Math.max(p.best[e.level],e.result.stars);p.scores[e.level]=Math.max(p.scores[e.level],e.result.score);p.active=null;localSave();sdk.end();sdk.save();audio.event('win');vibrate([35,60,45]);resultDelay=0;resultShown=false;stopInput();
   $('task').textContent='Right at home!';$('check').textContent='✓';$('flash').style.background='#fff1be';$('flash').animate([{opacity:.25},{opacity:0}],{duration:500});
 }
 if(e.type==='bump'||e.type==='cone'){audio.event(e.type);vibrate(e.type==='bump'?28:12);toast(e.type==='bump'?'A little bump. Keep going.':'Cone down!');if(e.type==='bump'){$('flash').style.background='#e78768';$('flash').animate([{opacity:.12},{opacity:0}],{duration:220});}}
}
function openPause(){if(!$('welcome').hidden||!$('error').hidden)return;stopInput();paused=true;redraw=true;checkpoint(true);audio.setActive(false);renderMenu();$('shade').hidden=false;}
function closePause(){paused=false;$('shade').hidden=true;audio.unlock();audio.setActive(running);last=performance.now();acc=0;}
function start(index,resume=false){
 if(running&&controller.state().phase!=='done'){sdk.end();p.active=null;}
 stopInput();sdk.prepare();resultShown=false;resultDelay=0;paused=false;everDriven=false;lastNear=false;
 p.selected=index;controller.setBest(p.best);controller.color(paints[canPaint(p,p.paint)?p.paint:'mint']);controller.guide(p.guide);
 const restored=resume&&p.active&&controller.restore(p.active);
 if(!restored){controller.begin(index);p.active=null;}
 running=true;$('welcome').hidden=true;$('shade').hidden=true;$('result').hidden=true;$('driveUI').hidden=false;
 $('site').textContent=sites[index].name.toUpperCase();$('task').textContent='Park the trailer';$('check').textContent='↙';$('introNum').textContent=String(index+1).padStart(2,'0');$('introTitle').textContent=sites[index].name;
 $('hint').textContent=index===0?'Hold down to reverse · release to brake':'Up: drive · down: reverse · drag to steer';
 audio.unlock();audio.setActive(true);audio.event('tap');localSave();last=performance.now();acc=0;
}
function showResult(s){
 resultShown=true;stopInput();$('driveUI').hidden=true;$('result').hidden=false;$('resultPlace').textContent=sites[s.level].name.toUpperCase();$('rating').textContent='★'.repeat(s.result.stars)+'☆'.repeat(3-s.result.stars);
 $('rTime').textContent=clock(s.result.time);$('rBumps').textContent=s.result.bumps;$('rAcc').textContent=Math.round(s.result.acc)+'%';$('newBest').textContent=s.result.isBest?'A new personal best. Nicely done.':'A little better, a little smoother.';
 $('next').innerHTML=(s.level===5?'BACK TO THE YARD':'NEXT STOP')+' <span>→</span>';
}
function clock(t){return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');}
function renderMenu(){
 redraw=true;
 const current=controller.state().level,n=unlock(p);$('sites').replaceChildren();
 sites.forEach((s,i)=>{const b=document.createElement('button');b.textContent=s.name;const star=document.createElement('b');star.textContent=i>n?'LOCKED':'★'.repeat(p.best[i])+'☆'.repeat(3-p.best[i]);b.append(star);b.disabled=i>n;b.classList.toggle('current',i===current);b.addEventListener('click',()=>start(i));$('sites').append(b);});
 $('sound').textContent=p.muted?'Sound off':'Sound on';$('guide').textContent=p.guide?'Guide on':'Guide off';$('paints').replaceChildren();
 for(const id of Object.keys(paints)){const b=document.createElement('button'),allowed=canPaint(p,id);b.style.background='#'+paints[id].toString(16);b.textContent=p.paint===id?'✓':allowed?'':'♧';b.disabled=!allowed;b.setAttribute('aria-label',id+' paint'+(!allowed?' locked':''));b.classList.toggle('selected',p.paint===id);b.title=id==='sunset'?'Sunset: 6 stars or a confirmed host comment':id==='gold'?'Gold: 12 stars or a confirmed host like':'Mint';b.onclick=()=>{p.paint=id;controller.color(paints[id]);checkpoint(true);renderMenu();};$('paints').append(b);}
 const support=sdk.support();$('social').hidden=!support.like&&!support.comment;$('social').textContent=[support.comment?'Optional host comment: Sunset paint.':'',support.like?'Optional host like: Gold paint.':'','Also unlock with 6 / 12 stars. Claims save to this game profile.'].filter(Boolean).join(' ');
}
function updateHUD(s){
 document.body.dataset.phase=paused?'paused':!running?'ready':s.phase;document.body.dataset.level=String(s.level);
 $('time').textContent=clock(s.clock);$('bumps').textContent='◇ '+s.bumps;$('stars').textContent='★ '+p.best.reduce((a,b)=>a+b,0)+' / 18';
 if(s.phase!=='done'){$('check').textContent='➜';$('check').style.transform=`rotate(${s.bearing}rad)`;}else{$('check').textContent='✓';$('check').style.transform='none';}
 $('inbay').classList.toggle('yes',!!s.park?.inside);$('square').classList.toggle('yes',!!s.park?.aligned);$('still').classList.toggle('yes',!!s.park?.stopped);
 $('progress').firstElementChild.style.width=Math.min(100,s.hold/s.holdGoal*100)+'%';
 $('gear').firstChild.textContent=s.gear<0?'R ':'D ';$('gear').lastElementChild.textContent=s.gear<0?'REVERSE':'DRIVE';
 $('intro').classList.toggle('show',running&&s.phase==='intro');
 if(s.phase==='play'&&s.park?.inside&&s.park.aligned&&s.speed>.1)$('task').textContent='Let go to park';
 else if(s.phase==='play')$('task').textContent=s.park?.inside&&!s.park?.aligned?'Straighten the trailer':'Park the trailer';
 if(s.phase==='play'&&Math.abs(s.angle)>1.05){$('hint').textContent='Too folded? Drive forward to straighten.';}else if(s.phase==='play'&&s.level>0){$('hint').textContent='Up: drive · down: reverse · drag to steer';}
 if(s.phase==='done'&&!resultShown){resultDelay+=1/60;if(resultDelay>1.2)showResult(s);}
 if(s.park?.near&&!lastNear&&s.phase==='play')audio.event('near');lastNear=!!s.park?.near;
 audio.update(s.speed,s.gear,s.park?.near&&s.phase==='play'&&!s.park?.inside);
}
try{
 renderer=new T.WebGLRenderer({canvas:$('world'),antialias:true,alpha:false,powerPreference:'default'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
 scene=new T.Scene();camera=new T.PerspectiveCamera(42,1,1,5000);space=new Space(new Vec2(0,0));Game.setup(space);controller.configure(event);controller.setBest(p.best);controller.color(paints[p.paint]);controller.guide(p.guide);
 sdk=bridge({read:()=>profile(p),write:(v,merge)=>{p=merge?mergeProfile(p,v):profile(v);if(!canPaint(p,p.paint))p.paint='mint';localSave();},changed:e=>{
   if(e.type==='reward'){audio.event('win');toast(e.kind==='like'?'Gold paint unlocked.':'Sunset paint unlocked.');if(paused)renderMenu();}
   if(e.type==='support'&&paused)renderMenu();
   if(e.type==='cloud'&&!running&&p.active){$('play').innerHTML='CONTINUE <span>→</span>';$('welcome').querySelector('p').textContent='Your trailer is right where you left it.';$('site').textContent=sites[p.active.level].name.toUpperCase();}
 }});
 const loaded=p.active&&controller.restore(p.active);if(!loaded)controller.begin(p.selected);
 if(loaded){$('play').innerHTML='CONTINUE <span>→</span>';$('welcome').querySelector('p').textContent='Your trailer is right where you left it.';}
 $('site').textContent=sites[loaded?p.active.level:p.selected].name.toUpperCase();
 function resize(){const v=sdk.viewport(),w=Math.round(v?.width||innerWidth),h=Math.round(v?.height||innerHeight);renderer.setSize(w,h,false);camera.aspect=w/h;if(w/h<.8)camera.setViewOffset(w,h,0,h*.12,w,h);else camera.clearViewOffset();camera.updateProjectionMatrix();redraw=true;}
 resize();addEventListener('resize',resize);addEventListener('orientationchange',resize);
 const pad=$('pad');function drive(e){const r=pad.getBoundingClientRect(),dx=Math.max(-56,Math.min(56,e.clientX-r.left-r.width/2)),dy=Math.max(-56,Math.min(56,e.clientY-r.top-r.height/2));let st=dx/50,th=Math.abs(dy)>12?-dy/50:0;if(Math.abs(st)<.14)st=0;controller.input(th,st);$('knob').style.transform=`translate(calc(-50% + ${dx*.7}px),calc(-50% + ${dy*.7}px))`;}
 pad.addEventListener('pointerdown',e=>{if(!running||paused||!['play','intro'].includes(controller.state().phase))return;e.preventDefault();pointer=e.pointerId;pad.setPointerCapture(e.pointerId);audio.unlock();drive(e);});
 pad.addEventListener('pointermove',e=>{if(pointer===e.pointerId)drive(e);});
 for(const n of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(n,e=>{if(pointer===e.pointerId){stopInput();checkpoint(true);}});
 $('play').onclick=()=>start(p.active?.level??p.selected,!!p.active);$('pause').onclick=openPause;$('resume').onclick=closePause;
 $('retry').onclick=()=>start(controller.state().level);$('replay').onclick=()=>start(controller.state().level);$('next').onclick=()=>start((controller.state().level+1)%6);
 $('sound').onclick=()=>{p.muted=!p.muted;audio.unlock();audio.mute(p.muted);localSave();sdk.save();renderMenu();};
 $('guide').onclick=()=>{p.guide=!p.guide;controller.guide(p.guide);localSave();sdk.save();renderMenu();};$('camera').onclick=()=>{controller.camera();redraw=true;audio.event('tap');};
 addEventListener('keydown',e=>{if(e.code==='Enter'){e.stopImmediatePropagation();return;}if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(paused)closePause();else openPause();}if(['KeyR','KeyC','KeyV','KeyG','KeyF'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();}if(paused||!running||controller.state().phase==='done'){if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','Space'].includes(e.code))e.stopImmediatePropagation();}},{capture:true});
 addEventListener('blur',()=>{if(running&&!resultShown&&!paused)openPause();else stopInput();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&running&&!paused&&!resultShown)openPause();});
 addEventListener('pagehide',()=>{checkpoint(true);sdk.stop();controller.teardown();audio.stop();disposed=true;});
 $('world').addEventListener('webglcontextlost',e=>{e.preventDefault();checkpoint(true);paused=true;audio.setActive(false);$('error').hidden=false;$('errorText').textContent='Graphics were interrupted. Your progress is saved. Reload to continue.';});
 let samples=0,slow=0,lastFrame=performance.now();
 function frame(now){if(disposed)return;requestAnimationFrame(frame);if(document.hidden||paused&&!redraw){last=now;acc=0;return;}const dt=Math.min(.05,(now-(last||now))/1000);last=now;const renderDt=now-lastFrame;lastFrame=now;if(running&&!paused){acc+=dt;let n=0;while(acc>=1/60&&n++<4){space.step(1/60,10,4);acc-=1/60;}autoSave+=dt;if(autoSave>2){checkpoint();autoSave=0;}}
   if(!paused)Game.step();if(!paused||redraw){Game.render3d(renderer,scene,camera,space,renderer.domElement.width,renderer.domElement.height,0,0,{});redraw=false;}updateHUD(controller.state());
   if(running&&!paused&&++samples>120){slow+=renderDt>30?1:0;if(samples>=360){if(slow>150&&renderer.getPixelRatio()>1){renderer.setPixelRatio(1);resize();}samples=0;slow=0;}}
 }requestAnimationFrame(frame);
}catch(e){console.error(e);$('error').hidden=false;$('welcome').hidden=true;$('errorText').textContent='The yard could not start. Please try a current WebGL browser. '+String(e?.message||'');}
