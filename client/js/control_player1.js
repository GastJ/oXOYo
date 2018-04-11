var updatePlayer1 = function(){
	deplacements = 0;
	if (cursors.up.isDown)
    {
        deplacements = -20;
    }
    else if (cursors.down.isDown)
    {
        deplacements = 20;
    }
    else
    {
        deplacements += gyroMove.y;
        if(gyroMove.y == 0){
            deplacements += gyroMove.beta;
        }
    }
    ball.update(deplacements, playerID);
}