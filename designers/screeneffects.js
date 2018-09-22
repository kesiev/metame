METAME.addDesigner({
	id:"screeneffects",
	needs:[
		"palette"
	],
	RUMBLEMODES:5,
	randomShake:function(MT,G,rumbleSize) {
		return {
			mode:MT.random(G,this.RUMBLEMODES),
			duration:MT.randomInRange(G,1,4)*rumbleSize,
			intensity:MT.randomInRange(G,1,4),
			colors:[MT.randomElement(G,G.palette.sets[0]),MT.randomElement(G,G.palette.sets[1])]
		}
	},
	decide:function(MT,G) {
		var amount=MT.randomInRange(G,0,3);
		var rumbleSize=Math.ceil(G.FPS/3);
		G.rumbles=[];
		for (var i=0;i<amount;i++)
			G.rumbles.push(this.randomShake(MT,G,rumbleSize))
	}
});