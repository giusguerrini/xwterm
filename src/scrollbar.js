// DEFAULTS

const COMMON_GENERICSCROLLBAR_DEFAULTS = {
	size: "30", // Pixels
	buttonSize: "20", // Pixels

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
	vertical: "on", // "on", "off", "ondemand"
	horizontal: "off", // "on", "off", "ondemand"
};

export class GenericScrollBar {

	_layout()
	{
		this.div = null;
		this.canvas = null;
		this.button_minus = null;
		this.button_plus = null;

		this.div = document.createElement("div");
		this.div.style.width = "max-content";
		this.div.classList.add("generic-scrollbar");
		this.div.style.display = "grid";
		let style = window.getComputedStyle(this.controlled_element);
		this.div.style.border = "none";
		this.div.style.margin = "0";
		if (this.vertical) {
			this.div.style.gridTemplateColumns = "auto";
			this.div.style.gridTemplateRows = "auto auto auto";
			this.width = this.size;
			this.height = this.controlled_element.clientHeight;
		}
		else {
			this.div.style.gridTemplateColumns = "auto auto auto";
			this.div.style.gridTemplateRows = "auto";
			this.width = this.controlled_element.clientWidth;
			this.height = this.size
		}

		this.button_minus = document.createElement("button");
		this.button_minus.innerText = "-";
		this.button_minus.addEventListener("click", () => {
			this._onButtonMinusClick();
		});
		this.div.appendChild(this.button_minus);

		this.canvas = document.createElement("canvas");
		this.canvas.addEventListener("mousedown", this._onCanvasMouseDown.bind(this));
		this.canvas.addEventListener("mouseup", this._onCanvasMouseUp.bind(this));
		this.canvas.addEventListener("mousemove", this._onCanvasMouseMove.bind(this));
		this.div.appendChild(this.canvas);

		this.button_plus = document.createElement("button");
		this.button_plus.innerText = "+";
		this.button_plus.addEventListener("click", () => {
			this._onButtonPlusClick();
		});
		this.div.appendChild(this.button_plus);

		if (this.vertical) {
			this.button_minus.style.width = this.size + "px";
			this.button_minus.style.height = this.button_size + "px";
			this.canvas.style.width = this.size + "px";
			this.canvas.style.height = (this.controlled_element.clientHeight - 2*this.button_size) + "px";
			this.button_plus.style.width = this.size + "px";
			this.button_plus.style.height = this.button_size + "px";
		} else {
			this.button_minus.style.width = this.button_size + "px";
			this.button_minus.style.height = this.size + "px";
			this.canvas.style.width = (this.controlled_element.clientWidth - 2*this.button_size) + "px";
			this.canvas.style.height = this.size + "px";
			this.button_plus.style.width = this.button_size + "px";
			this.button_plus.style.height = this.size + "px";
		}
	}

	_onCanvasMouseDown(event) {
		console.log("Canvas mouse down", event);
	}

	_onCanvasMouseUp(event) {
		console.log("Canvas mouse up", event);
	}

	_onCanvasMouseMove(event) {
		console.log("Canvas mouse move", event);
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

export class GenericScrollBarAdder {

	_layout()
	{
		this.div = null;
		this.controlled_element = document.getElementById(this.controlled_element_id);

		this.div = document.createElement("div");
		this.div.style.width = "max-content";
		this.div.classList.add("generic-scrollbar");
		this.div.style.display = "grid";
		let style = window.getComputedStyle(this.controlled_element);
		this.div.style.border = style.border;
		this.div.style.margin = style.margin;
		this.controlled_element.style.border = "none";
		this.controlled_element.style.margin = "0";
		this.div.style.gridTemplateColumns = "auto auto";
		this.width = this.controlled_element.clientWidth;
		this.height = this.controlled_element.clientHeight;

		if (this.controlled_element) {
			this.controlled_element.parentNode.replaceChild(this.div, this.controlled_element);
			this.div.appendChild(this.controlled_element);
		}
		this.horizontal_scrollbar = new GenericScrollBar(this.controlled_element, { ...this.bar_configuration, vertical: true });
		this.div.appendChild(this.horizontal_scrollbar.div);
		this.vertical_scrollbar = new GenericScrollBar(this.controlled_element,  { ...this.bar_configuration, vertical: false });
		this.div.appendChild(this.vertical_scrollbar.div);
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

		this._layout();
	}
};


