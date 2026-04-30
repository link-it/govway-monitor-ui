/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM:
 *     Class.create()                  -> costruttore plain + .prototype
 *     Object.extend(t, s)             -> Object.assign(t, s)
 *     $(id)                           -> document.getElementById(id)
 *     Element.match(el, sel)          -> el.matches(sel)
 *     Element.setStyle(el, str|obj)   -> _cbSetStyle (gestisce stringhe CSS o oggetti)
 *     Element.getStyle(el, prop)      -> getComputedStyle(el).getPropertyValue(prop)
 *     Event.observe / stopObserving   -> addEventListener / removeEventListener
 *     Event.stop(e)                   -> preventDefault + stopPropagation
 *     Event.KEY_*                     -> costanti numeriche (13/27/38/40/...)
 *     bindAsEventListener(this)       -> .bind(this)
 *     elem.observe(name, fn)          -> elem.addEventListener(name, fn)
 *     elem.fire(name, memo)           -> _cbFire(elem, name, memo) (CustomEvent
 *                                        con detail+memo per compatibilita')
 *     str.blank()                     -> _cbBlank(str)
 *     str.strip()                     -> str.trim()
 *     Prototype.Browser.{IE,Firefox,Gecko} -> sniff dell'userAgent (helpers _cbIs*)
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if (!window.Richfaces) window.Richfaces = {};

// Helpers privati
function _cbBlank(s) {
	return s == null || !/\S/.test(String(s));
}
function _cbSetStyle(el, styles) {
	if (!el || styles == null) return;
	if (typeof styles === 'string') {
		if (styles.trim()) el.style.cssText = (el.style.cssText || '') + ';' + styles;
		return;
	}
	for (var k in styles) {
		if (Object.prototype.hasOwnProperty.call(styles, k)) {
			var prop = k.indexOf('-') === -1
				? k
				: k.replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); });
			el.style[prop] = styles[k];
		}
	}
}
function _cbGetStyle(el, prop) {
	if (!el) return null;
	return window.getComputedStyle(el).getPropertyValue(prop);
}
function _cbFire(elem, name, memo) {
	var ev;
	if (typeof CustomEvent === "function") {
		ev = new CustomEvent(name, { detail: memo || {}, bubbles: true, cancelable: true });
	} else {
		ev = document.createEvent("Event");
		ev.initEvent(name, true, true);
	}
	ev.memo = memo || {};
	elem.dispatchEvent(ev);
	return ev;
}
var _cbUA = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
function _cbIsIE()      { return /MSIE |Trident\//.test(_cbUA); }
function _cbIsFirefox() { return /Firefox/.test(_cbUA); }
function _cbIsGecko()   { return /Gecko/.test(_cbUA) && !/WebKit/.test(_cbUA); }

function _RichfacesComboBox() { this.initialize.apply(this, arguments); }
Richfaces.ComboBox = _RichfacesComboBox;
_RichfacesComboBox.prototype = {

	//default values
	filterNewValues : true,
	defaultLabel : "",

	initialize: function(id, options) {
		options = options || {};
		Object.assign(this, options.fields);
		this.combobox = document.getElementById(id);
		this.comboValue = document.getElementById(id + "comboboxValue");
		this.field = document.getElementById(id + "comboboxField");
		this.tempItem;

		this.BUTTON_WIDTH = 17; //px
		this.BUTTON_LEFT_BORDER = 1; //px
		this.BUTTON_RIGHT_BORDER = 1; //px

		this.classes = Richfaces.mergeStyles(options.userStyles,new Richfaces.ComboBoxStyles().getCommonStyles());


		this.button = document.getElementById(id + "comboboxButton");
		this.buttonBG = document.getElementById(id + "comboBoxButtonBG");

		this.setInputWidth();

		var listOptions = options.listOptions || {};
		listOptions.listWidth = listOptions.listWidth || this.getCurrentWidth();
		this.comboList = new Richfaces.ComboBoxList(id, this.filterNewValues, this.classes.combolist, listOptions, "comboboxField");
		if (Richfaces.browser.isIE6) {
			this.comboList.createIframe(this.comboList.listParent.parentNode, this.comboList.listWidth, id,
										"rich-combobox-list-width rich-combobox-list-scroll rich-combobox-list-position");
		}

		if (options.value) {
			var item = this.comboList.findItemBySubstr(options.value);
			if (item) {
				this.comboList.doSelectItem(item);
			}
			// RF-5056
			this.comboValue.value = options.value;

		} else {
			if (this.defaultLabel) {
				this.applyDefaultText();
			}
		}
		this.isSelection = true;
		if (this.onselected) {
			this.combobox.addEventListener("rich:onselect", this.onselected);
		}
		if (this.disabled) {
			this.disable();
		}

		this.combobox.component = this;
		this.initHandlers();
		this["rich:destructor"] = "destroy";
	},

	destroy: function () {

		// L'originale Prototype faceva Event.stopObserving(elt,'evt') senza
		// callback, che in Prototype rimuove tutti i listener per quell'evento.
		// In DOM standard removeEventListener richiede la stessa reference
		// passata ad addEventListener: memorizziamo i bound handler in _h e
		// li rimuoviamo qui. E' importante per evitare che blur post-destroy
		// (es. durante un rerender AJAX) chiami fieldBlurHandler con
		// this.comboList gia' nullo.
		var h = this._h || {};
		if (this.combobox && h.onselect) this.combobox.removeEventListener("rich:onselect", h.onselect);
		if (this.button) {
			this.button.removeEventListener("click", h.buttonClick);
			this.button.removeEventListener("mouseup", h.buttonMouseUp);
			this.button.removeEventListener("mousedown", h.buttonMousedown);
			this.button.removeEventListener("mouseover", h.buttonMouseOver);
			this.button.removeEventListener("mouseout", h.buttonMouseOut);
		}
		if (this.field) {
			this.field.removeEventListener("keydown", h.fieldKeyDown);
			this.field.removeEventListener("blur", h.fieldBlur);
			this.field.removeEventListener("focus", h.fieldFocus);
			this.field.removeEventListener("keyup", h.dataUpdating);
		}
		if (this.comboList && this.comboList.listParent) {
			this.comboList.listParent.removeEventListener("mousedown", h.listMousedown);
			this.comboList.listParent.removeEventListener("mouseup", h.listMouseUp);
			this.comboList.listParent.removeEventListener("mousemove", h.listMouseMove);
			this.comboList.listParent.removeEventListener("click", h.listClick);
		}
		this._h = null;

		this.comboValue = null;
		this.button = null;
		this.buttonBG = null;
		this.field = null;
		this.classes = null;

		this.comboList.hide();
		delete this.comboList;
		this.combobox.component = null;
		this.combobox = null;
	},

	initHandlers : function() {
		var h = this._h = {};
		if (this.onselect) {
			h.onselect = this.onselect.bind(this);
			this.combobox.addEventListener("rich:onselect", h.onselect);
		}

		h.buttonClick      = this.buttonClickHandler.bind(this);
		h.buttonMouseUp    = this.buttonMouseUpHandler.bind(this);
		h.buttonMousedown  = this.buttonMousedownHandler.bind(this);
		h.buttonMouseOver  = this.buttonMouseOverHandler.bind(this);
		h.buttonMouseOut   = this.buttonMouseOutHandler.bind(this);
		this.button.addEventListener("click", h.buttonClick);
		this.button.addEventListener("mouseup", h.buttonMouseUp);
		this.button.addEventListener("mousedown", h.buttonMousedown);
		this.button.addEventListener("mouseover", h.buttonMouseOver);
		this.button.addEventListener("mouseout", h.buttonMouseOut);

		h.fieldKeyDown = this.fieldKeyDownHandler.bind(this);
		h.fieldBlur    = this.fieldBlurHandler.bind(this);
		h.fieldFocus   = this.fieldFocusHandler.bind(this);
		h.dataUpdating = this.dataUpdating.bind(this);
		this.field.addEventListener("keydown", h.fieldKeyDown);
		this.field.addEventListener("blur", h.fieldBlur);
		this.field.addEventListener("focus", h.fieldFocus);
		this.field.addEventListener("keyup", h.dataUpdating);

		h.listMousedown = this.listMousedownHandler.bind(this);
		h.listMouseUp   = this.listMouseUpHandler.bind(this);
		h.listMouseMove = this.listMouseMoveHandler.bind(this);
		h.listClick     = this.listClickHandler.bind(this);
		this.comboList.listParent.addEventListener("mousedown", h.listMousedown);
		this.comboList.listParent.addEventListener("mouseup", h.listMouseUp);
		this.comboList.listParent.addEventListener("mousemove", h.listMouseMove);
		this.comboList.listParent.addEventListener("click", h.listClick);
	},

	setInputWidth : function() {
		var width;
        if (Richfaces.browser.isIE6) {
            width = parseInt(this.field.parentNode.style.width) - this.BUTTON_WIDTH;
        } else {
            width = parseInt(this.field.parentNode.style.width)
                - parseInt(_cbGetStyle(this.field, Richfaces.borders.l))
                - parseInt(_cbGetStyle(this.field, Richfaces.paddings.l))
                - parseInt(_cbGetStyle(this.field, Richfaces.paddings.r))
                - parseInt(_cbGetStyle(this.field, Richfaces.borders.r));
            width -= this.buttonBG.offsetWidth ? this.buttonBG.offsetWidth : this.BUTTON_WIDTH;
        }
		this.field.style.width = width + "px";
	},

	buttonClickHandler : function(event) {
		if (this.comboList.visible()) {
			this.comboList.hideWithDelay();
		} else {
			this.comboList.createDefaultList();
			this.comboList.showWithDelay();
			if (this.comboList.selectedItem) {
				this.comboList.scrollingUpToItem(this.comboList.selectedItem);
			}
			this.comboList.isList = false;
		}
	},

	buttonMouseUpHandler : function(e) {
		this.buttonBG.className = this.normalizeClasses(this.buttonBG.className, "rich-combobox-font rich-combobox-button-background rich-combobox-button");
		this.button.className = this.normalizeClasses(this.button.className, this.classes.button.classes.active + " rich-combobox-button-hovered");

		var styleCss = this.classes.button.style;
		if(styleCss && !_cbBlank(styleCss.active)) {
			_cbSetStyle(this.button, styleCss.active);
		}

		this.field.focus();
	},

	buttonMousedownHandler : function(e) {
		this.buttonBG.className = this.normalizeClasses(this.buttonBG.className, "rich-combobox-font rich-combobox-button-pressed-background rich-combobox-button");
		this.button.className = this.normalizeClasses(this.button.className, this.classes.button.classes.active + " rich-combobox-button-hovered");

		var styleCss = this.classes.button.style;
		if(styleCss && !_cbBlank(styleCss.active)) {
			_cbSetStyle(this.button, styleCss.active);
		}

		this.comboList.isList = true;
	},

	buttonMouseOverHandler : function(e) {
		var classCss = this.classes.button.classes;
		var iconStyles = this.classes.buttonicon.style;
		var styleCss = this.classes.button.style;
		if (this.isActive()) {
			this.button.className = this.normalizeClasses(this.button.className, classCss.active + " " + classCss.hovered);

			if(styleCss && !_cbBlank(styleCss.active)) {
				_cbSetStyle(this.button, styleCss.active);
			}

			if (iconStyles && !_cbBlank(iconStyles.active)) {
				_cbSetStyle(this.button, {backgroundImage : iconStyles.active});
			}

		} else {
			this.button.className = this.normalizeClasses(this.button.className, classCss.normal + " " + classCss.hovered);

			if(styleCss && !_cbBlank(styleCss.normal)) {
				_cbSetStyle(this.button, styleCss.normal);
			}

			if (iconStyles && !_cbBlank(iconStyles.normal)) {
				_cbSetStyle(this.button, {backgroundImage : iconStyles.normal});
			}
		}
	},

	buttonMouseOutHandler : function(e) {
		var classCss = this.classes.button.classes;
		var styleCss = this.classes.button.style;
		var iconStyles = this.classes.buttonicon.style;

		if (this.isActive()) {
			this.button.className = this.normalizeClasses(this.button.className, classCss.active);

			if(styleCss && !_cbBlank(styleCss.active)) {
				_cbSetStyle(this.button, styleCss.active);
			}

			if (iconStyles && !_cbBlank(iconStyles.active)) {
				_cbSetStyle(this.button, {backgroundImage : iconStyles.active});
			}
		} else {
			this.button.className = this.normalizeClasses(this.button.className, classCss.normal);

			if(styleCss && !_cbBlank(styleCss.normal)) {
				_cbSetStyle(this.button, styleCss.normal);
			}

			if (iconStyles && !_cbBlank(iconStyles.normal)) {
				_cbSetStyle(this.button, {backgroundImage : iconStyles.normal});
			}
		}
	},

	listMouseMoveHandler : function(event) {
		//changes item's decoration
		var item = event.target;
		if(item && item.matches && item.matches("span")) {
			if (item && this.tempItem != item ) {
				this.comboList.doActiveItem(item);
			}
			this.tempItem = item;
		}

	},

	listMousedownHandler : function(event) {
		//https://jira.jboss.org/jira/browse/RF-4050
		if (!_cbIsFirefox()) {
			if (!(event.target && event.target.matches && event.target.matches("span"))) {
				this.clickOnScroll = true;
			}
		}
		this.comboList.isList = true;
	},

	listMouseUpHandler : function(e) {
		this.field.focus();
		this.comboList.isList = false;
	},

	listClickHandler : function(event) {
		this.isSelection = false;
		this.setValue(true);
		this.comboList.hideWithDelay();
	},

	fieldKeyDownHandler : function(event) {
		switch (event.keyCode) {
			case 13: // KEY_RETURN
				this.setValue(true);
				this.comboList.hideWithDelay();
				if (event.preventDefault) event.preventDefault();
				if (event.stopPropagation) event.stopPropagation();
				break;
			case 40: // KEY_DOWN
				this.comboList.moveActiveItem(event);
				break;
			case 38: // KEY_UP
				this.comboList.moveActiveItem(event);
				break;
			case 27: // KEY_ESC
				this.field.value = this.field.value; //field must lose focus
				this.comboList.hideWithDelay();
				break;
		}
	},

	fieldFocusHandler : function() {
		this.doActive();
		if ((this.field.value == this.defaultLabel) && (this.comboValue.value == "")) {
			this.field.value = "";
		} else {
			if (this.isSelection) {
				Richfaces.ComboBox.textboxSelect(this.field, 0, this.field.value.length);
			}
			this.isSelection = true;
		}
	},

	fieldBlurHandler : function(event) {
		if (!this.comboList.isList) {
			this.enable();
			var value = this.field.value;
			if (value.length == 0) {
				this.applyDefaultText();
			} else {
				var item = this.comboList.findItemBySubstr(value);
				if (item) {
					this.comboList.doSelectItem(item);
				}
			}
			this.comboList.hideWithDelay();
			this.setValue(false);
		} else {
			this.doActive();
		}

		if (this.clickOnScroll) {
			//after clicking on scroll (IE)
			this.field.focus();
			this.comboList.isList = false;
			this.clickOnScroll = false;
		}
	},

	dataUpdating : function(event) {
		if (Richfaces.ComboBox.SPECIAL_KEYS.indexOf(event.keyCode) == -1) {
			if (this.filterNewValues) {
				this.comboList.hideWithDelay();
				this.comboList.dataFilter(this.field.value);
				if (this.comboList.getItems() && this.comboList.getItems().length != 0) {
					var isSearchSuccessful = true;
					this.comboList.showWithDelay();
				}
			} else {
				if (!this.comboList.visible()) {
					this.comboList.createDefaultList();
					this.comboList.showWithDelay();
				}

				var item = this.comboList.findItemBySubstr(this.field.value);
				if (item) {
					this.comboList.doActiveItem(item);
					this.comboList.scrollingUpToItem(this.comboList.activeItem);
					isSearchSuccessful = true;
				}
			}

			if (this.isValueSet(event) && isSearchSuccessful) {
				var value = this.getActiveItemValue();
				if(value && this.directInputSuggestions) {
					this.doDirectSuggestion(value);
				}
			}
			this.comboValue.value = this.field.value;
		}
	},

	getActiveItemValue: function(){
		var value;
		if (this.comboList.activeItem) {
			value = jQuery(this.comboList.activeItem).text();
			value = value.replace(/\xA0/g," ").trim();
		}
		return value;
	},

	doDirectSuggestion: function(value) {
	},

	wasTextDeleted : function(event) {
		if ((event.keyCode == 8 /* KEY_BACKSPACE */)
			|| (event.keyCode == 46 /* KEY_DELETE */)
			|| (event.ctrlKey && (event.keyCode == 88))) {
			return true;
		}
		return false;
	},

	isValueSet : function(event) {
		if (this.wasTextDeleted(event)
			|| (event.keyCode == 17)
			|| event.altKey
			|| event.ctrlKey
			|| event.shiftKey) {
			return false;
		}
		return true;
	},

	setValue : function(toSetOnly) {
		var value = this.getActiveItemValue();
		if(value && toSetOnly) {
			this.comboValue.value = value;
			this.comboList.doSelectItem(this.comboList.activeItem);
			_cbFire(this.combobox, "rich:onselect", {});
		}

		var newValue = this.comboValue.value;
		var oldValue = this.field.prevValue;

		if(newValue && (newValue != oldValue)) {
			this.field.prevValue = newValue;
			this.field.value = newValue;
			Richfaces.invokeEvent(this.onchange, this.combobox, "onchange", {value:newValue});
		} else if (newValue && (newValue != this.field.value)) {
            // https://jira.jboss.org/jira/browse/RF-8200
            this.field.value = newValue;
        }
	},

	applyDefaultText : function() {
		this.field.className = this.normalizeClasses(this.field.className, this.classes.field.classes.disabled);
		this.field.value = this.defaultLabel;
		this.comboValue.value = "";
	},

	isActive : function() {
		return (this.field.className == this.classes.field.classes.active);
	},

	doActive : function() {
		if (this.button.className.indexOf(this.classes.button.classes.hovered) != -1) {
			this.button.className = this.normalizeClasses(this.button.className, this.classes.button.classes.active + " " + this.classes.button.classes.hovered);
		} else {
			this.button.className = this.normalizeClasses(this.button.className, this.classes.button.classes.active);
		}

		var iconStyles = this.classes.buttonicon.style;
		if (!_cbBlank(iconStyles.active)) {
			_cbSetStyle(this.button, {backgroundImage:iconStyles.active});
		}

		this.field.className = this.normalizeClasses(this.field.className, this.classes.field.classes.active);
		_cbSetStyle(this.field, this.classes.field.style.active);

		this.disabled = false;
	},

	disable : function() {
		this.button.className = this.normalizeClasses(this.button.className, this.classes.button.classes.disabled);
		this.buttonBG.className = this.normalizeClasses(this.buttonBG.className, this.classes.buttonbg.classes.disabled);
		this.field.className = this.normalizeClasses(this.field.className, this.classes.field.classes.disabled);
		_cbSetStyle(this.field, this.classes.field.style.disabled);

		var styleCss =  this.classes.button.style;
		if(styleCss && !_cbBlank(styleCss.disabled)) {
			_cbSetStyle(this.button, styleCss.disabled);
		}

		var iconStyles = this.classes.buttonicon.style;
		if(iconStyles && !_cbBlank(iconStyles.disabled)) {
			_cbSetStyle(this.button, {backgroundImage : iconStyles.disabled});
		}

		this.button.disabled = true;
		this.field.disabled = true;

		this.disabled = true;
	},

	enable : function() {
		this.button.className = this.normalizeClasses(this.button.className, this.classes.button.classes.normal);
		this.buttonBG.className = this.normalizeClasses(this.buttonBG.className, this.classes.buttonbg.classes.normal);
		this.field.className = this.normalizeClasses(this.field.className, this.classes.field.classes.normal);
		var fieldStyles = this.classes.field.style.normal;
		_cbSetStyle(this.field, fieldStyles);

		var iconStyles = this.classes.buttonicon.style;
		if(!_cbBlank(iconStyles.normal)) {
			_cbSetStyle(this.button, {backgroundImage : iconStyles.normal});
		}

		var styleCss =  this.classes.button.style;
		if(styleCss && !_cbBlank(styleCss.normal)) {
			_cbSetStyle(this.button, styleCss.normal);
		}

		this.button.disabled = false;
		this.field.disabled = false;
		this.disabled = false;
	},

	doDisable : function() {
		this.disable();
	},

	doNormal : function() {
		this.enable();
	},

	getCurrentWidth : function() {
		return this.combobox.firstChild.offsetWidth;
	},

	/**
	 * user's JavaScript API
	 */
	 showList : function() {
	 	if (this.disabled) {
	 		return;
	 	}
	 	this.field.focus();
	 	this.buttonClickHandler();
	 },

	 hideList : function() {
	 	this.comboList.hideWithDelay();
	 },

	 normalizeClasses: function(oldClasses, newClasses){
		// split elenco classi attuali
		var split = oldClasses.split(' ');

		// prelevo quelle custom create per il csp
		var cls = '';
		for(var i =0; i < split.length; i++) {
			if(split[i].indexOf('-style') > -1) {
				cls += ' ';
				cls += split[i];
			}
		}

		// incollo le classi da conservare a quelle previste
		return newClasses + cls;
	}
};


Richfaces.ComboBox.textboxSelect = function(oTextbox, iStart, iEnd) {
   if (_cbIsIE()) {
       var oRange = oTextbox.createTextRange();
       oRange.moveStart("character", iStart);
       oRange.moveEnd("character", -oTextbox.value.length + iEnd);
       oRange.select();
   } else if (_cbIsGecko()) {
       oTextbox.setSelectionRange(iStart, iEnd);
   } else {
   		oTextbox.setSelectionRange(iStart, iEnd);
   }
};

Richfaces.ComboBox.getSelectedText = function(oTextbox) {
	if (window.getSelection) {
		return window.getSelection().text;
	} else if (document.selection) {
		// should come last; Opera!
		return document.selection.createRange();
	}
};

// SPECIAL_KEYS: KEY_RETURN=13, KEY_UP=38, KEY_DOWN=40, KEY_RIGHT=39, KEY_LEFT=37, KEY_ESC=27, KEY_TAB=9, 16=shift
Richfaces.ComboBox.SPECIAL_KEYS = [13, 38, 40, 39, 37, 27, 9, 16];
