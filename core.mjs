export const KEY='hitchhaven.profile.v1';
const copy=v=>JSON.parse(JSON.stringify(v));
export function profile(raw={}){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))raw={};
 const best=Array.from({length:6},(_,i)=>Math.max(0,Math.min(3,Number(raw.best?.[i])|0)));
 const scores=Array.from({length:6},(_,i)=>Math.max(0,Math.min(100000,Number(raw.scores?.[i])|0)));
 let active=null;try{if(raw.active&&raw.active.v===1&&Number.isInteger(raw.active.level)&&raw.active.level>=0&&raw.active.level<6&&Number.isFinite(raw.active.clock)&&raw.active.clock>=0&&raw.active.clock<=86400&&Array.isArray(raw.active.bodies)&&raw.active.bodies.length<130&&raw.active.bodies.every(p=>Array.isArray(p)&&p.length===6&&p.every(Number.isFinite)&&Math.abs(p[0])<2000&&Math.abs(p[1])<1500&&p.slice(2).every(v=>Math.abs(v)<10000)))active=copy(raw.active);}catch{}
 return{v:1,best,scores,active,rewards:{like:raw.rewards?.like===true,comment:raw.rewards?.comment===true},muted:raw.muted===true,paint:['mint','sunset','gold'].includes(raw.paint)?raw.paint:'mint',selected:Math.max(0,Math.min(5,raw.selected|0)),guide:raw.guide!==false};
}
export function mergeProfile(local,remote){const a=profile(local),b=profile(remote);return profile({...a,best:a.best.map((v,i)=>Math.max(v,b.best[i])),scores:a.scores.map((v,i)=>Math.max(v,b.scores[i])),rewards:{like:a.rewards.like||b.rewards.like,comment:a.rewards.comment||b.rewards.comment},active:a.active||b.active});}
export const paints={mint:0x72b8a6,sunset:0xe88d72,gold:0xe4bb60};
export function canPaint(p,id){const n=p.best.reduce((a,b)=>a+b,0);return id==='mint'||id==='sunset'&&(n>=6||p.rewards.comment)||id==='gold'&&(n>=12||p.rewards.like);}
export function unlock(p){return Math.min(5,p.best.findLastIndex(n=>n>0)+1);}
