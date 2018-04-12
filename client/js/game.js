let w = window.innerWidth;
let h = window.innerHeight;
let game = new Phaser.Game(
	1920, 960, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update, render: render}
);
let ball = null;
let bonus = false;
let malus = false;
let minecart = false;
let zone = null; 
let score = 0;
let highscore = 0;
let startGame = false;
let bonusSpawn = null;
let gyroMove = {x:0, y:0, gamma:0, beta:0};

function preload()
{	
	game.load.image("cave", "assets/images/caveBackground.png");
	game.load.image("ball", "assets/images/ball.png");
	game.load.image("pickaxe", "assets/images/double_pickaxe.png");
	game.load.image("nugget", "assets/images/nugget.png");
	game.load.image("minecart", "assets/images/minecart.png"); 
	game.load.image("bonus","assets/images/bonus2.png");
	game.load.image("malus","assets/images/malus2.png");
	game.load.image("timesUp", "assets/images/timesUp.png");
	game.load.image("retry", "assets/images/retry.png");
	game.load.image("menu", "assets/images/menu.png");
	game.load.audio("picking", "assets/sounds/picking.ogg");
	game.load.audio("minecartHit", "assets/sounds/minecartHit.ogg");
};
function goFullScreen(){
	// setting a background color
	game.stage.backgroundColor = "#555555";
	// using RESIZE scale mode
	game.world._definedSize = true;
	game.stage.disableVisibilityChange = true;
	game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	game.scale.pageAlignHorizontally = true;
	game.scale.pageAlignVertically = true; 
	/*game.scale.setScreenSize(true);*/ 
}
function create()
{
	game.physics.startSystem(Phaser.Physics.ARCADE); 
	/*game.stage.backgroundColor = "#4488AA";*/
	// fond
	background = game.add.sprite(0,0,"cave");
    // Score 
    textScore = game.add.text((game.width/2.2) ,game.height*0.02,'Score: '+score, {font: "36px Golden", fill: "#fff"});
    textScore.fixedToCamera = true;
    // Highscore
    highScoreString = "Highscore : "
    highScoreText = game.add.text(game.width/1.26, game.height*0.02, highScoreString + localStorage.getItem("highscore"), { font: '36px Golden', fill: '#fff'});
    highScoreText.fixedToCamera = true;
    // Sons
    picking = game.add.audio('picking', 0.4);
    minecartHit = game.add.audio('minecartHit', 0.4);
    // Ball
	ball = createBall();
	/*ball.tint = 0x000000;*/
	// ZONE 1
	zone = game.add.sprite(game.width*0.3, game.height/2, "nugget"); 
	zone.anchor.setTo(0.5,0.5);
	zone.scale.setTo(1,1);	
	game.physics.arcade.enable([zone]);
	/*zone.body.setCircle(53);*/
	zone.body.setSize(105, 105, 0, 0);
	zone.body.immovable = true;
	/*zone.tint = 0x43F04E;*/

    // Bouton Retry
    gameRetry = game.add.sprite(1920/2, 960/2, "retry");
    gameRetry.anchor.set(0.5,0.5);
    gameRetry.visible = false;

    // Bouton Menu
    gameMenu = game.add.sprite(-1600, game.camera.y+400, 'menu');
    gameMenu.anchor.set(0.5,0.5);
    gameMenu.visible = false;

	// TIMER
	var me = this;
	totalTime = 120;
    startTime = 0;
    me.timeElapsed = 0;

    createTimer();
    // START TIMER
    socket.on("startGame", function(socket){
	    	startGame = true;
			startTime = new Date();
		    me.gameTimer = game.time.events.loop(100, function(){
	        updateTimer();
    	})
    })
    /*if (playerID == 1) 
    {
	    socket.on("startGame", function(socket){
	    	startGame = true;
    		startTime = new Date();
		    me.gameTimer = game.time.events.loop(100, function(){
		        updateTimer();
		    });
	    });   	
    }*/

    if (playerID == 2) 
    {
	    startGame = true;
    	startTime = new Date();
	    me.gameTimer = game.time.events.loop(100, function(){
	        updateTimer();
	    });
    }

    // CONFIGURATION DU SOCKET ET DES HANDLERS
	// BONUS
    socket.on('createBonus',function(data)
	{
		bonus = createBonus(data.x,data.y)
		socket.emit('bonus communication',{x:data.x,y:data.y})
		console.log("created bonus");
	})
	socket.on('bonus removed',function(data)
	{
		bonus.kill();
		totalTime = data.totalTime;
	})
	// MALUS
	socket.on('createMalus',function(data)
	{
		malus = createMalus(data.x,data.y)
		socket.emit('malus communication',{x:data.x,y:data.y})
		console.log("malus created");
	})
	socket.on('malus removed',function(data)
	{
		malus.kill();
		totalTime = data.totalTime;
	})
	socket.on('reception axe X',function(data)
	{
		ball.body.velocity.x = data.mouvement;
		ball.body.position.x = data.position;
	})
	socket.on('reception axe Y',function(data)
	{	
		ball.body.velocity.y = data.mouvement;
		ball.body.position.y = data.position;
	})
	socket.on('createMinecart',function(data)
	{
		createMinecart(data.x,data.y,data.speedX,data.speedY)
	})
	socket.on('minecartRemove',function(data)
	{
		minecart.kill();
		score+=5;
	})
	goFullScreen();
};
var createBonus = function(x,y)
{
	let bonus = game.add.sprite(x,y,"bonus")
	bonus.anchor.setTo(.5,.5);
	bonus.scale.setTo(.75,.75);
	game.physics.arcade.enable(bonus);
	bonus.body.setCircle(55, 5, 10);
	bonus.body.immovable=true;
	return bonus;
}
var createMalus = function(x,y)
{
	let malus = game.add.sprite(x,y,"malus")
	malus.anchor.setTo(.5,.5);
	malus.scale.setTo(.75,.75);
	game.physics.arcade.enable(malus);
	malus.body.setCircle(55, 5, 10);
	malus.body.immovable=true;
	return malus;
}
var createMinecart = function(x,y,sx,sy)
{
	// ZONE 2
	minecart = true;
	minecart = game.add.sprite(x, y, "minecart"); 
    minecart.anchor.setTo(0.5,0.5);
    minecart.scale.setTo(1.5,1.5); 
    game.physics.arcade.enable([minecart]);
    minecart.body.setSize(90, 85);
    minecart.body.velocity.setTo(sx,sy);
    minecart.body.collideWorldBounds = true;
    minecart.body.bounce.set(1);
    /*minecart.tint = 0x2a1545;*/
    return minecart;
}

function createTimer()
{
    var me = this;
 
    me.timeLabel = game.add.text(game.width*0.055, game.height*0.02, "00:00", {font: "36px Golden", fill: "#fff"});
    me.timeLabel.anchor.setTo(0.5, 0);
    me.timeLabel.align = 'center';
 
}

function updateTimer()
{
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
    	game.paused = true;
    	me.timeLabel.text = "00:00";
    	console.log("ADD SPRITES MOTHERFUCKER");
	    // TIME'S UP
	    timesUp = game.add.sprite(1920/2, 960/2, 'timesUp');
	    timesUp.anchor.setTo(0.5, 0.5);
	    timesUp.visible = true;
    	// Bouton Retry
	    gameRetry = game.add.button(1920/2, 960/1.5, 'retry', callIndex);
	    gameRetry.anchor.set(0.5,0.5);
	    gameRetry.visible = true;

	    // Bouton Menu
	    gameMenu = game.add.button(1920/2, 960/1.2, 'menu', callMenu);
	    gameMenu.anchor.set(0.5,0.5);
	    gameMenu.visible = true;
    }
}
function callMenu(){
    document.location.href="menu.html";
}
function callIndex(){
    document.location.href="index.html";
}
var createBall = function()
{
	let ball = game.add.sprite(1920/2, 960/2,"pickaxe");
	game.physics.enable(ball, Phaser.Physics.ARCADE);
	cursors = game.input.keyboard.createCursorKeys();
	ball.anchor.setTo(0.5, 0.5);
	ball.speed = 400;
	ball.body.collideWorldBounds = true;
	ball.body.bounce.setTo(.5, .5);
	ball.scale.setTo(0.7, 0.7);
	game.camera.follow(ball, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
	gyro.startTracking(function(o) {
       // updating player velocity
       gyroMove.x = o.x;
       gyroMove.y = o.y*20;
       gyroMove.gamma = o.gamma/2;
       gyroMove.beta = o.beta/2;
     });
	ball.update = function(value, ID){
		ball.angle += 5;
		if (ID == 1)
	    {	
	        ball.body.velocity.y += value;
	        socket.emit('Mouvement Y',{deplacements:ball.body.velocity.y, position:ball.body.position.y});
	    }
	    else if (ID == 2)
	    {
	        ball.body.velocity.x += value;
	        socket.emit('Mouvement X',{deplacements:ball.body.velocity.x, position:ball.body.position.x});
	    }
	}
	return ball;
}

function collisionHandler()
{	
	picking.play();
	console.log("collision");
	socket.emit("Zone collision", {w:w, h:h, score:score});
	if (score >= localStorage.getItem("highscore")) 
    {
        highScoreText.text = highScoreString + score;
    }
    socket.on("MajPos", function(data)
    {   
        score = data.score;
        zone.position.x = data.x; 
        zone.position.y = data.y;
        socket.emit('TransfertPos', {x:zone.position.x, y:zone.position.y, score:score})
        
    })
    socket.on('ComPos',function(data)
    {
        score = data.score;
        zone.position.x = data.x;
        zone.position.y = data.y;
    });
}
function collisionHandler2()
{	
	minecartHit.play();
    score+=5;
	minecart.kill();
	minecart = false;
    console.log("collision2");
    socket.emit("minecart collision");
}
function applyBonus()
{
	totalTime += 10;
	bonus.kill();
	bonus = false;
	socket.emit('bonus collision', {totalTime:totalTime})
}
function applyMalus()
{
	totalTime -= 10;
	malus.kill();
	malus = false;
	socket.emit('malus collision', {totalTime:totalTime})
}

function update(){
	if (startGame) 
	{
		if (Math.floor(Math.random()*200)==1&&!bonus) 
		{
			bonus = true;
			console.log("bonus créé");
			socket.emit('emitBonus',{w:w, h:h})
		}
		if (Math.floor(Math.random()*300)==1&&!malus) 
		{
			malus = true;
			console.log("malus créé");
			socket.emit('emitMalus',{w:w, h:h})
		}
		if (Math.floor(Math.random()*300)==1&&!minecart)
		{
			minecart=true;
			socket.emit('emitMinecart',{w:w, h:h})
		}
		if (playerID==1) 
		{
			updatePlayer1();
		}else if (playerID==2) 
		{
			updatePlayer2();
		}
	}
	textScore.setText('Score: '+score, {font: "48px Golden", fill: "#fff"});
	// HIGHSCORE
	highScoreText.setText('Highscore: '+ localStorage.getItem("highscore"), {font: "48px Golden", fill: "#fff"});
	if (score > localStorage.getItem("highscore"))
    {
       localStorage.setItem("highscore", score);
    }
	game.physics.arcade.collide(ball, zone, collisionHandler, null, this);
	game.physics.arcade.collide(ball, minecart, collisionHandler2, null, this);
	game.physics.arcade.collide(ball, bonus, applyBonus, null, this);
	game.physics.arcade.collide(ball, malus, applyMalus, null, this);
};

function render(){
	/*game.debug.body(ball);
	game.debug.body(zone);
	game.debug.body(minecart);
	game.debug.body(bonus);
	game.debug.body(malus);*/
};