# azure-cognitive
## Introduction
**azure-cognitive** is a collection of nodes that perform text-to-speech(tts), speech-to-text(stt), speech translation and speaker recognition from [Microsoft Azure Cognitive Services](https://azure.microsoft.com/en-us/services/cognitive-services/#api).
## Installation
`npm install @intres/azure-cognitive`
## Example usage (combinations of text-to-speech, speech-to-text and speech translation)
The example flow is as follows:

![Example flow](https://github.com/uwtintres/azure-cognitive/blob/main/img/example-flow.png?raw=true)

In this example, Inject node injects a string of Japanese "みんなで行きましょう。" to text-to-speech node. The text-to-speech node will convert it to English and send the speech
binary content to three nodes: an audio out node from **node-red-ui**, speech-to-text and translation node.

#### Config of text-to-speech node
![text-to-speech](https://github.com/uwtintres/azure-cognitive/blob/main/img/text-to-speech.png?raw=true)

The node accepts the text to be converted to speech by `msg.payload` when **input mode** is set to **payload**. For the list of supported synthesis voice, please check the official [supported languages and voices](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support?tabs=speechtotext#text-to-speech)
for more information. In this example, ja-JP-NanamiNeural is used. Note that mistyping voice name could lead to uncertain errors(check the bottom section).

#### Config of speech-to-text node
![speech-to-text](https://github.com/uwtintres/azure-cognitive/blob/main/img/speech-to-text.png?raw=true)

The config of speech-to-text node is similar to text-to-speech. Here the node will accept a speech binary content by `msg.payload`, try to recognize the speech using Japanese(we set **From language** to ja-JP) and output a string of recognized text as `msg.payload`.
For all supported languages and its locale variants, check the link in the above section for more information. You should be able to see the recognized text in the debug sidebar, and it should be the same as the text we fired from Inject node
in the beginning.

#### Config of translation node
![translation](https://github.com/uwtintres/azure-cognitive/blob/main/img/translation.png?raw=true)

The translation node accepts a speech binary content as 