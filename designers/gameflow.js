METAME.addDesigner({
	id:"gameflow",
	needs:[
	],
	decide:function(MT,G) {

		G.nextStates={};

		G.nextStates[G.STATES.BOOT]={
			// The game boots with title screen or warning
			"DONE":MT.randomElement(G,[G.STATES.TITLESTART,G.STATES.WARNING])
		},

		// On warning screen...
		G.nextStates[G.STATES.WARNING]={
			// When is done, go to title start
			"DONE":MT.randomElement(G,[G.STATES.TITLESTART])
		},

		// When title is startings...
		G.nextStates[G.STATES.TITLESTART]={
			// On button on title the game starts
			"DONE":MT.randomElement(G,[G.STATES.TITLE])
		}

		G.nextStates[G.STATES.TITLE]={
			// On button on title the game starts
			"DONE":MT.randomElement(G,[G.STATES.GAMESTART])
		}

		// When the game starts...
		G.nextStates[G.STATES.GAMESTART]={
			// ...and is done, starts the stage
			"DONE":MT.randomElement(G,[G.STATES.STAGESTART])
		}

		// When the stage starts...
		G.nextStates[G.STATES.STAGESTART]={
			// ...and is done, prepare the stage or show a stage title
			"DONE":MT.randomElement(G,[G.STATES.PREPARESTAGE,G.STATES.STAGETITLE])
		}

		// When the stage title is displayed...
		G.nextStates[G.STATES.STAGETITLE]={
			// ...and is done, prepare the stage
			"DONE":MT.randomElement(G,[G.STATES.PREPARESTAGE])
		}

		// When the stage is prepared starts...
		G.nextStates[G.STATES.PREPARESTAGE]={
			// ...and is done, spawn the player
			"DONE":MT.randomElement(G,[G.STATES.SPAWNPLAYER])
		}

		// When the player is spawning...
		G.nextStates[G.STATES.SPAWNPLAYER]={
			// ...and is done, the game starts
			"DONE":MT.randomElement(G,[G.STATES.GAMERUNNING])
		}

		// When the player is running...
		G.nextStates[G.STATES.GAMERUNNING]={
			// ...and the player loses a life, go to LIFELOST STATE
			"LIFELOST":MT.randomElement(G,[G.STATES.LIFELOST]),
			"STAGECLEAR":MT.randomElement(G,[G.STATES.STAGECLEAR])
		}

		// When the player life stock is depleted...
		G.nextStates[G.STATES.LIFELOST]={
			// ...if there are more lives the game can respawn the player or restart the stage
			"LIVES":MT.randomElement(G,[G.STATES.SPAWNPLAYER,G.STATES.STAGESTART]),
			// ...if all lives are gone the game ends
			"NOLIVES":MT.randomElement(G,[G.STATES.GAMEOVERSTART])
		};

		// When the stage is clear...
		G.nextStates[G.STATES.STAGECLEAR]={
			// ...and there is more to play, start a new stage
			"NEXTSTAGE":MT.randomElement(G,[G.STATES.STAGESTART]),
			// ...and there aren't more levels, the game ends with titles, ending or gameover
			"GAMECLEAR":MT.randomElement(G,[G.STATES.TITLESTART, G.STATES.ENDINGSTART, G.STATES.GAMEOVERSTART])
		}

		// When the gameover starts...
		G.nextStates[G.STATES.GAMEOVERSTART]={
			// ...and there is done, goes back to the title screen
			"DONE":MT.randomElement(G,[G.STATES.TITLESTART,G.STATES.GAMEOVER])
		}

		// When the stage is over...
		G.nextStates[G.STATES.GAMEOVER]={
			// ...and there is done, goes back to the title screen
			"DONE":MT.randomElement(G,[G.STATES.TITLESTART])
		}

		// When the ending is starting...
		G.nextStates[G.STATES.ENDINGSTART]={
			// ... show it, goes back to the title screen, the gameover screen, reboots the game or starts from stage 1
			"DONE":MT.randomElement(G,[G.STATES.ENDING, G.STATES.TITLESTART, G.STATES.GAMEOVERSTART, G.STATES.BOOT, G.STATES.GAMESTART])
		}

		// When the ending is running...
		G.nextStates[G.STATES.ENDING]={
			// ...and there is another screen, loop...
			"NEXT":G.STATES.ENDING,
			// ...and when is done, goes back to the title screen, the gameover screen or reboots the game
			"DONE":MT.randomElement(G,[G.STATES.TITLESTART, G.STATES.GAMEOVERSTART, G.STATES.BOOT])
		}

		// Loading speed
		var loadingSpeed=MT.randomInRange(G,0,Math.ceil(G.FPS/3));
		G.loadingTimes={}
		G.loadingTimes[G.STATES.BOOT]=loadingSpeed*MT.randomInRange(G,1,4);
		G.loadingTimes[G.STATES.WARNING]=loadingSpeed*MT.randomInRange(G,1,4);
		G.loadingTimes[G.STATES.TITLESTART]=loadingSpeed*MT.randomInRange(G,1,4);
		G.loadingTimes[G.STATES.PREPARESTAGE]=loadingSpeed*MT.randomInRange(G,1,4);
		G.loadingTimes[G.STATES.STAGETITLE]=loadingSpeed*MT.randomInRange(G,1,4);
		G.loadingTimes[G.STATES.GAMEOVERSTART]=loadingSpeed*MT.randomInRange(G,1,4);
		G.loadingTimes[G.STATES.ENDINGSTART]=loadingSpeed*MT.randomInRange(G,1,4);
	
		// Splash screen delays
		G.delays={};
		G.delays[G.STATES.WARNING]=MT.randomInRange(G,G.FPS*3,G.FPS*6);
		G.delays[G.STATES.STAGETITLE]=MT.randomInRange(G,G.FPS,G.FPS*3);
		G.delays[G.STATES.GAMEOVER]=MT.randomInRange(G,G.FPS,G.FPS*3);
		G.delays[G.STATES.ENDING]=MT.randomInRange(G,G.FPS,G.FPS*3);
		G.delays[G.STATES.SPAWNPLAYER]=MT.randomly(G)?MT.randomInRange(G,G.FPS,G.FPS*3):0;
	}
});