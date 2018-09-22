METAME.addDesigner({
	id:"graphics",
	needs:[
		"elements",
		"palette"
	],
	decide:function(MT,G) {

		// Graphics - Gauges
		G.gauges=MT.newCanvas(G.SHAPEGAP*G.GAUGESPERGAME,G.SHAPEGAP);
		gaugesData=G.gauges.getData();
		for (var i=0;i<G.GAUGESPERGAME;i++)
			MT.blitConcept(
				G.gauges,
				gaugesData,
				MT.randomElement(G,MT.CONCEPTS.GAUGE),
				i*G.SHAPEGAP,0,
				G.TRANSPARENTCOLOR,
				MT.randomElement(G,G.palette.colors),
				MT.randomElement(G,G.palette.colors),
				MT.rarely(G)
			);
		G.gauges.putData(gaugesData);

		// Graphics - Sprites
		G.gamesprites=MT.newCanvas(G.elements.length*G.SHAPEGAP,G.SHAPEGAP);
		var gamespritesdata=G.gamesprites.getData();
		for (var i=0;i<G.elements.length;i++)
			MT.blitConcept(
				G.gamesprites,
				gamespritesdata,
				MT.CONCEPTS[G.elements[i].conceptRow][G.elements[i].conceptCol],
				i*G.SHAPEGAP,0,
				G.TRANSPARENTCOLOR,
				G.palette.colors[G.elements[i].color1],
				G.palette.colors[G.elements[i].color2],
				MT.rarely(G)
			);
		G.gamesprites.putData(gamespritesdata);

	}
});