/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM:
 *     Class.create()                 -> costruttore plain + .prototype
 *     Object.extend(t, s)            -> Object.assign(t, s)
 *     $(id)                          -> document.getElementById(id)
 *     Element.show/hide(el)          -> el.style.display = '' / 'none'
 *     bindAsEventListener(this)      -> .bind(this)
 *     Event.stop(e)                  -> preventDefault + stopPropagation
 *     Event.KEY_UP / Event.KEY_DOWN  -> 38 / 40 (costanti)
 *     Position.cumulativeOffset(el)  -> _cblCumulativeOffset(el)
 *     elem.observe(name, fn)         -> elem.addEventListener(name, fn)
 *     elem.fire(name, memo)          -> _cblFire(elem, name, memo) (CustomEvent
 *                                       con detail+memo per compatibilita')
 *     str.unescapeHTML()             -> textContent del node (nei call site
 *                                       qui presenti) -> _cblNodeText(node).
 *                                       NB: chiude il call site CVE-2020-27511.
 *     str.escapeHTML()               -> _cblEscapeHTML(s) (textNode.innerHTML)
 *     value.strip()                  -> value.trim()
 *     Prototype.Browser.IE           -> false (Browser non-IE moderno)
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if(!window.Richfaces) window.Richfaces = {};

// Helpers privati
function _cblCumulativeOffset(el) {
	var l = 0, t = 0;
	while (el) {
		t += el.offsetTop || 0;
		l += el.offsetLeft || 0;
		el = el.offsetParent;
	}
	return [l, t];
}
function _cblFire(elem, name, memo) {
	var ev;
	if (typeof CustomEvent === "function") {
		ev = new CustomEvent(name, { detail: memo || {}, bubbles: true, cancelable: true });
	} else {
		ev = document.createEvent("Event");
		ev.initEvent(name, true, true);
	}
	ev.memo = memo || {};
	elem.dispatchEvent(ev);
	return ev;
}
function _cblNodeText(node) {
	// Sostituisce node.innerHTML.unescapeHTML(): ritorna il testo puro del nodo
	// senza tag e con entita' decodificate (HTML decoding via textContent).
	return node && node.textContent != null ? node.textContent : '';
}
function _cblEscapeHTML(s) {
	var div = document.createElement('div');
	div.appendChild(document.createTextNode(s == null ? '' : String(s)));
	return div.innerHTML;
}

function _RichfacesComboBoxList() { this.initialize.apply(this, arguments); }
Richfaces.ComboBoxList = _RichfacesComboBoxList;
_RichfacesComboBoxList.prototype = {

	//default values
	selectFirstOnUpdate : true,
	listHeight : "200px",
	itemsText : [],
	showDelay : 0,
	hideDelay : 0,

	initialize: function(id, filterNewValues, classes, options, fieldElemIdSuffix) {

		Object.assign(this, options);
		this.list = document.getElementById(id + "list");
		this.listParent = document.getElementById(id + "listParent");
		this.listParentContainer = this.listParent.parentNode;
		this.iframe = null;
		this.fieldElem = document.getElementById(id + fieldElemIdSuffix);
		this.shadowElem = document.getElementById(id + "shadow");

		if (this.onlistcall) {
			this.listParent.addEventListener("rich:onlistcall", this.onlistcall);
		}

		if (this.onlistclose) {
			this.listParent.addEventListener("rich:onlistclose", this.onlistclose);
		}

		this.filterNewValues = filterNewValues;

		this.isList = false;

		this.defaultRowsAmount = 15;

		this.selectedItem = null;
		this.activeItem = null;

		this.classes = classes;
		this.initDimensions();
		this.scrollElements = null;
		this.eventOnScroll = this.eventOnScroll.bind(this);

	},

	initDimensions : function() {
	    this.listParent.classList.remove("rich-combobox-list-cord-visibility");
       	this.listParent.classList.remove("rich-combobox-list-cord-display-none");
     	this.listParent.classList.add("rich-combobox-list-cord-visibility-hidden");
     	this.listParent.classList.add("rich-combobox-list-cord-display");

		var el = this.listParent.childNodes[1].firstChild;
		this.LAYOUT_BORDER_V = Richfaces.getBorderWidth(el, "tb");
		this.LAYOUT_BORDER_H = Richfaces.getBorderWidth(el, "lr");
		this.LAYOUT_PADDING_V = Richfaces.getPaddingWidth(el, "tb");
		this.LAYOUT_PADDING_H = Richfaces.getPaddingWidth(el, "lr");

		this.listParent.classList.remove("rich-combobox-list-cord-visibility-hidden");
       	this.listParent.classList.remove("rich-combobox-list-cord-display");
     	this.listParent.classList.add("rich-combobox-list-cord-visibility");
     	this.listParent.classList.add("rich-combobox-list-cord-display-none");
	},

	createDefaultList : function() {
		var items = new Array();
		for (var i = 0; i < this.itemsText.length; i++) {
			items.push(this.createItem(this.itemsText[i], this.classes.item.normal));
		}

		this.createNewList(items);
	},

	getItems : function() {
		return this.list.childNodes;
	},

	showWithDelay : function() {
		this.show();
	},

	show : function() {
		var pos = _cblCumulativeOffset(this.fieldElem);
		this.fieldDimensions = {};
		this.fieldDimensions.left = pos[0];
		this.fieldDimensions.top = pos[1];

		this.fieldDimensions.height = this.fieldElem.parentNode.offsetHeight;

	    this.listParent.classList.remove("rich-combobox-list-cord-visibility");
       	this.listParent.classList.remove("rich-combobox-list-cord-display-none");
     	this.listParent.classList.add("rich-combobox-list-cord-visibility-hidden");
     	this.listParent.classList.add("rich-combobox-list-cord-display");
		this.setSize();
		this.listParent.classList.remove("rich-combobox-list-cord-visibility-hidden");
       	this.listParent.classList.remove("rich-combobox-list-cord-display");
     	this.listParent.classList.add("rich-combobox-list-cord-visibility");
     	this.listParent.classList.add("rich-combobox-list-cord-display-none");

		//attach list to the document body
		this.injectListToBody(this.listParent);

		this.setPosition(this.fieldDimensions.top, this.fieldDimensions.left, this.fieldDimensions.height);

		if (this.selectedItem) {
			//was created new item list, so necessary to recreate selectedItem
			this.doSelectItem(this.findItemByDOMNode(this.selectedItem));
		}


		var items = this.getItems();
		if (items.length != 0) {
			if (this.iframe) {
				this.iframe.style.display = '';
			}
       		this.listParent.classList.remove("rich-combobox-list-cord-display-none");
     		this.listParent.classList.add("rich-combobox-list-cord-display");
			if (this.selectFirstOnUpdate) {
				if (this.selectedItem) {
					this.doActiveItem(this.selectedItem);
				} else {
					this.doActiveItem(items[0]);
				}
			}
		}

		_cblFire(this.listParent, "rich:onlistcall", {});
		Richfaces.removeScrollEventHandlers(this.scrollElements, this.eventOnScroll);
		this.scrollElements = Richfaces.setupScrollEventHandlers(this.listParentContainer.parentNode, this.eventOnScroll);
	},

	injectListToBody: function(listElement) {
		if (!this.listInjected) {
			var parent = listElement.parentNode;
			var child = document.body.insertBefore(parent.removeChild(listElement), null);
			if (Richfaces.browser.isIE6 && this.iframe) {
				document.body.insertBefore(parent.removeChild(this.iframe), child);
			}
			this.listInjected = true;
		}
	},

	outjectListFromBody: function(parentElement, listElement) {
		if (this.listInjected) {
			var child = parentElement.appendChild(document.body.removeChild(listElement));
			if (Richfaces.browser.isIE6 && this.iframe) {
				parentElement.insertBefore(document.body.removeChild(this.iframe), child);
			}
			this.listInjected = false;
		}
	},

	hideWithDelay : function() {
		this.hide();
		_cblFire(this.listParent, "rich:onlistclose", {});
	},

	hide : function() {
		Richfaces.removeScrollEventHandlers(this.scrollElements, this.eventOnScroll);
		this.outjectListFromBody(this.listParentContainer, this.listParent);
		this.resetState();
		if (this.iframe) {
			this.iframe.style.display = 'none';
		}

		var component = this.listParent.parentNode;
		component.style.position = "static";
		component.style.zIndex = 0;

		this.listParent.classList.remove("rich-combobox-list-cord-display");
		this.listParent.classList.remove("rich-combobox-list-cord-visibility-hidden");
     	this.listParent.classList.add("rich-combobox-list-cord-display-none");
     	this.listParent.classList.add("rich-combobox-list-cord-visibility");
	},

	eventOnScroll: function (e) {
		this.hideWithDelay();
	},

	visible : function() {
		return this.hasClass(this.listParent.classList, 'rich-combobox-list-cord-display');
	},

	setSize : function() {
		var height = this.listHeight;

		var currentItemsHeight;
		var rowsAmount;
		var item = this.getItems()[0];
		var actItPars = 0;
		if (item) {
			var itemHeight = item.offsetHeight;
			rowsAmount = this.getItems().length;
			currentItemsHeight = itemHeight * rowsAmount;

			if (this.listHeight) {
				if (parseInt(this.listHeight) > currentItemsHeight) {
					height = currentItemsHeight;
				}
			} else {
				if (rowsAmount < this.defaultRowsAmount) {
					height = currentItemsHeight;
				} else {
					height = itemHeight * this.defaultRowsAmount;
				}
			}
			// Modificato da Link.it: ramo IE-only rimosso (browser moderno non-IE).
			height = parseInt(height) + "px";
			this.list.style.height = height;
			if (this.shadowElem) {
				if (!Richfaces.browser.isIE6) {
					// shadow offset
					this.shadowElem.style.width = (parseInt(this.listWidth) + 7) + "px";
					this.shadowElem.style.height = (parseInt(height) + 9)+ "px";
				} else {
					this.shadowElem.style.visibility = "hidden";
				}
			}
			if (this.iframe) {
				this.iframe.style.height = height;
			}
			this.setWidth(this.listWidth);
		}
	},

	setWidth : function(width) {
		var positionElem = this.listParent.childNodes[1];
		var combobox = this.listParent.parentNode;
		var correction = parseInt(width) - Richfaces.getBorderWidth(positionElem.firstChild, "lr") - Richfaces.getPaddingWidth(positionElem.firstChild, "lr") + "px";
		this.list.style.width = correction;
		if (this.iframe) {
			this.iframe.style.width = correction;
		}
	},

	setPosition : function(fieldTop, fieldLeft, fieldHeight) {
		var component = this.listParent.parentNode;
		component.style.zIndex = 2;

		var docHeight = Richfaces.getDocumentHeight();
		var comBottom = fieldTop + fieldHeight;

		var listHeight = parseInt(this.list.style.height);
		if (this.list.parentNode) {
			listHeight += Richfaces.getBorderWidth(this.list.parentNode, "tb");
		}

		var topPosition = comBottom;

		var showPoint = fieldHeight;
		if (parseInt(listHeight) > (docHeight - comBottom)) {
			if (topPosition > (docHeight - comBottom)) {
				showPoint = -parseInt(listHeight);

			}
		}

		this.clonePosition(this.listParent, this.fieldElem, showPoint);
		if (this.iframe) {
			this.clonePosition(this.iframe, this.fieldElem, showPoint);
		}
	},

	scrolling : function(event) {
		var increment;
		var scrollElem = this.list;
		var listTop = Richfaces.ComboBoxList.getElemXY(scrollElem).top;
		var scrollTop = scrollElem.scrollTop;
		var itemTop = Richfaces.ComboBoxList.getElemXY(this.activeItem).top;

		if ((event.keyCode == 38 /* KEY_UP */) || (event.keyCode == 33)) {
			increment = (itemTop - scrollTop) - listTop;
			if (increment < 0) {
				scrollElem.scrollTop += increment;
			}
		} else if ((event.keyCode == 40 /* KEY_DOWN */) || (event.keyCode == 34)) {
			var itemBottom = itemTop + this.activeItem.offsetHeight;
			var increment = (itemBottom - scrollTop) - (listTop + scrollElem.clientHeight);
			if (increment > 0) {
				scrollElem.scrollTop += increment;
			}
		}
		if (event.preventDefault) event.preventDefault();
		if (event.stopPropagation) event.stopPropagation();
	},

	scrollingUpToItem : function(item) {
		var scrollElem = this.list;
		var increment = (Richfaces.ComboBoxList.getElemXY(item).top - scrollElem.scrollTop) - Richfaces.ComboBoxList.getElemXY(scrollElem).top;
		scrollElem.scrollTop += increment;
	},

	/* items library*/
	doActiveItem : function(item) {
		if (this.activeItem) {
			this.doNormalItem(this.activeItem);
		}

		this.activeItem = item;

		this.changeItem(item, this.classes.item.selected);
	},

	doNormalItem : function(item) {
		this.activeItem = null;
		this.changeItem(item, this.classes.item.normal);
	},

	doSelectItem : function(item) {
		this.selectedItem = item;
	},

	changeItem : function(item, className) {
		item.className = className;
	},

	moveActiveItem : function(event) {
		var item = this.activeItem;
		if (event.keyCode == 38 /* KEY_UP */) {
			if (!this.activeItem) {
				if (!this.selectFirstOnUpdate) {
					var curItems = this.getItems();
					if (curItems != null && curItems.length != 0) {
						this.doActiveItem(curItems[curItems.length - 1]);
						this.scrollingUpToItem(curItems[curItems.length - 1]);
					}
				}
				return;
			}
			var prevItem = item.previousSibling;
			if (prevItem) {
				this.itemsRearrangement(item, prevItem);
			}
		} else if (event.keyCode == 40 /* KEY_DOWN */) {
			if (!this.activeItem) {
				if (!this.selectFirstOnUpdate) {
					var curItems = this.getItems();
					if (curItems != null && curItems.length != 0) {
						this.doActiveItem(curItems[0]);
						this.scrollingUpToItem(curItems[0]);
					}
				}
				return;
			}
			var nextItem = item.nextSibling;
			if (nextItem) {
				this.itemsRearrangement(item, nextItem);
			}
		}
		this.scrolling(event);
	},

	itemsRearrangement : function(item, newItem) {
		this.doActiveItem(newItem);
	},

	resetState : function() {
		if (this.filterNewValues) {
			var tempList = this.list.cloneNode(false);
			this.listParent.childNodes[1].firstChild.replaceChild(tempList, this.list);
			this.list = document.getElementById(tempList.id);
		} else {
			if (this.activeItem) {
				this.doNormalItem(this.activeItem);
			}
		}
		this.activeItem = null;
		this.isList = false;
	},

	dataFilter : function(text) {
		this.createNewList(this.getFilteredItems(text));
	},

	getFilteredItems : function(text) {
		var items = new Array();
		for (var i = 0; i < this.itemsText.length; i++) {
			var itText = this.itemsText[i];
			if (itText.toUpperCase().indexOf(text.toUpperCase()) > -1) { // 2020/04/02 Ricerca su tutto il testo
				items.push(this.createItemWithHighLight(itText, text, this.classes.item.normal));
			}
		}
		return items;
	},

	findItemByDOMNode : function(node) {
		var substr = _cblNodeText(node);
		return this.findItemBySubstr(substr);
	},

	findItemBySubstr : function(substr) {
		var items = this.getItems();
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			var itText = _cblNodeText(item);
			if (itText.toUpperCase().indexOf(substr.toUpperCase()) > -1) { // 2020/04/02 Ricerca su tutto il testo
				return item;
			}
		}
	},

	createNewList : function(items) {
		//FIX for FF
		if (this.selectedItem) {
			var node = this.selectedItem;
		}
		this.list.innerHTML = items.join("");
		//was created new item list, so necessary to recreate selectedItem

		if (this.selectedItem) {
			var item = this.findItemByDOMNode(node);
			if (item) {
				this.doSelectItem(item);
			}
		}
	},

	createItem : function(text, className) {
		var escapedText = _cblEscapeHTML(text);
		return "<span class=\"" + className+ "\">" + escapedText + "</span>";
	},

	createItemWithHighLight : function(text, substr, className) {
		var escapedText = _cblEscapeHTML(text);

		if(substr && substr.length > 0) {
			var strongText = this.createHighlightItem(escapedText, substr);
			return "<span class=\"" + className+ "\">" + strongText + "</span>";
		}

		return "<span class=\"" + className+ "\">" + escapedText + "</span>";
	},

	createIframe : function(parentElem, width, comboboxId, classes) {
		var iframe = document.createElement("iframe");

		iframe.id = "iframe" + comboboxId;

		iframe.style.display = "none";
		iframe.style.position = "absolute";
		iframe.frameBorder="0";
		iframe.scrolling="no";
		iframe.src="javascript:''";

		iframe.style.width = width;


		iframe.className = classes;


		parentElem.insertBefore(iframe,parentElem.firstChild);
		this.iframe = document.getElementById(iframe.id);
	},

	PX_REGEX: /px$/,

    parseToPx: function(value) {
    	var v = value.trim();
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

    	var hidden = (jqt.hasClass('rich-combobox-list-cord-display-none'));
    	var oldVisibility;

    	if (hidden) {
    		oldVisibility = jqt.hasClass('rich-combobox-list-cord-visibility');
    		jqt.removeClass( "rich-combobox-list-cord-display-none" ).addClass( "rich-combobox-list-cord-display" );
    		jqt.removeClass( "rich-combobox-list-cord-visibility" ).addClass( "rich-combobox-list-cord-visibility-hidden" );
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
			jqt.removeClass( "rich-combobox-list-cord-display" ).addClass( "rich-combobox-list-cord-display-none" );
    		jqt.removeClass( "rich-combobox-list-cord-visibility-hidden" );

    		if(oldVisibility){
				jqt.addClass( "rich-combobox-list-cord-visibility" );
			} else {
				jqt.addClass( "rich-combobox-list-cord-visibility-hidden" );
			}
    	}

    	// set position
    	jqt.css({
    		left: (so.left - to.left + left) + 'px',
    		top: (so.top - to.top + top + vOffset) + 'px'
    	});
    },


    createHighlightItem: function(test, subString){
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
		  nuovaPos = test.indexOf(subString, pos);
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
	hasClass: function(classes, cls) {
		if(classes){
		    var i;
		    for(i = 0; i < classes.length; i++) {
		        if(classes[i] == cls) {
		            return true;
		        }
		    }
	    }
	    return false;
	}
}

Richfaces.ComboBoxList.getElemXY = function(elem) {

    var x = elem.offsetLeft;
    var y = elem.offsetTop;


    for (var parent = elem.offsetParent; parent; parent = parent.offsetParent) {
        x += parent.offsetLeft;
        y += parent.offsetTop;
    }

	return {left: x, top: y};
}
