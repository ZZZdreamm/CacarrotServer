export function getWinners(players) {
    let sortedPlayers = players.sort(
      (player1, player2) => player2.points - player1.points
    );
    const localWinners = sortedPlayers.slice(0, 2);
    return localWinners
  }