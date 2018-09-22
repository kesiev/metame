METAME.addDesigner({
	id:"level",
	needs:[
		"mapAreaTilesY",
		"mapAreaTilesX",
		"screenAreaTilesX",
		"screenAreaTilesY",
		"stageElements",
		"letters",
		"lineLength",
		"labels"
	],
	randomLevel:function(MT,G,mapAreaTilesX,mapAreaTilesY,useStageTitles) {
		var map=[];
		var amount,i,x,y,fx,fy,len;

		for (y=0;y<mapAreaTilesY;y++) map.push([]);

		// Spray random stuff
		var border;
		amount=MT.randomInRange(G,10,50);
		for (i=0;i<amount;i++)
			map[MT.random(G,mapAreaTilesY)][MT.random(G,mapAreaTilesX)]=MT.random(G,G.stageElements);

		// horizontal lines
		if (G.mapGuidelines.lines) {
			amount=MT.randomInRange(G,0,4);
			for (i=0;i<amount;i++) {
				border=MT.random(G,G.stageElements);
				y=MT.random(G,mapAreaTilesY);
				fx=MT.random(G,mapAreaTilesX);
				len=MT.random(G,mapAreaTilesX-fx);
				for (x=fx;x<fx+len;x++) map[y][x]=border;
			}

			// vertical lines
			amount=MT.randomInRange(G,0,4);
			for (i=0;i<amount;i++) {
				border=MT.random(G,G.stageElements);
				x=MT.random(G,mapAreaTilesX);
				fy=MT.random(G,mapAreaTilesY);
				len=MT.random(G,mapAreaTilesY-fy);
				for (y=fy;y<fy+len;y++) map[y][x]=border;
			}
		}

		if (G.mapGuidelines.borders) {
			border=MT.random(G,G.stageElements);
			for (y=0;y<mapAreaTilesY;y++)
				for (x=0;x<mapAreaTilesX;x++)
					if (!x||!y||(x==mapAreaTilesX-1)||(y==mapAreaTilesY-1))
						map[y][x]=MT.randomInRange(G,0,4)?border:undefined;
		}

		// Apply X symmetry
		if (G.mapGuidelines.symmetry) {
			if (MT.randomly(G))
				for (y=0;y<mapAreaTilesY;y++)
					for (x=0;x<Math.floor(mapAreaTilesX/2);x++)
						map[y][x]=map[y][mapAreaTilesX-x-1];

			// Apply Y symmetry
			if (MT.random(G,2))
				for (y=0;y<Math.floor(mapAreaTilesY/2);y++)
					for (x=0;x<mapAreaTilesX;x++)
						map[y][x]=map[mapAreaTilesY-y-1][x];
		}

		// Find spawnpoint for player
		var spawnPoints=[];
		for (y=0;y<mapAreaTilesY;y++)
			for (x=0;x<mapAreaTilesX;x++)
				if (!map[y][x]) spawnPoints.push({
					x:x*G.SHAPESIZE,
					y:y*G.SHAPESIZE
				});

		// Done! Added to levels
		return {
			stageTitle:useStageTitles?MT.randomSentence(G,G.letters,MT.randomInRange(G,3,G.lineLength)):G.labels.getready,
			map:map,
			spawn:MT.randomElement(G,spawnPoints)
		};
	},
	decide:function(MT,G) {

		G.levels=[];

		// Level design
		var useStageTitles=MT.randomly(G);

		G.mapGuidelines={
			lines:MT.randomly(G),
			borders:MT.randomly(G),
			symmetry:MT.randomly(G),
		};

		var levelsCount=MT.randomInRange(G,1,30);

		G.attractModeLevel=this.randomLevel(MT,G,G.screenAreaTilesX,G.screenAreaTilesY,useStageTitles);

		for (var j=0;j<levelsCount;j++)
			G.levels.push(this.randomLevel(MT,G,G.mapAreaTilesX,G.mapAreaTilesY,useStageTitles));

	}
});