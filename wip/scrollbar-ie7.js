// DEFAULTS

function isObject(val)
{
    return val !== null && typeof val === 'object';
}


function copyObject(src)
{
	if (! isObject(src)) {
		return src;
	}

	var v = {};
	var x;

	for (x in src) {
		v[x] = copyObject(src[x]);
	}

	return v;
}

function addObject(dest, src)
{
	if (! isObject(src)) {
		return src;
	}

	var x;

	for (x in src) {
		dest[x] = copyObject(src[x]);
	}

	return dest;
}

/*
function printObject(x, p)
{
	if (x == null) {
		app.PrintMessage(p + "(null)");
		return "(null)";
	}
	if (! isObject(x)) {
		app.PrintMessage(p + String(x));
		return String(x);
	}
	if (p == "   ") {
		app.PrintMessage(p + "...");
		return "...";
	}

	var v;
	//var l = p + "{\n";
	app.PrintMessage(p + "{");

	for (v in x) {
		app.PrintMessage(p + v + ": ");
		printObject(x[v], p + " ");
		//app.PrintMessage(p + v + ": " + x[v]);
		//l = l + p + v +  ": " +  printObject(x[v], p + " ") + "\n";
	}

	//l = l + p + "}";
	app.PrintMessage(p + "}");

	return;
}

var console = {
	log: function(x) {
		//app.PrintMessage(printObject(x, ""));
		printObject(x, "");
	}
};
*/

var COMMON_GENERICSCROLLBAR_DEFAULTS = {
	size: "30", // Pixels
	buttonSize: "20", // Pixels

	// Colors and appearance:
	foreground:  "rgb(192,192,192)",
	background:  "rgb(0,0,0)"
};

var GENERICSCROLLBAR_DEFAULTS = copyObject(COMMON_GENERICSCROLLBAR_DEFAULTS);
GENERICSCROLLBAR_DEFAULTS.vertical = true;

var GENERICSCROLLBARADDER_DEFAULTS = {
	barConfiguration: COMMON_GENERICSCROLLBAR_DEFAULTS,
	vertical: "on", // "on", "off", "dynamic"
	horizontal: "off" // "on", "off", "dynamic"
};


function GenericScrollBar_layout(self)
{
	self.div = null;
	self.div_int = null;
	self.button_minus = null;
	self.button_plus = null;

	self.div = document.createElement("div");
	self.div.style.width = "max-content";
	self.div.classList.add("generic-scrollbar");
	self.div.style.display = "grid";
	var style = window.getComputedStyle(self.controlled_element);
	self.div.style.border = "none";
	self.div.style.margin = "0";
	if (self.vertical) {
		self.div.style.gridTemplateColumns = "auto";
		self.div.style.gridTemplateRows = "auto auto auto";
		self.div.style.borderLeftWidth = "2px";
		self.div.style.borderLeftStyle = "solid";
		self.width = self.size;
		self.height = self.controlled_element.clientHeight;
	}
	else {
		self.div.style.gridTemplateColumns = "auto auto auto";
		self.div.style.gridTemplateRows = "auto";
		self.div.style.borderTopWidth = "2px";
		self.div.style.borderTopStyle = "solid";
		self.width = self.controlled_element.clientWidth;
		self.height = self.size
	}

	self.button_minus = document.createElement("button");
	self.button_minus.innerText = "-";
	self.button_minus.addEventListener("click", function(event) { GenericScrollBar_onButtonMinusClick(event, self); });
	self.div.appendChild(self.button_minus);

	//self.canvas = document.createElement("canvas");
	self.div_int = document.createElement("div");
	self.div_int.style.position = "relative";
	self.button_int = document.createElement("button");
	self.button_int.innerText = " ";
	self.button_int.style.position = "absolute";
	self.button_int.style.top = "0";
	self.button_int.style.left = "0";
	self.button_int.style.width = "100%";
	self.button_int.style.height = "10%";
	self.div_int.appendChild(self.button_int);
	self.div_int.addEventListener("click", function(event) { GenericScrollBar_onDivIntClick(event, self); });
	self.button_int.addEventListener("mousedown", function(event) { GenericScrollBar_onButtonIntMouseDown.bind(event, self); });
	self.button_int.addEventListener("mouseup", function(event) { GenericScrollBar_onButtonIntMouseUp.bind(event, self); });
	self.button_int.addEventListener("mousemove", function(event) { GenericScrollBar_onButtonIntMouseMove.bind(event, self); });
	self.div.appendChild(self.div_int);

	self.button_plus = document.createElement("button");
	self.button_plus.innerText = "+";
	self.button_plus.addEventListener("click", function(event) { GenericScrollBar_onButtonPlusClick(event, self); });
	self.div.appendChild(self.button_plus);

	if (self.vertical) {
		self.button_minus.style.width = self.size + "px";
		self.button_minus.style.height = self.button_size + "px";
		self.div_int.style.width = self.size + "px";
		self.div_int.style.height = (self.controlled_element.clientHeight - 2*self.button_size) + "px";
		self.button_plus.style.width = self.size + "px";
		self.button_plus.style.height = self.button_size + "px";
	} else {
		self.button_minus.style.width = self.button_size + "px";
		self.button_minus.style.height = self.size + "px";
		self.div_int.style.width = (self.controlled_element.clientWidth - 2*self.button_size) + "px";
		self.div_int.style.height = self.size + "px";
		self.button_plus.style.width = self.button_size + "px";
		self.button_plus.style.height = self.size + "px";
	}
	self.mouse_down = false;
	self.mouse_down_pos = 0;
}

function GenericScrollBar_onDivIntClick(event, self)
{
	console.log("DivInt mouse down", event);
}

function GenericScrollBar_onButtonIntMouseDown(event, self)
{
	console.log("ButtonInt mouse down", event);
	self.mouse_down = true;
	self.mouse_down_pos = event.clientY;
}

function GenericScrollBar_onButtonIntMouseUp(event, self)
{
	console.log("ButtonInt mouse up", event);
	self.mouse_down = false;
}

function GenericScrollBar_onButtonIntMouseMove(event, self)
{
	console.log("ButtonInt mouse move", event);
	if (self.mouse_down) {
		var y = self.button_int.getBoundingClientRect().top - self.div_int.getBoundingClientRect().top + event.clientY - self.mouse_down_pos;
		console.log("ButtonInt mouse move", event.clientY, self.mouse_down_pos, y);
		self.button_int.style.top = y + "px";
		self.mouse_down_pos = event.clientY;
	}
}

function GenericScrollBar_onButtonMinusClick(event, self)
{
	// Gestore per il click del bottone minus
	console.log("Button minus clicked");
}

function GenericScrollBar_onButtonPlusClick(event, self)
{
	// Gestore per il click del bottone plus
	console.log("Button plus clicked");
}

function GenericScrollBar(controlledElement, params)
{
	self = {};
	// Contructor's parameters and their defaut values:

	// Table to convert public configuration keys to internal members.
	// (Yes, I am too lazy to rename all the public keys to match the internal ones).
	var config_to_members = {
		background: "background",
		foreground: "foreground",
		size: "size",
		buttonSize: "button_size",
		vertical: "vertical"
	};

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
	self.configuration = copyObject(GENERICSCROLLBAR_DEFAULTS);
	addObject(self.configuration, params);

	self.controlled_element = controlledElement;

	// Convert public configuration keys to internal members.
	for (var key in self.configuration) {
		if (config_to_members[key]) {
			self[config_to_members[key]] = self.configuration[key];
		}
	}

	GenericScrollBar_layout(self);

	return self;
}

function GenericScrollBarAdder_layout(self)
{
	self.div = null;
	self.controlled_element = document.getElementById(self.controlled_element_id);

	self.div = document.createElement("div");
	console.log(self.div.style);
	self.div.style.width = "max-content";
	self.div.classList.add("generic-scrollbar");
	self.div.style.display = "grid";
	var style = window.getComputedStyle(self.controlled_element);
	self.div.style.border = style.border;
	self.div.style.margin = style.margin;
	self.controlled_element.style.border = "none";
	self.controlled_element.style.margin = "0";
	if (self.vertical != "on") {
		self.div.style.gridTemplateColumns = "auto";
	}
	else {
		self.div.style.gridTemplateColumns = "auto auto";
	}
	self.width = self.controlled_element.clientWidth;
	self.height = self.controlled_element.clientHeight;

	if (self.controlled_element) {
		self.controlled_element.parentNode.replaceChild(self.div, self.controlled_element);
		self.div.appendChild(self.controlled_element);
	}
	if (self.vertical == "on") {
		var param = copyObject(self.bar_configuration);
		param.vertical = true;
		self.vertical_scrollbar = GenericScrollBar(self.controlled_element, param);
		self.div.appendChild(self.vertical_scrollbar.div);
	}
	if (self.horizontal == "on") {
		var param = copyObject(self.bar_configuration);
		param.vertical = false;
		self.horizontal_scrollbar = GenericScrollBar(self.controlled_element, param);
		self.div.appendChild(self.horizontal_scrollbar.div);
	}
}

function GenericScrollBarAdder(controlledElementId, params)
{
	// Contructor's parameters and their defaut values:
	var self = {};

	// Table to convert public configuration keys to internal members.
	// (Yes, I am too lazy to rename all the public keys to match the internal ones).
	var config_to_members = {
		barConfiguration: "bar_configuration",
		vertical: "vertical",
		horizontal: "horizontal"
	};

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
	self.configuration = copyObject(GENERICSCROLLBARADDER_DEFAULTS);
	addObject(self.configuration, params);
	self.controlled_element_id = controlledElementId;

	// Convert public configuration keys to internal members.
	for (var key in self.configuration) {
		if (config_to_members[key]) {
			self[config_to_members[key]] = self.configuration[key];
		}
	}

	GenericScrollBarAdder_layout(self);

	return self;
}


