
export class JSConsole extends AnsiTermDriver {


    constructor(params)
    {
        super(params);

        this.pending_line = "";
        this.started = false;
        this.welcome = "\r\n\x1b[95mWelcome to JSConsole\r\nEnter a valid Javascript line\r\n\r\n";

        this.jsprompt = "\x1b[32m> ";
        this.jsanswer = "\x1b[94m== ";
        this.jserror = "\x1b[91m! ";
        this.context = {};
    }

    _start()
    {
        this._new_data(this.welcome);
        this._new_data(this.jsprompt);
        this.started = true;
    }

    _eval(code)
    {
        const keys = Object.keys(this.context);
        const values = Object.values(this.context);

        const functionBody = `
        ${keys.map((key, index) => `let ${key} = values[${index}];`).join('\n')};
        _rv_ = ${code};
        ${keys.map(key => `context['${key}'] = ${key};`).join('\n')};
        return _rv_;
        `;

        const func = new Function(JSON.stringify(this.context), 'values', functionBody);
        return func(this.context, values);
    }

    _tx(text)
    {
        for (let i = 0; i < text.length; ++i) {
            let c = text[i];
            let answer = "";
            if (c == '\r' || c == '\n') {
                this._new_data(c + '\n');
                if (this.pending_line != "") {
                    try {
                        answer = this.jsanswer + JSON.stringify(this._eval(this.pending_line));
                    } catch (err) {
                        answer = this.jserror + err.name + ": " + err.message;
                    }
                }
                this.pending_line = "";
                if (answer != "") {
                    answer += "\r\n";
                }
                this._new_data(answer + this.jsprompt);
            }
            else if (c == '\x08' || c == '\x7f') {
                if (this.pending_line != "") {
                    this._new_data('\x08 \x08');
                    this.pending_line = this.pending_line.substring(0, this.pending_line.length - 1);
                }
            }
            else {
                this.pending_line += c;
                this._new_data(c);
            }
        }
    }
}

window.JSConsole = JSConsole;
