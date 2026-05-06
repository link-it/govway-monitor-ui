/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM:
 *       Object.extend -> Object.assign,
 *       Event.observe / stopObserving -> addEventListener / removeEventListener,
 *       Event.element -> e.target,
 *       $() -> document.getElementById,
 *       document.observe("dom:loaded", ...) -> addEventListener("DOMContentLoaded", ...).
 *   Rimosso il check iniziale `if (!document.observe) throw "prototype.js is required"`:
 *   ora il modulo usa solo DOM standard.
 *
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if (!A4J || !A4J.AJAX || !A4J.AJAX.AddListener) {
	throw "AJAX script is required!";
}

if (!window.Richfaces) {
	window.Richfaces = {};
}

Object.assign(Richfaces, function() {
	var _queueLength = 0;
	var _available = {};
	var _pollingActivated = false;

	var _lastEltId = null;

	var executeCallback = function(elt, callbacks) {
		if (callbacks instanceof Array) {
			for (var i = 0; i < callbacks.length; i++) {
				callbacks[i](elt);
			}
		} else {
			callbacks(elt);
		}
	};

	var stopPolling = function() {
		if (_pollingActivated) {
			document.removeEventListener("mouseover", onEvent, true);
			document.removeEventListener("focus", onEvent, true);
			document.removeEventListener("focusin", onEvent, true);

			_pollingActivated = false;
			_lastEltId = null;
		}
	}

	var onEvent = function(event) {
		var elt = event.target || event.srcElement;
		while (elt) {
			var id = elt.id;
			if (id) {
				if (!_lastEltId) {
					_lastEltId = id;
				} else if (_lastEltId == id) {
					//we can stop now because elements queue hasn't changed since we've checked this element
					break;
				}

				var callbacks = _available[id];
				if (callbacks) {
					try {
						executeCallback(elt, callbacks);
					} catch (e) {
						cleanup();
						throw e;
					}

					delete _available[id];
					if (--_queueLength == 0) {
						stopPolling();
						//done all elements for now
						break;
					}
				}
			}

			elt = elt.parentNode;
		}
	};

	var activatePolling = function() {
		if (!_pollingActivated) {
			document.addEventListener("mousemove", onEvent, true);
			document.addEventListener("focus", onEvent, true);
			document.addEventListener("focusin", onEvent, true);

			_pollingActivated = true;
		}
	};

	var cleanup = function() {
		try {
			stopPolling();
			_queueLength = 0;
			_available = {};
		} catch (e) {
			LOG.error("Error occured during cleanup: " + e);
		}
	};


	var onReady = function() {
		try {
			for (var id in _available) {
				var elt = document.getElementById(id);
				if (elt) {
					executeCallback(elt, _available[id]);
				} else {
					LOG.error("Element with id = " + id + " hasn't been found!");
				}
			}
		} finally {
			cleanup();
		}
	};

	var onAvailable = function(eltId, callback) {
		var elt = document.getElementById(eltId);
		if (elt) {
			callback(elt);
		} else {
			var a = _available[eltId];
			if (!a) {
				_available[eltId] = callback;

				//reset cached element because we've just changed the queue
				_lastEltId = null;

				_queueLength++;
				activatePolling();
			} else {
				if (a instanceof Array) {
					a.push(callback)
				} else {
					var ar = new Array();
					ar.push(a);
					ar.push(callback);
					_available[eltId] = ar;
				}
			}
		}
	};

	A4J.AJAX.AddListener(onReady);
	if (document.readyState === 'loading') {
		document.addEventListener("DOMContentLoaded", onReady);
	} else {
		// DOM gia' pronto
		onReady();
	}

	return {
		onAvailable: onAvailable
	};
}());
