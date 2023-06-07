export function getPlayer(game, playerName){
    let player;
    game.players.forEach(current_player => {
        if(current_player.name == playerName){
            player = current_player
        }
    });
    return player
}