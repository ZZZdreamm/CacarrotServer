import { gamesRef } from "./FirebaseConfig.js";

export async function getGameOn(gamecode, game){
  await gamesRef.child(gamecode).on("value", (snapshot) => {
    const gameVal = snapshot.val();
    if (gameVal) {
      game = gameVal;
    }
  });
}

export async function getGame(gamecode) {
  let game;
  await gamesRef.child(gamecode).once("value", (snapshot) => {
    const gameVal = snapshot.val();
    if (gameVal) {
      game = gameVal;
    }
  });
  return game
}

export async function joinGame(gamecode, player) {
  await gamesRef
    .child(gamecode)
    .child("players")
    .once("value", (snapshot) => {
      const players = snapshot.val();
      let playerNumber = 0;
      if (players) {
        Object.keys(players).forEach((playerKey) => {
          if (parseInt(playerKey) == playerNumber) {
            playerNumber += 1;
          }
        });
      }
      player.id = playerNumber;
      gamesRef
        .child(gamecode)
        .child("players")
        .child(`${playerNumber}`)
        .set(player);
    });
  return player.id;
}

export async function setPointsForPlayer(gamecode, playerName, points) {
  gamesRef
    .child(gamecode)
    .child("players")
    .once("value", (snapshot) => {
      const players = snapshot.val();
      players.forEach((player) => {
        if (player.name == playerName) {
          gamesRef
            .child(gamecode)
            .child("players")
            .child(`${player.id}`)
            .child("points")
            .set(points);
        }
      });
    });
}



export function calculatePointsForAnswer(answer, game){
  if(answer.choosenAnswer == game.gameTemplate.allQuestions[game.currentQuestion].correctAnswer && game.currentQuestion == answer.questionNumber){
    const pointsForSecond = 1000 - Math.round(
      1000 / game.gameTemplate.questionTime
    );
    const points = 1000 - pointsForSecond * answer.sendingTime
    return points
  }
  return 0
}







export const setDataInDB = async (
  gamecode,
  data,
  actionType,
  playerId
) => {
  if (actionType == "game") {
    await gamesRef.child(gamecode).set(data);
  } else if (actionType == "currentQuestion") {
    await gamesRef.child(gamecode).child("currentQuestion").set(data);
  } else if (actionType == "time") {
    await gamesRef.child(gamecode).child("time").set(data);
  } else if (actionType == "questionDone") {
    await gamesRef.child(gamecode).child("currentQuestion").set(data);
  } else if (actionType == "points") {
    await gamesRef
      .child(gamecode)
      .child("players")
      .child(`${playerId}`)
      .child("points")
      .set(data);
  } else if (actionType == "game") {
    await gamesRef.child(gamecode).set(data);
  } else if (actionType == "shownComponent") {
    await gamesRef
      .child(gamecode)
      .child("players")
      .child(`${playerId}`)
      .child("shownComponent")
      .set(data);
  } else if (actionType == "players") {
    await gamesRef.child(gamecode).child("players").set(data);
  } else if (actionType == "gamePhase") {
    await gamesRef.child(gamecode).child("gamePhase").set(data);
  } else if (actionType == "lastAnswer") {
    await gamesRef
      .child(gamecode)
      .child("players")
      .child(`${playerId}`)
      .child("lastAnswer")
      .set(data);
  } else if (actionType == "gameStarted") {
    await gamesRef.child(gamecode).child("started").set(data);
  } else if (actionType == "startingTime") {
    await gamesRef.child(gamecode).child("startingTime").set(data);
  } else if (actionType == "winners") {
    await gamesRef.child(gamecode).child("winners").set(data);
  } else if (actionType == "hostConnection") {
    await gamesRef.child(gamecode).child("hostConnection").set(data);
  }else if(actionType == 'hostId'){
    await gamesRef.child(gamecode).child('hostId').set(data)
  }
};

export const fetchData = async (
  gamecode,
  data,
  setData,
  actionType,
  playerId
) => {
  const snapshot = await chooseTypeOnce(actionType, gamecode, playerId);
  let fetchedData = snapshot.val();
  if (typeof data == "number") {
    if (typeof fetchedData == "number") {
      setData(fetchedData);
    } else {
      setData(data);
    }
  } else if (fetchedData) {
    setData(fetchedData);
  } else {
    setData(data);
  }
};

async function chooseTypeOnce(
  actionType,
  gamecode,
  playerId
) {
  if (actionType == "currentQuestion") {
    return await gamesRef
      .child(gamecode)
      .child("currentQuestion")
      .once("value");
  } else if (actionType == "time") {
    return await gamesRef.child(gamecode).child("time").once("value");
  } else if (actionType == "questionDone") {
    return await gamesRef
      .child(gamecode)
      .child("currentQuestion")
      .once("value");
  } else if (actionType == "points") {
    return await gamesRef
      .child(gamecode)
      .child("players")
      .child(`${playerId}`)
      .child("points")
      .once("value");
  } else if (actionType == "game") {
    return await gamesRef.child(gamecode).once("value");
  } else if (actionType == "shownComponent") {
    return await gamesRef
      .child(gamecode)
      .child("players")
      .child(`${playerId}`)
      .child("shownComponent")
      .once("value");
  } else if (actionType == "players") {
    return await gamesRef.child(gamecode).child("players").once("value");
  } else if (actionType == "gamePhase") {
    return await gamesRef.child(gamecode).child("gamePhase").once("value");
  } else if (actionType == "currentQuestionIndex") {
    return await gamesRef
      .child(gamecode)
      .child("currentQuestion")
      .once("value");
  } else if (actionType == "lastAnswer") {
    return await gamesRef
      .child(gamecode)
      .child("players")
      .child(`${playerId}`)
      .child("lastAnswer")
      .once("value");
  } else if (actionType == "startingTime") {
    return await gamesRef.child(gamecode).child("startingTime").once("value");
  } else if (actionType == "winners") {
    return await gamesRef.child(gamecode).child("winners").once("value");
  } else if (actionType == "hostConnection") {
    return await gamesRef.child(`${gamecode}/hostConnection`).once("value");
  } else if (actionType == "hostShowing") {
    return await gamesRef.child(gamecode).child("hostShowing").once("value");
  }else if(actionType == 'hostId'){
    return await gamesRef.child(gamecode).child('hostId').once(data)
  }
}