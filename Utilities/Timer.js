import { gamesRef } from "../Firebase/FirebaseConfig.js";
import { setDataInDB } from "../Firebase/GamesInDB.js";
import { getWinners } from "./GameFunctions.js";

export async function timer(time, game, timeType) {
  const timerRef = gamesRef.child(game.gamecode).child(timeType);

  await timerRef.set(time);
  return new Promise((resolve, reject) => {
    const countdown = setInterval(async () => {
      time -= 1;
      await timerRef.set(time);

      if (time <= 0) {
        clearInterval(countdown);
        resolve();
      }
    }, 1000);
  });
}

export async function timers(game) {
  gamesRef.child(game.gamecode).on("value", (snapshot) => {
    const gameVal = snapshot.val();
    if (gameVal) {
      game = gameVal;
    }
  });

  await timer(3, game, "startingTime");
  await timer(game.gameTemplate.questionTime, game, "time");
  game = {
    ...game,
    gamePhase: game.gamePhase + 1,
  };
  await gamesRef.child(game.gamecode).child("gamePhase").set(game.gamePhase);
  await timer(game.gameTemplate.questionTime, game, "time");
  game = {
    ...game,
    gamePhase: game.gamePhase + 1,
  };
  await gamesRef.child(game.gamecode).child("gamePhase").set(game.gamePhase);

  if (game.gamePhase == game.gameTemplate.allQuestions.length * 2 + 1) {
    game.winners = getWinners(game.players)
    setDataInDB(game.gamecode, game.winners, 'winners')
    await setDataInDB(game.gamecode, "winners", "gameStarted");
  } else {
    game = {
      ...game,
      currentQuestion: game.currentQuestion + 1,
    };
    await gamesRef
      .child(game.gamecode)
      .child("currentQuestion")
      .set(game.currentQuestion);
    timers(game);
  }
}

