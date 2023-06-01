import express from "express"
import cors from "cors"
import http from "http"
import createJWTToken from "./JWTToken.js"
import {dbRef} from "./Firebase/FirebaseConfig.js"

import {Server} from "socket.io"
// const express = require("express");
// const cors = require("cors");

const app = express();
// const http = require("http");

app.use(express.static("public"));
app.use(cors({ origin: true }));
app.use(express.json());

const server = http.createServer(app);
// const { Server } = require("socket.io");
// const { dbRef } = require("./Firebase/FirebaseConfig");
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
  io.on('disconnect', (socket) => {
    console.log('disconnect')
  })
});

app.post('/login', (req, res)=>{
    const {data} = req.body
    const token = createJWTToken(data)
    dbRef.child('token').set({token:token})
    res.send({token:token})
})


server.listen(port, () => console.log("dzialam"));