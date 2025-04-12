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
	background:  "rgb(224,224,224)",
	foreground:  "rgb(0,0,0)",
	buttonBackground: "rgb(240,240,240)",
	buttonBackgroundHover: "rgb(224,224,224)",
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
 			
	static vertical_mutable_properties = {
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

	static horizontal_mutable_properties =  {
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

	static _colorNameToRGB_canvas = null;

	static _colorNameToRGB(colorName)
	{
		if (! GenericScrollBar._colorNameToRGB_canvas) {
    		GenericScrollBar._colorNameToRGB_canvas = document.createElement("canvas");
			GenericScrollBar._colorNameToRGB_canvas.width = 1;
			GenericScrollBar._colorNameToRGB_canvas.height = 1;
			GenericScrollBar._colorNameToRGB_canvas.willReadFrequently = true;
		}

		let context = GenericScrollBar._colorNameToRGB_canvas.getContext("2d");

		context.fillStyle = colorName;
		context.fillRect(0, 0, 1, 1);

		let imageData = context.getImageData(0, 0, 1, 1).data;

		return {
			r: imageData[0],
			g: imageData[1],
			b: imageData[2]
		};
	}

	_create_button()
	{
		let button = document.createElement("button");
		button.style.margin = "0px";
		if (true) {
		button.style.borderWidth = this.button_border_size + "px";
		button.style.borderRadius = (2*this.button_border_size) + "px";
		button.style.borderStyle = "outset";
		button.style.borderColor = this.foreground;
		button.style.backgroundColor = this.button_background;
		button.style.foregroundColor = this.foreground;
		let down = false;
		let hover = false;
		button.addEventListener("mousedown",
			(event) => {
				down = true;
				button.style.borderStyle = "inset";
				button.style.backgroundColor = this.button_background;
			}
		);
		button.addEventListener("mouseup",
			(event) => {
				down = false;
				button.style.borderStyle = "outset";
				if (hover) {
					button.style.backgroundColor = this.button_background_hover;
				}
				else {
					button.style.backgroundColor = this.button_background;
				}
			}
		);
		button.addEventListener("mouseenter",
			(event) => {
				hover = true;
				if (! down) {
					button.style.backgroundColor = this.button_background_hover;
				}
			}
		);
		button.addEventListener("mouseleave",
			(event) => {
				hover = false;
				if (! down) {
					button.style.backgroundColor = this.button_background;
				}
			}
		);

		}

		return button;
	}
	
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

		this.button_minus = this._create_button();
		this.button_minus.innerText = "-";
		this.button_minus.addEventListener("click", this._onButtonMinusClick.bind(this));

		this.div_int = document.createElement("div");
		this.div_int.style.position = "relative";
		this.div_int.style.backgroundColor = this.background;
		this.button_int = this._create_button();
		this.button_int.style.position = "absolute";
		this.button_int.style.top = "0";
		this.button_int.style.left = "0";
		this.div_int.appendChild(this.button_int);
		this.div_int.addEventListener("click", this._onDivIntClick.bind(this));
		this.button_int.addEventListener("mousedown", this._onButtonIntMouseDown.bind(this));

		this.button_plus = this._create_button();
		this.button_plus.innerText = "+";
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
		this.button_int.style[m.motion_size] = "100%";	
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

	_onDivIntClick(event)
	{
		const buttonIntRect = this.button_int.getBoundingClientRect();
		if (event.clientX >= buttonIntRect.left &&
			event.clientX <= buttonIntRect.right &&
			event.clientY >= buttonIntRect.top &&
			event.clientY <= buttonIntRect.bottom) {
			return;
		}

		const m = this.mutable_properties;
		let clickPosition = event[m.motion_coord] - this.div_int.getBoundingClientRect()[m.min_coord_side];
		let limit = this.div_int[m.motion_limit] - this.button_int[m.motion_limit] - 2 * this.button_border_size;
		if (clickPosition < 0) {
			clickPosition = 0;
		} else if (clickPosition > limit) {
			clickPosition = limit;
		}
		this.button_int.style[m.min_coord_side] = clickPosition + "px";
		let val = (limit <= 0) ? 0 : (clickPosition / limit);
		this.setValue(this.min_value + val * (this.max_value - this.min_value));
		this._signalNewValue();
		this.controlled_element.focus();
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
		this.controlled_element.focus();
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
			this.setValue(this.min_value + val * (this.max_value - this.min_value));
			this._signalNewValue();
		}
	}

	_signalNewValue()
	{
		let rv = {
			value: this.curr_value,
			minValue: this.min_value,
			maxValue: this.max_value,
			visibleRangeSize: this.visible_range_size,
		};
		this.on_new_position.forEach(callback => callback(rv));
	}

	_onButtonMinusClick()
	{
		if (this.visible_range_size > 0) {
			this.setValue(this.curr_value - this.visible_range_size);
			this._signalNewValue();
			this.controlled_element.focus();
		}
	}

	_onButtonPlusClick()
	{
		if (this.visible_range_size > 0) {
			this.setValue(this.curr_value + this.visible_range_size);
			this._signalNewValue();
			this.controlled_element.focus();
		}
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
		buttonBackground: "button_background",
		buttonBackgroundHover: "button_background_hover",
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

		if (false) {
		let f = GenericScrollBar._colorNameToRGB(this.foreground);
		let b = GenericScrollBar._colorNameToRGB(this.background);
		this.button_background = "rgb(" + Math.floor((5*b.r + f.r) / 6) + "," + Math.floor((5*b.g + f.g) / 6) + "," + Math.floor((6*b.b + f.b) / 6) + ")";
		this.button_background_hover = "rgb(" + Math.floor((4*b.r + 2*f.r) / 6) + "," + Math.floor((4*b.g + 2*f.g) / 6) + "," + Math.floor((4*b.b + 2*f.b) / 6) + ")";
		}

		this.mutable_properties = this.vertical
	                            ? GenericScrollBar.vertical_mutable_properties
		                        : GenericScrollBar.horizontal_mutable_properties;
		this.on_new_position = [];
		this.min_value = 0;
		this.curr_value = 0;
		this.max_value = 0;
		this.visible_range_size = 0;

		this._layout();
	}

	_updatePos()
	{
		let range = this.max_value - this.min_value;
		if (this.visible_range_size != 0 && range != 0) {
			const m = this.mutable_properties;

			let r = this.div_int.getBoundingClientRect();
			let v = this.visible_range_size / (this.visible_range_size  + range);
			if (v > 1) {
				v = 1;
			}
			let l = Math.floor(r[m.motion_size] * v + 0.5);
			if (l < Number(this.button_size)) {
				l = Number(this.button_size);
			}
			let p = Math.floor((r[m.motion_size] - l) * ((this.curr_value - this.min_value) / range) + 0.5);
			this.button_int.style[m.min_coord_side] =  p + "px"
			this.button_int.style[m.motion_size] = l + "px";
		}
	}

	setMinValue(minValue)
	{
		if (this.min_value != minValue) {
			this.min_value = minValue;
			if (this.curr_value < this.min_value) {
				this.curr_value = this.min_value;
			}
			if (this.max_value < this.min_value) {
				this.max_value = this.min_value;
			}
			this._updatePos();
		}
	}

	setMaxValue(maxValue)
	{
		if (this.max_value != maxValue) {
			this.max_value = maxValue;
			if (this.curr_value > this.max_value) {
				this.curr_value = this.max_value;
			}
			if (this.min_value > this.max_value) {
				this.min_value = this.max_value;
			}
			this._updatePos();
		}
	}

	setValue(currValue)
	{
		if (currValue != this.curr_value) {
			this.curr_value = (currValue < this.min_value)
							? this.min_value
							: ((currValue > this.max_value) ? this.max_value : currValue);
			this._updatePos();
		}
	}

	setVisibleRangeSize(v)
	{
		if (this.visible_range_size != v) {
			this.visible_range_size = v;
			this._updatePos();
		}
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
	getVisibleRangeSize()
	{
		return this.visible_range_size;
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
		if (typeof this.controlled_element_or_id == 'string') {
			this.controlled_element = document.getElementById(this.controlled_element_or_id);
		}
		else {
			this.controlled_element = this.controlled_element_or_id;
		}

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
		this.configuration = { ...GENERICSCROLLBARADDER_DEFAULTS, ...params };

		this.controlled_element_or_id = controlledElementOrId;

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

