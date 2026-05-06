// script.aculo.us effects.js v1.8.2, Tue Nov 18 18:30:58 +0100 2008

// Copyright (c) 2005-2008 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
// Contributors:
//  Justin Palmer (http://encytemedia.com/)
//  Mark Pilgrim (http://diveintomark.org/)
//  Martin Bialasinki
//
// script.aculo.us is freely distributable under the terms of an MIT-style license.
// For details, see the script.aculo.us web site: http://script.aculo.us/

/*
 * Modificato da Link.it (https://link.it):
 *   - Riscrittura SLIM da Prototype a vanilla DOM. La versione originale era
 *     ~1283 righe e definiva decine di effetti (Move, Scale, Puff, Blind*,
 *     Slide*, Switch*, DropOut, Shake, Pulsate, Squish, Fold, Morph, Transform,
 *     ScrollTo, tagifyText, Methods, Element extensions). Sono stati mantenuti
 *     SOLO gli effetti effettivamente usati dai componenti inclusi nel bundle:
 *     Effect.Appear, Effect.Fade, Effect.AppearCheckClass[es],
 *     Effect.FadeCheckClass[es] (tutti via Effect.Opacity) e Effect.Highlight.
 *     Il resto e' stato eliminato.
 *
 *   - Pattern: Class.create / Object.extend / Enumerable / $A / $H /
 *     bindAsEventListener / Element extensions sostituiti con costruttori
 *     plain + Object.assign + helper Prototype-free locali (_eff*).
 *
 *   - String.prototype.parseColor mantenuto come metodo locale (_effParseColor)
 *     anziche' inquinare String.prototype.
 *
 *   - Mantenute le patch Link.it AppearCheckClass[es] / FadeCheckClass[es]
 *     usate da suggestionbox / calendar / processEffect (queste switchano
 *     classi CSS tra rich-...-display-none/block invece di toccare
 *     style.display direttamente).
 *
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 * Distribuito sotto la stessa licenza MIT di scriptaculous.
 */

// --- helper Prototype-free locali al modulo ---
function _effResolve(el) { return (typeof el === 'string') ? document.getElementById(el) : el; }

function _effGetStyle(el, prop) {
	if (!el) return null;
	var cs = window.getComputedStyle(el);
	return cs ? cs.getPropertyValue(prop) : null;
}

function _effSetStyle(el, styles) {
	if (!el || !styles) return el;
	for (var k in styles) {
		if (Object.prototype.hasOwnProperty.call(styles, k)) {
			// camelCase / kebab-case mix: Element.setStyle accettava entrambe.
			el.style[k] = styles[k];
		}
	}
	return el;
}

function _effGetOpacity(el) {
	if (!el) return null;
	var op = _effGetStyle(el, 'opacity');
	if (op === '' || op == null) return null;
	var n = parseFloat(op);
	return isNaN(n) ? null : n;
}

function _effGetInlineOpacity(el) {
	return (el && el.style && el.style.opacity) || '';
}

function _effSetOpacity(el, value) {
	if (!el) return el;
	if (value == 1 || value === '') {
		el.style.opacity = '';
	} else {
		if (value < 0.00001) value = 0;
		el.style.opacity = value;
	}
	return el;
}

function _effHide(el) { if (el) el.style.display = 'none'; return el; }
function _effShow(el) { if (el) el.style.display = ''; return el; }

function _effForceRerendering(el) {
	try {
		if (!el) return;
		var n = document.createTextNode(' ');
		el.appendChild(n);
		el.removeChild(n);
	} catch (e) { }
}

function _effToColorPart(n) {
	n = parseInt(n, 10);
	if (isNaN(n)) n = 0;
	if (n < 0) n = 0; else if (n > 255) n = 255;
	var s = n.toString(16);
	return s.length == 1 ? '0' + s : s;
}

// converts rgb()/#xxx to #xxxxxx; returns fallback if unrecognized
function _effParseColor(s, fallback) {
	if (!s) return fallback || s;
	s = String(s);
	var color = '#';
	if (s.slice(0, 4) == 'rgb(') {
		var cols = s.slice(4, s.length - 1).split(',');
		for (var i = 0; i < 3; i++) color += _effToColorPart(cols[i]);
	} else if (s.charAt(0) == '#') {
		if (s.length == 4) {
			for (var j = 1; j < 4; j++) color += (s.charAt(j) + s.charAt(j)).toLowerCase();
		} else if (s.length == 7) {
			color = s.toLowerCase();
		}
	}
	return color.length == 7 ? color : (fallback || s);
}

/*--------------------------------------------------------------------------*/

var Effect = {
	_elementDoesNotExistError: {
		name: 'ElementDoesNotExistError',
		message: 'The specified DOM element does not exist, but is required for this effect to operate'
	},
	Transitions: {
		linear: function(x) { return x; },
		sinoidal: function(pos) {
			return (-Math.cos(pos * Math.PI) / 2) + 0.5;
		},
		reverse: function(pos) {
			return 1 - pos;
		},
		flicker: function(pos) {
			pos = ((-Math.cos(pos * Math.PI) / 4) + 0.75) + Math.random() / 4;
			return pos > 1 ? 1 : pos;
		},
		wobble: function(pos) {
			return (-Math.cos(pos * Math.PI * (9 * pos)) / 2) + 0.5;
		},
		pulse: function(pos, pulses) {
			return (-Math.cos((pos * ((pulses || 5) - 0.5) * 2) * Math.PI) / 2) + 0.5;
		},
		spring: function(pos) {
			return 1 - (Math.cos(pos * 4.5 * Math.PI) * Math.exp(-pos * 6));
		},
		none: function(pos) { return 0; },
		full: function(pos) { return 1; }
	},
	DefaultOptions: {
		duration: 1.0,
		fps:      100,
		sync:     false,
		from:     0.0,
		to:       1.0,
		delay:    0.0,
		queue:    'parallel'
	}
};

Effect.DefaultOptions.transition = Effect.Transitions.sinoidal;

/* ------------- core: ScopedQueue / Queues / Queue ------------- */

function _EffectScopedQueue() { this.initialize.apply(this, arguments); }
Effect.ScopedQueue = _EffectScopedQueue;
Object.assign(_EffectScopedQueue.prototype, {
	initialize: function() {
		this.effects = [];
		this.interval = null;
	},
	add: function(effect) {
		var timestamp = new Date().getTime();
		var queueOpt = effect.options.queue;
		var position = (typeof queueOpt === 'string') ? queueOpt : queueOpt.position;

		switch (position) {
			case 'front':
				this.effects.filter(function(e) { return e.state == 'idle'; }).forEach(function(e) {
					e.startOn  += effect.finishOn;
					e.finishOn += effect.finishOn;
				});
				break;
			case 'with-last':
				timestamp = this.effects.reduce(function(m, e) { return Math.max(m, e.startOn); }, 0) || timestamp;
				break;
			case 'end':
				timestamp = this.effects.reduce(function(m, e) { return Math.max(m, e.finishOn); }, 0) || timestamp;
				break;
		}

		effect.startOn  += timestamp;
		effect.finishOn += timestamp;

		if (!effect.options.queue.limit || (this.effects.length < effect.options.queue.limit)) {
			this.effects.push(effect);
		}

		if (!this.interval) {
			var self = this;
			this.interval = setInterval(function() { self.loop(); }, 15);
		}
	},
	remove: function(effect) {
		this.effects = this.effects.filter(function(e) { return e != effect; });
		if (this.effects.length == 0) {
			clearInterval(this.interval);
			this.interval = null;
		}
	},
	loop: function() {
		var timePos = new Date().getTime();
		for (var i = 0, len = this.effects.length; i < len; i++) {
			if (this.effects[i]) this.effects[i].loop(timePos);
		}
	}
});

Effect.Queues = {
	instances: {},
	get: function(queueName) {
		if (typeof queueName !== 'string') return queueName;
		if (!this.instances[queueName]) {
			this.instances[queueName] = new Effect.ScopedQueue();
		}
		return this.instances[queueName];
	}
};
Effect.Queue = Effect.Queues.get('global');

/* ------------- core: Effect.Base ------------- */

function _EffectBase() { /* sub-classes call this.start(...) directly */ }
Effect.Base = _EffectBase;
Object.assign(_EffectBase.prototype, {
	position: null,
	start: function(options) {
		if (options && options.transition === false) options.transition = Effect.Transitions.linear;
		this.options      = Object.assign({}, Effect.DefaultOptions, options || {});
		this.currentFrame = 0;
		this.state        = 'idle';
		this.startOn      = this.options.delay * 1000;
		this.finishOn     = this.startOn + (this.options.duration * 1000);
		this.fromToDelta  = this.options.to - this.options.from;
		this.totalTime    = this.finishOn - this.startOn;
		this.totalFrames  = this.options.fps * this.options.duration;

		var self = this;
		this.render = function(pos) {
			if (self.state === 'idle') {
				self.state = 'running';
				self.event('beforeSetup');
				if (self.setup) self.setup();
				self.event('afterSetup');
			}
			if (self.state === 'running') {
				pos = (self.options.transition(pos) * self.fromToDelta) + self.options.from;
				self.position = pos;
				self.event('beforeUpdate');
				if (self.update) self.update(pos);
				self.event('afterUpdate');
			}
		};

		this.event('beforeStart');
		if (!this.options.sync) {
			Effect.Queues.get(typeof this.options.queue === 'string'
				? 'global' : this.options.queue.scope).add(this);
		}
	},
	loop: function(timePos) {
		if (timePos >= this.startOn) {
			if (timePos >= this.finishOn) {
				this.render(1.0);
				this.cancel();
				this.event('beforeFinish');
				if (this.finish) this.finish();
				this.event('afterFinish');
				return;
			}
			var pos = (timePos - this.startOn) / this.totalTime;
			var frame = Math.round(pos * this.totalFrames);
			if (frame > this.currentFrame) {
				this.render(pos);
				this.currentFrame = frame;
			}
		}
	},
	cancel: function() {
		if (!this.options.sync) {
			Effect.Queues.get(typeof this.options.queue === 'string'
				? 'global' : this.options.queue.scope).remove(this);
		}
		this.state = 'finished';
	},
	event: function(eventName) {
		if (this.options[eventName + 'Internal']) this.options[eventName + 'Internal'](this);
		if (this.options[eventName]) this.options[eventName](this);
	}
});

/* ------------- Effect.Parallel ------------- */

function _EffectParallel() { this.initialize.apply(this, arguments); }
_EffectParallel.prototype = Object.create(Effect.Base.prototype);
_EffectParallel.prototype.constructor = _EffectParallel;
Effect.Parallel = _EffectParallel;
Object.assign(_EffectParallel.prototype, {
	initialize: function(effects) {
		this.effects = effects || [];
		this.start(arguments[1]);
	},
	update: function(position) {
		this.effects.forEach(function(e) { e.render(position); });
	},
	finish: function(position) {
		this.effects.forEach(function(effect) {
			effect.render(1.0);
			effect.cancel();
			effect.event('beforeFinish');
			if (effect.finish) effect.finish(position);
			effect.event('afterFinish');
		});
	}
});

/* ------------- Effect.Tween ------------- */

function _EffectTween() { this.initialize.apply(this, arguments); }
_EffectTween.prototype = Object.create(Effect.Base.prototype);
_EffectTween.prototype.constructor = _EffectTween;
Effect.Tween = _EffectTween;
Object.assign(_EffectTween.prototype, {
	initialize: function(object, from, to) {
		var args = Array.prototype.slice.call(arguments);
		var method = args[args.length - 1];
		var options = args.length == 5 ? args[3] : null;
		var resolved = (typeof object === 'string') ? _effResolve(object) : object;
		if (typeof method === 'function') {
			this.method = method.bind(resolved);
		} else if (resolved && typeof resolved[method] === 'function') {
			this.method = resolved[method].bind(resolved);
		} else {
			this.method = function(value) { resolved[method] = value; };
		}
		this.start(Object.assign({ from: from, to: to }, options || {}));
	},
	update: function(position) {
		this.method(position);
	}
});

/* ------------- Effect.Event ------------- */

function _EffectEvent() { this.initialize.apply(this, arguments); }
_EffectEvent.prototype = Object.create(Effect.Base.prototype);
_EffectEvent.prototype.constructor = _EffectEvent;
Effect.Event = _EffectEvent;
Object.assign(_EffectEvent.prototype, {
	initialize: function() {
		this.start(Object.assign({ duration: 0 }, arguments[0] || {}));
	},
	update: function() { /* no-op */ }
});

/* ------------- Effect.Opacity (base for Appear/Fade) ------------- */

function _EffectOpacity() { this.initialize.apply(this, arguments); }
_EffectOpacity.prototype = Object.create(Effect.Base.prototype);
_EffectOpacity.prototype.constructor = _EffectOpacity;
Effect.Opacity = _EffectOpacity;
Object.assign(_EffectOpacity.prototype, {
	initialize: function(element) {
		this.element = _effResolve(element);
		if (!this.element) throw(Effect._elementDoesNotExistError);
		// Modificato da Link.it: garantisco che element abbia metodi setOpacity/
		// hide/show/setStyle/getStyle anche se non e' Prototype-extended.
		_effInjectMethods(this.element);
		var options = Object.assign({
			from: _effGetOpacity(this.element) || 0.0,
			to:   1.0
		}, arguments[1] || {});
		this.start(options);
	},
	update: function(position) {
		_effSetOpacity(this.element, position);
	}
});

/* ------------- Effect.Highlight ------------- */

function _EffectHighlight() { this.initialize.apply(this, arguments); }
_EffectHighlight.prototype = Object.create(Effect.Base.prototype);
_EffectHighlight.prototype.constructor = _EffectHighlight;
Effect.Highlight = _EffectHighlight;
Object.assign(_EffectHighlight.prototype, {
	initialize: function(element) {
		this.element = _effResolve(element);
		if (!this.element) throw(Effect._elementDoesNotExistError);
		_effInjectMethods(this.element);
		var options = Object.assign({ startcolor: '#ffff99' }, arguments[1] || {});
		this.start(options);
	},
	setup: function() {
		// Prevent executing on elements not in the layout flow
		if (_effGetStyle(this.element, 'display') == 'none') { this.cancel(); return; }
		// Disable background image during the effect
		this.oldStyle = {};
		if (!this.options.keepBackgroundImage) {
			this.oldStyle.backgroundImage = _effGetStyle(this.element, 'background-image');
			_effSetStyle(this.element, { backgroundImage: 'none' });
		}
		if (!this.options.endcolor) {
			this.options.endcolor = _effParseColor(_effGetStyle(this.element, 'background-color'), '#ffffff');
		}
		if (!this.options.restorecolor) {
			this.options.restorecolor = _effGetStyle(this.element, 'background-color');
		}
		// Init color calculations: start/end colors come as #rrggbb.
		var sc = _effParseColor(this.options.startcolor, '#ffff99');
		var ec = _effParseColor(this.options.endcolor, '#ffffff');
		this._base  = [parseInt(sc.slice(1,3),16), parseInt(sc.slice(3,5),16), parseInt(sc.slice(5,7),16)];
		this._delta = [parseInt(ec.slice(1,3),16) - this._base[0],
		               parseInt(ec.slice(3,5),16) - this._base[1],
		               parseInt(ec.slice(5,7),16) - this._base[2]];
	},
	update: function(position) {
		var bg = '#';
		for (var i = 0; i < 3; i++) {
			bg += _effToColorPart(Math.round(this._base[i] + (this._delta[i] * position)));
		}
		_effSetStyle(this.element, { backgroundColor: bg });
	},
	finish: function() {
		_effSetStyle(this.element, Object.assign(this.oldStyle, {
			backgroundColor: this.options.restorecolor
		}));
	}
});

/* ------------- combination effects: Fade / Appear (+ CheckClass[es] patches) ------------- */

Effect.Fade = function(element) {
	element = _effResolve(element);
	_effInjectMethods(element);
	var oldOpacity = _effGetInlineOpacity(element);
	var options = Object.assign({
		from: _effGetOpacity(element) || 1.0,
		to:   0.0,
		afterFinishInternal: function(effect) {
			if (effect.options.to != 0) return;
			_effHide(effect.element);
			_effSetStyle(effect.element, { opacity: oldOpacity });
		}
	}, arguments[1] || {});
	return new Effect.Opacity(element, options);
};

Effect.FadeCheckClassWrapped = function(element) {
	return Effect.FadeCheckClass(element, 'display-none', 'display-block', arguments[1]);
};

Effect.FadeCheckClass = function(element, classNameDisplayNone, classNameDisplay) {
	element = _effResolve(element);
	_effInjectMethods(element);
	var oldOpacity = _effGetInlineOpacity(element);
	var options = Object.assign({
		from: _effGetOpacity(element) || 1.0,
		to:   0.0,
		afterFinishInternal: function(effect) {
			if (effect.options.to != 0) return;
			var jqElement = jQuery(effect.element);
			jqElement.removeClass(classNameDisplay).addClass(classNameDisplayNone);
			_effSetStyle(effect.element, { opacity: oldOpacity });
		}
	}, arguments[3] || {});
	return new Effect.Opacity(element, options);
};

Effect.FadeCheckClasses = function(element, classesNameDisplayNone, classesNameDisplay) {
	element = _effResolve(element);
	_effInjectMethods(element);
	var oldOpacity = _effGetInlineOpacity(element);
	var options = Object.assign({
		from: _effGetOpacity(element) || 1.0,
		to:   0.0,
		afterFinishInternal: function(effect) {
			if (effect.options.to != 0) return;
			var jqElement = jQuery(effect.element);
			for (var i = 0; i < classesNameDisplay.length; i++) {
				jqElement.removeClass(classesNameDisplay[i]);
			}
			for (var j = 0; j < classesNameDisplayNone.length; j++) {
				jqElement.addClass(classesNameDisplayNone[j]);
			}
			_effSetStyle(effect.element, { opacity: oldOpacity });
		}
	}, arguments[3] || {});
	return new Effect.Opacity(element, options);
};

Effect.Appear = function(element) {
	element = _effResolve(element);
	_effInjectMethods(element);
	var options = Object.assign({
		from: (_effGetStyle(element, 'display') == 'none' ? 0.0 : (_effGetOpacity(element) || 0.0)),
		to:   1.0,
		afterFinishInternal: function(effect) {
			_effForceRerendering(effect.element);
		},
		beforeSetup: function(effect) {
			_effSetOpacity(effect.element, effect.options.from);
			_effShow(effect.element);
		}
	}, arguments[1] || {});
	return new Effect.Opacity(element, options);
};

Effect.AppearCheckClassWrapped = function(element) {
	return Effect.AppearCheckClass(element, 'display-none', 'display-block', arguments[1]);
};

Effect.AppearCheckClass = function(element, classNameDisplayNone, classNameDisplay) {
	element = _effResolve(element);
	_effInjectMethods(element);
	var jqElement = jQuery(element);
	var options = Object.assign({
		from: (jqElement.hasClass(classNameDisplayNone) ? 0.0 : (_effGetOpacity(element) || 0.0)),
		to:   1.0,
		afterFinishInternal: function(effect) {
			_effForceRerendering(effect.element);
		},
		beforeSetup: function(effect) {
			_effSetOpacity(effect.element, effect.options.from);
			var jqElt = jQuery(effect.element);
			jqElt.removeClass(classNameDisplayNone).addClass(classNameDisplay);
		}
	}, arguments[3] || {});
	return new Effect.Opacity(element, options);
};

Effect.AppearCheckClasses = function(element, classesNameDisplayNone, classesNameDisplay) {
	element = _effResolve(element);
	_effInjectMethods(element);
	var jqElement = jQuery(element);
	var options = Object.assign({
		from: (jqElement.hasClass(classesNameDisplayNone[0]) ? 0.0 : (_effGetOpacity(element) || 0.0)),
		to:   1.0,
		afterFinishInternal: function(effect) {
			_effForceRerendering(effect.element);
		},
		beforeSetup: function(effect) {
			_effSetOpacity(effect.element, effect.options.from);
			var jqElt = jQuery(effect.element);
			// fix: il removeClass usava classNameDisplay invece di
			// classNameDisplayNone, lasciando classi "display:none" sull'elemento.
			for (var i = 0; i < classesNameDisplayNone.length; i++) {
				jqElt.removeClass(classesNameDisplayNone[i]);
			}
			for (var j = 0; j < classesNameDisplay.length; j++) {
				jqElt.addClass(classesNameDisplay[j]);
			}
		}
	}, arguments[3] || {});
	return new Effect.Opacity(element, options);
};

/* ------------- Element method injection (back-compat) -------------
 * Effect.Opacity e effect.element nei callback usano metodi DOM
 * estesi (setOpacity/getOpacity/hide/show/setStyle/getStyle/forceRerendering).
 * Inietto quei metodi sull'istanza solo se mancano, in modo che i callback
 * degli utenti del file (es. effect.element.hide().setStyle(...)) continuino
 * a funzionare.
 */
function _effInjectMethods(el) {
	if (!el || el._effInjected) return el;
	el.setOpacity = function(v) { _effSetOpacity(el, v); return el; };
	el.getOpacity = function() { return _effGetOpacity(el); };
	el.getInlineOpacity = function() { return _effGetInlineOpacity(el); };
	el.hide = function() { _effHide(el); return el; };
	el.show = function() { _effShow(el); return el; };
	el.setStyle = function(s) { _effSetStyle(el, s); return el; };
	el.getStyle = function(p) { return _effGetStyle(el, p); };
	el.forceRerendering = function() { _effForceRerendering(el); return el; };
	el._effInjected = true;
	return el;
}
