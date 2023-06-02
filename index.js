import express from "express"
import cors from "cors"
import http from "http"
import createJWTToken from "./JWTToken.js"
import {dbRef} from "./Firebase/FirebaseConfig.js"

import {Server} from "socket.io"
import { loginInDB, registerInDb } from "./Firebase/Authentication.js"
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

app.post('/login', async (req, res)=>{
    const {credentials} = req.body
    const user = await loginInDB(credentials)
    if(user.id){
      const token = createJWTToken(credentials)
      res.send({token:token, user:user})
    }else{
      res.status(400).send(new Error("Invalid login or password"))

    }
})


app.post('/register', async (req, res)=>{
  const {credentials} = req.body
  const user = await registerInDb(credentials)
  if(user.id){
    const token = createJWTToken(credentials)
    res.send({token:token, user:user})
  }else{
    res.status(400).send(new Error("There is user with that name"))
  }
})



server.listen(port, () => console.log("dzialam"));