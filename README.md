# azure-cognitive
## Introduction
**azure-cognitive** is a collection of nodes that perform text-to-speech(tts), speech-to-text(stt), speech translation from [Microsoft Azure Cognitive Services](https://azure.microsoft.com/en-us/services/cognitive-services/#api).
### Installation
`npm install @intres/azure-cognitive`

### About us
The [Internet of Things Research (INTRES) Group](https://github.com/UWTINTRES)
at the University of Washington Tacoma (UWT) developed and maintains this package to promote Internet of Things (IoT) research and teaching. This package seeks to accelerate the adoption of IoT concepts by developing a simple mechanism to increase the productivity of researchers, software engineers, developers, and data scientists.

### Example usage (combinations of text-to-speech, speech-to-text and speech translation)
The example flow is as follows:

![Example flow](https://github.com/uwtintres/azure-cognitive/blob/main/img/example-flow.png?raw=true)

In this example, Inject node injects a string of Japanese "みんなで行きましょう。" to text-to-speech node. The text-to-speech node will convert it to speech
binary content and send it to three nodes: an audio out node from **node-red-ui**, speech-to-text and translation node.

#### Config of text-to-speech node
![text-to-speech](https://github.com/uwtintres/azure-cognitive/blob/main/img/text-to-speech.png?raw=true)

The node accepts the text to be converted to speech by `msg.payload` when **input mode** is set to **payload**. For the list of supported synthesis voice, please check the official [supported languages and voices](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support?tabs=speechtotext#text-to-speech)
for more information. In this example, ja-JP-NanamiNeural is used. The node outputs the binary content of recognized speech as `msg.paylad` and send it to nodes after.
Note that mistyping voice name could lead to uncertain errors(check the bottom section).

#### Config of speech-to-text node
![speech-to-text](https://github.com/uwtintres/azure-cognitive/blob/main/img/speech-to-text.png?raw=true)

The config of speech-to-text node is similar to text-to-speech. Here the node will accept a speech binary content by `msg.payload`, try to recognize the speech using Japanese(we set **From language** to ja-JP) and output a string of recognized text as `msg.payload`.
For all supported languages and its locale variants, check the link in the above section for more information. You should be able to see the recognized text in the debug sidebar, and it should be the same as the text we fired from Inject node
in the beginning.

#### Config of translation node
![translation](https://github.com/uwtintres/azure-cognitive/blob/main/img/translation.png?raw=true)

The translation node accepts a speech binary content by `msg.payload`. It uses **From language** specified to translate the given speech content to text in languages specified in **To languages**. **To languages** can be
a single language or multiple languages separated by commas. The node will output translated texts as an array by `msg.payload`.

For this example, translate node outputs following translated texts(in en-US and zh-Hant) from the "みんなで行きましょう。" speech content, which is sent from text-to-speech node.

![translation-output](https://github.com/uwtintres/azure-cognitive/blob/main/img/translation-output.png?raw=true)


## Potential Errors
In some services, the following error might occur due to language config error:

![Language errors](https://github.com/uwtintres/azure-cognitive/blob/main/img/language-error.png?raw=true)

The error occurs mostly because MS cognitive services failed to recognize the language options we provide. For example, if we change **From language** in speech-to-text node from **ja-JP** to only **ja**, the services will fail to
recognize the language and hence return this error. The general rule of thumb is that the locale part of the language should always be provided, i.e. using **lang-locale** format like **en-US**, **ja-JP** instead of only **en**, **ja**.

#### Disclaimer
INTRES and UWT are not responsible for the usage or utilization of these packages. They are meant to promote IoT research and education. IoT service providers may require additional verification steps to utilize the features outlined in these packages. We are not in any way responsible for the misuse of these packages. For more details on the service agreement and terms, please click [here](https://azure.microsoft.com/en-us/support/legal/).
