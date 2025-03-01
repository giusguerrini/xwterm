
	
const ANSITERM_VERSION = "0.7.0";
/*	
 A simple XTerm/ANSIterm emulator for web applications.
 
 The class "AnsiTerm" is defined here. It implements a
 terminal emulator by drawing characters on a canvas element.
 The canvas participates to a hierarchy of elements whose root
 is a "div". Other participants are a "title" element, buttons
 and a "status" element. The "status" element is used to show
 the status of the terminal. The "div" element
 contains all the other elements. It may be created by the
 class or passed as a parameter to the constructor. The class
 may be used to create a terminal emulator in a web page by
 creating an instance of the class.

 The class mainatins a state machine to interpret ANSI sequences.
 The state machine is implemented as a dictionary of dictionaries.
 The outer dictionary is indexed by the current state of the machine.
 The inner dictionaries are indexed by the characters that may be
 received in that state. The values of the inner dictionaries are
 functions that are executed when the corresponding character is
 received. The functions may change the state of the machine, write
 characters on the screen, change the attributes of the characters
 and so on. The state machine is created by the method "_create_sm".
 Although in theory it would be more clean to define the state machine
 as a static member of the class, I prefer to define it as an instance
 member to make it easier to read and understand. In particular,
 it's handy to have direct access to "this" inside the functions that
 define the state machine.
 
 At the moment, the class uses HTTP GET requests to receive data from
 the server. HTTP POST is used to send data to the server.
 The class is designed to be used with a server that
 implements a simple protocol to send and receive data. An important
 feature to be added is the ability to use WebSockets to communicate
 with the server. This would allow the server to send data to the
 client without the need for the client to poll the server as it
 does now.

 The screen is implemented as a two-dimensional array of objects.
 Each object is a character. The character object has the following
 members:
  - ch: the character to be displayed
  - fg: the foreground color
  - bg: the background color
  - bold: true if the character is bold
  - italic: true if the character is italic
  - underline: true if the character is underlined
  - reverse: true if the character is reverse video
  - blink: true if the character blinks
  - selected: true if the character is selected
 The class's constructor calculates the size of the canvas and the
 size of the characters to be displayed. The characters are drawn
 on the canvas using the "fillText" method of the canvas context.
 Some optimizations are done to avoid drawing of single characters
 during scroll operations. A "drawImage" to move a whole rectangle
 is used instead.

 The cursor is drawn as a blinking rectangle. To optimize the
 rendering, the cursor is drawn only at the end of a block of
 characters from the server, so cursor is not visible during
 rendering of a block of characters. This is a few unaesthetic,
 but in my opinion it's worth the performance gain.

 Blinking is controlled by a timer that toggles the state
 every "blink_period" milliseconds. The same timer is used
 for both the cursor and blinking characters. Blinking characters
 are stored in a list that updates whenever a character changes
 its blinking state.


 
----------------------


 Coding conventions:
 - Although modern JavaScript implements private methods,
  for the sake of compatibility I prefer not to use them.
  In this source, methods that are intended to be private
  are prefixed by an underscore.
  This rule does not apply to non-function members whose
  intended scope is "private". Plain lowercase
  identifiers are preferred for them.
 - Method and members intendended to be public are camelCase.
 - Classes are PascalCase.
 - Constants are UPPERCASE.
 NOTE: I'm not sure if this is a good idea. I may change it in
 the future. I am not an enthusiast of rigid coding conventions
 (and there are some that I hate, e.g, useless prefixes like
 "m_" for members, "C" for classes... Furthermore, I hate horrors like this:
 
	for (iIndexOfTheThingIAmLookingForButIAmNotSureIfItIsThere = 0;
	     iIndexOfTheThingIAmLookingForButIAmNotSureIfItIsThere < fArrayOfThingsIAmLookingFor.length;
	     ++iIndexOfTheThingIAmLookingForButIAmNotSureIfItIsThere) {

		if (fArrayOfThingsIAmLookingFor[iIndexOfTheThingIAmLookingForButIAmNotSureIfItIsThere]
		 == fTheThingIAmLookingForButIAmNotSureIfItIsThere) {
			break;
		}
	}

  Today's screens are wide, but, please, just use a plain "i" for index. Please).

 Beside my personal quirks, I'll impose at least two rules:
 1) always put semi-colons at the end of statements,
 2) always use braces for control structures.

 ----------------------

 For a full description of XTerm/ANSI sequences see:
	
	https://invisible-island.net/xterm/ctlseqs/ctlseqs.html
	https://www.commandlinux.com/man-page/man4/console_codes.4.html
*/			

//import "./scrollbar.js";

// DEFAULTS

const ANSITERM_DEFAULTS = {
	// Basic characteristics:

	nLines:  25, // Number of lines
	nColumns:  80, // Number of columns

	fontSize:  15, // Font size in pixels. It determines the size of the canvas.

	font:  "Courier New", // Font name. A monospaced font is required (or at least suggested).

	statusFont:  "Helvetica bold", //"Arial bold", // Font for the status line and the title.
	
	// Custom layout control:

	divId:  "", // Id of the div element that contains the terminal. If empty, a new div is created.
	canvasId:  "", // Id of the canvas element. If empty, a new canvas is created.
	titlesId:  "", // Id of the title element. If empty, a new title is created.
	//statusId:  "", // TODO: Id of the status element. If empty, a new status is created.
	//keyboardId:  "", // TODO: Id of the keyboard element. If empty, a new keyboard is created.
	//buttonsId:  "", // TODO: Id of the button container element. If empty, a new container is created.

	// Protocol parameters:

	//url:  window.location.href, // URL of the server. This usually is the same as the URL of the page.

	source:  "/?console", // GET request to receive characters from the server.
	config:  "/?size=?lines?x?columns?", // GET request to set the size of the terminal.
	dest:  "/", // POST request to send characters to the server.
	timeout:  0, //10000; // Timeout for all request. 0 means no timeout. If timeout is reached, the ESC sequence is aborted.

	immediateRefresh:  70, // Time in milliseconds to send an update request after sending an event.
	fastRefresh:  500, // Time in milliseconds to send the next update request after receiving a response.
	slowRefresh:  2000, // Time in milliseconds to send the next update request after a protocol failure.

	// Colors and appearance:

	foreground:  "rgb(224,224,224)", // Default foreground color.
	background:  "rgb(0,0,0)", // Default background color.
	statusForegroundOk:  "rgb(0,32,0)", // Status line foreground color when status is OK.
	statusBackgroundOk:  "rgb(160,192,160)", // Status line background color when status is OK.
	statusForegroundKo:  "rgb(255,255,0)", // Status line foreground color when status is not OK.
	statusBackgroundKo:  "rgb(192,64,64)", // Status line background color when status is not OK.
	titleBackground:  "rgb(224,224,224)", // Title background color.
	titleForeground:  "rgb(0,0,128)", // Title foreground color.
	//keyboardBackground:  this.title_background, // Keyboard background color. Usually the same as the title.
	//keyboardForeground:  this.title_foreground, // Keyboard foreground color. Usually the same as the title.
	selectionBackground:  "rgb(0,0,0)", // Selection background color.
	selectionForeground:  "rgb(255,192,192)", // Selection foreground color.

	blinkIsBold:  true, // If true, blinking characters are drawn bold.
	blinkPeriod:  500, // Blink period in milliseconds for both cursor an blinking characters.

	titleText:  "ANSI Terminal", // Initial title text.
};

function getAbsolutePosition(element)
{
	let x = 0;
	let y = 0;
  
	while (element) {
	  x += element.offsetLeft - element.scrollLeft + element.clientLeft;
	  y += element.offsetTop - element.scrollTop + element.clientTop;
	  element = element.offsetParent;
	}
  
	return { x, y };
}

var encodeHtml_textarea = null;
function encodeHtml(html)
{
	if (! encodeHtml_textarea) {
		encodeHtml_textarea = document.createElement('textarea');
	}
	encodeHtml_textarea.innerHTML = html;
	return encodeHtml_textarea.value;
}

  

/*
TODO: define classes for screen, cells, graphic states, etc.

class AnsiTermScreenCell {

}

class AnsiTermScreen {

	constructor(nlines, ncolumns, fontsize, font, gc) {
		this.nlines = nlines;
		this.ncolumns = ncolumns;
		this.fontsize = fontsize;
		this.font = font;
		this.gc = gc;
		this._reset();
	}
}
	*/

export class AnsiTerm {


	_reset()
	{
		this.background = this.palette[0];
		this.foreground = this.palette[7];

		this.gc.fillStyle = this.background;
		this.gc.fillRect(0,0,this.gc.canvas.width,this.gc.canvas.height);
		this.gc.fillStyle = this.foreground;

		this.screens = [[],[]];
		for (let i = 0; i < this.nlines; ++i) {
			this.screens[0][i] = [];
			this.screens[1][i] = [];
		}
		this.scr_background = [ this.background, this.background ];
		this.scr_foreground = [ this.foreground, this.foreground ];
		this.screen = this.screens[0];
		this._clearscreen();
		this.screen = this.screens[1];
		this._clearscreen();
		this.posx = 0;
		this.posy = 0;
		this.x_lastblink = 0;
		this.y_lastblink = 0;

		this.alternate_screen = false;
		this.currscreen = 0;
		this.screen = this.screens[this.currscreen];

		this.scrollregion_l = 0;
		this.scrollregion_h = this.nlines - 1;

		this.grstate = {};
		this.blink_state = false;

		this._setpos(0,0);
		this._resetattr();
		this.blink_lists = [[], []];
		this.blink_list = this.blink_lists[0];
		this.cursor_off = true;
	}

	_selectscreen(f)
	{
		if (f != this.alternate_screen) {
			let scr = f ? 1 : 0;
			this.scr_background[1 - scr] = this.background;
			this.scr_foreground[1 - scr] = this.foreground;
			this.screen = this.screens[scr];
			this.blink_list = this.blink_lists[scr];
			this.background = this.scr_background[scr];
			this.foreground = this.scr_foreground[scr];
			this._redraw();
		}
		this.alternate_screen = f;
	}

	_savestate()
	{
		this.grstate = {
			screen: this.currscreen,
			foreground: this.foreground,
			background: this.background,
			posx: this.posx,
			posy: this.posy,
			bold: this.bold,
			italic: this.italic,
			blink: this.blink,
			underline: this.underline,
			reverse: this.reverse,
			scrollregion_l: this.scrollregion_l,
			scrollregion_h: this.scrollregion_h,
		};
	}

	_restorestate()
	{
		this.currscreen = this.grstate.screen;
		this.foreground = this.grstate.foreground;
		this.background = this.grstate.background;
		this.blink = this.grstate.blink;
		this.underline = this.grstate.underline;
		this.reverse = this.grstate.reverse;
		this._setbold(this.grstate.bold);
		this._setitalic(this.grstate.italic);
		this._setpos(this.grstate.posx, this.grstate.posy);
		this.scrollregion_l = this.grstate.scrollregion_l;
		this.scrollregion_h = this.grstate.scrollregion_h;
	}

	/*
	Implementation of XTerm/ANSI state machine.
	For each state, a set of transitions is defined.
	Each transition is a function that is executed when
	a character is received in that state. The function
	may change the state and/or execute the action corresponding
	to the received sequence. In all states, the empty string key
	represents the default action.
	Non-special characters are accumulated in the "pending_text"
	field. When a special character is received, the pending_text
	field is flushed and the corresponding action is executed.
	"pendig_text" is also flushed at the end of a block of characters
	from the server. This could be used to optimize the rendering
	by drawing a whole block of characters at once (TODO, not
	yet implemented)
	*/

	// Flush pending (non-special) chracters and reset state machine
	_init()
	{
		this._flush();
		this.state = 0;
		this.paramstr = "";
		this._clear_timer();	
	}

	// A small helper to automate the transition to state 0
	// after executing the required function. It eases the
	// definition of the state machine.
	_ti(f)
	{
		return () => {
			f();
			this._init();
		};
	}

	
	_create_sm()
	{
		this.transitions = {

			// Base state
			0: {
				"\x00": () => { this._init(); }, // NUL
				"\x05": () => { this._init(); }, // ENQ
				"\x07": () => { this._init(); }, //this.on_bell, // TODO
				"\x08": () => {
						this._flush();
						if (this.posx == 0) {
							this._setpos(this.ncolumns - 1, this.posy - 1);
						}
						else {
							this._incpos(-1, 0);
						}
				},
				"\x09": () => { this._tab(); },
				"\x0A": () => { this._newline(); },
				"\x0B": () => { this._newline(); }, // VT, but "treated as LF", they say
				"\x0C": () => { this._newline(); }, // FF, but "treated as LF", they say
				"\x0D": () => {
						this._flush();
						this._setpos(0, this.posy);
				},
				"\x0E": () => { this._init(); }, // SO
				"\x0F": () => { this._init(); }, // SI
				"\x7F": () => { this._init(); }, // DEL
				"\x1B": () => { // ESC !!!
					this._flush();
					this.state = 1;
				},
				"\x18": () => { this._init(); }, // CAN
				"\x1A": () => { this._init(); }, // SUB
				"": () => {
					this.pending_text += this.ch;
				}, // default
			},

			// Start of sequence
			1: {
				"7": this._ti(() => { this._savestate(); }), // Save current state (cursor coordinates, attributes, character sets pointed at by G0, G1).
				"8": this._ti(() => { this._restorestate(); }),
				"c": this._ti(() => { this._reset(); }), // Full reset
				"D": this._ti(() => { this._newline(); }), // Index (down with scroll)
				"E": this._ti(() => { // Next line
					this._setpos(0, this.posy);
					this._newline();
				}),
				"H": () => { this._init(); }, // Horizontal tab set
				"M": this._ti(() => { this._upline(); }), // Reverse Index (up with scroll)
				"N": () => { this._init(); }, // Single shift 2
				"O": () => { this._init(); }, // Single shift 3
				"P": () => { // Device Control String
					this.state = 7;
				},
				"X": () => { this._init(); }, // Start of string (ignored)
				"Z": this._ti(() => { this._send_id(); }), // DEC private identification. The kernel returns the string ESC [ ? 6 c, claiming that it is a VT102
				"[": () => { // CSI
					this.state = 2;
				},
				"]": () => { // OSC: Operating System Command
					this.state = 3;
				},
				"%": () => { // Start sequence selecting character set					
					this.state = 4;
				},
				"#": () => { // Tests
					this.state = 5;
				},
				"(": () => { // 	Start sequence defining G0 character set
					this.def_G0 = true;
					this.state = 6;
				},
				")": () => { // 	Start sequence defining G1 character set
					this.def_G0 = false;
					this.state = 6; // TODO: G0/G1 character set selection
				},
				">": () => { this._init(); }, // Numeric keypad mode
				"=": () => { this._init(); }, // Application keypad mode
				"\x18": () => { this._init(); }, // CAN
				"\x1A": () => { this._init(); }, // SUB
				"": () => { this._init(); },
			},

			// CSI

			2: {
				"?": () => {
					this.state = 8;
				},
				"@": () => { this._init(); }, // ICH	Insert the indicated # of blank characters.
				"A": this._ti(() => {
					this._incpos(0, -this._getarg(0, 1));
				}), // CUU	Move cursor up the indicated # of rows.
				"B": this._ti(() => {
					this._incpos(0, this._getarg(0, 1));
				}), // CUD	Move cursor down the indicated # of rows.
				"C": this._ti(() => {
					this._incpos(this._getarg(0, 1), 0);
				}), // CUF	Move cursor right the indicated # of columns.
				"D": this._ti(() => {
					this._incpos(-this._getarg(0, 1), 0);
				}), // CUB	Move cursor left the indicated # of columns.
				"E": this._ti(() => {
					this._setpos(0, this.posy + this._getarg(0, 1));
				}), // CNL	Move cursor down the indicated # of rows, to column 1.
				"F": this._ti(() => {
					this._setpos(0, this.posy - this._getarg(0, 1));
				}), // CPL	Move cursor up the indicated # of rows, to column 1.
				"G": this._ti(() => {
					this._setpos(this._getarg(0, 1) - 1, this.posy);
				}), // CHA	Move cursor to indicated column in current row.
				"H": this._ti(() => {
					this._setpos(this._getarg(1, 1) - 1, this._getarg(0, 1) - 1);
				}), // CUP	Move cursor to the indicated row, column (origin at 1,1).
				"J": this._ti(() => {
					this._erase_screen(this._getarg(0, 0));
				}), // ED	Erase display (default: this._ti(from cursor to end of display).
						// ESC [ 1 J: this._ti(erase from start to cursor.
						// ESC [ 2 J: this._ti(erase whole display.
						// ESC [ 3 J: this._ti(erase whole display including scroll-back buffer (since Linux 3.0).
				"K": this._ti(() => {
					this._erase_line(this._getarg(0, 0));
				}), // EL	Erase line (default: this._ti(from cursor to end of line).
						// ESC [ 1 K: this._ti(erase from start of line to cursor.
						// ESC [ 2 K: this._ti(erase whole line.
				"L": this._ti(() => {
					this._insert_lines(this._getarg(0, 1));
				}), // IL	Insert the indicated # of blank lines.
				"M": this._ti(() => {
					this._delete_lines(this._getarg(0, 1));
				}), // DL	Delete the indicated # of lines.
				"P": this._ti(() => {
					this._delete_chars(this._getarg(0, 1));
				}), // DCH	Delete the indicated # of characters on current line.
				"S": this._ti(() => {
					this._scroll_multi(this._getarg(0, 1));
				}), // ECH	Erase the indicated # of characters on current line.
				"T": this._ti(() => {
					this._scroll_multi(-this._getarg(0, 1));
				}), // ECH	Erase the indicated # of characters on current line.
				"X": this._ti(() => {
					this._erase_chars(this._getarg(0, 1));
				}), // ECH	Erase the indicated # of characters on current line.
				"a": this._ti(() => {
					this._incpos(this._getarg(0, 1), 0);
				}), // HPR	Move cursor right the indicated # of columns.
				"c": this._ti(() => { this._send_id(); }), // DA: "I am a Vt102"
				"d": this._ti(() => {
					this._setpos(this.posx, this._getarg(0, 1) - 1);
				}), // VPA	Move cursor to the indicated row, current column.
				"e": this._ti(() => {
					this._setpos(this.posx, this.posy + this._getarg(0, 1));
				}), // VPR	Move cursor down the indicated # of rows.
				"f": this._ti(() => {
					this._setpos(this._getarg(0, 1) - 1, this._getarg(1, 1) - 1);
				}), // HVP	Move cursor to the indicated row, column.
				"g": () => { this._init(); }, // TBC	Without parameter: clear tab stop at current position.
						// ESC [ 3 g: delete all tab stops.
				"h": () => { this._init(); }, // SM	Set Mode (see below).
				"l": () => { this._init(); }, // RM	Reset Mode (see below).
				"m": this._ti(() => { this._setattr(); }), // SGR	Set attributes (see below).
				"n": this._ti(() => {
					let v = this._getarg(0,0);
					if (v == 6) {
						this._send_pos();
					}
					else if (v == 5) {
						this._send_ok();
					}
				}), // DSR	Status report (see below).
				"q": () => { this._init(); }, // DECLL	Set keyboard LEDs.
						// ESC [ 0 q: clear all LEDs
						// ESC [ 1 q: set Scroll Lock LED
						// ESC [ 2 q: set Num Lock LED
						// ESC [ 3 q: set Caps Lock LED
				"r": this._ti(() => {
					this.scrollregion_l = this._getarg(0,1) - 1;
					this.scrollregion_h = this._getarg(1,this.nlines) - 1;
				}), // DECSTBM	Set scrolling region; parameters are top and bottom row.
				"s": this._ti(() => {
					this.save_posx = this.posx;
					this.save_posy = this.posy;
				}), // ?	Save cursor location.
				"u": this._ti(() => {
					this._setpos(this.save_posx, this.save_posy);
				}), // ?	Restore cursor location.
				"`": this._ti(() => {
					this._setpos(this._getarg(0, 1) - 1, this.posy);
				}), // HPA	Move cursor to indicated column in current row.
				"t": this._ti(() => {
					this._screen_geometry();
				}), // ?	Restore cursor location.
				">": () => {
					this.state = 9;
				},
				"0": () => { this._addparam(); },
				"1": () => { this._addparam(); },
				"2": () => { this._addparam(); },
				"3": () => { this._addparam(); },
				"4": () => { this._addparam(); },
				"5": () => { this._addparam(); },
				"6": () => { this._addparam(); },
				"7": () => { this._addparam(); },
				"8": () => { this._addparam(); },
				"9": () => { this._addparam(); },
				";": () => { this._addparam(); },
				"\x18": () => { this._init(); }, // CAN
				"\x1A": () => { this._init(); }, // SUB
				"": () => { this._init(); },
			},

			// OSC (cont.)
			3: {
				"\x1B": () => {
					this.state = 13;
				},
				"\x07": this._ti(() => {
					this._do_osc();
				}),
				"\x18": () => { this._init(); }, // CAN
				"\x1A": () => { this._init(); }, // SUB
				"": () => { this._addparam(); },
			},

			// OSC ... ST
			13: {
				"\\": this._ti(() => {
					this._do_osc();
				}),
				"": () => { this._init(); },
			},

			4: { // TODO; character set selection
				"@": () => { this._init(); }, // default character set
				"G": () => { this._init(); }, // UTF-8
				"\x18": () => { this._init(); }, // CAN
				"\x1A": () => { this._init(); }, // SUB
				"": () => { this._init(); },
			},

			// TESTS
			5: {
				"8": this._ti(() => {
					for (let y = 0; y < this.nlines; ++y) {
						for (let x = 0; x < this.ncolumns; ++x) {
							let ch = (x+y) % 10;
							this.screen[y][x].ch = ch;
							this._printchar_in_place(ch, x, y);
						}
					}
				}), // Screen alignment test. XTerm fills screen with E's, but numbers are more fun.
				"\x18": () => { this._init(); }, // CAN
				"\x1A": () => { this._init(); }, // SUB
				"": () => { this._init(); },
			},

			/*
			ESC ( B		   Select default (ISO 8859-1 mapping)
			ESC ( 0		   Select VT100 graphics mapping
			ESC ( U		   Select null mapping - straight to character ROM
			ESC ( K		   Select user mapping - the map that is loaded by the utility mapscrn(8).
			
			Same for ESC ), but it defines G1 (TODO).
			*/
			6: {
				"B": () => { this._init(); }, 
				"0": () => { this._init(); }, 
				"U": () => { this._init(); }, 
				"K": () => { this._init(); }, 
				"\x18": () => { this._init(); }, // CAN
				"\x1A": () => { this._init(); }, // SUB
				"": () => { this._init(); }, 
			},

			// DCS, "interesting" to manage...
			7: {
				"\x18": () => { this._init(); }, // CAN
				"\x1A": () => { this._init(); }, // SUB
				"": () => { this._addparam(); }, 
			},

			// ESC [ ?   Why? Why???

			8: {
				"0": () => { this._addparam(); },
				"1": () => { this._addparam(); },
				"2": () => { this._addparam(); },
				"3": () => { this._addparam(); },
				"4": () => { this._addparam(); },
				"5": () => { this._addparam(); },
				"6": () => { this._addparam(); },
				"7": () => { this._addparam(); },
				"8": () => { this._addparam(); },
				"9": () => { this._addparam(); },
				";": () => { this._addparam(); },
				"l": this._ti(() => {
					this._setfeature(this._getarg(0,0), false);
				}), // RESET
				"h": this._ti(() => {
					this._setfeature(this._getarg(0,0), true);
				}), // SET
				"\x18": () => { this._init(); }, // CAN
				"\x1A": () => { this._init(); }, // SUB
				"": () => { this._init(); },
			},

			9: {
				"0": () => { this._addparam(); },
				"1": () => { this._addparam(); },
				"2": () => { this._addparam(); },
				"3": () => { this._addparam(); },
				"4": () => { this._addparam(); },
				"5": () => { this._addparam(); },
				"6": () => { this._addparam(); },
				"7": () => { this._addparam(); },
				"8": () => { this._addparam(); },
				"9": () => { this._addparam(); },
				";": () => { this._addparam(); },
				"c": this._ti(() => {
					this._send_version();
				}), // RESET
				"\x18": () => { this._init(); }, // CAN
				"\x1A": () => { this._init(); }, // SUB
				"": () => { this._init(); },
			},
		};

	}

	/*
	Keyboard handling:
	The conversion of key codes to sequences to sent
	is done by looking up the key code in the following tables.
	Some special values ("none", "numpad") are used to indicate that the key
	is a modifier and should not be sent. Also, "numpad" is used to indicate
	that the key is a numpad key and should be translated to different
	sequences depending on the state set by an appropriate escape sequence.
	"key_translations_numlock_off" and "key_translations_numlock_on" are used
	for this purpose.
	*/


	static key_translations = {
			"Enter": "\r",
			"Backspace": "\x7f", //"\x08",
			"Tab": "\t",
			"Escape": "\x1B",

			"CapsLock": "none",
			"NumLock": "none",
			"ScrollLock": "none",
			"Pause": "none",

			"AltLeft": "none",
			"Altright": "none",
			"ControlLeft": "none",
			"ControlRight": "none",
			"ShiftLeft": "none",
			"MetaLeft": "none",
			"MetaRight": "none",
			"ContextMenu": "none",

			"NumpadEnter": "\r",
			"NumpadDivide": "numpad",
			"NumpadMultiply": "numpad",
			"NumpadAdd": "numpad",
			"NumpadSubtract": "numpad",
			"Numpad0": "numpad",
			"Numpad1": "numpad",
			"Numpad2": "numpad",
			"Numpad3": "numpad",
			"Numpad4": "numpad",
			"Numpad5": "numpad",
			"Numpad6": "numpad",
			"Numpad7": "numpad",
			"Numpad8": "numpad",
			"Numpad9": "numpad",
			"NumpadDecimal": "numpad",

			"ArrowUp": "\x1b[A",
			"ArrowDown": "\x1b[B",
			"ArrowRight": "\x1b[C",
			"ArrowLeft": "\x1b[D",
			"Home": "\x1b[H",
			"End": "\x1b[F",
			"Insert": "\x1b[2~",
			"Delete": "\x1b[3~",
			"PageUp": "\x1b[5~",
			"PageDown": "\x1b[6~",
			"F1": "\x1bOP",
			"F2": "\x1bOQ",
			"F3": "\x1bOR",
			"F4": "\x1bOS",
			"F5": "\x1b[15~",
			"F6": "\x1b[17~",
			"F7": "\x1b[18~",
			"F8": "\x1b[19~",
			"F9": "\x1b[20~",
			"F10": "\x1b[21~",
			"F11": "\x1b[23~",
			"F12": "\x1b[24~",
	};

	static key_translations_app = {
			"ArrowUp": "\x1bOA",
			"ArrowDown": "\x1bOB",
			"ArrowRight": "\x1bOC",
			"ArrowLeft": "\x1bOD",
			"Home": "\x1bOH",
			"End": "\x1bOF",
	};

	static key_translations_numlock_off = {
			"NumpadDivide": "/",
			"NumpadMultiply": "*",
			"NumpadAdd": "+",
			"NumpadSubtract": "-",
			"Numpad0": "Insert",
			"Numpad1": "End",
			"Numpad2": "ArrowDown",
			"Numpad3": "PageDown",
			"Numpad4": "ArrowLeft",
			"Numpad5": "\x0c", // "Clear", non defined, let's try CTRL-L
			"Numpad6": "ArrowRight",
			"Numpad7": "Home",
			"Numpad8": "ArrowUp",
			"Numpad9": "PageUp",
			"NumpadDecimal": "numpad",
	};

	static key_translations_numlock_on = {
			"NumpadDivide": "/",
			"NumpadMultiply": "*",
			"NumpadAdd": "+",
			"NumpadSubtract": "-",
			"Numpad0": "0",
			"Numpad1": "1",
			"Numpad2": "2",
			"Numpad3": "3",
			"Numpad4": "4",
			"Numpad5": "5",
			"Numpad6": "6",
			"Numpad7": "7",
			"Numpad8": "8",
			"Numpad9": "9",
			"NumpadDecimal": ".",
	};


	// Inizialize the palette
	// TODO: make it configurable (at least basic colors). A te the moment,
	// only "background" and "foreground" are configurable. Background is
	// this.palette[0] and foreground is this.palette[7]. Their RGB components
	// can be changed by configuration.

	_create_palette()
	{
		//////////////////////////////
		// (Almost) standard base palette.
		// Apply configured background and foreground.
		// TODO: make it fully configurable.
		this.palette = [ this.background,    "rgb(192,0,0)",   "rgb(0,192,0)",   "rgb(160,160,0)",
		                 "rgb(65,65,192)",  "rgb(160,0,160)", "rgb(0,128,160)", this.foreground,
		                 "rgb(65,65,65)", "rgb(255,0,0)",   "rgb(0,255,0)",   "rgb(255,255,0)",
		                 "rgb(65,65,255)",  "rgb(255,0,255)", "rgb(0,128,255)", "rgb(255,255,255)" ];

	
		//////////////////////////////
		// xterm-256 palette
		this.xpalette = [];

		// Standard 16 colors: 8 base colors + 8 bright colors. Color's
		// RGB components are encoded in 3 levels: 0, 128 (for base), 255 (for bright).
		// Iteration index's bits are used to select the components.
		for (let i = 0; i < 16; ++i) {
			let on = (i & 0x08) ? 255 : 128;
			let r = (i & 0x01) ? on : 0;
			let g = (i & 0x02) ? on : 0;
			let b = (i & 0x04) ? on : 0;
			this.xpalette.push("rgb(" + r + "," + g + "," + b + ")");
		}
		this.xpalette[7] = "rgb(192,192,192)"; // Base color 7 doesn't fit the above pattern.

		// 216 colors (16...231: 6x6x6 RGB combinations.
		// Iteration index (-16) is decomposed in 3 base-6 ciphers. Each cipher
		// is a level index in "v", which is a vector
		// of levels for each component.
		let v = [ 0, 95, 135, 175, 215, 255 ];
		for (let i = 16; i < 232; ++i) {
			let x = (i - 16);
			let rm = x % 6;
			let b = v[rm];
			x  = Math.floor(x / 6);
			rm = x % 6;
			let g = v[rm];
			x  = Math.floor(x / 6);
			rm = x % 6;
			let r = v[rm];
			this.xpalette.push("rgb(" + r + "," + g + "," + b + ")");
		}

		// Grayscale (232...255: 24 levels of gray)
		for (let i = 232; i < 256; ++i) {
			let v = (i - 232) * 10 + 8;
			this.xpalette.push("rgb(" + v + "," + v + "," + v + ")");
		}
	}

	//
	// Layout generator.
	//
	_layout()
	{
		this.div = null;
		this.canvas = null;
		this.title = null;

		if (this.canvasid != "") {
			this.canvas = document.getElementById(this.canvasid);
			if (this.titleid != "") {
				this.title = document.getElementById(this.titleid);
			}
		}
		else {
			if (this.divid == "") {
				this.div = document.createElement("div");
				this.div.style.width = "max-content";
				this.div.style.position = "absolute";
				this.div.style.top = "50%";
				this.div.style.left = "50%";
				this.div.style.transform = "translate(-50%,-50%)";
				document.body.appendChild(this.div);
			}
			else {
				this.div = document.getElementById(this.divid);
			}
			this.div.classList.add("ansi-terminal");
			this.div.style.display = "grid";
			this.div.style.gridTemplateColumns = "auto";
			this.title = document.createElement("div");
			this.title.style.border = "2px solid black";
			this.title.style.backgroundColor = this.title_background;
			this.title.style.color = this.title_foreground;
			this.title.style.font = this.status_fullfont;
			this.div.appendChild(this.title);
			this.canvas = document.createElement("canvas");
			this.canvas.tabIndex = 0;
			this.div.appendChild(this.canvas);
			this.status_div_container = document.createElement("div");
			this.status_div_container.style.font = this.status_fullfont;
			this.status_div_container.style.border = "1px solid black";
			this.status_div_container.style.display = "grid";
			this.status_div_container.style.gridTemplateColumns
			 = "fit-content(10%) fit-content(30%) auto fit-content(15%) fit-content(10%) fit-content(10%) fit-content(10%)";
			this.div.appendChild(this.status_div_container);
			this.freeze_button = document.createElement("button");
			this.freeze_button.style.backgroundColor = this.keyboard_background;
			this.freeze_button.style.color = this.keyboard_foreground;
			this.freeze_button.innerText = "Freeze";
			this.status_div_container.appendChild(this.freeze_button);
			this.freeze_div = document.createElement("div");
			this.freeze_div.style.font = this.status_fullfont;
			this.freeze_div.style.backgroundColor = this.status_background_ok;
			this.freeze_div.style.color = this.status_foreground_ok;
			this.freeze_div.style.border = "1px solid black";
			this.freeze_div.style.paddingLeft = "6px";
			this.freeze_div.style.paddingRight = "6px";
			this.freeze_div.innerText = "Unfrozen";
			this.status_div_container.appendChild(this.freeze_div);
			this.status_div = document.createElement("div");
			this.status_div.style.font = this.status_fullfont;
			this.status_div.style.border = "1px solid black";
			this.status_div.style.paddingLeft = "6px";
			this.status_div.style.paddingRight = "6px";
			this.status_div_container.appendChild(this.status_div);
			this.version_div = document.createElement("div");
			this.version_div.style.font = this.status_fullfont;
			this.version_div.style.backgroundColor = this.status_background_ok;
			this.version_div.style.color = this.status_foreground_ok;
			this.version_div.style.border = "1px solid black";
			this.version_div.style.paddingLeft = "6px";
			this.version_div.style.paddingRight = "6px";
			this.version_div.innerText = "xwterm " + ANSITERM_VERSION;
			this.status_div_container.appendChild(this.version_div);
			this.copy_button = document.createElement("button");
			this.copy_button.style.backgroundColor = this.keyboard_background;
			this.copy_button.style.color = this.keyboard_foreground;
			this.copy_button.innerText = "Copy";
			this.status_div_container.appendChild(this.copy_button);
			this.copy_as_button = document.createElement("button");
			this.copy_as_button.style.backgroundColor = this.keyboard_background;
			this.copy_as_button.style.color = this.keyboard_foreground;
			this.copy_as_button.innerText = "Copy as...";
			this.status_div_container.appendChild(this.copy_as_button);
			this.paste_button = document.createElement("button");
			this.paste_button.style.backgroundColor = this.keyboard_background;
			this.paste_button.style.color = this.keyboard_foreground;
			this.paste_button.innerText = "Paste";
			this.status_div_container.appendChild(this.paste_button);
			this.keyboard_div = document.createElement("div");
			this.keyboard_div.style.display = "grid";
			this.keyboard_div.style.gridTemplateColumns = "auto auto auto auto auto auto auto auto auto auto auto auto";
			this.keyboard_div.style.border = "2px solid black";
			this.div.appendChild(this.keyboard_div);

			let button_properties = [];

			for (let i = 0; i < 12; ++i) {
				let t = "F" + (i+1);
				let p = {
					text: t,
					key: { key: t, code: t, composed: false, ctrlKey: false, altKey: false, metaKey: false, },
				};
				button_properties.push(p);
			}
			button_properties.push({
						text: "TAB",
						key: { key: 'Tab', code: 'Tab', composed: false, ctrlKey: false, altKey: false, metaKey: false, },
					});
			button_properties.push({
						text: "CTRL-L",
						key: { key: 'l', code: 'KeyL', composed: true, ctrlKey: true, altKey: false, metaKey: false, },
					});
			button_properties.push({
						text: "\x60 (Backquote)",
						key: { key: "\x60", code: 'Backquote', composed: false, ctrlKey: false, altKey: false, metaKey: false, },
					});
			button_properties.push({
						text: "\x7e (Tilde)",
						key: { key: "\x7e", code: 'Tilde', composed: false, ctrlKey: false, altKey: false, metaKey: false, },
					});
			
			for (let i = 0; i < button_properties.length; ++i) {
				let e = document.createElement("button");
				e.style.backgroundColor = this.keyboard_background;
				e.style.color = this.keyboard_foreground;
				e.innerText = button_properties[i].text;
				e.addEventListener("click", (event) => {
						this._send_key(button_properties[i].key);
						this.canvas.focus();
					});
				if (i >= 12) {
					e.style.gridColumnStart = (i - 12) * 3 + 1;
					e.style.gridColumnEnd = (i - 12) * 3 + 4;
				}
				this.keyboard_div.appendChild(e);
			}

			this.copy_button.addEventListener("click",
				(event) => {
					this._clipboard_copy();
				});

			this.copy_as_button.addEventListener("click",
				(event) => {
					this.menu.showModal();
					let r1 = this.copy_as_button.getBoundingClientRect();
					let r2 = this.menu.getBoundingClientRect();
					let x = Math.floor(event.x - event.offsetX - r2.width + r1.width);
					let y = Math.floor(event.y - event.offsetY - r2.height);
					this.menu.style.left = x + "px";
					this.menu.style.top = y + "px";
					});

			this.paste_button.addEventListener("click",
				(event) => {
					this._read_from_clipboard();
					this.canvas.focus();
				});

			this.freeze_button.addEventListener("click",
				(event) => {
					this._toggle_freeze();
					this.canvas.focus();
				});
	
		}


		if (true) {
		// TODO / WIP: Copy/Paste popup menu
		this.menu = document.createElement("dialog");
		//this.menu.open = false;
		//this.menu.style.position = "absolute";
		//this.menu.style.display = "inline-block";
		//this.menu.style.visibility = "hidden";
		this.menu.style.height = "max-content"; //"auto";
		this.menu.style.width = "max-content"; //"auto";
		this.menu.style.border = "3px solid " + this.title_foreground;
		this.menu.style.margin = "0px";
		this.menu.style.padding = "0px";
		this.menu.style.backgroundColor = this.title_background;
		this.menu.style.color = this.title_foreground;
		//this.menu.style.font = this.status_fullfont;
			
		this.menu.innerText = "Copy as...";
	
		this.menu_items = {
			copy_as_is: {
					text: "Text",
					fn: () => {
						this._clipboard_copy();
					}
				},
				/*
			copy_and_trim: {
					text: "Copy and trim spaces",
					fn: () => {
						
					}
				}, */
			copy_as_ansi: {
					text: "ANSI sequence",
					fn: () => {
						this._write_to_clipboard_as_ansi();
						this._clear_selection();
						this.canvas.focus();
					}
				},
			copy_as_html: {
					text: "HTML",
					fn: () => {
						this._write_to_clipboard_as_html(true);
						this._clear_selection();
						this.canvas.focus();						
					}
				},
			copy_as_rich_text: {
				text: "Rich Text",
				fn: () => {
					this._write_to_clipboard_as_html(false);
					this._clear_selection();
					this.canvas.focus();						
				}
			},
			quit: {
					text: "Quit",
					fn: () => {
						this._clear_selection();
						this.canvas.focus();												
					}
				},

		};



		this.menu_div = document.createElement("div");
		this.menu_div.style.border = "0px";
		this.menu_div.style.margin = "0px";
		this.menu_div.style.padding = "0px";
		this.menu_div.style.display = "grid";
		this.menu_div.style.gridTemplateColumns = "auto";
		this.menu.appendChild(this.menu_div);

		for (let key in this.menu_items) {
			let e = document.createElement("button");
			e.style.border = "1px solid " + this.title_foreground;;
			e.style.margin = "0px";
			e.style.padding = "0px";
			e.style.backgroundColor = this.title_background;
			e.style.color = this.title_foreground;
			e.innerText = this.menu_items[key].text; 
			e.addEventListener("click", (event) => {
				this.menu_items[key].fn();
				e.style.color = this.title_foreground;
				e.style.backgroundColor = this.title_background;
				this.menu.close();
			});
			e.addEventListener("mouseenter",
				(event) => {
					e.style.color = this.title_background;
					e.style.backgroundColor = this.title_foreground;
				}
			);
			e.addEventListener("mouseleave",
				(event) => {
					e.style.color = this.title_foreground;
					e.style.backgroundColor = this.title_background;
				}
			);
			this.menu_items[key].element = e;
			this.menu_div.appendChild(e);
		}

		document.body.appendChild(this.menu);

		}
		
		// Set up canvas' sensitivity to mouse events.
		this.canvas.addEventListener("click", (event) => {
			this._on_mouse_click(event);
		});

		this.canvas.addEventListener("mousedown", (event) => {
			this._on_mouse_down(event);
		});

		this.canvas.addEventListener("mouseup", (event) => {
			this._on_mouse_up(event);
		});

		this.canvas.addEventListener("mousemove", (event) => {
			this._on_mouse_move(event);
		});


		this.gc = this.canvas.getContext("2d");
		this.gc.font = this.fullfont;
		this.gc.textBaseline = "bottom";

		// An ugly trick to calculate character width and height.
		this.charwidth = 0;
		this.charheight = 0;
		//[..."Xmg_TGOWMQ[]{}|"].forEach(e => {
		//[..."\u2500|"].forEach(e => {
		[..."X|"].forEach(e => {
				let cm = this.gc.measureText(e);
				// Sometimes the measures are not integers, so we
				// round them to the nearest integer.
				let w = Math.floor(cm.actualBoundingBoxLeft + cm.actualBoundingBoxRight + 0.5);
				let h = Math.floor(cm.fontBoundingBoxAscent + cm.fontBoundingBoxDescent + 0.5);
				if (w > this.charwidth) {
					this.charwidth = w;
				}
				if (h > this.charheight) {
					this.charheight = h;
				}
		});

		this.underline_height = Math.floor(this.charheight / 10); // TODO: make parametric
		this.underline_off = Math.floor(this.charheight / 10); // TODO: make parametric
		if (this.underline_off < 1) {
			this.underline_off = 1;
		}
		this.width = this.charwidth * this.ncolumns;
		this.height = this.charheight * this.nlines;
		//this.gc.canvas.width = this.width;
		//this.gc.canvas.height = this.height;
		this.gc.canvas.width = this.width;
		this.gc.canvas.height = this.height;
		// We must repeat this after a size change:
		this.gc.font = this.fullfont;
		this.gc.textBaseline = "bottom";


		//this.scrollbar = new GenericScrollBarAdder(this.canvas);


	}

	// Table to convert public configuration keys to internal members.
	// (Yes, I am too lazy to rename all the public keys to match the internal ones).
	static config_to_members = {
		nLines: "nlines",
		nColumns: "ncolumns",
		fontSize: "fontsize",
		font: "font",
		statusFont: "status_font",
		divId: "divid",
		canvasId: "canvasid",
		titlesId: "titleid",
		url: "url",
		source: "source",
		config: "config",
		dest: "dest",
		immediateRefresh: "immediate_refresh",
		fastRefresh: "fast_refresh",
		slowRefresh: "slow_refresh",
		foreground: "foreground",
		background: "background",
		statusForegroundOk: "status_foreground_ok",
		statusBackgroundOk: "status_background_ok",
		statusForegroundKo: "status_foreground_ko",
		statusBackgroundKo: "status_background_ko",
		titleBackground: "title_background",
		titleForeground: "title_foreground",
		keyboardBackground: "keyboard_background",
		keyboardForeground: "keyboard_foreground",
		selectionBackground: "selection_foreground",
		selectionForeground: "selection_background",
		blinkIsBold: "blink_is_bold",
		blinkPeriod: "blink_period",
		timeout: "timeout",
		titleText: "title_text",
	};


	constructor(params)
	{

		// Contructor's parameters and their defaut values:

		// Some handy conventions:
		// no parameters: apply defaults, create a new terminal in a new div.
		// string parameter: apply defaults, create a new terminal in the div with the given id.
		if (! params) {
			params = "";
		}
		if (typeof params == 'string') {
			params = { divId: params };
		}

		// Apply defaults, overwrite with actual parameters
		this.configuration = { ...ANSITERM_DEFAULTS, ...params };

		// Convert public configuration keys to internal members.
		for (let key in this.configuration) {
			if (AnsiTerm.config_to_members[key]) {
				this[AnsiTerm.config_to_members[key]] = this.configuration[key];
			}
		}

		// Fix some defaults that can't be set in the defaults table.
		this.url = this.url || window.location.href;
		this.keyboard_background = this.keyboard_background || this.title_background;
		this.keyboard_foreground = this.keyboard_foreground || this.title_foreground;

		// Initialize state variables.
		this.underline = false;
		this.blink = false;
		this.reverse = false;
		this.highlight = false;
		this.blink_cursor = true;
		this.blink_period = 500;
		this.enable_cursor = true;
		this.force_blink_cursor = true;

		this.status_ok = false;

		this.bold = false;
		this.italic = false;

		this.selection_on = false;
		this.selection_active = false;
		this.selection_start = -1;
		this.selection_end = -1;
		this.selection_last = -1;
		
		this.incoming_text = "";

		this.output_frozen_by_user = false;

		this.url_source = this.source;
		//this.url_source = this.url + this.source;
		this.url_dest = this.dest;
		this.url_config = this.config;
		//this.url_dest = this.url + this.dest;
		this.fullfont = this.fontsize.toString() + "px " + this.font;
		this.status_fullfont = /* this.fontsize.toString() + "px " + */ this.status_font;


		// Create elements and layout.
		this._layout();
		
		this._create_palette();


		this._reset();

		document.onkeydown = ((e) => { this._on_keydown(e); });

		this.blink_timer = setTimeout( (() => { this._blink_timeout(); }), this.blink_period);

		this.save_posx = this.posx;
		this.save_posy = this.posy;
		this.save_posx_2 = this.posx;
		this.save_posy_2 = this.posy;
		this._savestate();

		this._set_title(this.title_text);
		this._set_status(false);

		this.app_cursor_keys = false;

		this.timer = null;
		this.state = 0;
		this.pending_text = "";
		this.ch = "";
		this.paramstr = "";
		this.def_G0 = false;

		this._create_sm();

		this.selection_timer = null;

		this.timer = setTimeout( (() => { this._setsize(); }), this.immediate_refresh);

	}

	_flush()
	{
		if (this.pending_text.length > 0) {
			// TODO: optimize
			for (let i = 0; i < this.pending_text.length; ++i) {
							this._printchar(this.pending_text[i]);
							if (this.posx >= this.ncolumns - 1) {
								this._setpos(0, this.posy);
								this._nextline();
							}
							else {
								this._incpos(1, 0);
							}
			}
			this.pending_text = "";
		}
	}

	_getargs()
	{
		return this.paramstr.split(";");
	}

	_getarg(index, val_default)
	{
		let args = this._getargs();
		let v;
		if (args[index] && args[index] != "") {
			v = Number(args[index]);
		}
		else {
			v = val_default;
		}
		return v;
	}

	_addparam()
	{
		this.paramstr += this.ch;
	}

	_clear_timer()
	{
		if (this.timeout > 0 && this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}


	_reset_timer()
	{
		this._clear_timer();
		if (this.timeout > 0) {
			this.timer = setTimeout(() => {
				this._sm("", true);
			}, this.timeout);
		}
	}

	_sm(ch, reset)
	{
		// CAN, SUB, timeout and maybe something else
		// cause immediate abort of sequences.
		if (reset) {
			this._init();
			return;
		}

		let old_state = this.state;
		
		// Special characters mus be evaulated immediately  anyway.
		// A very tricky case is BEL, because it's the terminator of OSC sequences.
		// So: let's see if in current state there is a specific handler for current character.
		// If not, let's see if it's a special character (i.e., it has an handler in state 0).
		// If not, let's take the default handler in current state.
		let f = this.transitions[this.state][ch];
		if (f) {
			// Special characters are explicitly handled only in state 0.
			// Well, almost always... 
		}
		else {
			f = this.transitions[0][ch];
			if (! f) {
			// Normal characters are NOT handled explicitly in state 0,
			// so this test is true only for special characters.
				f = this.transitions[this.state][""];
			}
		}

		f();

		if (this.state != 0) {
			// Fire up guar timer. Abort sequence on timeout.
			this._reset_timer();
		}
		else {
			if (old_state != 0) {
				this._clear_timer();
			}
		}

		//console.log(f);
		//console.log(this.posy);
	}

	_apply(t)
	{
		this._clear_timer();

		for (let i = 0; i < t.length; ++i) {
			this.ch = t[i];
			this._sm(t[i], false);
		}

		this._flush();
	}

	_setcell(x, y, src)
	{
		let blink = this.screen[y][x].blink;
		this.screen[y][x] = src;
		if (src.blink != blink) {
			if (blink) {
				delete this.blink_list[x + "," + y];
			}
			else {
				this.blink_list[x + "," + y] = { x: x, y: y};
			}
		}
	}

	_clearscreen()
	{
		let y;
		let x;
		for (y = 0; y < this.nlines; ++y) {
			for (x = 0; x < this.ncolumns; ++x) {
				this.screen[y][x] = {
					ch: " ",
					background: this.background,
					foreground: this.foreground,
					blink: this.blink,
					underline: this.underline,
					reverse: this.reverse,
					bold: this.bold,
					italic: this.italic
				};
			}
		}
	}

	_update_status_element(el, ok, text_ok, text_ko)
	{
		if (ok) {
			el.style.color = this.status_foreground_ok;
			el.style.backgroundColor = this.status_background_ok;
			el.innerText = text_ok;
		}
		else {
			el.style.color = this.status_foreground_ko;
			el.style.backgroundColor = this.status_background_ko;
			el.innerText = text_ko;
		}
	}

	_set_status(ok)
	{
		if (this.status_ok != ok) {
			this._update_status_element(this.status_div, ok, "Connected", "Disconnected")
			this.status_ok = ok;
		}
	}

	_update_freeze_state()
	{
		let frozen = (this.output_frozen_by_user || this.selection_active);
		if (! frozen) {
			this._apply(this.incoming_text);
			this.incoming_text = "";
		}
		this._update_status_element(this.freeze_div, !frozen, "Unfrozen", "Frozen - " + this.incoming_text.length + " bytes pending")
	}

	_toggle_freeze()
	{
		this.output_frozen_by_user = ! this.output_frozen_by_user;
		this.freeze_button.innerText = this.output_frozen_by_user ? "Unfreeze" : "Freeze";
		this._update_freeze_state();
	}

	_set_title(t)
	{
		this.title_text = t;
		if (this.title) {
			try {
				this.title.innerText = t;
			} catch {
			}
		}
	}

	_do_osc()
	{
		let a = this._getargs();

		if (a.length < 1) {
			return;
		}
		
		if (a[0][0] == "l" || a[0][0] == "L") {
			this._set_title(this.paramstr.slice(2));
			return;
		}

		let a0 = this._getarg(0,0);

		if (a0 == 0 || a0 == 2) {
			let p = this.paramstr.indexOf(";");
			if (p < 0) {
				p = 0;
			}
			this._set_title(this.paramstr.slice(p + 1));
		}
		else if (a0 >= 10 && a0 <= 19 && a[1] == "?") {
			// Retuturn RGB codes of some "notable" colors.
			let to_palette = {
				10: 7,
				11: 0,
				12: 15,
				13: 15,
				14: 8,
				15: 7,
				16: 0,
				17: 8,
				18: 15,
				19: 15,
			};
			this._send("\x1B]" + a0 + ";rgb:" + this.palette[to_palette[a0]].slice(4).replace(")", "").replace(/,/g, "/") + "\x07");
		}
	}

	_redraw_box(x0, y0, width, height)
	{
		let bg = this.background;
		let fg = this.foreground;
		let ul = this.underline;
		let bold = this.bold;
		let italic = this.italic;
		let reverse = this.reverse;
		let blink = this.blink;

		if (width < 0) {
			width = 0;
		}
		else if (width > this.ncolumns) {
			width = this.ncolumns;
		}
		if (height < 0) {
			height = 0;
		}
		else if (height > this.nrows) {
			height = this.nrows;
		}
		if (x0 < 0) {
			x0 = 0;
		}
		if (x0 + width >= this.ncolumns) {
			x0 = this.ncolumns - width;
		}
		if (y0 < 0) {
			y0 = 0;
		}
		if (y0 + height >= this.nrows) {
			y0 = this.nrows - height;
		}

		//console.log("redraw",x0, y0, width, height);

		for (let y = y0; y < y0 + height; ++y) {
			for (let x = x0; x < x0 + width; ++x) {

				let ch = this.screen[y][x];
				this.background = ch.background;
				this.foreground = ch.foreground;
				this._setbold(ch.bold);
				this._setitalic(ch.italic);
				this.underline = ch.underline;
				this.blink = ch.blink;
				this.reverse = ch.reverse;

				this._printchar_in_place(ch.ch, x, y);

			}
		}

		this.background = bg;
		this.foreground = fg;
		this._setbold(bold);
		this._setitalic(italic);
		this.underline = ul;
		this.blink = blink;
		this.reverse = reverse;
		this.cursor_off = true;
	}

	_redraw()
	{
		this._redraw_box(0, 0, this.ncolumns, this.nlines);
	}

	_setfeature(a, f)
	{
		if (a == 1) {
			this.app_cursor_keys = f;
		}
		else if (a == 12) {
			if (this.blink_cursor != f && !this.force_blink_cursor) {
				this.blink_cursor = f;
				if (this.enable_cursor) {
					if (! f) {
						this._unblink_cursor();
						this._do_blink_cursor();
					}
				}
			}
		}
		else if (a == 25) {
			if (f != this.enable_cursor) {
				this.enable_cursor = f;
				if (f) {
					this.cursor_off = true;
					this._do_blink_cursor();
				}
				else {
					this._unblink_cursor();
				}
			}
		}
		else if (a >= 1047 && a <= 1049) {
			if (a == 1047 || a == 1049) {
				this._selectscreen(f);
			}
			if (a == 1048 || a == 1049) {
				if (f) {
					//this.savestate();
					this.save_posx_2 = this.posx;
					this.save_posy_2 = this.posy;
				}
				else {
					//this.restorestate();
					this._setpos(this.save_posx_2, this.save_posy_2);
				}
			}
		}
	}

	_do_blink_cursor()
	{
		let unblink = (this.posx != this.x_lastblink || this.posy != this.y_lastblink)
		if (unblink) {
			this._unblink_cursor();
		}
		if (this.blink_cursor || this.cursor_off) {
			this.x_lastblink = this.posx;
			this.y_lastblink = this.posy;
			let op = this.gc.globalCompositeOperation;
			this.gc.globalCompositeOperation = "xor";
			this._clearcharbb(this.foreground);
			this.gc.globalCompositeOperation = op;
		}
		this.cursor_off = false;
	}

	_do_blink()
	{
		// Cursor...
		if (this.enable_cursor) {
			this._do_blink_cursor();
		}

		// ..and characters

		Object.keys(this.blink_list).forEach((v, i, a) => {
			if (v) {
				let x = this.blink_list[v].x;
				let y = this.blink_list[v].y;
				let ch = this.screen[y][x];
				let fg = ch.foreground;
				let bg = ch.background;
				if (ch.reverse) {
					bg = ch.foreground;
					fg = ch.background;
				}
				if (this.blink_state) {
					fg = bg;
				}
				this._drawchar(ch.ch, x * this.charwidth, (y + 1) * this.charheight - 1, fg, bg, ch.underline);
			}
		});

		this.blink_state = ! this.blink_state;
	}

	_blink_timeout()
	{
		this._do_blink();
		this.blink_timer = setTimeout( (() => { this._blink_timeout(); }), this.blink_period);
	}

	_unblink_cursor()
	{
		if (this.x_lastblink >= 0 && this.y_lastblink >= 0) {
			let bg = this.background;
			let fg = this.foreground;
			let ch = this.screen[this.y_lastblink][this.x_lastblink];
			this.background = ch.background;
			this.foreground = ch.foreground;
			this._printchar_in_place(ch.ch, this.x_lastblink, this.y_lastblink);
			this.background = bg;
			this.foreground = fg;
		}
		this.cursor_off = true;
	}

	_setpos(x, y)
	{
		if (x < 0) {
			x = 0;
		}
		if (y < 0) {
			y = 0;
		}
		if (x >= this.ncolumns) {
			x = this.ncolumns - 1;
		}
		if (y >= this.nlines) {
			y = this.nlines - 1;
		}
		this.posx = x;
		this.posy = y
		this.pospx = this.posx * this.charwidth;
		this.pospy = (this.posy + 1) * this.charheight - 1;
	}

	_incpos(dx, dy)
	{
		this._setpos(this.posx + dx, this.posy + dy);
	}

	_scroll_core(y_start, y_end, jump)
	{
		if (jump == 0) {
			return;
		}
		let ajump = jump;
		let up = true;
		if (ajump < 0) {
			up = false;
			ajump = -ajump;
		}
		let yd = (y_end - y_start);
		if (ajump > yd) {
			ajump = yd;
			jump = up ? yd : -yd;
		}
		let jumppx = ajump * this.charheight;
		let py = y_start * this.charheight;
		let pheight = (yd - ajump + 1) * this.charheight;
		let py_src;
		let py_dest;
		let py_clr;
		let ymove_start;
		let ymove_end;
		let y_to_erase;
		let ymove_step;
		let ajmp1 = ajump - 1;

		if (up) {
			py_src = py + jumppx;
			py_dest = py;
			py_clr = (y_end - ajmp1) * this.charheight;
			ymove_start = y_start;
			ymove_end = y_end - ajmp1;
			y_to_erase = y_end;
			ymove_step = 1;
		}
		else {
			py_src = py;
			py_dest = py + jumppx;
			py_clr = py;
			ymove_start = y_end;
			ymove_end = -(y_start + ajmp1);
			y_to_erase = y_start;
			ymove_step = -1;
		}

		if (pheight > 0) {
			// Will drawImage work on overlapped areas? It looks like it does...

			if (false) {
				let d = this.gc.getImageData(0, py_src, this.gc.canvas.width, pheight);
				this.gc.putImageData(d, 0, py_dest);
			}
			else {
				this.gc.drawImage(this.canvas,
								0, py_src, this.gc.canvas.width, pheight,
								0, py_dest, this.gc.canvas.width, pheight);
			}
		}

		this.gc.fillStyle = this.background;
		this.gc.fillRect(0, py_clr, this.gc.canvas.width, jumppx);
		this.gc.fillStyle = this.foreground;

		for (let y = ymove_start; (y * ymove_step) < ymove_end; y += ymove_step) {
			for (let x = 0; x < this.ncolumns; ++x) {
				this._setcell(x, y, { ...this.screen[y + jump][x] });
			}
		}

		//this.dump();
		for (let y = y_to_erase; (y * ymove_step) >= ymove_end; y -= ymove_step) {
			for (let x = 0; x < this.ncolumns; ++x) {
				this._clearcharscr(x, y);
			}
		}
		//this.dump();

		if (this.y_lastblink >= y_start && this.y_lastblink <= y_end) {
			this.y_lastblink -= jump;
			if (this.y_lastblink < 0) {
				this.y_lastblink = 0;
			}
			else if (this.y_lastblink >= this.nlines) {
				this.y_lastblink = this.nlines - 1;
			}
		}
	}

	_scroll_from(y_start)
	{
		this._scroll_core(y_start, this.scrollregion_h, 1)
	}

	_scroll_multi(n)
	{
		this._scroll_core(this.scrollregion_l, this.scrollregion_h, n)
	}

	_scroll()
	{
		this._scroll_from(this.scrollregion_l);
	}

	_revscroll_from(y_start)
	{
		this._scroll_core(y_start, this.scrollregion_h, -1)
	}

	_revscroll()
	{
		this._revscroll_from(this.scrollregion_l);
	}

	_tab()
	{
		let l = 8 - this.posx % 8;
		for (let i = 0; i < l ; ++i) {
			this.pending_text += " ";
			if (this.posx + i >= this.ncolumns - 1) {
				this._flush();
			}
		}
	}

	_nextline()
	{
		if (this.posy >= this.scrollregion_h) {
			this._scroll();
		}
		else {
			this._setpos(this.posx, this.posy + 1);
		}
	}

	_newline()
	{
		this._flush();
		this._nextline();
	}

	_upline()
	{
		if (this.posy <= this.scrollregion_l) {
			this._revscroll();
		}
		else {
			this._setpos(this.posx, this.posy - 1);
		}
	}

	_setfontstyle()
	{
		let f = this.fullfont;
		if (this.italic) {
			f = "italic " + f;
		}
		if (this.bold) {
			f = "bold " + f;
		}
		this.gc.font = f;
	}

	_setitalic(f)
	{
		if (f != this.italic) {
			this.italic = f;
			this._setfontstyle();
		}
	}

	_setbold(f)
	{
		if (f != this.bold) {
			this.bold = f;
			this._setfontstyle();
		}
	}

	_resetattr()
	{
		this.background = this.palette[0];
		this.foreground = this.palette[7];
		this.blink = false;
		this.underline = false;
		this.reverse = false;
		this._setbold(false);
		this._setitalic(false);
	}

	_setattr()
	{
		let args = this._getargs();

		if (args.length < 1) {
			args[0] = "0";
		}

		for (let j = 0; j < args.length; ++j) {
			let a = args[j];
			// I don't know what the hell is this % that vim sometimes generates. It looks like a bug,
			// (probably in terminfo) because it's not documented in the xterm sequences.
			a = a.replace(/%/,"");
			a = Number(args[j]);

			switch (a) {

			case 0:
				this._resetattr();
				break;
			case 30: case 31: case 32: case 33: case 34: case 35: case 36: case 37:	
				this.foreground = this.palette[a - 30];
				break;
			case 90: case 91: case 92: case 93: case 94: case 95: case 96: case 97:	
				this.foreground = this.palette[a - 90 + 8];
				break;
			case 40: case 41: case 42: case 43: case 44: case 45: case 46: case 47:	
				this.background = this.palette[a - 40];
				break;
			case 100: case 101: case 102: case 103: case 1010: case 105: case 106: case 107:	
				this.background = this.palette[a - 100 + 8];
				break;
			case 38:
			case 48:
				if (args.length - j >= 3)  {
					let e = Number(args[j+1]);
					if ((e == 2) && (args.length - j >= 6)) {
						let c = "rgb(" + Number(args[j+3]) + "," + Number(args[j+4]) + "," + Number(args[j+5]) + ")";
						if (a == 38) {
							this.foreground = c;
						}
						else {
							this.background = c;
						}
						j += 5;
					}
					else if (e == 5) {
						let c = Number(args[j + 2]);
						if (a == 38) {
							this.foreground = this.xpalette[c];
						}
						else {
							this.background = this.xpalette[c];
						}
						j += 2;
					}
				}
			case 39:
				this.foreground = this.palette[7];
				break;
			case 49:
				this.background = this.palette[0];
				break;
			case 1:
				this._setbold(true);
				break;
			case 2:
				// TODO: Faint, decreased intensity, ECMA-48 2nd.
				break;
			case 8:
				// TODO: Invisile, i.e., hidden, ECMA-48 2nd, VT300.
			case 28: // Visible
				break;
			case 9:
				// TODO: Crossed-out characters, ECMA-48 3rd.
			case 29: // Not crossed-out characters
				break;
			case 22:
				this._setbold(false);
				break;
			case 3:
				this._setitalic(true);
				break;
			case 23:
				this._setitalic(false);
				break;
			case 4:
				this.underline = true;
				break;
			case 24:
				this.underline = false;
				break;
			case 5:
				if (this.blink_is_bold) {
					this._setbold(true);
				}
				else {
					this.blink = true;
				}
				break;
			case 25:
				if (this.blink_is_bold) {
					this._setbold(false);
				}
				else {
					this.blink = false;
				}
				break;
			case 7:
				this.reverse = true;
				break;
			case 27:
				this.reverse = false;
				break;

			default:
				break;
			}
		}
	}

	_screen_geometry()
	{
		let r = "";
		let a = this._getarg(0,0);
		switch (a) {
		case 11:
			r = "\x1B[1t";
			break;
		case 13:
			r = "\x1B[3;0;0t";
			break;
		case 14:
		case 15:
			r = "\x1B[" + (a - 10) + ";" + (this.charheight * this.nlines) + ";" + (this.charwidth * this.ncolumns) + "t";
			break;
		case 16:
			r = "\x1B[6;" + this.charheight + ";" + this.charwidth + "t";
			break;
		case 18:
		case 19:
			r = "\x1B[" + (a - 10) + ";" + this.nlines + ";" + this.ncolumns + "t";
			break;
		default:
			break;
		}
		if (r != "") {
			this._send(r);
		}
		// But here's what linux' "resize" command does:
		//'\r\n\x1B[?2004l\r\x1B7\x1B[r\x1B[9999;9999H\x1B[6n'
	}

	_erase_screen(a)
	{
		let x = this.posx;
		let y = this.posy;
		if (a < 2) {
			this._erase_line(a);
		}
		let start = (a == 0) ? (y + 1) : 0;
		let end = (a == 1) ? y : this.nlines;
		// TODO: optimize
		for (let i = start; i < end; ++i) {
			for (let j = 0; j < this.ncolumns; ++j) {
				this._setpos(j, i);
				this._clearchar();
			}
		}
		this._setpos(x, y);
	}

	_erase(start, end)
	{
		let x = this.posx;
		let y = this.posy;
		for (let i = start; i < end; ++i) {
			this._setpos(i, this.posy);
			this._clearchar();
		}
		this._setpos(x, y);
	}

	_erase_line(a)
	{
		let x = this.posx;
		let start = (a == 0) ? x : 0;
		let end = (a == 1) ? (x + 1) : this.ncolumns;
		this._erase(start, end);
	}

	_insert_lines(n)
	{
		for (let i = 0; i < n; ++i) {
			this._revscroll_from(this.posy);
		}
	}

	_delete_lines(n)
	{
		for (let i = 0; i < n; ++i) {
			this._scroll_from(this.posy);
		}
	}

	_erase_chars(n)
	{
		let x = this.posx;
		this._erase(x, x + n);
	}

	_delete_chars(n)
	{
		if (n + this.posx >= this.ncolumns) {
			n = this.ncolumns - this.posx - 1;
		}

		for (let i = this.posx; i < this.ncolumns - n; ++i) {
			this._setcell(i, this.posy, { ...this.screen[this.posy][i + n] });
		}

		this._redraw_box(this.posx, this.posy, this.ncolumns - this.posx - n, 1)

		this._erase(this.ncolumns - n, this.ncolumns);
	}

	_clearcharbbxy(bg, x, y)
	{
		this.gc.fillStyle = bg;
		this.gc.fillRect(x, y - this.charheight + 1, this.charwidth, this.charheight);
	}

	_clearcharbb(bg)
	{
		this._clearcharbbxy(bg, this.pospx, this.pospy);
	}

	_clearcharscr(x,y)
	{
		this._setcell(x, y,  {
			ch: " ",
			background: this.background, // this.palette[0],
			foreground: this.foreground, // this.palette[7],
			blink: false,
			reverse: false,
			bold: false,
			italic: false,
			underline: false,
		});
	}

	_clearchar()
	{
		this._clearcharscr(this.posx, this.posy);
		this._clearcharbb(this.background /*this.palette[0] */);
	}

	_drawchar(ch, px, py, fg, bg, ul)
	{
		this._clearcharbbxy(bg, px, py);
		this.gc.fillStyle = fg;
		this.gc.fillText(ch, px, py);
		if (ul) {
			this.gc.fillRect(px, py - this.underline_off, this.charwidth, this.underline_height);
		}
	}

	_printchar_in_place_pix(ch, x, y, px, py)
	{
		let fg = this.foreground;
		let bg = this.background;
		if (this.reverse) {
			bg = this.foreground;
			fg = this.background;
		}
		if (this.highlight) {
			fg = this.selection_foreground;
			bg = this.selection_background;
		}
		this._drawchar(ch, px, py, fg, bg, this.underline);
	}

	_printchar_in_place(ch, x, y)
	{
		this._printchar_in_place_pix(ch, x, y, x * this.charwidth, (y + 1) * this.charheight - 1);
	}

	_printchar(ch)
	{
		this._setcell(this.posx, this.posy, {
			ch: ch,
			background: this.background,
			foreground: this.foreground,
			blink: this.blink,
			reverse: this.reverse,
			bold: this.bold,
			italic: this.italic,
			underline: this.underline,
		});
		this._printchar_in_place_pix(ch, this.posx, this.posy, this.pospx, this.pospy);
	}

	_send_request(url)
	{
		let xhr = new XMLHttpRequest();

		xhr.onreadystatechange = () => {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if (xhr.status >= 200 && xhr.status < 400) {
					let data = JSON.parse(xhr.responseText);
					let t = data["text"];
					t =  decodeURIComponent(escape(t));
					if (this.output_frozen_by_user || this.selection_active) {
						this.incoming_text += t;
						this._update_freeze_state();
					}
					else {
						this._apply(t);
					}
					if (t != "") {
						console.log(data);
					}
					clearTimeout(this.timer);
					this.timer = setTimeout( (()  => { this._update(); }), this.fast_refresh);
					this._set_status(true);
				}
				else {
					console.log(xhr.status);
					clearTimeout(this.timer);
					this.timer = setTimeout( (() => { this._update(); }), this.slow_refresh);
					this._set_status(false);
				}
			}
		}
				
		try {
			xhr.open('GET', url, true);
			xhr.send();
		} catch {
			this._set_status(false);
		}
	}

	_update()
	{
		this._send_request(this.url_source);
	}

	_setsize()
	{
		let q = this.url_config.replace("?lines?", this.nlines).replace("?columns?", this.ncolumns);
		this._send_request(q);
	}

	_send(t)
	{
		let xhr = new XMLHttpRequest();
		xhr.onreadystatechange = () => {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				clearTimeout(this.timer);
				if (xhr.status >= 200 && xhr.status < 400) {
					console.log(xhr.responseText);
					//clearTimeout(this.timer);
					//this.timer = setTimeout( (()  => { this.update(); }), this.fast_refresh);
					this._update();
					this._set_status(true);
				}
				else {
					console.log(xhr.status);
					clearTimeout(this.timer);
					this.timer = setTimeout( (() => { this._update(); }), this.slow_refresh);
					this._set_status(false);
				}
			}
		}
		try {
			xhr.open("POST", this.url_dest, true);
			xhr.setRequestHeader('Content-Type', 'text/plain');
			xhr.send(t);
		} catch {
			this._set_status(false);
		}
	}

	_send_id()
	{
		this._send("\x1B[?6c");
	}

	_send_version()
	{
		this._send("\x1B[>65;6800;1c");
	}

	_send_pos()
	{
		this._send("\x1B[" + (this.posy + 1) + ";" + (this.posx + 1) + "R"); // VT101 and Windows console
	}

	_send_ok()
	{
		this._send("\x1B[0n");
	}

	_eval_key(ev)
	{
		let key;
		let e = {
			key: ev.key,
			code: ev.code,
			composed: ev.composed,
			ctrlKey: ev.ctrlKey,
			altKey: ev.altKey,
			metaKey: ev.metaKey,
		};

		if (e.key.length != 1) {
			//key = String.fromCharCode(e.keyCode);
			key = "";
		}
		else {
			key = e.key;
		}

		// DEBUG //
		console.log(e);
		if (e.key == "ContextMenu") {
			this._dump();
		}
		///////////
		if (AnsiTerm.key_translations[e.code] == "numpad") {
			if (key.length != 1) {
				key = "";
				e.key = AnsiTerm.key_translations_numlock_off[e.code];
			}
			e.code = e.key;	
		}
		if (this.app_cursor_keys && AnsiTerm.key_translations_app[e.code]) {
			key = AnsiTerm.key_translations_app[e.code];
		}
		else if (AnsiTerm.key_translations[e.code]) {
			key = AnsiTerm.key_translations[e.code];
			if (key == "none") {
				key = "";
			}
		}
		else {
			if (e.composed) {
				if (e.altKey || e.metaKey) {
					key = "";
				}
				else if (e.ctrlKey) {
					let b = e.key.charCodeAt(0);
					if (b >= 64 && b < 96) {
						key = String.fromCharCode(b - 64);
					}
					else if (b >= 96 && b < 128) {
						key = String.fromCharCode(b - 96);
					}
				}
			}
		}

		return key;
	}

	_send_key(e)
	{
		let key = this._eval_key(e);
		if (key != "") {
			this._send(key);
		}
	}

	// DEBUG //
	_dump()
	{
		let l = "";
		for (let y = 0; y < this.nlines; ++y) {
			for (let x = 0; x < this.ncolumns; ++x) {
				l += this.screen[y][x].ch;
			}
			l = l + "\n";
		}
		console.log(l);
	}
	///////////

	_on_keydown(e)
	{
		e = e || window.event;

		e.preventDefault();
		e.stopPropagation();

		this._send_key(e);

	}

	_redraw_selection(i1, i2, active)
	{
		if (i1 > i2) {
			let t = i2;
			i2 = i1;
			i1 = t;
		}

		this.highlight = active;
		let ncell = i2 - i1 + 1;
		let x1 = i1 % this.ncolumns;
		let y1 = Math.floor(i1 / this.ncolumns);
		let w = this.ncolumns - x1;
		if (w > ncell) {
			w = ncell;
		}
		this._redraw_box(x1, y1, w, 1);
		ncell -= w;
		if (ncell > 0) {
			let nlines = Math.floor(ncell / this.ncolumns);
			this._redraw_box(0, y1 + 1, this.ncolumns, nlines);
			ncell -= nlines * this.ncolumns;
			if (ncell > 0) {
				this._redraw_box(0, y1 + nlines + 1, ncell, 1);
			}
		}
		this.highlight = false;
	}

	_update_selection(x, y)
	{
		let sel = x + y * this.ncolumns;

		//console.log(x,y,sel);

		if (sel == this.selection_last) {
			return sel;
		}

		if (this.selection_start == -1) {
			this._redraw_selection(sel, sel, true);
			this.selection_start = sel;
		}
		else {
			let i1 = this.selection_start;
			let i2 = this.selection_last;
			let i3 = sel;
			if (i3 != i2) {
				if (i1 < i2) {
					if (i3 > i2) {
						this._redraw_selection(i2 + 1, i3, true);
					}
					else if (i3 > i1) {
						this._redraw_selection(i3 + 1, i2, false);
					}
					else {
						this._redraw_selection(i1 + 1, i2, false);
						this._redraw_selection(i3, i1, true);
					}
				}
				else {
					if (i3 < i2) {
						this._redraw_selection(i3, i2 - 1, true);
					}
					else if (i3 <= i1) {
						this._redraw_selection(i2, i3 - 1, false);
					}
					else {
						this._redraw_selection(i2, i1 - 1, false);
						this._redraw_selection(i1, i3, true);
					}
				}
			}
		}
		this.selection_last = sel;
		return sel;
	}

	_clear_selection()
	{
		let rv = false;
		if (this.selection_start != -1) {
			if (this.selection_end == -1) {
				this.selection_end = this.selection_last;
			}
			this._redraw_selection(this.selection_start, this.selection_end, false);
			rv = true;
		}
		this.selection_start = -1;
		this.selection_end = -1;
		this.selection_last = -1;
		this.selection_on = false;
		this.selection_active = false;
		this._update_freeze_state();
		return rv;
	}

	_read_from_clipboard()
	{
		navigator.clipboard.readText().then((text) => {
			this._send(text);
		}).catch((error) => {
			console.error('Error reading from clipboard:', error);
		});
		
	}

	_clipboard_copy()
	{
		this._write_to_clipboard_as_text();
		this._clear_selection();
		this.canvas.focus();
	}

	
	_write_to_clipboard(character_handler, blob_handler, trim_lines)
	{
		let t = "";
		let lf;
		
		if (trim_lines) {
			lf = (l) => {
				return l.replace(/ +$/,"\n");
			}
		}
		else {
			lf = (l) => {
				return l + "\n";
			}
		}

		try {
			let xi = this.selection_start % this.ncolumns;
			let yi = Math.floor(this.selection_start / this.ncolumns);
			let l = "";
			for (let i = this.selection_start; i <= this.selection_end; ++i) {
				l += character_handler(this.screen[yi][xi]);
				++xi;
				if (xi >= this.ncolumns) {
					t += lf(l);
					l = "";
					xi = 0;
					++yi;
				}
			}
			t += lf(l);
		} catch {
			return;
		}
		try {
			blob_handler(t);
		} catch {
			/*		
			const textArea = document.createElement("textarea");
			textArea.value = t;
			textArea.style.position = "fixed";
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			try {
					document.execCommand('copy', false, t);
			} catch (err) {
					console.error('Error writing to clipboard:', err);
			} finally {
					document.body.removeChild(textArea);
			}
			*/
		}
	}
	
	_write_to_clipboard_as_text()
	{
		this._write_to_clipboard((ch) => {
				return ch.ch;
			}, 
			(t) => {
				navigator.clipboard.writeText(t);
			},
			true);
	}

	_write_to_clipboard_as_ansi()
	{
		let prev = {
		background: null,
		foreground: null,
		blink: false,
		underline: false,
		reverse: false,
		bold: false,
		italic: false,
		};

		this._write_to_clipboard((ch) => {
				let rv = "";
				if (ch.background != prev.background) {
					rv += '\x1B[48;2;1;' + ch.background.replace(/rgb\(/,"").replace(/\)/,"").replace(/,/g,";") + 'm';
				}
				if (ch.foreground != prev.foreground) {
					rv += '\x1B[38;2;1;' + ch.background.replace(/rgb\(/,"").replace(/\)/,"").replace(/,/g,";") + 'm';				
				}
				if (ch.blink != prev.blink) {
					rv += ch.blink ? '\x1B[5m' : '\x1B[25m';				
				}
				if (ch.underline != prev.underline) {
					rv += ch.underline ? '\x1B[4m' : '\x1B[24m';				
				}
				if (ch.bold != prev.bold) {
					rv += ch.bold ? '\x1B[1m' : '\x1B[22m';				
				}
				if (ch.italic != prev.italic) {
					rv += ch.italic ? '\x1B[3m' : '\x1B[23m';				
				}
				if (ch.reverse != prev.reverse) {
					rv += ch.reverse ? '\x1B[7m' : '\x1B[27m';				
				}
				rv += ch.ch;
				prev = ch;
				return rv;
			},
			(t) => {
				// Trying to pass escapes, but the API converts them to UTF8 anyway... :-(
				let encoder = new TextEncoder('latin1');
				let latin1Bytes = encoder.encode(t);
				let blob = new Blob([latin1Bytes], { type: 'text/plain; charset=latin1' });
				let cli = [ new ClipboardItem({ 'text/plain': blob }) ];
				navigator.clipboard.write(cli);
			},
			true);
	}

	_write_to_clipboard_as_html(plain_text)
	{
		let prev = {
		background: null,
		foreground: null,
		blink: false,
		underline: false,
		reverse: false,
		bold: false,
		italic: false,
		};

		let start = true;

		this._write_to_clipboard((ch) => {
				let rv = "";
				let ns = "";
				let fs = "";
				if (start) {
					start = false;
					rv = `<!DOCTYPE html>
<html>
 <head>
 </head>
 <body>
  <pre>
   <span>
`
				}
				if (ch.background != prev.background
				 || ch.foreground != prev.foreground
				 || ch.underline != prev.underline
				 // || ch.blink != prev.blink
				 || ch.bold != prev.bold
				 || ch.italic != prev.italic
				 || ch.reverse != prev.reverse) {
					let fg = ch.foreground;
					let bg = ch.background;
					if (ch.reverse) {
						bg = ch.foreground;
						fg = ch.background;
					}
					fs = (ch.bold ? "bold" : "") + (ch.italic ? "italic" : "");
					ns = "color: " + fg + "; background-color: " + bg + ";";
					   + "font-style: " + (fs == "" ? "normal" : fs) + ";"
					   + "text-decoration: " + (ch.underline ? "underline" : "none") + ";";
					rv += "</span><span style=\"" + ns + "\">";
				}
				rv += ch.ch;
				prev = ch;
				return rv;
			},
			(t) => {
				t += `</span>
  </pre>
 </body>
</html>
`
				t = encodeHtml(t);
				let mimetype = plain_text ? "text/plain" : "text/html";
				let blob = new Blob([t], { type: mimetype });
				let cli = [ new ClipboardItem({ [mimetype]: blob }) ];
				navigator.clipboard.write(cli);	
			},
			false);
	}

	_selection_menu(x, y)
	{
		if (this.selection_start != -1) {
			if (false) {
				this.menu.style.left = x + "px";
				this.menu.style.top = y + "px";
				this.menu.showModal();
			}
			else {
				this._write_to_clipboard_as_text();
			}
		}

		//console.log(e);
	}

	_on_mouse_move(e)
	{
		if (! this.selection_on) {
			return;
		}
		let x = Math.floor(e.offsetX / this.charwidth);
		let y = Math.floor(e.offsetY / this.charheight);
		this._update_selection(x, y);
	}

	_on_mouse_down(e)
	{
		if (e.button != 0) {
			e.preventDefault();
			e.stopPropagation();
			//this.selection_menu(e.screenX, e.screenY);
			//this.selection_menu(e.clientX, e.clientY);
			this._selection_menu(e.pageX, e.pageY);
			return;
		}
		let cleared = this._clear_selection();
		if (! cleared) {
			this.selection_timer = setTimeout( () => {
				this.selection_start = -1;
				this.selection_end = -1;
				this.selection_last = -1;
				this.selection_on = true;
				this.selection_active = true;
				let x = Math.floor(e.offsetX / this.charwidth);
				let y = Math.floor(e.offsetY / this.charheight);
				this._update_selection(x, y);
				this._update_freeze_state();
				this.selection_timer = null;
			}, 250);

		}
		//console.log(e);
	}

	_on_mouse_up(e)
	{
		if (this.selection_timer) {
			clearTimeout(this.selection_timer);
			this.selection_timer = null;
		} 
		if (e.button != 0) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		this.selection_on = false;
		if (false) {
			let x = Math.floor(e.offsetX / this.charwidth);
			let y = Math.floor(e.offsetY / this.charheight);
			this.selection_end = this._update_selection(x, y);
		}
		else {
			this.selection_end = this.selection_last;
		}
		//console.log(e);
	}

	_on_mouse_click(e)
	{
		e.preventDefault();
		e.stopPropagation();
		//console.log(e);
	}

}


