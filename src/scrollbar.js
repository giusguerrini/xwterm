

export class AnsiTermScrollBar {

// DEFAULTS

const ANSITERMSCROLLBAR_DEFAULTS = {
	// Basic characteristics:

	controlledWidget: "",
	vertical: true,
	size: "20"; // Pixels

	// Colors and appearance:

	foreground:  "rgb(192,192,192)", // Default foreground color.
	background:  "rgb(0,0,0)", // Default background color.
};
	
	_layout()
	{
		this.div = null;
		this.canvas = null;

		this.div = document.createElement("div");
		this.div.style.width = "max-content";
		this.div.classList.add("ansi-terminal");
		this.div.style.display = "grid";
		let style = window.getComputedStyle(this.controlled_widget);
		this.div.style.border = style.border;
		this.div.style.margin = style.margin;
		this.controlled_widget.style.border = "none";
		this.controlled_widget.style.margin = "0";
		this.div.style.gridTemplateColumns = "auto auto";
		this.width = this.controlled_widget.clientWidth;
		this.height = this.controlled_widget.clientHeight;
	}

	// Table to convert public configuration keys to internal members.
	// (Yes, I am too lazy to rename all the public keys to match the internal ones).
	static config_to_members = {
		background: "background",
		foreground: "foreground",
		size: "size",
		controlledWidget: "controlled_widget",
		vertical: "vertical",
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
			params = {  };
		}

		// Apply defaults, overwrite with actual parameters
		this.configuration = { ...ANSITERMSCROLLBAR_DEFAULTS, ...params };

		// Convert public configuration keys to internal members.
		for (let key in this.configuration) {
			if (AnsiTermScrollBar.config_to_members[key]) {
				this[AnsiTerm.config_to_members[key]] = this.configuration[key];
			}
		}

		this._layout();
	}
};


