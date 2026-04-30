/*
 * Modificato da Link.it (https://link.it):
 *   - Aggiunti helper condivisi `_ls*` usati dagli altri file del modulo
 *     listShuttle/orderingList (caricati dopo ShuttleUtils nel bundle
 *     ui.pack.js: SelectItem, LayoutManager, Control, ListBase, OrderingList,
 *     ListShuttle).
 *
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if (!window.RichShuttleUtils) {
	window.RichShuttleUtils = {};
}

RichShuttleUtils.execOnLoad = function(func, condition, timeout) {

	if (condition()) {
		func();
	} else {
		window.setTimeout(
			function() {
				RichShuttleUtils.execOnLoad(func, condition, timeout);
			},
			timeout
		);
	}
};
RichShuttleUtils.Condition = {
	ElementPresent : function(el) {
		return function () {
			//var el = $(element);
			return el && el.offsetHeight > 0;
		};
	}
};

Array.prototype.remove = function(object) {
	var index = this.indexOf(object, 0, this.length);
	if (index == -1) return;
	if (index == 0) {
		this.shift();
	} else {
		this.splice(index, 1);
	}
};

// --- helper Prototype-free condivisi tra i file del modulo listShuttle ---
function _lsResolve(el) { return (typeof el === 'string') ? document.getElementById(el) : el; }
function _lsObserve(el, ev, fn) { if (el && el.addEventListener) el.addEventListener(ev, fn, false); }
function _lsStopObserving(el, ev, fn) { if (el && el.removeEventListener) el.removeEventListener(ev, fn, false); }
function _lsStopEvent(e) {
	if (!e) return;
	if (e.preventDefault) e.preventDefault();
	if (e.stopPropagation) e.stopPropagation();
	e.cancelBubble = true;
	e.returnValue = false;
}
function _lsFire(el, name, memo) {
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
var _lsKey = { TAB: 9, RETURN: 13, ESC: 27, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40 };
var _lsIsIE = /MSIE|Trident/i.test(navigator.userAgent);
