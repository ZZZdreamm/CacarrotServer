import express from "express";
import cors from "cors";
import http from "http";
import createJWTToken from "./JWTToken.js";
import { dbRef, gamesRef } from "./Firebase/FirebaseConfig.js";
import {
  calculatePointsForAnswer,
  getGame,
  joinGame,
  setDataInDB,
  setPointsForPlayer,
  getGameOn,
} from "./Firebase/GamesInDB.js";
import { Server } from "socket.io";
import { loginInDB, registerInDb } from "./Firebase/Authentication.js";
import { getPlayer } from "./Utilities/PlayerGet.js";
import { timers } from "./Utilities/Timer.js";

const app = express();

app.use(express.static("public"));
app.use(cors({ origin: true }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const port = process.env.PORT || 5000;

app.post("/login", async (req, res) => {
  const { credentials } = req.body;
  const user = await loginInDB(credentials);
  if (user.id) {
    const token = createJWTToken(credentials);
    res.send({ token: token, user: user });
  } else {
    res.status(400).send(new Error("Invalid login or password"));
  }
});

app.post("/register", async (req, res) => {
  const { credentials } = req.body;
  const user = await registerInDb(credentials);
  if (user.id) {
    const token = createJWTToken(credentials);
    res.send({ token: token, user: user });
  } else {
    res.status(400).send(new Error("There is user with that name"));
  }
});

io.on("connection", (socket) => {
  let game = {
    gameTemplate: {
      id: "",
      templateName: "",
      questionTime: 5,
      allQuestions: [],
    },
    players: [],
    gamecode: "",
    started: "waiting",
    currentQuestion: 0,
    time: 5,
    gamePhase: 1,
    startingTime: 3,
    winners: [],
    hostConnection: true,
    hostId: "",
  };
  let gamecode = "";
  let host = "";

  socket.on("host", (data) => {
    gamecode = data.code;
    host = data.hostId;
    gamesRef.child(gamecode).on("value", (snapshot) => {
      const gameVal = snapshot.val();
      if (gameVal) {
        game = gameVal;
      }
    });
  });

  socket.on("gamecode", (code) => {
    gamecode = code;
    gamesRef.child(gamecode).on("value", (snapshot) => {
      const gameVal = snapshot.val();
      if (gameVal) {
        game = gameVal;
      }
    });
  });

  socket.on(`player-join`, async (data) => {
    game = await getGame(gamecode);
    const playerId = await joinGame(gamecode, {
      id: 0,
      name: data.playerName,
      points: 0,
      lastAnswer: { choosenAnswer: "", sendingTime: 0, questionNumber: 1 },
      shownComponent: "answers",
    });
    socket.emit(`joined/${gamecode}/${data.socketId}`, {
      game: game,
      playerId: playerId,
      playerName: data.playerName,
    });
  });

  socket.on("start-game", async () => {
    await setDataInDB(gamecode, "started", "gameStarted");
    timers(game.gameTemplate.questionTime, game);
  });

  socket.on(`send-answer`, (data) => {
    const pointsForAnswer = calculatePointsForAnswer(data.answer, game);
    const prevPoints = getPlayer(game, data.playerName).points;
    const wholePoints = prevPoints + pointsForAnswer;
    setPointsForPlayer(gamecode, data.playerName, wholePoints);
  });

  socket.on("disconnect", () => {
    if (host == socket.id) {
      setDataInDB(gamecode, false, "hostConnection");
    }
  });
});

server.listen(port, async () => {
});
