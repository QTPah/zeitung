import * as fs from 'fs';
import * as path from 'path';

export const VERSION = "1.0.0";

export interface LoggerOptions {
    applicationName : string,
    logsPath : string,
    maxLogFiles : number,
    /**
     * the format each log should have. Here is a list of elements a format could/should have:
     *      TIME_HMS : The time in Hours:Minutes:Seconds;
     *      LOG      : The log text given;
     *      DIVISION : The division the log was created by;
     *      DATE_MDY : The current date in Month:Day:Year;
     *      DATE:DMY : The current date in Day:Month:Year;
     */
    format : string
}

const LOG_FORMAT_ELEMENTS = ['TIME_HMS', 'LOG', 'DIVISION', 'DATE_MDY', 'DATE_DMY'];

class Logger {
    private options : LoggerOptions;

    constructor(options : LoggerOptions) {
        this.options = options;

        this.setUpLogs();
    }

    private setUpLogs() {
        if(!fs.existsSync(this.options.logsPath)) fs.mkdirSync(this.options.logsPath);
        if(fs.existsSync(path.join(this.options.logsPath, 'log.log'))) {
            const DATE = new Date();
            fs.renameSync(path.join(this.options.logsPath, 'log.log'), path.join(this.options.logsPath, `${Date.now()}.${DATE.getHours()}-${DATE.getMinutes()}-${DATE.getSeconds()}.${DATE.toISOString().slice(0, 10)}.log`));

            // If there are more log files than max
            if(fs.readdirSync(this.options.logsPath).length > this.options.maxLogFiles) {
                let files = fs.readdirSync(this.options.logsPath);

                // Sort files oldest to newest
                files = files.sort((a, b) => parseInt(b.split('.')[0]) - parseInt(a.split('.')[0]));

                // Delete oldest files exeeding the max amount of logs
                for(let i = this.options.maxLogFiles; i < files.length; i++) {
                    fs.unlinkSync(path.join(this.options.logsPath, files[i]));
                }
            }
        };

        // Initialize new log file
        fs.writeFileSync(path.join(this.options.logsPath, 'log.log'), `Logger v${VERSION} ${this.options.applicationName} ${new Date().toISOString()}\n\n`)
    }

    /**
     * 
     * @param text The text you want logged
     */
    public log(text : string, division : string) {

        let log = this.options.format.toString();

        LOG_FORMAT_ELEMENTS.forEach((formatElement) => {
            log = log.replace(`{${formatElement}}`, (() : string => {
                const DATE = new Date();

                switch(formatElement) {
                    case 'TIME_HMS' : 
                        return `[${DATE.getHours()}:${DATE.getMinutes()}:${DATE.getSeconds()}]`;
                    case 'LOG': 
                        return text;
                    case 'DIVISION':
                        return `[${division}]`;
                    case 'DATE_DMY': 
                        return `[${DATE.getDay()}.${DATE.getMonth()}.${DATE.getFullYear()}]`;
                    case 'DATE_MDY': 
                        return `[${DATE.getMonth()}.${DATE.getDay()}.${DATE.getFullYear()}]`;
                    default: 
                        process.stderr.write(`Logger Log Format Element '${formatElement}' not handled. \n`);
                        return '';
                }
            })())
        });

        log += '\n';

        process.stdout.write(log);

        fs.appendFile(path.join(this.options.logsPath, 'log.log'), log, err => {
            if(err) {
                this.setUpLogs();
            }
        });
    }

}

export function createLogger(options : LoggerOptions) : Logger {
    return new Logger(options);
}