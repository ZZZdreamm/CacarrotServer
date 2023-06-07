import { gamesRef } from "../Firebase/FirebaseConfig.js";

export function getWinners(players) {
  let sortedPlayers = players.sort(
    (player1, player2) => player2.points - player1.points
  );
  const localWinners = sortedPlayers.slice(0, 3);
  return localWinners;
}





export async function useBonus(game, bonusName, playerName, enemyName){
  let thisPlayer;
  let enemy;
  game.players.forEach(player => {
    if(player.name == playerName){
      thisPlayer = player
    }
  });
  game.players.forEach(player => {
    if(player.name == enemyName){
      enemy = player
    }
  });
  var playerRef = gamesRef.child(game.gamecode).child('players').child(`${thisPlayer.id}`)
  var enemyRef;
  if(enemyName){
    enemyRef = gamesRef.child(game.gamecode).child('players').child(`${enemy.id}`)
  }
  playerRef.child('points').set(thisPlayer.points - 500)
  if(bonusName == 'DoubleNext'){
    const bonuses = (await playerRef.child('activeBonuses').once('value')).val()
    const amountOfBonuses = bonuses ? bonuses.length : 0
    playerRef.child('activeBonuses').child(`${amountOfBonuses}`).set('DoubleNext')
  }else if(bonusName == 'EraseEnemyPoints'){
    enemyRef.child('points').set(enemy.points - 700)
  }
}