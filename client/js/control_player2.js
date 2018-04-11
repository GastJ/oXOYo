var updatePlayer2 = function(){
	deplacements = 0;
	if (cursors.right.isDown)
    {
        deplacements = 20;
    }
    else if (cursors.left.isDown)
    {	
        deplacements = -20;
    }
    else
    {
        deplacements -= gyroMove.x;
        if(gyroMove.x == 0){
            deplacements += gyroMove.gamma;
        }
    }
    ball.update(deplacements, playerID);
}