console.log('hello world');
let socket; 
socket = io.connect();
let playerID = 0;

socket.on('playerNumber',function(data)
{
	console.log(data)

	console.log("Vous êtes le Joueur " + data.ball)
	playerID = data.ball;
	/*game.load.script("control_player"+data.ball+".js", "../Dual_Mobile_2/client/js/control_player"+data.ball+".js");*/
	console.log("Load player " + data.ball);
	let control = ""; 
        if(playerID == 1)
            {control = "↑ & ↓"}
        else if(playerID)
            {control = "← & →"}

        let controlText = game.add.text(game.width*0.015, game.height*0.1, "Vos contrôles sont : "+control, {font: "36px Golden", fill: "#fff"});
        controlText.fixedToCamera = true;
});
socket.on('startGame',function()
{
	console.log("game has started")
	/*startGame = true;*/
	socket.emit('gameStarted')
})
socket.on('disconnection'),function()
{
	startGame = false;
}