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

    createSpeechConfig(synthesisVoice) {
        const speechConfig = sdk.SpeechConfig.fromSubscription(this.#key, this.#region);
        speechConfig.speechSynthesisVoiceName = synthesisVoice;
        return speechConfig;
    }

    createAudioConfig(audioFilePath) {
        return sdk.AudioConfig.fromAudioFileOutput(audioFilePath);
    }

    createSpeechSynthesizer(synthesisVoice) {
        const speechConfig = this.createSpeechConfig(synthesisVoice);
        return new sdk.SpeechSynthesizer(speechConfig);
    }

    checkInputMode({ inputMode, textFilePath, text }) {
        if (inputMode === this.INPUT_MODE.payload ) {
            if (!text) throw new Error('msg.payload must not be empty if input mode is "payload"');
        } else {
            if (!textFilePath || !path.isAbsolute(textFilePath)) throw new Error('Text file path must be a string of an absolute path to local file system');
        }
    }

    checkOutputMode({ outputMode, audioFilePath }) {
        // Check output mode = file restriction
        if (outputMode === this.OUTPUT_MODE.file) {
            if (!audioFilePath || !path.isAbsolute(audioFilePath)) throw new Error('Audio file path must be a string of an absolute path to local file system');
            if (!path.extname(audioFilePath)) throw new Error('Audio file path must contain a valid file name with extension');
        }
    }

    async performTtsInternal({ outputMode, synthesisVoice, audioFilePath, text }) {
        const synthesizer = this.createSpeechSynthesizer(synthesisVoice);
        return new Promise((resolve, reject) => {
            synthesizer.speakTextAsync(text, (result) => {
                const { reason, errorDetails, audioData } = result;
                if (reason !== sdk.ResultReason.SynthesizingAudioCompleted) return reject(new Error(`TTS is cancelled with ${errorDetails}`));
                synthesizer.close();

                // Convert ArrayBuffer to Buffer using uint8 to interpret the ArrayBuffer
                const buf = Buffer.from(new Uint8Array(audioData));

                if (outputMode === this.OUTPUT_MODE.file) {
                    // Manually write binary content to file to prevent race condition
                    // If a speech-to-text node is connected and use the same file
                    // speech-to-text node will have error because ms built-in hasn't finished writing
                    fs.writeFileSync(audioFilePath, buf);
                    resolve(`TTS succeeded`);
                }
                else resolve(buf);
            }, (err) => {
                this.#node.warn(err);
                synthesizer.close();
                reject(err);
            });
        });
    }

    async performTts(options) {
        this.checkInputMode(options);
        this.checkOutputMode(options);
        const finalText = options.text || fs.readFileSync(options.textFilePath, 'utf8');
        return this.performTtsInternal({
            ...options,
            text: finalText,
        });
    }

   async run(options) {
        try {
            return await this.performTts(options);
        } catch (e) {
            throw e;
        }
    }
}

module.exports = TextToSpeechDriver;
