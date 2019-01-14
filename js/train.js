class NeuralNet {
    constructor() {
        this.nplayer = 12;
        this.input_n = 4;
        this.output_n = 3;

        this.gameCanvas = document.getElementById('game');
        this.game = new TRexGame(this.gameCanvas, this.nplayer);

        this.weight = [
            [
                [1, 0, 1],
                [1, 0, 1],
                [1, 0, 1],
                [1, 0, 1]
            ]
        ];
        this.bias = [
            [1, 1, 1]
        ];
    }

    //input[4] * w[nplayer][4][3] + b[nplayer][3] = action[nplayer][3]
    //0넣은 부분은 p들어가야되는 부분
    nextAction(input, w, b) {
        let ret = [];
        for (let p = 0; p < this.nplayer; p++) {
            let sum = 0;
            let act = []
            act = [0, 0, 0];

            for (let i = 0; i < this.output_n; i++) {
                //input[nplayer][4]
                for (let j = 0; j < this.input_n; j++) {
                    act[i] += input[j] * w[0][j][i];
                }
                act[i] += b[0][i];
                sum += act[i];
            }


            for (let i = 0; i < this.output_n; i++) {
                act[i] = act[i] / sum;
            }
            ret[p] = act;
        }

        return ret;
    }
}


let NN = new NeuralNet();

//주기적으로 행동
setInterval(function() {
    let info = NN.game.Info();
    let info_array = [info.distance, info.width, info.height, info.position];
    let action = NN.nextAction(info_array, NN.weight, NN.bias);
    //console.log(action);

    //[점프, 가만히, 수구리]
    for(let p=0;p<NN.nplayer;p++){
    	let now = action[p];
    	let max = 0;
    	let nextAct = -1;
    	for(let i=0;i<NN.output_n;i++){
    		if(now[i] > max){
    			max = now[i];
    			nextAct = i;
    		}
    	}

    	switch(nextAct){
    		case 0: NN.game.players[p].jump(); break;
    		case 1: NN.game.players[p].endDuck(); break;
    		case 2: NN.game.players[p].startDuck(); break;
    		default: console.log("error chosing action");
    	}
    }
}, 100)