require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const { Server } = require("socket.io");
const speech = require('@google-cloud/speech');
const { Translate } = require('@google-cloud/translate').v2;

const translate = new Translate();

const port = 5000;

const { findOrCreateRoom, getAccessToken } = require("./util/twilioFunc");
const stt = require("./util/STT");
const { tranlateText } = require("./util/translate");

// use the Express JSON middleware
app.use(cors());
app.use(express.json());

const server = require('http').createServer(app);
const sockio = require('socket.io');

server.listen(port, () => {
  console.log("listening on port: " + port);
});

const io = sockio(server, {
  cors: {
    // origin: 'http://localhost:5173',
    methods: ["GET", "POST"],
  }
}); 



const speechClient = new speech.SpeechClient();

const rooms = {};

io.on('connection', (socket) => {
  let recognizeStream = null;
  console.log('connected: ' + socket.id);

  socket.on('query', (data) => {
    socket.join(data.roomName);
    const roomName = data.roomName;

    if (!rooms[roomName]) {
      rooms[roomName] = [];
    }

    rooms[roomName].push({ STT: data.sttLang, fromLang: data.transLang, toLang:'', socketId: socket.id });
  });

  //send message to client
  
  socket.on('disconnect', () => {
    console.log("disconnected: " + socket.id);
  });
  
  // socket.on("send_message", (message) => {
  //   // console.log("message: " + message);
  //   setTimeout(() => {
  //     io.emit("receive_message", "got this message" + message);
  //   }, 1000);
  // });

  socket.on("startGoogleCloudStream", function (data) {
    // console.log(data);
    startRecognitionStream(this, data);

  });

  socket.on("endGoogleCloudStream", function (data) {
    // console.log("** ending google cloud stream **\n");
    stopRecognitionStream();

    if (rooms[data]) {
      if (rooms[data].length === 2) {
        rooms[data] = rooms[data].filter((client) => {
          if (client.socketId === socket.id) {
            return false; // Remove the disconnected client
          }
          return true;
        });
      } else {
        delete (rooms[data]);
      }
    }
  });

  socket.on("send_audio_data", async (audioData) => {
    io.emit("receive_message", "Got audio data");
    if (recognizeStream !== null && !recognizeStream.destroyed) {
      try {
        recognizeStream.write(audioData.audio);
      } catch (err) {
        console.log("Error calling google api " + err);
      }
    } else {
      socket.emit("receive_message", "RecognizeStream is null");
      // console.log("RecognizeStream is null");
    }
  });

  async function startRecognitionStream(client, data) {
    // console.log("* StartRecognitionStream\n");
    roomName = data.roomName;
    sttLang = data.sttLang;
    fromLang = data.transLang;

    let toLang;



    const request = {
      config: {
        encoding: encoding,
        sampleRateHertz: sampleRateHertz,
        languageCode: sttLang,
      },
      interimResults: true,
    };


    if (rooms[roomName].length === 2) {
      rooms[roomName][0].toLang = rooms[roomName][1].fromLang;
      rooms[roomName][1].toLang = rooms[roomName][0].fromLang;
    }



    try {
      recognizeStream = speechClient
        .streamingRecognize(request)
        .on("error", console.error)
        .on("data", async (data) => {
          const result = data.results[0];
          const isFinal = result.isFinal;

          const transcription = data.results
            .map((result) => result.alternatives[0].transcript)
            .join("\n");

          // console.log(`Transcription: `, transcription);

          let clientid;
          if (rooms[roomName]) {
            if (rooms[roomName].length === 2) {
              for (const client of rooms[roomName]) {
                if (client.socketId === socket.id) {
                  fromLang = client.fromLang;
                  toLang = client.toLang;
                  // break;
                } else {
                  clientid = client.socketId;
                }
              }

              if (toLang === fromLang) {
                client.emit("receive_audio_text", {
                  text: transcription,
                  final: isFinal,
                });
              } else {

                const options = {
                  from: fromLang,
                  to: toLang,
                };
                
                // console.log(options)

                const trans = await translate.translate(transcription, options);

                io.to(clientid).emit("receive_audio_text", {
                
                // client.emit("receive_audio_text", {
                  text: trans[0],
                  // text: transcription,
                  final: isFinal,
                });
              }
            }
          }
        });
    } catch (err) {
      console.error("Error streaming google api " + err);
    }
  }

  function stopRecognitionStream() {
    if (recognizeStream) {
      // console.log("* StopRecognitionStream \n");
      recognizeStream.end();
    }
    recognizeStream = null;
  }
});


app.post("/join-room", async (req, res) => {
  // console.log("join-room")
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


const encoding = "LINEAR16";
const sampleRateHertz = 16000;

