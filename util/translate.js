require("dotenv").config();

const { Translate } = require('@google-cloud/translate').v2;
const translate = new Translate();

async function translateText(text, options) {
    // Translates the text into the target language. "text" can be a string for
    // translating a single piece of text, or an array of strings for translating
    // multiple texts.
    console.log("Transcription: " + text);
    let [translations] = await translate.translate(text, options);
    translations = Array.isArray(translations) ? translations : [translations];
    console.log('Translations:');
    translations.forEach((translation, i) => {
        const trans = `(${options.to}) ${translation}`;
        console.log(trans);
        return text + '\n' + trans;
    });
}


module.exports = {
    translateText
}
