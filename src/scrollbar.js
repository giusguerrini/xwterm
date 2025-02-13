// DEFAULTS

function isIE11()
{
    return !!window.MSInputMethodContext && !!document.documentMode;
}

const COMMON_GENERICSCROLLBAR_DEFAULTS = {
	size: 30, // Pixels
	buttonSize: 20, // Pixels
	separatorSize: 3, // Pixels
	buttonBorderSize: 2, // Pixels

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
	vertical: true, // TODO: "dynamic"
	horizontal: false, // TODO: "dynamic"
};

class GenericScrollBar {
 			
	vertical_mutable_properties = {
		motion_coord: "clientY",
		min_coord_side: "top",
		motion_limit: "clientHeight",
		motion_size: "height",
		fixed_size: "width",
		ms_grid_single: "-ms-grid-columns",
		ms_grid_multi: "-ms-grid-rows",
		ms_grid_single_pos: "-ms-grid-column",
		ms_grid_multi_pos: "-ms-grid-row",
		grid_single: "gridTemplateColumns",
		grid_multi: "gridTemplateRows",
		separator_width: "borderLeftWidth",
		separator_style: "borderLeftStyle",
	};

	horizontal_mutable_properties =  {
		motion_coord: "clientX",
		min_coord_side: "left",
		motion_limit: "clientWidth",
		motion_size: "width",
		fixed_size: "height",
		ms_grid_single: "-ms-grid-rows",
		ms_grid_multi: "-ms-grid-columns",
		ms_grid_single_pos: "-ms-grid-row",
		ms_grid_multi_pos: "-ms-grid-column",
		grid_single: "gridTemplateRows",
		grid_multi: "gridTemplateColumns",
		separator_width: "borderTopWidth",
		separator_style: "borderTopStyle",
	};

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

		this[this.mutable_properties.fixed_size] = sz;
		this[this.mutable_properties.motion_size] = this.controlled_element[this.mutable_properties.motion_limit];

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
		this.button_minus.style.margin = "0px";
		this.button_minus.style.borderWidth = this.button_border_size + "px";
		this.button_minus.style.borderStyle = "solid";
		this.button_minus.addEventListener("click", this._onButtonMinusClick.bind(this));

		this.div_int = document.createElement("div");
		this.div_int.style.position = "relative";
		this.button_int = document.createElement("button");
		this.button_int.style.position = "absolute";
		this.button_int.style.top = "0";
		this.button_int.style.left = "0";
		this.button_int.style.margin = "0px";
		this.button_int.style.borderWidth = this.button_border_size + "px";
		this.button_int.style.borderStyle = "solid";
		this.div_int.appendChild(this.button_int);
		this.div_int.addEventListener("click", this._onDivIntClick.bind(this));
		this.button_int.addEventListener("mousedown", this._onButtonIntMouseDown.bind(this));

		this.button_plus = document.createElement("button");
		this.button_plus.innerText = "+";
		this.button_plus.style.margin = "0px";
		this.button_plus.style.borderWidth = this.button_border_size + "px";
		this.button_plus.style.borderStyle = "solid";
		this.button_plus.addEventListener("click", this._onButtonPlusClick.bind(this));

		const m = this.mutable_properties;

		if (isIE11()) {
			this.div.style.setProperty(m.ms_grid_single, sz + "px");
			this.div.style.setProperty(m.ms_grid_multi, bsz + "px 1fr " + bsz + "px");
			this.button_minus.style.setProperty(m.ms_grid_multi_pos, "1");
			this.button_minus.style.setProperty(m.ms_grid_single_pos, "1");
			this.div_int.style.setProperty(m.ms_grid_multi_pos, "2");
			this.div_int.style.setProperty(m.ms_grid_single_pos, "1");
			this.button_plus.style.setProperty(m.ms_grid_multi_pos, "3");
			this.button_plus.style.setProperty(m.ms_grid_single_pos, "1");
		}
		else {
			this.div.style[m.grid_single] = "auto";
			this.div.style[m.grid_multi] = "auto auto auto";
		}
		this.div.style[m.separator_width] = ssz + "px";
		this.div.style[m.separator_style] = "solid";
		this.button_minus.style[m.fixed_size] = sz + "px";
		this.button_minus.style[m.motion_size] = bsz + "px";
		this.button_int.style[m.fixed_size] = "100%";
		this.button_int.style[m.motion_size] = "10%";	
		this.div_int.style[m.fixed_size] = sz + "px";
		this.div_int.style[m.motion_size] = (this.controlled_element[m.motion_limit] - 2*bsz) + "px";
		this.button_plus.style[m.fixed_size] = sz + "px";
		this.button_plus.style[m.motion_size] = bsz + "px";

		this.div.appendChild(this.button_minus);
		this.div.appendChild(this.div_int);
		this.div.appendChild(this.button_plus);

		this.mouse_down = false;
		this.mouse_down_pos = 0;
	}


    _newValue(v)
	{
		if (v != this.curr_value) {
			//console.log("Scroll value = " + v);
        	this.on_new_position.forEach(callback => callback(v));
			this.curr_value = v;
		}
	}
	
	_onDivIntClick(event)
	{
	}

	_onButtonIntMouseDown(event)
	{
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

	_onDocumentMouseUp(event) 
	{
		this.mouse_down = false;
		document.removeEventListener("mouseup", this._onDocumentMouseUp.bind(this));
		document.removeEventListener("mousemove", this._onDocumentMouseMove.bind(this));
	}

	_onDocumentMouseMove(event)
	{
		if (this.mouse_down) {
			const m = this.mutable_properties;

			let d = (this.button_int.getBoundingClientRect())[m.min_coord_side]
				  - (this.div_int.getBoundingClientRect())[m.min_coord_side]
				  - this.mouse_down_pos;
			let c = d + event[m.motion_coord];
			let limit = this.div_int[m.motion_limit] - this.button_int[m.motion_limit] - 2*this.button_border_size;
			if (c < 0) {
				c = 0;
			}
			else if (c > limit) {
				c = limit;
			}
			this.button_int.style[m.min_coord_side] = c + "px";
			this.mouse_down_pos = c - d;
			let val = (limit <= 0) ? 0 : (c / limit);
			this._newValue(this.min_value + val * (this.max_value - this.min_value));
		}
	}

	_onButtonMinusClick()
	{
	}

	_onButtonPlusClick()
	{
	}

	// Table to convert public configuration keys to internal members.
	// (Yes, I am too lazy to rename all the public keys to match the internal ones).
	static config_to_members = {
		background: "background",
		foreground: "foreground",
		size: "size",
		buttonSize: "button_size",
		separatorSize: "separator_size",
		buttonBorderSize: "button_border_size",
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

		this.mutable_properties = this.vertical
	                            ? this.vertical_mutable_properties
		                        : this.horizontal_mutable_properties;
		this.on_new_position = [];
		this.min_value = 0;
		this.curr_value = 0;
		this.max_value = 0;

		this._layout();
	}

	_updatePos()
	{

	}

	setMinValue(minValue)
	{
		this.min_value = minValue;
		if (this.curr_value < this.min_value) {
			this.curr_value = this.min_value;
		}
		if (this.max_value < this.min_value) {
			this.max_value = this.min_value;
		}
	}
	setMaxValue(maxValue)
	{
		this.max_value = maxValue;
		if (this.curr_value > this.max_value) {
			this.curr_value = this.max_value;
		}
		if (this.min_value > this.max_value) {
			this.min_value = this.max_value;
		}
	}
	setValue(currValue)
	{
		this.curr_value = (currValue < this.min_value)
		                ? this.min_value
						: ((currValue > this.max_value) ? this.max_value : currValue);
	}

	getMinValue()
	{
		return this.min_value;
	}
	getMaxValue()
	{
		return this.max_value;
	}
	getCurrValue()
	{
		return this.curr_value;
	}

	registerOnChange(callback)
	{
		this.on_new_position.push(callback);
	}

	cancelOnChange(callback)
	{
		this.on_new_position = this.on_new_position.filter((cb) => cb != callback);
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
				+ (this.vertical ? bsz : 0)
			    + "px";
			this.div.style.height = this.controlled_element.clientHeight
				+ (this.horizontal ? bsz : 0)
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
		this.controlled_element.style.border = "none";
		this.controlled_element.style.margin = "0";
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
		}
		if (isIE11()) {
			this.controlled_element.style.setProperty("-ms-grid-column", "1");
			this.controlled_element.style.setProperty("-ms-grid-row", "1");
		}
		if (this.vertical) {
			this.verticalScrollbar = new GenericScrollBar(this.controlled_element, { ...this.bar_configuration, vertical: true });
			this.div.appendChild(this.verticalScrollbar.div);
			if (isIE11()) {
				this.verticalScrollbar.div.style.setProperty("-ms-grid-row", "1");
				this.verticalScrollbar.div.style.setProperty("-ms-grid-column", "2");
			}
		}
		if (this.horizontal) {
			this.horizontalScrollbar = new GenericScrollBar(this.controlled_element,  { ...this.bar_configuration, vertical: false });
			this.div.appendChild(this.horizontalScrollbar.div);
			if (isIE11()) {
				this.horizontalScrollbar.div.style.setProperty("-ms-grid-row", "2");
				this.horizontalScrollbar.div.style.setProperty("-ms-grid-column", "1");
			}
		}
	}

	_onButtonMinusClick()
	{
		console.log("Button minus clicked");
	}

	_onButtonPlusClick()
	{
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

};

window.GenericScrollBarAdder = GenericScrollBarAdder;

