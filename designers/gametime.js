METAME.addDesigner({
	id:"gametime",
	needs:[
	],
	decide:function(MT,G) {

		G.time=[];
		G.timeFollowPlayer=MT.randomly(G);

		if (MT.veryRarely(G)) {
			// Turn-based game
			var timeframe=Math.ceil(G.FPS/6);

			// Randomize turn mode
			switch (MT.randomInRange(G,0,4)) {
				case 0:{
					// Chess-like
					G.time.push({runPlayer:true,wait:"frames",frames:timeframe});
					G.time.push({runOther:true,wait:"frames",frames:timeframe});
					break;
				}
				case 1:{
					// Roguelike
					G.time.push({runPlayer:true,runOther:true,wait:"frames",frames:timeframe});
					break;
				}
				case 2:{
					// Strategy-ish
					G.time.push({runPlayer:true,runOther:true,wait:"frames",frames:timeframe});
					G.time.push({runOther:true,wait:"frames",frames:timeframe*MT.randomInRange(G,2,4)});
					break;
				}
				case 3:{
					// Real time turns
					G.time.push({runPlayer:true,runOther:true,wait:"frames",frames:timeframe});
					break;
				}
				case 4:{
					// Pseudo-real time
					G.time.push({runPlayer:true,runOther:true,wait:"frames",frames:1});
					break;
				}
			}

			// Randomize turn execution
			switch (MT.randomInRange(G,0,3)) {
				case 0:{
					// True turns
					G.time.unshift({runInput:true,wait:"keydown"});					
					G.time.push({wait:"keyup"});
					break;
				}
				case 1:{
					// Real-time turns
					G.time.unshift({runInput:true,wait:"keydowntimeout",frames:timeframe*MT.randomInRange(G,2,4)});					
					break;
				}
				case 2:{
					// Step-based movement
					G.time.unshift({runInput:true,wait:"keydowntimeout",frames:0});					
					break;
				}
				case 3:{
					// SuperHot-ish
					G.time.unshift({runInput:true,wait:"keydown"});					
					break;
				}
			}

		} else G.time.push({
			runInput:true,
			runPlayer:true,
			runOther:true
		});


	}
});