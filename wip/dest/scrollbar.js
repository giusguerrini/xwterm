"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GenericScrollBarAdder = void 0;
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// DEFAULTS

function isIE11() {
  return !!window.MSInputMethodContext && !!document.documentMode;
}
var COMMON_GENERICSCROLLBAR_DEFAULTS = {
  size: "30",
  // Pixels
  buttonSize: "20",
  // Pixels

  // Colors and appearance:
  foreground: "rgb(192,192,192)",
  background: "rgb(0,0,0)"
};
var GENERICSCROLLBAR_DEFAULTS = _objectSpread(_objectSpread({}, COMMON_GENERICSCROLLBAR_DEFAULTS), {}, {
  vertical: true
});
var GENERICSCROLLBARADDER_DEFAULTS = {
  barConfiguration: COMMON_GENERICSCROLLBAR_DEFAULTS,
  vertical: "on",
  // "on", "off", "dynamic"
  horizontal: "off" // "on", "off", "dynamic"
};
var GenericScrollBar = /*#__PURE__*/function () {
  function GenericScrollBar(controlledElement, params) {
    _classCallCheck(this, GenericScrollBar);
    // Contructor's parameters and their defaut values:

    // Some handy conventions:
    // no parameters: apply defaults, create a new terminal in a new div.
    // string parameter: apply defaults, create a new terminal in the div with the given id.
    if (!params) {
      params = "";
    }
    if (typeof params == 'string') {
      params = {};
    }

    // Apply defaults, overwrite with actual parameters
    this.configuration = _objectSpread(_objectSpread({}, GENERICSCROLLBAR_DEFAULTS), params);
    this.controlled_element = controlledElement;

    // Convert public configuration keys to internal members.
    for (var key in this.configuration) {
      if (GenericScrollBar.config_to_members[key]) {
        this[GenericScrollBar.config_to_members[key]] = this.configuration[key];
      }
    }
    this._layout();
  }
  return _createClass(GenericScrollBar, [{
    key: "_layout",
    value: function _layout() {
      var _this = this;
      this.div = null;
      this.div_int = null;
      this.button_minus = null;
      this.button_plus = null;
      this.div = document.createElement("div");
      this.div.style.width = "max-content";
      this.div.classList.add("generic-scrollbar");
      if (isIE11()) {
        this.div.style.display = "-ms-grid";
      } else {
        this.div.style.display = "grid";
      }
      var style = window.getComputedStyle(this.controlled_element);
      this.div.style.border = "none";
      this.div.style.margin = "0";
      if (this.vertical) {
        this.div.style.gridTemplateColumns = "auto";
        this.div.style.gridTemplateRows = "auto auto auto";
        if (isIE11()) {
          this.div.style.setProperty("-ms-grid-columns", this.size + 2 + "px");
        }
        this.div.style.borderLeftWidth = "2px";
        this.div.style.borderLeftStyle = "solid";
        this.width = this.size;
        this.height = this.controlled_element.clientHeight;
      } else {
        this.div.style.gridTemplateColumns = "auto auto auto";
        this.div.style.gridTemplateRows = "auto";
        if (isIE11()) {
          this.div.style.setProperty("-ms-grid-columns", this.button_size + "px 1fr " + this.button_size + "px");
        }
        this.div.style.borderTopWidth = "2px";
        this.div.style.borderTopStyle = "solid";
        this.width = this.controlled_element.clientWidth;
        this.height = this.size;
      }
      this.button_minus = document.createElement("button");
      this.button_minus.innerText = "-";
      this.button_minus.addEventListener("click", function () {
        _this._onButtonMinusClick();
      });
      this.div.appendChild(this.button_minus);

      //this.canvas = document.createElement("canvas");
      this.div_int = document.createElement("div");
      this.div_int.style.position = "relative";
      this.button_int = document.createElement("button");
      this.button_int.innerText = " ";
      this.button_int.style.position = "absolute";
      this.button_int.style.top = "0";
      this.button_int.style.left = "0";
      this.button_int.style.width = "100%";
      this.button_int.style.height = "10%";
      this.div_int.appendChild(this.button_int);
      this.div_int.addEventListener("click", this._onDivIntClick.bind(this));
      this.button_int.addEventListener("mousedown", this._onButtonIntMouseDown.bind(this));
      this.button_int.addEventListener("mouseup", this._onButtonIntMouseUp.bind(this));
      this.button_int.addEventListener("mousemove", this._onButtonIntMouseMove.bind(this));
      this.div.appendChild(this.div_int);
      this.button_plus = document.createElement("button");
      this.button_plus.innerText = "+";
      this.button_plus.addEventListener("click", function () {
        _this._onButtonPlusClick();
      });
      this.div.appendChild(this.button_plus);
      if (this.vertical) {
        this.button_minus.style.width = this.size + "px";
        this.button_minus.style.height = this.button_size + "px";
        this.div_int.style.width = this.size + "px";
        this.div_int.style.height = this.controlled_element.clientHeight - 2 * this.button_size + "px";
        this.button_plus.style.width = this.size + "px";
        this.button_plus.style.height = this.button_size + "px";
      } else {
        this.button_minus.style.width = this.button_size + "px";
        this.button_minus.style.height = this.size + "px";
        this.div_int.style.width = this.controlled_element.clientWidth - 2 * this.button_size + "px";
        this.div_int.style.height = this.size + "px";
        this.button_plus.style.width = this.button_size + "px";
        this.button_plus.style.height = this.size + "px";
      }
      this.mouse_down = false;
      this.mouse_down_pos = 0;
    }
  }, {
    key: "_onDivIntClick",
    value: function _onDivIntClick(event) {
      console.log("DivInt mouse down", event);
    }
  }, {
    key: "_onButtonIntMouseDown",
    value: function _onButtonIntMouseDown(event) {
      console.log("ButtonInt mouse down", event);
      this.mouse_down = true;
      this.mouse_down_pos = event.clientY;
    }
  }, {
    key: "_onButtonIntMouseUp",
    value: function _onButtonIntMouseUp(event) {
      console.log("ButtonInt mouse up", event);
      this.mouse_down = false;
    }
  }, {
    key: "_onButtonIntMouseMove",
    value: function _onButtonIntMouseMove(event) {
      console.log("ButtonInt mouse move", event);
      if (this.mouse_down) {
        var y = this.button_int.getBoundingClientRect().top - this.div_int.getBoundingClientRect().top + event.clientY - this.mouse_down_pos;
        console.log("ButtonInt mouse move", event.clientY, this.mouse_down_pos, y);
        this.button_int.style.top = y + "px";
        this.mouse_down_pos = event.clientY;
      }
    }
  }, {
    key: "_onButtonMinusClick",
    value: function _onButtonMinusClick() {
      // Gestore per il click del bottone minus
      console.log("Button minus clicked");
    }
  }, {
    key: "_onButtonPlusClick",
    value: function _onButtonPlusClick() {
      // Gestore per il click del bottone plus
      console.log("Button plus clicked");
    }

    // Table to convert public configuration keys to internal members.
    // (Yes, I am too lazy to rename all the public keys to match the internal ones).
  }]);
}();
_defineProperty(GenericScrollBar, "config_to_members", {
  background: "background",
  foreground: "foreground",
  size: "size",
  buttonSize: "button_size",
  vertical: "vertical"
});
;
var GenericScrollBarAdder = exports.GenericScrollBarAdder = /*#__PURE__*/function () {
  function GenericScrollBarAdder(controlledElementId, params) {
    _classCallCheck(this, GenericScrollBarAdder);
    // Contructor's parameters and their defaut values:

    // Some handy conventions:
    // no parameters: apply defaults, create a new terminal in a new div.
    // string parameter: apply defaults, create a new terminal in the div with the given id.
    if (!params) {
      params = "";
    }
    if (typeof params == 'string') {
      params = {};
    }

    // Apply defaults, overwrite with actual parameters
    this.configuration = _objectSpread(_objectSpread({}, GENERICSCROLLBARADDER_DEFAULTS), params);
    this.controlled_element_id = controlledElementId;

    // Convert public configuration keys to internal members.
    for (var key in this.configuration) {
      if (GenericScrollBarAdder.config_to_members[key]) {
        this[GenericScrollBarAdder.config_to_members[key]] = this.configuration[key];
      }
    }
    this._layout();
  }
  return _createClass(GenericScrollBarAdder, [{
    key: "_layout",
    value: function _layout() {
      this.div = null;
      this.controlled_element = document.getElementById(this.controlled_element_id);
      this.div = document.createElement("div");
      this.div.style.width = "max-content";
      this.div.classList.add("generic-scrollbar");
      this.div.style.display = "grid";
      var style = window.getComputedStyle(this.controlled_element);
      this.div.style.border = style.border;
      this.div.style.margin = style.margin;
      this.controlled_element.style.border = "none";
      this.controlled_element.style.margin = "0";
      if (this.vertical != "on") {
        this.div.style.gridTemplateColumns = "auto";
      } else {
        this.div.style.gridTemplateColumns = "auto auto";
      }
      this.width = this.controlled_element.clientWidth;
      this.height = this.controlled_element.clientHeight;
      if (this.controlled_element) {
        this.controlled_element.parentNode.replaceChild(this.div, this.controlled_element);
        this.div.appendChild(this.controlled_element);
      }
      if (this.vertical == "on") {
        this.vertical_scrollbar = new GenericScrollBar(this.controlled_element, _objectSpread(_objectSpread({}, this.bar_configuration), {}, {
          vertical: true
        }));
        this.div.appendChild(this.vertical_scrollbar.div);
        if (isIE11()) {
          this.controlled_element.style.setProperty("-ms-grid-column", "1");
          this.vertical_scrollbar.div.style.setProperty("-ms-grid-column", "2");
        }
      }
      if (this.horizontal == "on") {
        this.horizontal_scrollbar = new GenericScrollBar(this.controlled_element, _objectSpread(_objectSpread({}, this.bar_configuration), {}, {
          vertical: false
        }));
        this.div.appendChild(this.horizontal_scrollbar.div);
      }
    }
  }, {
    key: "_onButtonMinusClick",
    value: function _onButtonMinusClick() {
      // Gestore per il click del bottone minus
      console.log("Button minus clicked");
    }
  }, {
    key: "_onButtonPlusClick",
    value: function _onButtonPlusClick() {
      // Gestore per il click del bottone plus
      console.log("Button plus clicked");
    }

    // Table to convert public configuration keys to internal members.
    // (Yes, I am too lazy to rename all the public keys to match the internal ones).
  }]);
}();
_defineProperty(GenericScrollBarAdder, "config_to_members", {
  barConfiguration: "bar_configuration",
  vertical: "vertical",
  horizontal: "horizontal"
});
;