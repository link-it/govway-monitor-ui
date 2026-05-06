/**
 * InlineBox.js		Date created: 6.04.2007
 * Copyright (c) 2007 Exadel Inc.
 * @author Denis Morozov <dmorozov@exadel.com>
 */
/*
 * Modificato da Link.it (https://link.it):
 *   - Class.create(parent, {...}) -> Object.create(parent.prototype) + Object.assign,
 *     $super(...) -> parent.prototype.initialize.call,
 *     $() -> document.getElementById/element direct.
 *
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

ClientUILib.declarePackage("ClientUI.common.box.InlineBox");

ClientUILib.requireClass("ClientUI.common.box.Box");

/**
 * Base class that wraps work with inline blocks like span
 */
function _CuiInlineBox() { this.initialize.apply(this, arguments); }
_CuiInlineBox.prototype = Object.create(ClientUI.common.box.Box.prototype);
_CuiInlineBox.prototype.constructor = _CuiInlineBox;
ClientUI.common.box.InlineBox = _CuiInlineBox;

Object.assign(ClientUI.common.box.InlineBox.prototype, {

	initialize: function(element, parentElement, dontUpdateStyles) {
		if(!element) {
			element = document.createElement("span");
			var p = (typeof parentElement === 'string') ? document.getElementById(parentElement) : parentElement;
			if(p) {
      			p.appendChild(element);
			}
      		else {
	      		document.body.appendChild(element);
      		}
      	}
      	if(!element.id) {
			element.id = "ClientUI_InlineBox" + ClientUI_common_box_InlineBox_idGenerator++;
		}

		ClientUI.common.box.Box.prototype.initialize.call(this, element, parentElement, dontUpdateStyles);

		// additional styles
		if(!dontUpdateStyles) {
			this.element.style.display = 'block';
		}
	}
});

if(!ClientUI_common_box_InlineBox_idGenerator) {
	var ClientUI_common_box_InlineBox_idGenerator = 0;
};
