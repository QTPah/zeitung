import * as fs from "fs";
import * as path from "path";


export class Blacklist {
    private list : string[];
    public filePath : string;

    constructor(blacklistFilePath : string) {
        if(!fs.existsSync(blacklistFilePath)) throw new Error(`Blacklist file not found: ${blacklistFilePath}`);

        try {
            let list = JSON.parse(fs.readFileSync(blacklistFilePath).toString('utf8'));
            this.list = list;
        } catch(error) {
            throw new Error('Invalid blacklist file!');
        }

        this.filePath = blacklistFilePath;
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