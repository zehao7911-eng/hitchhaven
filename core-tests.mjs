import assert from 'node:assert/strict';
import Game,{controller,sites} from './parking-source.mjs';
import {Space,Vec2} from './vendor/nape/index.js';
import {profile,mergeProfile,canPaint,unlock} from './core.mjs';
let checks=0,events=[];const ok=(x,m)=>{assert(x,m);checks++;};
const space=new Space(new Vec2(0,0));Game.setup(space);controller.configure(e=>events.push(e));
const tick=n=>{for(let i=0;i<n;i++)space.step(1/60,10,4);};
controller.begin(0);tick(200);ok(controller.state().clock===0,'reading the yard does not consume par time');ok(events.length===0,'intro is not a host gameplay start');
controller.input(-.6,0);tick(115);controller.release();tick(180);
ok(controller.state().phase==='done','real wheel-force reverse and release parks welcome trailer');ok(controller.state().result.stars===3,'simple first input earns all three stars');ok(events.filter(e=>e.type==='drive').length===1&&events.filter(e=>e.type==='win').length===1,'one actual first action and completion');tick(200);ok(events.filter(e=>e.type==='win').length===1,'stationary result cannot award repeatedly');
controller.begin(0);tick(100);controller.input(.6,.5);tick(60);controller.release();tick(70);const checkpoint=controller.snapshot();ok(checkpoint&&checkpoint.bodies.length===12,'snapshot includes all eight articulated bodies, parked cars and cones');const old=JSON.parse(JSON.stringify(checkpoint));controller.begin(2);ok(controller.restore(old),'restore a game-specific mid-drive checkpoint');
const restored=controller.snapshot();ok(restored.level===0&&Math.abs(restored.clock-old.clock)<1e-8,'restore round and elapsed drive time');ok(restored.bodies.every((b,i)=>Math.hypot(b[0]-old.bodies[i][0],b[1]-old.bodies[i][1])<1e-8),'restore chassis, wheels, trailer and scenery poses');
tick(30);ok(controller.snapshot().bodies.every(b=>b.every(Number.isFinite)),'restored constraints settle without NaN');let driveBefore=events.filter(e=>e.type==='drive').length;controller.input(.2,0);tick(10);ok(events.filter(e=>e.type==='drive').length===driveBefore+1,'next real action after restoration starts the resumed visit');controller.release();
ok(!controller.restore({...old,level:99}),'out-of-range checkpoint rejected');ok(!controller.restore({...old,bodies:[[NaN,1,1,1,1,1]]}),'nonfinite checkpoint rejected');
controller.begin(0);tick(100);controller.input(1,0);tick(300);controller.release();tick(60);ok(events.some(e=>e.type==='bump'),'actual solver contact emits bump feedback');
controller.begin(0);tick(100);controller.input(-.65,.7);tick(120);controller.release();tick(40);const bent=controller.snapshot(),rig=Game._debug().veh;
const point=(body,x)=>({x:body.position.x+Math.cos(body.rotation)*x,y:body.position.y+Math.sin(body.rotation)*x});
const carHitch=point(rig.chassis,rig.hitchX),coupler=point(rig.trailer.body,rig.trailer.couplerX);
ok(Math.hypot(carHitch.x-coupler.x,carHitch.y-coupler.y)<1.5,'steered reversing keeps the actual tow-ball and coupler attached');ok(Math.abs(controller.state().angle)>.05,'trailer articulates independently under sideways input');
// Goal fixtures exercise the actual coupled solver and collision geometry at all six destinations.
// These are simulation fixtures, not a claim to have manually driven each route.
for(let level=0;level<sites.length;level++){
 controller.begin(level);tick(100);const s=controller.snapshot(),bay=Game._debug().levels[level].bay,t=s.bodies[5],da=bay.a-t[2],ca=Math.cos(da),sa=Math.sin(da);
 s.bodies=s.bodies.map((b,i)=>{if(i>=8)return b;const dx=b[0]-t[0],dy=b[1]-t[1];return[bay.x+dx*ca-dy*sa,bay.y+dx*sa+dy*ca,b[2]+da,0,0,0];});
 ok(controller.restore(s),'goal fixture restoration '+level);tick(160);
 ok(controller.state().phase==='done','source solver accepts actual aligned stopped bay '+level);
 ok(controller.state().result.acc>90,'valid destination accuracy '+level);
}
const p=profile({best:[3,2],scores:[2000,800],muted:true,rewards:{like:true},active:old});
const merged=mergeProfile(p,{best:[1,3],scores:[1900,1000],active:null,rewards:{comment:true}});
ok(merged.best[0]===3&&merged.best[1]===3&&merged.scores[1]===1000&&merged.muted,'cloud merge preserves and improves best progress');ok(merged.active.level===0&&merged.rewards.like&&merged.rewards.comment,'own checkpoint and durable independent claims retained');
ok(!profile({active:{v:1,level:0,bodies:[],clock:Infinity}}).active,'invalid profile checkpoint dropped');ok(canPaint(profile({best:[3,3]}),'sunset'),'earned six-star cosmetic');ok(canPaint(profile({rewards:{like:true}}),'gold'),'confirmed host cosmetic');ok(!canPaint(profile(),'gold'),'unearned cosmetic remains locked');ok(unlock(profile())===0&&unlock(profile({best:[3,2]}))===2,'progression unlocks actual next site');
console.log(JSON.stringify({checks,scope:'Actual Nape wheel forces, reverse/brake win, multi-body saves, six goal solver fixtures and own progression'}));
