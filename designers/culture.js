METAME.addDesigner({
	id:"culture",
	needs:[],
	MINLETTERSTROKES:6,
	MAXLETTERSTROKES:10,
	MINDIGITSTROKES:6,
	MAXDIGITSTROKES:10,
	decide:function(MT,G) {
		
		var letterStrokesCount=MT.randomInRange(G,this.MINLETTERSTROKES,this.MAXLETTERSTROKES);
		var letterStrokes=MT.randomSubsequence(G,MT.makeSequence(MT.CONCEPTS.ALPHABET.length),letterStrokesCount);
		var letterStrokesPerLetter=MT.randomInRange(G,3,letterStrokesCount-4);

		G.alphabet=MT.randomSubsequences(G,letterStrokes,letterStrokesPerLetter,letterStrokesPerLetter*3);
		G.alphabet[0]=[MT.randomIndex(G,MT.CONCEPTS.ALPHABET)]; // Space
		G.letters=MT.makeSequence(G.alphabet.length);

		// Culture - digits
		G.numbersBase=MT.randomInRange(G,2,20);
		var digitStrokesCount=MT.randomInRange(G,this.MINDIGITSTROKES,this.MAXDIGITSTROKES);
		var digitStrokes=MT.randomSubsequence(G,MT.makeSequence(MT.CONCEPTS.ALPHABET.length),digitStrokesCount);
		var digitStrokesPerLetter=MT.randomInRange(G,3,digitStrokesCount-4);
		G.digits=MT.randomSubsequences(G,digitStrokes,digitStrokesPerLetter,G.numbersBase);

	}
});