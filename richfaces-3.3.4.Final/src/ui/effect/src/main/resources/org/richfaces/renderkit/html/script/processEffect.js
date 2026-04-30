/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM (Effect.* di scriptaculous resta:
 *     non e' Prototype core, e' la libreria di animazioni shippata in
 *     framework.pack.js):
 *     $(id)                     -> document.getElementById(id) (con guard per
 *                                  param.targetId che puo' essere stringa o Node)
 *     Object.extend(t, s)       -> Object.assign(t, s)
 *     bindAsEventListener(p)    -> .bind(p)
 *     Event.observe(...)        -> addEventListener(...)
 *     with(window){eval("name=function...")} -> window[options.name] = function...
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if (!window.Richfaces) {
	window.Richfaces = {};
}

Richfaces.processEffect = function(params) {
	var target = params.targetId;
	if (typeof target === 'string') target = document.getElementById(target);
	new Effect[params.type](target, params);
};

Richfaces.effectEventOnOut = function(ename) {
	return ename.substr(0,2) == 'on' ? ename.substr(2) : ename;
};

if (!Richfaces.effect) {
	Richfaces.effect={};
}

Richfaces.effect.create = function (options) {
	/*	options:
	 		event,
	 		name,
	 		targetId,
	 		attachId,
	 		attachObj,
	 		targetObj,
	 		type,
	 		params */

	if (!options) options = {};

	var params = options.params || {};
	options.params = null;

	var attachObj;
	var targetObj;
	var targetId = options.targetId;
	var attachId = options.attachId;

	if (options.attachObj) {
		try {
			attachObj = eval(options.attachObj);
		} catch (e) {}

		if (typeof attachObj == 'object') {
			attachId = attachObj;
		}
	}

	if (options.targetObj) {
		try {
			targetObj = eval(options.targetObj);
		} catch (e) {}

		if (typeof targetObj == 'object') targetId = targetObj;
	}

	if (!targetId) targetId = attachId;

	if (!params.targetId) params.targetId = targetId;
	params.type = options.type;

	if (!options.event) {
		// create user function: assegnamento esplicito sul global per evitare with/eval
		window[options.name] = function() {
			return Richfaces.processEffect(Object.assign(this, arguments[0] || {}));
		}.bind(params);
	} else {
		// attach eventListener
		var ename = Richfaces.effectEventOnOut(options.event || "");
		if (ename) {
			var bindedFunction = function(event){ return Richfaces.processEffect(this); }.bind(params);
			var attachEl = (typeof attachId === 'string') ? document.getElementById(attachId) : attachId;
			if (attachEl) {
				attachEl.addEventListener(ename, bindedFunction, params.useCapture || false);
			}
		}
	}
};
