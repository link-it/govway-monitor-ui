/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM:
 *       Class.create / Object.extend / Object.clone -> costruttore + Object.assign,
 *       Event.observe / stopObserving -> addEventListener / removeEventListener,
 *       Event.stop / Event.element / Event.KEY_* -> preventDefault+stopPropagation /
 *           e.target / costanti numeriche,
 *       bindAsEventListener -> Function.prototype.bind,
 *       $() / $A() -> document.getElementById / Array.from,
 *       Element.select / instance.select -> querySelectorAll + Array.from,
 *       Element.addClassName / removeClassName / setStyle / cleanWhitespace /
 *           collectTextNodes -> classList / Object.assign(style) / helper inline /
 *           textContent,
 *       Insertion.Top -> insertAdjacentHTML('afterbegin'),
 *       String.prototype.strip -> trim,
 *       jQuery.browser.msie -> userAgent sniff (jQuery 4.x ha rimosso $.browser).
 *   - Fix bug pre-esistente in render(): variabile undefined `H.classList.contains`
 *     sostituita con `nothingLabel.classList.contains` (intent del codice).
 *
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if (!window.Richfaces) window.Richfaces = {};
if (!Richfaces.Selection) Richfaces.Selection = {};

// --- helper Prototype-free locali al modulo ---
function _sbResolve(el) { return (typeof el === 'string') ? document.getElementById(el) : el; }
function _sbObserve(el, ev, fn) { if (el && el.addEventListener) el.addEventListener(ev, fn, false); }
function _sbStopObserving(el, ev, fn) { if (el && el.removeEventListener) el.removeEventListener(ev, fn, false); }
function _sbStopEvent(e) {
	if (!e) return;
	if (e.preventDefault) e.preventDefault();
	if (e.stopPropagation) e.stopPropagation();
	e.cancelBubble = true;
	e.returnValue = false;
}
function _sbEventTarget(e) { return e.target || e.srcElement; }
function _sbAddClass(el, cls) { if (el && cls && el.classList) el.classList.add(cls); }
function _sbRemoveClass(el, cls) { if (el && cls && el.classList) el.classList.remove(cls); }
function _sbSelectAll(el, sel) { return el ? Array.from(el.querySelectorAll(sel)) : []; }
function _sbSetStyle(el, styles) {
	if (!el) return;
	if (typeof styles === 'string') {
		el.style.cssText += ';' + styles;
	} else if (styles) {
		for (var k in styles) {
			if (Object.prototype.hasOwnProperty.call(styles, k)) el.style[k] = styles[k];
		}
	}
}
function _sbCleanWhitespace(el) {
	if (!el) return;
	var node = el.firstChild;
	while (node) {
		var next = node.nextSibling;
		if (node.nodeType === 3 && !/\S/.test(node.nodeValue)) {
			el.removeChild(node);
		}
		node = next;
	}
}
var _sbKey = { TAB: 9, RETURN: 13, ESC: 27, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40 };

Richfaces.Selection.getStart = function(element)
{
	if (element.setSelectionRange) {
		return element.selectionStart;
	} else if (document.selection && document.selection.createRange) {
		var r = document.selection.createRange().duplicate();
		r.moveEnd('character', element.value.length);
		if (r.text == '') return element.value.length;
		return element.value.lastIndexOf(r.text);
	}
}

Richfaces.Selection.getEnd = function(element)
{
	if (element.setSelectionRange) {
		return element.selectionEnd;
	} else if (document.selection && document.selection.createRange) {
		var r = document.selection.createRange().duplicate();
		r.moveStart('character', -element.value.length);
		return r.text.length;
	}
}
Richfaces.Selection.setCaretTo = function (element, pos)
{
	if(element.setSelectionRange) {
			element.focus();
			element.setSelectionRange(pos,pos);
	} else if (element.createTextRange){
			var range = element.createTextRange();
			range.collapse(true);
			range.moveEnd('character', pos);
			range.moveStart('character', pos);
			range.select();
	}
}

var Suggestion = {};
Suggestion.Base = function() {
};
Suggestion.Base.prototype = {
    baseInitialize: function(element, update, options) {
        this.isOpera = (RichFaces.navigatorType() == RichFaces.OPERA?true:false);
        this.element = _sbResolve(element);
        this.update = _sbResolve(update);
        this.hasFocus = false;
        this.changed = false;
        this.active = false;
        this.index = 0;
        this.prevIndex = -1;
        this.entryCount = 0;
        this.keyEvent = false;
        this.oldValue = this.element.value;
        this.skipHover = false;
        this.selectedItems = [];
        this.selectedItemsCache = {};

		options.selection = update + "_selection";

        var needIframe = false; //(RichFaces.navigatorType() == RichFaces.MSIE);

        if (needIframe) {
            options.iframeId = update + "_iframe";
        }

        if (this.setOptions)
            this.setOptions(options);
        else
            this.options = options || {};

        this.options.param = this.options.param || this.element.name;
        this.options.selectedClasses = (this.options.selectedClass
                || "rich-sb-int-sel").split(' ');
        this.options.selectValueClass = this.options.selectValueClass
                || " ";
        this.options.tokens = options.tokens ? Array.from(options.tokens) : [];
        this.options.frequency = this.options.frequency || 0.4;
        this.options.minChars = isNaN(this.options.minChars) ? 1 : parseInt(this.options.minChars);
        this.options.onShow = this.options.onShow ||
                              function(element, update, options) {
                                  if (!update.style.position
                                          || update.style.position
                                          == 'absolute') {
                                      update.style.position = 'absolute';
                                      RichFaces.Position.smartClone(element, update, options);
                                  }
                                  var classesNameDisplayNone = ['rich-sb-display-none','rich-sb-visibility-hidden'];
                                  var classesNameDisplay = ['rich-sb-display','rich-sb-visibility'];

                                  if (!window.opera) {
	                                  // Effect.Appear(update, {duration:0.15});
//	                                   Effect.AppearCheckClass(update, 'rich-sb-display-none', 'rich-sb-display', {duration:0.15});
	                                  Effect.AppearCheckClasses(update, classesNameDisplayNone, classesNameDisplay, {duration:0.15});
	                                  if (options.iframeId) {
	                                      Effect.Appear(_sbResolve(options.iframeId), {duration:0.15, to: 0.01});
	                                  }
                                  } else {
                                  	  // workaround for RF-205
//	                                  Effect.Appear(update, {duration:0.15, to: 0.999999});
//	                                   Effect.AppearCheckClass(update, 'rich-sb-display-none', 'rich-sb-display',  {duration:0.15, to: 0.999999});
	                                  Effect.AppearCheckClasses(update, classesNameDisplayNone, classesNameDisplay,  {duration:0.15, to: 0.999999});
                                  }
                              };
        this.options.onHide = this.options.onHide ||
                              function(element, update, options) {
                                  if (options.iframeId) {
                                      new Effect.Fade(_sbResolve(options.iframeId), {duration:0.15});
                                  }

                                  var classesNameDisplayNone = ['rich-sb-display-none','rich-sb-visibility-hidden'];
                                  var classesNameDisplay = ['rich-sb-display','rich-sb-visibility'];

//                                  new Effect.Fade(update, {duration:0.15});
//                                  new Effect.FadeCheckClass(update, 'rich-sb-display-none', 'rich-sb-display', {duration:0.15});
                                  new Effect.FadeCheckClasses(update, classesNameDisplayNone, classesNameDisplay, {duration:0.15});
                              };

        this.options.width = this.options.width || "auto";

        if (typeof(this.options.tokens) == 'string')
            this.options.tokens = new Array(this.options.tokens);
        for (var i = 0; i < this.options.tokens.length; i++) {
            var token = this.options.tokens[i];
            if (token.charAt[0] == "'" && token.charAt[token.length - 1] == "'")
                this.options.tokens[i] = token.substring(1, -1);
        }

        this.observerHandle = null;

        this.element.setAttribute('autocomplete', 'off');

		var jqUpdate = jQuery(this.update);
		jqUpdate.removeClass( "rich-sb-display" ).addClass( "rich-sb-display-none" );

        this.onBlurListener = this.onBlur.bind(this);
        _sbObserve(this.element, "blur", this.onBlurListener);

        //IE only
        if (RichFaces.navigatorType() == RichFaces.MSIE) {
	        _sbObserve(this.element, "focusout", function(event) {
	        	var elt = event.toElement;
	        	while (elt) {
	        		if (elt == this.update) {
	        			this.element.keepFocus = true;
	                	elt = undefined;
	        		} else {
	        			elt = elt.parentNode;
	        		}
	        	}
	        }.bind(this));
        }

        this.onKeyDownListener = this.onKeyDown.bind(this);
        _sbObserve(this.element, "keydown", this.onKeyDownListener);

        if (this.isOpera) {
            this.onKeyPressListener = this.onKeyPress.bind(this);
            _sbObserve(this.element, "keypress", this.onKeyPressListener);

        	this.onKeyUpListener = this.onKeyUp.bind(this);
            _sbObserve(this.element, "keyup", this.onKeyUpListener);
            this.upDown = 0;
        }

		this.onScrollListener = this.onScroll.bind(this);

		if (options.popupClass) {
			var selected = _sbSelectAll(this.update, ".rich-sb-ext-decor-3");
			_sbAddClass(selected[0], options.popupClass);
		}

		this.onNothingLabelClick = this.hideNLabel.bind(this);

		this.scrollElements = null;
		this.eventOnScroll = this.eventOnScroll.bind(this);
    },

    cancelSubmit: function(event) {
        _sbStopEvent(event);
    },

    disableSubmit: function() {
        if (this.isOpera) {
            var el = this.element;
            while (el.parentNode && (!el.tagName || (el.tagName.toUpperCase()
                    != 'FORM')))
                el = el.parentNode;
            if (el.tagName && (el.tagName.toUpperCase() == 'FORM')) {
                this.parentForm = el;
                this.onSubmitListener
                        = this.cancelSubmit.bind(this);
                _sbObserve(el, "submit", this.onSubmitListener);
            }
        }

    },

    enableSubmit: function() {
        if (this.isOpera) {
            if (this.parentForm) {
                _sbStopObserving(this.parentForm, "submit", this.onSubmitListener);
            }
        }
    },

    onKeyPress: function(event) {
    	if (this.upDown != 0) {
    		if (this.upDownMark) {
    			//Opera produces keydown keypress keypress ... keypress for pressed arrow button
    			//so we should skip the first keypress that follows keydown
    			this.upDownMark = false;
    		} else {
    	        if (this.upDown == 1) {
    	            this.keyEvent = true;
    	            this.markPrevious();
    	            this.render();
    	        } else if (this.upDown == 2) {
    	            this.keyEvent = true;
    	            this.markNext();
    	            this.render();
    	        } else if (this.upDown == 3) {
    	            this.keyEvent = true;
    	            this.markPreviousPage();
    	            this.render();
    	        } else if (this.upDown == 4) {
    	            this.keyEvent = true;
    	            this.markNextPage();
    	            this.render();
    	        }
    		}
    	}
    },

    onKeyUp: function(event) {
        this.upDownMark = false;
    	this.upDown = 0;
    },

    show: function() {
		if (RichFaces.SAFARI == RichFaces.navigatorType()) {
			this.wasScroll = false;
			this.wasBlur = false;
//			if (!this.overflow)
//				this.overflow = this.update.select(".rich-sb-overflow")[0];
			if (!this.overflow) {
				var selected = _sbSelectAll(this.update, ".rich-sb-overflow");
				this.overflow = selected[0];
			}
	       	_sbObserve(this.overflow, "scroll", this.onScrollListener);
		}
		var jqUpdate = jQuery(this.update);

		if(jqUpdate.hasClass('rich-sb-display-none'))
	  	this.options.onShow(this.element, this.update, this.options);
        this.disableSubmit();

       Richfaces.removeScrollEventHandlers(this.scrollElements, this.eventOnScroll);
       this.scrollElements = Richfaces.setupScrollEventHandlers(_sbResolve(this.options.selection), this.eventOnScroll);
    },

    hide: function() {
    	Richfaces.removeScrollEventHandlers(this.scrollElements, this.eventOnScroll);
		if (RichFaces.SAFARI == RichFaces.navigatorType()) {
			if (this.wasScroll) {
				this.wasScroll = false;
				return;
			}
			_sbStopObserving(this.overflow, "scroll", this.onScrollListener)
		}
        this.stopIndicator();
        var jqUpdate = jQuery(this.update);

		if(jqUpdate.hasClass('rich-sb-display'))
			this.options.onHide(this.element, this.update, this.options);

        this.enableSubmit();
		this.hasFocus = false;
        this.active = false;
    },

	eventOnScroll: function (e) {
		this.hide();
	},

    hideNLabel: function(event) {
	var nothingLabel = document.getElementById(this.update.id + "NothingLabel");
    	if (nothingLabel) {
	    	var jqNL = jQuery(nothingLabel);
			jqNL.removeClass( "rich-sb-display" ).addClass( "rich-sb-display-none" );
	    	_sbStopObserving(nothingLabel, "click", this.onNothingLabelClick);
	    	_sbStopObserving(this.element, "blur", this.onNothingLabelClick);
	    	this.hide();
    	}
    },

    startIndicator: function() {
        if (this.options.indicator) {
			var jqEl = jQuery(this.options.indicator);
			jqEl.removeClass( "rich-sb-display-none" ).addClass( "rich-sb-display" );
        }
    },

    stopIndicator: function() {
        if (this.options.indicator) {
			var jqEl = jQuery(this.options.indicator);
			jqEl.removeClass( "rich-sb-display" ).addClass( "rich-sb-display-none" );
		}
    },

    isUnloaded: function() {
        if (this.element.parentNode && this.update.parentNode) {
            return false;
        }
        LOG.info("Element unloaded from DOM");
        if (this.element) {
            _sbStopObserving(this.element, "blur", this.onBlurListener);
            _sbStopObserving(this.element, "keydown", this.onKeyDownListener);

            if (this.onKeyPressListener) {
                _sbStopObserving(this.element, "keypress", this.onKeyPressListener);
                this.onKeyPressListener = undefined;
            }

            if (this.onKeyUpListener) {
                _sbStopObserving(this.element, "keyup", this.onKeyUpListener);
            	this.onKeyUpListener = undefined;
            }
        }
        return true;
    },

    onKeyDown: function(event) {
        if (this.isUnloaded()) return;
        if (!this.initialized) {
            if (this.options.iframeId) {
                var iFrame = document.getElementById(this.options.iframeId);
                var iTemp = iFrame.cloneNode(true);
                iFrame.parentNode.removeChild(iFrame);
                document.body.insertBefore(iTemp, document.body.firstChild);
            }
            var temp = this.update.cloneNode(true);
            this.update.parentNode.removeChild(this.update);
            this.update = temp;
            this.update.component = this;
			this["rich:destructor"] = "destroy";

			var scripts = temp.getElementsByTagName('script');
			for (var i = 0; i < scripts.length; i++) {
				var script = scripts[i];
				if (script.parentNode) {
					script.parentNode.removeChild(script);
				}
			}

			document.body.insertBefore(this.update, document.body.firstChild);
			this.initialized = true;
        }
        this.wasBlur = false;
        if (this.active) {
            this.wasScroll = false;

            var surrogateEvent = (event.rich && event.rich.isCallSuggestion);

            switch (event.keyCode) {
                case _sbKey.TAB:
                case _sbKey.RETURN:
                    this.selectEntry(event);
                    _sbStopEvent(event);
                case _sbKey.ESC:
                    this.hide();
                    this.active = false;
                    _sbStopEvent(event);
                    if (this.isOpera) {
                        this.element.focus();
                    }
                    return;
                case _sbKey.LEFT:
                case _sbKey.RIGHT:
                    return;
                case _sbKey.UP:
                    this.keyEvent = true;
                    this.markPrevious();
                    this.render();
                    if (navigator.appVersion.indexOf('AppleWebKit')
                            > 0) _sbStopEvent(event);
                    if (this.isOpera && !surrogateEvent) {
                        this.upDown = 1;
                		this.upDownMark = true;
                    }
                    return;
                case _sbKey.DOWN:
                    this.keyEvent = true;
                    this.markNext();
                    this.render();
                    if (navigator.appVersion.indexOf('AppleWebKit')
                            > 0) _sbStopEvent(event);
                    if (this.isOpera && !surrogateEvent) {
                        this.upDown = 2;
                		this.upDownMark = true;
                    }
                    return;
                case 33:
                    this.keyEvent = true;
                    this.markPreviousPage();
                    this.render();
                    if (navigator.appVersion.indexOf('AppleWebKit')
                            > 0) _sbStopEvent(event);
                    if (this.isOpera && !surrogateEvent) {
                        this.upDown = 3;
                		this.upDownMark = true;
                    }
                    return;
                case 34:
                    this.keyEvent = true;
                    this.markNextPage();
                    this.render();
                    if (navigator.appVersion.indexOf('AppleWebKit')
                            > 0) _sbStopEvent(event);
                    if (this.isOpera && !surrogateEvent) {
                        this.upDown = 4;
                		this.upDownMark = true;
                    }
                    return;
            }
        } else if (event.keyCode == _sbKey.TAB
                || event.keyCode  == _sbKey.RETURN
                || event.keyCode  == _sbKey.ESC) {
                return;
        }
        this.changed = true;
        this.hasFocus = true;

        if (this.observerHandle) {
            LOG.debug("clear existing observer");
            window.clearTimeout(this.observerHandle)
        }
        ;
        LOG.debug("set timeout for request suggestion");
        // Clone event. after call in timeout handdler, original event is unaccesible.
        var domEvt = {};
        try {
            domEvt.target = event.target;
            domEvt.srcElement = event.srcElement;
            domEvt.type = event.type;
            domEvt.altKey = event.altKey;
            domEvt.button = event.button;
            domEvt.clientX = event.clientX;
            domEvt.clientY = event.clientY;
            domEvt.ctrlKey = event.ctrlKey;
            domEvt.keyCode = event.keyCode;
            domEvt.modifiers = event.modifiers;
            domEvt.pageX = event.pageX;
            domEvt.pageY = event.pageY;
            domEvt.screenX = event.screenX;
            domEvt.screenY = event.screenY;
            domEvt.shiftKey = event.shiftKey;
            domEvt.which = event.which;
            domEvt.rich = event.rich;
        } catch(e) {
            LOG.warn("Exception on clone event");
        }
        if ((event.rich && event.rich.ignoreFrequency)) {
        	this.onObserverEvent(domEvt);
        }else{
        	this.observerHandle =
        	window.setTimeout(this.onObserverEvent.bind(this, domEvt), this.options.frequency
                * 1000);
        }
    },

    _findTr: function(event) {
    	var elt = _sbEventTarget(event);
    	while (elt && (!elt.tagName || elt.tagName.toUpperCase() != 'TR')) {
    		elt = elt.parentNode;
    	}

    	return elt;
    },

    onHover: function(event) {
        var element = this._findTr(event);
    	if (!this.skipHover) {
	        if (this.index != element.autocompleteIndex) {
	            this.index = element.autocompleteIndex;
	            this.render();
	        }
	        if (event.type == 'mousemove') {
	        	_sbStopObserving(element, "mousemove", this.onHover);
	        }
    	} else {
    		this.skipHover = false;
	        _sbObserve(element, "mousemove", this.onHover.bind(this));
    	}
        _sbStopEvent(event);
    },

    onClick: function(event) {
    	if (this.active)
    	{
			this.wasScroll = false;
			this.wasBlur = false;
        	var element = this._findTr(event);
        	this.index = element.autocompleteIndex;
        	this.selectEntry(event);
        	this.hide();
    	}
    },

    onMouseOut: function(event) {
        var element = this._findTr(event);
       	_sbStopObserving(element, "mousemove", this.onHover);
    },

    onBlur: function(event) {
    	if (this.isUnloaded()) return;
		this.wasBlur = true;
        if (!this.active) return;

        if (this.element.keepFocus) {
        	this.element.keepFocus = false;
        	this.element.focus();
        } else {
            // needed to make click events working
            setTimeout(this.hide.bind(this), 250);
        }
    },

	onScroll: function(event) {
		if (RichFaces.SAFARI == RichFaces.navigatorType() && this.wasBlur ) {
			if(this.element) {
				this.element.focus();
				this.wasScroll = true;
				this.wasBlur = false;
			}
		}
	},

	calcEntryPosition: function(entry, scroll) {
        var item = entry;
        var realOffset = 0;
        while (item && (item != scroll)) {
        	// Avoid bug in Safari. Details: http://jacob.peargrove.com/blog/2006/technical/table-row-offsettop-bug-in-safari/
			if (RichFaces.SAFARI == RichFaces.navigatorType() && "TR" == item.tagName.toUpperCase()) {
				realOffset += _sbSelectAll(item, ".rich-sb-cell-padding")[0].offsetTop;
			}
			else
            	realOffset += item.offsetTop;
            if (item.parentNode == scroll) break;
            item = item.offsetParent;
        }

		var entryOffsetHeight;
		if (RichFaces.SAFARI == RichFaces.navigatorType()) {
			var tdElement = _sbSelectAll(item, ".rich-sb-cell-padding")[0];
			entryOffsetHeight = tdElement.offsetTop + tdElement.offsetHeight;
		} else
			entryOffsetHeight = entry.offsetHeight;
		return {realOffset:realOffset, entryOffsetHeight:entryOffsetHeight};
	},

	countVisibleEntries: function() {
		var entry = this.getEntry(this.index);
//      var scroll = this.update.select("._suggestion_size_")[0]
//                || this.update;
		var selected = _sbSelectAll(this.update, "._suggestion_size_");
		var scroll = selected[0] || this.update;

		var entryPosition = this.calcEntryPosition(entry,scroll);

		var countAll = Math.round(scroll.clientHeight/entryPosition.entryOffsetHeight);
		var current = Math.round((entryPosition.realOffset-scroll.scrollTop)/entryPosition.entryOffsetHeight);
		return {current:current,all:countAll};
	},

    render: function() {
        if (this.entryCount > 0) {
            LOG.debug('render for index ' + this.index + " and old index "
                    + this.prevIndex);
            if (this.prevIndex != this.index) {
                var entry = this.getEntry(this.index);
                for (var i = 0; i < this.options.selectedClasses.length; i++)
	                _sbAddClass(entry, this.options.selectedClasses[i]);

                var cells = _sbSelectAll(entry, ".rich-sb-cell-padding");
                for (var i = 0; i < cells.length; i++) {
                	_sbAddClass(cells[i], this.options.selectValueClass);
                }

                // Calc scroll position :
                if (this.keyEvent) {
//	                var scroll = this.update.select("._suggestion_size_")[0]
//	                        || this.update;
					var selected = _sbSelectAll(this.update, "._suggestion_size_");
					var scroll = selected[0] || this.update;

					var entryPosition = this.calcEntryPosition(entry,scroll);

					var oldScrollTop = scroll.scrollTop;
                    if (entryPosition.realOffset > scroll.scrollTop + scroll.clientHeight - entryPosition.entryOffsetHeight) {
                    	scroll.scrollTop = entryPosition.realOffset - scroll.clientHeight + entryPosition.entryOffsetHeight;
                    } else if (entryPosition.realOffset < scroll.scrollTop) {
                    	scroll.scrollTop = entryPosition.realOffset;
                    }
                    if (oldScrollTop != scroll.scrollTop) {
                    	this.skipHover = true;
                    }
                    this.keyEvent = false;
                }
                // remove hightliit from inactive entry
                if (this.prevIndex >= 0) {
                    var prevEntry = this.getEntry(this.prevIndex);
                    if (prevEntry) {
                    	var prevCells = _sbSelectAll(prevEntry, ".rich-sb-cell-padding");
		                for (var i = 0; i < prevCells.length; i++) {
		                	_sbRemoveClass(prevCells[i], this.options.selectValueClass);
                		}
                		for (var i = 0; i < this.options.selectedClasses.length; i++)
	                        _sbRemoveClass(prevEntry, this.options.selectedClasses[i]);
                    }
                }
            }

            // highlight della porzione selezionata
        	this.highlightLabel();

            this.prevIndex = this.index;
            if (this.hasFocus && !this.wasBlur) {
                this.show();
                this.active = true;
            }
        } else {
		var nothingLabel = document.getElementById(this.update.id + "NothingLabel");
		if (!nothingLabel || nothingLabel.classList.contains('rich-sb-display-none')) {
			this.active = false;
			this.hide();
		}
        }
    },

    highlightLabel: function(){
    	if (this.entryCount > 0) {
    		for (var i = 0; i < this.entryCount; i++) {
    			var entry = this.getEntry(i); // selezione del tr
    			// se e' una riga di auto complete
    			if(entry.id.indexOf('NothingLabel') == -1) {
    				// celle con il testo
    				var cells = _sbSelectAll(entry, ".rich-sb-cell-padding");
    				if(cells && cells.length > 0){
    					for (var j = 0; j < cells.length; j++) {
    						var labelOriginale = cells[j].textContent;
    						// applico la procedura di split
        					var strongText = this.createHighlightItem(labelOriginale, this.element.value);
        					// applico il valore aggiornato
        					cells[j].innerHTML = strongText;
						}
    				}
    			}
			}
    	}
    },

    createHighlightItem: function(test, subString){
		if(!subString || subString == '')
			return test;

  	  var tokens = this.occurrences(test,test.toUpperCase(), subString.toUpperCase());

  	  var html = '';
  	  for(var i=0;i<tokens.length;i++){
  		  var token = tokens[i];
  		  if(token.highlight) {
  			  html += "<strong>";
  		  }
  		  html += token.originText;
  		  if(token.highlight) {
  			  html += "</strong>";
  			  }
  		  }

  		  return html;
  	  },

     occurrences: function (originTest, test, subString) {
  		  var split = [];
  		  test += "";
  	  subString += "";
  	  if (subString.length <= 0) return split;

  	  var pos = 0, nuovaPos = 0, step = subString.length;

  	  while (true) {
//      			  console.log('Pos: ' + pos);
  		  nuovaPos = test.indexOf(subString, pos);
//      			  console.log('NuovaPos: ' + nuovaPos);
  		  var tokenString = '';
  		  var originTokenString = '';
  		  var highlight = false;
  		  if (nuovaPos >= 0) {
  			  if(nuovaPos == pos) { // metch del token highlight true
  				  tokenString = test.substr(pos, step);
  				  originTokenString = originTest.substr(pos, step);
  				  pos += step;
  				  highlight = true;
  			  } else {
  				  tokenString = test.substr(pos, (nuovaPos - pos));
  				  originTokenString = originTest.substr(pos, (nuovaPos - pos));
  				  pos = nuovaPos;
  			  }
  			  if(tokenString) {
//      					  console.log('Token: ' + tokenString);
//      					  console.log('Highlight: ' + highlight);
  				  var item = {};
  				  item.text = tokenString;
  				  item.highlight = highlight;
  				  item.originText = originTokenString;
  				  split.push(item);
  			  }
  		  } else {
  			  tokenString = test.substr(pos);
  			  originTokenString = originTest.substr(pos);
  			  if(tokenString) {
//      					  console.log('Ultimo Token: ' + tokenString);
//      					  console.log('Highlight: ' + highlight);
  				  var item = {};
  				  item.text = tokenString;
  				  item.highlight = highlight;
  				  item.originText = originTokenString;
  				  split.push(item);
  			  }
  			  break;
  		  }
  	  }

  	  return split;
  	},

    markPrevious: function() {
        if (this.index > 0) this.index--;
        //else this.index = this.entryCount - 1;
    },

    markNext: function() {
        if (this.index < this.entryCount - 1) this.index++;
        //else this.index = 0;
    },

    markPreviousPage: function() {
    	var pos = this.countVisibleEntries();
        if (this.index > 0) {
        	if (pos.current>0) {
        		this.index = this.index - Math.min(pos.current,pos.all);
        	} else {
        		this.index = this.index - pos.all;
        	}

        	if (this.index < 0) {
        		this.index = 0;
        	}
        }
    },

    markNextPage: function() {
    	var pos = this.countVisibleEntries();
        if (this.index < this.entryCount - 1) {
        	if ((pos.current < pos.all - 1) && pos.current>=0) {
        		this.index = this.index + (pos.all - pos.current - 1);
        	} else {
        		this.index = this.index + pos.all;
        	}

        	if (this.index > this.entryCount - 1) {
        		this.index = this.entryCount - 1;
        	}
        }
    },

    getEntry: function(index) {
        var element = document.getElementById(this.contentTable).firstChild;
        while (!element.tagName || element.tagName.toLowerCase()!="tbody") {
        	element = element.nextSibling;
        }
        return element.childNodes[index];
    },

    getCurrentEntry: function() {
        return this.getEntry(this.index);
    },

    selectEntry: function(event) {
        this.active = false;

		var input = document.getElementById(this.options.selection);
		input.value = this.index;
		var value="";

        this.updateElement(this.getCurrentEntry(), event);
        if (this.options.onselect) {
            this.options.onselect(this, event);
        }
        if (this.update.onselect) {
            this.update.onselect(this, event);
        }
		input.value = "";
    },

    updateElement: function(selectedElement, event) {
        if (this.options.updateElement) {
            this.options.updateElement(selectedElement);
            return;
        }
        var value = '';
        var obj = selectedElement.firstChild;
        while (!obj.tagName || obj.tagName.toLowerCase()!="td") obj = obj.nextSibling;
        value = obj.textContent;

        this.insertValue(value, event);
        this.oldValue = this.element.value;
        this.element.focus();

        if (this.options.afterUpdateElement)
            this.options.afterUpdateElement(this.element, selectedElement);
    },

    updateChoices: function(choices) {
        if (!this.changed && this.hasFocus) {
            if (choices) {
                this.update.firstChild.replaceChild(choices, this.update.firstChild.firstChild);
            }
            // TODO - get entry elements by tag name or class
            var entryes = [];
            if (this.options.entryClass) {
            	 //entryes = this.update.select("."+this.options.entryClass)|| [];
            	 var selected = _sbSelectAll(this.update, "."+this.options.entryClass);
            	 entryes =  selected || [];

            } else if (this.update.firstChild
                    && this.update.firstChild.firstChild
                    && this.update.firstChild.firstChild.childNodes) {
                _sbCleanWhitespace(this.update);
                _sbCleanWhitespace(this.update.firstChild);
                _sbCleanWhitespace(this.update.firstChild.firstChild);
                entryes = this.update.firstChild.firstChild.childNodes;
            }
            this.entryCount = entryes.length;
            for (var i = 0; i < this.entryCount; i++) {
                var entry = entryes[i];
                //          var entry = this.getEntry(i);
                entry.autocompleteIndex = i;
                this.addObservers(entry);
                //                if (this.options.cellpadding)
                //                entry.lastChild.style.padding=this.options.cellpadding;
            }

            this.stopIndicator();
//            var scroll = this.update.select("._suggestion_size_")[0]
//                    || this.update;
			var selected =  _sbSelectAll(this.update, "._suggestion_size_");
			var scroll = selected[0] || this.update;
            scroll.scrollTop = -1;
            scroll.scrollLeft = -1;
            this.index = 0;
            this.prevIndex = -1;

		var nothingLabel = document.getElementById(this.update.id + "NothingLabel");
		if (nothingLabel && this.hasFocus && !this.wasBlur) {
			if (this.entryCount < 1) {
				var jqEl = jQuery(nothingLabel);
				jqEl.removeClass( "rich-sb-display-none" ).addClass( "rich-sb-display" );
				_sbObserve(nothingLabel, "click", this.onNothingLabelClick);
				_sbObserve(this.element, "blur", this.onNothingLabelClick);
				this.show();
			}
		}

            this.render();
        }
    },

    addObservers: function(element) {
        _sbObserve(element, "mouseover", this.onHover.bind(this));
        _sbObserve(element, "click", this.onClick.bind(this));
        _sbObserve(element, "mouseout", this.onMouseOut.bind(this));
    },

    onObserverEvent: function(event) {
        LOG.debug("Observer event occurs");
        this.changed = false;
        var oldValue = this.element.value;

        if ((event.rich && event.rich.isCallSuggestion) || this.oldValue!=oldValue) {
        	this.startPosition = 0;
           	this.endPosition = oldValue.length;
        	if (this.options.tokens.length!=0) {
	        	var tokens = this.options.tokens.join('');
	        	this.startPosition = this.endPosition = Richfaces.Selection.getStart(this.element);

	        	while (this.endPosition<oldValue.length && tokens.indexOf(oldValue.charAt(this.endPosition))==-1) this.endPosition++;

	        	while (this.startPosition>0 && tokens.indexOf(oldValue.charAt(this.startPosition-1))==-1) this.startPosition--;
        	}

        	if (this.options.usingSuggestObjects) this.updateItems(oldValue);
        }

        if ((event.rich && event.rich.ignoreMinChars) || this.getToken().length >= this.options.minChars) {
            LOG.debug("Call data for update choices");
			if (event.keyCode == _sbKey.DOWN || this.oldValue != oldValue) {
	            this.startIndicator();
    	        this.getUpdatedChoices(event);
        	}
        } else {
	        if (this.isSelectedItemsUpdated)
	        {
	        	//call user listner
	        	this.isSelectedItemsUpdated = false;
	        	this.callOnObjectChangeListener(event);
	        }

            this.active = false;
            this.hide();
        }
    	this.oldValue = oldValue;
        this.observerHandle = null;
    },

    callSuggestion: function (ignoreMinChars)
    {
        if (this.active) return;

    	if (!this.hasFocus)
    	{
    		this.element.focus();
    		Richfaces.Selection.setCaretTo(this.element, this.element.value.length);
    	}
        var domEvt = {};
        domEvt.target = this.element;
        domEvt.type = "keydown";
        domEvt.altKey = false;
        domEvt.clientX = 0;
        domEvt.clientY = 0;
        domEvt.ctrlKey = false;
        domEvt.keyCode = 40;
        domEvt.pageX = 0;
        domEvt.pageY = 0;
        domEvt.screenX = 0;
        domEvt.screenY = 0;
        domEvt.shiftKey = false;
        domEvt.which = 40;
        //this hash is used in keydown handler - modify with care
        domEvt.rich = {"isCallSuggestion":true, "ignoreMinChars": ignoreMinChars, "ignoreFrequency" : true};

    	this.onKeyDownListener(domEvt);
    },

    getSelectedItems: function()
    {
    	var result = new Array();
    	if (this.options.usingSuggestObjects)
    	{
    		for (var i=0;i<this.selectedItems.length; i++)
    		{
	    		if (this.selectedItems[i].object ) result.push(this.selectedItems[i].object);
    		}
    	}
    	return result;
    },

    updateItems:function (newValue)
    {
    	this.isSelectedItemsUpdated = false;
    	var oldSelectedItems = this.selectedItems;
    	var value = newValue.replace(/^\s+/, '').replace(/\s+$/, '');
   		var itm="";
   		this.selectedItems = [];
   		var newItemsCache = {};
    	if (this.options.tokens.length!=0) {
    		var re = new RegExp('\\s*[\\'+this.options.tokens.join("|\\")+']\\s*');
    		var items = value.split(re);
    		for (var i=0;i<items.length;i++)
    		{
    			itm = this.selectedItemsCache[items[i]];
    			if (!itm) itm = {text:items[i], object: null};
    			this.selectedItems.push(itm);
    			newItemsCache[itm.text] = itm;
    		}
    	} else {
   			itm = this.selectedItemsCache[value];
  			if (!itm) {
  				itm = {text:value, object: null};
  			}
   			this.selectedItems.push(itm);
   			newItemsCache[itm.text] = itm;
    	}
   		this.selectedItemsCache = newItemsCache;
   		// check for changes
   		if (this.selectedItems.length!=oldSelectedItems.length) this.isSelectedItemsUpdated = true;
   		else
   		{
   			for (var i=0;i<this.selectedItems.length;i++)
   			{
	   			if (this.selectedItems[0].text!=oldSelectedItems.text || this.selectedItems[0].object!=oldSelectedItems.object)
	   			{
	   				this.isSelectedItemsUpdated = true;
	   				break;
	   			}
   			}
   		}
    },

    updateSelectedItems: function (items)
    {
    	for (var i=0;i<this.selectedItems.length; i++)
    	{
    		if (!this.selectedItems[i].object)
    		{
    			var obj = items[this.selectedItems[i].text];
    			if (obj)
    			{
    				this.selectedItems[i].object = obj;
    				this.isSelectedItemsUpdated = true;
    			}
    		}
    	}
    },

    getItemListForUpdate: function()
    {
    	var list = [];
    	var result="";
    	if (this.options.tokens.length!=0)
    	{
	    	for (var i=0;i<this.selectedItems.length; i++)
	    	{
	    		if (!this.selectedItems[i].object && this.selectedItems[i].text.length==0) list.push(this.selectedItems[i].text);
	    	}
	    	result = list.join(this.options.tokens[0]);
    	}
    	else if (this.selectedItems.length!=0 && !this.selectedItems[0].object) result = this.selectedItems[0].object;

    	return result;
    },

    insertValue: function(value, event)
    {
   		var startStr = this.element.value.substr(0,this.startPosition);
   		var endStr = this.element.value.substr(this.endPosition);
   		var str = this.element.value.substring(this.startPosition, this.endPosition);
        var whitespace = str.match(/^\s+/);
        if (whitespace) startStr += whitespace[0];
        whitespace = str.match(/\s+$/);
        if (whitespace) endStr = whitespace[0] + endStr;
        this.element.value = startStr + value + endStr;
        Richfaces.Selection.setCaretTo(this.element, (startStr + value).length);
        //alert(Richfaces.Selection.getEnd(this.element));
        // partial fix for new bag with keyDown insertion
        // TODO: create & fix bug
        this.endPosition = this.startPosition + value.length;

		if (this.options.usingSuggestObjects)
		{
        	var index = 0;
        	if (this.options.tokens.length!=0)
        	{
        		// search index for update item's object
        		var tokens = this.options.tokens.join('');
        		var p = 0;
        		while (p<this.startPosition)
        		{
	        		if (tokens.indexOf(this.element.value.charAt(p))!=-1) index++;
    	    		p++;
        		}
        	}

        	var itm =  {text:value, object:this.fetchValues[this.index]}
        	var flag = (!this.selectedItems[index] || this.selectedItems[index].text != value || this.selectedItems[index].object==null ? true : false);
        	this.selectedItemsCache[value] = itm;
        	if (!this.selectedItems[index]) this.selectedItems.push(itm); else this.selectedItems[index] = itm;
        	if (flag)
        	{
	        	//call user listner
    	    	this.callOnObjectChangeListener(event);
        	}
		}
    },

    getToken: function() {
		var ret = this.element.value.substring(this.startPosition, this.endPosition).replace(/^\s+/, '').replace(/\s+$/, '');
        return /\n/.test(ret) ? '' : ret;
    },

    callOnObjectChangeListener: function(event)
    {
		if (this.options.onobjectchange)
		{
            this.options.onobjectchange(this, event);
        }
    }

}

Richfaces.SuggestionBox = {}
Richfaces.SuggestionBox.defaultOptions = {
		popupClass: '',
		popupStyle: '',
        width: 200,
        height: 200,
        entryClass: 'richfaces_suggestionEntry',
        selectedClass: '',
        param: 'inputvalue',
        frequency: 0.4,
        minChars: 0,
        tokens: null,
        selectValueClass: 'richfaces_suggestionSelectValue',
        usingSuggestObjects: false,
        zindex: 200
}

function _RichFacesSuggestion() { this.initialize.apply(this, arguments); }
RichFaces.Suggestion = _RichFacesSuggestion;
Object.assign(RichFaces.Suggestion.prototype, Suggestion.Base.prototype);
Object.assign(RichFaces.Suggestion.prototype, {
    initialize: function(actionUrl, element, content, options) {

		this.options = Object.assign({}, Richfaces.SuggestionBox.defaultOptions);
		Object.assign(this.options, options);

        var update = content || 'ac1update';
        if (!document.getElementById(update)) this.create(element, update, content, this.options);
        this.baseInitialize(element, update, this.options);
        this.options.asynchronous = true;
        this.options.onajaxcomplete = this.options.oncomplete;
        this.options.oncomplete = this.onComplete.bind(this);
        this.options.defaultParams = this.options.parameters || null;
        this.content = content;
        this.contentTable = content+":suggest";
        this.actionUrl = actionUrl;

        if (this.options.onsubmit && this.options.onsubmit != 'null'){
			this.onsubmitFunction = new Function(this.options.onsubmit+';return true;').bind(this.element);
		}

		this.update.component = this;
		this["rich:destructor"] = "destroy";

        return this;
    },

    destroy: function ()
    {
    	this.update.component = null;
    },

    getUpdatedChoices: function(event) {
        this.options.parameters[this.options.param] = this.getToken();
        if (this.options.usingSuggestObjects) this.options.parameters[this.options.param + "request"] = this.getItemListForUpdate();
        if (this.onsubmitFunction && ! this.onsubmitFunction()) {
			return;
		}

        A4J.AJAX.Submit(this.actionUrl, event, this.options);
    },

    onComplete: function(request, event, data) {
        LOG.debug("AJAX response  complete - updateChoices");
        // Calculate height of choices window
        if (!this.update.style.position || this.update.style.position
                == 'absolute') {
            this.update.style.position = 'absolute';
            RichFaces.Position.smartClone(this.element, this.update, this.options);
        }
        this.updateChoices();
        if (this.options.usingSuggestObjects && data) {
	        this.fetchValues = data.suggestionObjects;
	        this.updateSelectedItems(data.requestedObjects);
	        if (this.isSelectedItemsUpdated)
	        {
	        	//call user listner
	        	this.isSelectedItemsUpdated = false;
	        	this.callOnObjectChangeListener(event);
	        }

	        LOG.debug("Choices updated");
        }
        if (this.options.onajaxcomplete) {
            this.options.onajaxcomplete(request, event);
        }


    },

    create: function(element, suggestion, content, options) {
        var resolved = _sbResolve(element);
        if (!resolved) return;
        var style = ( options.popupStyle || "border:1px solid black;position:absolute; background-color:white;");
		var styleClasses = (options.popupClass ? (options.popupClass + ' ') : '') + 'rich-sb-display-none';
		var styleClass = ' class="' + styleClasses + '" ';

        resolved.ownerDocument.body.insertAdjacentHTML('afterbegin',
                '<div id="' + suggestion + '"' + styleClass + ' style="' + style
                        + '">' +
                '<table id="' + content + '" cellspacing="0" cellpadding="0">' +
                '<tbody></tbody>' +
                '</table>' +
                '</div>'
                );
    }

});

RichFaces.Position = {
    source: null,
    target: null,

    smartClone: function(source, target, options) {
        this.options = Object.assign({
            width: "auto"
        }, options || {});

        this.source = _sbResolve(source);
        this.target = _sbResolve(target);

        this.clonePosition(this.target, this.source, this.source.offsetHeight);

		if (options.iframeId) {
            var iframe = document.getElementById(options.iframeId);

            if (/msie|trident/i.test(navigator.userAgent)) {
            	var op = iframe.offsetParent;
            	if (op && op.nodeType == Node.ELEMENT_NODE) {
                	//hack copied from propotype.js viewportOffset()
                	//needed for positioning to work properly
                	var jop = jQuery(op);
                	if (jop.css('position') == 'static') {
                    	jop.css('position', 'relative').css('position', 'static');
                	}
            	}
            }

            //iframe.style.position = "absolute";
            iframe.style.left = this.target.style.left;
            iframe.style.top = this.target.style.top;
            iframe.style.width = this.target.style.width;
            iframe.style.height = this.target.style.height;

            var zindexVar = options.zindex ? options.zindex : 200 ;
            _sbSetStyle(this.target, {zIndex: zindexVar + 1});

            _sbSetStyle(iframe, {zIndex: zindexVar});
        }
    },

    PX_REGEX: /px$/,

    parseToPx: function(value) {
    	var v = (value || '').trim();
    	if (this.PX_REGEX.test(v)) {
    		try {
    			return parseFloat(v.replace(this.PX_REGEX, ""));
    		} catch (e) {

    		}
    	}

    	return NaN;
    },

    clonePosition: function(target, source, vOffset) {
    	var jqt = jQuery(target);
    	var jqs = jQuery(source);
    	var so = jqs.offset();

//    	var hidden = (jqt.css('display') == 'none');
    	var hidden = (jqt.hasClass('rich-sb-display-none'));
    	var oldVisibility;

    	if (hidden) {
//    		oldVisibility = jqt.css('visibility');
//    		jqt.css('visibility', 'hidden').css('display', '');

    		oldVisibility = jqt.hasClass('rich-sb-visibility');
    		jqt.removeClass( "rich-sb-display-none" ).addClass( "rich-sb-display" );
    		jqt.removeClass( "rich-sb-visibility" ).addClass( "rich-sb-visibility-hidden" );
    	}

    	var left = this.parseToPx(jqt.css('left'));
    	if (isNaN(left)) {
    		left = 0;
    		jqt.css('left', '0px');
    	}

    	var top = this.parseToPx(jqt.css('top'));
    	if (isNaN(top)) {
    		top = 0;
    		jqt.css('top', '0px');
    	}

    	var to = jqt.offset();

    	if (hidden) {
//    		jqt.css('display', 'none').css('visibility', oldVisibility);

    		jqt.removeClass( "rich-sb-display" ).addClass( "rich-sb-display-none" );
    		jqt.removeClass( "rich-sb-visibility-hidden" );

    		if(oldVisibility){
				jqt.addClass( "rich-sb-visibility" );
			} else {
				jqt.addClass( "rich-sb-visibility-hidden" );
			}
    	}

    	// set position
    	jqt.css({
    		left: (so.left - to.left + left) + 'px',
    		top: (so.top - to.top + top + vOffset) + 'px'
    	});
    },

    getBody: function() {
        return this.source.ownerDocument.body;
    }
}
