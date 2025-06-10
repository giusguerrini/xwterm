const ANSITERM_VERSION = "0.24.0";
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
 
 The communication layer is modeled by the "abstract" class
 AnsiTermDriver, whose derivations implement HTTP and WebSocket
 protocols. It is also possible to write custom drivers and
 pass an instance to AnsiTerm constructor.
 
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

 Blinking is controlled by a timer that toggles the state
 every "blink_period" milliseconds. The same timer is used
 for both the cursor and blinking characters. Blinking characters
 are stored in a list that updates whenever a character changes
 its blinking state.

-------------------------------------------

 For a full description of XTerm/ANSI sequences see:
	
	https://invisible-island.net/xterm/ctlseqs/ctlseqs.html
	https://www.commandlinux.com/man-page/man4/console_codes.4.html
*/			



/**
 * The AnsiTermGenericScrollBar class is used to create a generic scrollbar
 * for a terminal emulator. It is designed to work with a controlled element
 * and provides methods to set the minimum and maximum values, current value,
 * visible range size, and register a callback function for value changes.
 * This class is not intended to be used directly, but rather in conjunction with
 * AnsiTermGenericScrollBarAdder.
 * 
 * At the moment, it only vertical scrollbar is implemented.
 * @class
 */
class AnsiTermGenericScrollBar {
	 			
	static vertical_mutable_properties = {
		motion_coord: "clientY",
		min_coord_side: "top",
		motion_limit: "clientHeight",
		motion_size: "height",
		fixed_size: "width",
		fixed_limit: "clientWidth",
		min_fixed_limit: "minWidth",
		ms_grid_single: "-ms-grid-columns",
		ms_grid_multi: "-ms-grid-rows",
		ms_grid_single_pos: "-ms-grid-column",
		ms_grid_multi_pos: "-ms-grid-row",
		grid_single: "gridTemplateColumns",
		grid_multi: "gridTemplateRows",
		separator_width: "borderLeftWidth",
		separator_style: "borderLeftStyle",
		scroll_size: "scrollHeight",
		scroll_limit: "scrollTop",
		scroll_overflow: 'overflowY',
	};

	static horizontal_mutable_properties =  {
		motion_coord: "clientX",
		min_coord_side: "left",
		motion_limit: "clientWidth",
		motion_size: "width",
		fixed_size: "height",
		fixed_limit: "clientHeight",
		min_fixed_limit: "minHeight",
		ms_grid_single: "-ms-grid-rows",
		ms_grid_multi: "-ms-grid-columns",
		ms_grid_single_pos: "-ms-grid-row",
		ms_grid_multi_pos: "-ms-grid-column",
		grid_single: "gridTemplateRows",
		grid_multi: "gridTemplateColumns",
		separator_width: "borderTopWidth",
		separator_style: "borderTopStyle",
		scroll_size: "scrollWidth",
		scroll_limit: "scrollLeft",
		scroll_overflow: 'overflowX',
	};


	_layout()
	{
		const m = this.mutable_properties;

		this.div = null;
		this.div_spacer = null;
		this.div_scroll = null;
		
		this.div = document.createElement("div");
		this.div.classList.add("generic-scrollbar");

		this.div_scroll = document.createElement("div");
		this.div_scroll.style.display = 'inline-block';
		this.div_scroll.style.position = 'relative';
		this.div_scroll.style[m.scroll_overflow] = 'scroll';
		// Temporary, timeout callback will be used to set the actual size
		this.div_scroll.style[m.motion_size] = this.controlled_element[m.motion_limit] + 'px';
		this.div_scroll.style.boxSizing = 'border-box';

		this.div_spacer = document.createElement("div");
		this.div_spacer.style.border = 0;
		this.div_spacer.style.margin = 0;
		this.div_spacer.style.padding = 0;
		this.div_spacer.style.backgroundColor = 'transparent';
		this.div_spacer.style[m.fixed_size] = '1px';
		// Temporary, timeout callback will be used to set the actual size
		this.div_spacer.style[m.motion_size] = this.controlled_element[m.motion_limit] + 'px';
		//this.div_spacer.style.display = 'inline-block';
		this.div_spacer.style.position = 'absolute';
		this.div_spacer.style.top = 0;
		this.div_spacer.style.left = 0;
		this.div_scroll.appendChild(this.div_spacer);


		let style = window.getComputedStyle(this.controlled_element);
		this.div.style.border = style.border;
		this.div.style.margin = style.margin;
		this.div.style.padding = style.padding;
		//this.div.style.width = (this.controlled_element.width + 20) + "px";
		this.div.style[m.motion_size] = this.controlled_element[m.motion_size] + "px";
/*		
		if (this.controlled_element.parentNode) {
			this.controlled_element.parentNode.replaceChild(this.div, this.controlled_element);
		}
			*/
		this.controlled_element.style.border = "none";
		this.controlled_element.style.borderRadius = "0";
		this.controlled_element.style.margin = "0";
		this.controlled_element.style.padding = "0";
		this.controlled_element.style.display = 'inline-block';
		//this.controlled_element.style.position = 'absolute';
		//this.controlled_element.style.top = 0;
		//this.controlled_element.style.left = 0;
		//this.div.appendChild(this.controlled_element);
		this.div.appendChild(this.div_scroll);

		
		// Hack to force scrollbar to be visible on Firefox
		if (this.div_scroll[m.fixed_limit] == 0) {
			this.div_scroll.style[m.min_fixed_limit] = '10px';
		}
		

		this.scroll_area = this.div_scroll[m.fixed_limit];
		this.div_spacer.style[m.motion_size] = this.scroll_area + 'px';

	
		// This would adjust the height in case the container's geometry hasn't been calculated yet,
		// but I'll postopone this in _update(), so the bar is left "grayed" until it is actually needed. 
		//this.timer0 = setTimeout(() => {
		//	this.div_scroll.style.height = this.controlled_element.clientHeight + 'px';
		//	this.div_spacer.style.height = this.controlled_element.clientHeight + 'px';
		//	this.timer0 = null;
		//}, 0);

		this.div_scroll.addEventListener('scroll', (ev) => {
			let el = ev.target;
			
			let motion_limit = (this.div_scroll[m.scroll_size] - this.div_scroll[m.motion_limit]);
			if (motion_limit <= 0) {
				return;
			}
			let r = (el.scrollTop / motion_limit);

			//console.log("scrollTop=" + el.scrollTop + " scrollHeight=" + el.scrollHeight + " clientHeight=" + el.clientHeight + " m=" + motion_limit + " r=" + r);

			let v = r * (this.max_value - this.min_value) + this.min_value;
		
			this.curr_value = v;

			let rv = {
				value: this.curr_value,
				minValue: this.min_value,
				maxValue: this.max_value,
				visibleRangeSize: this.visible_range_size,
			};

			if (this.on_change) {
				this.on_change(rv);
			}
		});
	}

	constructor(element, vertical)
	{
		this.vertical = vertical;
		this.mutable_properties = this.vertical
	                            ? AnsiTermGenericScrollBar.vertical_mutable_properties
		                        : AnsiTermGenericScrollBar.horizontal_mutable_properties;
		this.controlled_element = element;		
		this.min_value = 0;
		this.curr_value = 0;
		this.max_value = 0;
		this.visible_range_size = 0;
		this.on_change = [];
		this.on_new_position = [];

		this._layout();
	}

	_update()
	{
		if (this.max_value > this.min_value) {
			if (this.visible_range_size > 0) {
				const m = this.mutable_properties;
				
				// Last-minute adjustment, see comment in _layout().
				if (parseInt(this.div_spacer.style[m.motion_size]) == 0) {
					this.div_scroll.style[m.motion_size] = this.controlled_element[m.motion_limit] + 'px';
					this.div_spacer.style[m.motion_size] = this.controlled_element[m.motion_limit] + 'px';
				}

				let l = (this.max_value - this.min_value + this.visible_range_size) / this.visible_range_size;
				let s = this.controlled_element[m.motion_size] * l;
				this.div_spacer.style[m.motion_size] = Math.floor(s - 0.5) + 'px';
				//let v = Math.floor(((this.curr_value - this.min_value) / (this.max_value - this.min_value)) * this._motion_limit() + 0.5);
				let v = Math.floor(((this.curr_value - this.min_value) / (this.max_value - this.min_value)) * this.div_scroll[m.scroll_size] + 0.5);
				this.div_scroll[m.scroll_limit] = v;
			}
		}
	}

	setMinValue(v)
	{
		if (v != this.min_value) {
			this.min_value = v;
			this._update();
		}
	}

	setMaxValue(v)
	{
		if (v != this.max_value) {
			this.max_value = v;
			this._update();
		}
	}

	setValue(v)
	{
		if (v != this.curr_value) {
			this.curr_value = v;
			this._update();
		}
	}

	setVisibleRangeSize(v)
	{
		if (this.visible_range_size != v) {
			this.visible_range_size = v;
			this._update();
		}
	}

	registerOnChange(cb)
	{
		this.on_change = cb;
	}

	resize()
	{
		// This method is called when the controlled element is resized.
		// It updates the size of the scrollbar and the spacer.
		if (this.div_scroll) {
			const m = this.mutable_properties;
			let l = this.controlled_element[m.motion_limit]
			this.div_spacer.style[m.motion_size] = l + 'px';
			this.div_scroll.style[m.motion_size] = l + 'px';
			this._update();
		}
	}
}

/**
 * The AnsiTermGenericScrollBarAdder class is used to decorate a terminal
 * with a scrollbar. It creates a new scrollbar element and attaches it to the
 * terminal's controlled element. Platform-provided scrollbar elements are
 * used here, which may vary in appearence depending on the browser and the OS.
 * If you need a repeteable layout, you should use "scrollbar.js" and
 * set the "internalScrollbar" parameter of AnsiTerm to false. 
 * 
 * At the moment, it only vertical scrollbar is implemented.
 * @class
 */
class AnsiTermGenericScrollBarAdder
{
	static isIE11()
	{
		return !!window.MSInputMethodContext && !!document.documentMode;
	}

	resize()
	{
		// This method is called when the controlled element is resized.
		// It updates the size of the scrollbar and the spacer.
		this.width = this.controlled_element.clientWidth;
		this.height = this.controlled_element.clientHeight;
		if (this.verticalScrollbar) {
			this.verticalScrollbar.resize();
		}
		if (this.horizontalScrollbar) {
			this.horizontalScrollbar.resize();
		}
	}

	_layout()
	{
		this.div = null;
		if (typeof this.controlled_element_or_id == 'string') {
			this.controlled_element = document.getElementById(this.controlled_element_or_id);
		}
		else {
			this.controlled_element = this.controlled_element_or_id;
		}

		this.div = document.createElement("div");
		this.div.classList.add("generic-scrollbar");
		if (AnsiTermGenericScrollBarAdder.isIE11()) {
			/*
			let bsz = 0; 
			this.div.style.width = this.controlled_element.clientWidth
				+ (this.vertical ? bsz : 0)
			    + "px";
			this.div.style.height = this.controlled_element.clientHeight
				+ (this.horizontal ? bsz : 0)
			    + "px";
				*/
			this.div.style.display = "-ms-grid";
		}
		else {
			this.div.style.width = "max-content";
			this.div.style.display = "grid";
		}
		let style = window.getComputedStyle(this.controlled_element);
		this.div.style.border = style.border;
		this.div.style.margin = style.margin;
		this.div.style.padding = style.padding;	
		let key1 = [ "", "Top", "Bottom", "Left", "Right" ];
		let key2 = [ "Color", "LeftRadius", "RightRadius", "Style", "Width",
			     "Collapse", "Image", "ImageOutset", "ImageRepeat", "ImageSlice",
			     "ImageSource", "ImageWidth" ];
		for (let i = 0; i < key1.length; ++i) {
			for (let j = 0; j < key2.length; ++j) {
				let prop = "border" + key1[i] + key2[j];
				try {
					this.div.style[prop] = style[prop];
				} catch {
				}
			}
		}
		let key3 = [ "Top", "Bottom", "Left", "Right",
			         "Block", "BlockStart", "BlockEnd",
					 "Inline", "InlineStart", "InlineEnd" ];
		for (let i = 0; i < key1.length; ++i) {
			let prop = "padding" + key3[i];
			try {
				this.div.style[prop] = style[prop];
			} catch {
			}
		}
		if (this.vertical) {
			this.div.style.gridTemplateColumns = "auto auto";
		}
		else {
			this.div.style.gridTemplateColumns = "auto";
		}
		this.width = this.controlled_element.clientWidth;
		this.height = this.controlled_element.clientHeight;

		if (this.controlled_element) {
			this.controlled_element.parentNode.replaceChild(this.div, this.controlled_element);
			this.div.appendChild(this.controlled_element);
			this.controlled_element.style.border = "none";
			this.controlled_element.style.borderRadius = "0";
			this.controlled_element.style.margin = "0";
		}
		if (AnsiTermGenericScrollBarAdder.isIE11()) {
			this.controlled_element.style.setProperty("-ms-grid-column", "1");
			this.controlled_element.style.setProperty("-ms-grid-row", "1");
		}
		if (this.vertical) {
			this.verticalScrollbar = new AnsiTermGenericScrollBar(this.controlled_element, true);
			this.div.appendChild(this.verticalScrollbar.div);
			if (AnsiTermGenericScrollBarAdder.isIE11()) {
				this.verticalScrollbar.div.style.setProperty("-ms-grid-row", "1");
				this.verticalScrollbar.div.style.setProperty("-ms-grid-column", "2");
			}
		}
		if (this.horizontal) {
			this.horizontalScrollbar = new AnsiTermGenericScrollBar(this.controlled_element, false);
			this.div.appendChild(this.horizontalScrollbar.div);
			if (AnsiTermGenericScrollBarAdder.isIE11()) {
				this.horizontalScrollbar.div.style.setProperty("-ms-grid-row", "2");
				this.horizontalScrollbar.div.style.setProperty("-ms-grid-column", "1");
			}
		}
	}

	constructor(controlledElementOrId, params)
	{
		// Contructor's parameters and their defaut values:

		// Some handy conventions:
		// no parameters: apply defaults, create a new terminal in a new div.
		// string parameter: apply defaults, create a new terminal in the div with the given id.
		if (! params) {
			params = "";
		}
		if (typeof params == 'string') {
			params = {  };
		}

		// Apply defaults, overwrite with actual parameters
		//this.params = { ...GENERICSCROLLBARADDER_DEFAULTS, ...params };
		this.params = params;

		this.controlled_element_or_id = controlledElementOrId;
		/*
		this.params.barConfiguration.size = Number(this.params.barConfiguration.size);
		this.params.barConfiguration.buttonSize = Number(this.params.barConfiguration.buttonSize);
		this.params.barConfiguration.separatorSize = Number(this.params.barConfiguration.separatorSize);
		*/
		this.vertical = this.params.vertical;
		this.horizontal = this.params.horizontal;
		if (this.vertical == "on") {
			this.vertical = true;
		}
		if (this.horizontal == "on") {
			this.horizontal = true;
		}
		if (this.vertical == "off") {
			this.vertical = false;
		}
		if (this.horizontal == "off") {
			this.horizontal = false;
		}

		this._layout();
	}
}

// DEFAULTS

const ANSITERM_DEFAULTS = {
	// Basic characteristics:

	nLines:  25, // Number of lines
	nColumns:  80, // Number of columns

	historySize: 1000, // Number of lines in the history buffer.
	internalScrollbar: true, // If true, the terminal uses its own scrollbar.
	
	fontSize:  15, // Font size in pixels. It determines the size of the canvas.

	font:  "Courier New", // Font name. A monospaced font is required (or at least suggested).

	statusFont:  "Helvetica bold", //"Arial bold", // Font for the status line and the title.
	
	// Custom layout control:
	containerId: "", // Id of the container in which the terminal, incuding its main div,
	                 //  will take place. If empty, document.body is assumed as container.
	canvasId:  "", // Id of the canvas element. If empty, a new canvas is created.
	autocenter: true, // If true, the terminal takes place at center of its container.

	// Protocol parameters:

	channelType: "rest", // Type of transport. Possible values are:
	// "rest" or "http": use HTTP/HTTPS GET to get characters and POST to send key and resize events.
	//         "httpSource", "httpSize" and "httpDest" parameters configure the requests (see below).
	// "websocket": use websocket. Data are sent and received as JSON structures.
	//         "wsEndpoint" il the server address:port, "wsDataTag" is the name of the JSON
	//         field containing characters (both send and received), "wsSizeTag" is the
	//         name of the JSON tag containing the size (see below).
	// "dummy": a channel that does nothing.

	// Parameters for "rest" channel type:
	httpSessionHintParam:  "session", // Name of an additional parameter to (try to) connect to a particular session.
	httpSessionHint:  "", // Value od the additional parameter to (try to) connect to a particular session. If empty, generates a new one internally.
	httpSource:  "/?console", // GET request to receive characters from the server.
	httpSize:  "/?size=?lines?x?columns?", // GET request to set the size of the terminal.
	httpDest:  "/", // POST request to send characters to the server.
	timeout:  0, //10000; // Timeout for all request. 0 means no timeout. If timeout is reached, the ESC sequence is aborted.
	immediateRefresh:  70, // Time in milliseconds to send an update request aftertheen nextding an event.
	fastRefresh:  500, // Time in milliseconds to send the next update request after receiving a response.
	slowRefresh:  2000, // Time in milliseconds to send the next update request after a protocol failure.

	// Parameters for "websocket" channel type
	wsEndpoint: "127.0.0.1:8001", // Websocket endpoint
	wsDataTag: "text", // name of the JSON field containing characters (both send and received),
	wsSizeTag: "size", // name of the JSON tag containing the sreen size.
	wsSizeData: "?lines?x?columns?", // format of the JSON tag containing the screen size.

	// Colors and appearance:

	palette: null, //"default", // Base palette (colors 0..15).
	foreground:  "rgb(229,229,229)", // Default foreground color.
	background:  "rgb(0,0,0)", // Default background color.
	statusForegroundOk:  "rgb(0,32,0)", // Status line foreground color when status is OK.
	statusBackgroundOk:  "rgb(160,192,160)", // Status line background color when status is OK.
	statusForegroundKo:  "rgb(255,255,0)", // Status line foreground color when status is not OK.
	statusBackgroundKo:  "rgb(192,64,64)", // Status line background color when status is not OK.
	titleBackground:  "rgb(224,224,224)", // Title background color.
	titleForeground:  "rgb(0,0,128)", // Title foreground color.
	//keyboardBackground:  this.title_background, // Keyboard background color. Usually the same as the title.
	//keyboardForeground:  this.title_foreground, // Keyboard foreground color. Usually the same as the title.
	selectionBackground:  "rgb(255,192,192)", // Selection background color.
	selectionForeground:  "rgb(0,0,0)", // Selection foreground color.

	blinkIsBold:  true, // If true, blinking characters are drawn bold.
	blinkPeriod:  500, // Blink period in milliseconds for both cursor an blinking characters.

	titleText:  "ANSI Terminal", // Initial title text.
	
	cursorUpdateStyle: "precise", // Default value for cursor update style.
	// Possible values:
	// "precise": the cursor is updated on position change,
	// "smart": the cursor is updated only at blink time and on key events,
	// "lazy": the cursor is updated only at blink time.

	hasTitleBar: true, // If true, the standard title bar is added
	hasStatusBar: true, // If true, the standard status bar is added
	hasSoftKeyboard: true, // If true, the soft keyboard is added
	hasSoftFKeys: true, // If true, the soft keyboard contains function keys F1...F12

	driver: null, // An user-provided object to use as communication driver
	              // instead of HTTP channel.
	              // The object must be an instance of a class that 
	              // implements (extends) AnsiTermDriver
	              // interface (see below).

	bell_enabled: true, // Whether the bell sound is enabled.
	bell_duration: 0.5, // The duration of the bell sound in seconds.
	bell_frequency: 1760, // The frequency of the bell sound in Hz.
	bell_decay: 0.9998, // The decay ratio of the bell sound.
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


/**
 * The AnsiTermDecoration class is an auxiliary class used by AnsiTerm
 * to implement its default decoration.
 * It is responsible for creating the title bar, the status bar, and
 * the soft keyboard.
 * 
 * @class
 * @param {AnsiTerm} term - The AnsiTerm instance to decorate.
 * @param {HTMLCanvasElement} canvas - The canvas element to use for the terminal.
 * @param {Object} params - Configuration parameters for the decoration. For a full list of parameters,
 * see {@link ANSITERM_DEFAULTS} and {@link AnsiTerm}.
 */

export class AnsiTermDecoration
{

	_update_status_element(el, ok, text_ok, text_ko)
	{
		if (ok) {
			el.style.color = this.params.statusForegroundOk;
			el.style.backgroundColor = this.params.statusBackgroundOk;
			el.innerText = text_ok;
		}
		else {
			el.style.color = this.params.statusForegroundKo;
			el.style.backgroundColor = this.params.statusBackgroundKo;
			el.innerText = text_ko;
		}
	}

	//
	// Layout generator.
	//
	_layout()
	{
		this.div = null;
		this.title = null;
		this.status_div_container = null;
		this.freeze_div = null;
		this.freeze_button = null;
		this.status_div = null;
		this.version_div = null;
		this.copy_button = null;
		this.copy_as_button = null;
		this.paste_button = null;
		this.select_all_button = null;
		this.clipboard_text_helper = null;

		this.container = null;
		this.no_container = false;

		if (this.params.containerId != "") {
			this.container = document.getElementById(this.params.containerId);
		}
		if (! this.container) {
			this.no_container = true;
			this.params.autocenter = true;
			this.container = document.body;
		}

		this.div = document.createElement("div");
		this.div.style.width = "max-content";
		if (this.params.autocenter) {
			if (this.no_container) {
				this.div.style.position = "absolute";
			}
			this.div.style.top = "50%";
			this.div.style.left = "50%";
			this.div.style.transform = "translate(-50%,-50%)";
		}
		this.container.appendChild(this.div);
		this.div.classList.add("ansi-terminal");
		this.div.style.display = "grid";
		this.div.style.gridTemplateColumns = "auto";
		this.title = document.createElement("div");
		if (this.params.hasTitleBar) {
			this.title.style.border = "2px solid black";
			this.title.style.backgroundColor = this.params.titleBackground;
			this.title.style.color = this.params.titleForeground;
			this.title.style.font = this.status_fullfont;
			this.div.appendChild(this.title);

			this.term.registerOnTitleChange( (text) => {
					this.title.innerText = text;
				});

		}
		else {
			this.title = null;
		}
		this.canvas.tabIndex = 0;
		this.div.appendChild(this.canvas);
		if (this.params.hasStatusBar) {
			this.status_div_container = document.createElement("div");
			this.status_div_container.style.font = this.status_fullfont;
			this.status_div_container.style.border = "1px solid black";
			this.status_div_container.style.display = "grid";
			this.status_div_container.style.gridTemplateColumns
			 = "fit-content(10%) fit-content(30%) auto fit-content(15%) fit-content(10%) fit-content(10%) fit-content(10%) fit-content(10%)";
			this.div.appendChild(this.status_div_container);
			this.freeze_button = document.createElement("button");
			this.freeze_button.style.backgroundColor = this.params.keyboardBackground;
			this.freeze_button.style.color = this.params.keyboardForeground;
			this.freeze_button.innerText = "Freeze";
			this.status_div_container.appendChild(this.freeze_button);
			this.freeze_div = document.createElement("div");
			this.freeze_div.style.font = this.status_fullfont;
			this.freeze_div.style.backgroundColor = this.params.statusBackgroundOk;
			this.freeze_div.style.color = this.params.statusForegroundOk;
			this.freeze_div.style.border = "1px solid black";
			this.freeze_div.style.paddingLeft = "6px";
			this.freeze_div.style.paddingRight = "6px";
			this.freeze_div.innerText = "Unfrozen";
			this.status_div_container.appendChild(this.freeze_div);

			this.term.registerOnFreezeChange( (frozen, length_pending, freeze_count) => {
				this._update_status_element(this.freeze_div, !frozen, "Unfrozen", "Frozen [+" + freeze_count + "]- " + length_pending+ " bytes pending");
			});
			
			this.status_div = document.createElement("div");
			this.status_div.style.font = this.status_fullfont;
			this.status_div.style.border = "1px solid black";
			this.status_div.style.paddingLeft = "6px";
			this.status_div.style.paddingRight = "6px";
			this.status_div_container.appendChild(this.status_div);

			this.term.registerOnStatusChange( (ok) => {
				this._update_status_element(this.status_div, ok, "Connected", "Disconnected");
			});

			this.version_div = document.createElement("div");
			this.version_div.style.font = this.status_fullfont;
			this.version_div.style.backgroundColor = this.params.statusBackgroundOk;
			this.version_div.style.color = this.params.statusForegroundOk;
			this.version_div.style.border = "1px solid black";
			this.version_div.style.paddingLeft = "6px";
			this.version_div.style.paddingRight = "6px";
			this.version_div.innerText = "xwterm " + AnsiTerm.getVersion();
			this.status_div_container.appendChild(this.version_div);
			this.select_all_button = document.createElement("button");
			this.select_all_button.style.backgroundColor = this.params.keyboardBackground;
			this.select_all_button.style.color = this.params.keyboardForeground;
			this.select_all_button.innerText = "Select all";
			this.status_div_container.appendChild(this.select_all_button);
			this.copy_button = document.createElement("button");
			this.copy_button.style.backgroundColor = this.params.keyboardBackground;
			this.copy_button.style.color = this.params.keyboardForeground;
			this.copy_button.innerText = "Copy";
			this.status_div_container.appendChild(this.copy_button);
			this.copy_as_button = document.createElement("button");
			this.copy_as_button.style.backgroundColor = this.params.keyboardBackground;
			this.copy_as_button.style.color = this.params.keyboardForeground;
			this.copy_as_button.innerText = "Copy as...";
			this.status_div_container.appendChild(this.copy_as_button);
			this.paste_button = document.createElement("button");
			this.paste_button.style.backgroundColor = this.params.keyboardBackground;
			this.paste_button.style.color = this.params.keyboardForeground;
			this.paste_button.innerText = "Paste";
			this.status_div_container.appendChild(this.paste_button);
		}
		else {
			this.status_div_container = null;
			this.freeze_div = null;
			this.freeze_button = null;
			this.status_div = null;
			this.version_div = null;
			this.copy_button = null;
			this.copy_as_button = null;
			this.paste_button = null;
			this.select_all_button = null;
		}

		if (this.params.hasSoftKeyboard) {
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
				let e = null;
				if (i >= 12 || this.params.hasSoftFKeys) {
					e = document.createElement("button");
					e.style.backgroundColor = this.params.keyboardBackground;
					e.style.color = this.params.keyboardForeground;
					e.innerText = button_properties[i].text;
					e.addEventListener("click", (event) => {
							this.term.sendKeyByKeyEvent(button_properties[i].key);
						});
					this.keyboard_div.appendChild(e);
				}
				if (i >= 12) {
					e.style.gridColumnStart = (i - 12) * 3 + 1;
					e.style.gridColumnEnd = (i - 12) * 3 + 4;
				}
			}
		}
		else {
			this.keyboard_div = null;
		}

		if (this.params.hasStatusBar) {
			this.select_all_button.addEventListener("click",
				(event) => {
					this.term.selectAll();
				});

			this.copy_button.addEventListener("click",
				(event) => {
					this.term.clipboardCopyAsText();
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
					this.term.clipboardPaste();
				});

			this.freeze_button.addEventListener("click",
				(event) => {
					this.term.toggleFreezeState();
				});
		}

		this.menu = document.createElement("dialog");
		//this.menu.open = false;
		//this.menu.style.position = "absolute";
		//this.menu.style.display = "inline-block";
		//this.menu.style.visibility = "hidden";
		this.menu.style.height = "max-content"; //"auto";
		this.menu.style.width = "max-content"; //"auto";
		this.menu.style.border = "3px solid " + this.params.titleForeground;
		this.menu.style.margin = "0px";
		this.menu.style.padding = "0px";
		this.menu.style.backgroundColor = this.params.titleBackground;
		this.menu.style.color = this.params.titleForeground;
		//this.menu.style.font = this.status_fullfont;
			
		this.menu.innerText = "Copy as...";

		this.menu_items = {
			copy_as_is: {
					text: "Text",
					fn: () => {
						this.term.clipboardCopyAsText();
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
						this.term.clipboardCopyAsAnsiSequence();
					}
				},
			copy_as_html: {
					text: "HTML",
					fn: () => {
						this.term.clipboardCopyAsHtml();
					}
				},
			copy_as_rich_text: {
					text: "Rich Text",
					fn: () => {
						this.term.clipboardCopyAsRichText();
					}
				},
			quit: {
					text: "Quit",
					fn: () => {
						this.term.clearSelection();
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
			e.style.border = "1px solid " + this.params.titleForeground;;
			e.style.margin = "0px";
			e.style.padding = "0px";
			e.style.backgroundColor = this.params.titleBackground;
			e.style.color = this.params.titleForeground;
			e.innerText = this.menu_items[key].text; 
			e.addEventListener("click", (event) => {
				this.menu_items[key].fn();
				e.style.color = this.params.titleForeground;
				e.style.backgroundColor = this.params.titleBackground;
				this.menu.close();
			});
			e.addEventListener("mouseenter",
				(event) => {
					e.style.color = this.params.titleBackground;
					e.style.backgroundColor = this.params.titleForeground;
				}
			);
			e.addEventListener("mouseleave",
				(event) => {
					e.style.color = this.params.titleForeground;
					e.style.backgroundColor = this.params.titleBackground;
				}
			);
			this.menu_items[key].element = e;
			this.menu_div.appendChild(e);
		}

		document.body.appendChild(this.menu);

	}

	constructor(term, canvas, params)
	{
		// Contructor's parameters and their defaut values:

		// Some handy conventions:
		// no parameters: apply defaults, create a new terminal in a new div.
		// string parameter: apply defaults, create a new terminal in the div with the given id.
		if (! params) {
			params = "";
		}
		if (typeof params == 'string') {
			params = { containerId: params };
		}

		// Apply defaults, overwrite with actual parameters
		this.params = { ...ANSITERM_DEFAULTS, ...params };
		this.term = term;
		this.canvas = canvas;

		this._layout();
	}

	/**
	 * This method closes (deletes) the terminal's decorations.
	 */
	close()
	{
		if (this.div) {
			if (this.div.remove) {
				this.div.remove();
			}
			else {
			// Workaround for IE11
				if (this.div.parentNode) {
					this.div.parentNode.removeChild(this.div);
				}
			}
			this.div = null;
		}
		// TODO: unregister AnsiTerm's callbacks. Quite useless...
	}
}

/**
 * The AnsiTermHistory class is used to manage both the screen and the history
 * of the terminal as a single array of lines.
 * It keeps track of the visual lines and their attributes, and
 * their relation to the logical lines.
 * Visual lines are collected in reverse order, so that the last line
 * in the screen (i.e., the bottom line) takes the index 0 in the array.
 * Lines beyond the top of the screen contain the history of the terminal.
 * To ease the access to the screen cells in the natural order (top to bottom),
 * a pair of screen matrices is used, one for the primary screen and one for the alternate screen.
 * The rows of the first matrix map the first "nLines" lines in the array
 * from top (y=0) to bottom (y=nLines-1).
 * 
 * @class
 * @param {number} nLines - The number of lines in the terminal.
 * @param {number} nColumns - The number of columns in the terminal.
 * @param {number} historySize - The size of the history buffer.
 * @patam {object} empty_cell - The empty cell object, whose content is used to initialize the cells.
 */

export class AnsiTermHistory
{
	constructor(nLines, nColumns, historySize, empty_cell)
	{
		this.nColumns = nColumns;
		this.nLines = nLines;
		this.historySize = historySize;
		this.history = [];
		this.length = nLines;
		this.size = historySize + nLines;
		this.logline_start = 0;
		this.screens = [ [], [] ];
		this.history = [];
		this.max_ncolumns = nColumns;
		this.max_nlines = nLines;
		this.loglines = [];
		this.base_index = 0;
		this.alternate_screen = false;
		this.empty_cell = empty_cell;
		this.reset();
	}
	
/**
 * Resets screen buffers to their initial state.
 * 
 * This method clears and reinitializes the primary and alternate screen buffers.
 * It also resets the logical line tracking information and the logline_start pointer.
 * History (i.e. the non-screen) part of the line collection is left unchanged.
 * 
 * @returns {void}
 */

	_empty_lines(nLines, nColumns)
	{
		let lines = [];
		for (let i = 0; i < nLines; ++i) {
			let t = [];
			for (let j = 0; j < nColumns; ++j) {
				t[j] = { ...this.empty_cell };
			}
			lines[i] = { t: t, l: { span: 0, len: 0, cont: false } };
		}
		return lines;
	}

	reset()
	{
		this.base_index = this.historySize;

		this.history = this._empty_lines(this.size, this.nColumns);

		this.screens = [ [], [] ];
		for (let i = 0; i < this.nLines; ++i) {
			this.screens[0][i] = this.history[this.base_index + this.nLines - i - 1].t;
		}
		this.screens[1] = this._empty_lines(this.nLines, this.nColumns);
		this.logline_start = 0;
	}

	getLine(y)
	{
		y = this.nLines - y - 1;
		//if (y >= this.length || y < 0) {	
		//	console.log(y);
		//}
		let i = (((y >= this.length) ? this.length - 1 : y) + this.base_index + this.size) % this.size;
		return this.history[i].t;
	}

	//
	// Logical line manager.
	//
	// The following code keeps track of logical lines and their
	// relation to the screen lines.
	// Screen lines are the lines of text as they are actually displayed
	// according to the current screen column number. Logical lines are sequences
	// of characters delimited by CR/LF, as received by the backend logic (e.g., a command shell).
	// Logical lines are described in terms of their first character’s position
	// in the screen/history buffers and their number of characters.
	// A logical line may generally span multiple contiguous screen lines.
	// Tracking logical lines is important for the implementation of the "resize" function,
	// because when the screen is tightened or expanded, screen lines must preserve
	// the identity of the underlying logical lines. The same principle applies
	// to the scroll region (TODO).
	// If a logical line's length is less than or equal to the screen width, it is
	// displayed on a single screen line. If the logical line's length is greater than
	// the screen width, it is displayed on multiple screen lines. In this case,
	// the first screen line of the logical line is the one that contains the first character.
	// Logical lines always start at the beginning of a screen line.
	// Note that screen lines are not necessarily the same as the lines
	// in the screen buffer. In particular, the tracking mechanism
	// applies only to the primary screen, but not to the alternate one.
	// Although this is not perfect, it is good enough in practice because
	// the typical usage of the alternate screen is to display dynamic content
	// or graphics. Applications that use the alternate screen (e.g., vim, mc, htop...)
	// implement their own complete screen resize logic. Moreover, retrieving
	// the history of the alternate screen is not expected, so the tracking
	// mechanism is not needed.
	//

	startLogicalLine(y)
	{
		this.logline_start = y;
		y = this.nLines - y - 1;
		this.history[y].l = { span: 0, len: 0, cont: false, };
	}

	completeLogicalLine(x, y)
	{
		let span = y - this.logline_start;
		if (span < 0) {
			span = -span;
			this.logline_start = y;
		}
		let l = { span: span, len: x + span * this.nColumns, cont: false, };
		for (let i = 0; i <= span; ++i) {
			this.history[this.nLines - (this.logline_start + i) - 1].l = l;
			if (l.span == 0) {
				// Optimization
				break;
			}
			l = { span: l.span - 1, len: l.len - this.nColumns, cont: true, };
		}
		this.startLogicalLine(y);
	}

	update()
	{
		let rotate = true; // (this.history.length >= this.size);

		if (rotate) {
			this.base_index = (this.base_index + this.size - 1) % this.size;
			for (let i = 0; i < this.nLines; ++i) {
				this.screens[0][this.nLines - i - 1] = this.history[(this.base_index + i) % this.size].t;
			}
			if (this.length < this.size) {
				++this.length;
			}
		}
		else {
// Dead code...
			let e = { t: {...this.history[this.nLines - 1].t }, l: {...this.history[this.nLines - 1].l }};
			this.history.splice(this.nLines, 0,  e);
			for (let i = this.nLines - 1; i > 0; --i) {
				this.history[i].l = this.history[i - 1].l;
			}
			this.history[0].l = { span: 0, len: 0, cont: false };

			this.length = this.history.length;
		}

		return rotate;
	}

	_slices(line, nColumns)
	{
		// Splits a line into slices of the given number of columns.
		// Each slice is an array of cells, and the last slice may contain
		// fewer cells than the others, so we need to pad it with empty cells.
		// The slices are returned as an array of objects, each containing
		// the slice itself and the logical line information (span, length, continuation).
		// The slices are put into the array in direct order, so that the first slice
		// takes the index 0 in the array.
		let t = [];
		let slices = [];
		let rem = nColumns;
		let t_len = 0;

		if (line.length > 0) {
			let nspan = Math.floor((line.length - 1) / nColumns);
			let l = { span: nspan, len: line.length, cont: false };
			for (let i = 0; i < nspan; ++i) {
				t.push(...line.slice(t_len, t_len + nColumns));
				slices.push({ t: t, l: l });
				t_len += nColumns;
				l.span -= 1;
				l.len -= nColumns;
				l.cont = true;
			}
			if (t_len > 0 && t_len < line.length) {
				t.push(line.slice(t_len, line.length));
			}
			rem = nColumns - (line.length - t_len);
		}
		for (let i = 0; i < rem; ++i) {
			t.push({ ...this.empty_cell });
		}
		slices.push({ t: t, l: { span: 0, len: line.length - t_len, cont: false } });
		return slices;
	}

	resize(nLines, nColumns)
	{
		if (nColumns < 1 || nLines < 1) {
			return; //throw new Error("Invalid terminal size: " + nLines + "x" + nColumns);
		}
		if (nLines == this.nLines && nColumns == this.nColumns) {
			// No change
			return;
		}
		
		let old_length = this.history.length;
		let old_hsize = this.historySize;

		if (nColumns != this.nColumns) {

			// Collect all lines in the history, and split them into slices
			// of the new size.
			// This is needed to preserve the logical line structure.
			// The history is collected in reverse order with respect to the
			// ordinary coordinate system, so that the last line
			// in the screen (i.e., the bottom line) takes the index 0 in the array.
			let new_hist = [];
			let line = [];
			for (let i = this.size - 1; i >= 0; --i) {

				let li = (this.base_index + i) % this.size;
				
				let hl = this.history[li];
				let nt = hl.l.len;
				if (nt > this.nColumns) {
					nt = this.nColumns;
				}
				for (let j = 0; j < nt; ++j) {
					line.push(hl.t[j]);
				}
				if (hl.l.span == 0) {
					let sl = this._slices(line, nColumns);
					for (let j = 0; j < sl.length; ++j) {
						new_hist.push(sl[j]);
					}
					line = [];
				}
			}
			// Since slices are collected in direct order,
			// we need to reverse the array to get the history in the correct order.
			new_hist.reverse();
			this.history = new_hist;
			this.base_index = 0;
		}

		this.size = this.history.length;
		this.length += this.history.length - old_length;
		let empty_to_add = 0;		
		if (this.length < nLines) {
			if (nLines <= this.size) {
				// Nothing to do: lines are allocated, we just need to use them.
			}
			else {
				empty_to_add = this.size - nLines;
			}
			this.length = nLines;
		}

		this.historySize = this.size - nLines;
		if (false) {
			if (old_hsize > this.historySize) {
				// If the actual history size is reduced, we need to "maintain the promise"
				// that the history size is at least the requested size.
				// This means that we need to add more empty lines to the history.
				empty_to_add += old_hsize - this.historySize;
			}
		}

		if (empty_to_add > 0) {
			let e = this._empty_lines(empty_to_add, nColumns);
			let pos = (this.base_index + this.size - 1) % this.size;
			this.history.splice(pos, 0, ...e);
			this.base_index = (this.base_index + empty_to_add) % this.size;
			this.size += empty_to_add;
		}

		this.size = this.history.length;

		this.nColumns = nColumns;
		this.nLines = nLines;
		this.logline_start = 0;
		if (this.nLines > this.max_nlines) {
			this.max_nlines = nLines;
		}
		if (this.nColumns > this.max_ncolumns) {
			this.max_ncolumns = nColumns;
		}

		for (let i = 0; i < nLines; ++i) {
			this.screens[0][i] = this.getLine(i);
			this.screens[1][i] = [];
			for (let j = 0; j < this.nColumns; ++j) {
				this.screens[1][i][j] = { ...this.empty_cell };	
			} 	
		}

	}
}


/**
 * The AnsiTerm class represents an ANSI terminal emulator.
 * It provides methods to handle terminal operations, keyboard events, 
 * and rendering of characters with various attributes such as bold, italic, 
 * underline, and colors. The constructor accepts a set of key-value pairs
 * to configure various characteristics of the terminal.
 * 
 * @class
 * @param {Object|string} params - Configuration parameters or the ID of the div element to create the terminal in.
 * @param {number} [params.nLines=24] - Number of lines in the terminal.
 * @param {number} [params.nColumns=80] - Number of columns in the terminal.
 * @param {number} [params.historySize=1000] - Size of the history buffer.
 * @param {number} [params.fontSize=15] - Font size for the terminal text.
 * @param {string} [params.font="monospace"] - Font family for the terminal text.
 * @param {string} [params.statusFont="monospace"] - Font family for the status bar text.
 * @param {string} [params.containerId=""] - ID of the container element to create the terminal in.
 * @param {string} [params.canvasId=""] - ID of the canvas element to use for the terminal.
 * @param {string} [params.url=""] - URL for the terminal's data source.
 * @param {string} [params.channelType=""] - Type of channel for communication.
 * @param {string} [params.httpSessionHintParam="session"] - Name of an additional parameter to (try to) connect to a particular session.
 * @param {string} [params.httpSessionHint=""] - Value od the additional parameter to (try to) connect to a particular session. If empty, generates a new one internally.
 * @param {string} [params.httpSource=""] - Source for the terminal's data.
 * @param {string} [params.httpSize=""] - Configuration URL for the terminal.
 * @param {string} [params.httpDest=""] - Destination URL for sending terminal data.
 * @param {number} [params.immediateRefresh=100] - Immediate refresh interval in milliseconds.
 * @param {number} [params.fastRefresh=500] - Fast refresh interval in milliseconds.
 * @param {number} [params.slowRefresh=2000] - Slow refresh interval in milliseconds.
 * @param {string} [params.wsEndpoint=""] - WebSocket endpoint for the terminal.
 * @param {string} [params.wsDataTag=""] - WebSocket data tag for the terminal.
 * @param {string} [params.wsSizeTag=""] - WebSocket size tag for the terminal.
 * @param {string} [params.wsSizeData=""] - WebSocket size data for the terminal.
 * @param {string} [params.palette=null] - Base pasette (colors 0...15). Possible values: "default",
 *                                       - null (sane as "default", but takes background and foregraound parameters)
 *                                       - "windows", "xterm", "vscode", or an array of 16 colors.
 * @param {string} [params.foreground="rgb(229,229,229)"] - Default foreground color.
 * @param {string} [params.background="rgb(0,0,0)"] - Default background color.
 * @param {string} [params.statusForegroundOk="rgb(0,255,0)"] - Status bar foreground color for OK status.
 * @param {string} [params.statusBackgroundOk="rgb(0,128,0)"] - Status bar background color for OK status.
 * @param {string} [params.statusForegroundKo="rgb(255,0,0)"] - Status bar foreground color for KO status.
 * @param {string} [params.statusBackgroundKo="rgb(128,0,0)"] - Status bar background color for KO status.
 * @param {string} [params.titleBackground="rgb(0,0,128)"] - Title bar background color.
 * @param {string} [params.titleForeground="rgb(255,255,255)"] - Title bar foreground color.
 * @param {string} [params.keyboardBackground="rgb(0,0,128)"] - Soft keyboard background color.
 * @param {string} [params.keyboardForeground="rgb(255,255,255)"] - Soft keyboard foreground color.
 * @param {string} [params.selectionBackground="rgb(255,255,0)"] - Selection background color.
 * @param {string} [params.selectionForeground="rgb(0,0,0)"] - Selection foreground color.
 * @param {boolean} [params.blinkIsBold=true] - Whether blinking text should be bold.
 * @param {number} [params.blinkPeriod=500] - Blink period in milliseconds.
 * @param {number} [params.timeout=1000] - Timeout for state machine in milliseconds.
 * @param {string} [params.titleText=""] - Default title text.
 * @param {string} [params.cursorUpdateStyle="smart"] - Cursor update style ("lazy", "precise", "smart").
 * @param {boolean} [params.hasTitleBar=true] - Whether the terminal has a title bar.
 * @param {boolean} [params.hasStatusBar=true] - Whether the terminal has a status bar.
 * @param {boolean} [params.hasSoftKeyboard=false] - Whether the terminal has a soft keyboard.
 * @param {boolean} [params.hasSoftFKeys=false] - Whether the terminal has soft function keys.
 * @param {boolean} [params.bell_enabled] - Whether the bell sound is enabled. Default = true.
 * @param {number} [params.bell_duration] - The duration of the bell sound in seconds. Default = 0.5 seconds.
 * @param {number} [params.bell_frequency] - The frequency of the bell sound in Hz. Default=1760 Hz (==A6).
 * @param {number} [params.bell_decay] - The decay ratio of the bell sound (next sample/current). Default = 0.9998.
 */
/**
 * The `AnsiTerm` class implements a terminal emulator capable of interpreting
 * ANSI escape sequences and rendering the corresponding output on an HTML5 canvas.
 * It supports features such as cursor movement, text attributes (e.g., bold, italic, underline),
 * color management, scrolling regions, and keyboard input handling.
 *
 * This class is designed to be highly configurable and extensible, allowing developers
 * to integrate it into web applications requiring terminal-like functionality.
 *
 * ### Features:
 * - ANSI escape sequence interpretation.
 * - Support for 16-color and 256-color palettes.
 * - Cursor movement and text attributes (bold, italic, underline, reverse, blink).
 * - Scrolling regions and history buffer.
 * - Clipboard integration (copy as text, ANSI sequences, or HTML).
 * - Mouse-based text selection.
 * - Configurable keyboard input handling.
 * - Communication with a backend via REST, WebSocket, or custom drivers.
 *
 * ### Usage:
 * To create an instance of `AnsiTerm`, provide a configuration object or a container ID:
 * 
 * ```javascript
 * const term = new AnsiTerm({
 *   nLines: 24,
 *   nColumns: 80,
 *   containerId: "terminal-container",
 *   fontSize: 14,
 *   font: "monospace",
 *   background: "black",
 *   foreground: "white",
 * });
 * ```
 *
 * The terminal can then be used to render text, handle keyboard input, and communicate
 * with a backend server.
 *
 * ### Example:
 * ```javascript
 * term.write("Hello, World!\n");
 * term.registerOnTitleChange((title) => {
 *   console.log("Title changed to:", title);
 * });
 * term.sendText("ls -la\n");
 * ```
 *
 * ### Parameters:
 * - `params` (optional): A configuration object or a string representing the container ID.
 *   If no parameters are provided, default settings are applied.
 *
 * ### Configuration Options:
 * - `nLines` (number): Number of lines in the terminal (default: 25).
 * - `nColumns` (number): Number of columns in the terminal (default: 80).
 * - `fontSize` (number): Font size in pixels (default: 14).
 * - `font` (string): Font family (default: "monospace").
 * - `background` (string): Background color (default: "black").
 * - `foreground` (string): Foreground color (default: "white").
 * - `containerId` (string): ID of the container element for the terminal.
 * - `driver` (object): Custom driver for communication (default: null).
 * - `channelType` (string): Communication channel type ("rest", "websocket", "dummy").
 * - `historySize` (number): Number of lines to keep in the history buffer (default: 1000).
 *
 * ### Methods:
 * - `write(text)`: Writes a sequence of characters to the terminal.
 * - `sendText(text)`: Sends a sequence of characters to the backend.
 * - `focus()`: Sets focus on the terminal to receive keyboard input.
 * - `close()`: Closes the terminal and its communication channel.
 * - `registerOnTitleChange(callback)`: Registers a callback for title changes.
 * - `registerOnStatusChange(callback)`: Registers a callback for status changes.
 * - `registerOnFreezeChange(callback)`: Registers a callback for freeze state changes.
 * - `clearSelection()`: Clears the current text selection.
 * - `selectAll()`: Selects the entire screen.
 * - `clipboardCopyAsText()`: Copies the selection to the clipboard as plain text.
 * - `clipboardCopyAsAnsiSequence()`: Copies the selection to the clipboard as ANSI sequences.
 * - `clipboardCopyAsHtml()`: Copies the selection to the clipboard as HTML.
 * - `clipboardCopyAsRichText()`: Copies the selection to the clipboard as Rich Text.
 * - `clipboardPaste()`: Pastes text from the clipboard into the terminal.
 * - `toggleFreezeState()`: Toggles the freeze state of the terminal.
 *
 * ### Events:
 * - `onTitleChange`: Triggered when the terminal title changes.
 * - `onStatusChange`: Triggered when the communication status changes.
 * - `onFreezeChange`: Triggered when the freeze state changes.
 *
 * ### Notes:
 * - The terminal supports mouse-based text selection and clipboard integration.
 * - The `AnsiTerm` class is designed to be extensible, allowing developers to
 *   implement custom drivers and event handlers.
 */
export class AnsiTerm {


	/**
	 * This method retrieves the version string of "xwterm.js".
	 * @returns {string} The version string of this package.
	 */
	static getVersion()
	{
		return ANSITERM_VERSION;
	}

	_reset()
	{
		this.params.background = this.palette[0];
		this.params.foreground = this.palette[7];

		this.gc.fillStyle = this.params.background;
		this.gc.fillRect(0,0,this.gc.canvas.width,this.gc.canvas.height);
		this.gc.fillStyle = this.params.foreground;

		this.history.reset();
		this.screens = this.history.screens;
		this.scr_background = [ this.params.background, this.params.background ];
		this.scr_foreground = [ this.params.foreground, this.params.foreground ];
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
		this.scrollregion_h = this.params.nLines - 1;

		this.grstate = {};
		this.blink_state = false;

		this._setpos(0,0);
		this._resetattr();
		this.blink_lists = [[], []];
		this.blink_list = this.blink_lists[0];
		this.cursor_off = true;
		this.viewpoint = 0;
	}

	_selectscreen(f)
	{
		if (f != this.alternate_screen) {
			let scr = f ? 1 : 0;
			this.scr_background[1 - scr] = this.params.background;
			this.scr_foreground[1 - scr] = this.params.foreground;
			this.screen = this.screens[scr];
			this.blink_list = this.blink_lists[scr];
			this.params.background = this.scr_background[scr];
			this.params.foreground = this.scr_foreground[scr];
			this._redraw();
		}
		this.alternate_screen = f;
	}

	_savestate()
	{
		this.grstate = {
			screen: this.currscreen,
			foreground: this.params.foreground,
			background: this.params.background,
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
		this.params.foreground = this.grstate.foreground;
		this.params.background = this.grstate.background;
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
				"\x07": () => { this._bell(); this._init(); }, // BEL
				"\x08": () => {
						this._flush();
						if (this.posx == 0) {
							this._setpos(this.params.nColumns - 1, this.posy - 1);
						}
						else {
							this._incpos(-1, 0);
						}
				},
				"\x09": () => { this._tab(); },
				"\x0A": () => { this._newline(); },
				"\x0B": () => { this._newline(); }, // VT, but "treated as LF", they say
				"\x0C": () => { this._newline(); }, // FF, but "treated as LF", they say
				"\x0D": () => { this._cr(); },
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
				"@": this._ti(() => {
					this._insert_spaces(this._getarg(0,1));
				}), // ICH	Insert the indicated # of blank characters.
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
					this.scrollregion_h = this._getarg(1,this.params.nLines) - 1;
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
				"\x00": () => {  },
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
					for (let y = 0; y < this.params.nLines; ++y) {
						for (let x = 0; x < this.params.nColumns; ++x) {
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

			// IE11 hacks:
			"Spacebar": " ",
			"Up": "\x1b[A",
			"Down": "\x1b[B",
			"Right": "\x1b[C",
			"Left": "\x1b[D",
			"Ins": "\x1b[2~",
			"Del": "\x1b[3~",
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

		const predef_palettes = [
			[ "rgb(0,0,0)",    "rgb(205,0,0)",   "rgb(0,205,0)",   "rgb(205,205,0)",
		      "rgb(0,0,238)",  "rgb(205,0,205)", "rgb(0,205,205)", "rgb(229,229,229)",
		      "rgb(127,127,127)", "rgb(255,0,0)",   "rgb(0,255,0)",   "rgb(255,255,0)",
		      "rgb(92,92,255)",  "rgb(255,0,255)", "rgb(0,255,255)", "rgb(255,255,255)" ],

			[ "rgb(0,0,0)",    "rgb(192,32,32)",   "rgb(0,205,0)",   "rgb(205,205,0)",
		      "rgb(64,64,228)",  "rgb(192,32,192)", "rgb(0,205,205)", "rgb(229,229,229)",
		      "rgb(127,127,127)", "rgb(255,0,0)",   "rgb(0,255,0)",   "rgb(255,255,0)",
		      "rgb(92,92,255)",  "rgb(255,0,255)", "rgb(0,255,255)", "rgb(255,255,255)" ],

			[ "rgb(12,12,12)",    "rgb(197,15,31)",   "rgb(19,161,14)",   "rgb(193,156,0)",
		      "rgb(0,55,218)",  "rgb(136,23,152)", "rgb(58,150,221)", "rgb(204,204,204)",
		      "rgb(118,118,118)", "rgb(231,72,86)",   "rgb(22,198,12)",   "rgb(249,241,165)",
		      "rgb(59,120,255)",  "rgb(180,0,158)", "rgb(97,214,214)", "rgb(242,242,242)" ],

			[ "rgb(0,0,0)",    "rgb(205,49,49)",   "rgb(13,188,121)",   "rgb(229,229,16)",
		      "rgb(36,114,200)",  "rgb(188,63,188)", "rgb(17,168,205)", "rgb(229,229,229)",
		      "rgb(102,102,102)", "rgb(241,76,76)",   "rgb(35,209,136)",   "rgb(245,245,67)",
		      "rgb(59,142,234)",  "rgb(214,112,214)", "rgb(41,184,219)", "rgb(229,229,229)" ],

		];

		const palettes = {
			"xterm": predef_palettes[0],
			"xterm256": predef_palettes[0],

			"default": predef_palettes[1],

			"windows": predef_palettes[2],
			"w10": predef_palettes[2],
			"win10": predef_palettes[2],

			"code": predef_palettes[3],
			"vscode": predef_palettes[3],
		};

		this.palette = palettes["default"];

		if (this.params.palette instanceof Array) {
			this.palette = this.params.palette;
		}
		else if (this.params.palette in palettes) {
			this.palette = palettes[this.params.palette];
		}
		else  {
			this.palette = palettes["default"];
			this.palette[0] = this.params.background;
			this.palette[7] = this.params.foreground;
		}
	
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

	_resize_canvas()
	{
		this.width = this.charwidth * this.params.nColumns;
		this.height = this.charheight * this.params.nLines;
		this.gc.canvas.width = this.width;
		this.gc.canvas.height = this.height;
				
		// We must repeat this after a size change:
		this.gc.font = this.fullfont;
		this.gc.textBaseline = "bottom";
	}

	//
	// Layout generator.
	//
	_layout()
	{
		this.canvas = null;
		this.hidden_input = null;
		this.clipboard_text_helper = null;
		
		this.decoration = null;
		this.scrollbar = null;

		this.container = null;
		this.no_container = false;

		if (this.params.canvasId != "") {
			//
			// Canvas created externally, it is supposed to be decorated by the caller.
			//
			this.canvas = document.getElementById(this.params.canvasId);
		}
		else {
			//
			// Canvas created internally. We can apply the decoration, if required.
			//
			this.canvas = document.createElement("canvas");
			//if (this.params.hasSoftFKeys || this.params.hasSoftKeyboard || this.params.hasStatusBar || this.params.hasTitleBar)
			{
				this.decoration = new AnsiTermDecoration(this, this.canvas, this.params);
			}
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

		this.canvas.addEventListener("paste", (event) => {
		    let text = event.clipboardData.getData("text");
			this._send_data(text);
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
			//console.log("Text = '" + e + "' cm =");
			//console.log(cm);
				// Sometimes the measures are not integers, so we
				// round them to the nearest integer.
				let w = Math.floor(cm.actualBoundingBoxLeft + cm.actualBoundingBoxRight + 0.5);
				let h = Math.floor(cm.fontBoundingBoxAscent + cm.fontBoundingBoxDescent + 0.5);

				//// Hacks for IE11
				if (! w) {
					w = Math.floor(cm.width + 0.5);
				}
				if (! h) {
					h = Math.floor(this.params.fontSize + 0.5);
				}
				////
	
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
		this._resize_canvas();


		// Scrollbar management

		if ((typeof window.GenericScrollBarAdder === 'undefined')
		 && (typeof AnsiTermGenericScrollBarAdder === 'undefined')) {
			this.params.historySize = 0;
		}

		if (this.params.historySize > 0) {

			if ((! this.params.internalScrollbar) && (! (typeof window.GenericScrollBarAdder === 'undefined'))) {
				this.scrollbar = new window.GenericScrollBarAdder(this.canvas, {vertical: true, horizontal: false});
			}
			else {
				this.scrollbar = new AnsiTermGenericScrollBarAdder(this.canvas, {vertical: true, horizontal: false});
			}

			this.scrollbar.verticalScrollbar.setMinValue(0);
			this.scrollbar.verticalScrollbar.setMaxValue(0 /*this.params.nLines - 1*/);
			this.scrollbar.verticalScrollbar.setVisibleRangeSize(this.params.nLines);
			this.scrollbar.verticalScrollbar.setValue(0);

			this.scrollbar.verticalScrollbar.registerOnChange( (rv)	=> {
				rv.value = rv.minValue + (rv.value - rv.minValue); 
				rv.value = Math.floor(rv.value + 0.5);
				//console.log(rv);
				if (rv.value != this.viewpoint) {
					if ((this.viewpoint != 0) != (rv.value != 0)) {
						if (rv.value != 0) {
							this._inc_freeze();
						}
						else {
							this._dec_freeze();
						}
					}

					let dy = this.viewpoint - rv.value;

					//console.log("Olb viewpoint: " + this.viewpoint + " new: " + rv.value);

					this.viewpoint = rv.value;

					if (! this.params.blinkIsBold) {
						// Adjust blink_list: add to the list the lines
						// that are visible now, and remove the lines that
						// aren't visible anymore.

						let bl = [];

						Object.keys(this.blink_list).forEach((v, i, a) => {
							let y = this.blink_list[v].y;
							if ((dy > 0 && y < this.params.nLines - dy)
							 || (dy < 0 && y >= -dy)) {
								let x = this.blink_list[v].x;
								y += dy;
								this._add_to_blink_list(x, y, bl);
							}
						});

						let ystart = 0;
						let yend = dy;

						if (dy < 0) {
							ystart = this.params.nLines + dy - 1;
							yend = this.params.nLines - 1;
						}

						for (let y = ystart; y < yend; ++y) {
							let li = this._line_by_index(y);
							for (let x = 0; x < this.params.nColumns; ++x) {
								if (li[x].blink) {
									this._add_to_blink_list(x, y, bl);
								}
							}
						}
/*
						console.log("Old blink list:");
						console.log(this.blink_list);
						console.log("New blink list:");
						console.log(bl); */

						// ...almost working... almost...					

						this.blink_list = bl;
						this.blink_lists[this.alternate_screen ? 1 : 0] = bl;					

					}

					this._redraw();
				}
			});

			/////
		}

		this.canvas.focus();

	}

	_add_to_blink_list(x, y, bl)
	{
		bl[x + "," + y] = { x: x, y: y};
	}

	_remove_from_blink_list(x, y, bl)
	{
		delete bl[x + "," + y];
	}

	/**
	 * Creates an AnsiTerm instance.
	 *
	 * If "params" is not specified, the default configuration is applied (80x25,
	 * title bar, status bar, soft keyboard, HTTP protocol, "document.body" as
	 * parent).
	 *
	 * If "params" is a string, it is interpreted as the container ID in which
	 * the terminal takes place.
	 * @param {*} params optional parameters, as a single string or set of key-value pairs.
	 */
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
			params = { containerId: params };
		}

		// Apply defaults, overwrite with actual parameters
		this.params = { ...ANSITERM_DEFAULTS, ...params };

		// Fix some defaults that can't be set in the defaults table.
		this.params.url = this.params.url || window.location.href;
		this.params.keyboardBackground = this.params.keyboardBackground || this.params.titleBackground;
		this.params.keyboardForeground = this.params.keyboardForeground || this.params.titleForeground;

		switch (this.params.cursorUpdateStyle) {
			case "lazy":
				this.cursor_update_on_keypress = false;
				this.cursor_precise = false;
				break;
			case "precise":
				this.cursor_update_on_keypress = false;
				this.cursor_precise = true;
				break;
			case "smart":
			default:
				this.cursor_update_on_keypress = true;
				this.cursor_precise = false;
				break;
		}

		// Lists of custom event handlers.
		this.on_title_change = [];
		this.on_status_change = [];
		this.on_freeze_change = [];
		this.on_copy = [];

		// Initialize state variables.
		this.underline = false;
		this.blink = false;
		this.reverse = false;
		this.highlight = false;
		this.blink_cursor = true;
		this.params.blinkPeriod = 500;
		this.enable_cursor = true;
		this.force_blink_cursor = true;

		this.status_ok = -1; // It means "not defined"

		this.bold = false;
		this.italic = false;
		this.audio_context = null;

		this.selection_on = false;
		this.selection_active = false;
		this.selection_start = -1;
		this.selection_end = -1;
		this.selection_last = -1;
		
		this.incoming_text = "";

		this.output_frozen_by_user = false;

		this.freeze_count = 0;

		this.fullfont = this.params.fontSize.toString() + "px " + this.params.font;
		this.status_fullfont = /* this.params.fontSize.toString() + "px " + */ this.params.statusFont;

		this.empty_cell = {
			ch: " ",
			background: this.params.background, // this.palette[0],
			foreground: this.params.foreground, // this.palette[7],
			blink: false,
			reverse: false,
			bold: false,
			italic: false,
			underline: false,
		};

		this.history = new AnsiTermHistory(this.params.nLines, this.params.nColumns, this.params.historySize, this.empty_cell);
		this.viewpoint = 0;

		// Create elements and layout.
		this._layout();
		
		this._create_palette();

		this._reset();

		//document.onkeydown = ((e) => { this._on_keydown(e); });
		this.canvas.setAttribute('tabindex', '0');
		this.canvas.onkeydown = ((e) => { this._on_keydown(e); });
		this.canvas.focus();

		this.blink_timer = setTimeout( (() => { this._blink_timeout(); }), this.params.blinkPeriod);

		this.save_posx = this.posx;
		this.save_posy = this.posy;
		this.save_posx_2 = this.posx;
		this.save_posy_2 = this.posy;
		this._savestate();

		this._set_title(this.params.titleText);
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

		if (this.params.driver == null) {
			switch (this.params.channelType) {
				
			case "rest":
			case "http":
				this.params.driver = new AnsiTermHttpDriver(
					{
						immediateRefresh: this.params.immediateRefresh,
						fastRefresh: this.params.fastRefresh,
						slowRefresh: this.params.slowRefresh,
						httpSource: this.params.httpSource,
						httpDest: this.params.httpDest,
						httpSize: this.params.httpSize,
						httpSessionHintParam: this.params.httpSessionHintParam,
						httpSessionHint: this.params.httpSessionHint,
					}
				);
				break;

			case "websocket":
				this.params.driver = new AnsiTermWebSocketDriver(
					{
						wsEndpoint: this.params.wsEndpoint,
						wsDataTag: this.params.wsDataTag,
						wsSizeTag: this.params.wsSizeTag,
						wsSizeData: this.params.wsSizeData,
					}
				);
				break;

			case "dummy":
			default:
				this.params.driver = new AnsiTermDriver({});
				break;
			}
		}

		this.params.driver.registerOnDataReceived(
				(text) => {
					this.write(text);
				}
			);
			
		this.params.driver.registerOnConnectionChange(
				(st) => {
					this._set_status(st);
				}
			);

		this.params.driver.start();

		setTimeout( () => { this._setsize(); }, 0);
	}

	/**
	 * This method returns the canvas element used by the terminal.
	 * @returns {HTMLCanvasElement} The canvas element.
	 */

	getCanvas()
	{
		return this.canvas;
	}

	/**
	 * This method sets the focus on the terminal.
	 * It is used to make the terminal ready to receive keyboard input.
	 */
	focus()
	{
		this.canvas.focus();
	}

	/**
	 * This method closes the terminal's communication channel
	 * and destroys the terminal.
	 */
	close()
	{
		this._clear_selection();
		this.params.driver.close();
		this._clear_timer();
		if (this.decoration) {
			this.decoration.close();
			this.decoration = null;
		}
	}

	_flush()
	{
		if (this.pending_text.length > 0) {
			// TODO: optimize
			for (let i = 0; i < this.pending_text.length; ++i) {

			/* Check if we are beyond the end of the line, i.e.,
			the line has been filled completely. Only at this point,
			we synthesize a CR-LF before drawing the next character.
			Then, we increment the horizontal position. Note that
			the horizontal position may take the "impossible" value
			of "nColumns", while its "normal" value should be 0 to
			"nColumns-1". This may look weird, but it is required for
			ANSI-xterm compliance: when the line is completely full,
			the cursor disappears behind the right margin.
			This also forces us to check for the "special value" of "posx",
			e.g., in cursor blink logic. */
				if (this.posx >= this.params.nColumns) {
					this._setpos(0, this.posy);
					this._nextline();
				}
				this._printchar(this.pending_text[i]);
				if (this.posx < this.params.nColumns) {
					this._incpos(1, 0);
				}

				/* The naive version: no "impossible" value of "posx",
				but a slightly different behavior that breaks some
				applications (e.g., the Midnight Commander's port on Windows)

				this._printchar(this.pending_text[i]);
				if (this.posx >= this.params.nColumns - 1) {
					this._setpos(0, this.posy);
					this._nextline();
				}
				else {
					this._incpos(1, 0);
				}
				*/

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
		if (this.params.timeout > 0 && this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}


	_reset_timer()
	{
		this._clear_timer();
		if (this.params.timeout > 0) {
			this.timer = setTimeout(() => {
				this._sm("", true);
			}, this.params.timeout);
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
		// Check "special value", see comments in "_flush()"
		if (x >= this.params.nColumns) {
			return;
		}
		let blink = this.screen[y][x].blink; // NOTE: may be undefined!
		this.screen[y][x] = src;
		if (src.blink != blink) {
			if (src.blink) {
				this._add_to_blink_list(x, y, this.blink_list);
			}
			else {
				this._remove_from_blink_list(x, y, this.blink_list);
			}
		}
	}

	_clearscreen()
	{
		let y;
		let x;
		for (y = 0; y < this.params.nLines; ++y) {
			for (x = 0; x < this.params.nColumns; ++x) {
				this.screen[y][x] = {
					ch: " ",
					background: this.params.background,
					foreground: this.params.foreground,
					blink: this.blink,
					underline: this.underline,
					reverse: this.reverse,
					bold: this.bold,
					italic: this.italic
				};
			}
		}
	}

	_set_status(ok)
	{
		if (this.status_ok != ok) {
			this.on_status_change.forEach(callback => callback(ok));
			this.status_ok = ok;
		}
	}


	/**
	 * Adds a callback that the terminal will invoke when the communication state changes.
	 * The callback receives a boolean parameter: "true" if the communication
	 * is established, "false" if not.
	 *
	 * Multiple callbacks may be registered in this way.
	 * The callbacks can be removed by calling the {@link cancelOnStatusChange} method.
	 *
	 * @param {function} cb - The callback function to add.
	 */
	registerOnStatusChange(cb)
	{
		this.on_status_change.push(cb);
		cb(this.status_ok);
	}
	/**
	 * This method removes the callback registered by {@link registerOnStatusChange}.
	 * @param {function} cb - The callback function to remove.
	 */
	cancelOnStatusChange(cb)
	{
		this.on_status_change = this.on_status_change.filter((cb) => cb != callback);
	}

	
	_is_frozen()
	{
		return (this.freeze_count != 0);
	}

	_update_freeze_state()
	{
		let frozen = this._is_frozen();
		if (! frozen) {
			this._apply(this.incoming_text);
			this.incoming_text = "";
		}
		this.on_freeze_change.forEach(callback => callback(frozen, this.incoming_text.length, this.freeze_count));
	}

	_inc_freeze()
	{
		++this.freeze_count;
		this._update_freeze_state();
	}

	_dec_freeze()
	{
		if (this.freeze_count > 0) {
			--this.freeze_count;
			this._update_freeze_state();
		}

	}

	/**
	 * This method adds a callback that the terminal will invoke each time one of these events happens:
	 *
	 * - the terminal freezes, i.e., stops updating the screen and accumulates incoming
	 * characters instead of showing them. A "freeze" may be generated by entering
	 * the mouse selection state or programmatically by calling {@link toggleFreezeState}.
	 * - the terminal is frozen, and new characters are received.
	 * - the terminal exits the freeze state.
	 *
	 * The callback receives two parameters:
	 *
	 * - a boolean parameter, "true" if the terminal is frozen, "false" if not,
	 * - the number of characters received since the terminal has been frozen.
	 *
	 * Multiple callbacks may be registered in this way.
	 *
	 * The callbacks can be removed by calling the {@link cancelOnFreezeChange} method.
	 *
	 * @param {function} cb - The callback function to add.
	 */
	registerOnFreezeChange(cb)
	{
		this.on_freeze_change.push(cb);
		cb(this._is_frozen(), this.incoming_text.length, this.freeze_count);
	}
	/**
	 * This method removes the callback registered by {@link registerOnFreezeChange}.
	 * @param {function} cb - The callback function to remove.
	 */
	cancelOnFreezeChange(cb)
	{
		this.on_freeze_change = this.on_freeze_change.filter((cb) => cb != callback);
	}


	_toggle_freeze()
	{
		this.output_frozen_by_user = ! this.output_frozen_by_user;
		if (this.output_frozen_by_user) {
			this._inc_freeze();
		}
		else {
			this._dec_freeze();
		}
		if (this.freeze_button) {
			this.freeze_button.innerText = this.output_frozen_by_user ? "Unfreeze" : "Freeze";
		}
		this._update_freeze_state();
	}

	_set_title(t)
	{
		this.title_text = t;
		this.on_title_change.forEach(callback => callback(t));
	}

	/**
	 * This method adds a callback that the terminal will invoke each time the title changes,
	 * i.e., when the "set title" ANSI sequence is received.
	 * The callback receives the new title as a parameter.
	 * Multiple callbacks may be registered in this way.
	 * The callbacks can be removed by calling the {@link cancelOnTitleChange} method.
	 * @param {function} cb - The callback function to add.
	 */
	registerOnTitleChange(cb)
	{
		this.on_title_change.push(cb);
		cb(this.title_text);
	}
	/**
	 * This method removes the callback registered by {@link registerOnTitleChange}.
	 * @param {function} cb - The callback function to remove.
	 */
	cancelOnTitleChange(cb)
	{
		this.on_title_change = this.on_title_change.filter((cb) => cb != callback);
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
			this._send_data("\x1B]" + a0 + ";rgb:" + this.palette[to_palette[a0]].slice(4).replace(")", "").replace(/,/g, "/") + "\x07");
		}
	}

	_line_by_index(y)
	{
		if (this.alternate_screen && y >= 0 && this.viewpoint == 0) {
			return this.screen[y];
		}
		return this.history.getLine(y + this.viewpoint);
		/*
		let l = this.history.length;
		y += this.viewpoint;
		return (y >= 0) ? this.screen[y] : ((y < -l) ? this.history[0] : this.history[l+y]);
		*/
	}

	_redraw_box(x0, y0, width, height)
	{
		let bg = this.params.background;
		let fg = this.params.foreground;
		let ul = this.underline;
		let bold = this.bold;
		let italic = this.italic;
		let reverse = this.reverse;
		let blink = this.blink;

		if (width < 0) {
			width = 0;
		}
		else if (width > this.params.nColumns) {
			width = this.params.nColumns;
		}
		if (height < 0) {
			height = 0;
		}
		else if (height > this.params.nLines) {
			height = this.params.nLines;
		}
		if (x0 < 0) {
			x0 = 0;
		}
		if (x0 + width >= this.params.nColumns) {
			x0 = this.params.nColumns - width;
		}
		if (y0 < 0) {
			y0 = 0;
		}
		if (y0 + height >= this.params.nLines) {
			y0 = this.params.nLines - height;
		}

		//console.log("redraw",x0, y0, width, height);

		for (let y = y0; y < y0 + height; ++y) {

			let ly = this._line_by_index(y);
			
			for (let x = x0; x < x0 + width; ++x) {

				let ch = ly[x];
				this.params.background = ch.background;
				this.params.foreground = ch.foreground;
				this._setbold(ch.bold);
				this._setitalic(ch.italic);
				this.underline = ch.underline;
				this.blink = ch.blink;
				this.reverse = ch.reverse;

				this._printchar_in_place(ch.ch, x, y);

			}
		}

		this.params.background = bg;
		this.params.foreground = fg;
		this._setbold(bold);
		this._setitalic(italic);
		this.underline = ul;
		this.blink = blink;
		this.reverse = reverse;
		this.cursor_off = true;
	}

	_redraw()
	{
		this._redraw_box(0, 0, this.params.nColumns, this.params.nLines);
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
			// Check "special value", see comments in "_flush()"
			if (this.posx < this.params.nColumns) {
				let op = this.gc.globalCompositeOperation;
				this.gc.globalCompositeOperation = "xor";
				this._clearcharbb(this.params.foreground);
				this.gc.globalCompositeOperation = op;
			}
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
				let li = this._line_by_index(y);
				let ch = li[x];
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
		this.blink_timer = setTimeout( (() => { this._blink_timeout(); }), this.params.blinkPeriod);
	}

	_unblink_cursor()
	{
		if (this.x_lastblink >= 0 && this.y_lastblink >= 0) {
			if (this.x_lastblink < this.params.nColumns) {
				let bg = this.params.background;
				let fg = this.params.foreground;
				let rv = this.reverse;
				let ul = this.underline;
				let ch = this.screen[this.y_lastblink][this.x_lastblink];
				this.params.background = ch.background;
				this.params.foreground = ch.foreground;
				this.reverse = ch.reverse;
				this.underline = ch.underline;
				this._printchar_in_place(ch.ch, this.x_lastblink, this.y_lastblink);
				this.params.background = bg;
				this.params.foreground = fg;
				this.reverse = rv;
				this.underline = ul;
			}
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
		if (x >= this.params.nColumns) {
			// Accept "impossible" value of posx
			x = this.params.nColumns; // - 1;
		}
		if (y >= this.params.nLines) {
			y = this.params.nLines - 1;
		}
		// In general, a cursor position change should reset
		// the "line wrap" condition, but we preserve it if the
		// new position and the old one are the same.
		// Another case would be the "_nextline" due to line wrap itself,
		// but this is checked in "_nextline", not here.
		//if (x != this.posx || y != this.posy) {
		//	this.line_wrap = false;
		//}
		this.posx = x;
		this.posy = y
		this.pospx = this.posx * this.charwidth;
		this.pospy = (this.posy + 1) * this.charheight - 1;
		if (this.cursor_precise) {
			this._do_blink_cursor();
		}
	}

	_incpos(dx, dy)
	{
		this._setpos(this.posx + dx, this.posy + dy);
	}

	_scroll_core(y_start, y_end, jump, update_history = false)
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

			/*if (false) {
				let d = this.gc.getImageData(0, py_src, this.gc.canvas.width, pheight);
				this.gc.putImageData(d, 0, py_dest);
			}
			else
			*/{
				this.gc.drawImage(this.canvas,
								0, py_src, this.gc.canvas.width, pheight,
								0, py_dest, this.gc.canvas.width, pheight);
			}
		}

		this.gc.fillStyle = this.params.background;
		this.gc.fillRect(0, py_clr, this.gc.canvas.width, jumppx);
		this.gc.fillStyle = this.params.foreground;

		let rotate = false;

		if (update_history) {
			// Special case (actually the most common one):
			// scroll the whole screen and add to the history the line that is going
			// to disappear at the top. Instead of moving the cells, we remap
			// the screen to the history buffer. The history buffer is rotated
			// to make room for the new line (or to recycle the oldest one).
			rotate = this.history.update();
		}
		
		if (!rotate) {
			for (let y = ymove_start; (y * ymove_step) < ymove_end; y += ymove_step) {
				for (let x = 0; x < this.params.nColumns; ++x) {
					this._setcell(x, y, { ...this.screen[y + jump][x] });
				}
			}
		}

		//this.dump();
		for (let y = y_to_erase; (y * ymove_step) >= ymove_end; y -= ymove_step) {
			for (let x = 0; x < this.params.nColumns; ++x) {
				this._clearcharscr(x, y);
			}
		}
		//this.dump();

		if (this.y_lastblink >= y_start && this.y_lastblink <= y_end) {
			this.y_lastblink -= jump;
			if (this.y_lastblink < 0) {
				this.y_lastblink = 0;
			}
			else if (this.y_lastblink >= this.params.nLines) {
				this.y_lastblink = this.params.nLines - 1;
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

	_scroll_and_update_history()
	{
		// Special case of scroll: scroll the whole screen
		// and update the history. This is obtained by rotating
		// the history buffer and setting the new screen to the
		// last line of the history. The screen map is updated
		// to point to the new screen.
		this._scroll_core(0, this.params.nLines - 1, 1, true)
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
			if (this.posx + i >= this.params.nColumns - 1) {
				this._flush();
			}
		}
	}

	_display()
	{
	}

	_nextline()
	{
		if (this.posy >= this.scrollregion_h) {
			// The line on top of the primary screen is going to be scrolled out.
			// We must save it in the history. We do it only if the
			// scroll region is the whole screen, because lines lost in partial scrolls
			// are not expected to be retrieved in the history.
			if ((! this.alternate_screen)
			 && (this.scrollregion_l == 0 && this.scrollregion_h == this.params.nLines - 1)) {

				this._scroll_and_update_history();
				this.scrollbar.verticalScrollbar.setMinValue(this.params.nLines - this.history.length);
			}
			else {
				this._scroll();
			}
		}
		else {
			this._setpos(this.posx, this.posy + 1);
		}
	}

	_cr()
	{
		this._flush();
		if (! this.alternate_screen) {
			this.history.completeLogicalLine(this.posx, this.posy);
		}
		this._setpos(0, this.posy);
	}

	_newline()
	{
		this._flush();
 		this._nextline();
		if (! this.alternate_screen) {
			this.history.startLogicalLine(this.posy);
		}

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
		this.params.background = this.palette[0];
		this.params.foreground = this.palette[7];
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
				this.params.foreground = this.palette[a - 30];
				break;
			case 90: case 91: case 92: case 93: case 94: case 95: case 96: case 97:	
				this.params.foreground = this.palette[a - 90 + 8];
				break;
			case 40: case 41: case 42: case 43: case 44: case 45: case 46: case 47:	
				this.params.background = this.palette[a - 40];
				break;
			case 100: case 101: case 102: case 103: case 1010: case 105: case 106: case 107:	
				this.params.background = this.palette[a - 100 + 8];
				break;
			case 38:
			case 48:
				if (args.length - j >= 3)  {
					let e = Number(args[j+1]);
					if (e == 2) {

						let r = Number(args[args.length-3]);
						let g = Number(args[args.length-2]);
						let b = Number(args[args.length-1]);

						let c = "rgb(" + r + "," + g + "," + b + ")";

						if (a == 38) {
							this.params.foreground = c;
						}
						else {
							this.params.background = c;
						}
						j = args.length - 1;
					}
					else if (e == 5) {
						let c = Number(args[j + 2]);
						if (a == 38) {
							this.params.foreground = this.xpalette[c];
						}
						else {
							this.params.background = this.xpalette[c];
						}
						j += 2;
					}
				}
				break;
			case 39:
				this.params.foreground = this.palette[7];
				break;
			case 49:
				this.params.background = this.palette[0];
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
				if (this.params.blinkIsBold) {
					this._setbold(true);
				}
				else {
					this.blink = true;
				}
				break;
			case 25:
				if (this.params.blinkIsBold) {
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
			r = "\x1B[" + (a - 10) + ";" + (this.charheight * this.params.nLines) + ";" + (this.charwidth * this.params.nColumns) + "t";
			break;
		case 16:
			r = "\x1B[6;" + this.charheight + ";" + this.charwidth + "t";
			break;
		case 18:
		case 19:
			r = "\x1B[" + (a - 10) + ";" + this.params.nLines + ";" + this.params.nColumns + "t";
			break;
		default:
			break;
		}
		if (r != "") {
			this._send_data(r);
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
		let end = (a == 1) ? y : this.params.nLines;
		// TODO: optimize
		for (let i = start; i < end; ++i) {
			for (let j = 0; j < this.params.nColumns; ++j) {
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
		let end = (a == 1) ? (x + 1) : this.params.nColumns;
		this._erase(start, end);
	}

	_insert_spaces(n)
	{
		if (n + this.posx >= this.params.nColumns) {
			n = this.params.nColumns - this.posx - 1;
		}
		let nm = this.params.nColumns - this.posx - n;

		for (let i = nm - 1; i >= 0;  --i) {
			this._setcell(this.posx + i + n, this.posy, { ...this.screen[this.posy][this.posx + i] });
		}

		this._redraw_box(this.posx + n, this.posy, nm, 1)

		this._erase(this.posx, this.posx + n);
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
		if (n + this.posx >= this.params.nColumns) {
			n = this.params.nColumns - this.posx - 1;
		}

		for (let i = this.posx; i < this.params.nColumns - n; ++i) {
			this._setcell(i, this.posy, { ...this.screen[this.posy][i + n] });
		}

		this._redraw_box(this.posx, this.posy, this.params.nColumns - this.posx - n, 1)

		this._erase(this.params.nColumns - n, this.params.nColumns);
	}

	_clearcharbbxy(bg, x, y)
	{
		// Check "special value" (here in pixels), see comments in "_flush()"
		if (x >= this.width) {
			return;
		}		
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
			background: this.params.background, // this.palette[0],
			foreground: this.params.foreground, // this.palette[7],
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
		this._clearcharbb(this.params.background /*this.palette[0] */);
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
		let fg = this.params.foreground;
		let bg = this.params.background;
		if (this.reverse) {
			bg = this.params.foreground;
			fg = this.params.background;
		}
		if (this.highlight) {
			fg = this.params.selectionForeground;
			bg = this.params.selectionBackground;
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
			background: this.params.background,
			foreground: this.params.foreground,
			blink: this.blink,
			reverse: this.reverse,
			bold: this.bold,
			italic: this.italic,
			underline: this.underline,
		});
		this._printchar_in_place_pix(ch, this.posx, this.posy, this.pospx, this.pospy);
	}

	_bell_samples(duration, frequency, decay)
	{
		if (this.params.bell_enabled) {
			try {
				if (! this.audio_context) {
					this.audio_context = new (window.AudioContext || window.webkitAudioContext)();
				}
				let rate = this.audio_context.sampleRate;
				let nsamples = Math.floor(rate * duration);
				if (! this.buffer) {
					this.buffer = this.audio_context.createBuffer(1, nsamples, rate);
				}
				let channel_data = this.buffer.getChannelData(0);
				let fading = 1.0;
				// Generate a bell sound: a wave at the given frequency, decaying exponentially over time.
				// To add some harmonics, we use a cubic function of the sine wave,
				// which is a bit brighter than a pure sine wave.
				for (let i = 0; i < nsamples; ++i) {
					channel_data[i] = Math.pow(Math.sin(2 * Math.PI * frequency * i / rate), 3) * fading;
					fading *= decay;
				}
			}
			catch (err) {
			}
		}
	}

	/**
	 * This method sets the parameters for the bell sound.
	 * The bell sound is played when the terminal receives a BEL character (0x07).
	 * @param {boolean} enabled - Whether the bell sound is enabled.
	 * @param {number} dration - The duration of the bell sound in seconds (no changes if undefined).
	 * @param {number} frequency - The frequency of the bell sound in Hz (no changes if undefined).
	 * @param {number} decay - The decay ratio of the bell sound (no changes if undefined).
	 * @returns {void}
	 * @example
	 * term.setBell(true, 0.5, 1760, 0.9);
	 * @description
	 * This method allows you to configure the bell sound parameters for the terminal.
	 * The bell sound is played when the terminal receives a BEL character (0x07).
	 * You can enable or disable the bell sound, set its duration, frequency, and decay ratio.
	 * The default values are:
	 * - `enabled`: true
	 * - `duration`: 0.5 seconds
	 * - `frequency`: 1760 Hz (A6 note)
	 * - `decay`: 0.9998 (decay ratio between a sample and the next one, i.e., next/current)
	 */
	setBell(enabled, duration, frequency, decay)
	{
		this.params.bell_enabled = enabled;
		let rebuild = enabled
		           && this.params.bell_duration != duration
				   && this.params.bell_frequency != frequency
				   && this.params.bell_decay != decay;
		this.params.bell_duration = duration || this.params.bell_duration; // seconds
		this.params.bell_frequency = frequency || this.params.bell_frequency; // Hz
		this.params.bell_decay = decay || this.params.bell_decay; // decay ratio between a sample and the next one (next/current)
		if (rebuild) {
			this._bell_samples(this.params.bell_duration, this.params.bell_frequency, this.params.bell_decay);
		}
	}

	_bell()
	{
		try {
			if (this.params.bell_enabled) {
				this._bell_samples(this.params.bell_duration, this.params.bell_frequency, this.params.bell_decay);
				let source = this.audio_context.createBufferSource();
				source.buffer = this.buffer;
				source.connect(this.audio_context.destination);
				source.start();
			}
		}
		catch (err) {
			console.error("Error playing bell sound: " + err.toString());
		}
	}

	/**
	 * This method writes the given sequence of characters. The sequence
	 * is processed by the ANSI interpreter, which modifies the screen
	 * accordingly.
	 * @param {string} text - The text to write to the terminal.
	 */
	write(t)
	{
		try {
			try {
				// escape is deprecated, and it's also prone to weird exceptions,
				// but it's more relaxed in non-ASCII characters handling
				// (e.g. old sample server works)
				t =  decodeURIComponent(escape(t));
			}
			catch {
				t =  decodeURIComponent(encodeURIComponent(t));
			}
		} catch(err) {
			console.log(err.toString() + ": " + t)
		}
		if (this._is_frozen()) {
			this.incoming_text += t;
			this._update_freeze_state();
		}
		else {
			this._apply(t);
		}
	}

	_setsize()
	{
		this.params.driver.setSize(this.params.nLines, this.params.nColumns);
	}

	_send_data(t)
	{
		this.params.driver.send(t);
	}

	_send_id()
	{
		this._send_data("\x1B[?6c");
	}

	_send_version()
	{
		this._send_data("\x1B[>65;6800;1c");
	}

	_send_pos()
	{
		let x = this.posx >= this.params.nColumns ? this.params.nColumns - 1 : this.posx;
		let y = this.posy >= this.params.nLines ? this.params.nLines - 1 : this.posy;
		this._send_data("\x1B[" + (y + 1) + ";" + (x + 1) + "R"); // VT101 and Windows console
	}

	_send_ok()
	{
		this._send_data("\x1B[0n");
	}

	_eval_key(ev)
	{
		let key;
		let e = {
			key: ev.key,
			code: ev.code || ev.key, // Hack for IE11
			composed: (("composed" in ev) ? ev.composed : (ev.ctrlKey || ev.altKey || ev.metaKey)), // Hack for IE11
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
		//console.log(e);
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
			this._send_data(key);
		}
		if (this.cursor_update_on_keypress) {
			this._do_blink_cursor();
		}
	}

	/**
	 * This method sends the ANSI sequence corresponding to the given keyboard event object
	 * to the communication channel used by the terminal.
	 *
	 * A key event is an object containing key-related members as produced by a real key event.
	 * The object is not required to be a real "event", as only a subset of members is needed:
	 *
	 * - "key",
	 * - "code",
	 * - "composed",
	 * - "ctrlKey",
	 * - "altKey",
	 * - "metaKey".
	 *
	 * Example: the TAB key is represented by this object:
	 *
	 * { key: 'Tab', code: 'Tab', composed: false, ctrlKey: false, altKey: false, metaKey: false }
	 *
	 * @param {KeyEventObject} key - the key event to send
	 */ 
	sendKeyByKeyEvent(key)
	{
		this._send_key(key);
		this.canvas.focus();
	}


	/**
	 * This method sends the given sequence of characters
	 * to the communication channel used by the terminal.
	 *
	 * @param {string} text - the text to send
	 */ 
	sendText(text)
	{
		this._send_data(text);
	}


	// DEBUG //
	_dump()
	{
		let l = "";
		for (let y = 0; y < this.params.nLines; ++y) {
			for (let x = 0; x < this.params.nColumns; ++x) {
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
		let x1 = i1 % this.params.nColumns;
		let y1 = Math.floor(i1 / this.params.nColumns);
		let w = this.params.nColumns - x1;
		if (w > ncell) {
			w = ncell;
		}
		this._redraw_box(x1, y1, w, 1);
		ncell -= w;
		if (ncell > 0) {
			let nlines = Math.floor(ncell / this.params.nColumns);
			this._redraw_box(0, y1 + 1, this.params.nColumns, nlines);
			ncell -= nlines * this.params.nColumns;
			if (ncell > 0) {
				this._redraw_box(0, y1 + nlines + 1, ncell, 1);
			}
		}
		this.highlight = false;
	}

	_update_selection(x, y)
	{
		let sel = x + y * this.params.nColumns;

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
		if (this.selection_active) {
			this._dec_freeze();
		}
		this.selection_active = false;
		this._update_freeze_state();
		return rv;
	}

	_read_from_clipboard()
	{
		try {
			navigator.clipboard.readText().then((text) => {
				this._send_data(text);
			}).catch((err) => {
				console.error('Error reading from clipboard:', err);
			});
		} catch (err) {
			console.error('Error accessing clipboard:', err);
		}
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
			let start = this.selection_start;
			let end = this.selection_end;
			if (start > end) {
				start = this.selection_end;
				end = this.selection_start;
			}
			let xi = start % this.params.nColumns;
			let yi = Math.floor(start / this.params.nColumns);
			let l = "";
			let li = this._line_by_index(yi);
			for (let i = start; i <= end; ++i) {
				l += character_handler(li[xi]);
				++xi;
				if (xi >= this.params.nColumns) {
					t += lf(l);
					l = "";
					xi = 0;
					++yi;
					li = this._line_by_index(yi);
				}
			}
			t += lf(l);
		} catch {
			return;
		}
		try {
			blob_handler(t);
		} catch {
		}
	}

	/**
	 * This method adds a callback that the terminal will invoke each time
	 * a some kind of "copy on clipboard" operation is performed.
	 * The callback receives the content copied to the clipboard as a string.
	 * The callback is called with the second argument set to true if the
	 * content is copied as text, and false if it is copied as a blob.
	 * Multiple callbacks may be registered in this way.
	 * The callbacks can be removed by calling the {@link cancelOnCopy} method.
	 * @param {function} cb - The callback function to add.
	 */
	registerOnCopy(cb)
	{
		this.on_copy.push(cb);
	}
	/**
	 * This method removes the callback registered by {@link registerOnCopy}.
	 * @param {function} cb - The callback function to remove.
	 */
	cancelOnCopy(cb)
	{
		this.on_copy = this.on_copy.filter((cb) => cb != callback);
	}

	_write_to_clipboard_helper(t, as_text)
	{
		this.on_copy.forEach(callback => callback(t, as_text));
		
		try {
			if (as_text) {
				navigator.clipboard.writeText(t);
			}
			else {
				navigator.clipboard.write(t);
			}
		}
		catch {

			try {
				if (! this.clipboard_text_helper) {
					this.clipboard_text_helper = document.createElement("textarea");
					document.body.appendChild(this.clipboard_text_helper);
				}
				this.clipboard_text_helper.value = t;
				this.clipboard_text_helper.select();

				document.execCommand("copy");
			
			} catch (err) {
				console.error('Error writing to clipboard:', err);
			}
			finally {
				this.clipboard_text_helper.value = "";
			}
		}
	}

	
	_write_to_clipboard_as_text()
	{
		this._write_to_clipboard((ch) => {
				return ch.ch;
			}, 
			(t) => {
				this._write_to_clipboard_helper(t, true);
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
				this._write_to_clipboard_helper(cli, false);
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
  <meta charset="UTF-8">
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
				this._write_to_clipboard_helper(cli, false);	
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

	_clear_selection_timer()
	{
		if (this.selection_timer) {
			clearTimeout(this.selection_timer);
			this.selection_timer = null;
		}
	} 

	/**
	 * This method resizes the terminal to the given number of lines and columns.
	 * The selection and the viewpoint are cleared, and the cursor is adjusted
	 * accordingly. The alternate screen is simply cleared, as it is usually
	 * redrawn when the terminal is resized.
	 * @param {number} nLines - The number of lines for the terminal.
	 * @param {number} nColumns - The number of columns for the terminal.
	 */

	resize(nLines, nColumns)
	{
		if (nLines < 1 || nColumns < 1) {
			return;
		}
		if (nLines == this.params.nLines && nColumns == this.params.nColumns) {
			return;
		}

		// For simplicity, the resize method clears the selection
		// and resets the viewpoint.
		// This is not strictly necessary, but it is a good idea
		// to avoid confusion when the terminal is resized.
		if (this.enable_cursor) {
			this._unblink_cursor();
		}
		this._clear_selection();
		this.viewpoint = 0;

		this.history.resize(nLines, nColumns);
		
		this.screens = this.history.screens;
		this.screen = this.screens[this.alternate_screen ? 1 : 0];
		this.params.nLines = nLines;
		this.params.nColumns = nColumns;

		// Resize the elements (canvas, decorations...)

		this._resize_canvas();
		
		// Resize the scrollbar, if any.
		if (this.scrollbar) {
			this.scrollbar.resize();
			this.scrollbar.verticalScrollbar.setMinValue(this.params.nLines - this.history.length)
			this.scrollbar.verticalScrollbar.setMaxValue(0 /*this.params.nLines - 1*/);
			this.scrollbar.verticalScrollbar.setVisibleRangeSize(this.params.nLines);
			this.scrollbar.verticalScrollbar.setValue(0);
		}

		let yadd = Math.floor(this.posx / this.params.nColumns);
		let x = this.posx % this.params.nColumns;
		let y = this.posy + yadd;
		if (y >= this.params.nLines) {
			y = this.params.nLines - 1;
		}
		this.x_lastblink = x;
		this.y_lastblink = y;
		this._setpos(x, y);

		// Rebuild blink lists. Actually, only the one belonging to the primary screen,
		// since we count on the fact that the secondary screen is usually redrawn
		// when the terminal is resized.

		this.blink_lists[0] = [];
		this.blink_lists[1] = [];
		this.blink_list = this.blink_lists[this.alternate_screen ? 1 : 0];

		if ((! this.blinkIsBold) && (! this.alternate_screen)) {
			for (let y = 0; y < this.nLines; ++y) {
				let li = this._line_by_index(y);
				for (let x = 0; x < this.params.nColumns; ++x) {
					if (li[x].blink) {
						this._add_to_blink_list(x, y, this.blink_list);
					}
				}
			}
		}

		
		this._redraw();
		this._setsize();

		if (this.enable_cursor) {
			this._do_blink_cursor();
		}
	}

	/**
	 * This method clears the selection and returns the focus to the terminal.
	 */
	clearSelection()
	{
		this._clear_selection();
		this.canvas.focus();
	}

	/**
	 * This method selects the entire screen.
	 * It implements the "Select all" button function.
	 */
	selectAll()
	{
		this._clear_selection();
		this._start_selection(0,0);
		this._update_selection(this.params.nColumns-1, this.params.nLines -1);
		this._end_selection();
	}

	/**
	 * This method copies the selection to the clipboard.
	 * The selection is copied as plain text.
	 */
	clipboardCopyAsText()
	{
		this._clipboard_copy();
	}

	/**
	 * This method copies the selection to the clipboard.
	 * The selection is copied as text, possibly containing ANSI sequences
	 * to reproduce the character attributes of the on-screen text.
	 */
	clipboardCopyAsAnsiSequence()
	{
		this._write_to_clipboard_as_ansi();
		this._clear_selection();
		this.canvas.focus();
	}

	/**
	 * This method copies the selection to the clipboard.
	 * The selection is copied as HTML, 
	 * reproducing the characters of the on-screen text and their attributes.
	 */
	clipboardCopyAsHtml()
	{
		this._write_to_clipboard_as_html(true);
		this._clear_selection();
		this.canvas.focus();						
	}
	/**
	 * This method copies the selection to the clipboard.
	 * The selection is copied as Rich Text.
	 *
	 * NOTE: this method is still under development, and its behavior may change
	 * in future releases.
	 *
	 * The text is actually stored as HTML, but trailing spaces in lines are discarded.
	 * Since the goal of this method is to capture data suited to be pasted into
	 * word processors, some adjustments may be useful (e.g., color correction
	 * to deal with typical white backgrounds).
	 */
	clipboardCopyAsRichText()
	{
		this._write_to_clipboard_as_html(false);
		this._clear_selection();
		this.canvas.focus();						
	}
	/**
	 * This method implements the clipboard "paste" function.
	 */
	clipboardPaste()
	{
		this._read_from_clipboard();
		this.canvas.focus();
	}

	/*
	 * This method toggles the freeze state of the terminal.
	 */
	toggleFreezeState()
	{
		this._toggle_freeze();
		this.canvas.focus();
	}

	_start_selection(x, y)
	{
		this._clear_selection_timer();
		this.selection_start = -1;
		this.selection_end = -1;
		this.selection_last = -1;
		this.selection_on = true;
		if (! this.selection_active) {
			this._inc_freeze();
		}
		this.selection_active = true;
		this._update_selection(x, y);
		this._update_freeze_state();
	}

	_end_selection()
	{
		this.selection_on = false;
		this.selection_end = this.selection_last;
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
				let x = Math.floor(e.offsetX / this.charwidth);
				let y = Math.floor(e.offsetY / this.charheight);
				this._start_selection(x, y);
			}, 250);

		}
		//console.log(e);
	}

	_on_mouse_up(e)
	{
		this._clear_selection_timer();
		if (e.button != 0) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		this._end_selection();
	}

	_on_mouse_click(e)
	{
		e.preventDefault();
		e.stopPropagation();
		//console.log(e);
	}

}


/**
 * This is the base class from which AnsiTerm's communication
 * drivers inherit the interface.
 *
 * Internal drivers {@link AnsiTermHttpDriver} and {@link AnsiTermWebSocketDriver}
 * are derivations of this class.
 *
 * The programmer can write their own driver to connect the terminal to the
 * backend that implements the specific application.
 *
 * AnsiTerm uses public methods of this interface to communicate with the
 * backend.
 *
 * Programmers who need to write a custom driver are not required to
 * implement all the methods provided by this interface. In particular,
 * it is unlikely that it is ever necessary to rewrite the callback registration
 * methods, since the base class already implements a sufficiently general mechanism.
 *
 * A typical driver will redefine these methods:
 *
 * - {@link _tx}
 * - {@link _start}
 * - {@link _close}
 * - {@link _set_size}
 */

export class AnsiTermDriver
{
	/**
	 * This is the base constructor. It is strongly recommended that
	 * the constructor of derived classes invokes the base constructor
	 * as its first instruction ("super(params)").
	 * @param {object} params parameters, not used by the base, but stored.
	 */
	constructor(params)
	{
		this.params = params;
		this.on_send_done = [];
		this.on_data_received = null;
		this.on_connection_change = null;
		this.connection_state = true;
		this.started = false;
		this.columns = 0;
		this.rows = 0;
	}

	/**
	 * This method is used by specialized drivers (extensions) to notify the client
	 * (i.e., the terminal) that there are new characters to process. 
	 * If you are thinking of overriding it, think again.
	 * @param {string} text - the new sequence of characters
	 */
	_new_data(text)
	{
		if (this.on_data_received) {
			this.on_data_received(text);
		}
	}

	/**
	 * Used by AnsiTerm to register a notification callback
	 * to be notified of new incoming data.
	 * The callback is invoked when an extension calls the {@link _new_data} base method.
	 *   
	 * It is unlikely that a custom driver will ever need to override this
	 * method.
	 * @param {function} on_data_received - The callback function
	 */
	registerOnDataReceived(on_data_received)
	{
		this.on_data_received = on_data_received;
	}
	/**
	 * Used by AnsiTerm to register a notification callback
	 * to be notified of connection state changes.
	 * The callback is invoked when an extension calls the {@link _set_connection_state} base method.
	 *   
	 * It is unlikely that a custom driver will ever need to override this
	 * method.
	 * @param {function} on_connection_change - The callback function
	 */
	registerOnConnectionChange(on_connection_change)
	{
		this.on_connection_change = on_connection_change;
	}

	/**
	 * Used by AnsiTerm to read the current connection state.
	 * Extensions can set the connection state by invoking the {@link _set_connection_state} base method.
	 *   
	 * It is unlikely that a custom driver will ever need to override this
	 * method.
	 * @returns {boolean} The current connection state.
	 */

	getConnectionState()
	{
		return this.connection_state;
	}

	/**
	 * This method closes the communication and releases the resources.
	 * Never override it, override {@link _close} instread.
	 */

	close()
	{
		this.started = false;
		this._close();
	}


	/**
	 * This is the internal method that closes the communication and releases the resources.
	 * Extensions should override it to implement the protocol-specific
	 * closing.
	 */

	_close()
	{
	}

	/**
	 * This method opens the communication.
	 * Never override it, override {@link _start} instread.
	 */
	start()
	{
		this.started = true;
		if (this.on_connection_change) {
			this.on_connection_change(this.connection_state);
		}
		this._start();
	}

	/**
	 * This is the internal method that opens the communication.
	 * Extensions may override it to implement the protocol-specific
	 * connection.
	 */
	_start()
	{
	}


	/**
	 * This method may be used by extensions to put the base object
	 * in a consistent state after an error. Do not override it.
	 */
	_stop()
	{
		this.started = false;
		this._set_connection_state(false);
	}


	/**
	 * This method may be used by the terminal to send data (e.g.,
	 * keyboard events).
	 * Never override it, override {@link _tx} instread.
	 */
	send(text)
	{
		this._tx(text);
	}

	/**
	 * This method may be used by extensions to notify a change
	 * in the connection state.
	 * Never override it.
	 */
	_set_connection_state(st)
	{
		if (this.connection_state != st) {
			this.connection_state = st;
			if (this.on_connection_change) {
				this.on_connection_change(st);
			}
		}
	}

	/**
	 * This method must be overridden by the extension to implement
	 * the protocol-specific transmitter.
	 * In its base version (defined only for debugging purposes),
	 * it sends characters back to the terminal (after some manipulation).
	 * @param {string} text - The sequence of chracters to send
	 */
	_tx(text)
	{
		// Echo, for testing
		text = text.replace("\r", "\r\n");
		text = text.replace("\x7f", "\x08");
		text = text.replace("\x08", "\x08 \x08");
		this._new_data(text);
	}

	/**
	 * This method is used by the terminal to set the terminal size.
	 * Never override it, override {@link _set_size} instread.
	 * @param {*} nlines Number of lines
	 * @param {*} ncolumns Number of columns
	 */
	setSize(nlines, ncolumns)
	{
		this._set_size(nlines, ncolumns);
	}


	/**
	 * This method implements the protocol-specific part of terminal size changle.
	 * Extensions can override it to implement the corresponding protocol-specific
	 * operation.
	 * @param {*} nlines Number of lines
	 * @param {*} ncolumns Number of columns
	 */
	_set_size(nlines, ncolumns)
	{
	}
}

/**
 * This class implements the HTTP protocol driver for AnsiTerm.
 * It is activated by specifying "html" in "channelType" AnsiTerm's constructor
 * parameter.
 *
 * NOTE: not exported by the module.
 */

export class AnsiTermHttpDriver extends AnsiTermDriver
{
	constructor(params)
	{
		super(params);

		this.pending_data_to_send = "";
		this.pending_data_in_transaction = "";
		this.immedate_refresh_request_count = 0;
		this.timer = null;

	// Fix some defaults that can't be set in the defaults table.
	
		this.url = params.url || window.location.href;

		this._set_connection_state(false);
		//this._start_cycle(this.params.immediateRefresh);
		
		this.session_hint = this.params.httpSessionHint;
		if (this.session_hint == "") {
			this.session_hint = Date.now().toString(16);
			this.session_hint += '0000000000000000'.substr(this.session_hint.length);
		}
	}
	
	_start()
	{
		this._start_cycle(this.params.immediateRefresh);
	}

	_close()
	{
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}

	_start_cycle(timeout)
	{
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		this.timer = setTimeout( () => {
			this._send_request(this.params.httpSource);
		}, timeout);
	}

	_schedule_update(timeout)
	{
		if (this.immedate_refresh_request_count > 0) {
			--this.immedate_refresh_request_count;
			if (this.immedate_refresh_request_count > 0) {
				timeout = this.params.immediateRefresh;
			}
		}
		this._start_cycle(timeout);
	}

	_add_session_hint(url)
	{
		if (this.params.httpSessionHintParam != "") {
			if (url.match(/\?[^\/]*/)) {
				url += '&';
			}
			else {
				url += '?';
			}
			url += this.params.httpSessionHintParam + '=' + this.session_hint;
		}
		return url;
	}

	_send_request(url)
	{
		url = this._add_session_hint(url);

		let xhr = new XMLHttpRequest();
		
		xhr.withCredentials = true;

		xhr.onreadystatechange = () => {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if (xhr.status >= 200 && xhr.status < 400) {
					let t = xhr.responseText;
					let data = t;
					try {
						data = JSON.parse(t);
						t = data["text"];
					}
					catch {
					}

					this._set_connection_state(true);

					if (t != "") {

						//console.log(data);

						this._new_data(t);
					}

					this._schedule_update(this.params.fastRefresh);
				}
				else {
					console.log(xhr.status);
					this._set_connection_state(false);
					this._schedule_update(this.params.slowRefresh);
				}
			}
		}
				
		try {
			xhr.open('GET', url, true);
			xhr.send();
		} catch {
			this._set_connection_state(false);
		}
	}

	_set_size(nlines, ncolumns)
	{
		let q = this.params.httpSize.replace("?lines?", nlines).replace("?columns?", ncolumns);
		this._send_request(q);
	}

	_tx_core(text, success, error)
	{
		let xhr = new XMLHttpRequest();
		xhr.onreadystatechange = () => {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				clearTimeout(this.timer);
				if (xhr.status >= 200 && xhr.status < 400) {
					//console.log(xhr.responseText);
					success();
				}
				else {
					console.log(xhr.status);
					error();
				}
			}
		}
		try {
			let url = this._add_session_hint(this.params.httpDest);
			xhr.open("POST", url, true);
			xhr.setRequestHeader('Content-Type', 'text/plain');
			xhr.send(text)
		} catch {
			this._set_connection_state(false);
		}
	}

	_tx(text)
	{
		/*
		  Here we are trying to mitigate the outgoing traffic so the receiver has a
		  chance to update the screen. For example, if a key is kept pressed,
		  autorepeat would saturate the transmitter, so delaying updates until the burst
		  of events ends. The visible effect would be the miss of character echoes until
		  the key is down, and the sudden appearance of all the accumulated characters
		  when the key is released.
		  No new POSTs are started until the current one is
		  completed; meanwhile, characters are stored in the "pending_data_to_send"
		  variable. Also, the transmitter is kept locked for some tenths of milliseconds
		  still after the completion of POST, and an update is scheduled.
		 */
		this.pending_data_to_send += text;
		if (this.pending_data_in_transaction == "") {
			this.pending_data_in_transaction = this.pending_data_to_send;
			this.pending_data_to_send = "";
			if (this.pending_data_in_transaction != "") {
				this._tx_core(this.pending_data_in_transaction,

				// On success	
					() => {

						if (this.immedate_refresh_request_count == 0) {
							this.immedate_refresh_request_count = 1;
							this._schedule_update(this.params.immediateRefresh);
						}
						else {
							this.immedate_refresh_request_count = 2;
						}
						this._set_connection_state(true);

						setTimeout(() => {
							this.pending_data_in_transaction = "";
							this._tx("")
						}, this.params.immediateRefresh);
					},

				// On error
					() => {
						this._set_connection_state(false);
						this._schedule_update(this.params.slowRefresh);
					}
				);
			}
		}
	}
}


/**
 * This class implements the WebSocket protocol driver for AnsiTerm.
 * It is activated by specifying "websocket" in "channelType" AnsiTerm's constructor
 * parameter. 
 *
 * NOTE: not exported by the module.
 */

export class AnsiTermWebSocketDriver extends AnsiTermDriver
{
	constructor(params)
	{
		super(params);
		this.params = params;
		this.pending_objs = [];
		this._set_connection_state(false);
	}

	_start()
	{
		try {
			let ep = this.params.wsEndpoint;
			if (ep.substring(0,5) != "ws://" && ep.substring(0,6) != "wss://") {
				ep = "ws://" + ep;
			}
			this.socket = new WebSocket(ep);
		} catch {
			this._stop();
			return;
		}

		this.socket.addEventListener('open', (event) => {
			//console.log('WS Connection open');
			this._set_connection_state(true);
			while (this.pending_objs.length > 0) {
				this._send_obj(this.pending_objs.shift());
			}
		});

		this.socket.addEventListener('message', (event) => {

//			console.log('WS Messagge from server:', event.data);
			let t = event.data;
			let data = t;

			try {
				data = JSON.parse(t);
			}
			catch {
			}

			if (this.params.wsDataTag in data) {
				t = data[this.params.wsDataTag];
			}
			else {
				//t = "";
			}

			if (t != "") {
				//console.log(data);

				this._new_data(t);
			}
		});

		this.socket.addEventListener('close', (event) => {
			this._set_connection_state(false);
			this._close();
		});

		this.socket.addEventListener('error', (event) => {
			console.log('Error in WebSocket:', event);
			this._set_connection_state(false);
			this._close();
		});
	}

	_close()
	{
		console.log('WS Connection closed');
		try {
			socket.close();
		} catch {}
		this.socket = null;
	}

	_send_obj(obj)
	{
		if (this.connection_state) {
			let s = JSON.stringify(obj);
	    	this.socket.send(s);
		}
		else {
			this.pending_objs.push(obj);
		}
	}

	_send_obj_data(data, tag)
	{
		let obj = {};
		obj[tag] = data;
		this._send_obj(obj);
	}

	_tx(text)
	{
		this._send_obj_data(text, this.params.wsDataTag);
	}

	_set_size(nlines, ncolumns)
	{
		let q = this.params.wsSizeData.replace("?lines?", nlines).replace("?columns?", ncolumns);
		this._send_obj_data(q, this.params.wsSizeTag);
	}

}

window.AnsiTerm = AnsiTerm;
window.AnsiTermDecoration = AnsiTermDecoration;
window.AnsiTermDriver = AnsiTermDriver;
window.AnsiTermHttpDriver = AnsiTermHttpDriver;
window.AnsiTermWebSocketDriver = AnsiTermWebSocketDriver;

