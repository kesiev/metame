METAME.addDesigner({
	id:"hud",
	needs:[
		"counters",
		"screenWidth",
		"screenHeight",
		"fonts",
		"spacings",
		"palette"
	],
	blitFrame:function(MT,G,destination,concept1,concept2,x1,y1,x2,y2,color1,color2) {
		var frame=MT.newCanvas(G.SHAPESIZE*2,G.SHAPESIZE);
		var framedata=frame.getData();
		MT.blitConcept(
			frame,
			framedata,
			concept1,
			0,0,
			G.TRANSPARENTCOLOR,
			color1,
			color2,
			MT.rarely(G)
		);
		MT.blitConcept(
			frame,
			framedata,
			concept2,
			G.SHAPESIZE,0,
			G.TRANSPARENTCOLOR,
			color1,
			color2,
			MT.rarely(G)
		);
		frame.putData(framedata);

		for (var x=x1+G.SHAPESIZE;x<x2;x+=G.SHAPESIZE) {
			MT.rotatedDrawImage(destination.ctx,
				frame.cnv,
				G.SHAPESIZE,0,G.SHAPESIZE,G.SHAPESIZE,
				x,y1,G.SHAPESIZE,G.SHAPESIZE,90
			);
			MT.rotatedDrawImage(destination.ctx,
				frame.cnv,
				G.SHAPESIZE,0,G.SHAPESIZE,G.SHAPESIZE,
				x,y2,G.SHAPESIZE,G.SHAPESIZE,90,1,-1
			);
		}
		for (var y=y1+G.SHAPESIZE;y<y2;y+=G.SHAPESIZE) {
			MT.rotatedDrawImage(destination.ctx,
				frame.cnv,
				G.SHAPESIZE,0,G.SHAPESIZE,G.SHAPESIZE,
				x1,y,G.SHAPESIZE,G.SHAPESIZE
			);
			MT.rotatedDrawImage(destination.ctx,
				frame.cnv,
				G.SHAPESIZE,0,G.SHAPESIZE,G.SHAPESIZE,
				x2,y,G.SHAPESIZE,G.SHAPESIZE,0,-1,1
			);
		}
		MT.rotatedDrawImage(destination.ctx,
			frame.cnv,
			0,0,G.SHAPESIZE,G.SHAPESIZE,
			x1,y1,G.SHAPESIZE,G.SHAPESIZE
		);
		MT.rotatedDrawImage(destination.ctx,
			frame.cnv,
			0,0,G.SHAPESIZE,G.SHAPESIZE,
			x2,y1,G.SHAPESIZE,G.SHAPESIZE,0,-1,1
		);
		MT.rotatedDrawImage(destination.ctx,
			frame.cnv,
			0,0,G.SHAPESIZE,G.SHAPESIZE,
			x1,y2,G.SHAPESIZE,G.SHAPESIZE,0,1,-1
		);
		MT.rotatedDrawImage(destination.ctx,
			frame.cnv,
			0,0,G.SHAPESIZE,G.SHAPESIZE,
			x2,y2,G.SHAPESIZE,G.SHAPESIZE,0,-1,-1
		);

	},
	decide:function(MT,G) {

		var slotid=-1,slots=MT.randomShuffle(G,[1,1,1,2,2,2,3,3,4,4]); // UP/DOWN/LEFT/RIGHT
		var marginTop=marginBottom=marginLeft=marginRight=0;
		for (var i in G.counters)
			if (!G.counters[i].hidden){
				slotid++;
				G.counters[i].slot=slots[slotid];
				switch (G.counters[i].slot) {
					case 1:{ // UP
						G.counters[i].y=marginTop;
						marginTop+=G.SHAPESIZE;
						break;
					}
					case 2:{ // DOWN
						marginBottom+=G.SHAPESIZE;
						G.counters[i].y=G.screenHeight-marginBottom;
						break;
					}
					case 3:{ // LEFT
						G.counters[i].x=marginLeft;
						marginLeft+=G.SHAPESIZE;
						break;
					}
					case 4:{ // RIGHT
						marginRight+=G.SHAPESIZE;
						G.counters[i].x=G.screenWidth-marginRight;
						break;
					}
				}
			}
		
		var labelSize,topfirst=(marginTop||marginBottom)&&MT.randomly(G),hudmargin=MT.randomInRange(G,0,2);
		for (var i in G.counters)
			switch (G.counters[i].slot) {
				case 1: // UP
				case 2:{ // DOWN
					G.counters[i].orientation=0; // HORIZONTAL
					labelSize=(G.counters[i].label.length+MT.randomInRange(G,0,1))*(G.fonts.ui.lw+G.spacings.ui);
					if (G.counters[i].alignment) {
						if (topfirst) G.counters[i].x=G.screenWidth;
						else G.counters[i].x=G.screenWidth-marginLeft-hudmargin;
						G.counters[i].valueX=G.counters[i].x-labelSize;
						if (topfirst)
							G.counters[i].valueSize=G.counters[i].valueX;
						else
							G.counters[i].valueSize=G.counters[i].valueX-marginLeft+(marginLeft?hudmargin:0);						
					} else {
						if (topfirst) G.counters[i].x=0;
						else G.counters[i].x=marginLeft+hudmargin;
						G.counters[i].valueX=G.counters[i].x+labelSize;
						if (topfirst)
							G.counters[i].valueSize=G.screenWidth-G.counters[i].valueX;
						else
							G.counters[i].valueSize=G.screenWidth-G.counters[i].valueX-marginRight-(marginRight?hudmargin:0);						
					}
					G.counters[i].valueY=G.counters[i].y;
					break;
				}
				case 3: // LEFT
				case 4:{ // RIGHT
					G.counters[i].orientation=1; // VERTICAL
					labelSize=(G.counters[i].label.length+MT.randomInRange(G,0,1))*(G.fonts.ui.lh+G.spacings.ui);
					if (G.counters[i].alignment) {
						if (topfirst) G.counters[i].y=G.screenHeight-marginBottom-hudmargin;
						else G.counters[i].y=G.screenHeight;
						G.counters[i].valueY=G.counters[i].y-labelSize;
						if (topfirst)
							G.counters[i].valueSize=G.counters[i].valueY-marginTop-(marginTop?hudmargin:0);
						else
							G.counters[i].valueSize=G.counters[i].valueY;
					} else {
						if (topfirst) G.counters[i].y=marginTop+hudmargin;							
						else G.counters[i].y=0;
						G.counters[i].valueY=G.counters[i].y+labelSize;
						if (topfirst)
							G.counters[i].valueSize=G.screenHeight-G.counters[i].valueY-marginBottom-(marginBottom?hudmargin:0);
						else
							G.counters[i].valueSize=G.screenHeight-G.counters[i].valueY;
					}
					G.counters[i].valueX=G.counters[i].x;
					
					break;
				}					
			}

		G.screenAreaTilesX=Math.floor(G.screenWidth/G.SHAPESIZE)
		G.screenAreaTilesY=Math.floor(G.screenHeight/G.SHAPESIZE)

		// Rarely there is some kind of border effect
		if (MT.randomly(G))
			switch (MT.randomInRange(G,0,2)) {
				case 0:{
					// No borders. Counters around the play area
					marginLeft=0;
					marginTop=0;
					marginBottom=0;
					marginRight=0;
					G.hudColor=0;
					break;
				}
				case 1:{
					// Random padding on the sides
					if (MT.randomly(G)) marginLeft+=G.SHAPESIZE;
					if (MT.randomly(G)) marginRight+=G.SHAPESIZE;
					if (MT.randomly(G)) marginTop+=G.SHAPESIZE;
					if (MT.randomly(G)) marginBottom+=G.SHAPESIZE;
					break;
				}
				case 2:{
					marginLeft+=G.SHAPESIZE;
					marginRight+=G.SHAPESIZE;
					marginTop+=G.SHAPESIZE;
					marginBottom+=G.SHAPESIZE;

					// Random frame around the play area
					G.hudOverlay=MT.newCanvas(G.screenWidth,G.screenHeight);
					this.blitFrame(
						MT,G,
						G.hudOverlay,
						MT.randomElement(G,MT.CONCEPTS.BORDERCORNER),
						MT.randomElement(G,MT.CONCEPTS.BORDERLINE),
						marginLeft-G.SHAPESIZE,marginTop-G.SHAPESIZE,
						G.screenWidth-marginRight,G.screenHeight-marginBottom,
						G.palette.colors[MT.randomElement(G,G.palette.sets[0])],
						G.palette.colors[MT.randomElement(G,G.palette.sets[1])]
					)
					break;
				}
			}

		G.gameAreaX=marginLeft;
		G.gameAreaY=marginTop;
		G.gameAreaWidth=G.screenWidth-marginRight-G.gameAreaX;
		G.gameAreaHeight=G.screenHeight-marginBottom-G.gameAreaY;
		G.hudColor=MT.rarely(G)?G.palette.colors[MT.randomElement(G,G.palette.sets[1])]:G.palette.background;

		G.gameAreaTilesX=Math.floor(G.gameAreaWidth/G.SHAPESIZE);
		G.gameAreaTilesY=Math.floor(G.gameAreaHeight/G.SHAPESIZE);

		var scrollX=1,scrollY=1;
		if (MT.rarely(G)) {
			scrollX=MT.randomInRange(G,1,3);
			scrollY=MT.randomInRange(G,1,3);
		}

		G.mapAreaTilesX=G.gameAreaTilesX*scrollX;
		G.mapAreaTilesY=G.gameAreaTilesY*scrollY;
		G.mapAreaWidth=G.mapAreaTilesX*G.SHAPESIZE;
		G.mapAreaHeight=G.mapAreaTilesY*G.SHAPESIZE;
		
		G.cameraGapX=Math.floor((G.gameAreaWidth+G.SHAPESIZE)/2);
		G.cameraGapY=Math.floor((G.gameAreaHeight+G.SHAPESIZE)/2);
		G.cameraLeft=0;
		G.cameraTop=0;
		G.cameraRight=G.mapAreaWidth-G.gameAreaWidth;
		G.cameraBottom=G.mapAreaHeight-G.gameAreaHeight;


	}
});