/**
 * Box.js		Date created: 6.04.2007
 * Copyright (c) 2007 Exadel Inc.
 * @author Denis Morozov <dmorozov@exadel.com>
 */
/*
 * Modificato da Link.it (https://link.it):
 *   - Class.create({...}) -> costruttore plain + Object.assign,
 *     $() -> document.getElementById,
 *     elem.setStyle({...}) -> Object.assign(elem.style, {...}),
 *     elem.getStyle(p) -> getComputedStyle(elem).getPropertyValue(p),
 *     Element.show / hide -> style.display = '' / 'none',
 *     Position.absolutize -> rimosso (mai chiamato con keepPos=true nel codebase
 *     residuo; in caso fallback su style.position='absolute').
 *
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

ClientUILib.declarePackage("ClientUI.common.box.Box");


/*
 * Base class for all ui controls
 */
function _CuiBox() { this.initialize.apply(this, arguments); }
ClientUI.common.box.Box = _CuiBox;

// helper Prototype-free locale al modulo
function _boxResolve(el) { return (typeof el === 'string') ? document.getElementById(el) : el; }
function _boxSetStyle(el, styles) {
	if (!el || !styles) return;
	for (var k in styles) {
		if (Object.prototype.hasOwnProperty.call(styles, k)) el.style[k] = styles[k];
	}
}

ClientUI.common.box.Box.prototype = {

	initialize: function(element, parentElement, dontUpdateStyles) {
		this.element = _boxResolve(element);
		if(!this.element) {
			this.element = document.createElement("div");
			var p = _boxResolve(parentElement);
			if(p) {
      			p.appendChild(this.element);
			}
      		else {
	      		document.body.appendChild(this.element);
      		}
      	}
		//http://jira.jboss.com/jira/browse/RF-2068
		//this.element.wrapper = this;
		if(!this.element.parentNode && _boxResolve(parentElement)) {
			_boxResolve(parentElement).appendChild(this.element);
		}

      	if(!this.element.id) {
			this.element.id = "ClientUI_Box" + ClientUI_common_box_Box_idGenerator++;
		}
		if(!dontUpdateStyles) {
	      	_boxSetStyle(this.element, {overflow: 'hidden'});
	      	_boxSetStyle(this.element, {whiteSpace: 'nowrap'});
		}
	},

	setParent: function(newParent) {
		if(this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}
		if(newParent) {
			if(newParent.getElement) {
				newParent = newParent.getElement();
			}
			_boxResolve(newParent).appendChild(this.element);
		}
		return this;
	},
	getElement: function() {
		return this.element;
	},
	getHeight: function() {
		var el = this.getElement();
		if(el.tagName.toLowerCase() != "body") {
			var h = el.offsetHeight;
			return h>0 ? h : (this.element.boxHeight ? parseInt(this.element.boxHeight) : 0);
		}

		if (self.innerHeight) { // all except Explorer
			return self.innerHeight;
		}
		else if (document.documentElement && document.documentElement.clientHeight) {
			// Explorer 6 Strict Mode
			return document.documentElement.clientHeight;
		}
		else if (document.body) { // other Explorers
			return document.body.clientHeight;
		}
	},
	isModified: false,
	setHeight: function(newHeight) {
		this.element.boxHeight = newHeight;
		if(Validators.IsNumber(newHeight)) {
			if(newHeight<0) newHeight = 0;
			newHeight += "px";
		}
		_boxSetStyle(this.element, {height: newHeight});
		isModified = true;
		return this;
	},
	getWidth: function() {
		var el = this.getElement();
		if(el.tagName.toLowerCase() != "body") {
			var w = el.offsetWidth;
			return w>0 ? w : (this.element.boxWidth ? parseInt(this.element.boxWidth) : 0);
		}

		if (self.innerHeight) {// all except Explorer
			return self.innerWidth;
		}
		else if (document.documentElement && document.documentElement.clientHeight) {
			// Explorer 6 Strict Mode
			return document.documentElement.clientWidth;
		}
		else if (document.body) { // other Explorers
			return document.body.clientWidth;
		}
	},
	setWidth: function(newWidth) {
		this.element.boxWidth = newWidth;
		if(Validators.IsNumber(newWidth)) {
			if(newWidth<0) newWidth = 0;
			newWidth += "px";
		}
		_boxSetStyle(this.element, {width: newWidth});
		isModified = true;
		return this;
	},
	moveToX: function(x) {
		if(Validators.IsNumber(x)) {x += "px";}
		_boxSetStyle(this.getElement(), {left: x});
		isModified = true;
		return this;
	},
	moveToY: function(y) {
		if(Validators.IsNumber(y)) {y += "px";}
		_boxSetStyle(this.getElement(), {top: y});
		isModified = true;
		return this;
	},
	moveTo: function(x, y) {
		this.moveToX(x);
		this.moveToY(y);
		return this;
	},
	hide: function() {
		this.element.style.display = 'none';
		isModified = true;
		return this;
	},
	show: function() {
		this.element.style.display = '';
		isModified = true;
		return this;
	},
	updateLayout: function() {
		isModified = false;
		return this;
	},
	getViewportWidth: function() {
		if(this.getElement().tagName.toLowerCase() != "body") {
			var width = 0;
			if( this.getElement().clientWidth ) {
			    width = this.getElement().clientWidth;
			}
			else if( this.getElement().innerWidth ) {
			    width = this.getElement().innerWidth - getScrollerWidth();
			}

			if(ClientUILib.isGecko) {
			  	width -= this.getPadding("lr");
			}
			return width;
		}

		return this.getWidth();
	},
	getViewportHeight: function() {
		if(this.getElement().tagName.toLowerCase() != "body") {
			var height = 0;
			if( this.getElement().clientHeight ) {
			    height = this.getElement().clientHeight;
			}
			else if( this.getElement().innerHeight ) {
			    height = this.getElement().innerHeight - getScrollerWidth();
			}

			if(ClientUILib.isGecko) {
			  	height -= this.getPadding("tb");
			}
			return height;
		}
		return this.getHeight();
	},
	/**
     * Gets the width of the border(s) for the specified side(s)
     */
    getBorderWidth : function(side){
        return this.getStyles(side, this.borders);
    },

    /**
     * Gets the width of the padding(s) for the specified side(s)
     */
    getPadding : function(side){
        return this.getStyles(side, this.paddings);
    },
	getStyles : function(sides, styles){
        var el = this.getElement();
        var cs = el ? window.getComputedStyle(el) : null;
        var val = 0;
        for(var i = 0, len = sides.length; i < len; i++){
             var w = parseInt(cs ? cs.getPropertyValue(styles[sides.charAt(i)]) : '', 10);
             if(!isNaN(w)) val += w;
        }
        return val;
    },
	makeAbsolute: function(keepPos) {
		// Modificato da Link.it: Position.absolutize (Prototype) non e' piu'
		// disponibile. Nessun consumer del codebase residuo passa keepPos=true,
		// quindi fallback su style.position = 'absolute'.
		_boxSetStyle(this.getElement(), {position: 'absolute'});
		return this;
	},
	getX: function() {
		return this.getElement().offsetLeft;
	},
	getY: function() {
		return this.getElement().offsetTop;
	},
	setStyle: function(style) {
		// API ammessa: stringa cssText oppure object {prop: value}.
		var el = this.getElement();
		if (el) {
			if (typeof style === 'string') {
				el.style.cssText += ';' + style;
			} else {
				_boxSetStyle(el, style);
			}
		}
		return this;
	},

	borders: {l: 'border-left-width', r: 'border-right-width', t: 'border-top-width', b: 'border-bottom-width'},
	paddings: {l: 'padding-left', r: 'padding-right', t: 'padding-top', b: 'padding-bottom'},
	margins: {l: 'margin-left', r: 'margin-right', t: 'margin-top', b: 'margin-bottom'}

};

if(!ClientUI_common_box_Box_idGenerator) {
var ClientUI_common_box_Box_idGenerator = 0;
};
