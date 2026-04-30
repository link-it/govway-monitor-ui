/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM:
 *       Class.create / Object.extend -> costruttore + Object.assign,
 *       $() -> document.getElementById,
 *       bindAsEventListener -> Function.prototype.bind,
 *       Event.observe -> addEventListener.
 *
 *   La classe parent DnD.Dropzone resta basata su Prototype: questo modulo
 *   deve solo non introdurre nuova dipendenza, non sostituirla.
 *
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

function _DnDExtSimpleDropZone() { this.initialize.apply(this, arguments); }
_DnDExtSimpleDropZone.prototype = Object.create(DnD.Dropzone.prototype);
_DnDExtSimpleDropZone.prototype.constructor = _DnDExtSimpleDropZone;
DnD.ExtSimpleDropZone = _DnDExtSimpleDropZone;

Object.assign(DnD.ExtSimpleDropZone.prototype, {
	initialize: function(id, options) {
		this.id = id;
		var element = document.getElementById(id);

		if (!element) {
			alert("drop: Element with [" + id + "] ID was not found in the DOM tree. Probably element has no client ID or client ID hasn't been written. DnD's disabled. Check please!");
			return ;
		}

		this.element = element;
		if (options.acceptedTypes) {
			this.acceptedTypes = options.acceptedTypes;
		} else {
			this.acceptedTypes = [];
		}

		if (options.typeMapping) {
			this.typeMapping = options.typeMapping;
		} else {
			this.typeMapping = {};
		}

		if (options.cursorTypeMapping) {
			this.cursorTypeMapping = options.cursorTypeMapping;
		} else {
			this.cursorTypeMapping = {};
		}

		this.mouseoverBound = this.mouseover.bind(this);
		this.mouseoutBound = this.mouseout.bind(this);
		this.mouseupBound = this.mouseup.bind(this);

		element.addEventListener("mouseover", this.mouseoverBound);
		element.addEventListener("mouseout", this.mouseoutBound);
		element.addEventListener("mouseup", this.mouseupBound);




		this.options = options || {};
		this.enableDropzoneCursors(options.acceptCursor,options.rejectCursor);

	},

	getDropzoneOptions: function() {
		return this.options;
	},

	getDnDDropParams: function() {
		if (this.options.dndParams) {
			return this.options.dndParams.parseJSON(EventHandlersWalk);
		}

		return null;
	},

	mouseover: function(event) {
		if (window.drag){
			this.dragEnter(event);
			//change dropzone style
			this.element.childNodes[0].style.visibility="visible";//top element
			this.element.childNodes[1].style.visibility="visible";//bottom element
		}
	},

	mouseup: function(event) {
		this.dragUp(event);
	},

	mouseout: function(event) {
		if (window.drag){
			this.dragLeave(event);
			//change dropzone style
			this.element.childNodes[0].style.visibility="hidden";//top element
			this.element.childNodes[1].style.visibility="hidden";//bottom element
		}
	},
	getAcceptedTypes: function() {
		return this.acceptedTypes;
	},
	getTypeMapping: function() {
		return this.typeMapping;
	},

	getCursorTypeMapping: function() {
		return this.cursorTypeMapping;
	},

	drop: function(event, drag){
		alert('I drop');
	},
	onafterdrag: function(drag) {
		if (this.options.onafterdrag) {
			this.options.onafterdrag.call(this, drag);
		}
	}
});
