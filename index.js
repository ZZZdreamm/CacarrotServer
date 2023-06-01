
const express = require("express");
const cors = require('cors')
const server = express();

const port = 5001
server.use(express.static('public'))
server.use(cors({origin:true}))
server.use(express.json())


server.get("/", (request, response) => {


    // Return the modified data
    response.send({ result: "magiczka" });
    // response.send("Hello world");
});

server.get("/some-data", (request, response) => {


    // Return the modified data
    response.send({ result: "karoca" });
    // response.send("Hello world");
});

server.post("/some-data", (request, response) => {
    const {data} = request.body; // Assuming you're using a body-parser or similar middleware to parse the request body
    console.log(data)

    // // Modify the data
    const modifiedData = data.toUpperCase();

    // Return the modified data
    response.send({ result: modifiedData });
    // response.send("Hello world");
});



server.listen(port, ()=> console.log('dzialam'))
