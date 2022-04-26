const TextToSpeechDriver = require('./text-to-speech-driver');

module.exports = function(RED) {
    function textToSpeech(config) {
        RED.nodes.createNode(this, config);
        const textToSpeechDriver = new TextToSpeechDriver(this, this.credentials.key, this.credentials.region);
        this.on('input', async (msg) => {
            try {
                const options = {
                    textFilePath: config.textFilePath,
                    audioFilePath: config.audioFilePath,
                    inputMode: config.inputMode,
                    outputMode: config.outputMode,
                    synthesisVoice: config.synthesisVoice || 'en-US-JennyNeural',
                    text: msg.payload,
                };
                const res = await textToSpeechDriver.run(options);
                this.send({ payload: res });
            } catch (e) {
                // Clear status in the node
                this.status({});
                // Send error to catch node, original msg object must be provided
                this.error(e.message, msg);
            }
        });
    }

    RED.nodes.registerType("ms-text-to-speech", textToSpeech, {
        credentials: {
            key: { type: 'password' },
            region: { type: 'text' }
        },
    });
}
