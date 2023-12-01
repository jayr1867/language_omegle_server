require("dotenv").config();

const recorder = require('node-record-lpcm16');
const speech = require('@google-cloud/speech');
const pcmUtil = require('pcm-util');
const ffmpeg = require('ffmpeg');

const client = new speech.SpeechClient();

const { translateText } = require("./translate");

const options = {
  from: 'en',
  to: 'gu'
};

// var transText;

const encoding = 'LINEAR16';
const sampleRateHertz = 16000;
const languageCode = 'en-US';

const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
  },
  interimResults: false, // If you want interim results, set this to true
};


 async function getAudioData(audioData, buf) {



        // console.log(audioData)
    
    // const linear16Buffer = new Uint16Array(audioData).buffer;
    // const [response] = await client.streamingRecognize().
    const stream =  await client.streamingRecognize(request, audioData)

    // // stream.write(audioData);

    // const requestWithAudio = {
    //     ...request,
    //     audioContent: audioData.toString('base64'),
    // };

    // stream.write(requestWithAudio);
    
    .on('data', (data) => process.stdout.write(
        data.results[0] && data.results[0].alternatives[0]
          ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
          : '\n\nReached transcription time limit, press Ctrl+C\n'
      ))
    .on('error', () => { console.error })
    .on('end', () => { console.log("WORKS!!!!") });

    // .write(audioData);

    // stream.write({ audioContent: audioData });
    // audioData.pipe(stream);
    
    // return await response.results[0].alternatives[0].transcript
}


// Create a recognize stream
const recognizeStream = client
  .streamingRecognize(request)
  .on('error', console.error)
  .on('data', async data => {
    try {
        transText = (await translateText(data.results[0].alternatives[0].transcript, options))
    } catch (error) {
        // console.err(error);
        throw error;
    }
  });

// Start recording and send the microphone input to the Speech API.
// Ensure SoX is installed, see https://www.npmjs.com/package/node-record-lpcm16#dependencies
function recording() {
    recorder
    .record({
        sampleRateHertz: sampleRateHertz,
        threshold: 0,
        // Other options, see https://www.npmjs.com/package/node-record-lpcm16#options
        verbose: false,
        recordProgram: 'rec', // Try also "arecord" or "sox"
        silence: '10.0',
    })
    .stream()
    .on('error', console.error)
    .pipe(recognizeStream)

    console.log('Listening, press Ctrl+C to stop.');
}

function stopRecording() {
    if (recorder){
        // recorder.unpipe(recognizeStream); 
        recognizeStream.end();
        recorder.close();
    }
}

function sendTrans() {
    return transText
}





module.exports = {
    recording,
    stopRecording,
    sendTrans,
    getAudioData,
    recognizeStream
}



