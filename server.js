const express = require('express');
const http = require('http');

let nbPlayer=0
let players = [0, 0];
let allClients = [null, null];
let overload = false;
/*let bonusEnable=false;*/
let bonus = false;
let malus = false;
/*let dzoverload*/
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
        deplacements = data.deplacements;
        position = data.position;
        socket.broadcast.emit('reception axe Y',{deplacements: deplacements, position:position})
    })
    socket.on("Mouvement X",function(data)
    {
        deplacements = data.deplacements;
        position = data.position;
        socket.broadcast.emit('reception axe X',{deplacements: deplacements, position:position})
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
            socket.emit("mise à jour de la position de la zone",{x:zoneX, y:zoneY, score}); 
            setTimeout(function(){overload=false},500)
        }
    })
    socket.on('transfert position',function(data)
    {
        socket.broadcast.emit('communication position',{x:data.x,y:data.y, score:data.score})
    })
    // ZONE 2 (ZONE MOUVANTE)
    /*socket.on("Zone2 collision",function(data)
    {
        if (!overload) 
        {
            overload=true;
            zone2X = (Math.random()*(data.w-400))-(data.w-400)/2+data.w/2
            zone2Y = (Math.random()*(data.h-300))-(data.h-300)/2+data.h/2
            score = data.score + 5
            socket.emit("mise à jour de la position de la zone2",{x:zone2X, y:zone2Y, score}); 
            setTimeout(function(){overload=false},200)
        }
    })
    socket.on('transfert position zone2',function(data)
    {
        socket.broadcast.emit('communication position zone2',{x:data.x ,y:data.y, score:data.score})
    })*/
    // RAJOUT LOAN
    socket.on('gameStarted',function()
    {
        /*bonusEnable=true;*/
        /*socket.broadcast.emit('you can move')*/
    })
    // BONUS
    socket.on('createBonus',function(data)
    {
        if (!bonus) 
        {
            bonus=true;
            bonusX = (Math.random()*(data.w-200))-(data.w-100)/2+data.w/2;
            bonusY = (Math.random()*(data.h-150))-(data.h-75)/2+data.h/2;
            socket.emit('created bonus',{x:bonusX,y:bonusY})
        }
    })
    socket.on('bonus communication',function(data)
    {
        socket.broadcast.emit('bonus reception',{x:data.x,y:data.y})
    })
    socket.on('bonus collision',function(data)
    {
        bonus=false;
        socket.broadcast.emit('bonus removed', {totalTime:data.totalTime})
    })
    // MALUS
    socket.on('createMalus',function(data)
    {
        if (!malus) 
        {
            malus=true;
            malusX = (Math.random()*(data.w-200))-(data.w-100)/2+data.w/2;
            malusY = (Math.random()*(data.h-150))-(data.h-75)/2+data.h/2;
            socket.emit('created malus',{x:malusX,y:malusY})
        }
    })
    socket.on('malus communication',function(data)
    {
        socket.broadcast.emit('malus reception',{x:data.x,y:data.y})
    })
    socket.on('malus collision',function(data)
    {
        malus=false;
        socket.broadcast.emit('malus removed', {totalTime:data.totalTime})
    })
    // DANGER ZONE
    /*socket.on("dangerZone creation",function(data)
    {
        if (!dzoverload)
        {
            dzoverload=true;
            let zoneX = (Math.random()*(data.w-400))-(data.w-400)/2+data.w/2
            let zoneY = (Math.random()*(data.h-300))-(data.h-300)/2+data.h/2
            socket.emit("creation nouvelle dangerZone",{x:zoneX, y:zoneY}); 
            setTimeout(function(){dzoverload=false},500)
        }
    })*/


    /*socket.on('transfert position dangerZone',function(data)
    {
        socket.broadcast.emit('creation nouvelle dangerZone',{x:data.x,y:data.y})
    })*/

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