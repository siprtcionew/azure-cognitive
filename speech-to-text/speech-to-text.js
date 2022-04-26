const SpeechToTextDriver = require('./speech-to-text-driver');

module.exports = function(RED) {
    function speechToText(config) {
        RED.nodes.createNode(this, config);
        const speechToTextDriver = new SpeechToTextDriver(this, this.credentials.key, this.credentials.region);
        this.on('input', async (msg) => {
            try {
                const options = {
                    textFilePath: config.textFilePath,
                    audioFilePath: config.audioFilePath,
                    inputMode: config.inputMode,
                    outputMode: config.outputMode,
                    fromLanguage: config.fromLanguage || 'en-US',
                    audioData: msg.payload,
                };
                const res = await speechToTextDriver.run(options);
                this.send({ payload: res });
            } catch (e) {
                // Clear status in the node
                this.status({});
                // Send error to catch node, original msg object must be provided
                this.error(e.message, msg);
            }
        });
    }

    RED.nodes.registerType("ms-speech-to-text", speechToText, {
        credentials: {
            key: { type: 'password' },
            region: { type: 'text' }
        },
    });
}
