let w = window.innerWidth;
let h = window.innerHeight;
let game = new Phaser.Game(
	"100%", "100%", Phaser.CANVAS, 'game', { preload: preload, create: create, update: update, render: render}
);
let ball = null;
let bonus = false;
let malus = false;
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
	game.load.image("ball_shadow", "assets/images/Sprite_Shadow.png");
	game.load.image("ball_bloom", "assets/images/Sprite_Bloom.png"); 
	game.load.image("bonus","assets/images/bonus2.png");
	game.load.image("malus","assets/images/malus2.png");
	game.load.audio("picking", "assets/sounds/picking.ogg");
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
	goFullScreen();
    // Score 
    textScore = game.add.text((game.width/2.2) ,game.height*0.02,'Score: '+score, {font: "36px Golden", fill: "#fff"});
    textScore.fixedToCamera = true;
    // Highscore
    highScoreString = "Highscore : "
    highScoreText = game.add.text(game.width/1.26, game.height*0.02, highScoreString + localStorage.getItem("highscore"), { font: '36px Golden', fill: '#fff'});
    highScoreText.fixedToCamera = true;
    // Sons
    picking = game.add.audio('picking', 0.4);
    // Ball
	ball = createBall();
	/*ball.tint = 0x000000;*/
	// ZONE 1
	zone = game.add.sprite(game.width*0.3, game.height/2, "nugget"); 
	zone.anchor.setTo(0.5,0.5);
	zone.scale.setTo(0.8,0.8);	
	game.physics.arcade.enable([zone]);
	/*zone.body.setCircle(53);*/
	zone.body.setSize(105, 105, 15, 15);
	zone.body.immovable = true;
	/*zone.tint = 0x43F04E;*/

	// ZONE 2
	zone2 = game.add.sprite(game.width/1.3, game.height/2, "minecart"); 
    zone2.anchor.setTo(0.5,0.5);
    zone2.scale.setTo(0.8,0.8); 
    game.physics.arcade.enable([zone2]);
    zone2.body.setSize(105, 105, 15, 15);
    zone2.body.velocity.setTo(300,300);
    zone2.body.collideWorldBounds = true;
    zone2.body.bounce.set(1);
    /*zone2.tint = 0x2a1545;*/

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
};
/*function resize(){
	textScore.x = Math.round((game.width-textScore.width)/2);
	textScore.y = game.height;
	highScoreText.x = Math.round((game.width-highScoreText.width)/2);
	highScoreText.y = game.height;
	timeLabel.x = Math.round((game.width-timeLabel.width)/2);
	timeLabel.y = game.height;
}*/
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
 
    me.timeLabel = game.add.text(game.width*0.055, game.height*0.02, "00:00", {font: "36px Golden", fill: "#fff"});
    me.timeLabel.fixedToCamera = true;
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
    	game.time.events.remove(gameTimer)
    }
}
var createBall = function()
{
	/*let ball_shadow = game.add.sprite(w/2, h/2,"ball_shadow");*/
	let ball = game.add.sprite(w/2, h/2,"pickaxe");
	/*let ball_bloom = game.add.sprite(w/2, h/2,"ball_bloom");*/
	game.physics.enable(ball, Phaser.Physics.ARCADE);
	/*game.physics.enable(ball_shadow, Phaser.Physics.ARCADE);
	game.physics.enable(ball_bloom, Phaser.Physics.ARCADE);*/
	cursors = game.input.keyboard.createCursorKeys();
	/*ball_shadow.anchor.setTo(0.5,0.5);*/
	ball.anchor.setTo(0.5, 0.5);
	/*ball_bloom.anchor.setTo(0.5,0.5);*/
	ball.speed = 400;
	/*ball_shadow.speed = 400;
	ball_bloom.speed = 400;*/
	ball.body.collideWorldBounds = true;
	ball.body.bounce.setTo(.5, .5);
	ball.scale.setTo(0.4, 0.4);
	/*ball_shadow.scale.setTo(0.4,0.4);
	ball_bloom.scale.setTo(0.15,0.15);*/
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
	    	/*ball_bloom.body.velocity.x=ball.body.velocity.x*0.98
	    	ball_bloom.body.velocity.y=ball.body.velocity.y*0.98
	    	ball_shadow.body.velocity.x=ball.body.velocity.x*1.02
	    	ball_shadow.body.velocity.y=ball.body.velocity.y*1.02
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
	      	}*/
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
    console.log("collision2");
    socket.emit("Zone2 collision", {w:w, h:h, score:score});
    if (score >= localStorage.getItem("highscore")) 
    {
        highScoreText.text = highScoreString + score;
    }
    socket.on("MajPos2", function(data)
    {   
        score = data.score;
        zone2.position.x = data.x; 
        zone2.position.y = data.y;  
        zone2.body.velocity.x = data.x; 
        zone2.body.velocity.y = data.y;
        socket.emit('TransfertPos2', {x:zone2.position.x, y:zone2.position.y,x:zone2.body.velocity.x ,y:zone2.body.velocity.y,  score:score})
        
    })
    socket.on('ComPos2',function(data)
    {
        zone2.position.x = data.x; 
        zone2.position.y = data.y;
        score = data.score
    });
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
	/*game.physics.arcade.collide(ball, zone2, collisionHandler2, null, this);*/
	game.physics.arcade.collide(ball, bonus, applyBonus, null, this);
	game.physics.arcade.collide(ball, malus, applyMalus, null, this);
};

function render(){
	/*game.debug.body(ball);*/
	/*game.debug.body(zone);*/
};