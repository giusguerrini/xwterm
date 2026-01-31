	
		this.button_int.setAttribute("role", "scrollbar");
		this.button_int.setAttribute("aria-orientation", this.vertical ? "vertical" : "horizontal");
		this.button_int.setAttribute("aria-valuemin", String(this.min_value));
		this.button_int.setAttribute("aria-valuemax", String(this.max_value));
		this.button_int.setAttribute("aria-valuenow", String(this.curr_value));
		this.button_int.setAttribute("aria-valuetext", String(this.curr_value));
		this.button_int.addEventListener("keydown", (e) => {
		switch (e.key) {
			case "ArrowUp":
			case "ArrowLeft":
				this.setValue(this.curr_value - 1);
				this._signalNewValue();
				e.preventDefault();
				break;
			case "ArrowDown":
			case "ArrowRight":
				this.setValue(this.curr_value + 1);
				this._signalNewValue();
				e.preventDefault();
				break;
			case "PageUp": {
				let step = Math.max(1, Math.floor(this.visible_range_size || 1));
				this.setValue(this.curr_value - step);
				this._signalNewValue();
				e.preventDefault();
				}
				break;
			case "PageDown": {
				let step = Math.max(1, Math.floor(this.visible_range_size || 1));
				this.setValue(this.curr_value + step);
				this._signalNewValue();
				e.preventDefault();
				}
				break;
			case "Home":
				this.setValue(this.min_value);
				this._signalNewValue();
				e.preventDefault();
				break;
			case "End":
				this.setValue(this.max_value);
				this._signalNewValue();
				e.preventDefault();
				break;
		}
		});

		this.button_minus.setAttribute("aria-label", "Scroll backward");

		this.button_plus.setAttribute("aria-label", "Scroll forward");


_signalNewValue() {
  // esistente: costruzione rv e callback...
  if (this.button_int) {
    this.button_int.setAttribute("aria-valuenow", String(this.curr_value));
    this.button_int.setAttribute("aria-valuetext", String(this.curr_value));
  }
  let rv = {
    value: this.curr_value,
    minValue: this.min_value,
    maxValue: this.max_value,
    visibleRangeSize: this.visible_range_size,
  };
  this.on_new_position.forEach(callback => callback(rv));
}
