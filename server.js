const express = require('express');
const http = require('http');

let nbPlayer=0
let players = [0, 0];
let allClients = [null, null];
let overload = false;
let bonus = false;
let malus = false;
////Mise a disposition des pages

var app = express();
var server = http.createServer(app);

app.use('/client', express.static(__dirname + '/client'));

app.get('/client', function(req, res){
    res.sendFile(__dirname + '/client/index.html');
});

server.listen(process.env.PORT || 8080,function(){
    console.log('Listening on '+server.address().port);
});



////Connexion et Web socket

var io = require('socket.io').listen(server);

io.on('connection', function(socket){ 
    console.log('Un nouveau joueur à rejoint le jeu');

    let currentPlayer = players.indexOf(0);
    console.log(players);
    console.log(allClients.length);
    console.log('Last :'+allClients[allClients.length-1]);
    if (currentPlayer >= 0){
        players[currentPlayer] = 1;
        allClients[currentPlayer] = socket;
        currentPlayer++;
        console.log("Vous êtes le player " + currentPlayer);
        socket.emit('playerNumber', {ball:currentPlayer});
        if (currentPlayer == 2){
            socket.broadcast.emit('startGame');
        }
    } else {
        console.log("Deux joueurs sont présents, connection échouée.");
    }
    socket.on("Mouvement Y",function(data)
    {
        mouvement = data.deplacements;
        position = data.position;
        socket.broadcast.emit('reception axe Y',{mouvement: mouvement, position:position})
    })
    socket.on("Mouvement X",function(data)
    {
        mouvement = data.deplacements;
        position = data.position;
        socket.broadcast.emit('reception axe X',{mouvement: mouvement, position:position})
    })
    // ZONE 1
    socket.on("Zone collision",function(data)
    {
        if (!overload) 
        {
            overload=true;
            zoneX = (Math.random()*(data.w-400))-(data.w-400)/2+data.w/2
            zoneY = (Math.random()*(data.h-300))-(data.h-300)/2+data.h/2
            score = data.score + 1
            socket.emit("MajPos",{x:zoneX, y:zoneY, score}); 
            setTimeout(function(){overload=false},500)
        }
    })
    socket.on('TransfertPos',function(data)
    {
        socket.broadcast.emit('ComPos',{x:data.x,y:data.y, score:data.score})
    })
    // MINECART
    socket.on('emitMinecart',function(data)
    {
        let x = (Math.random()*(data.w-200))+100;
        let y = (Math.random()*(data.h-200))+100;
        let speedX = (Math.random()*300)+100;
        let speedY = (Math.random()*300)+100;
        socket.broadcast.emit("createMinecart",{x:x,y:y,speedX:speedX,speedY:speedY})
        socket.emit("createMinecart",{x:x,y:y,speedX:speedX,speedY:speedY})
    })
    socket.on("minecart collision",function(data)
    {
        socket.broadcast.emit('minecartRemove');
        socket.emit('minecartRemove');
    })

    socket.on('gameStarted',function()
    {
        /*bonusEnable=true;*/
        /*socket.broadcast.emit('you can move')*/
    })
    // BONUS
    socket.on('emitBonus',function(data)
    {
        let x = (Math.random()*(data.w-200))+100
        let y = (Math.random()*(data.h-200))+100
        socket.broadcast.emit("createBonus",{x:x,y:y})
        socket.emit("createBonus",{x:x,y:y})
    })
    socket.on('bonus collision',function(data)
    {
        socket.broadcast.emit('bonus removed', {totalTime:data.totalTime})
    })
    // MALUS
    socket.on('emitMalus',function(data)
    {
        let x = (Math.random()*(data.w-200))+100
        let y = (Math.random()*(data.h-200))+100
        socket.broadcast.emit("createMalus",{x:x,y:y})
        socket.emit("createMalus",{x:x,y:y})
    })
    socket.on('malus collision',function(data)
    {
        socket.broadcast.emit('malus removed', {totalTime:data.totalTime})
})

    socket.on('disconnect', function(){
        console.log('Déconnexion')
        const i = allClients.indexOf(socket);
        if (i >= 0) {
            allClients[i] = null;
            players[i] = 0;
            console.log('i :'+i);
            console.log('clients: '+allClients[allClients.length-1]);
            socket.emit("disconnection")       
        }
    });
});