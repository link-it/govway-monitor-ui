/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM:
 *     Class.create({...})         -> costruttore + .prototype plain
 *     $(id)                       -> document.getElementById(id)
 *     Event.observe(el,name,fn)   -> el.addEventListener(name, fn)
 *     Event.fire(el, name, memo)  -> CustomEvent + dispatchEvent.
 *   Importante: il renderer Java emette inline come handler
 *      function(event) { ...; event.memo.page; ... }
 *   quindi l'oggetto evento ricevuto dal listener deve avere `.memo`.
 *   Su CustomEvent moderno l'analogo e' `.detail`; per retro-compat con il
 *   codice generato dal renderer, qui impostiamo manualmente anche `.memo`
 *   sulla CustomEvent prima di dispatcharla.
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if (!window.Richfaces) {
	window.Richfaces = {};
}

Richfaces.DatascrollerScrollEvent = "rich:datascroller:onscroll";

function _richfacesDatascrollerFire(element, eventName, memo) {
	var ev;
	if (typeof CustomEvent === "function") {
		ev = new CustomEvent(eventName, { detail: memo, bubbles: true, cancelable: true });
	} else {
		ev = document.createEvent("Event");
		ev.initEvent(eventName, true, true);
	}
	// retro-compat con codice generato dal renderer (event.memo.page).
	ev.memo = memo;
	element.dispatchEvent(ev);
	return ev;
}

function Datascroller(clientId, submitFunction) {
	this.initialize(clientId, submitFunction);
}

Richfaces.Datascroller = Datascroller;

// Helper invocato dagli onclick inline emessi da DataScrollerRenderer.getOnClick
// (Java side). Sostituisce la vecchia chiamata `Event.fire(this, name, memo)`
// di Prototype, che dispatchava un evento DOM 'dataavailable' (non intercettato
// dal listener addEventListener moderno).
Richfaces.Datascroller.fire = function(element, page) {
	_richfacesDatascrollerFire(element, Richfaces.DatascrollerScrollEvent, {'page': page});
};

Datascroller.prototype = {
	initialize: function(clientId, submitFunction) {
		this.element = document.getElementById(clientId);
		this.element.component = this;

		this["rich:destructor"] = "destroy";

		this.element.addEventListener(Richfaces.DatascrollerScrollEvent, submitFunction);
	},

	destroy: function() {
		this.element.component = undefined;
		this.element = undefined;
	},

	switchToPage: function(page) {
		if (typeof page != 'undefined' && page != null) {
			_richfacesDatascrollerFire(this.element, Richfaces.DatascrollerScrollEvent, {'page': page});
		}
	},

	next: function() {
		this.switchToPage("next");
	},

	previous: function() {
		this.switchToPage("previous");
	},

	first: function() {
		this.switchToPage("first");
	},

	last: function() {
		this.switchToPage("last");
	},

	fastForward: function() {
		this.switchToPage("fastforward");
	},

	fastRewind: function() {
		this.switchToPage("fastrewind");
	}
};
