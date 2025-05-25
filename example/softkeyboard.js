

class AnsiSoftKeyboard {

    constructor(params) {
        this.keys = {
        "": [
            '\x1B',
            '\x1BOP', '\x1BOQ', '\x1BQR', '\x1BOS',
            '\x1B[15\x7E', '\x1B[17\x7E', '\x1B[18\x7E', '\x1B[19\x7E',
            '\x1B[20\x7E', '\x1B[21\x7E', '\x1B[23\x7E', '\x1B[24\x7E',
            '\x1B[2\x7E', '\x1B[3\x7E', '\x1B[5\x7E', '\x1B[6\x7E',
            
            '\x60', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', '=', '\x08',
            
            '\t', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\', '\n',

            'CAPS', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'', '\n',

            'SHIFT', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'SHIFT',

            'CTRL', 'ALT', ' ', 'ALT', 'CTRL'
            ],
        "SHIFT": [
            '\x1B',
            '\x1BOP', '\x1BOQ', '\x1BQR', '\x1BOS',
            '\x1B[15\x7E', '\x1B[17\x7E', '\x1B[18\x7E', '\x1B[19\x7E',
            '\x1B[20\x7E', '\x1B[21\x7E', '\x1B[23\x7E', '\x1B[24\x7E',
            '\x1B[2\x7E', '\x1B[3\x7E', '\x1B[5\x7E', '\x1B[6\x7E',
            
            '\x7E', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '\x08',
            
            '\t', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '|', '\n',

            'CAPS', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':', '"', '\n',

            'SHIFT', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?', 'SHIFT',

            'CTRL', 'ALT', ' ', 'ALT', 'CTRL'
            ],
        "CTRL": [
            '\x1B',
            '\x1BOP', '\x1BOQ', '\x1BQR', '\x1BOS',
            '\x1B[15\x7E', '\x1B[17\x7E', '\x1B[18\x7E', '\x1B[19\x7E',
            '\x1B[20\x7E', '\x1B[21\x7E', '\x1B[23\x7E', '\x1B[24\x7E',
            '\x1B[2\x7E', '\x1B[3\x7E', '\x1B[5\x7E', '\x1B[6\x7E',
            
            '\x7E', '!', '@', '#', '$', '%', '\x1E', '&', '*', '(', ')', '\x1F', '+', '\x08',
            
            '\t', '\x11', '\x17', '\x05', '\x12', '\x14', '\x19', '\x15', '\x09', '\x0F', '\x10', '\x1B', '\x1D', '\x1C', '\x00',

            'CAPS', '\x01', '\x13', '\x04', '\x06', '\x07', '\x08', '\x0A', '\x0B', '\x0C', ':', '"', '\x00',

            'SHIFT', '\x1A', '\x18', '\x03', '\x16', '\x02', '\x0E', '\x0D', '<', '>', '?', 'SHIFT',

            'CTRL', 'ALT', ' ', 'ALT', 'CTRL'
            ],
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

        this.div.appendChild(this.div_f);
        this.div.appendChild(this.div_n);
        this.div.appendChild(this.div_q);
        this.div.appendChild(this.div_a);
        this.div.appendChild(this.div_z);
        this.div.appendChild(this.div_s);

        this.params = params;

    }
    
}
