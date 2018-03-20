let w = window.innerWidth;
let h = window.innerHeight;
let game = new Phaser.Game(
	w, h, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update, render: render}
);
let ball = null;
let bonus = null;
let malus = null;
let zone = null; 
let score = 0;
let highscore = 0;
let startGame = false;
/*let textScore = null*/
let bonusSpawn = null

function preload()
{
	/*game.load.image("gameBorder","assets/border.png", w, h);*/
	game.load.image("gameBg","assets/bgtest.png", w, h);
	game.load.image("ball", "assets/ball1.png");
	game.load.image("ball_shadow", "assets/Sprite_Shadow.png");
	game.load.image("ball_bloom", "assets/Sprite_Bloom.png"); 
	game.load.image("wallX", "assets/wallX.png");
	game.load.image("wallY", "assets/wallY.png");
	game.load.image("bonus","assets/bonus.png");
	game.load.image("malus","assets/malus.png");
};

function create()
{
	game.physics.startSystem(Phaser.Physics.ARCADE); 
	game.renderer.clearBeforeRender = false;
	game.renderer.roundPixels = true;
	game.world.setBounds(0, 0, 2420, 1280);
	/*game.stage.backgroundColor = "#4488AA";*/

	// fond
    sky = game.add.tileSprite(0, 0, 2420, 1280, 'gameBg');
    /*game.add.tileSprite(200, 100, 1920, 1080, 'gameBorder');*/
    wallX = [
    	game.add.sprite(100, 50, 'wallX'),
    	game.add.sprite(2220, 50, 'wallX')
    ];
    wallY = [
    	game.add.sprite(100, 50, 'wallY'),
    	game.add.sprite(100, 1180, 'wallY')
    ];
    game.physics.arcade.enable(wallX);
    game.physics.arcade.enable(wallY);
    wallX[0].body.immovable = true;
    wallX[1].body.immovable = true;
    wallY[0].body.immovable = true;
    wallY[1].body.immovable = true;
    /*sky.fixedToCamera = true;*/
    // Score 
    textScore = game.add.text((w/2) - 90 ,20,'Score: '+score, {font: "48px Arial", fill: "#fff"});
    textScore.fixedToCamera = true;
    // Highscore
    highScoreString = "Highscore : "
    highScoreText = game.add.text(w-300, 20, highScoreString + localStorage.getItem("highscore"), { font: '48px Arial', fill: '#fff'});
    highScoreText.fixedToCamera = true;
    // Ball
	ball = createBall();
	ball.tint = 0x000000;
	// Zone 
	zone = game.add.sprite(300, h/2, "ball"); 
	zone.anchor.setTo(0.5,0.5);
	zone.scale.setTo(0.8,0.8);	
	game.physics.arcade.enable([zone]);
	/*zone.body.setCircle(53);*/
	zone.body.setSize(105, 105, 15, 15);
	zone.body.immovable = true;
	zone.tint = 0x2a8931;
	// Moving zone
	zone2 = game.add.sprite(500, h/2, "ball"); 
    zone2.anchor.setTo(0.5,0.5);
    zone2.scale.setTo(0.8,0.8); 
    game.physics.arcade.enable([zone2]);
    zone2.body.setSize(105, 105, 15, 15);
    zone2.body.velocity.setTo(500,500);
    zone2.body.collideWorldBounds = true;
    zone2.body.bounce.set(1);
    zone2.tint = 0x2a1545;

   	// Timer
	var me = this;
	totalTime = 120;
    startTime = 0;
    me.timeElapsed = 0;
 
    createTimer();
    // Start the timer
    if (playerID == 1) 
    {
	    socket.on("startGame", function(socket){
	    	startGame = true;
    		startTime = new Date();
		    me.gameTimer = game.time.events.loop(100, function(){
		        updateTimer();
		    });
	    });   	
    }

    if (playerID == 2) 
    {
    	startTime = new Date();
	    me.gameTimer = game.time.events.loop(100, function(){
	        updateTimer();
	    });
	    startGame = true;
    }

    // Configuration du socket et des handlers
	socket.on("mise à jour de la position de la zone", function(data)
	{	
		score = data.score;
		zone.position.x = data.x; 
		zone.position.y = data.y;
		socket.emit('transfert position', {x:zone.position.x, y:zone.position.y, score:score})
		
	})
	// Moving zone
	/*socket.on("mise à jour de la position de la zone2", function(data)
    {   
        score = data.score;
        zone2.position.x = data.x; 
        zone2.position.y = data.y;  
        zone2.body.velocity.x = data.x; 
        zone2.body.velocity.y = data.y;
        socket.emit('transfert position zone2', {x:zone2.position.x, y:zone2.position.y,x:zone2.body.velocity.x ,y:zone2.body.velocity.y,  score:score})
        
    })*/
	/*socket.on("creation nouvelle dangerZone", function(data){
		dangerZone = game.add.sprite(data.x, data.y, "ball"); 
		dangerZone.anchor.setTo(0.5,0.5);
		dangerZone.scale.setTo(0.8,0.8);	
		game.physics.arcade.enable([dangerZone]);
		dangerZone.body.setSize(105, 105, 15, 15);
		dangerZone.body.immovable = true;
		dangerZone.tint = 0xe23333;
		dangerZone.position.x = data.x;
		dangerZone.position.y = data.y;
		socket.emit('transfert position dangerZone', {x:dangerZone.position.x, y:dangerZone.position.y})
	})*/
	/*socket.on('communication position dangerZone',function(data)
	{	
		dangerZone.position.x = data.x; 
		dangerZone.position.y = data.y;
	});*/
	// Position 1st zone
	socket.on('communication position',function(data)
	{
		zone.position.x = data.x; 
		zone.position.y = data.y;
		score = data.score
	});
	// Position moving zone
	socket.on('communication position zone2',function(data)
    {
        zone2.position.x = data.x; 
        zone2.position.y = data.y;
        score = data.score
    });
	//Bonus
	socket.on('bonus reception',function(data)
	{
		bonus = createBonus(data.x,data.y)
	})
    socket.on('created bonus',function(data)
	{
		bonus = createBonus(data.x,data.y)
		socket.emit('bonus communication',{x:data.x,y:data.y})
	})
	socket.on('bonus removed',function(data)
	{
		bonus.kill();
		totalTime = data.totalTime;
	})
	// Malus
	socket.on('malus reception',function(data)
	{
		malus = createMalus(data.x,data.y)
	})
	socket.on('created malus',function(data)
	{
		malus = createMalus(data.x,data.y)
		socket.emit('malus communication',{x:data.x,y:data.y})
	})
	socket.on('malus removed',function(data)
	{
		malus.kill();
		totalTime = data.totalTime;
	})
	socket.on('reception axe X',function(data)
	{
		/*console.log(ball);*/
		ball.body.velocity.x = data.deplacements;
		ball.body.position.x = data.position;
	})
	socket.on('reception axe Y',function(data)
	{	/*console.log(ball);*/
		ball.body.velocity.y = data.deplacements;
		ball.body.position.y = data.position;
	})
	/*socket.on('you can move',function()
	{
		startGame = true;
	})*/
};
var createBonus = function(x,y)
{
	let bonus = game.add.sprite(x,y,"bonus")
	bonus.anchor.setTo(.5,.5);
	bonus.scale.setTo(.45,.45);
	game.physics.arcade.enable(bonus);
	bonus.body.setCircle(53);
	bonus.body.immovable=true;
	return bonus;
}
var createMalus = function(x,y)
{
	let malus = game.add.sprite(x,y,"malus")
	malus.anchor.setTo(.5,.5);
	malus.scale.setTo(.45,.45);
	game.physics.arcade.enable(malus);
	malus.body.setCircle(53);
	malus.body.immovable=true;
	return malus;
}
function createTimer()
{
    var me = this;
 
    me.timeLabel = game.add.text(75, 15, "00:00", {font: "48px Arial", fill: "#fff"});
    me.timeLabel.fixedToCamera = true;
    me.timeLabel.anchor.setTo(0.5, 0);
    me.timeLabel.align = 'center';
 
}

function updateTimer()
{
 	/*console.log("CA FONCTIONNE");*/
	var me = this;

    var currentTime = new Date();
    var timeDifference = startTime.getTime() - currentTime.getTime();
 
    //Time elapsed in secondes
    me.timeElapsed = Math.abs(timeDifference / 1000);
 
    //Time remaining in secondes
    var timeRemaining = totalTime - me.timeElapsed;
 
    //Convert secondes into minutes and secondes
    var minutes = Math.floor(timeRemaining / 60);
    var secondes = Math.floor(timeRemaining) - (60 * minutes);
    /*var minutes = Math.floor(me.timeElapsed / 60);
	var secondes = Math.floor(me.timeElapsed) - (60 * minutes);*/
 
    //Display minutes, add a 0 to the start if less than 10
    var result = (minutes < 10) ? "0" + minutes : minutes;
 
    //Display secondes, add a 0 to the start if less than 10
    result += (secondes < 10) ? ":0" + secondes : ":" + secondes;
    me.timeLabel.text = result;

    if (me.timeElapsed >= totalTime) 
    {
    	game.time.events.remove(gameTimer)
    }
}
var createBall = function()
{
	let ball_shadow = game.add.sprite(w/2, h/2,"ball_shadow");
	let ball = game.add.sprite(w/2, h/2,"ball");
	let ball_bloom = game.add.sprite(w/2, h/2,"ball_bloom");
	game.physics.enable(ball, Phaser.Physics.ARCADE);
	game.physics.enable(ball_shadow, Phaser.Physics.ARCADE);
	game.physics.enable(ball_bloom, Phaser.Physics.ARCADE);
	cursors = game.input.keyboard.createCursorKeys();
	ball_shadow.anchor.setTo(0.5,0.5);
	ball.anchor.setTo(0.5, 0.5);
	ball_bloom.anchor.setTo(0.5,0.5);
	ball.speed = 400;
	ball_shadow.speed = 400;
	ball_bloom.speed = 400;
	ball.body.collideWorldBounds = true;
	ball.body.bounce.setTo(.5, .5);
	ball.scale.setTo(0.4, 0.4);
	ball_shadow.scale.setTo(0.4,0.4);
	ball_bloom.scale.setTo(0.15,0.15);
	game.camera.follow(ball, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
	gyro.startTracking(function(o) {
               // updating player velocity
               ball.body.velocity.x += o.gamma;
               ball.body.velocity.y += o.beta;
          });
	ball.update = function(value, ID){
		
		if (ID == 1)
	    {	
	        ball.body.velocity.y += value;
	        socket.emit('Mouvement Y',{mouvement:ball.body.velocity.y, position:ball.body.position.y});
	    }
	    else if (ID == 2)
	    {
	        ball.body.velocity.x += value;
	        socket.emit('Mouvement X',{mouvement:ball.body.velocity.x, position:ball.body.position.x});
	    }

	    socket.on('reception axe Y',function(data)
	    {
	    	ball.body.velocity.y = data.mouvement
	    });
	    socket.on('reception axe X',function(data)
	    {
	    	ball.body.velocity.x = data.mouvement
	    });

	    gyro.frequency = 10;
	   /* gyro.startTracking(function(o) {*/
	    	ball_bloom.body.velocity.x=ball.body.velocity.x*0.98
	    	ball_bloom.body.velocity.y=ball.body.velocity.y*0.98
	    	ball_shadow.body.velocity.x=ball.body.velocity.x*1.02
	    	ball_shadow.body.velocity.y=ball.body.velocity.y*1.02
        /*});*/
	       // updating ball velocity
	      	if (ball_shadow.x!==(ball.x-window.innerWidth*0.5)*1.02+window.innerWidth*0.5) 
	      	{
	    		ball_shadow.x=(ball.x-window.innerWidth*0.5)*1.02+window.innerWidth*0.5
	      	}
	      	if (ball_shadow.y!==(ball.y-window.innerHeight*0.5)*1.02+window.innerHeight*0.5) 
	      	{
	    		ball_shadow.y=(ball.y-window.innerHeight*0.5)*1.02+window.innerHeight*0.5
	      	}
	      	if (ball_bloom.x!==(ball.x-window.innerWidth*0.5)*0.98+window.innerWidth*0.5) 
	      	{
	    		ball_bloom.x=(ball.x-window.innerWidth*0.5)*0.98+window.innerWidth*0.5
	      	}
	      	if (ball_bloom.y!==(ball.y-window.innerHeight*0.5)*0.98+window.innerHeight*0.5) 
	      	{
	    		ball_bloom.y=(ball.y-window.innerHeight*0.5)*0.98+window.innerHeight*0.5
	      	}
	}
	return ball;
}

/*function createDangerZone(){
	dangerZone = game.add.sprite(300, h/2, "ball"); 
	dangerZone.anchor.setTo(0.5,0.5);
	dangerZone.scale.setTo(0.8,0.8);	
	game.physics.arcade.enable([dangerZone]);
	dangerZone.body.setSize(105, 105, 15, 15);
	dangerZone.body.immovable = true;
	dangerZone.tint = 0xe23333;
}*/
function collisionHandler()
{
	console.log("collision");
	socket.emit("Zone collision", {w:w, h:h, score:score});
	if (score >= localStorage.getItem("highscore")) 
    {
        highScoreText.text = highScoreString + score;
    }
	/*socket.emit("dangerZone creation", {w:w, h:h});*/
}
function collisionHandler2()
{
    console.log("collision2");
    socket.emit("Zone2 collision", {w:w, h:h, score:score});
    if (score >= localStorage.getItem("highscore")) 
    {
        highScoreText.text = highScoreString + score;
    }
}
function applyBonus()
{
	totalTime += 10;
	/*if (playerID==1) 
	{
		totalTime += 10;
	}else if (playerID==2) 
	{
		totalTime += 10;
	}*/
	bonus.kill();
	socket.emit('bonus collision', {totalTime:totalTime})
}
function applyMalus()
{
	totalTime -= 10;
	malus.kill();
	socket.emit('malus collision', {totalTime:totalTime})
}
/*function death(){
	ball.kill();
}*/

function update(){
	if (startGame) 
	{
		if (Math.floor(Math.random()*2)==1) 
		{
			/*console.log("bonus créé");*/
			socket.emit('createBonus',{w:w, h:h})
			/*console.log(bonus);*/
		}
		if (Math.floor(Math.random()*3)==1) 
		{
			/*console.log("bonus créé");*/
			socket.emit('createMalus',{w:w, h:h})
			/*console.log(bonus);*/
		}
		if (playerID==1) 
		{
			updatePlayer1();
		}else if (playerID==2) 
		{
			updatePlayer2();
		}
	}
	textScore.setText('Score: '+score, {font: "48px Arial", fill: "#fff"});
	// Highscore
	highScoreText.setText('Highscore: '+ localStorage.getItem("highscore"), {font: "48px Arial", fill: "#fff"});
	if (score > localStorage.getItem("highscore"))
    {
       localStorage.setItem("highscore", score);
    }
	game.physics.arcade.collide(ball, zone, collisionHandler, null, this);
	game.physics.arcade.collide(ball, zone2, collisionHandler2, null, this);
	game.physics.arcade.collide(ball, bonus, applyBonus, null, this);
	game.physics.arcade.collide(ball, malus, applyMalus, null, this);
	/*game.physics.arcade.collide(ball, dangerZone, death, null, this);*/
	game.physics.arcade.collide(wallX, ball);
	game.physics.arcade.collide(wallY, ball);
};

function render(){
	/*game.debug.body(ball);*/
	/*game.debug.body(zone);*/
};