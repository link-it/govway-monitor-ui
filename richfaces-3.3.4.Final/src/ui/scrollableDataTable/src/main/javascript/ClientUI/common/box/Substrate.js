/**
 * Substrate.js		Date created: 21.04.2007
 * Copyright (c) 2007 Exadel Inc.
 * @author Denis Morozov <dmorozov@exadel.com>
 */
/*
 * Modificato da Link.it (https://link.it):
 *   - Class.create(parent, {...}) -> Object.create(parent.prototype) +
 *     Object.assign,
 *     $super(...) -> ClientUI.common.box.Box.prototype.initialize.call(this, ...),
 *     $() -> document.getElementById/element direct.
 *
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

ClientUILib.declarePackage("ClientUI.common.box.Substrate");

ClientUILib.requireClass("ClientUI.common.box.Box");

/**
 * Base class that wraps work with inline blocks like span
 */
function _CuiSubstrate() { this.initialize.apply(this, arguments); }
_CuiSubstrate.prototype = Object.create(ClientUI.common.box.Box.prototype);
_CuiSubstrate.prototype.constructor = _CuiSubstrate;
ClientUI.common.box.Substrate = _CuiSubstrate;

Object.assign(ClientUI.common.box.Substrate.prototype, {

	initialize: function(element, parentElement, dontUpdateStyles) {
		if(!element) {
			var fakeElement = document.createElement("div");
			fakeElement.innerHTML = '<iframe id="'+'ClientUI_Substrate' + (ClientUI_common_box_Substrate_idGenerator++) +'" src="javascript:\'\'" scrolling="no" frameborder="0" style="filter:Alpha(opacity=0);position:absolute;top:0px;left:0px;display:block"></iframe>';
			element = fakeElement.getElementsByTagName("iframe")[0];
			fakeElement.removeChild(element);
      	}

		ClientUI.common.box.Box.prototype.initialize.call(this, element, parentElement, dontUpdateStyles);

		// additional styles
		if(!dontUpdateStyles) {
		}
	}
});

if(!ClientUI_common_box_Substrate_idGenerator) {
	var ClientUI_common_box_Substrate_idGenerator = 0;
};
