//get random int
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

//get random float
function getRandomFloat(min, max) {
    return Math.random() * (max - min + 1) + min;
}

//get ramdom element
function getRandomElement(array) {
    return array[getRandomInt(0, array.length - 1)];
}

//make rectangle
class Rect {
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

class GameObject {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.collisionRect = new Rect(); //충돌 rect를 담아줄 공간
    }
}

//게임 개체를 담는 틀
class Sprite extends GameObject {
    constructor(game, sourceImageRect) {
        super();
        this.game = game;
        this.imageRect = sourceImageRect;
    }

    render() {
        let { x, y, width, height } = this.imageRect;

        this.game.context.drawImage(this.game.image,
            x, y, width, height,
            this.x, this.y, width, height
        );
    }

    update(deltaTime) {

    }

    get width() {
        return this.imageRect.width;
    }

    get height() {
        return this.imageRect.height;
    }
}


class Animation extends Sprite {
    constructor(game, sourceImageRect, totalFrame, fps) {
        super(game, sourceImageRect);

        this.frames = [];
        this.currentFrame = 0;
        this.totalFrame = totalFrame;
        this.fps = fps;

        // 스프라이트 시트 상에서 항상 옆으로 이어져 있으니 야매로
        for (let i = 0; i < this.totalFrame; ++i) {
            this.frames[i] = new Rect(
                sourceImageRect.x + i * sourceImageRect.width,
                sourceImageRect.y,
                sourceImageRect.width,
                sourceImageRect.height
            );
        }

        this.imageRect = this.frames[0];
    }

    update(deltaTime) {
        this.currentFrame += deltaTime * this.fps;

        let frameToRender = Math.floor(this.currentFrame); //시간을 반내림해서 계산(배열에 넣기 때문)

        if (frameToRender >= this.totalFrame) {
            this.currentFrame = frameToRender = 0;
        }

        this.imageRect = this.frames[frameToRender];
    }
}


//천지창조
class Horizon {
    constructor(game) {
        this.game = game;
        this.clouds = [];
        this.obstacles = [];
        this.lastSpawnedObstacle = null;
        this.cloudSpawnTimer = 0;

        const { x, y, width, height } =
        TRexGame.spriteDefinition.HORIZON;

        this.sourceXPositions = [x, x + width];
        this.xPositions = [0, width];
        this.yPosition = this.game.canvas.height - height;

        this.addCloud();
        this.addObstacle();
    }

    collisionCheck(player, obstacle) {
        let p = player.collisionRect;
        let o = obstacle.collisionRect;


        if (p.x + p.width < o.x || p.x > o.x + o.width ||
            p.y + p.height < o.y || p.y > o.y + o.height) {
            return false;
        } else {
            return true;
        }
    }

    render() {
        // 수평선        
        let { x, y, width, height } = TRexGame.spriteDefinition.HORIZON;

        for (let i = 0; i < this.xPositions.length; ++i) {
            this.game.context.drawImage(this.game.image,
                this.sourceXPositions[i], y, width, height,
                this.xPositions[i], this.yPosition, width, height
            );
        }

        // 구름
        for (let c of this.clouds) {
            c.render();
        }

        // 장애물
        let cnt = 0;
        for (let o of this.obstacles) {
            for (let i = 0; i < this.game.players.length; i++) {
                if (this.game.players[i].isDead) continue;

                if (this.collisionCheck(this.game.players[i], o)) {
                    this.game.players[i].isDead = true;
                    this.game.scores[i] = cnt;
                }
            }
            o.render();
            cnt++;
        }
    }

    update(deltaTime) {
        // 수평선
        for (let i = 0; i < this.xPositions.length; ++i) {
            this.xPositions[i] -= this.game.speed * deltaTime;
            if (this.xPositions[i] <= -this.game.canvas.width) {
                this.xPositions[i] += this.game.canvas.width * 2;
            }
        }

        // 구름
        this.cloudSpawnTimer += deltaTime;

        if (this.cloudSpawnTimer > TRexGame.config.CLOUD_SPAWN_DURATION) {
            this.cloudSpawnTimer = 0;
            this.addCloud();
        }

        for (let c of this.clouds) {
            c.update(deltaTime);
        }

        this.clouds = this.clouds.filter(function(c) {
            return c.x > -c.width;
        });

        // 장애물
        if (this.game.canvas.width -
            this.lastSpawnedObstacle.x >
            this.lastSpawnedObstacle.gap) {
            this.addObstacle();
        }

        for (let o of this.obstacles) {
            o.update(deltaTime);
        }
    }

    addCloud() {
        const c = new Cloud(this.game);
        this.clouds.push(c);

        c.x = 600;
        c.y = Math.random() * 30 + 30;
    }

    addObstacle() {
        const typeObject = getRandomElement(TRexGame.obstacleTypes); //배열에서 랜덤으로 장애물 하나를 가져옴

        if (this.lastSpawnedObstacle != null &&
            typeObject.type === this.lastSpawnedObstacle.typeObject.type) {
            this.addObstacle();
        } else {
            if (this.lastSpawnedObstacle != null) {
                this.lastSpawnedObstacle.nextObstacleCreated = true;
            }

            const o = new Obstacle(this.game, typeObject);

            this.obstacles.push(o);
            this.lastSpawnedObstacle = o;
        }
    }

    //추가된 함수
    getObstacle() {
        for (let o of this.obstacles) {
            if (o.x >= 40) {
                return o;
            }
        }
        return this.obstacles[0];
    }
}

//장애물을 정의하고 생성하는 클래스
class Obstacle extends GameObject {
    constructor(game, typeObject) {
        super();
        this.game = game;
        this.typeObject = typeObject; //장애물의 이름이 무엇인지 알려줌
        this.nextObstacleCreated = false;

        const imageRect = TRexGame.spriteDefinition[this.typeObject.type]; //이미지를 담아줄 공간

        //새
        if (this.typeObject.totalFrame !== undefined &&
            this.typeObject.fps !== undefined) {
            this.sprite = new Animation(
                game,
                imageRect,
                this.typeObject.totalFrame,
                this.typeObject.fps
            ); //새로운 애니메이션 즉 개채 만들기
            this.collisionRect.width = imageRect.width - 10;
            this.collisionRect.height = imageRect.height;
        } else { //선인장
            this.size = getRandomInt(
                this.typeObject.sizeRange.min,
                this.typeObject.sizeRange.max); //사이즈를 랜덤으로 결정해 주기

            let xOffset = 0;
            for (let i = 1; i < this.size; ++i) {
                xOffset += i;
            }

            this.sprite = new Sprite(game, new Rect(
                imageRect.x + xOffset * imageRect.width,
                imageRect.y,
                imageRect.width * this.size,
                imageRect.height
            )); //새로운 스프라이트 만들어 주기
            this.collisionRect.width = imageRect.width * this.size - 10;
            this.collisionRect.height = imageRect.height;
        }

        if (this.typeObject.variousSpawnY !== undefined) {
            this.y = getRandomElement(this.typeObject.variousSpawnY);
        } else {
            this.y = this.game.canvas.height - this.sprite.height;
        }
        ///spawn해주는 위치

        this.x = this.game.canvas.width;
        this.gap = this.getGap();

        this.collisionRect.x = this.x;
        this.collisionRect.y = this.y;
    }

    render() {
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.render();
    }

    update(deltaTime) {
        this.sprite.update(deltaTime);
        this.x -= this.game.speed * deltaTime *
            (this.typeObject.speedMultiplier || 1);
        this.collisionRect.x = this.x;
    }

    getGap() {
        const min = this.sprite.width * (this.game.speed / 60) +
            this.typeObject.minGap * TRexGame.config.GAP_MULTIPLIER;
        const max = min * TRexGame.config.MAX_GAP_MULTIPLIER;
        return getRandomInt(min, max);
    }
}

//구름 
class Cloud extends Sprite {
    constructor(game) {
        super(game, TRexGame.spriteDefinition.CLOUD);
    }

    update(deltaTime) {
        this.x -= this.game.speed * deltaTime *
            TRexGame.config.CLOUD_SPEED_MULTIPLIER;
    }
}

//플레이어
class Player extends GameObject {
    constructor(game) {
        super();
        this.game = game;
        this.normal = new Animation(game,
            TRexGame.spriteDefinition.TREX, 2, 12); //평소 상태
        this.duck = new Animation(game,
            TRexGame.spriteDefinition.TREX_DUCK, 2, 12); //숙였을 때
        this.animation = this.normal; //현재 플레이어의 모습

        this.groundY = this.game.canvas.height -
            this.animation.imageRect.height;
        this.velocity = 0; //속도
        this.jumping = false;
        this.ducking = false;
        this.isDead = false;

        this.collisionRect.width = 44;
        this.collisionRect.height = 47;
    }

    render() {
        this.animation.x = this.x;
        this.animation.y = this.y;
        this.animation.render();
    }

    update(deltaTime) {
        this.animation.update(deltaTime);
        if ((this.game.isKeyDown('Space') || this.game.isKeyDown('ArrowUp')) && !this.ducking) {
            this.jump();
        } else if (this.game.isKeyDown('ArrowDown') && !this.jumping) {
            this.startDuck();
        } else {
            this.endDuck();
        }


        this.velocity += TRexGame.config.GRAVITY;
        this.y += this.velocity;

        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.jumping = false;
            this.velocity = 0;
        }

        this.collisionRect.x = this.x;
        if (!this.ducking) this.collisionRect.y = this.y;
    }

    //점프하기
    jump() {
        if (!this.jumping) {
            this.jumping = true;
            this.velocity = TRexGame.config.JUMP_VELOCITY;
        }
    }


    //엎드리고 펴기
    startDuck() {
        this.collisionRect.y = 125;
        this.ducking = true;
        this.animation = this.duck;
    }

    endDuck() {
        this.collisionRect.y = 103;
        this.ducking = false;
        this.animation = this.normal;
    }
}

//real game code 
class TRexGame {
    constructor(canvasElement, n) {
        this.canvas = canvasElement;
        this.context = canvasElement.getContext('2d');

        this.nplayer = n;
        this.canvas.width = 600;
        this.canvas.height = 150;
        this.speed = TRexGame.config.SPEED;

        this.image = new Image();
        this.image.src = 'resource/dino.png';

        this.players = [];
        for (let i = 0; i < this.nplayer; i++) {
            this.player = new Player(this);
            this.player.x = 40 + i * 10;
            this.players.push(this.player);
        }
        this.scores = [];
        this.gameover = false;

        this.horizon = new Horizon(this);
        this.obstacles = [];
        this.downKeys = {};

        this.paused = false;
        this.updatePending = false;

        this.generation = 0;
        this.genHTML = document.getElementById("gen_n");
        this.genHTML.innerHTML = "generation : 0";

        window.addEventListener('blur', this.onVisibilityChange.bind(this));
        window.addEventListener('focus', this.onVisibilityChange.bind(this));
        document.addEventListener('visibilitychange', this.onVisibilityChange.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));

        this.play();
    }

    //게임 중지
    pause() {
        this.paused = true;
    }

    //다시 시작
    play() {
        this.paused = false;
        this.time = performance.now();
        this.scheduleNextUpdate();
    }

    //다 죽었을 때 처음부터 다시 게임을 시작하기 위해 초기화 해주어야 하는 변수들 초기화 하기
    reset() {
        this.generation++;
        this.genHTML.innerHTML = "<p>generation : " + this.generation + "</p>";
        this.players = [];
        for (let i = 0; i < this.nplayer; i++) {
            this.player = new Player(this);
            this.player.x = 40 + i * 10;
            this.players.push(this.player);
        }
        this.horizon = new Horizon(this);
        this.obstacles = [];
        this.gameover = false;
        this.play();
    }


    run() {
        this.updatePending = false;

        const now = performance.now();
        const deltaTime = (now - this.time) / 1000;
        this.time = now;

        this.clearCanvas();
        this.update(deltaTime);
        this.render();

        this.scheduleNextUpdate();
    }


    render() {
        this.horizon.render();
        let count = 0;
        for (let i of this.players) {
            if (i.isDead) continue;
            i.render();
            ++count;
        }
        if (!count) {
            this.pause();
            this.gameover = true;
        }
    }

    //업데이트 함수
    update(deltaTime) {
        this.horizon.update(deltaTime);
        for (let i of this.players) {
            if (i.isDead) continue;
            i.update(deltaTime);
        }
    }

    //다음 업데이트 스케쥴링
    scheduleNextUpdate() {
        if (!this.updatePending && !this.paused) {
            this.updatePending = true;
            this.raqId = requestAnimationFrame(this.run.bind(this));
        }
    }

    //캔버스 초기화
    clearCanvas() {
        this.context.clearRect(
            0, 0, this.canvas.width, this.canvas.height);
    }

    //사용자 포커싱 변경하면 게임 중지
    onVisibilityChange(event) {
        if (document.hidden ||
            event.type === 'blur' ||
            document.visibilityState !== 'visible') {
            this.pause();
        } else {
            this.play();
        }
    }


    onKeyDown(event) {
        this.downKeys[event.code] = true;
    }

    onKeyUp(event) {
        this.downKeys[event.code] = false;
    }

    isKeyDown(code) {
        return this.downKeys[code];
    }


    //추가된 부분
    Info() {
        let o = this.horizon.getObstacle();
        let ret = {
            obstacle: o,
            distance: this.getDistance(o),
            width: o.collisionRect.width,
            height: o.collisionRect.height,
            position: this.canvas.height - (o.y + o.collisionRect.height)
        };
        return ret;
    }

    getDistance(obs) {
        let ret = obs.x - this.player.x
        if (ret < 0) {
            return this.canvas.width;
        } else {
            return ret;
        }
    }
}

//configuration value
TRexGame.spriteDefinition = {
    CACTUS_LARGE: new Rect(332, 2, 25, 50),
    CACTUS_SMALL: new Rect(228, 2, 17, 35),
    CLOUD: new Rect(86, 2, 46, 14),
    HORIZON: new Rect(2, 54, 600, 16),
    MOON: { x: 484, y: 2 },
    BIRD: new Rect(134, 2, 46, 40),
    RESTART: { x: 2, y: 2 },
    TEXT_SPRITE: { x: 655, y: 2 },
    TREX: new Rect(936, 2, 44, 47),
    TREX_DUCK: new Rect(1112, 2, 59, 47),
    STAR: { x: 645, y: 2 }
}

TRexGame.config = {
    SPEED: 6 * 60,
    GRAVITY: 0.55,
    JUMP_VELOCITY: -11,
    GAP_MULTIPLIER: 0.6,
    MAX_GAP_MULTIPLIER: 1.5,
    CLOUD_SPAWN_DURATION: 5,
    CLOUD_SPEED_MULTIPLIER: 0.2
}

TRexGame.obstacleTypes = [{
        type: 'CACTUS_SMALL',
        minGap: 200,
        sizeRange: { min: 1, max: 3 }
    },
    {
        type: 'CACTUS_LARGE',
        minGap: 200,
        sizeRange: { min: 1, max: 3 }
    },
    {
        type: 'BIRD',
        minGap: 200,
        speedMultiplier: 0.8,
        totalFrame: 2,
        fps: 6,
        variousSpawnY: [100, 75, 50],
        sizeRange: { min: 1, max: 3 }
    }
]