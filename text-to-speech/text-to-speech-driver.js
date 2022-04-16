const sdk = require('microsoft-cognitiveservices-speech-sdk');
const path = require('path');
const fs = require('fs');

class TextToSpeechDriver {
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

    createSpeechConfig(synthesisLanguage, synthesisVoiceName) {
        const speechConfig = sdk.SpeechConfig.fromSubscription(this.#key, this.#region);
        speechConfig.speechSynthesisLanguage = synthesisLanguage;
        speechConfig.speechSynthesisVoiceName = synthesisVoiceName;
        return speechConfig;
    }

    createAudioConfig(audioFilePath) {
        return sdk.AudioConfig.fromAudioFileOutput(audioFilePath);
    }

    createSpeechSynthesizer({ outputMode, audioFilePath, synthesisVoice }) {
        // Currently support en-US only
        const synthesisLanguage = 'en-US';
        const speechConfig = this.createSpeechConfig(synthesisLanguage, synthesisVoice);
        if (outputMode === this.OUTPUT_MODE.file) {
            const audioConfig = this.createAudioConfig(audioFilePath);
            return new sdk.SpeechSynthesizer(speechConfig, audioConfig);
        } else return new sdk.SpeechSynthesizer(speechConfig);
    }

    async performTts({ outputMode, synthesisVoice, audioFilePath, text }) {
        // Check output mode = file restriction
        if (outputMode === this.OUTPUT_MODE.file) {
            if (!audioFilePath || !path.isAbsolute(audioFilePath)) throw new Error('Audio file path must be a string of an absolute path to local file system');
            if (!path.extname(audioFilePath)) throw new Error('Audio file path must contain a valid file name with extension');
        }
        const synthesizer = this.createSpeechSynthesizer({ outputMode, audioFilePath, synthesisVoice });
        return new Promise((resolve, reject) => {
            synthesizer.speakTextAsync(text, (result) => {
                const { reason, errorDetails, audioData } = result;
                synthesizer.close();
                if (reason !== sdk.ResultReason.SynthesizingAudioCompleted) reject(`TTS is cancelled with ${errorDetails}`);

                // Convert ArrayBuffer to Buffer using uint8 to interpret the ArrayBuffer
                if (outputMode === this.OUTPUT_MODE.file) resolve(`TTS succeeded`);
                else resolve(Buffer.from(new Uint8Array(audioData)));
            }, (err) => {
                this.#node.warn(err);
                synthesizer.close();
                reject(err);
            });
        });
    }

    async ttsFromPayload(options) {
        if (!options.text) throw new Error('msg.payload must not be empty if input mode is "payload"');
        return this.performTts(options);
    }

    async ttsFromFile(options) {
        if (!options.textFilePath || !path.isAbsolute(options.textFilePath)) throw new Error('Text file path must be a string of an absolute path to local file system');
        // Read files
        const text = fs.readFileSync(options.textFilePath, 'utf8');
        return this.performTts({ ...options, text });
    }

   async run(options) {
        try {
            if (options.inputMode === this.INPUT_MODE.payload) {
                return await this.ttsFromPayload(options);
            }
            return await this.ttsFromFile(options);
        } catch (e) {
            throw e;
        }
    }
}

module.exports = TextToSpeechDriver;
