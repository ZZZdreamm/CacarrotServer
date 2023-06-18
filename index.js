import express, { text } from "express";
import cors from "cors";
import http from "http";
import createJWTToken from "./JWTToken.js";
import { dbRef, gamesRef } from "./FirebaseCacarrot/FirebaseConfig.js";
import {
  calculatePointsForAnswer,
  getGame,
  joinGame,
  setDataInDB,
  setPointsForPlayer,
  getGameOn,
} from "./FirebaseCacarrot/GamesInDB.js";
import { Server } from "socket.io";
import { loginInDB, registerInDb } from "./FirebaseCacarrot/Authentication.js";
import { getPlayer } from "./Utilities/PlayerGet.js";
import { timers } from "./Utilities/Timer.js";
import { useBonus } from "./Utilities/GameFunctions.js";
import {
  loginInSocial,
  registerInSocial,
} from "./FirebaseSocial/Authentication.js";
import {
  AcceptFriendRequest,
  changeProfileImage,
  checkIfInFriends,
  getChatMessages,
  getComments,
  getFriendRequests,
  getFriends,
  getPosts,
  getSentFriendRequests,
  getUser,
  getUserPosts,
  ifUserLiked,
  likePost,
  postPost,
  putComment,
  removeFriend,
  removeFriendRequest,
  removeLike,
  searchUsers,
  sendFriendRequest,
  sendMessage,
} from "./FirebaseSocial/SocialFunctions.js";
import { roomsFirestore } from "./FirebaseSocial/FirebaseConfig.js";

export const app = express();

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

  socket.on("host-reconnect", (data) => {
    if (data.code) {
      gamecode = data.code;
      host = data.hostId;
      setDataInDB(gamecode, true, "hostConnection");
    }
  });

  socket.on("host", (data) => {
    if (data.code) {
      gamecode = data.code;
      host = data.hostId;
      gamesRef.child(gamecode).on("value", (snapshot) => {
        const gameVal = snapshot.val();
        if (gameVal) {
          game = gameVal;
        }
      });
    }
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
    if (gamecode) {
      game = await getGame(gamecode);
      const playerId = await joinGame(gamecode, {
        id: 0,
        name: data.playerName,
        points: 0,
        shownComponent: "answers",
        answers: [],
      });
      console.log(`joined/${gamecode}/${data.socketId}`);
      socket.emit(`joined/${gamecode}/${data.socketId}`, {
        game: game,
        playerId: playerId,
        playerName: data.playerName,
      });
    }
  });

  socket.on("start-game", async () => {
    if (gamecode) {
      await setDataInDB(gamecode, "started", "gameStarted");
      timers(game);
    }
  });

  socket.on(`send-answer`, async (data) => {
    if (gamecode) {
      const player = getPlayer(game, data.playerName);
      let pointsForAnswer = 0;
      if (data.answer) {
        pointsForAnswer = calculatePointsForAnswer(
          data.answer,
          game,
          data.bonuses
        );
        data.answer.pointsFor = pointsForAnswer;
        await gamesRef
          .child(gamecode)
          .child("players")
          .child(`${player.id}`)
          .child("answers")
          .child(`${data.answer.questionNumber}`)
          .set(data.answer);
        await gamesRef
          .child(gamecode)
          .child("players")
          .child(`${player.id}`)
          .child("activeBonuses")
          .set(null);
      }
      const prevPoints = player.points;
      const wholePoints = prevPoints + pointsForAnswer;
      setPointsForPlayer(gamecode, data.playerName, wholePoints);
    }
  });

  socket.on("used-bonus", async (data) => {
    if (gamecode) {
      useBonus(game, data.bonusName, data.playerName, data.enemyName);
    }
  });

  socket.on("disconnect", () => {
    if (host == socket.id) {
      setDataInDB(gamecode, false, "hostConnection");
    }
  });
});

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// THERE STARTS FriendLink functionality of server

app.post("/social/login", async (req, res) => {
  const { credentials } = req.body;
  const user = await loginInSocial(credentials);
  if (user.id) {
    const token = createJWTToken(credentials);
    res.send({ token: token, user: user });
  } else {
    res.status(400).send(new Error("Invalid login or password"));
  }
});

app.post("/social/register", async (req, res) => {
  const { credentials } = req.body;
  const user = await registerInSocial(credentials);
  if (user.id) {
    const token = createJWTToken(credentials);
    res.send({ token: token, user: user });
  } else {
    res.status(400).send(new Error("There is user with that name"));
  }
});

app.post("/social/search-users", async (req, res) => {
  const { name } = req.body;
  const matchingUsers = await searchUsers(name);
  res.send({ users: matchingUsers });
});

app.post("/social/get-user", async (req, res) => {
  const { name } = req.body;
  const user = await getUser(name);
  res.send(user);
});

app.post("/social/post-post", async (req, res) => {
  const post = req.body;
  const savedPost = await postPost(post);
  res.send(savedPost);
});

app.post("/social/get-posts", async (req, res) => {
  const { numberOfPosts } = req.body;
  const posts = await getPosts(numberOfPosts);
  res.send(posts);
});

app.put("/social/like-post", async (req, res) => {
  const { postId, userId } = req.body;
  await likePost(postId, userId);
  res.status(200);
});

app.put("/social/like-post-remove", async (req, res) => {
  const { postId, userId } = req.body;
  await removeLike(postId, userId);
  res.status(200);
});

app.post("/social/user-liked-post", async (req, res) => {
  const { postId, userId } = req.body;
  const liked = await ifUserLiked(postId, userId);
  res.send(liked);
});

app.post("/social/put-comment", async (req, res) => {
  const { postId, userId, textContent, autorName, date } = req.body;
  const comment = await putComment(
    postId,
    userId,
    textContent,
    autorName,
    date
  );
  res.send(comment);
});

app.post("/social/get-comments", async (req, res) => {
  const { postId, numberOfComments } = req.body;
  const comments = await getComments(postId, numberOfComments);
  res.send(comments);
});

app.post("/social/send-friend-request", async (req, res) => {
  const { userId, friendId } = req.body;
  await sendFriendRequest(userId, friendId);
  res.status(200);
});

app.post("/social/accept-friend-request", async (req, res) => {
  const { userId, friendId } = req.body;
  const friend = await AcceptFriendRequest(userId, friendId);
  res.send(friend);
});

app.post("/social/cancel-friend-request/user", async (req, res) => {
  const { userId, friendId } = req.body;
  const deletedFriendId = await removeFriendRequest(userId, friendId);
  res.send(deletedFriendId);
});

app.post("/social/cancel-friend-request/friend", async (req, res) => {
  const { userId, friendId } = req.body;
  const deletedFriendId = await removeFriendRequest(friendId, userId);
  res.send(deletedFriendId);
});

app.post("/social/remove-friend", async (req, res) => {
  const { userId, friendId } = req.body;
  const friend = await removeFriend(userId, friendId);
  res.send(friend);
});

app.post("/social/get-friends", async (req, res) => {
  const { userId } = req.body;
  const friends = await getFriends(userId);
  res.send(friends);
});

app.post("/social/get-friend-requests", async (req, res) => {
  const { userId } = req.body;
  const friendRequests = await getFriendRequests(userId);
  res.send(friendRequests);
});

app.post("/social/get-sent-friend-requests", async (req, res) => {
  const { userId } = req.body;
  const sentFriendRequests = await getSentFriendRequests(userId);
  res.send(sentFriendRequests);
});

app.post("/social/check-if-in-friends", async (req, res) => {
  const { userId, friendId } = req.body;
  const ifInFriends = await checkIfInFriends(userId, friendId);
  res.send({ relation: ifInFriends });
});

app.put("/social/change-profile-image", async (req, res) => {
  const { userId, fileUrl } = req.body;
  await changeProfileImage(userId, fileUrl);
  res.status(200);
});

app.post("/social/get-user-posts", async (req, res) => {
  const { name, numberOfPosts } = req.body;
  const posts = await getUserPosts(name, numberOfPosts);
  res.send(posts);
});

app.post("/social/get-chat-messages", async (req, res) => {
  const { userId, friendId, numberOfMessages } = req.body;
  const messages = await getChatMessages(userId, friendId, numberOfMessages);
  res.send(messages);
});





io.on("connection", (socket) => {
  socket.on("send-message", async (message) => {
    const storedMessage = await sendMessage(message);
    socket.broadcast.emit(
      `receive-message/${message.ReceiverId}/${message.SenderId}`,
      storedMessage
    );
    socket.emit(
      `receive-message/${message.SenderId}/${message.ReceiverId}`,
      storedMessage
    );
  });


  socket.emit('me', socket.id)

  socket.on('disconnect', ()=>{
    socket.broadcast.emit("call-ended")
  })

  socket.on('send-user-id', (data) => {
    socket.broadcast.emit(`friend-id/${data.friendId}`, {callId:data.callId})
  })

  socket.on("create-join-room", async (data) => {
    socket.broadcast.emit(`calling/${data.friendId}`, data.userId);
  });
  socket.on('call-for-answer', (data) => {
    socket.broadcast.emit('signal-for-answer')
  })

  socket.on('call-user', (data)=>{
    io.to(data.userToCall).emit("call-user", {signal:data.signalData, from:data.from, name:data.name})
  })

  socket.on('answer-call', (data)=> {
    io.to(data.to).emit("call-accepted", data.signal)
  })

  socket.on('leave-call', (data) => {
    socket.to(data.friendId).emit('user-left')
  })
});

server.listen(port, async () => {});
