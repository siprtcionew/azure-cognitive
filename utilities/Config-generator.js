const sdk = require('microsoft-cognitiveservices-speech-sdk');

class ConfigGenerator {
    constructor() {}

    createAudioConfigFromStream(audioData) {
        const pushStream = sdk.AudioInputStream.createPushStream();
        pushStream.write(audioData);
        pushStream.close();
        return sdk.AudioConfig.fromStreamInput(pushStream);
    }

    createAudioConfigFromWav(audioData) {
        // audioData is an instance of Buffer
        return sdk.AudioConfig.fromWavFileInput(audioData);
    }
}

module.exports = ConfigGenerator;
