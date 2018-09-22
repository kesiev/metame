METAME.addDesigner({
	id:"title",
	needs:[
		"screenWidth",
		"fonts",
		"spacings"
	],
	TITLELAYOUTS:[
		[
			{font:"title",label:"title",spacing:"title"},
			{font:"ui",label:"subtitle",spacing:"normal"},
			{spring:1},
			{font:"ui",label:"pressstart",spacing:"ui"},
			{font:"ui",label:"credits",spacing:"ui"}
		]
	],
	TITLEMODES:3,
	decide:function(MT,G) {

		// Title screen text layout

		var titleMargin=MT.random(G,G.SHAPESIZE);
		G.titleLayout=MT.randomShuffle(G,MT.clone(MT.randomElement(G,this.TITLELAYOUTS)));

		var springs=0,springSize=G.screenHeight-(titleMargin*2),springs=0,py=titleMargin;
		for (var i=0;i<G.titleLayout.length;i++)
			if (G.titleLayout[i].font) {
				G.titleLayout[i].height=G.fonts[G.titleLayout[i].font].lh+G.spacings.lines;
				springSize-=G.titleLayout[i].height;
			} else if (G.titleLayout[i].spring) springs++;
		springSize=Math.floor(springSize/springs);
		for (var i=0;i<G.titleLayout.length;i++)
			if (G.titleLayout[i].height) {
				G.titleLayout[i].y=py;
				py+=G.titleLayout[i].height;
			} else if (G.titleLayout[i].spring) py+=springSize;

		// Title screen background image 

		G.titleMode=MT.random(G,this.TITLEMODES);
		G.titleBgColor=MT.rarely(G)?G.palette.colors[MT.randomElement(G,G.palette.sets[1])]:0;

	}
});