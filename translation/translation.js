const TranslationDriver = require('./translation-driver');

module.exports = function(RED) {
    function translation(config) {
        RED.nodes.createNode(this, config);
        const translationDriver = new TranslationDriver(this, this.credentials.key, this.credentials.region);
        this.on('input', async (msg) => {
            try {
                const options = {
                    audioFilePath: config.audioFilePath,
                    audioData: msg.payload,
                    inputMode: config.inputMode,
                    fromLanguage: config.fromLanguage,
                    toLanguages: config.toLanguages,
                };
                const res = await translationDriver.run(options);
                this.status({});
                this.send({ payload: res });
            } catch (e) {
                // Clear status in the node
                this.status({});
                // Send error to catch node, original msg object must be provided
                this.error(e.message, msg);
            }
        });
    }

    RED.nodes.registerType("ms-translation", translation, {
        credentials: {
            key: { type: 'password' },
            region: { type: 'text' }
        },
    });
}
