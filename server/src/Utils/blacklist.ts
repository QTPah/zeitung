import * as fs from "fs";
import * as path from "path";


export class Blacklist {
    private list : string[];
    public filePath : string;

    constructor(blacklistFilePath : string) {
        if(!fs.existsSync(path.join(__dirname, blacklistFilePath))) throw new Error(`Blacklist file not found: ${path.join(__dirname, blacklistFilePath)}`);

        try {
            this.list = JSON.parse(fs.readFileSync(path.join(__dirname, blacklistFilePath)).toString('utf8'));
        } catch(error) {
            throw new Error('Invalid blacklist file!');
        }

        this.filePath = path.join(__dirname, blacklistFilePath);
    }

    public isBlacklisted(email : string) {
        let list = JSON.parse(fs.readFileSync(this.filePath).toString('utf8'));
        return list.includes(email);
    }

    public blacklist(email : string) {
        if(this.isBlacklisted(email)) return;

        this.list.push(email);
        this.save();
    }

    public unblacklist(email : string) {
        if(!this.isBlacklisted(email)) return;

        this.list = this.list.filter((i : string) => i != email);
        this.save();
    }

    private save() {
        fs.writeFileSync(path.join(this.filePath), JSON.stringify(this.list));
    }

    public static instance : Blacklist;
}