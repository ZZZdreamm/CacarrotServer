
const express = require("express");
const cors = require('cors')
const server = express();
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
exports.app = functions.https.onRequest(server);

server.post("/some-data", (request, response) => {
    const {data} = request.body; // Assuming you're using a body-parser or similar middleware to parse the request body
    console.log(data)

    // // Modify the data
    const modifiedData = data.toUpperCase();

    // Return the modified data
    response.send({ result: modifiedData });
    // response.send("Hello world");
});



server.listen(4000, ()=> console.log('dzialam'))
