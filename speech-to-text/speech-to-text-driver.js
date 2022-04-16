const sdk = require('microsoft-cognitiveservices-speech-sdk');
const path = require('path');
const fs = require('fs');

class SpeechToTextDriver {
    #node;
    #key;
    #region;

    constructor(node, key, region) {
        this.#node = node;
        this.#key = key;
        this.#region = region;
        this.INPUT_MODE  = {
            file: 'file',
            payload: 'payload',
        };
        this.OUTPUT_MODE = {
            file: 'file',
            payload: 'payload',
        };
    }

    createSpeechConfig() {
        return sdk.SpeechConfig.fromSubscription(this.#key, this.#region);
    }

    createAudioConfig(pushStream) {
        return sdk.AudioConfig.fromStreamInput(pushStream);
    }

    createSpeechRecognizer(outputMode, speechConfig, audioConfig) {
        return outputMode === this.OUTPUT_MODE.file
            ? new sdk.SpeechRecognizer(speechConfig)
            : new sdk.SpeechRecognizer(speechConfig, audioConfig);
    }

    async performStt({ outputMode, textFilePath, audioData }) {
        if (!(audioData instanceof ArrayBuffer)) throw new Error('audioData should be an instance of ArrayBuffer');

        // Check output mode = file restriction
        if (outputMode === this.OUTPUT_MODE.file) {
            if (!textFilePath || !path.isAbsolute(textFilePath)) throw new Error('Text file path must be a string of an absolute path to local file system');
            if (!path.extname(textFilePath)) throw new Error('Text file path must contain a valid file name with extension');
        }

        const pushStream = sdk.AudioInputStream.createPushStream();
        pushStream.write(audioData);
        pushStream.close();
        const speechConfig = this.createSpeechConfig();
        const audioConfig = this.createAudioConfig(pushStream);
        const recognizer = this.createSpeechRecognizer(outputMode, speechConfig, audioConfig);

        return new Promise((resolve, reject) => {
            recognizer.recognizeOnceAsync(result => {
                const { reason, errorDetails, language, text } = result;
                console.log(result);
                recognizer.close();

                if (reason !== sdk.ResultReason.RecognizedSpeech) reject(`SST is cancelled with ${errorDetails}`);

                if (outputMode === this.OUTPUT_MODE.file) resolve(`TTS succeeded`);
                else resolve({ language, text });
            }, (err) => {
                this.#node.warn(err);
                recognizer.close();
                reject(err);
            });
        });
    }

    async SttFromPayload(options) {
        if (!options.audioData) throw new Error('msg.payload must not be empty if input mode is "payload"');
        let formattedAudioData = options.audioData;
        // Check binary format
        if (!(formattedAudioData instanceof ArrayBuffer) && !(formattedAudioData instanceof Buffer)) throw new Error('msg.payload must be an instance of either ArrayBuffer or Buffer(NodeJS) class');
        // Refer to underlying ArrayBuffer of the Buffer
        if (formattedAudioData instanceof Buffer) formattedAudioData = formattedAudioData.buffer;

        return this.performStt({ ...options, audioData: formattedAudioData });
    }

    async SttFromFile(options) {
        if (!options.audioFilePath || !path.isAbsolute(options.audioFilePath)) throw new Error('Audio file path must be a string of an absolute path to local file system');
        // Read files
        const text = fs.readFileSync(options.textFilePath, 'utf8');
        return this.performStt({ ...options, text });
    }

    async run(options) {
        try {
            if (options.inputMode === this.INPUT_MODE.payload) {
                return await this.SttFromPayload(options);
            }
            return await this.SttFromFile(options);
        } catch (e) {
            throw e;
        }
    }
}

module.exports = SpeechToTextDriver;
