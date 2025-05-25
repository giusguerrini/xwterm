

class AnsiSoftKeyboard {

    constructor(params) {
        this.names = [
            "ESC", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "INS", "CANC", "", "",
        ];
        this.keys = {
        "": {
            1: [
                '\x1B',
                '\x1BOP', '\x1BOQ', '\x1BQR', '\x1BOS',
                '\x1B[15\x7E', '\x1B[17\x7E', '\x1B[18\x7E', '\x1B[19\x7E',
                '\x1B[20\x7E', '\x1B[21\x7E', '\x1B[23\x7E', '\x1B[24\x7E',
                '\x1B[2\x7E', '\x1B[3\x7E', '\x1B[5\x7E', '\x1B[6\x7E',
            ],

            2: [
                '\x60', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', '=', '\x08',
            ],

            3: [
                '\t', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\', '\n',
            ],

            4: [
                'CAPS', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'', '\n',
            ],

            5: [
                'SHIFT', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'SHIFT',
            ],

            6: [
                'CTRL', 'ALT', ' ', 'ALT', 'CTRL',
            ],
        },
        "SHIFT": {
            1: [
                '\x1B',
                '\x1BOP', '\x1BOQ', '\x1BQR', '\x1BOS',
                '\x1B[15\x7E', '\x1B[17\x7E', '\x1B[18\x7E', '\x1B[19\x7E',
                '\x1B[20\x7E', '\x1B[21\x7E', '\x1B[23\x7E', '\x1B[24\x7E',
                '\x1B[2\x7E', '\x1B[3\x7E', '\x1B[5\x7E', '\x1B[6\x7E',
            ],

            2: [
                '\x7E', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '\x08',
            ],

            3: [        
                '\t', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '|', '\n',
            ],

            4: [
                'CAPS', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':', '"', '\n',
            ],

            5: [
                'SHIFT', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?', 'SHIFT',
            ],

            6: [
                'CTRL', 'ALT', ' ', 'ALT', 'CTRL'
            ],
        },
        "CTRL": {
            1: [
                '\x1B',
                '\x1BOP', '\x1BOQ', '\x1BQR', '\x1BOS',
                '\x1B[15\x7E', '\x1B[17\x7E', '\x1B[18\x7E', '\x1B[19\x7E',
                '\x1B[20\x7E', '\x1B[21\x7E', '\x1B[23\x7E', '\x1B[24\x7E',
                '\x1B[2\x7E', '\x1B[3\x7E', '\x1B[5\x7E', '\x1B[6\x7E',
            ],

            2: [    
                '\x7E', '!', '@', '#', '$', '%', '\x1E', '&', '*', '(', ')', '\x1F', '+', '\x08',
            ],

            3: [        
                '\t', '\x11', '\x17', '\x05', '\x12', '\x14', '\x19', '\x15', '\x09', '\x0F', '\x10', '\x1B', '\x1D', '\x1C', '\x00',
            ],

            4: [
                'CAPS', '\x01', '\x13', '\x04', '\x06', '\x07', '\x08', '\x0A', '\x0B', '\x0C', ':', '"', '\x00',
            ],

            5: [
                'SHIFT', '\x1A', '\x18', '\x03', '\x16', '\x02', '\x0E', '\x0D', '<', '>', '?', 'SHIFT',
            ],

            6: [
                'CTRL', 'ALT', ' ', 'ALT', 'CTRL'
            ],
        },
        };

        this.div = document.createElement('div');
        this.div.className = 'softkeyboard';
        this.div.style.display = 'grid';
        this.div.style.gridTemplateColumns = 'auto';

        this.div_f = document.createElement('div');
        this.div.style.display = 'repeat(21, auto)';
        this.div.style.gridTemplateColumns = 'auto';
        this.div_n = document.createElement('div');
        this.div.style.display = 'repeat(14, auto)';
        this.div.style.gridTemplateColumns = 'auto';
        this.div_q = document.createElement('div');
        this.div.style.display = 'repeat(15, auto)';
        this.div.style.gridTemplateColumns = 'auto';
        this.div_a = document.createElement('div');
        this.div.style.display = 'repeat(13, auto)';
        this.div.style.gridTemplateColumns = 'auto';
        this.div_z = document.createElement('div');
        this.div.style.display = 'repeat(12, auto)';
        this.div.style.gridTemplateColumns = 'auto';
        this.div_s = document.createElement('div');
        this.div.style.display = 'repeat(15, auto)';
        this.div.style.gridTemplateColumns = 'auto';

        let divs = [
            this.div_f, this.div_n, this.din_q, this.div_a, this.div_z, this.div_s,
        ];

        this.params = params;

        for (let i = 0; i < divs.length; ++i) {
            for (let j = 1; j <= this.keys[i+1].length; ++j) {
                let b = document.createElement("button");
                divs[i].appendChild(b);
                b.innerText = this.keys[i+1][j];
            }            
        }

        this.div.appendChild(this.div_f);
        this.div.appendChild(this.div_n);
        this.div.appendChild(this.div_q);
        this.div.appendChild(this.div_a);
        this.div.appendChild(this.div_z);
        this.div.appendChild(this.div_s);

    }
    
}
