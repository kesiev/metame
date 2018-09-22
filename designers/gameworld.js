METAME.addDesigner({
	id:"gameworld",
	needs:[
		"palette",
		"screenWidth",
		"screenHeight",
		"rumbles",
		"letters"
	],

	// --- LOCAL CONSTANTS
	BASICWORLD:{
		gravityX:0,gravityY:0
	},
	WORLDS:[
		// Gravity worlds
		{gravityX:0,gravityY:[-1,-0.5,0.5,1]},
		// Floating/topdown worlds
		{gravityX:0,gravityY:0}
	],
	BASICSCHEME:{
		x:0,y:0,
		restitution:1,
		conceptRow:["SOLID","HAZARD","ENTITY"],	
		color1:"COLOR1",
		color2:"COLOR2",
		speed:[-1,-0.5,0,0.5,1],
		speedLimit:[1,2,4,6,8],
		speedX:[-1,-0.5,0,0.5,1],
		speedY:[-1,-0.5,0,0.5,1],
		isWall:[0,1],
		hits:"ELEMENT",
		follow:"ELEMENT",
		onDeadSpawn:"PROBABLY-ELEMENT",
		followDistance:"DISTANCE",
		kills:[0,1],
		edgeUpDown:[0,1],
		edgeLeftRight:[0,1],
		aiTimer:0,
		aiSpeed:[1,2,4,8,16,32],
		onAiSpawn:"PROBABLY-ELEMENT",
		isPlayer:0,
		moveX:0,
		moveY:0,
		buttonAction:0,
		jumpHeight:0,
		notMoving:0,
		buttonDelay:0,
		buttonTimer:0,
		damage:0,
		invulnerabilityTimer:[5,10,15,20,25],
		invulnerabilityOnHitTimer:[5,10,15,20,25],
		invulnerabilityEffect:0,
		conceptCol:"CONCEPTCOL",
		size:"RANDOMSIZE",
		sparkOnSpawn:"SPARK",
		sparkOnDead:"SPARK",
		rumbleOnDead:"VERYRARE-RUMBLE",
		rumbleOnSpawn:"VERYRARE-RUMBLE",
		labelOnSpawn:"LABELSPARK",
		labelOnDead:"LABELSPARK"
	},
	SCHEMES:[
		// Solid things
		{ isWall:1, kills:0, hits:0, gravityX:0, gravityY:0, speedX:0, speedY:0, restitution:[1,0.5,0], aiSpeed:0, conceptRow:"SOLID" },
		// Solid killing things
		{ isWall:1, kills:1, gravityX:0, gravityY:0, speedX:0, speedY:0, conceptRow:"HAZARD" },
		// Moving things
		{ isWall:0, kills:1, conceptRow:"ENTITY" }
	],
	PLAYERS:[
		{ isPlayer:1, isWall:0, hits:"ELEMENT", speedX:0, speedY:0, moveX:[0,1,1.5,2], moveY:[0,1,1.5,2], notMoving:[0,0.2,0.4], restitution:0, conceptRow:"ENTITY", buttonAction:[0,1,2], buttonDelay:[1,2,4,8,16], jumpHeight:[2,3,4],invulnerabilityTimer:[25,50,75],invulnerabilityOnHitTimer:[25,50,75], invulnerabilityEffect:[1]}
	],
	BULLETS:[
		{ isWall:0, kills:1, conceptRow:"ENTITY", hits:"NOT-PLAYER" }
	],
	SPARKSTYPES:[0,1],
	LABELSPARKTYPES:[2],

	randomGameElement:function(MT,G,root,scheme,elementid,out) {
		if (!out) out=this.randomGameElement(MT,G,root,root,0,{});
		for (var a in scheme)
			if (scheme[a] instanceof Array) out[a]=MT.randomElement(G,scheme[a]);
			else if (scheme[a]!==undefined) out[a]=scheme[a];
		if (elementid!==undefined) out.element=out.tile=elementid;
		return out;
	},
	randomSpark:function(MT,G,set) {
		return {
			type:MT.randomElement(G,set),
			args:MT.randomNumbers(G,10,0,3),
			colors:[
				[MT.randomElement(G,G.palette.sets[0]),MT.randomElement(G,G.palette.sets[1])],
				[MT.randomElement(G,G.palette.sets[0]),MT.randomElement(G,G.palette.sets[1])]
			],
			duration:Math.ceil(MT.randomInRange(G,1,6)*(G.FPS/4)),
			label:MT.randomSentence(G,G.letters,MT.randomInRange(G,1,4))
		}
	},
	decide:function(MT,G) {

		var amount;

		G.elements=[];

		// Global world details
		G.world=this.randomGameElement(MT,G,this.BASICWORLD,MT.randomElement(G,this.WORLDS));

		// Create elements
		for (var i=0;i<this.SCHEMES.length;i++) {
			amount=MT.randomInRange(G,1,4);
			for (var j=0;j<amount;j++)
				G.elements.push(this.randomGameElement(MT,G,this.BASICSCHEME,this.SCHEMES[i],G.elements.length));
		}

		// Cache indexes
		G.stageElements=G.elements.length;
		G.playerElement=G.elements.length;
		G.bulletElement=G.elements.length+1;

		// Add player
		G.elements.push(this.randomGameElement(MT,G,this.BASICSCHEME,MT.randomElement(G,this.PLAYERS),G.elements.length));

		// Add bullet
		G.elements.push(this.randomGameElement(MT,G,this.BASICSCHEME,MT.randomElement(G,this.BULLETS),G.elements.length));

		// Solve post-generators
		for (var i=0;i<G.elements.length;i++)
			for (var a in G.elements[i])
				switch (G.elements[i][a]) {
					case "LABELSPARK":{
						delete G.elements[i][a];
						if (MT.veryRarely(G))
							G.elements[i][a]=this.randomSpark(MT,G,this.LABELSPARKTYPES);
						break;
					}
					case "SPARK":{
						delete G.elements[i][a];
						if (MT.veryRarely(G))
							G.elements[i][a]=this.randomSpark(MT,G,this.SPARKSTYPES);
						break;
					}
					case "VERYRARE-RUMBLE":{
						delete G.elements[i][a];
						if (MT.veryRarely(G)) G.elements[i][a]=MT.randomIndex(G,G.rumbles);
						break;
					}
					case "CONCEPTCOL":{
						G.elements[i][a]=MT.randomIndex(G,MT.CONCEPTS[G.elements[i].conceptRow]);
						break;
					}
					case "ELEMENT":{
						G.elements[i][a]=MT.randomIndex(G,G.elements);
						break;
					}
					case "NOT-PLAYER":{
						G.elements[i][a]=MT.random(G,G.stageElements);
						break;
					}
					case "COLOR1":{
						G.elements[i][a]=MT.randomElement(G,G.palette.sets[0]);
						break;
					}
					case "COLOR2":{
						G.elements[i][a]=MT.randomElement(G,G.palette.sets[1]);
						break;
					}
					case "PROBABLY-ELEMENT":{
						if (MT.randomly(G))
							G.elements[i][a]=MT.randomIndex(G,G.elements);
						else
							delete G.elements[i][a];
						break;
					}
					case "RANDOMSIZE":{
						delete G.elements[i][a];
						G.elements[i].width=(MT.veryRarely(G)?2:1)*G.SHAPESIZE;
						G.elements[i].height=(MT.veryRarely(G)?2:1)*G.SHAPESIZE;
						break;
					}
					case "DISTANCE":{
						if (MT.randomly(G))
							G.elements[i][a]=Math.ceil(G.screenWidth/MT.randomInRange(G,1,5));
						else
							G.elements[i][a]=Math.ceil(G.screenHeight/MT.randomInRange(G,1,5));
						break;
					}
				}
	}
});