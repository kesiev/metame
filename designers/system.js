METAME.addDesigner({
	id:"system",
	needs:[],
	makePalette:function(palette,frequency1, frequency2, frequency3,phase1, phase2, phase3,center, width, len) {
	    if (center == undefined)   center = 128;
	    if (width == undefined)    width = 127;
	    if (len == undefined)      len = 50;

	    for (var i = 0; i<len; ++i)
	    {
	       var red = Math.sin(frequency1*i + phase1) * width + center;
	       var green = Math.sin(frequency2*i + phase2) * width + center;
	       var blue = Math.sin(frequency3*i + phase3) * width + center;
	       palette.sets[i%2].push(palette.colors.length);
	       palette.colors.push([Math.floor(red),Math.floor(green),Math.floor(blue),255]);
	    }

	    return palette;
	  },
	decide:function(MT,G) {

		// Screen size in tiles
		G.screenTilesX=MT.randomInRange(G,10,20);
		G.screenTilesY=MT.randomInRange(G,10,20);

		// Screen size in pixels
		G.screenWidth=G.screenTilesX*G.SHAPESIZE;
		G.screenHeight=G.screenTilesY*G.SHAPESIZE;
		G.shortSide=Math.floor(Math.min(G.screenWidth,G.screenHeight)/3);

		G.hScreenWidth=Math.floor(G.screenWidth/2);
		G.hScreenHeight=Math.floor(G.screenHeight/2);			

		// Screen stretch
		G.widthStretch=MT.randomInRange(G,1,2);
		G.heightStretch=MT.randomInRange(G,1,2);

		// True screen size
		G.renderWidth=G.widthStretch*G.screenWidth;
		G.renderHeight=G.heightStretch*G.screenHeight;

		switch (MT.randomInRange(G,0,2)) {
			case 0:{
				// BASIC COLORS
				G.palette={
					background:[0,0,0,255],
					colors:[
						[255,0,0,255],[0,255,0,255],[0,0,255,255],[255,255,0,255],[0,255,255,255],[255,0,255,255],
						[128,0,0,255],[0,128,0,255],[0,0,128,255],[128,128,0,255],[0,128,128,255],[128,0,128,255]
					],
					sets:[
						MT.randomShuffle(G,[0,1,2,3,4,5]),
						MT.randomShuffle(G,[6,7,8,9,10,11])
					]
				};
				break;
			}
			case 1:{ // MONOCHROME
				var base=[MT.randomInRange(G,128,255),MT.randomInRange(G,128,255),MT.randomInRange(G,128,255),255];
				var lightRatio=MT.randomInRange(G,2,4);
				var darkRatio=lightRatio+MT.randomInRange(G,1,3);
				G.palette={
					background:base,
					colors:[
						[Math.floor(base[0]/darkRatio),Math.floor(base[1]/darkRatio),Math.floor(base[2]/darkRatio),255],
						[Math.floor(base[0]/lightRatio),Math.floor(base[1]/lightRatio),Math.floor(base[2]/lightRatio),255]
					],
					sets:[[0],[1]]
				};
				break;
			}
			case 2:{ // GENERATED PALETTE
				var brightness=MT.randomInRange(G,10,20)/10;
				var frequency=.1*MT.randomInRange(G,1,20);
				G.palette=this.makePalette({
					background:[0,0,0,255],
					colors:[],
					sets:[[],[]]
				},
					frequency,frequency,frequency,
					MT.randomInRange(G,0,1000),
					MT.randomInRange(G,0,1000),
					MT.randomInRange(G,0,1000),
					128/brightness,127/brightness,
					2*MT.randomInRange(G,1,10)
				);
				break;
			}
		}

		if (MT.randomly(G)) {
			// Randomly swaps color set
			var swp=G.palette.sets[0];
			G.palette.sets[0]=G.palette.sets[1];
			G.palette.sets[1]=swp;
		}
		
		/*
		var html="";
		for (var i=0;i<G.palette.colors.length;i++)
			html+='<font style="color:'+MT.getHtmlColor(G.palette.colors[i])+'">&#9608;</font>';
		document.body.innerHTML+=html;
		*/

	}
});