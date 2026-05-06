/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM:
 *       Class.create() -> costruttore plain,
 *       $() -> document.getElementById,
 *       $(el).addClassName(...) -> el.classList.add,
 *       Event.observe / stopObserving -> addEventListener / removeEventListener,
 *       Event.stop (come listener) -> _cmStopEvent (preventDefault+stopPropagation),
 *       bindAsEventListener -> Function.prototype.bind,
 *       evaluator.invoke('getContent', ctx) -> evaluator.map(m => m.getContent(ctx)),
 *       new Insertion.Top(el, html) -> el.insertAdjacentHTML('afterbegin', html).
 *
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if (!window.Richfaces) window.Richfaces = {};

// helper Prototype-free locale: bloccha l'evento default + propagazione (sostituisce
// Event.stop di Prototype usato come listener su contextmenu/click).
function _cmStopEvent(e) {
	if (!e) return;
	if (e.preventDefault) e.preventDefault();
	if (e.stopPropagation) e.stopPropagation();
	e.cancelBubble = true;
	e.returnValue = false;
}

function _RichfacesContextMenu() { this.initialize.apply(this, arguments); }
Richfaces.ContextMenu = _RichfacesContextMenu;

Richfaces.ContextMenu.prototype = {

	initialize: function(id, delay, evaluator, options) {
		this.id = id;
		this.element = document.getElementById(id);
        this.element.component = this;
		this.menuContent = null;

        this.options = options || {};
		this.evaluator = evaluator;
		this["rich:destructor"] = "destroy";

		this.doShow = this.show;
		this.doHide = this.hide;
		this.delay = delay;

        this.attachedToElementId = null;
        this.attachedTo = [];
	},

	destroy: function() {
        for (var elementId in this.attachedTo) {
            var element = document.getElementById(elementId);
            if (element) {
                var attached = this.attachedTo[elementId];
                element.removeEventListener(attached['eventName'], attached['listener'], false);
            }
        }

		this.enableDefaultContextMenu();
		this.element.component = null;
		this.element = null;
		this.menuContent = null;
        this.attachedTo = [];
	},

	disableDefaultContextMenu: function (element, id, event, attachedToPerent) {
		if (event=="oncontextmenu") {
			this.attachedToElementId = id;
			this.attachedToParent = attachedToPerent;
			this.eventName = "contextmenu";

			if (element) element.addEventListener(this.eventName, _cmStopEvent, false);
		}
	},

	enableDefaultContextMenu: function () {
		if (this.eventName == "contextmenu" && this.attachedToElementId) {
			var element = document.getElementById(this.attachedToElementId);
			if (!element && this.attachedToParent) {
				element = this.element;
				if (element) {
					element = element.parentNode;
				}
			}
			if (element) element.removeEventListener(this.eventName, _cmStopEvent, false);
		}
	},

	// attach contextMenu to element specified by id
	attachToElementById : function(id, event, context) {
		var element = document.getElementById(id);

		this.disableDefaultContextMenu(element, id, event, false);
		this.attachToElement(element, event, context);
	},

	// attach contextMenu to element specified by id
	// or to the parent fo the current element
	attachToParent : function(id, event, context) {
		var element = document.getElementById(id);
		if (!element) {
			element = this.element;
			if (element) {
				element = element.parentNode;
			}
		}
		this.disableDefaultContextMenu(element, id, event, true);
		this.attachToElement(element, event, context);
	},

	// attach contextMenu to specified element
	attachToElement : function(element, event, context) {
		if (!element) {
            return;
        }

			this.applyDecoration(element);

        var evnName = event.substr(2); //Strip 'on' here
			// http://jira.jboss.com/jira/browse/RF-3419
			if(evnName == 'contextmenu') {
				Richfaces.enableDefaultHandler('click');
			}

			// NB: in Prototype bindAsEventListener(this, context) chiama show(event,
			// context). Con .bind(this, context) di vanilla JS invece il context
			// arriverebbe come primo argomento. Uso una closure wrapper per
			// preservare la signature originale show(event, context).
			var self = this, ctx = context;
			var listener = function(event) { self.show(event, ctx); };
			element.addEventListener(evnName, listener, false);
        if (element.id) {
            this.attachedTo[element.id] = {
                'eventName' : evnName,
                'listener' : listener
            };
		}


	},

	hide: function() {
		//Stub here
		RichFaces.Menu.Layers.shutdown();
	},

	show: function(event, context) {
		this.construct(context);
		event.parameters = context;
		var delayedMenu = new RichFaces.Menu.DelayedContextMenu(this.id + "_menu", event);
		window.setTimeout(delayedMenu.show, this.delay);
	},

	construct: function(context) {
		if (this.isNewContext(context)) {
			this.destroyMenu();
		}

		var div = document.createElement("div");
		div.id = this.id + ":_auto_created";
		var jqDiv = jQuery(div);
		jqDiv.addClass( "rich-zoom-1" );
		this.element.appendChild(div);

		var html = (this.evaluator || []).map(function(m) { return m.getContent(context||{}); }).join('');
		html = this.interpolate(html, context);
		div.insertAdjacentHTML('afterbegin', html);

		// NB: insertAdjacentHTML NON esegue i tag <script> contenuti nell'HTML
		// iniettato (a differenza di Prototype Insertion.Top che chiamava
		// evalScripts). I template di htmlMenuItem.jspx contengono inline
		// <script> che wirano i click handler via jQuery(document).ready(...)
		// quindi senza eval i menu item non sono cliccabili e il menu non si
		// chiude. Riesumo manualmente gli script appena inseriti.
		var scripts = div.querySelectorAll('script');
		for (var si = 0; si < scripts.length; si++) {
			var src = scripts[si];
			try {
				var fresh = document.createElement('script');
				if (src.type) fresh.type = src.type;
				if (src.nonce) fresh.nonce = src.nonce;
				fresh.text = src.textContent;
				src.parentNode.replaceChild(fresh, src);
			} catch(_) { /* best effort */ }
		}

		this.menuContent = div;
	},

	interpolate: function (placeholders, context) {
		for(var k in context) {
			var v = context[k];
			var regexp = new RegExp("\\{" + k + "\\}", "g");
			placeholders = placeholders.replace(regexp, v);
		}
		return placeholders;
	},

	destroyMenu: function() {
		if (this.menuContent) {
			window.RichFaces.Memory.clean(this.menuContent);
			this.menuContent.parentNode.removeChild(this.menuContent);
			this.menuContent = null;
		}
	},

	isNewContext: function(context) {
		//TODO: Check whether contexts are the same and therefore
		// do not destroy menu
		//var oldContext = this.context || {};
		return true;
	},

	applyDecoration : function(element) {
		if (element && element.classList) element.classList.add("rich-cm-attached");
	}
};

Richfaces.disableDefaultHandler = function(event) {
	if (event.startsWith('on')) {
		event = event.substr(2);
	}
	document.addEventListener(event, _cmStopEvent, false);
};

Richfaces.enableDefaultHandler = function(event) {
	if (event.startsWith('on')) {
	event = event.substr(2);
	}
	document.removeEventListener(event, _cmStopEvent, false);
};
