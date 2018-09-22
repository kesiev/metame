METAME.addDesigner({
	id:"gamerules",
	needs:[
		"elements",
		"playerElement",
		"bulletElement",
		"gamesprites",
		"letters",
		"gauges"
	],
	decide:function(MT,G) {

		G.conditions=[];
		G.counters={};

		// Make conditions database
		var amount,playerCanDie=0,ifs={
			// Add a time condition...
			time:{when:"counter",counter:"time",is:0 }
		};

		// Some games are score based
		if (MT.randomly(G)) {

			// Give score to entities
			var maxScore=MT.randomInRange(G,1,100),scoreRamp=MT.randomInRange(G,1,4);
			for (var i=0;i<G.playerElement;i++) {
				G.conditions.push({if:{when:"event",event:{id:"destroyed",is:i}},then:"addscore",score:maxScore});
				maxScore+=maxScore*MT.randomInRange(G,1,scoreRamp);
			}

			// Add a score counter
			G.counters.score={
				label:MT.randomSentence(G,G.letters,MT.randomInRange(G,1,5)),
				amount:0,
				lowerLimit:0,
				baseAmount:0,
				unitAmount:1,
				alignment:MT.randomInRange(G,0,1),
				resetOn:MT.makeFlags([G.STATES.GAMESTART])
			};
			
			// Add a condition on a certain score threshold
			ifs.score={when:"counter",counter:"score",surpass:maxScore*MT.randomInRange(G,5,10)};
		}

		// Procedurally look for interesting game conditions

		var player=G.elements[G.playerElement],bullet,subject;
		if (player.buttonAction==1) bullet=G.elements[G.bulletElement];

		for (var i=0;i<G.elements.length;i++) {
			subject=G.elements[i];
			if ((subject!=player)&&(subject!=bullet)) {
				if ((subject.hits==G.playerElement)||subject.isWall) {
					if (subject.kills)
						// There is a condition the player can naturally die
						playerCanDie=1;
					else
						// Some objects can hit the player without killing it
						ifs["hit"+i]={when:"event",event:{id:"collision",of:G.playerElement,with:i}};
				}
				if (player.hits==i) {
					// Player can interact with this element.
					if (player.kills) {
						ifs["collect"+i]={when:"event",event:{id:"collision",of:G.playerElement,with:i}};
						ifs["collectall"+i]={when:"count",of:i,is:0};
					}
				}
				if (bullet&&(bullet.hits==i)) {
					// Bullet hits these objects
					if (bullet.kills) {
						ifs["kill"+i]={when:"event",event:{id:"collision",of:G.bulletElement,with:i}};
						ifs["killall"+i]={when:"count",of:i,is:0};							
					}
				}
			}
		}

		// Decide winning/losing condition
		var pickCondition,ifsList=MT.getKeys(ifs);

		// Add a mandatory winning condition
		if (pickCondition=MT.randomDraw(G,ifsList))
			G.conditions.push({if:ifs[pickCondition],then:"nextstate",state:"STAGECLEAR"});

		// If the player can't instakilled or rarely...
		if (!playerCanDie||MT.rarely(G))
			if (MT.rarely(G)) {
				// Create an health based game
				// Get few damaging conditions...
				var maxDamage=2;
				amount=MT.randomInRange(G,1,4);
				for (var i=0;i<amount;i++)
					if (pickCondition=MT.randomDraw(G,ifsList)) {
						maxDamage+=MT.randomInRange(G,1,maxDamage);
						G.conditions.push({if:ifs[pickCondition],then:"damage",damage:maxDamage});
					}

				// ...and add a death condition on life
				G.conditions.push({if:{when:"counter",counter:"health",is:0},then:"nextstate",state:"LIFELOST"})

			} else {
				
				// ...add a random condition of death
				if (pickCondition=MT.randomDraw(G,ifsList))
					G.conditions.push({if:ifs[pickCondition],then:"nextstate",state:"LIFELOST"})					
			}

		// Sometimes there is a way to earn an extra life
		if (MT.randomly(G))
			if (pickCondition=MT.randomDraw(G,ifsList))
				G.conditions.push({if:ifs[pickCondition],then:"extralife"});

		// Add a mandatory lives counter
		var lives=MT.randomInRange(G,1,5);
		G.counters.lives={
			label:MT.randomSentence(G,G.letters,MT.randomInRange(G,1,5)),
			baseAmount:lives,
			unitAmount:1,
			lowerLimit:0,
			higherLimit:lives*MT.randomInRange(G,1,3),
			hidden:lives==1, // Hidden for one-life games
			gauge:MT.randomly(G),
			gaugeRotation:90,
			gaugeId:MT.random(G,G.GAUGESPERGAME),
			alignment:MT.randomInRange(G,0,1),
			gauges:G.gauges,
			resetOn:MT.makeFlags([G.STATES.GAMESTART])
		}
		if (MT.randomly(G)) { // Sometimes lives are symbols
			G.counters.lives.gaugeCounter=1;
			G.counters.lives.gauge=1;
			G.counters.lives.gauges=G.gamesprites;
			G.counters.lives.gaugeId=G.playerElement
			G.counters.lives.gaugeRotation=MT.randomInRange(G,0,3)*90;
			if (MT.randomly(G)) G.counters.lives.label=[]; // Sometimes, when lives are symbols, remove the label
		}
		
		var counterid;
		for (var i=0;i<G.conditions.length;i++) {			
			counterid=G.conditions[i].if.counter;
			switch (counterid) {				
				case "time":{
					var timeLimit=G.FPS*MT.randomInRange(G,10,30);
					G.counters[counterid]={
						label:MT.randomSentence(G,G.letters,MT.randomInRange(G,1,5)),
						baseAmount:timeLimit,
						unitAmount:MT.randomInRange(G,1,50), // Random time unit
						lowerLimit:0,
						higherLimit:timeLimit,
						gauge:MT.randomly(G),
						gaugeId:MT.random(G,G.GAUGESPERGAME),
						alignment:MT.randomInRange(G,0,1),
						gaugeRotation:90, // Vertical gauges are rotated
						gauges:G.gauges, // Gauge sprites
						resetOn:MT.makeFlags([G.STATES.STAGESTART,G.STATES.LIFELOST])
					}
					break;
				}
				case "health":{
					var healthLimit=maxDamage*MT.randomInRange(G,2,7);
					G.counters[counterid]={
						label:MT.randomSentence(G,G.letters,MT.randomInRange(G,1,5)),
						baseAmount:healthLimit,
						unitAmount:1,
						lowerLimit:0,
						higherLimit:healthLimit,
						gauge:MT.randomly(G),
						gaugeId:MT.random(G,G.GAUGESPERGAME),
						alignment:MT.randomInRange(G,0,1),
						gaugeRotation:90,
						gauges:G.gauges,
						resetOn:MT.makeFlags([G.STATES.STAGESTART,G.STATES.LIFELOST])
					};
					break;
				}
			}
		}

	}
});