class NeuralNet {
    constructor() {
        this.nplayer = 12;
        this.input_n = 4;
        this.output_n = 3;

        this.gameCanvas = document.getElementById('game');
        this.game = new TRexGame(this.gameCanvas, this.nplayer);

        this.weight = [];
        for (let p = 0; p < this.nplayer; p++) {
            this.weight.push([]);
            for (let i = 0; i < this.input_n; i++) {
                this.weight[p].push([]);
                for (let j = 0; j < this.output_n; j++) {
                	console.log(getRandomFloat(0, 13),p,i,j);
                	console.log(this.weight);
                	this.weight[p][i].push(getRandomFloat(0, 13));
                }
            }
        }
        console.log(this.weight);

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
                    act[i] += input[j] * w[p][j][i];
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

    //mom[4][3], dad[4][3]
    makeChild(mom, dad) {
        let where;
        for (let p = 0; p < this.nplayer; p++) {
            for (let i = 0; i < this.output_n; i++) {
                for (let j = 0; j < this.input_n; j++) {
                    console.log(this.weight[p][j][i]);
                    this.weight[p][j][i] = getRandomFloat(mom[j][i], dad[j][i]);
                }
            }
        }
    }
}


let NN = new NeuralNet();

//주기적으로 행동
setInterval(function() {
    let info = NN.game.Info();
    let info_array = [info.distance, info.width, info.height, info.position];
    NN.makeChild(NN.weight[0], NN.weight[0]);
    let action = NN.nextAction(info_array, NN.weight, NN.bias);
    //console.log(action);

    //[점프, 가만히, 수구리]
    for (let p = 0; p < NN.nplayer; p++) {
        let now = action[p];
        let max = 0;
        let nextAct = -1;
        for (let i = 0; i < NN.output_n; i++) {
            if (now[i] > max) {
                max = now[i];
                nextAct = i;
            }
        }

        switch (nextAct) {
            case 0:
                NN.game.players[p].jump();
                break;
            case 1:
                NN.game.players[p].endDuck();
                break;
            case 2:
                NN.game.players[p].startDuck();
                break;
            default:
                console.log("error chosing action");
        }
    }


   let f = [];
   let selected = [];
   if(NN.game.gameover){
      console.log("gameover");
      let SumOfFitness = 0;
      let maxScore = 0, maxIdx = 0, minScore = 9999, minIdx = 0;
      for(let i = 0; i < NN.game.scores.length; ++i){
         let score = NN.game.scores[i];
         if(maxScore < score){
            maxScore = score;
            maxIdx = i;
         }
         if(minScore > score){
            minScore = scores;
            minIdx = i;
         }
         SumOfFitness += score;
      }
      
      for(let i = 0; i < NN.game.scores.length; ++i)
         f[i] = (maxscore - NN.game.scores[i]) + (maxScore - minScore)/3;
      
      let point = getRandomInt(0, SumOfFitness);
      let sum = 0;
      for(let i = 0; i < NN.game.scores.length; ++i){
         sum += f[i];
         if(point < sum){
            selected.push(NN.game.players[i]);
            selected.push(NN.game.players[i+1]);
            break;
         }
      }
  	}
}, 100)