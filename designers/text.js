METAME.addDesigner({
	id:"text",
	needs:[
		"screenWidth",
		"palette",
		"alphabet",
		"letters",
		"digits"
	],
	WALLANIMATIONS:{
		long:[1,2],
		short:[0,1,2,3,4,5],
		label:[0,1,2,3,4,5]
	},
	UIEFFECTS:[
		[0]
	],
	TITLEEFFECTS:[
		[0,1,2,3,4,5,6,7,8,9],
		[10,11,12]
	],
	TEXTEFFECTS:[
		[0,1,2,3,4,5,6,7,8,9]
	],
	randomTextEffect:function(MT,G,set) {
		return {id:MT.randomElement(G,MT.randomElement(G,set)),args:MT.randomNumbers(G,10,0,3)}
	},
	randomTextColor:function(MT,G) {
		return [MT.randomElement(G,G.palette.sets[0]),MT.randomElement(G,G.palette.sets[1])]
	},
	randomLabelScreen:function(MT,G,away,font,color,spacing,effect,hasbackground) {
		var args=MT.randomNumbers(G,10,0,3);
		args[0]=3; // Always fast
		return {			
			height:G.fonts[font].lh,
			font:font,
			color:color,
			spacing:spacing,
			effect:effect,
			bgColor:hasbackground&&MT.randomly(G)?MT.randomElement(G,G.palette.sets[1]):0,
			animation:MT.randomly(G)?0:MT.randomElement(G,this.WALLANIMATIONS.label),
			args:args,
			away:away,
			text:[{y:0,label:0}]
		};
	},
	randomWallOfText:function(MT,G,away,font,color,spacing,effect,width,height,linespacing,cutratio) {
		var lineHeight=(G.fonts[font].lh+linespacing);
		var lettersPerLine=Math.floor(width/(G.fonts[font].lw+G.spacings[font]));
		var lines=Math.floor(height/lineHeight);	
		var wall={			
			width:width,
			height:lines*lineHeight,
			font:font,
			color:color,
			spacing:spacing,
			effect:effect,
			text:[],
			bgColor:MT.randomly(G)?G.palette.colors[MT.randomElement(G,G.palette.sets[1])]:0,
			args:MT.randomNumbers(G,10,0,3),
			away:away
		};
		wall.animation=MT.randomElement(G,wall.height>G.screenHeight?this.WALLANIMATIONS.long:this.WALLANIMATIONS.short);
		for (var i=0;i<lines;i++)
			wall.text.push({
				y:i*lineHeight,
				label:MT.randomSentence(G,G.letters,lettersPerLine),
			});
		var line,cut=MT.randomInRange(G,2,Math.floor(lines*cutratio));
		for (var i=0;i<cut;i++) {
			line=MT.random(G,lines);
			wall.text[line].label=wall.text[line].label.splice(0,MT.randomIndex(G,wall.text[line].label));
		}
		// Sometime the wall of text contains the game title
		if (MT.randomly(G)) wall.text[0].label=G.labels.title;
		return wall;
	},
	decide:function(MT,G) {

		// Title font stretch
		var titleHeightScale,titleWidthScale=MT.randomInRange(G,1,4);
		var ratio=MT.randomInRange(G,1,4);
		if (MT.randomly(G)) titleHeightScale=Math.ceil(titleWidthScale*ratio);
		else titleHeightScale=Math.ceil(titleWidthScale/ratio);

		G.fonts={
			title:MT.makeFont(G,G.palette,G.alphabet,titleWidthScale,titleHeightScale),
			ui:MT.makeFont(G,G.palette,G.alphabet,1,1),
			digits:MT.makeFont(G,G.palette,G.digits,1,1)
		}

		var normalSpacing=MT.randomInRange(G,0,1);
		G.spacings={
			title:normalSpacing+MT.randomInRange(G,0,2),
			lines:normalSpacing+MT.randomInRange(G,0,2),
			ui:normalSpacing+MT.randomInRange(G,0,1)
		}

		G.lineLength=Math.floor(G.screenWidth/(G.spacings.ui+G.SHAPESIZE));
		G.titleLineLength=Math.floor(G.screenWidth/(G.spacings.title+(G.SHAPESIZE*titleWidthScale)));

		var lineSpacing=MT.randomInRange(G,0,3);
		G.labels={			
			title:MT.randomSentence(G,G.letters,MT.randomInRange(G,3,G.titleLineLength)),
			subtitle:MT.randomSentence(G,G.letters,MT.randomly(G)?MT.randomInRange(G,0,G.lineLength):0),
			pressstart:MT.randomSentence(G,G.letters,MT.randomInRange(G,0,G.lineLength)),
			credits:MT.randomSentence(G,G.letters,MT.randomInRange(G,0,G.lineLength)),
			gameover:MT.randomSentence(G,G.letters,MT.randomInRange(G,0,Math.floor(G.lineLength*0.8))),
			getready:MT.randomly(G)?MT.randomSentence(G,G.letters,MT.randomInRange(G,1,G.lineLength)):[]
		}
		G.colors={
			title:this.randomTextColor(MT,G),
			subtitle:this.randomTextColor(MT,G),
			pressstart:this.randomTextColor(MT,G),
			credits:this.randomTextColor(MT,G),
			ui:this.randomTextColor(MT,G),
			digits:this.randomTextColor(MT,G),
			stagetitle:this.randomTextColor(MT,G),
			gameover:this.randomTextColor(MT,G),
			getready:this.randomTextColor(MT,G),
			ending:this.randomTextColor(MT,G)
		}
		G.effects={
			ui:this.randomTextEffect(MT,G,this.UIEFFECTS),
			digits:this.randomTextEffect(MT,G,this.UIEFFECTS),

			title:this.randomTextEffect(MT,G,this.TITLEEFFECTS),
			stagetitle:this.randomTextEffect(MT,G,this.TITLEEFFECTS),
			gameover:this.randomTextColor(MT,G,this.TITLEEFFECTS),
			getready:this.randomTextColor(MT,G,this.TITLEEFFECTS),

			subtitle:this.randomTextEffect(MT,G,this.TEXTEFFECTS),
			pressstart:this.randomTextEffect(MT,G,this.TEXTEFFECTS),
			credits:this.randomTextEffect(MT,G,this.TEXTEFFECTS),
			ending:this.randomTextEffect(MT,G,this.TEXTEFFECTS)
		}
		// font,color,spacing,effect
		G.textScreens={
			warning:this.randomWallOfText(
				MT,G,
				false,
				"ui","ui","ui","ui",
				G.screenWidth-(G.SHAPESIZE*MT.randomInRange(G,0,3)),
				G.screenHeight-(G.SHAPESIZE*MT.randomInRange(G,0,6)),
				lineSpacing,0.5
			),
			stagetitle:this.randomLabelScreen(
				MT,G,
				false,
				"ui","stagetitle","ui","stagetitle"
			),
			getready:this.randomLabelScreen(
				MT,G,
				false,
				"ui","getready","ui","getready"
			),
			gameover:this.randomLabelScreen(
				MT,G,
				false,
				"ui","gameover","ui","gameover",
				true
			)	
		};

		G.ending=[];

		var endingScreens=MT.randomInRange(G,1,3);
		for (var i=0;i<endingScreens;i++)
			G.ending.push(this.randomWallOfText(
				MT,G,
				true,
				"ui","ending","ui","ending",
				G.screenWidth-(G.SHAPESIZE*MT.randomInRange(G,0,3)),
				(G.screenHeight-(G.SHAPESIZE*MT.randomInRange(G,0,6)))*MT.randomInRange(G,1,5),
				lineSpacing,5
			));
	}
});