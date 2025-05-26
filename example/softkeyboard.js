

class AnsiSoftKeyboard {

    constructor(params) {
    this.keys = [
{ row: 1, space: 1,    name: 'ESC',   normal: '\x1B',        shift: '\x1B',        ctrl: '\x1B',         },
{ row: 1, space: 1,    name: 'F1',    normal: '\x1BOP',      shift: '\x1BOP',      ctrl: '\x1BOP',       },
{ row: 1, space: 1,    name: 'F2',    normal: '\x1BOQ',      shift: '\x1BOQ',      ctrl: '\x1BOQ',       },
{ row: 1, space: 1,    name: 'F3',    normal: '\x1BQR',      shift: '\x1BQR',      ctrl: '\x1BQR',       },
{ row: 1, space: 1,    name: 'F4',    normal: '\x1BOS',      shift: '\x1BOS',      ctrl: '\x1BOS',       },
{ row: 1, space: 1,    name: 'F5',    normal: '\x1B[15\x7E', shift: '\x1B[15\x7E', ctrl: '\x1B[15\x7E',  },
{ row: 1, space: 1,    name: 'F6',    normal: '\x1B[17\x7E', shift: '\x1B[17\x7E', ctrl: '\x1B[17\x7E',  },
{ row: 1, space: 1,    name: 'F7',    normal: '\x1B[18\x7E', shift: '\x1B[18\x7E', ctrl: '\x1B[18\x7E',  },
{ row: 1, space: 1,    name: 'F8',    normal: '\x1B[19\x7E', shift: '\x1B[19\x7E', ctrl: '\x1B[19\x7E',  },
{ row: 1, space: 1,    name: 'F9',    normal: '\x1B[20\x7E', shift: '\x1B[20\x7E', ctrl: '\x1B[20\x7E',  },
{ row: 1, space: 1,    name: 'F10',   normal: '\x1B[21\x7E', shift: '\x1B[21\x7E', ctrl: '\x1B[21\x7E',  },
{ row: 1, space: 1,    name: 'F11',   normal: '\x1B[23\x7E', shift: '\x1B[23\x7E', ctrl: '\x1B[23\x7E',  },
{ row: 1, space: 1,    name: 'F12',   normal: '\x1B[24\x7E', shift: '\x1B[24\x7E', ctrl: '\x1B[24\x7E',  },
{ row: 1, space: 1,    name: 'INS',   normal: '\x1B[2\x7E',  shift: '\x1B[2\x7E',  ctrl: '\x1B[2\x7E',   },
{ row: 1, space: 1,    name: 'CANC',  normal: '\x1B[3\x7E',  shift: '\x1B[3\x7E',  ctrl: '\x1B[3\x7E',   },
//{ row: 1, space: 1,    name: '',      normal: '\x1B[5\x7E',  shift: '\x1B[5\x7E',  ctrl: '\x1B[5\x7E',   },
//{ row: 1, space: 1,    name: '',      normal: '\x1B[6\x7E',  shift: '\x1B[6\x7E',  ctrl: '\x1B[6\x7E',   },

{ row: 2, space: 1,    name: '\x60',  normal: '\x60',        shift: '\x7E',        ctrl: '\x7E',         },
{ row: 2, space: 1,    name: '1',     normal: '1',           shift: '!',           ctrl: '!',            },
{ row: 2, space: 1,    name: '2',     normal: '2',           shift: '@',           ctrl: '@',            },
{ row: 2, space: 1,    name: '3',     normal: '3',           shift: '#',           ctrl: '#',            },
{ row: 2, space: 1,    name: '4',     normal: '4',           shift: '$',           ctrl: '$',            },
{ row: 2, space: 1,    name: '5',     normal: '5',           shift: '%',           ctrl: '\x1E'          },
{ row: 2, space: 1,    name: '6',     normal: '6',           shift: '^',           ctrl: '^',            },
{ row: 2, space: 1,    name: '7',     normal: '7',           shift: '&',           ctrl: '&',            },
{ row: 2, space: 1,    name: '8',     normal: '8',           shift: '*',           ctrl: '*',            },
{ row: 2, space: 1,    name: '9',     normal: '9',           shift: '(',           ctrl: '(',            },
{ row: 2, space: 1,    name: '0',     normal: '0',           shift: ')',           ctrl: ')',            },
{ row: 2, space: 1,    name: '_',     normal: '.',           shift: '_',           ctrl: '\x1F',         },
{ row: 2, space: 1,    name: '+',     normal: '=',           shift: '+',           ctrl: '+',            },
{ row: 2, space: 2,    name: 'BS',    normal: '\x08',        shift: '\x08',        ctrl: '\x08',         },

{ row: 3, space: 1.4,  name: 'TAB',   normal: '\t',          shift: '\t',          ctrl: '\t',           },
{ row: 3, space: 1,    name: 'Q',     normal: 'q',           shift: 'Q',           ctrl: '\x11',         },
{ row: 3, space: 1,    name: 'W',     normal: 'w',           shift: 'W',           ctrl: '\x17',         },
{ row: 3, space: 1,    name: 'E',     normal: 'e',           shift: 'E',           ctrl: '\x05',         },
{ row: 3, space: 1,    name: 'R',     normal: 'r',           shift: 'R',           ctrl: '\x12',         },
{ row: 3, space: 1,    name: 'T',     normal: 't',           shift: 'T',           ctrl: '\x14',         },
{ row: 3, space: 1,    name: 'Y',     normal: 'y',           shift: 'Y',           ctrl: '\x19',         },
{ row: 3, space: 1,    name: 'U',     normal: 'u',           shift: 'U',           ctrl: '\x15',         },
{ row: 3, space: 1,    name: 'I',     normal: 'i',           shift: 'I',           ctrl: '\x09',         },
{ row: 3, space: 1,    name: 'O',     normal: 'o',           shift: 'O',           ctrl: '\x0F',         },
{ row: 3, space: 1,    name: 'P',     normal: 'p',           shift: 'P',           ctrl: '\x10',         },
{ row: 3, space: 1,    name: '[',     normal: '[',           shift: '{',           ctrl: '\x1B',         },
{ row: 3, space: 1,    name: ']',     normal: ']',           shift: '}',           ctrl: '\x1D',         },
{ row: 3, space: 1,    name: '\\',    normal: '\\',          shift: '|',           ctrl: '\x1C',         },
{ row: 3, space: 1.6,  name: 'ENTER', normal: '\n',          shift: '\n',          ctrl: '\x00',         },

{ row: 4, space: 1.6,  name: 'CAPS',   normal: ' ',           shift: ' ',          ctrl: ' ',            },
{ row: 4, space: 1,    name: 'a',      normal: 'a',           shift: 'A',          ctrl: '\x01',         },
{ row: 4, space: 1,    name: 's',      normal: 's',           shift: 'S',          ctrl: '\x13',         },
{ row: 4, space: 1,    name: 'd',      normal: 'd',           shift: 'D',          ctrl: '\x04',         },
{ row: 4, space: 1,    name: 'f',      normal: 'f',           shift: 'F',          ctrl: '\x06',         },
{ row: 4, space: 1,    name: 'g',      normal: 'g',           shift: 'G',          ctrl: '\x07',         },
{ row: 4, space: 1,    name: 'h',      normal: 'h',           shift: 'H',          ctrl: '\x08',         },
{ row: 4, space: 1,    name: 'j',      normal: 'j',           shift: 'J',          ctrl: '\x0A',         },
{ row: 4, space: 1,    name: 'k',      normal: 'k',           shift: 'K',          ctrl: '\x0B',         },
{ row: 4, space: 1,    name: 'l',      normal: 'l',           shift: 'L',          ctrl: '\x0C',         },
{ row: 4, space: 1,    name: ';',      normal: ';',           shift: ':',          ctrl: ':',            },
{ row: 4, space: 1,    name: '\'',     normal: '\'',          shift: '"',          ctrl: '"',            },
{ row: 4, space: 2.4,  name: 'ENTER',  normal: '\n',          shift: '\n',         ctrl: '\x00',         },

{ row: 5, space: 2.5,  name: 'SHIFT',  normal: ' ',           shift: ' ',          ctrl: ' ',            },
{ row: 5, space: 1,    name: 'z',      normal: 'z',           shift: 'Z',          ctrl: '\x1A',         },
{ row: 5, space: 1,    name: 'x',      normal: 'x',           shift: 'X',          ctrl: '\x18',         },
{ row: 5, space: 1,    name: 'c',      normal: 'c',           shift: 'C',          ctrl: '\x03',         },
{ row: 5, space: 1,    name: 'v',      normal: 'v',           shift: 'V',          ctrl: '\x16',         },
{ row: 5, space: 1,    name: 'b',      normal: 'b',           shift: 'B',          ctrl: '\x02',         },
{ row: 5, space: 1,    name: 'n',      normal: 'n',           shift: 'N',          ctrl: '\x0E',         },
{ row: 5, space: 1,    name: 'm',      normal: 'm',           shift: 'M',          ctrl: '\x0D',         },
{ row: 5, space: 1,    name: ',',      normal: ',',           shift: '<',          ctrl: '<',            },
{ row: 5, space: 1,    name: '.',      normal: '.',           shift: '>',          ctrl: '>',            },
{ row: 5, space: 1,    name: '/',      normal: '/',           shift: '?',          ctrl: '?',            },
{ row: 5, space: 2.5,  name: 'SHIFT',  normal: ' ',           shift: ' ',          ctrl: ' ',            },

{ row: 6, space: 1.5,  name: 'CTRL',   normal: ' ',           shift: ' ',          ctrl: ' ',            },
{ row: 6, space: 1.5,  name: 'ALT',    normal: ' ',           shift: ' ',          ctrl: ' ',            },
{ row: 6, space: 9,    name: ' ',      normal: ' ',           shift: ' ',          ctrl: ' ',            },
{ row: 6, space: 1.5,  name: 'ALT',    normal: ' ',           shift: ' ',          ctrl: ' ',            },
{ row: 6, space: 1.5,  name: 'CTRL',   normal: ' ',           shift: ' ',          ctrl: ' ',            },
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
