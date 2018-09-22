METAME.addDesigner({
	id:"artworks",
	needs:[
		"screenWidth",
		"screenHeight",
		"elements",
		"palette",
		"mapGuidelines",
		"stageElements",
		"screenAreaTilesX",
		"screenAreaTilesY",
		"ending"
	],
	makeArtwork:function(MT,G) {
		var art=MT.newCanvas(G.screenWidth,G.screenHeight);

		var amount,color,conf,shapeX=-1,shapeY,shapeSize;
		var conf,shape,shapeCenter,shapeSize;
		amount=MT.randomInRange(G,1,7);
		for (var i=0;i<amount;i++) {
			shape=MT.superFormula(
				MT.randomInRange(G,-1000,1000)/100,
				MT.randomInRange(G,-1000,1000)/100,
				MT.randomInRange(G,-1000,1000)/100,
				MT.randomInRange(G,-1000,1000)/100,
				1,1);
			if (MT.randomly(G)) shapeX=-1;
			if (shapeX==-1) {
				shapeX=MT.random(G,G.screenWidth);
				shapeY=MT.random(G,G.screenHeight);					
			}
			shapeSize=MT.randomInRange(G,0,Math.floor(G.screenWidth/4));
			if (MT.rarely(G))
				color=G.TRANSPARENTCOLOR;
			else
				color=G.palette.colors[MT.randomElement(G,G.palette.sets[1])];
			if (MT.rarely(G)) {
				shapeSize/=5;
				var shapeGap=Math.floor(G.HSHAPESIZE*shapeSize);
				shapeX-=shapeGap;
				shapeY-=shapeGap;
				element=MT.randomElement(G,G.elements);
				concept=MT.CONCEPTS[element.conceptRow][element.conceptCol];
				for (var y=0;y<G.SHAPESIZE;y++)
					for (var x=0;x<G.SHAPESIZE;x++)
						if (concept[y][x]==1)
							MT.blitShape(art,shapeX+(x*shapeSize),shapeY+(y*shapeSize),shapeSize,color,shape);
				shapeX=-1;						
			}
			else
				MT.blitShape(art,shapeX,shapeY,shapeSize,color,shape);					
		}

		if (G.mapGuidelines.borders&&MT.randomly(G)) {
			var tile=MT.random(G,G.stageElements);
			var marginX=MT.randomInRange(G,0,Math.floor(G.screenAreaTilesX/2));
			var marginY=MT.randomInRange(G,0,Math.floor(G.screenAreaTilesY/2));
			var marginRight=G.screenAreaTilesX-marginX-1;
			var marginBottom=G.screenAreaTilesY-marginY-1;
			border=MT.random(G,G.stageElements);
			for (y=marginY;y<=marginBottom;y++)
				for (x=marginX;x<=marginRight;x++)
					if ((x==marginX)||(y==marginY)||(x==marginRight)||(y==marginBottom))
						art.ctx.drawImage(
							G.gamesprites.cnv,
							tile*G.SHAPESIZE,0,
							G.SHAPESIZE,G.SHAPESIZE,
							x*G.SHAPESIZE,y*G.SHAPESIZE,
							G.SHAPESIZE,G.SHAPESIZE
						);
		}
		return art;
	},
	decide:function(MT,G) {

		if (G.titleMode==1) // Artwork only
			G.titleImage=this.makeArtwork(MT,G);

		for (var i=0;i<G.ending.length;i++)
			if (MT.rarely(G))
				G.ending[i].image=this.makeArtwork(MT,G);

	}
});