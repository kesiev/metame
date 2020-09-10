// TODO Dungeon generators? Improving map generation?
// TODO Conditions for gaining health?
// TODO More conditions? (i.e. kill X entities, etc.)
// TODO More explosion shapes? (i.e. vector shapes etc.)
// TODO Jump only when touching ground?

(function(D,W){
	var G,MT,_NP=360,_phi = Math.PI * 2 / _NP,_DEGTORAD=3.14/180;
	var isFirefox=navigator.userAgent.toLowerCase().indexOf("firefox") > -1;

	function loadConcepts(cb) {
		if (MT.CONCEPTS) cb();
		else {
			// Sort designers
			MT.designers.sort(function(a,b){
				return a.id==b.id?0:a.id>b.id?1:-1;
			});

			// Load concepts
			var img=document.createElement("img");
			img.style.visibility="hidden";
			img.style.position="absolute";
			img.style.top="-10000px";
			img.src="concepts.png";
			img.onload=function() {
				MT.CONCEPTS={};
				var hasPixel,index,concept,pixelrow;			
				var sprites=MT.newCanvas(img.width,img.height);
				sprites.ctx.drawImage(img,0,0);
				var spritesdata=sprites.getData();

				for (var r=0;r<sprites.height/MT.C.SHAPESIZE;r++)
					if (MT.CONCEPTIDS[r]) {
						MT.CONCEPTS[MT.CONCEPTIDS[r]]=[];
						for (var c=0;c<sprites.width/MT.C.SHAPESIZE;c++) {
							concept=[];
							hasPixel=false;
							for (var y=0;y<MT.C.SHAPESIZE;y++) {
								pixelrow=[];
								concept.push(pixelrow);
								for (var x=0;x<MT.C.SHAPESIZE;x++) {
									index=((c*MT.C.SHAPESIZE)+x+(((r*MT.C.SHAPESIZE)+y)*sprites.width))*4;						
									if (spritesdata.data[index+3]) {
										hasPixel=true;
										pixelrow.push(spritesdata.data[index]?1:2);
									} else pixelrow.push(0);
								}
							}
							if (!c||hasPixel) MT.CONCEPTS[MT.CONCEPTIDS[r]].push(concept);
							else break;
						}
					} else break;

				D.body.removeChild(img);
				cb();
			}
			D.body.appendChild(img);
		}
	}

	var audioContext=audioOut=0;
	if (window.AudioContext)
		audioContext=new window.AudioContext();
	else if (window.webkitAudioContext)
		audioContext=new window.webkitAudioContext();
	if (audioContext) {
		audioOut=audioContext.createGain();
		audioOut.connect(audioContext.destination);
		audioOut.gain.value=0.9;
	}

	W.METAME=MT={
		CONCEPTIDS:["ALPHABET","SOLID","HAZARD","ENTITY","GAUGE","BORDERCORNER","BORDERLINE"],
		C:{
			HSHAPESIZE:4,
			SHAPESIZE:8,			
			SHAPEGAP:12,
			GAUGES:1,
			GAUGESPERGAME:3,
			TRANSPARENTCOLOR:[0,0,0,0]			
		},
		designers:[],
		engine:0,

		// --- AUDIO UTILS
		audioSamples:{},
		audioPlaying:{},
		audioContext:audioContext,
		addAudioSample:function(id,data) { this.audioSamples[id]=data; },
		playAudioSample:function(G,id) {
			if (!G.disableAudio&&audioContext&&id&&this.audioSamples[id]) {
				var source = audioContext.createBufferSource();
				if (this.audioPlaying[id]) this.audioPlaying[id].stop();
			  	source.buffer = this.audioSamples[id];
			  	source.connect(audioOut);
				source.start(0);
				this.audioPlaying[id]=source;
			}
		},
		stopAudio:function() {
			for (var id in this.audioPlaying)
				this.audioPlaying[id].stop();
		},

		// --- DOM UTILS

		addEventListener:function(node,evt,cb,rt) {
			if (node.addEventListener) node.addEventListener(evt,cb,rt);
			else node.attachEvent("on"+evt,cb)
		},
		removeEventListener:function(node,evt,cb,rt) {
			if (node.removeEventListener) node.removeEventListener(evt,cb,rt);
			else node.detachEvent("on"+evt,cb)
		},

		// --- COLOR UTILS
		getHtmlColor:function(color) {
			return "rgba("+color[0]+","+color[1]+","+color[2]+","+color[3]+")";
		},

		// --- MATH UTILS
		superFormula:function(m,n1,n2,n3,a,b) {
			var point,points = [];
			var r, t1, t2, a, b2,x,y;
			for (var i = 0; i <= _NP; i++) {
				phi=_phi*i;
				point={};
				t1 = Math.cos(m * phi / 4) / a;
				t1 = Math.abs(t1);
				t1 = Math.pow(t1, n2);
				t2 = Math.sin(m * phi / 4) / b;
				t2 = Math.abs(t2);
				t2 = Math.pow(t2, n3);
				r = Math.pow(t1 + t2, 1 / n1);
				if (Math.abs(r) === 0) {
					point.x = 0;
					point.y = 0;
				} else {
					r = 1 / r;
					point.x = r * Math.cos(phi);
					point.y = r * Math.sin(phi);
				}
				points.push(point);
			}
			return points;
		},
		limit(val,min,max) { return val<min?min:val>max?max:val; },
		convertToBase(number,base) {
			var out=[];
			while (number>base) {
				out.unshift(number%base);
				number=Math.floor(number/base)
			}
			out.unshift(number);
			return out;
		},

		// --- LIST UTILS
		clone:function(obj) { return JSON.parse(JSON.stringify(obj))},
		makeSequence:function(limit) {
			var numbers=[];
			for (var i=0;i<limit;i++) numbers.push(i);
			return numbers;
		},
		makeFlags:function(list) {
			var out={};
			for (var a=0;a<list.length;a++) out[list[a]]=1;
			return out;
		},
		getKeys:function(obj) {
			var out=[];
			for (var a in obj) out.push(a)
			return out;
		},

		// --- RANDOM UTILS
		random:function(G,max) {
			G.seed = (G.seed * 9301 + 49297) % 233280;
			return Math.floor( G.seed / 233280 *max);
		},
		randomInRange:function(G,start,end) { return start+MT.random(G,end-start+1) },
		randomly:function(G) { return !MT.randomInRange(G,0,1) },
		rarely:function(G) { return !MT.randomInRange(G,0,2) },
		veryRarely:function(G) { return !MT.randomInRange(G,0,16) },
		randomIndex:function(G,list) { return list.length?MT.randomInRange(G,0,list.length-1):0; },
		randomElement:function(G,list) { return list[MT.randomIndex(G,list)]},
		randomLetter:function(G,list) { return list[MT.randomInRange(G,1,list.length-2)] }, // index 0 is space
		randomNumbers:function(G,limit,start,end) {
			var out=[];
			for (var i=0;i<limit;i++)
				out.push(MT.randomInRange(G,start,end));
			return out;
		},
		randomDraw:function(G,list) {
			if (list.length) {
				var id=MT.randomIndex(G,list);
				return list.splice(id,1)[0];
			} else return 0;
		},
		randomShuffle:function(G,list) {
			var p1,p2,swp;
			for (var i=0;i<list.length*2;i++) {
				p1=MT.randomIndex(G,list);
				p2=MT.randomIndex(G,list);
				swp=list[p1];
				list[p1]=list[p2];
				list[p2]=swp;
			}
			return list;
		},
		randomSentence:function(G,list,count) {
			var out=[];
			if (count) {
				for (var i=0;i<count;i++)
					out.push(MT.randomElement(G,list));
				out[0]=MT.randomLetter(G,list);
				out[count-1]=MT.randomLetter(G,list);
			}
			return out;	
		},
		randomSubsequence(G,list,count) {
			var out=[],seq=MT.makeSequence(list.length);
			for (var i=0;i<count;i++) {
				out.push(list[seq.splice(MT.randomIndex(G,seq),1)[0]]);
				if (!seq.length) break;
			}
			return out;
		},
		randomSubsequences:function(G,list,itemscount,subsequences) {
			var element,id,idx={},out=[];
			while (out.length<subsequences) {
				element=MT.randomSubsequence(G,list,itemscount).sort();
				id=element.join("-");
				if (!idx[id]) {
					out.push(element);
					idx[id]=1;
				}
			}
			return out;			
		},

		// --- CONCEPT UTILS
		blitConcept:function(img,data,concept,dx,dy,bgcolor,color1,color2,invert,scalex,scaley) {
			if (!scalex) scalex=1;
			if (!scaley) scaley=1;
			if (invert) {
				var tmp=color1;
				color1=color2;
				color2=tmp;
			}
			var index,color;
			for (var y=0;y<concept.length;y++)
				for (var x=0;x<concept[y].length;x++)
					for (var sx=0;sx<scalex;sx++)
						for (var sy=0;sy<scaley;sy++) {
							switch (concept[y][x]) {
								case 0: { color=bgcolor; break; }
								case 1: { color=color1; break; }
								case 2: { color=color2; break; }
							}
							if (color) {
								index=(
									(x*scalex)+sx+dx+
									(((y*scaley)+sy+dy)*img.width)
								)*4;
								data.data[index] = color[0];
								data.data[index + 1] = color[1];
								data.data[index + 2] = color[2];
								data.data[index + 3] = color[3];
							}
						}
		},

		// --- GRAPHIC UTILS
		clearCanvas:function(canvas) {
			canvas.cnv.width=canvas.width;
			canvas.ctx.webkitImageSmoothingEnabled = canvas.ctx.imageSmoothingEnabled = canvas.ctx.mozImageSmoothingEnabled = canvas.ctx.oImageSmoothingEnabled = canvas.ctx.msImageSmoothingEnabled= false;		
		},
		newCanvas:function(width,height) {
			var canvas=document.createElement("canvas");
			//canvas.style.border="1px solid #f00";
			//document.body.appendChild(canvas);
			if (isFirefox)
				canvas.style.imageRendering="-moz-crisp-edges";
			else {
				canvas.style.imageRendering="pixelated";
				canvas.style.fontSmoothing="none";
			}
			canvas.width=width;
			canvas.height=height;
			return {
				cnv:canvas,
				ctx:canvas.getContext("2d"),
				width:width,
				height:height,
				getData:function(){
					return this.ctx.getImageData(0,0,this.cnv.width, this.cnv.height)
				},
				putData:function(data){
					this.ctx.putImageData(data,0,0);
				}
			}
		},
		makeFont:function(G,palette,alphabet,scalex,scaley,conceptrow) {
			var index,concept,color;
			if (!conceptrow) conceptrow="ALPHABET";
			var image=MT.newCanvas(G.SHAPEGAP*alphabet.length*scalex,G.SHAPEGAP*palette.colors.length*scaley);
			var data=image.getData();
			for (var l=0;l<alphabet.length;l++)
				for (var s=0;s<alphabet[l].length;s++)
					for (var c=0;c<palette.colors.length;c++)
						MT.blitConcept(
							image,
							data,
							MT.CONCEPTS[conceptrow][alphabet[l][s]],
							(l*G.SHAPEGAP)*scalex,
							(c*G.SHAPEGAP)*scaley,
							0,
							G.TRANSPARENTCOLOR,
							palette.colors[c],
							false,
							scalex,scaley
						)
			image.putData(data);
			return {lw:G.SHAPESIZE*scalex,lh:G.SHAPESIZE*scaley,lgw:G.SHAPEGAP*scalex,lgh:G.SHAPEGAP*scaley,img:image};
		},
		blitShape:function(cnv,x,y,size,color,shape) {
			cnv.ctx.fillStyle=MT.getHtmlColor(color);
			cnv.ctx.beginPath();
			cnv.ctx.moveTo(Math.floor((shape[0].x*size)+x),Math.floor((shape[0].y*size)+y));
			for (var j=1;j<shape.length;j++)
				cnv.ctx.lineTo(Math.floor((shape[j].x*size)+x),Math.floor((shape[j].y*size)+y));
			cnv.ctx.fill();
		},
		print:function(G,font,colors,x,y,word,alignment,orientation,spacing,effect,color) {
			if (effect&&effect.id) {
				switch (effect.id) {
					case 10:{ // BLINKING
						MT.print(
							G,font,0,x,y,word,alignment,orientation,spacing,0,colors[(Math.floor((G.timer/effect.args[0])%colors.length)||0)]);
						break;
					}
					case 11:{ // ROTATING
						MT.print(
							G,
							font,
							0,
							x+((Math.sin(G.timer/effect.args[0]))*effect.args[1]),
							y+((Math.cos(G.timer/effect.args[2]))*effect.args[3]),
							word,alignment,orientation,spacing,0,colors[0]);
						break;
					}
					case 12:{ // OUTLINE/BOLD
						for (var i=1;i<effect.args[0]+1;i++) {
							MT.print(G,font,0,x-i,y,word,alignment,orientation,spacing,0,colors[1]);
							MT.print(G,font,0,x+i,y,word,alignment,orientation,spacing,0,colors[1]);
							MT.print(G,font,0,x,y-i,word,alignment,orientation,spacing,0,colors[1]);
							MT.print(G,font,0,x,y+i,word,alignment,orientation,spacing,0,colors[1]);
						}
						MT.print(G,font,0,x,y,word,alignment,orientation,spacing,0,colors[0]);
						break;
					}
					default:{ // SHADOWS
						if (effect.id<10) {
							var effectid=effect.id-1;
							var dx=[-1,0,1][effectid%3];
							var dy=[-1,0,1][Math.floor(effectid/3)];
							MT.print(G,font,0,x,y,word,alignment,orientation,spacing,0,colors[1]);
							MT.print(G,font,0,x+(effect.args[0]*dx),y+(effect.args[0]*dy),word,alignment,orientation,spacing,0,colors[0]);
						}						
					}
				}
			} else {
				if (colors) color=colors[0];
				if (orientation) {
					var height=(font.lh+spacing)*word.length;
					switch (alignment) {
						case 1:{
							y-=height;
							break;
						}
						case 2:{
							y-=height/2;
							break;
						}
					}
					for (var i=0;i<word.length;i++) {
						//G.screen.ctx.fillStyle="#f00";
						//G.screen.ctx.fillRect(Math.floor(x),Math.floor(y+((font.lh+spacing)*i)),font.lw,font.lh);

						G.screen.ctx.drawImage(font.img.cnv,word[i]*font.lgw,color*font.lgh,font.lw,font.lh,Math.floor(x),Math.floor(y+((font.lh+spacing)*i)),font.lw,font.lh);
					}
				} else {
					var width=(font.lw+spacing)*word.length;
					switch (alignment) {
						case 1:{
							x-=width;
							break;
						}
						case 2:{
							x-=width/2;
							break;
						}
					}
					for (var i=0;i<word.length;i++) {
						//G.screen.ctx.fillStyle="#f00";
						//G.screen.ctx.fillRect(Math.floor(x+((font.lw+spacing)*i)),Math.floor(y),font.lw,font.lh);
						G.screen.ctx.drawImage(font.img.cnv,word[i]*font.lgw,color*font.lgh,font.lw,font.lh,Math.floor(x+((font.lw+spacing)*i)),Math.floor(y),font.lw,font.lh);				
					}
					
				}
			}
		},
		rotatedDrawImage:function(ctx,image,x1,y1,w1,h1,x2,y2,w2,h2,angle,sx,sy) {
			var hx=w1/2,hy=h1/2;
			if (sx==undefined) sx=1;
			if (sy==undefined) sy=1;
			ctx.save();
			ctx.transform(sx,0,0,sy,x2+hx, y2+hy);
			ctx.rotate(angle*_DEGTORAD);
			ctx.translate(-hx,-hy);
			ctx.drawImage(image,x1,y1,w2,h2,0,0,w2,h2);
			ctx.restore();
		},

		// --- DESIGN PHASE
		addDesigner:function(designer) {
			MT.designers.push(designer)
		},
		setEngine:function(engine) {
			MT.engine=engine;
			engine.onSet(MT);
		},
		design:function(CFG,game){			
			if (!game) game={seed:0};
			var designer,run,todo={},working=true;
			for (var i=0;i<MT.designers.length;i++) todo[i]=1;
			for (var i in MT.C) game[i]=MT.clone(MT.C[i]);
			while (working) {
				working=false;
				for (var i in todo) {
					designer=MT.designers[i];
					run=true;
					for (var j=0;j<designer.needs.length;j++)
						if (game[designer.needs[j]]===undefined) {
							run=false;
							break;
						}
					if (run) {
						working=true;
						if (CFG.debug) console.log("Designing "+designer.id);
						delete todo[i];
						designer.decide(MT,game)
					}
				}
			}			
			for (var i in todo) {
				for (var j=0;j<MT.designers[i].needs.length;j++)
					if (game[MT.designers[i].needs[j]]===undefined)
						if (CFG.debug) console.warn("[Missing "+MT.designers[i].needs[j]+"] Can't design "+MT.designers[i].id);
			}
			if (CFG.debug) console.log("Design done!");
			return game;
		},
		run:function(CFG,onstart) {
			if (!CFG.romId) CFG.romId=Math.floor(Math.random()*1000000);
			console.log("romId: "+CFG.romId);
			loadConcepts(function(){
				var G=MT.design(CFG,{
					romId:CFG.romId,
					seed:CFG.romId,
					disableAudio:CFG.disableAudio
				});
				if (CFG.debug) console.log(G);
				var game=MT.engine.run(MT,G,CFG);
				if (onstart) onstart(G,game);
			})				
		}
	}
}(document,window))