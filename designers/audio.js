METAME.addDesigner({
	id:"audio",
	needs:[
		"elements"
	],
	NOISEWAVES:{
	  whitenoise:function(v,i,p) { return Math.floor((i-1)/(p/2))!=Math.floor(i/(p/2))?Math.random()*2-1:v },
	  square:function(v,i,p) { return ((Math.floor(i/(p/2))%-2)*-2)+1 },
	  sine:function(v,i,p) { return Math.sin(i*6.28/p) },
	  saw:function(v,i,p) { return ((v+1+(2/p)) % 2) - 1},
	  triangle:function(v,i,p) { return Math.abs((i % p - (p/2))/p*4)-1 },
	  tangent:function(v,i,p) { 
	  	v= 0.15*Math.tan(i/p*3.14);
	  	if (v<-1) v=-1;
	  	if (v>1) v=1;
	  	return v;
	  },
	  whistle:function(v,i,p) { return 0.75 * Math.sin(i/p*6.28) + 0.25 * Math.sin(40 *3.14 * i/p) },
	  breaker:function(v,i,p) {
	  	v=(i/p) + 0.8660;
	    v=v - Math.floor(v);
	    return -1 + 2 * Math.abs(1 - v*v*2);
	  }
	},
	generateNoise:function(MT,G,parms) {
		if (MT.audioContext) {

			var sampleRate = MT.audioContext.sampleRate,data={};
			for (var a in this.NOISEDEFAULTS) data[a]=this.NOISEDEFAULTS[a];
			for (var a in parms) if (parms[a]!==undefined) data[a]=parms[a];
			for (var i=0;i<this.NOISETIMES.length;i++) data[this.NOISETIMES[i]]*=sampleRate;

			var out,bits,steps,attackDecay=data.attack+data.decay,
				attackSustain=attackDecay+data.sustain,
				samplePitch = sampleRate/data.frequency,
				sampleLength = attackSustain+data.release,	

				tremolo = .9,
				value = .9,
				envelope = 0;    

			var buffer = MT.audioContext.createBuffer(2,sampleLength,sampleRate);

			for(var i=0;i<2;i++) {
				var channel = buffer.getChannelData(i),
					jump1=sampleLength*data.frequencyJump1onset,
				jump2=sampleLength*data.frequencyJump2onset;
				for(var j=0; j<buffer.length; j++) {
					// ADSR Generator
					value = this.NOISEWAVES[data.wave](value,j,samplePitch);
					if (j<=data.attack) envelope=j/data.attack;
					else if (j<=attackDecay) envelope=-(j-attackDecay)/data.decay*(1-data.limit)+data.limit;
					if (j>attackSustain) envelope=(-(j-attackSustain)/data.release+1)*data.limit;
					// Tremolo
					tremolo = this.NOISEWAVES.sine(value,j,sampleRate/data.tremoloFrequency)*data.tremoloDepth+(1-data.tremoloDepth);
					out = value*tremolo*envelope*0.9;
					// Bit crush
					if (data.bitCrush||data.bitCrushSweep) {
					    bits = Math.round(data.bitCrush + j / sampleLength * data.bitCrushSweep);
					    if (bits<1) bits=1;
					    if (bits>16) bits=16;
					    steps=Math.pow(2,bits);
					    out=-1 + 2 * Math.round((0.5 + 0.5 * out) * steps) / steps;
					}
					// Done!
					if(out>1) out= 1;
					if(out<-1) out = -1;
					channel[j]=out;
					// Frequency jump
						if (j>=jump1) { samplePitch*=1-data.frequencyJump1amount; jump1=sampleLength }
					if (j>=jump2) { samplePitch*=1-data.frequencyJump2amount; jump2=sampleLength }
					// Pitch
					samplePitch-= data.pitch;
				}
			}
		} else return 0;

		return buffer;
	
	},
	NOISETIMES:["attack","sustain","decay","release"],
	NOISEDEFAULTS:{
	  bitCrush:0, // 1-16
	  bitCrushSweep:0, // -16 16
	  attack:0, // 0-0.3
	  sustain:0, // 0-0.4
	  limit:0.6, // .2-.6
	  decay:0.1, // 0-0.3
	  release:0, // 0-0.4
	  frequency:850, // 100-1600
	  tremoloFrequency:0, // 0-50
	  tremoloDepth:0, // 0-1
	  frequencyJump1onset:0, // 0-1
	  frequencyJump1amount:0, // -1-1
	  frequencyJump2onset:0, // 0-1
	  frequencyJump2amount:0, // -1-1
	  pitch:0 // 0-.002
	},
	SFXTEMPLATE:{
		attack:[0,0.3],
		sustain:[0,0.4],
		limit:[0.2,0.6],
		decay:[0,0.3],
		release:[0,0.4],
		frequency:[100,1600],
		tremoloFrequency:[0,50],
		tremoloDepth:[0,1],
		pitch:[-0.002,0.002],
		frequencyJump1onset:[0,1],
		frequencyJump1amount:[-1,1],
		frequencyJump2onset:[0,1],
		frequencyJump2amount:[-1,1],
		bitCrush:[0,16],
		bitCrushSweep:[-16,16]
	},
	generateRandomEffects:function(MT,G,waves,id) {
		var parms={
			wave:MT.randomElement(G,waves)
		};
		for (var j in this.SFXTEMPLATE)
			parms[j]=this.SFXTEMPLATE[j][0]+(MT.randomInRange(G,0,100)/100*(this.SFXTEMPLATE[j][1]-this.SFXTEMPLATE[j][0]));
		MT.addAudioSample(id,this.generateNoise(MT,G,parms));
		return id;
	},
	decide:function(MT,G) {
		var waves=MT.getKeys(this.NOISEWAVES);
		var effects=[];
		var amount=MT.randomInRange(G,1,10);
		for (var i=0;i<amount;i++)
			effects.push(this.generateRandomEffects(MT,G,waves,"sfx"+i));

		// Spawn/death sound effect
		for (var i=0;i<G.elements.length;i++) {
			if (MT.randomly(G)) G.elements[i].audioOnDead=MT.randomElement(G,effects);
			if (MT.rarely(G)) G.elements[i].audioOnSpawn=MT.randomElement(G,effects);
		}

		for (var i in G.textScreens) {
			if (MT.randomly(G)) G.textScreens[i].audioOnStart=MT.randomElement(G,effects);
			if (MT.randomly(G)) G.textScreens[i].audioOnSet=MT.randomElement(G,effects);
			if (MT.randomly(G)) G.textScreens[i].audioOnEnd=MT.randomElement(G,effects);
		}

		if (MT.randomly(G)) G.titleAudio=MT.randomElement(G,effects);

	}
});
