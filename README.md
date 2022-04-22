# azure-cognitive
## Introduction
**azure-cognitive** is a collection of nodes that perform text-to-speech(tts), speech-to-text(stt), speech translation and speaker recognition from [Microsoft Azure Cognitive Services](https://azure.microsoft.com/en-us/services/cognitive-services/#api).
## Installation
`npm install @intres/azure-cognitive`
## Example usage (combinations of text-to-speech, speech-to-text and speech translation)
The example flow is as follows:
![Example flow](https://github.com/uwtintres/azure-cognitive/blob/main/img/upload/example-flow.png?raw=true)
In this example, Inject node injects a string of Japanese "みんなで行きましょう。" to text-to-speech node. The text-to-speech node will convert it to English and send the speech
binary content to both speech-to-text and translation node.

#### Config of text-to-speech-node
![text-to-speech](https://github.com/uwtintres/azure-cognitive/blob/main/img/upload/text-to-speech.png?raw=true)
