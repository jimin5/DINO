class NeuralNet {
    constructor() {
    	this.nplayer = 12;
        this.gameCanvas = document.getElementById('game');
        this.game = new TRexGame(this.gameCanvas, this.nplayer);
    	console.log(this.game.Info())
    	setInterval(function(){
    		console.log(NN.game.Info());
    	},100)
    }
}


let NN = new NeuralNet();