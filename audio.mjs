// Original local synthesis. No audio downloads or autoplay dependency.
export class YardAudio{
 constructor(){this.active=false;this.muted=false;this.next=0;this.note=0;}
 unlock(){if(!this.ctx){const A=globalThis.AudioContext||globalThis.webkitAudioContext;if(!A)return;this.ctx=new A();this.master=this.ctx.createGain();this.master.gain.value=0;this.master.connect(this.ctx.destination);this.motor=this.ctx.createOscillator();this.motor.type='triangle';this.motorGain=this.ctx.createGain();this.motorGain.gain.value=0;this.motor.connect(this.motorGain).connect(this.master);this.motor.start();}this.ctx.resume().catch(()=>{});this.sync();}
 sync(){if(this.ctx)this.master.gain.setTargetAtTime(this.active&&!this.muted?.28:0,this.ctx.currentTime,.08);}
 setActive(v){this.active=v;this.sync();}
 mute(v){this.muted=v;this.sync();}
 tone(f,t=.16,volume=.12,type='sine',delay=0){if(!this.ctx||this.muted||!this.active)return;const now=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,now);g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(volume,now+.008);g.gain.exponentialRampToValueAtTime(.001,now+t);o.connect(g).connect(this.master);o.start(now);o.stop(now+t+.01);}
 event(kind){if(kind==='win'){[261.63,329.63,392,523.25,659.25].forEach((f,i)=>this.tone(f,.6,.22,'sine',i*.09));}else if(kind==='bump'){this.tone(76,.11,.35,'triangle');this.tone(132,.08,.14,'sine',.03);}else if(kind==='cone'){this.tone(480,.07,.12,'triangle');}else if(kind==='near')this.tone(740,.08,.08);else this.tone(500,.08,.08);}
 update(speed,gear,near){if(!this.ctx)return;const t=this.ctx.currentTime;this.motor.frequency.setTargetAtTime(39+Math.min(speed,6)*12,t,.12);this.motorGain.gain.setTargetAtTime(this.active&&speed>.05?.05:0,t,.15);if(this.active&&t>this.next){const melody=[220,0,329.63,293.66,0,261.63,329.63,0,196,0,293.66,261.63,0,246.94,293.66,0];const f=melody[this.note++%melody.length];if(f)this.tone(f,.36,.075);this.next=t+.42;}if(near&&speed>.15&&t>(this.beep||0)){this.event('near');this.beep=t+(gear<0?.65:1);}}
 stop(){this.setActive(false);this.motor?.stop();this.ctx?.close().catch(()=>{});}
}
