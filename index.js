const express = require("express");
const cors = require("cors");

const app = express();
const http = require("http");

app.use(express.static("public"));
app.use(cors({ origin: true }));
app.use(express.json());

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const port = process.env.PORT || 5000;


io.on("connection", (socket) => {
    const players = []
  socket.on("data", (data) => {
    players.push(data)
    console.log(players);
    io.emit("changedData", players);
  });
  console.log("a user connected");
});

app.get("/", (request, response) => {
  // Return the modified data
  response.send({ result: "magiczka" });
  // response.send("Hello world");
});

app.get("/some-data", (request, response) => {
  // Return the modified data
  response.send({ result: "karoca" });
  // response.send("Hello world");
});

app.post("/some-data", (request, response) => {
  const { data } = request.body; // Assuming you're using a body-parser or similar middleware to parse the request body
  console.log(data);

  // // Modify the data
  const modifiedData = data.toUpperCase();

  // Return the modified data
  response.send({ result: modifiedData });
  // response.send("Hello world");
});

server.listen(port, () => console.log("dzialam"));
