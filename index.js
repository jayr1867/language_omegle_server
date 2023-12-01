const express = require("express");
const app = express();
const cors = require("cors");
const port = 5000;
const { findOrCreateRoom, getAccessToken } = require("./util/twilioFunc");
const stt = require("./util/STT");

let audBuf = new Uint8Array();

const fs = require('fs');

const { WebSocketServer } = require("ws");
// const { TIMEOUT } = require("dns"); 
const wss = new WebSocketServer({ server: app.listen(port, () => {
    console.log(`Express server running on port ${port}`);
  })
});

// use the Express JSON middleware
app.use(cors());
app.use(express.json());



wss.on('connection', function connection(ws, req) {
  console.log('connected');
  // let i = 0;
  ws.on('message', async function message(data) {
    // console.log(JSON.parse(data)) 
    // console.log((data.toString('utf-8')));
    const blob = new Blob([data], { type: 'audio/wav' });
    // await stt.getAudioData(blob.stream().pipeTo(stt.recognizeStream));
    console.log(blob.stream())
  });

  // stt.recording();
 
  // console.log(wss.clients.size);
  // ws.send(stt.recording());

  ws.on('close', () => {
    // stt.stopRecording();
    console.log('disconnected');
  });
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





const wav = require('wav');

function saveAudioBufferToWav(audioBuffer, outputPath, sampleRate) {
  const writer = new wav.FileWriter(outputPath, {
    channels: 1,            // 1 for mono, 2 for stereo
    sampleRate: sampleRate, // e.g., 44100 Hz
    bitDepth: 16,           // 16-bit PCM audio
  });

  // Convert Uint16Array to Buffer
  const buffer = Buffer.from(audioBuffer.buffer);

  // Write the audio buffer data to the WAV file
  writer.write(buffer);

  // Close the WAV file writer
  writer.end();

  console.log(`Audio saved to ${outputPath}`);
}
// Example usage





function concatenateBuffers(buffer1, buffer2) {
  const result = new Uint8Array(buffer1.length + buffer2.length);
  result.set(buffer1, 0);
  result.set(buffer2, buffer1.length);
  return result;
}


function convertAudioToLinear16(uint8ArrayBuffer) {
  const int8ArrayBuffer = new Int8Array(uint8ArrayBuffer);
  const int16ArrayBuffer = new Int16Array(int8ArrayBuffer.length);

  for (let i = 0; i < int8ArrayBuffer.length; i++) {
    int16ArrayBuffer[i] = int8ArrayBuffer[i] * 256;
    // console.log(int16ArrayBuffer[i]);
  }

  return int16ArrayBuffer;
}
