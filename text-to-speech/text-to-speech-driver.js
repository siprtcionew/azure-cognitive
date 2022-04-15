const sdk = require('microsoft-cognitiveservices-speech-sdk');
const path = require('path');

class TextToSpeechDriver {
    #node;
    #key;
    #region;

    constructor(node, key, region) {
        this.#node = node;
        this.#key = key;
        this.#region = region;
        this.INPUT_MODE  = {
            'file': '1',
            'payload': '2',
        };
        this.OUTPUT_MODE = {
            'file': '1',
            'payload': '2',
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

    createSpeechSynthesizer(speechConfig, audioConfig) {
        return new sdk.SpeechSynthesizer(speechConfig, audioConfig);
    }

    async ttsFromPayload({ outputMode, synthesisVoice, audioFilePath, text }) {
        if (!text) throw new Error('msg.payload must not be empty if input mode is "payload"');

        // Check output mode = file restriction
        if (outputMode === this.OUTPUT_MODE.file) {
            if (!audioFilePath || !path.isAbsolute(audioFilePath)) throw new Error('Audio file path must be a string of an absolute path to local file system');
            if (!path.extname(audioFilePath)) throw new Error('Audio file path must contain a valid file name with extension');
        }

        // Currently support en-US only
        const synthesisLanguage = 'en-US';
        const speechConfig = this.createSpeechConfig(synthesisLanguage, synthesisVoice);
        const audioConfig = this.createAudioConfig(audioFilePath);

        const synthesizer = this.createSpeechSynthesizer(speechConfig, audioConfig);

        return new Promise((resolve, reject) => {
            synthesizer.speakTextAsync(text, (result) => {
                const { reason, errorDetails } = result;
                synthesizer.close();

                if (reason !== sdk.ResultReason.SynthesizingAudioCompleted) reject(`TTS is cancelled with ${errorDetails}`);
                resolve(`TTS succeeded`);
            }, (err) => {
                this.#node.warn(err);
                synthesizer.close();
                reject(err);
            });
        });
    }

    async ttsFromFile({ synthesisVoice, audioFilePath, text }) {

    }

   async run(options) {
        try {
            if (options.inputMode === this.INPUT_MODE.payload) {
                return await this.ttsFromPayload(options);
            }
            return await this.ttsFromPayload(options);
        } catch (e) {
            throw e;
        }
    }
}

module.exports = TextToSpeechDriver;
