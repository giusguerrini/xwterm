// DEFAULTS

function isIE11()
{
    return !!window.MSInputMethodContext && !!document.documentMode;
}

const COMMON_GENERICSCROLLBAR_DEFAULTS = {
	size: 30, // Pixels
	buttonSize: 20, // Pixels
	separatorSize: 3, // Pixels

	// Colors and appearance:
	foreground:  "rgb(192,192,192)",
	background:  "rgb(0,0,0)",
};

const GENERICSCROLLBAR_DEFAULTS = {
	...COMMON_GENERICSCROLLBAR_DEFAULTS,
	vertical: true,
};

const GENERICSCROLLBARADDER_DEFAULTS = {
	barConfiguration: COMMON_GENERICSCROLLBAR_DEFAULTS,
	vertical: "on", // "on", "off", "dynamic"
	horizontal: "off", // "on", "off", "dynamic"
};

class GenericScrollBar {

	_layout()
	{
		this.div = null;
		this.div_int = null;
		this.button_minus = null;
		this.button_plus = null;

		let sz = Number(this.size);
		let bsz = Number(this.button_size);
		let ssz = Number(this.separator_size);
		let style = window.getComputedStyle(this.controlled_element);

		if (this.vertical) {
			this.width = sz;
			this.height = this.controlled_element.clientHeight;
		}
		else {
			this.height = sz;
			this.width = this.controlled_element.clientWidtg;
		}

		this.div = document.createElement("div");
		this.div.classList.add("generic-scrollbar");
		this.div.style.border = "none";
		this.div.style.margin = "0";
		this.div.style.width = this.width + "px";
		this.div.style.height = this.height + "px";

		if (isIE11()) {
			this.div.style.display = "-ms-grid";
		}
		else {
			this.div.style.display = "grid";
		}

		this.button_minus = document.createElement("button");
		this.button_minus.innerText = "-";
		this.button_minus.addEventListener("click", this._onButtonMinusClick.bind(this));
		this.div.appendChild(this.button_minus);

		this.div_int = document.createElement("div");
		this.div_int.style.position = "relative";
		this.button_int = document.createElement("button");
		this.button_int.innerText = " ";
		this.button_int.style.position = "absolute";
		this.button_int.style.top = "0";
		this.button_int.style.left = "0";
		this.div_int.appendChild(this.button_int);
		this.div_int.addEventListener("click", this._onDivIntClick.bind(this));
		this.button_int.addEventListener("mousedown", this._onButtonIntMouseDown.bind(this));

		this.button_plus = document.createElement("button");
		this.button_plus.innerText = "+";
		this.button_plus.addEventListener("click", this._onButtonPlusClick.bind(this));

		if (this.vertical) {
			if (isIE11()) {
				this.div.style.setProperty("-ms-grid-columns", sz + "px");
				this.div.style.setProperty("-ms-grid-rowas", bsz + "px 1fr " + bsz + "px");
				this.button_minus.style.setProperty("-ms-grid-row", "1");
				this.button_minus.style.setProperty("-ms-grid-column", "1");
				this.div_int.style.setProperty("-ms-grid-row", "2");
				this.div_int.style.setProperty("-ms-grid-column", "1");
				this.button_plus.style.setProperty("-ms-grid-row", "3");
				this.button_plus.style.setProperty("-ms-grid-column", "1");
			}
			else {
				this.div.style.gridTemplateColumns = "auto";
				this.div.style.gridTemplateRows = "auto auto auto";
			}
			this.div.style.borderLeftWidth = ssz + "px";
			this.div.style.borderLeftStyle = "solid";
			this.button_minus.style.width = sz + "px";
			this.button_minus.style.height = bsz + "px";
			this.button_int.style.width = "100%";
			this.button_int.style.height = "10%";	
			this.div_int.style.width = sz + "px";
			this.div_int.style.height = (this.controlled_element.clientHeight - 2*bsz) + "px";
			this.button_plus.style.width = sz + "px";
			this.button_plus.style.height = bsz + "px";
		} else {
			if (isIE11()) {
				this.div.style.setProperty("-ms-grid-columns", bsz + "px 1fr " + bsz + "px");
				this.div.style.setProperty("-ms-grid-rows", sz + "px");
				this.button_minus.style.setProperty("-ms-grid-row", "1");
				this.button_minus.style.setProperty("-ms-grid-column", "1");
				this.div_int.style.setProperty("-ms-grid-row", "1");
				this.div_int.style.setProperty("-ms-grid-column", "2");
				this.button_plus.style.setProperty("-ms-grid-row", "1");
				this.button_plus.style.setProperty("-ms-grid-column", "3");
			}
			else {
				this.div.style.gridTemplateColumns = "auto auto auto";
				this.div.style.gridTemplateRows = "auto";
			}
			this.div.style.borderTopWidth = ssz + "px";
			this.div.style.borderTopStyle = "solid";
			this.button_minus.style.width = bsz + "px";
			this.button_minus.style.height = sz + "px";
			this.button_int.style.width = "10%";
			this.button_int.style.height = "100%";
			this.div_int.style.width = (this.controlled_element.clientWidth - 2*bsz) + "px";
			this.div_int.style.height = sz + "px";
			this.button_plus.style.width = bsz + "px";
			this.button_plus.style.height = sz + "px";
		}

		this.div.appendChild(this.button_minus);
		this.div.appendChild(this.div_int);
		this.div.appendChild(this.button_plus);

		this.mouse_down = false;
		this.mouse_down_pos = 0;
	}

	_onDivIntClick(event) {
		console.log("DivInt mouse down", event);
	}

	_onButtonIntMouseDown(event) {
		console.log("ButtonInt mouse down", event);
		this.mouse_down = true;
		if (this.vertical) {
			this.mouse_down_pos = event.clientY;
		}
		else {
			this.mouse_down_pos = event.clientX;
		}
		document.addEventListener("mouseup", this._onDocumentMouseUp.bind(this));
		document.addEventListener("mousemove", this._onDocumentMouseMove.bind(this));
	}

	_onDocumentMouseUp(event) {
		console.log("ButtonInt mouse up", event);
		this.mouse_down = false;
		document.removeEventListener("mouseup", this._onDocumentMouseUp.bind(this));
		document.removeEventListener("mousemove", this._onDocumentMouseMove.bind(this));
	}

	_onDocumentMouseMove(event) {
		//console.log("ButtonInt mouse move", event);
		if (this.mouse_down) {
			if (this.vertical) {
				let yd = this.button_int.getBoundingClientRect().top - this.div_int.getBoundingClientRect().top - this.mouse_down_pos;
				let y = yd + event.clientY;
				if (y < 0) {
					y = 0;
				}
				else if (y > this.div_int.clientHeight - this.button_int.clientHeight) {
					y = this.div_int.clientHeight - this.button_int.clientHeight;
				}
				this.button_int.style.top = y + "px";
				this.mouse_down_pos = y - yd;
			}
			else {
				let xd = this.button_int.getBoundingClientRect().left - this.div_int.getBoundingClientRect().left - this.mouse_down_pos;
				let x = xd + event.clientX;
				if (x < 0) {
					x = 0;
				}
				else if (x > this.div_int.clientWidth - this.button_int.clientWidth) {
					x = this.div_int.clientWidth - this.button_int.clientWidth;
				}
				this.button_int.style.left = x + "px";
				this.mouse_down_pos = x - xd;
			}
		}
	}

	_onButtonMinusClick() {
		// Gestore per il click del bottone minus
		console.log("Button minus clicked");
	}

	_onButtonPlusClick() {
		// Gestore per il click del bottone plus
		console.log("Button plus clicked");
	}

	// Table to convert public configuration keys to internal members.
	// (Yes, I am too lazy to rename all the public keys to match the internal ones).
	static config_to_members = {
		background: "background",
		foreground: "foreground",
		size: "size",
		buttonSize: "button_size",
		separatorSize: "separator_size",
		vertical: "vertical",
	};

	constructor(controlledElement, params)
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
		this.configuration = { ...GENERICSCROLLBAR_DEFAULTS, ...params };
		this.controlled_element = controlledElement;

		// Convert public configuration keys to internal members.
		for (let key in this.configuration) {
			if (GenericScrollBar.config_to_members[key]) {
				this[GenericScrollBar.config_to_members[key]] = this.configuration[key];
			}
		}

		this._layout();
	}
};

class GenericScrollBarAdder {

	_layout()
	{
		this.div = null;
		this.controlled_element = document.getElementById(this.controlled_element_id);

		this.div = document.createElement("div");
		this.div.classList.add("generic-scrollbar");
		if (isIE11()) {
			let bsz = this.bar_configuration.size + this.bar_configuration.separatorSize; 
			this.div.style.width = this.controlled_element.clientWidth
				+ ((this.vertical == "on") ? bsz : 0)
			    + "px";
			this.div.style.height = this.controlled_element.clientHeight
				+ ((this.horizontal == "on") ? bsz : 0)
			    + "px";
			this.div.style.display = "-ms-grid";
		}
		else {
			this.div.style.width = "max-content";
			this.div.style.display = "grid";
		}
		let style = window.getComputedStyle(this.controlled_element);
		this.div.style.border = style.border;
		this.div.style.margin = style.margin;
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
		this.controlled_element.style.border = "none";
		this.controlled_element.style.margin = "0";
		if (this.vertical != "on") {
			this.div.style.gridTemplateColumns = "auto";
		}
		else {
			this.div.style.gridTemplateColumns = "auto auto";
		}
		this.width = this.controlled_element.clientWidth;
		this.height = this.controlled_element.clientHeight;

		if (this.controlled_element) {
			this.controlled_element.parentNode.replaceChild(this.div, this.controlled_element);
			this.div.appendChild(this.controlled_element);
		}
		if (isIE11()) {
			this.controlled_element.style.setProperty("-ms-grid-column", "1");
			this.controlled_element.style.setProperty("-ms-grid-row", "1");
		}
		if (this.vertical == "on") {
			this.vertical_scrollbar = new GenericScrollBar(this.controlled_element, { ...this.bar_configuration, vertical: true });
			this.div.appendChild(this.vertical_scrollbar.div);
			if (isIE11()) {
				this.vertical_scrollbar.div.style.setProperty("-ms-grid-row", "1");
				this.vertical_scrollbar.div.style.setProperty("-ms-grid-column", "2");
			}
		}
		if (this.horizontal == "on") {
			this.horizontal_scrollbar = new GenericScrollBar(this.controlled_element,  { ...this.bar_configuration, vertical: false });
			this.div.appendChild(this.horizontal_scrollbar.div);
			if (isIE11()) {
				this.horizontal_scrollbar.div.style.setProperty("-ms-grid-row", "2");
				this.horizontal_scrollbar.div.style.setProperty("-ms-grid-column", "1");
			}
		}
	}

	_onButtonMinusClick() {
		// Gestore per il click del bottone minus
		console.log("Button minus clicked");
	}

	_onButtonPlusClick() {
		// Gestore per il click del bottone plus
		console.log("Button plus clicked");
	}

	// Table to convert public configuration keys to internal members.
	// (Yes, I am too lazy to rename all the public keys to match the internal ones).
	static config_to_members = {
		barConfiguration: "bar_configuration",
		vertical: "vertical",
		horizontal: "horizontal",	
	};

	constructor(controlledElementId, params)
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
		this.configuration = { ...GENERICSCROLLBARADDER_DEFAULTS, ...params };
		this.controlled_element_id = controlledElementId;

		// Convert public configuration keys to internal members.
		for (let key in this.configuration) {
			if (GenericScrollBarAdder.config_to_members[key]) {
				this[GenericScrollBarAdder.config_to_members[key]] = this.configuration[key];
			}
		}
		
		this.bar_configuration.size = Number(this.bar_configuration.size);
		this.bar_configuration.buttonSize = Number(this.bar_configuration.buttonSize);
		this.bar_configuration.separatorSize = Number(this.bar_configuration.separatorSize);
		if (this.vertical == true) {
			this.vertical = "on";
		}
		if (this.horizontal == true) {
			this.horizontal = "on";
		}
		this.vertical = this.vertical.toLowerCase();
		this.horizontal = this.horizontal.toLowerCase();

		this._layout();
	}
};

window.GenericScrollBarAdder = GenericScrollBarAdder;

