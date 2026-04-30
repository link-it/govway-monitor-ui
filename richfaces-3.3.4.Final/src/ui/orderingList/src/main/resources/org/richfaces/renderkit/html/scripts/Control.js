/*
 * Modificato da Link.it (https://link.it):
 *   - Class.create() -> costruttore plain.
 *
 *   La logica show/hide via classi rich-ordering-list-display-* resta
 *   gestita con jQuery come gia' nell'originale.
 *
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if(!window.Richfaces) window.Richfaces = {};

function _RichfacesControl() { this.initialize.apply(this, arguments); }
Richfaces.Control = _RichfacesControl;

Richfaces.Control.eventStub = function() {
	return false;
}

Richfaces.Control.onfocus = function(element) {
	element.hasFocus = true;
}

Richfaces.Control.onblur = function(element) {
	element.hasFocus = undefined;
}

Richfaces.Control.prototype.initialize = function(eNode, dNode, isShown, isEnabled, action) {
	this.disabledNode = dNode;
	this.disabledNode.onselectstart = Richfaces.Control.eventStub;

	this.enabledNode = eNode
	this.enabledNode.onselectstart = Richfaces.Control.eventStub;

	this.isShown = isShown;
	this.isEnabled = isEnabled;
	this.action = action;
	//this.isEnabled ? this.doEnable() : this.doDisable();
	//this.isShown ? this.doShow() : this.doHide();
}

/*Control.CLASSES = {
	first : {hidden : "ol_button_border ol_control_hidden", shown : "ol_button_border ol_control_shown"},
	down : {hidden : "ol_button_border ol_control_hidden", shown : "ol_button_border ol_control_shown"},
	up : {hidden : "ol_button_border ol_control_hidden", shown : "ol_button_border ol_control_shown"},
	last : {hidden : "ol_button_border ol_control_hidden", shown : "ol_button_border ol_control_shown"}
};*/

Richfaces.Control.prototype.doShow = function() {
	this.isShown = true;
	if (this.isEnabled) {
		this.doHideNode(this.disabledNode);
		this.doShowNode(this.enabledNode);
	} else {
		this.doHideNode(this.enabledNode);
		this.doShowNode(this.disabledNode);
	}
}

Richfaces.Control.prototype.doHide = function() {
	this.isShown = false;
	this.doHideNode(this.disabledNode);
	this.doHideNode(this.enabledNode);
}

Richfaces.Control.prototype.doEnable = function() {
	this.isEnabled = true;
	this.doHideNode(this.disabledNode);
	this.doShowNode(this.enabledNode);
}

Richfaces.Control.prototype.doDisable = function() {
	this.isEnabled = false;

	var nodes = this.enabledNode.querySelectorAll("a[id='" + this.enabledNode.id + "link']");

	var newFocusNode = undefined;

	if (nodes && nodes[0]) {
		var link = nodes[0];
		if (link.hasFocus) {
			var disNodes = this.disabledNode.querySelectorAll("a[id='" + this.disabledNode.id + "link']");
			if (disNodes && disNodes[0]) {
				newFocusNode = disNodes[0];
			}
		}
	}

	this.doHideNode(this.enabledNode);
	this.doShowNode(this.disabledNode);
	if (newFocusNode && newFocusNode.focus) {
		//For IE
		newFocusNode.disabled = false;
		newFocusNode.focus();
		//For IE
		newFocusNode.disabled = true;
	}
}

Richfaces.Control.prototype.doHideNode = function(node) {
	//node.className = Richfaces.Control.CLASSES[this.action].hidden;
	var jqNode = jQuery(node);
	jqNode.removeClass( "rich-ordering-list-display-block" ).addClass( "rich-ordering-list-display-none" );
//	node.hide();
}

Richfaces.Control.prototype.doShowNode = function(node) {
	//node.className = Richfaces.Control.CLASSES[this.action].shown;
	var jqNode = jQuery(node);
	jqNode.removeClass( "rich-ordering-list-display-none" ).addClass( "rich-ordering-list-display-block" );
//	node.show();
}


