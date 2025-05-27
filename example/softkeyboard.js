

export class AnsiSoftKeyboard
{

    constructor(onclick, container = null, params = {} )
    {
    	let keys = [
{ row: 0, space: 1,    name: 'ESC',   normal: '\x1B',        shift: '\x1B',        ctrl: '\x1B',         },
{ row: 0, space: 1,    name: 'F1',    normal: '\x1BOP',      shift: '\x1BOP',      ctrl: '\x1BOP',       },
{ row: 0, space: 1,    name: 'F2',    normal: '\x1BOQ',      shift: '\x1BOQ',      ctrl: '\x1BOQ',       },
{ row: 0, space: 1,    name: 'F3',    normal: '\x1BQR',      shift: '\x1BQR',      ctrl: '\x1BQR',       },
{ row: 0, space: 1,    name: 'F4',    normal: '\x1BOS',      shift: '\x1BOS',      ctrl: '\x1BOS',       },
{ row: 0, space: 1,    name: 'F5',    normal: '\x1B[15\x7E', shift: '\x1B[15\x7E', ctrl: '\x1B[15\x7E',  },
{ row: 0, space: 1,    name: 'F6',    normal: '\x1B[17\x7E', shift: '\x1B[17\x7E', ctrl: '\x1B[17\x7E',  },
{ row: 0, space: 1,    name: 'F7',    normal: '\x1B[18\x7E', shift: '\x1B[18\x7E', ctrl: '\x1B[18\x7E',  },
{ row: 0, space: 1,    name: 'F8',    normal: '\x1B[19\x7E', shift: '\x1B[19\x7E', ctrl: '\x1B[19\x7E',  },
{ row: 0, space: 1,    name: 'F9',    normal: '\x1B[20\x7E', shift: '\x1B[20\x7E', ctrl: '\x1B[20\x7E',  },
{ row: 0, space: 1,    name: 'F10',   normal: '\x1B[21\x7E', shift: '\x1B[21\x7E', ctrl: '\x1B[21\x7E',  },
{ row: 0, space: 1,    name: 'F11',   normal: '\x1B[23\x7E', shift: '\x1B[23\x7E', ctrl: '\x1B[23\x7E',  },
{ row: 0, space: 1,    name: 'F12',   normal: '\x1B[24\x7E', shift: '\x1B[24\x7E', ctrl: '\x1B[24\x7E',  },
{ row: 0, space: 1,    name: 'INS',   normal: '\x1B[2\x7E',  shift: '\x1B[2\x7E',  ctrl: '\x1B[2\x7E',   },
{ row: 0, space: 1,    name: 'CANC',  normal: '\x1B[3\x7E',  shift: '\x1B[3\x7E',  ctrl: '\x1B[3\x7E',   },
//{ row: 1, space: 1,    name: '',      normal: '\x1B[5\x7E',  shift: '\x1B[5\x7E',  ctrl: '\x1B[5\x7E',   },
//{ row: 1, space: 1,    name: '',      normal: '\x1B[6\x7E',  shift: '\x1B[6\x7E',  ctrl: '\x1B[6\x7E',   },

{ row: 1, space: 1,    name: '\x60',  normal: '\x60',        shift: '\x7E',        ctrl: '\x7E',         },
{ row: 1, space: 1,    name: '1',     normal: '1',           shift: '!',           ctrl: '!',            },
{ row: 1, space: 1,    name: '2',     normal: '2',           shift: '@',           ctrl: '@',            },
{ row: 1, space: 1,    name: '3',     normal: '3',           shift: '#',           ctrl: '#',            },
{ row: 1, space: 1,    name: '4',     normal: '4',           shift: '$',           ctrl: '$',            },
{ row: 1, space: 1,    name: '5',     normal: '5',           shift: '%',           ctrl: '\x1E'          },
{ row: 1, space: 1,    name: '6',     normal: '6',           shift: '^',           ctrl: '^',            },
{ row: 1, space: 1,    name: '7',     normal: '7',           shift: '&',           ctrl: '&',            },
{ row: 1, space: 1,    name: '8',     normal: '8',           shift: '*',           ctrl: '*',            },
{ row: 1, space: 1,    name: '9',     normal: '9',           shift: '(',           ctrl: '(',            },
{ row: 1, space: 1,    name: '0',     normal: '0',           shift: ')',           ctrl: ')',            },
{ row: 1, space: 1,    name: '_',     normal: '.',           shift: '_',           ctrl: '\x1F',         },
{ row: 1, space: 1,    name: '+',     normal: '=',           shift: '+',           ctrl: '+',            },
{ row: 1, space: 2,    name: 'BS',    normal: '\x08',        shift: '\x08',        ctrl: '\x08',         },

{ row: 2, space: 1.4,  name: 'TAB',   normal: '\t',          shift: '\t',          ctrl: '\t',           },
{ row: 2, space: 1,    name: 'Q',     normal: 'q',           shift: 'Q',           ctrl: '\x11',         },
{ row: 2, space: 1,    name: 'W',     normal: 'w',           shift: 'W',           ctrl: '\x17',         },
{ row: 2, space: 1,    name: 'E',     normal: 'e',           shift: 'E',           ctrl: '\x05',         },
{ row: 2, space: 1,    name: 'R',     normal: 'r',           shift: 'R',           ctrl: '\x12',         },
{ row: 2, space: 1,    name: 'T',     normal: 't',           shift: 'T',           ctrl: '\x14',         },
{ row: 2, space: 1,    name: 'Y',     normal: 'y',           shift: 'Y',           ctrl: '\x19',         },
{ row: 2, space: 1,    name: 'U',     normal: 'u',           shift: 'U',           ctrl: '\x15',         },
{ row: 2, space: 1,    name: 'I',     normal: 'i',           shift: 'I',           ctrl: '\x09',         },
{ row: 2, space: 1,    name: 'O',     normal: 'o',           shift: 'O',           ctrl: '\x0F',         },
{ row: 2, space: 1,    name: 'P',     normal: 'p',           shift: 'P',           ctrl: '\x10',         },
{ row: 2, space: 1,    name: '[',     normal: '[',           shift: '{',           ctrl: '\x1B',         },
{ row: 2, space: 1,    name: ']',     normal: ']',           shift: '}',           ctrl: '\x1D',         },
{ row: 2, space: 1,    name: '\\',    normal: '\\',          shift: '|',           ctrl: '\x1C',         },
{ row: 2, space: 1.6,  name: 'ENTER', normal: '\n',          shift: '\n',          ctrl: '\x00',         },

{ row: 3, space: 1.6,  name: 'CAPS',   normal: ' ',           shift: ' ',          ctrl: ' ',            },
{ row: 3, space: 1,    name: 'a',      normal: 'a',           shift: 'A',          ctrl: '\x01',         },
{ row: 3, space: 1,    name: 's',      normal: 's',           shift: 'S',          ctrl: '\x13',         },
{ row: 3, space: 1,    name: 'd',      normal: 'd',           shift: 'D',          ctrl: '\x04',         },
{ row: 3, space: 1,    name: 'f',      normal: 'f',           shift: 'F',          ctrl: '\x06',         },
{ row: 3, space: 1,    name: 'g',      normal: 'g',           shift: 'G',          ctrl: '\x07',         },
{ row: 3, space: 1,    name: 'h',      normal: 'h',           shift: 'H',          ctrl: '\x08',         },
{ row: 3, space: 1,    name: 'j',      normal: 'j',           shift: 'J',          ctrl: '\x0A',         },
{ row: 3, space: 1,    name: 'k',      normal: 'k',           shift: 'K',          ctrl: '\x0B',         },
{ row: 3, space: 1,    name: 'l',      normal: 'l',           shift: 'L',          ctrl: '\x0C',         },
{ row: 3, space: 1,    name: ';',      normal: ';',           shift: ':',          ctrl: ':',            },
{ row: 3, space: 1,    name: '\'',     normal: '\'',          shift: '"',          ctrl: '"',            },
{ row: 3, space: 2.4,  name: 'ENTER',  normal: '\n',          shift: '\n',         ctrl: '\x00',         },

{ row: 4, space: 2.5,  name: 'SHIFT',  normal: ' ',           shift: ' ',          ctrl: ' ',            },
{ row: 4, space: 1,    name: 'z',      normal: 'z',           shift: 'Z',          ctrl: '\x1A',         },
{ row: 4, space: 1,    name: 'x',      normal: 'x',           shift: 'X',          ctrl: '\x18',         },
{ row: 4, space: 1,    name: 'c',      normal: 'c',           shift: 'C',          ctrl: '\x03',         },
{ row: 4, space: 1,    name: 'v',      normal: 'v',           shift: 'V',          ctrl: '\x16',         },
{ row: 4, space: 1,    name: 'b',      normal: 'b',           shift: 'B',          ctrl: '\x02',         },
{ row: 4, space: 1,    name: 'n',      normal: 'n',           shift: 'N',          ctrl: '\x0E',         },
{ row: 4, space: 1,    name: 'm',      normal: 'm',           shift: 'M',          ctrl: '\x0D',         },
{ row: 4, space: 1,    name: ',',      normal: ',',           shift: '<',          ctrl: '<',            },
{ row: 4, space: 1,    name: '.',      normal: '.',           shift: '>',          ctrl: '>',            },
{ row: 4, space: 1,    name: '/',      normal: '/',           shift: '?',          ctrl: '?',            },
{ row: 4, space: 2.5,  name: 'SHIFT',  normal: ' ',           shift: ' ',          ctrl: ' ',            },

{ row: 5, space: 1.5,  name: 'CTRL',   normal: ' ',           shift: ' ',          ctrl: ' ',            },
{ row: 5, space: 1.5,  name: 'ALT',    normal: ' ',           shift: ' ',          ctrl: ' ',            },
{ row: 5, space: 9,    name: ' ',      normal: ' ',           shift: ' ',          ctrl: ' ',            },
{ row: 5, space: 1.5,  name: 'ALT',    normal: ' ',           shift: ' ',          ctrl: ' ',            },
{ row: 5, space: 1.5,  name: 'CTRL',   normal: ' ',           shift: ' ',          ctrl: ' ',            },
];

	this.onclick = onclick;
	this.container = container;
	this.params = params;

	this.button_width = 40;
	this.button_height = 40;

        this.div = document.createElement('div');
        this.div.className = 'softkeyboard';
        this.div.style.display = 'grid';
	this.div.style.width = "max-content";
        this.div.style.gridTemplateColumns = 'auto';

	let rows = {};

	for (let i = 0; i < keys.length; ++i) {
		if (keys[i].row in rows) {
			rows[keys[i].row].push(keys[i]);
		}
		else {
			rows[keys[i].row] = [ keys[i] ];
		}
	}

	this.div_rows = [];

	for (let i in rows) {
		let d = document.createElement('div');
		for (let j in rows[i]) {
			let r = rows[i][j];
			let b = document.createElement("button");
			b.innerText = r.name;
			b.width = Math.floor(this.button_width * r.space) + "px";
			b.height = this.button_height;
			b.addEventListener("click", (e) => {
				this.onclick(r.normal);
			});
			d.appendChild(b);
		}
		this.div.appendChild(d);
		this.div_rows[i] = d;
	}

	if (this.container == null) {
		this.container = document.body;
	}

	this.container.appendChild(this.div);
    }
    
}

window.AnsiSoftKeyboard = AnsiSoftKeyboard;
