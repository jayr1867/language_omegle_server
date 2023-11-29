const express = require("express");
const app = express();
const cors = require("cors");
const port = 5000;
const { findOrCreateRoom, getAccessToken } = require("./util/twilioFunc");


const { WebSocketServer } = require("ws");
const wss = new WebSocketServer({ server: app.listen(port, () => {
    console.log(`Express server running on port ${port}`);
  })
});

// use the Express JSON middleware
app.use(cors());
app.use(express.json());


wss.on('connection', function connection(ws, req) {
  ws.on('message', function message(data) {
    console.log('received: %s', data);
    ws.send('sending back: ' + data);
  });

  console.log(wss.clients.size);
  ws.send('something');
});

app.post("/join-room", async (req, res) => {
  // return 400 if the request has an empty body or no roomName
  if (!req.body || !req.body.roomName) {
    return res.status(400).send("Must include roomName argument.");
  }
  const roomName = req.body.roomName;
  // find or create a room with the given roomName
  findOrCreateRoom(roomName);
  // generate an Access Token for a participant in this room
  const token = getAccessToken(roomName);
  res.send({
    token: token,
  });
});
