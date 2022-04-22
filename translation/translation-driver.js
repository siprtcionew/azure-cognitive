const sdk = require('microsoft-cognitiveservices-speech-sdk');
const path = require('path');
const fs = require('fs');
const ConfigGenerator = require('../utilities/config-generator');

class TranslationDriver extends ConfigGenerator{
    #node;
    #key;
    #region;

    constructor(node, key, region) {
        super();
        this.#node = node;
        this.#key = key;
        this.#region = region;
        this.INPUT_MODE  = {
            file: 'file',
            payload: 'payload',
        };
    }

    createSpeechTranslationConfig(fromLanguage, toLanguages) {
        const speechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(this.#key, this.#region);
        speechTranslationConfig.speechRecognitionLanguage = fromLanguage;
        toLanguages.forEach(language => {
            speechTranslationConfig.addTargetLanguage(language);
        });
        return speechTranslationConfig;
    }

    createTranslationRecognizer({ inputMode, audioData, fromLanguage, toLanguages }) {
        const speechTranslationConfig = this.createSpeechTranslationConfig(fromLanguage, toLanguages);
        let audioConfig;
        if (inputMode === this.INPUT_MODE.file) audioConfig = this.createAudioConfigFromWav(audioData);
        else audioConfig = this.createAudioConfigFromStream(audioData);

        // Set recognizing event for progress report
        const recognizer = new sdk.TranslationRecognizer(speechTranslationConfig, audioConfig);
        recognizer.recognizing = this.#recognizing;
        return recognizer;
    }

    checkInputMode({ inputMode, audioFilePath, audioData }) {
        if (inputMode === this.INPUT_MODE.payload ) {
            if (!audioData) throw new Error('msg.payload must not be empty');
            if (!(audioData instanceof ArrayBuffer) && !(audioData instanceof Buffer)) throw new Error('msg.payload must be an instance of either ArrayBuffer or Buffer(NodeJS) class');
        } else {
            if (!audioFilePath || !path.isAbsolute(audioFilePath)) throw new Error('Audio file path must be a string of an absolute path to local file system');
        }
    }

    cleanLanguagesInput(fromLanguage, toLanguages) {
        fromLanguage = fromLanguage.trim();
        toLanguages = toLanguages.trim().split(',');
        const fromLanguageRegex =  /^[a-zA-Z\-]{2,}$/;
        const toLanguagesRegex =  /^[a-zA-Z\-]{2,}(\s*,\s*[a-zA-Z\-]{2,})*$/;

        if (!fromLanguageRegex.test(fromLanguage)) throw new Error('From language field must be a string of single language, ex. en-US');
        if (!toLanguagesRegex.test(toLanguages)) throw new Error('To languages field must be a string of single or multiple languages separated by comma,' +
            'ex. en-US or en-US,de-DE');

        // trim the language string, spaces will cause errors
        for (let i = 0; i < toLanguages.length; i++) {
            toLanguages[i] = toLanguages[i].trim();
        }

        return [fromLanguage, toLanguages];
    }

    async translate(options) {
        // Test language input
        [options.fromLanguage, options.toLanguages] = this.cleanLanguagesInput(options.fromLanguage, options.toLanguages);
        // Test input mode
        this.checkInputMode(options);
        const finalAudioData = options.inputMode === this.INPUT_MODE.payload
            ? options.audioData
            : fs.readFileSync(options.audioFilePath);
        if (finalAudioData.length === 0) throw new Error('The audio file provided is empty, recognition aborted');
        return this.#translateInternal({
            ...options,
            audioData: finalAudioData,
        });
    }

    async run(options) {
        try {
            return await this.translate(options);
        } catch (e) {
            throw e;
        }
    }

    async #translateInternal({ inputMode, fromLanguage, toLanguages, audioData }) {
        this.#node.status({ fill: 'green', shape: 'dot', text: 'starting' });
        const recognizer = this.createTranslationRecognizer({ inputMode, audioData, fromLanguage, toLanguages });
        return new Promise((resolve, reject) => {
            recognizer.recognizeOnceAsync(result => {
                const { reason, translations, errorDetails } = result;
                const resultTexts = [];
                recognizer.close();
                if (reason !== sdk.ResultReason.TranslatedSpeech) return reject(new Error(`TTS is cancelled with ${errorDetails}`));
                if (!translations.languages || translations.languages.length === 0) return reject(new Error('There is no translated text, something went wrong and please try again'));
                // Get translated text
                translations.languages.forEach(lang => {
                    const translatedText = result.translations.get(lang);
                    resultTexts.push({ language: lang, translatedText });
                });
                resolve(resultTexts);
            }, (err) => {
                this.#node.warn(err);
                recognizer.close();
                reject(err);
            });
        });
    }

    #recognizing(source, e) {
        this.#node.status({ fill: 'yellow', shape: 'dot', text: 'recognizing...'});
    }
}

module.exports = TranslationDriver;
