METAME.setEngine({
	onSet:function(MT) {
		MT.C.STATES={
			BOOT:0,
			
			WARNING:1,

			TITLESTART:2,
			TITLE:3,
			GAMESTART:4,
			
			STAGESTART:5,
			STAGETITLE:6,
			PREPARESTAGE:7,
			SPAWNPLAYER:8,
			GAMERUNNING:9,
			LIFELOST:10,
			STAGECLEAR:11,

			GAMEOVERSTART:12,
			GAMEOVER:13,

			ENDINGSTART:15,
			ENDING:14
		};
		MT.C.KEYS={
			"up":38,
			"down":40,
			"left":37,
			"right":39,
			"A":90
		};
		MT.C.FPS=25;
		MT.C.MAXSPRITES=200;
		MT.C.MAXFORCESPRITES=250;
	},
	run:function(MT,G,CFG) {
		var _DEGTORAD=3.14/180,_PRC=0.001;

		var doResize,state,loadingTimer; // State machine
		var rawKeyboard=[],keyboard={},spritesKeyboard={}; // Input/output
		var _mspf=Math.ceil(1000/G.FPS);

		for (var i in G.KEYS) keyboard[i]=0;

		function resize() {
			var pageWidth=document.body.clientWidth,
				pageHeight=document.body.clientHeight;
			var 
				xratio=pageWidth/G.renderWidth,
				yratio=pageHeight/G.renderHeight;
			if (xratio*G.renderHeight<pageHeight) ratio=xratio;
			else ratio=yratio;
			ratio=(Math.floor(ratio*100)/100)-0.5;
			G.screen.cnv.style.display="block";
			G.screen.cnv.style.left=Math.floor((pageWidth-(ratio*G.renderWidth))/2);
			G.screen.cnv.style.top=Math.floor((pageHeight-(ratio*G.renderHeight))/2);;
			G.screen.cnv.style.transform="scale("+ratio+")";
		}

		function askResize() { doResize=10; }

		// Prepare screen
		G.screen=MT.newCanvas(G.screenWidth,G.screenHeight);
		G.screen.cnv.tabIndex=1;
		G.screen.cnv.onkeydown=function(e) { rawKeyboard[e.keyCode]=1; }
		G.screen.cnv.onkeyup=function(e) { rawKeyboard[e.keyCode]=0; }
		G.screen.cnv.style.backgroundColor=MT.getHtmlColor(G.palette.background);
		G.screen.cnv.style.width=G.renderWidth;
		G.screen.cnv.style.height=G.renderHeight;
		if (CFG.fullScreen) {
			G.screen.cnv.style.position="absolute";
			G.screen.cnv.style.transformOrigin="0 0";
			G.screen.cnv.style.display="none";
			MT.addEventListener(window,"resize",askResize);
			askResize();
		} else {
			G.screen.cnv.style.width=G.renderWidth*(CFG.scale||1);
			G.screen.cnv.style.height=G.renderHeight*(CFG.scale||1);
		}
		CFG.parent.appendChild(G.screen.cnv);

		// --- DATA/EVENT FLOW

		var spritesIndex;

		function fix(val) { return (val>-_PRC)&&(val<_PRC)?0:val }

		function gotoState(id) {
			stateTimer=-1;
			if (G.loadingTimes[id]) loadingTimer=G.loadingTimes[id];
			for (var a in G.counters)
				if (G.counters[a].resetOn[id]) {
					if (CFG.debug) console.log(a,"=",G.counters[a].baseAmount);
					G.counters[a].amount=G.counters[a].baseAmount;
				}
			state=id;
		}

		function gotoNextState(id) {
			if (CFG.debug) console.log("--->",id);
			if (G.nextStates[state]!==undefined)
				if (G.nextStates[state][id]!==undefined)
					gotoState(G.nextStates[state][id]);
				else
					if (CFG.debug) console.warn("NO NEXT STATE FOR "+state+"->"+id); // NON GRAVE
			else
				if (CFG.debug) console.warn("NO NEXT STATE FOR "+state);
		}

		function runThen(condition) {
			switch (condition.then) {
				case "nextstate":{
					gotoNextState(condition.state);
					break;
				}
				case "extralife":{
					if (G.counters.lives.amount<G.counters.lives.higherLimit)
						setCounter("lives",G.counters.lives.amount+1);
					break;
				}
				case "addscore":{
					setCounter("score",G.counters.score.amount+condition.score);
					break;
				}
				case "damage":{
					if (spritesIndex[G.playerElement].length!=-1) {
						setCounter("health",G.counters.health.amount-condition.damage);
						for (var i=0;i<spritesIndex[G.playerElement].length;i++)
							spritesIndex[G.playerElement][i].invulnerabilityTimer=spritesIndex[G.playerElement][i].invulnerabilityOnHitTimer;						
					}
					break;
				}
			}
		}

		function setCounter(counter,value) {
			var c=G.counters[counter];
			if ((c.higherLimit!==undefined)&&(value>c.higherLimit)) value=c.higherLimit;
			if ((c.lowerLimit!==undefined)&&(value<c.lowerLimit)) value=c.lowerLimit;
			if (c.amount!=value) {
				var doRunThen;
				for (var i=0;i<G.conditions.length;i++) {
					doRunThen=false;
					if ((G.conditions[i].if.when=="counter")&&(G.conditions[i].if.counter==counter)) {
						if (G.conditions[i].if.surpass!==undefined) {
							if (
								(c.amount<G.conditions[i].if.surpass)&&
								(value>=G.conditions[i].if.surpass)
							) doRunThen=true;
						} else if (G.conditions[i].if.is!==undefined) {
							if (G.conditions[i].if.is==value) doRunThen=true;
						}
					}
					if (doRunThen) runThen(G.conditions[i]);
				}
				c.amount=value;
			}			
		}

		function triggerEvent(data) {
			var trigger;
			for (var i=0;i<G.conditions.length;i++)
				if (G.conditions[i].if.when=="event") {
					trigger=true;
					for (var a in data)
						if (G.conditions[i].if.event[a]!=data[a]) {
							trigger=false;
							break;
						}
					if (trigger) runThen(G.conditions[i]);
				}
		}

		// --- SPRITES

		var sprites=[],sparks=[];
		var timeId,timeTime;

		function resetGame() {
			sprites=[];
			sparks=[];
			timeId=0;
			timeTime=0;
		}

		function addSpark(side,sprite,sparkcfg,enable) {
			var data={
				elementId:sprite.element,
				x:sprite.x,
				y:sprite.y,
				type:sparkcfg.type,
				duration:sparkcfg.duration,
				args:sparkcfg.args,
				colors:sparkcfg.colors,
				label:sparkcfg.label,
				side:side
			}
			if (enable) {
				enable.disabled=true;
				data.enable=enable;
			}
			sparks.push(data);
		}		

		function addSprite(set,elementid,x,y,force,mute,unrumble,unspark) {
			if (
				(!force&&(set.length<G.MAXSPRITES))||
				(force&&(set.length<G.MAXFORCESPRITES))
			) {
				var out={},element=G.elements[elementid];
				for (var a in G.world) out[a]=G.world[a];
				for (var a in element) out[a]=element[a];
				out.x=x;
				out.y=y;
				out.alive=1;
				set.push(out);
				if (!mute) MT.playAudioSample(G,out.audioOnSpawn);
				if (!unrumble) rumble(G,out.rumbleOnSpawn);
				if (!unspark) {
					if (out.sparkOnSpawn) addSpark(-1,out,out.sparkOnSpawn,out);
					if (out.labelOnSpawn) addSpark(1,out,out.labelOnSpawn);
				}
				return out;
			}
		}

		function calculateAngle(sprite1,sprite2) {
			var dx = sprite2.x-sprite1.x, dy = sprite1.y-sprite2.y;
			var ang = (Math.atan2(dx, dy) * 180 / Math.PI);
			if (ang < 0) ang = 360 + ang;
			return ang;
		}

		function calculateVector(angle,len) {
			angle*=_DEGTORAD;
			return {
				x:angle == 180 ? 0 : fix(len * Math.sin(angle)),
				y:angle == 270 ? 0 : fix(-len * Math.cos(angle))
			}
		}

		function calculateDistance(sprite1,sprite2) {
			return Math.hypot(sprite2.x-sprite1.x,sprite2.y-sprite1.y);
		}

		function getNearest(sprite,elementid,distance) {
			var distance,nearest,nearestDistance;
			for (var i=0;i<sprites.length;i++)
				if (sprites[i].alive&&(sprites[i].element==elementid)) {
					distance=calculateDistance(sprite,sprites[i]);
					if (!nearest||(distance<=nearestDistance)) {
						nearest=sprites[i];
						nearestDistance=distance;
					}
				}
			return nearest;
		}

		function handleSpeed(sprite,size,coord,speed,allcollisions) {
			var collided=false;
			if (sprite[speed]) {
				var otherdelta,delta=sprite[size]*(sprite[speed]>0);
				var side=sprite[coord]+delta;
				sprite[coord]+=sprite[speed];
				var collisions=getCollision(sprite,"isWall",1,allcollisions);
				for (var j in collisions) {
					collided=true;
					otherdelta=collisions[j][size]*(sprite[speed]<0);
					if (sprite[speed]>0) side=Math.min(side,collisions[j][coord]+otherdelta);
					else side=Math.max(side,collisions[j][coord]+otherdelta);
				}
				if (collided) sprite[coord]=side-delta;
			}
			return collided;
		}

		function handleEdge(sprite,size,edges,coord,limitleft,limitright,speed) {
			switch (sprite[edges]) {
				case 0: {
					if (sprite[coord]<limitleft) { sprite[coord]=limitleft; sprite[speed]*=-1; }
					if (sprite[coord]+sprite[size]>=limitright) { sprite[coord]=limitright-sprite[size]; sprite[speed]*=-1; }
					break;
				}
				case 1: {
					if (sprite[coord]<=limitleft-sprite[size]) sprite[coord]=limitright-1;
					if (sprite[coord]>=limitright) sprite[coord]=limitleft-sprite[size]+1;
					break;
				}
			}
		}

		function getCollision(sprite,type,typevalue,all) {
			var sprite2,out={};
			for (var j=0;j<sprites.length;j++) {
				sprite2=sprites[j];
				if (
					sprite2.alive&&
					(sprite2.element!=sprite.element)&&
					(sprite2[type]==typevalue)&&
					!(
						(sprite.x>sprite2.x+sprite2.width-1)||
						(sprite.x+sprite.width-1<sprite2.x)||
						(sprite.y>sprite2.y+sprite2.height-1)||
						(sprite.y+sprite.height-1<sprite2.y)
					)
				) all[j]=out[j]=sprite2;
			}
			return out;
		}

		// --- DEFAULT SCREEN

		function printWall(wall,x,y) {
			for (var i=0;i<wall.text.length;i++)
				MT.print(
					G,
					G.fonts[wall.font],
					G.colors[wall.color],
					x,wall.text[i].y+y,
					wall.text[i].label,
					2,0,
					G.spacings[wall.spacing],
					G.effects[wall.effect]
				);
		}

		function drawBgColor(color) {
			if (color) {
				G.screen.ctx.fillStyle=MT.getHtmlColor(color);
				G.screen.ctx.fillRect(0,0,G.screenWidth,G.screenHeight);
			}
		}

		function drawBgImage(image) {
			if (image)
				G.screen.ctx.drawImage(image.cnv,0,0);
		}

		var wallState=0,wallTimer=0,wallStateTimer=0;
		function wallOfTextScreen(wall,text) {
			if (wall) {
				var wallWidth;
				if (text) {
					if (text.length) {
						wallWidth=text.length*(G.fonts[wall.font].lw+G.spacings[wall.spacing]);					
						wall.text[0].label=text;	
					} else return true; // Empty labels are not shown
				} else
					wallWidth=wall.width;
				var wallEnd,wallDone=false;
				var wallY=Math.floor(G.screenHeight-wall.height)/2;
				var wallX=G.hScreenWidth;
				drawBgColor(wall.bgColor);
				drawBgImage(wall.image);
				if (stateTimer==0) {
					MT.playAudioSample(G,wall.audioOnStart);
					wallState=0;
					wallStateTimer=0;
					wallTimer=0;
				} else wallTimer++;

				switch (wall.animation) {
					case 0:{ // Just print the wall of text in the middle of the screen
						wallDone=true;
						printWall(wall,G.hScreenWidth,wallY);
						break;
					}
					case 1:{ // Scroll to the top
						if (wall.away)
							wallEnd=-wall.height-G.HSHAPESIZE;
						else
							wallEnd=Math.floor(G.screenHeight-wall.height)/2;
						var y=Math.max(G.screenHeight-(wallTimer*(1+wall.args[0])),wallEnd);
						wallDone=(y==wallEnd);
						printWall(wall,wallX,y);
						break;
					}
					case 2:{ // Scroll to the bottom
						if (wall.away)
							wallEnd=G.screenHeight+G.HSHAPESIZE;
						else
							wallEnd=wallY;
						var y=Math.min(-wall.height+(wallTimer*(1+wall.args[0])),wallEnd);
						wallDone=(y==wallEnd);
						printWall(wall,wallX,y);
						break;
					}
					case 3:{ // Pan from the left
						if (wall.away)
							wallEnd=Math.floor(G.screenWidth+(wallWidth/2))+G.HSHAPESIZE;
						else
							wallEnd=wallX;
						var x=Math.min(-wallX+(wallTimer*(1+wall.args[0])),wallEnd);
						wallDone=(x==wallEnd);
						printWall(wall,x,wallY);
						break;
					}
					case 4:{ // Pan from the right
						if (wall.away)
							wallEnd=-wallX-G.HSHAPESIZE;
						else
							wallEnd=wallX;
						var x=Math.max(G.screenWidth+wallWidth-(wallTimer*(1+wall.args[0])),wallEnd);
						wallDone=(x==wallEnd);
						printWall(wall,x,wallY);
						break;
					}
					case 5:{ // Spin
						wallEnd=Math.max(Math.max(G.screenWidth,G.screenHeight)-((1+wall.args[0])*wallTimer),0);
						wallDone=!wallEnd;
						printWall(wall,wallX+(Math.sin(wallTimer/(4-wall.args[1]))*wallEnd),wallY+(Math.cos(wallTimer/(4-wall.args[2]))*wallEnd));
						break;
					}
				}
				if (!wallState) {
					if (wallDone) {
						MT.playAudioSample(G,wall.audioOnSet);
						wallState=1;
						stateTimer=1;
					}
				} else if (wallState==1) {
					if (wallStateTimer>=G.delays[state]) {
						wallState=2;
						MT.playAudioSample(G,wall.audioOnEnd);
						return true;
					} else wallStateTimer++;
				} else return true;
			} else return (stateTimer>=G.delays[state])
		}

		// --- ENGINE

		function loadLevel(level) {
			for (y=0;y<level.map.length;y++)
				for (x=0;x<level.map[0].length;x++) {
					if (level.map[y][x]!==undefined)
						addSprite(
							sprites,
							level.map[y][x],
							x*G.SHAPESIZE,
							y*G.SHAPESIZE,
							false,
							true,
							true,
							true
						);
					}
		}

		function runSprites(attractmode,areawidth,areaheight) {

			var run=false,timeFrame=G.time[timeId];

			if (timeFrame.runInput)
				for (var a in keyboard) spritesKeyboard[a]=keyboard[a];

			// Sprites

			if (areawidth==undefined) areawidth=G.mapAreaWidth;
			if (areaheight==undefined) areaheight=G.mapAreaHeight;
			
			spritesToProcess=sprites.length;

			for (var i=0;i<spritesToProcess;i++) {
				allCollisions={};
				sprite=sprites[i];

				if (sprite.alive&&!sprite.disabled) {
					if ((sprite.isPlayer&&timeFrame.runPlayer)||(!sprite.isPlayer&&timeFrame.runOther)) {
						if (sprite.isPlayer) {
							
							if (spritesKeyboard.right) sprite.speedX+=sprite.moveX;
							else if (spritesKeyboard.left) sprite.speedX-=sprite.moveX;
							else sprite.speedX*=sprite.notMoving;

							if (spritesKeyboard.up) sprite.speedY-=sprite.moveY;
							else if (spritesKeyboard.down) sprite.speedY+=sprite.moveY;
							else sprite.speedY*=sprite.notMoving;
							
							if (sprite.buttonTimer)
								sprite.buttonTimer--;
							else if (spritesKeyboard.A==1) {
								sprite.buttonTimer=sprite.buttonDelay;
								switch (sprite.buttonAction) {
									case 1:{ // FIRE
										addSprite(sprites,G.bulletElement,sprite.x,sprite.y,true,attractmode);
										break;
									}
									case 2:{ // JUMP
										sprite.speedY=-sprite.gravityY*sprite.jumpHeight;
										sprite.speedX=-sprite.gravityX*sprite.jumpHeight;
										break;
									}
								}
							}						
						} else if (sprite.aiSpeed) {
							sprite.aiTimer++;
							if (sprite.aiTimer>=sprite.aiSpeed) {
								sprite.aiTimer=0;
								if ((sprite.follow!=-1)&&(sprite.follow!=sprite.element)&&sprite.speed) {
									nearest=getNearest(sprite,sprite.follow,sprite.followDistance);
									if (nearest) {
										angle=calculateAngle(sprite,nearest);
										vector=calculateVector(angle,sprite.speed);
										sprite.speedX=vector.x;
										sprite.speedY=vector.y;					
										//sprite._line=nearest;
									}
								}
							}
							if (sprite.onAiSpawn)
								addSprite(sprites,sprite.onAiSpawn,sprite.x,sprite.y,false,attractmode);
						}

						sprite.speedX=MT.limit(sprite.speedX+sprite.gravityX,-sprite.speedLimit,sprite.speedLimit);
						sprite.speedY=MT.limit(sprite.speedY+sprite.gravityY,-sprite.speedLimit,sprite.speedLimit);
						if (handleSpeed(sprite,"width","x","speedX",allCollisions)) sprite.speedX*=-sprite.restitution;
						if (handleSpeed(sprite,"height","y","speedY",allCollisions)) sprite.speedY*=-sprite.restitution;
						handleEdge(sprite,"height","edgeUpDown","y",0,areaheight,"speedY");
						handleEdge(sprite,"width","edgeLeftRight","x",0,areawidth,"speedX");

						if (sprite.hits!=sprite.element)
							getCollision(sprite,"hits",sprite.element,allCollisions);
						if (sprite.invulnerabilityTimer)
							sprite.invulnerabilityTimer--;
						else
							for (var j in allCollisions) {
								triggerEvent({id:"collision",of:sprite.element,with:allCollisions[j].element});
								if (allCollisions[j].kills)
									sprite.alive=0;
							}
					
					} else if (sprite.invulnerabilityTimer) sprite.invulnerabilityTimer--;
				}			
						
			}

			for (var i=0;i<G.elements.length;i++) spritesIndex[i]=[];

			for (var i=0;i<sprites.length;i++)
				if (sprites[i].alive) {	
					spritesIndex[sprites[i].element].push(sprites[i]);
					alive.push(sprites[i]);
				} else {
					if (!attractmode) MT.playAudioSample(G,sprites[i].audioOnDead);
					rumble(G,sprites[i].rumbleOnDead);
					if (sprites[i].sparkOnDead) addSpark(1,sprites[i],sprites[i].sparkOnDead);
					if (sprites[i].labelOnDead) addSpark(1,sprites[i],sprites[i].labelOnDead);
					triggerEvent({id:"destroyed",is:sprites[i].element});
					if (sprites[i].onDeadSpawn!==undefined)
						addSprite(alive,sprites[i].onDeadSpawn,sprites[i].x,sprites[i].y,false,attractmode);
				}

			sprites=alive;

			// Sparks

			var spark;
			for (var i=0;i<sparks.length;i++) {
				spark=sparks[i];
				if (spark.timer===undefined)
					if (spark.side>0) spark.timer=0;
					else spark.timer=spark.duration;
				else
					spark.timer+=spark.side;
				spark.prc=spark.timer/spark.duration;
				spark.iprc=1-spark.prc;
				spark.dead=spark.prc<0||spark.prc>1;
			}

			alive=[];
			for (var i=0;i<sparks.length;i++)
				if (!sparks[i].dead) alive.push(sparks[i]);
				else if (sparks[i].enable) sparks[i].enable.disabled=false;

			sparks=alive;

			switch (timeFrame.wait) {
				case "keydowntimeout":{
					if (attractmode)
						run=true;
					else {
						for (var a in spritesKeyboard)
							if (spritesKeyboard[a]) {
								run=true;
								break;
							}
						if (!run) {
							timeTime++;
							if (timeTime>=timeFrame.frames) run=true;
						}
					}
					break;
				}
				case "frames":{
					timeTime++;
					if (timeTime>=timeFrame.frames) run=true;
					break;
				}
				case "keydown":{
					if (attractmode)
						run=true;
					else {
						for (var a in spritesKeyboard)
							if (spritesKeyboard[a]) {
								run=true;
								break;
							}
					}
					break;
				}
				case "keyup":{
					if (attractmode)
						run=true;
					else {
						run=true;
						for (var a in keyboard)
							if (keyboard[a]) {
								run=false;
								break;
							}
					}
					break;
				}
			}

			if (run) {
				timeTime=0;
				timeId++;
				if (!G.time[timeId]) timeId=0;
			}

		}

		function renderSprites(areax,areay) {
			if (areax==undefined) areax=G.gameAreaX;
			if (areay==undefined) areay=G.gameAreaY;

			// Sprites

			var rx,ry,dx,dy,drawSprite,sprite;

			if (rumbleTimer)
				switch (rumbleMode) {
					case 2:{ // Screen blinking
						if (!CFG.disableBlinking)
							drawBgColor(G.palette.colors[rumbleColors[Math.floor(rumbleTimer/rumbleIntensity)%2]]);
						break;
					}
				}


			for (var i=0;i<sprites.length;i++) {
				sprite=sprites[i];
				if (!sprite.disabled) {
					drawSprite=1;
					if (sprite.invulnerabilityTimer)
						switch (sprite.invulnerabilityEffect) {
							case 1:{ // Blinking
								drawSprite=sprite.invulnerabilityTimer%2;
								break;
							}
						}
					if (drawSprite) {
						dx=Math.floor(areax+sprite.x-cameraX);
						dy=Math.floor(areay+sprite.y-cameraY);
						if (rumbleTimer)
							switch (rumbleMode) {
								case 0:{ 
									// screen shake
									if (rx==undefined) {
										rx=Math.floor(Math.random()*rumbleIntensity*2)-rumbleIntensity;
										ry=Math.floor(Math.random()*rumbleIntensity*2)-rumbleIntensity;
									}
									dx+=rx;
									dy+=ry;								
									break;
								}
								case 1:{
									// Per-sprite shake
									dx+=Math.floor(Math.random()*rumbleIntensity*2)-rumbleIntensity;
									dy+=Math.floor(Math.random()*rumbleIntensity*2)-rumbleIntensity;
									break;
								}
								case 3:{
									// Wave - vertical
									dy+=Math.sin(rumbleTimer+dx)*rumbleIntensity;
									break;s
								}
								case 4:{
									// Wave - horizontal
									dx+=Math.sin(rumbleTimer+dy)*rumbleIntensity;
									break;s
								}					
							}
						G.screen.ctx.drawImage(G.gamesprites.cnv,sprite.tile*G.SHAPEGAP,0,G.SHAPESIZE,G.SHAPESIZE,dx,dy,sprite.width,sprite.height);
					}


					if (sprite._line) {
						G.screen.ctx.strokeStyle="#fff";
						G.screen.ctx.beginPath();
						G.screen.ctx.moveTo(Math.floor(sprite.x),Math.floor(sprite.y));
						G.screen.ctx.lineTo(Math.floor(sprite._line.x),Math.floor(sprite._line.y));
						G.screen.ctx.stroke();
						delete sprite._line;
					}
					if (sprite._log!=undefined) {
						G.screen.ctx.fillStyle="#fff";
						G.screen.ctx.fillText(sprite._log,Math.floor(sprite.x),Math.floor(sprite.y))	
						delete sprite._log;
					}
				}
			}

			// Sparks

			var spark,element,sides,hWidth,hHeight;

			for (var i=0;i<sparks.length;i++) {
				spark=sparks[i];
				element=G.elements[spark.elementId];
				dx=Math.floor(areax+spark.x-cameraX);
				dy=Math.floor(areay+spark.y-cameraY);
				hWidth=Math.floor(element.width/2);
				hHeight=Math.floor(element.height/2);
					
				switch (spark.type) {
					case 0:{
						// Spinning sprites						
						sides=(spark.args[0]+1)*2;
						ry=360/sides;
						for (var j=0;j<sides;j++) {
							rx=calculateVector((ry*j)+((spark.args[1]%2?-1:1)*spark.args[2]*spark.prc*30),G.shortSide*spark.prc);
							switch (spark.args[3]) {
								case 0:{
									// ... sprites
									spark.blink=!spark.blink;
									if (spark.blink)
										G.screen.ctx.drawImage(
											G.gamesprites.cnv,
											element.tile*G.SHAPEGAP,0,
											G.SHAPESIZE,G.SHAPESIZE,
											Math.floor(dx-rx.x),Math.floor(dy-rx.y),
											element.width,element.height
										);
									break;
								}
								case 1:{
									// ... dots
									G.screen.ctx.beginPath();
								    G.screen.ctx.arc(dx-rx.x+hWidth, dy-rx.y+hHeight, spark.args[4]+1, 0, 2 * Math.PI, false);
								    G.screen.ctx.fillStyle = MT.getHtmlColor(G.palette.colors[spark.colors[0][G.timer%2]]);
								    G.screen.ctx.fill();
									break;
								}
								case 2:{
									// ... labels										
									MT.print(
										G,
										G.fonts.ui,
										spark.colors[G.timer%2],
										dx-rx.x,dy-rx.y,
										spark.label,
										2,0,
										G.spacings.ui,
										G.effects.ui
									);
									break;
								}
								case 3:{
									// ... lines
									G.screen.ctx.strokeStyle= MT.getHtmlColor(G.palette.colors[spark.colors[0][G.timer%2]]);
									G.screen.ctx.beginPath();
									G.screen.ctx.moveTo(Math.floor(dx-rx.x+hWidth), Math.floor(dy-rx.y+hHeight));
									G.screen.ctx.lineTo(Math.floor(dx+hWidth),Math.floor(dy+hHeight));
									G.screen.ctx.stroke();
									break;
								}
							}
							
						}
						break;
					}
					case 1:{
						// Explosion of...
						if (!spark.data) {
							spark.data=[];
							for (var j=0;j<(spark.args[2]+1)*5;j++)
								spark.data.push({angle:Math.random()*360,length:Math.random()*G.shortSide*2,size:spark.args[j%2]%2});
						}
						for (var j=0;j<spark.data.length;j++) {
							rx=calculateVector(spark.data[j].angle+((spark.args[3]%2?-1:1)*spark.args[4]*spark.prc*30),spark.data[j].length*spark.prc);
							switch (spark.args[5]) {
								case 3:
								case 0:{
									// ... dots
									G.screen.ctx.beginPath();
								    G.screen.ctx.arc(Math.floor(dx-rx.x+hWidth), Math.floor(dy-rx.y+hHeight), 1+spark.data[j].size, 0, 2 * Math.PI, false);
								    G.screen.ctx.fillStyle = MT.getHtmlColor(G.palette.colors[spark.colors[0][G.timer%2]]);
								    G.screen.ctx.fill();
									break;
								}
								case 1:{
									// ... lines
									G.screen.ctx.strokeStyle= MT.getHtmlColor(G.palette.colors[spark.colors[0][G.timer%2]]);
									G.screen.ctx.beginPath();
									G.screen.ctx.moveTo(Math.floor(dx-rx.x+hWidth), Math.floor(dy-rx.y+hHeight));
									G.screen.ctx.lineTo(Math.floor(dx+hWidth),Math.floor(dy+hHeight));
									G.screen.ctx.stroke();
									break;
								}
								case 2:{
									// ... labels										
									MT.print(
										G,
										G.fonts.ui,
										spark.colors[G.timer%2],
										dx-rx.x,dy-rx.y,
										spark.label,
										2,0,
										G.spacings.ui,
										G.effects.ui
									);
									break;
								}
							}
						}
						break;
					}
					case 2:{
						// Popup labels
						rx=calculateVector(spark.args[0]*90,G.shortSide*spark.prc);
						MT.print(
							G,
							G.fonts.ui,
							spark.colors[G.timer%2],
							dx-rx.x,dy-rx.y,
							spark.label,
							2,0,
							G.spacings.ui,
							G.effects.ui
						);
						break;
					}
				}
			}

		}

		function runUi() {
			if (G.hudColor) {
				G.screen.ctx.fillStyle=MT.getHtmlColor(G.hudColor);
				G.screen.ctx.fillRect(0,0,G.screenWidth,G.gameAreaY);
				G.screen.ctx.fillRect(0,0,G.gameAreaX,G.screenHeight);
				G.screen.ctx.fillRect(G.gameAreaX+G.gameAreaWidth,0,G.screenWidth-G.gameAreaX+G.gameAreaWidth,G.screenHeight);
				G.screen.ctx.fillRect(0,G.gameAreaY+G.gameAreaHeight,G.screenWidth,G.screenHeight-G.gameAreaY+G.gameAreaHeight);
			}
			drawBgImage(G.hudOverlay);
			for (var a in G.counters) {
				MT.print(
					G,
					G.fonts.ui,
					G.colors.ui,
					G.counters[a].x,
					G.counters[a].y,
					G.counters[a].label,
					G.counters[a].alignment,
					G.counters[a].orientation,
					G.spacings.ui,
					G.effects.ui
				);
				if (G.counters[a].gauge) {
					if (G.counters[a].gaugeCounter) {
						gaugeSolid=G.counters[a].amount;
						gaugePart=0;
						gaugeLength=gaugeSolid*G.SHAPESIZE;
					} else {
						gaugePercent=(G.counters[a].amount/G.counters[a].higherLimit);
						if (gaugePercent<0) gaugePercent=0;
						if (gaugePercent>1) gaugePercent=1;

						gaugeLength=Math.floor(G.counters[a].valueSize*gaugePercent);
						gaugeSolid=Math.floor(gaugeLength/G.SHAPESIZE);
						gaugePart=gaugeLength-(gaugeSolid*G.SHAPESIZE);								
					}
					gaugeX=G.counters[a].valueX;
					gaugeY=G.counters[a].valueY;
					switch (G.counters[a].orientation) {
						case 0:{
							if (G.counters[a].alignment)
								gaugeX-=gaugeLength;
							for (var i=0;i<gaugeSolid;i++)
								G.screen.ctx.drawImage(
									G.counters[a].gauges.cnv,
									G.counters[a].gaugeId*G.SHAPEGAP,0,
									G.SHAPESIZE,G.SHAPESIZE,
									gaugeX+(i*G.SHAPESIZE),gaugeY,
									G.SHAPESIZE,G.SHAPESIZE
								);
							if (gaugePart)
								G.screen.ctx.drawImage(
									G.counters[a].gauges.cnv,
									G.counters[a].gaugeId*G.SHAPEGAP,0,
									gaugePart,G.SHAPESIZE,
									gaugeX+(i*G.SHAPESIZE),gaugeY,
									gaugePart,G.SHAPESIZE
								);
							break;
						}
						case 1:{
							if (G.counters[a].alignment)
								gaugeY-=gaugeLength;
							for (var i=0;i<gaugeSolid;i++)
								MT.rotatedDrawImage(G.screen.ctx,
									G.counters[a].gauges.cnv,
									G.counters[a].gaugeId*G.SHAPEGAP,0,
									G.SHAPESIZE,G.SHAPESIZE,
									gaugeX,gaugeY+(i*G.SHAPESIZE),
									G.SHAPESIZE,G.SHAPESIZE,
									G.counters[a].gaugeRotation
								);
							if (gaugePart)
								MT.rotatedDrawImage(G.screen.ctx,
									G.counters[a].gauges.cnv,
									G.counters[a].gaugeId*G.SHAPEGAP,0,
									G.SHAPESIZE,G.SHAPESIZE,
									gaugeX,gaugeY+(i*G.SHAPESIZE),
									gaugePart,G.SHAPESIZE,
									G.counters[a].gaugeRotation
								);
							break;
						}
					}
				} else
					MT.print(
						G,
						G.fonts.digits,
						G.colors.digits,
						G.counters[a].valueX,
						G.counters[a].valueY,
						MT.convertToBase(Math.floor(G.counters[a].amount/G.counters[a].unitAmount),G.numbersBase),
						G.counters[a].alignment,
						G.counters[a].orientation,
						G.spacings.ui,
						G.effects.digits
					);
			}
		}

		function resetCamera() {
			cameraX=0;
			cameraY=0;
		}

		function setCameraOn(sprite) {
			cameraX=MT.limit(sprite.x-G.cameraGapX,G.cameraLeft,G.cameraRight);
			cameraY=MT.limit(sprite.y-G.cameraGapY,G.cameraTop,G.cameraBottom);
		}

		function rumble(G,id) {
			if ((id!==undefined)&&G.rumbles[id]) {
				rumbleTimer=G.rumbles[id].duration;
				rumbleMode=G.rumbles[id].mode;
				rumbleIntensity=G.rumbles[id].intensity;
				rumbleColors=G.rumbles[id].colors;
			}
		}

		// --- RUN		

		G.timer=0;
		gotoState(G.STATES.BOOT);

		var alive,rumbleTimer=0,rumbleMode=0,rumbleIntensity=0;
		var sprite,spritesToProcess,allCollisions;
		var level,currentLevel;
		var gaugeX,gaugeY,gaugeLength,gaugeSolid,gaugePart,gaugePercent,spritesIndex={};
		var drawSprite,stateTimer,cameraX,cameraY,endingScreen;

		var focusTimeout=setTimeout(function(){
			G.screen.cnv.focus();
		},100);

		var interval=setInterval(function(){

			if (doResize) {
				resize();
				doResize--;
			}

			for (var a in G.KEYS)
				if (rawKeyboard[G.KEYS[a]])
					keyboard[a]++;
				else
					keyboard[a]=0;

			alive=[];
			G.timer=(G.timer+1)%60;

			MT.clearCanvas(G.screen);

			if (loadingTimer) loadingTimer--;
			else {

				// STATES

				if (rumbleTimer) rumbleTimer--;

				stateTimer++;
				switch (state) {
					case G.STATES.BOOT:{
						gotoNextState("DONE");
						break;
					}
					case G.STATES.WARNING:{
						if (wallOfTextScreen(G.textScreens.warning)) gotoNextState("DONE");
						break;
					}
					case G.STATES.TITLESTART:{
						resetCamera();
						MT.playAudioSample(G,G.titleAudio);
						level=0;
						resetGame();
						switch (G.titleMode) {
							case 2:{
								loadLevel(G.attractModeLevel);
								break;
							}
						}
						gotoNextState("DONE");
						break;
					}
					case G.STATES.TITLE:{ // TITLE
						drawBgColor(G.titleBgColor);
						drawBgImage(G.titleImage);
						switch (G.titleMode) {
							case 2:{
								runSprites(true,G.screenWidth,G.screenHeight);
								renderSprites(0,0);
								break;
							}
						}						
						for (var i=0;i<G.titleLayout.length;i++)
							if (G.titleLayout[i].font)
								MT.print(
									G,
									G.fonts[G.titleLayout[i].font],
									G.colors[G.titleLayout[i].label],
									G.hScreenWidth,
									G.titleLayout[i].y,
									G.labels[G.titleLayout[i].label],
									2,0,
									G.spacings[G.titleLayout[i].spacing],
									G.effects[G.titleLayout[i].label]
								);
						if (keyboard.A==1)
							gotoNextState("DONE");
						break;
					}
					case G.STATES.GAMESTART:{
						gotoNextState("DONE");
						break;
					}
					case G.STATES.STAGESTART:{
						gotoNextState("DONE");
						break;
					}
					case G.STATES.STAGETITLE:{
						if (wallOfTextScreen(G.textScreens.stagetitle,G.levels[level].stageTitle)) gotoNextState("DONE");
						break;
					}
					case G.STATES.PREPARESTAGE:{ // PREPARE STAGE
						resetGame();
						currentLevel=G.levels[level];
						loadLevel(currentLevel);
						gotoNextState("DONE");
						break;
					}
					case G.STATES.SPAWNPLAYER:{ // SPAWN PLAYER
						runSprites();
						setCameraOn(currentLevel.spawn);						
						renderSprites();
						runUi();						
						if (!G.delays[state]||wallOfTextScreen(G.textScreens.getready,G.labels.getready)) {							
							addSprite(sprites,G.playerElement,currentLevel.spawn.x,currentLevel.spawn.y,true);				
							gotoNextState("DONE");
						}
						break;
					}
					case G.STATES.GAMERUNNING:{ 												
						runSprites();							
						renderSprites();
						runUi();
						if (spritesIndex[G.playerElement].length) {
							setCameraOn(spritesIndex[G.playerElement][spritesIndex[G.playerElement].length-1]);
							// Realtime conditions
							// Times
							if (!G.timeFollowPlayer||G.time[timeId].runPlayer)
								if (G.counters.time) setCounter("time",G.counters.time.amount-1);
							// Elements count change
							for (var i=0;i<G.conditions.length;i++) {
								if (G.conditions[i].if.when=="count")
									if (spritesIndex[G.conditions[i].if.of].length==G.conditions[i].if.is)
										runThen(G.conditions[i]);							
							}
						} else gotoNextState("LIFELOST");
						break;
					}
					case G.STATES.LIFELOST:{
						runSprites();
						renderSprites();
						runUi();
						for (var i=0;i<sprites.length;i++)
							if (sprites[i].element==G.playerElement) sprites[i].alive=0;
						setCounter("lives",G.counters.lives.amount-1);
						if (G.counters.lives.amount) gotoNextState("LIVES");
						else gotoNextState("NOLIVES");
						break;
					}
					case G.STATES.STAGECLEAR:{
						level++;
						if (G.levels[level]) gotoNextState("NEXTSTAGE");
						else gotoNextState("GAMECLEAR");
						break;
					}
					case G.STATES.GAMEOVERSTART:{
						gotoNextState("DONE");
						break;
					}
					case G.STATES.GAMEOVER:{
						if (wallOfTextScreen(G.textScreens.gameover,G.labels.gameover)) gotoNextState("DONE");
						break;
					}
					case G.STATES.ENDINGSTART:{
						endingScreen=0;
						gotoNextState("DONE");
						break;
					}
					case G.STATES.ENDING:{
						if (G.ending[endingScreen]) {							
							if (wallOfTextScreen(G.ending[endingScreen])) {
								endingScreen++;
								gotoNextState("NEXT");								
							}	
						} else gotoNextState("DONE");
						break;
					}
				}
			}

		},_mspf);

		return {
			stop:function() {
				clearInterval(interval);
				clearInterval(focusTimeout);
				G.screen.cnv.blur();
				MT.removeEventListener(window,"resize",askResize);
				MT.stopAudio();
				CFG.parent.removeChild(G.screen.cnv);
				for (var a in G) delete G[a];
			}
		}

	}
});