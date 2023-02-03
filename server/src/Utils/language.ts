import * as fs from 'fs';
import * as path from 'path';

class Translator {
    private translation : any;
    public filePath : string;

    constructor(translationFilePath : string) {

        // Load translation file
        if(!fs.existsSync(translationFilePath)) throw new Error(`Translation file not found: ${translationFilePath}`);

        try {
            let translation = JSON.parse(fs.readFileSync(translationFilePath).toString('utf8'));
            this.translation = translation;
        } catch(error) {
            throw new Error('Invalid translation file!');
        }

        this.filePath = path.dirname(translationFilePath);
    }

    public getPhrase(id : string, lang : string, ...args : string[]) {
        let phrase = this.translation.find((p : any) => p.id == id);

        if(!phrase) throw new Error(`Phrase with id ${id} not found.`);

        let translation;

        try {
            translation = phrase.translations[lang];
        } catch (err) {
            throw new Error(`Phrase thranslation into ${lang} not found.`);
        }

        if(args.length === 0) return translation;

        for(let i = 0; i < args.length; i++) translation.replace('{}', args[i]);

        return translation;
    }
}

export function createTranslator(translationFilePath : string) : Translator {
    return new Translator(translationFilePath);
}