const express = require("express");
const app = express();
const cors = require("cors");
const port = 5000;
const { findOrCreateRoom, getAccessToken } = require("./util/twilioFunc");

// use the Express JSON middleware
app.use(cors());
app.use(express.json());

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

// Start the Express server
app.listen(port, () => {
  console.log(`Express server running on port ${port}`);
});