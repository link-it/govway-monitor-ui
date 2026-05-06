/**
 * ScrollableBox.js		Date created: 6.04.2007
 * Copyright (c) 2007 Exadel Inc.
 * @author Denis Morozov <dmorozov@exadel.com>
 */
/*
 * Modificato da Link.it (https://link.it):
 *   - Class.create(parent, {...}) -> Object.create(parent.prototype) + Object.assign,
 *     $super(...) -> parent.prototype.method.call,
 *     elem.setStyle({...}) -> elem.style.* assign,
 *     Event.observe -> addEventListener,
 *     bindAsEventListener -> bind,
 *     elem.fire("name", memo) -> CustomEvent dispatch helper.
 *
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

ClientUILib.declarePackage("ClientUI.common.box.ScrollableBox");

ClientUILib.requireClass("ClientUI.common.box.Box");

// helper Prototype-free locale
function _sboxFire(el, name, memo) {
	if (!el) return null;
	var detail = memo || {};
	var ev;
	try {
		ev = new CustomEvent(name, { bubbles: true, cancelable: true, detail: detail });
	} catch (e) {
		ev = document.createEvent('CustomEvent');
		ev.initCustomEvent(name, true, true, detail);
	}
	ev.memo = detail;
	el.dispatchEvent(ev);
	return ev;
}

/**
 * This class targets to manage scrollable box object.
 */
function _CuiScrollableBox() { this.initialize.apply(this, arguments); }
_CuiScrollableBox.prototype = Object.create(ClientUI.common.box.Box.prototype);
_CuiScrollableBox.prototype.constructor = _CuiScrollableBox;
ClientUI.common.box.ScrollableBox = _CuiScrollableBox;

Object.assign(ClientUI.common.box.ScrollableBox.prototype, {

	//Constructor
	initialize: function(element, parentElement) {
		ClientUI.common.box.Box.prototype.initialize.call(this, element, parentElement);
		this.element.style.overflow = 'auto';

		this.eventOnScroll = this.scrollContent.bind(this);
		this.element.addEventListener('scroll', this.eventOnScroll);
	},
	scrollContent: function(event) {
		this.updateScrollPos();
	},
	updateScrollPos: function() {
		this.timer = null;

		// process horizontal scrolling
		if(this.scrollLeft!==this.getViewportScrollX()) {
			this.scrollLeft = this.getViewportScrollX();
			_sboxFire(this.element, "grid:onhcroll", {pos:this.getViewportScrollX()});
		}

		// process vertical scrolling
		if(this.scrollTop!==this.getViewportScrollY()) {
			this.scrollTop = this.getViewportScrollY();
			_sboxFire(this.element, "grid:onvcroll", {pos:this.getViewportScrollY()});
		}
	},
	updateLayout: function() {
		// NOTE: not implemented in this class
		ClientUI.common.box.Box.prototype.updateLayout.call(this);
	},
	getViewportScrollX: function() {
		var scrollX = 0;
		if( this.getElement().scrollLeft ) {
			scrollX = this.getElement().scrollLeft;
		}
		else if( this.getElement().pageXOffset ) {
			scrollX = this.getElement().pageXOffset;
		}
		else if( this.getElement().scrollX ) {
			scrollX = this.getElement().scrollX;
		}
		return scrollX;
	},
	getViewportScrollY: function() {
		var scrollY = 0;
		if( this.getElement().scrollTop ) {
			scrollY = this.getElement().scrollTop;
		}
		else if( this.getElement().pageYOffset ) {
			scrollY = this.getElement().pageYOffset;
		}
		else if( this.getElement().scrollY ) {
			scrollY = this.getElement().scrollY;
		}
		return scrollY;
	},
	getScrollerWidth: function() {
		if(this.scrollerWidth && this.scrollerWidth > 0)
			return this.scrollerWidth;

	    var scr = null;
	    var inn = null;
	    var wNoScroll = 0;
	    var wScroll = 0;

	    // Outer scrolling div
	    scr = document.createElement('div');
	    scr.style.position = 'absolute';
	    scr.style.top = '-1000px';
	    scr.style.left = '-1000px';
	    scr.style.width = '100px';
	    scr.style.height = '50px';
	    // Start with no scrollbar
	    scr.style.overflow = 'hidden';

	    // Inner content div
	    inn = document.createElement('div');
	    inn.style.width = '100%';
	    inn.style.height = '200px';

	    // Put the inner div in the scrolling div
	    scr.appendChild(inn);
	    // Append the scrolling div to the doc
	    document.body.appendChild(scr);

	    // Width of the inner div sans scrollbar
	    wNoScroll = inn.offsetWidth;
	    // Add the scrollbar
	    scr.style.overflow = 'auto';
	    // Width of the inner div width scrollbar
	    wScroll = inn.offsetWidth;

	    // Remove the scrolling div from the doc
	    document.body.removeChild(
	        document.body.lastChild);

	    // Pixel width of the scroller
	    this.scrollerWidth = (wNoScroll - wScroll);
	    return this.scrollerWidth || 0;
	}
});
