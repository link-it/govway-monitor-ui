/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM + jQuery (gia' in pagina):
 *     Class.create()                  -> costruttore + .prototype plain
 *     Class.create({...})             -> costruttore che chiama this.initialize.apply(this, arguments)
 *     Object.extend(t,s)/Object.clone -> Object.assign(t,s) / Object.assign({}, o)
 *     $(id)                           -> document.getElementById(id) (con guard se elemento)
 *     $A(arrLike)                     -> Array.from(arrLike)
 *     Element.addClassName/removeClassName -> classList.add/remove (helper menu_addClass/menu_removeClass)
 *     Element.getDimensions(el)       -> {width: el.offsetWidth, height: el.offsetHeight}
 *     Element.getStyle(el, prop)      -> getComputedStyle(el).getPropertyValue(prop)
 *     instance .addClassName/.removeClassName -> .classList.add/.remove
 *     instance .descendantOf(el)      -> el.contains(this)
 *     Array.compact()                 -> filter(Boolean)
 *     Event.observe / stopObserving   -> addEventListener / removeEventListener
 *     Event.element(e)                -> e.target || e.srcElement
 *     Event.stop(e)                   -> preventDefault + stopPropagation
 *     Event.extend(e)                 -> no-op (rimosso)
 *     bindAsEventListener(this[,a])   -> .bind(this[,a])
 *     new Insertion.Before(el, html)  -> el.insertAdjacentHTML('beforebegin', html)
 *     Position.cumulativeOffset(el)   -> menu_cumulativeOffset(el)
 *     Position.positionedOffset(el)   -> menu_positionedOffset(el)
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if(!window.RichFaces) window.RichFaces = {};
if(!RichFaces.Menu) RichFaces.Menu = {};

// helpers privati: replicano la semantica di Prototype che accetta sia id-stringa
// sia element direttamente.
function menu_resolveEl(elOrId) {
	if (!elOrId) return null;
	if (typeof elOrId === 'string') return document.getElementById(elOrId);
	if (elOrId.nodeType) return elOrId;
	return null;
}
function menu_addClass(elOrId, cls) {
	var e = menu_resolveEl(elOrId);
	if (e) e.classList.add(cls);
}
function menu_removeClass(elOrId, cls) {
	var e = menu_resolveEl(elOrId);
	if (e) e.classList.remove(cls);
}
function menu_observe(elOrId, evt, fn, capture) {
	var e = menu_resolveEl(elOrId);
	if (e) e.addEventListener(evt, fn, capture || false);
}
function menu_stopObserving(elOrId, evt, fn, capture) {
	var e = menu_resolveEl(elOrId);
	if (e) e.removeEventListener(evt, fn, capture || false);
}
function menu_stopEvent(e) {
	if (!e) return;
	if (e.preventDefault) e.preventDefault();
	if (e.stopPropagation) e.stopPropagation();
	if (e.cancelBubble === false || e.cancelBubble === true) e.cancelBubble = true;
	if (e.returnValue === false || e.returnValue === true) e.returnValue = false;
}
function menu_eventElement(e) { return e && (e.target || e.srcElement); }
function menu_cumulativeOffset(el) {
	var l = 0, t = 0;
	while (el) {
		t += el.offsetTop || 0;
		l += el.offsetLeft || 0;
		el = el.offsetParent;
	}
	return [l, t];
}
function menu_positionedOffset(el) {
	var l = 0, t = 0;
	while (el) {
		t += el.offsetTop || 0;
		l += el.offsetLeft || 0;
		el = el.offsetParent;
		if (el) {
			if (el.tagName && el.tagName.toUpperCase() === 'BODY') break;
			var p = window.getComputedStyle(el).position;
			if (p !== 'static') break;
		}
	}
	return [l, t];
}
function menu_getDimensions(el) {
	return { width: el.offsetWidth, height: el.offsetHeight };
}


/**
 * Fixes IE bug with incorrect layer width when set to auto
 * @param layer
 */
RichFaces.Menu.fitLayerToContent = function(layer) {
    if (!RichFaces.Menu.Layers.IE)
			return;

    var table = layer.childNodes[0];
    if (table) {
    	if (layer.style.width.indexOf("px")!=-1) {
    		var width = parseFloat(layer.style.width.substring(0,layer.style.width.indexOf('px')));
	        var tmpDims = menu_getDimensions(table);
    		if (tmpDims.width > width) layer.style.width = tmpDims.width + "px";
    	}
    } // if
};

RichFaces.Menu.removePx = function(e) {
	if ((e+"").indexOf("px")!=-1)
		return (e+"").substring(0,e.length-2);
	else
		return e;
};

RichFaces.Menu.Layers = {
	listl: new Array(),
	father: {},
	lwidthDetected:false,
	lwidth:{},
	back: new Array(),
	horizontals: {},
	layers: {},
	levels: ['','','','','','','','','','',''],
	detectWidth: function(){
		this.IE = (navigator.userAgent.indexOf('MSIE') > -1) && (navigator.userAgent.indexOf('Opera') < 0);

		if (this.IE) {
			var agentSplit = /MSIE\s+(\d+(?:\.\d+)?)/.exec(navigator.userAgent);
			if (agentSplit) {
				this.IE_VERSION = parseFloat(agentSplit[1]);
			}
		}

		this.NS = (navigator.userAgent.indexOf('Netscape') > -1);
    }
	,

	menuTopShift : -11,
	menuRightShift : 11,
	menuLeftShift : 0,
	shadowWidth: 0,
	thresholdY : 0,
	abscissaStep : 180,

	CornerRadius: 0,

	toBeHidden 		: new Array(),
	toBeHiddenLeft	: new Array(),
	toBeHiddenTop	: new Array(),

	layersMoved : 0,
	layerPoppedUp : '',
	layerTop : new Array(),
	layerLeft : new Array(),
	timeoutFlag : 0,
	useTimeouts : 1,
	timeoutLength : 500,
	showTimeOutFlag : 0,
	showTimeoutLength: 0,
	queuedId : '',

	destroy: function () {
		this.listl = null;
		this.father = null;
		var obj;
		for (var name in this.layers) {
			obj = this.layers[name];
			obj.layer = null;
			obj.items = null;
			(obj.bindings || []).forEach(function(binding){ binding.remove(); });
		}
		this.layers = null;
	},

	LMPopUp:function(menuName, isCurrent, event) {
		if (!this.loaded || ( this.isVisible(menuName) && !isCurrent)) {
			return;
		}
		if (menuName == this.father[this.layerPoppedUp]) {
			this.LMPopUpL(this.layerPoppedUp, false, event);
		} else if (this.father[menuName] == this.layerPoppedUp) {
			this.LMPopUpL(menuName, true, event);
		} else {
			//this.shutdown();
			var foobar = menuName; //PY: var added
			do {
				this.LMPopUpL(foobar, true, event);
				foobar = this.father[foobar];
			} while (foobar);
		}
		this.layerPoppedUp = menuName;
	},

	isVisible: function(layer) {
		var el = menu_resolveEl(layer);
		return !!(el && el.classList.contains('rich-menu-list-border-display'));
	},

	/**
	 *	@param menuName
	 *	@param visibleFlag
	 */
	LMPopUpL: function(menuName, visibleFlag, event) {
        var menu = menu_resolveEl(menuName);
		if (!this.loaded || !menu) {
			return;
		}
		this.detectWidth();
		var eventResult = true;

		RichFaces.Menu.fitLayerToContent(menu);
		var visible = this.isVisible(menuName);
		var menuLayer = this.layers[menu.id];

		if (visible && !visibleFlag) {
			if (menuLayer) {
				if (menuLayer.eventOnClose) {
					menuLayer.eventOnClose(event);
				}
				if (menuLayer.eventOnCollapse) {
					eventResult = menuLayer.eventOnCollapse(event);
				}
				if (menuLayer.refItem) {
					menuLayer.refItem.highLightGroup(false);
				}
			}
		} else if (!visible && visibleFlag) {
			if (menuLayer) {
				if (menuLayer.eventOnOpen) {
					menuLayer.eventOnOpen(event);
				}

				if (menuLayer.eventOnExpand) {
					eventResult = menuLayer.eventOnExpand(event);
				}

				if (menuLayer.level>0) {
					do {
						menuLayer = this.layers[(this.father[menuLayer.id])];
					} while (menuLayer.level > 0);

					if (menuLayer && menuLayer.eventOnGroupActivate) {
						menuLayer.eventOnGroupActivate(event);
					}
				}
			}
		}

		if(eventResult != false) {
			this.setVisibility(menuName, visibleFlag);
			this.ieSelectWorkAround(menuName, visibleFlag);
		}
	},

	initIFrame: function(layer) {
				var menu = menu_resolveEl(layer);
				menu.insertAdjacentHTML('beforebegin',
				"<iframe src=\"javascript:''\" id=\"" + menu.id + "_iframe\" style=\" position: absolute; z-index: 1;\" frameborder=\"0\" scrolling=\"no\" class=\"underneath_iframe\">" + "</iframe>");
				return document.getElementById(menu.id + "_iframe");
	},

	ieSelectWorkAround: function(menuName, on){
		if((this.IE && this.IE_VERSION < 7) || this.NS) {
			var menu = menu_resolveEl(menuName);
			menuName = menu.id;
          	var iframe = document.getElementById(menuName + "_iframe");
           	if(!iframe&&on){
           		this.initIFrame(menu);
           		iframe = document.getElementById(menuName + "_iframe");
           	}
			var nsfix = (this.NS ? 7 : 0);
			if(on){
				iframe.style.top = menu.style.top;
				iframe.style.left = menu.style.left;
				iframe.style.width = menu.offsetWidth + "px";
				iframe.style.height = menu.offsetHeight + "px";
				iframe.style.visibility = "visible";
			} else if(iframe) {
				iframe.style.visibility = "hidden";
			 }
		}

	},

	shutdown: function () {
		var needToResetLayers = false;
		for (var i=0; i<this.listl.length; i++) {
			var layerId = this.listl[i];
			if (document.getElementById(layerId)) {
				this.LMPopUpL(layerId, false);
			} else {
				needToResetLayers = true;
			}
		}

		if (needToResetLayers) {
			this.resetLayers();
		}

		this.layerPoppedUp = '';
		if (this.Konqueror || this.IE5) {
			this.seeThroughElements(true);
		}
	},
	resetLayers: function() {
		var newList = new Array();
		for (i=0; i<this.listl.length; i++) {
			var layer = this.listl[i];
			if (document.getElementById(layer)) {
				newList.push(layer);
			}
		}

		this.listl = newList;
	}
	,

	/**
	 * Set visibility
	 */
	setVisibility: function (layer, visible) {
		var tmpLayer = menu_resolveEl(layer);
		if (!tmpLayer) return;
		var jqLayer = jQuery(tmpLayer);

		if (visible) {
			jqLayer.removeClass( "rich-menu-list-border-display-none" ).addClass( "rich-menu-list-border-display" );
		} else {
			if(tmpLayer.getElementsByTagName){
				var inputs = tmpLayer.getElementsByTagName('INPUT');
				if(inputs){
					Array.from(inputs).forEach(function(node){node.blur();});
				}
			}

			jqLayer.removeClass( "rich-menu-list-border-display" ).addClass( "rich-menu-list-border-display-none" );
		}
	},


	clearLMTO: function () {
		if (this.useTimeouts) {
			clearTimeout(this.timeoutFlag);
		}
	},

	setLMTO: function (ratio) {
		if(!ratio){
			ratio = this.timeoutLength;
		}
		if (this.useTimeouts) {
			clearTimeout(this.timeoutFlag);
			this.timeoutFlag = setTimeout(function () {RichFaces.Menu.Layers.shutdown();}, ratio);
		}
	},

	loaded:1,

	clearPopUpTO: function(){
		clearTimeout(this.showTimeOutFlag);
		this.iframe=null;
	},
	showMenuLayer: function (layerId, e, delay){
		this.clearPopUpTO();
		this.showTimeOutFlag = setTimeout(new RichFaces.Menu.DelayedPopUp(layerId, e, function(){this.layerId = null;}.bind(this)).show, delay);
		this.layerId = layerId;
	},
	showDropDownLayer: function (layerId, parentId, e, delay){
		this.clearPopUpTO();
		var menu = new RichFaces.Menu.DelayedDropDown(layerId, parentId, e);
		if (menu.show) {
			this.showTimeOutFlag = setTimeout(menu.show, delay);
		}
	},
	showPopUpLayer: function (layer, e){
		this.shutdown();
		this.detectWidth();
        this.LMPopUp(menuName, false);
		this.setLMTO(4);
	}
};

if (window.attachEvent) {
    window.attachEvent("onunload", function() {
    	var layers = RichFaces.Menu.Layers;
    	layers.destroy();
	});
}

/**
 * return true if defined document element or document body, otherwise return false
 */
RichFaces.Menu.getWindowElement = function() {
	return (document.documentElement || document.body);
};

RichFaces.Menu.getWindowDimensions = function() {
	var x,y;
	if (self.innerHeight) // all except Explorer
	{
		x = self.innerWidth;
		y = self.innerHeight;
	}
	else if (document.documentElement && document.documentElement.clientHeight)
	{
		x = document.documentElement.clientWidth;
		y = document.documentElement.clientHeight;
	}
	else if (document.body)
	{
		x = document.body.clientWidth;
		y = document.body.clientHeight;
	}
	return {width:x, height:y};
};

RichFaces.Menu.getWindowScrollOffset = function() {
	var x,y;
	if (typeof pageYOffset != "undefined")
	{
		x = window.pageXOffset;
		y = window.pageYOffset;
	}
	else if (document.documentElement && document.documentElement.scrollTop)
	{
		x = document.documentElement.scrollLeft;
		y = document.documentElement.scrollTop;
	}
	else if (document.body)
	{
		x = document.body.scrollLeft;
		y = document.body.scrollTop;
	}

	return {top:y, left: x};
};

RichFaces.Menu.getPageDimensions = function() {
	var x,y;
	var test1 = document.body.scrollHeight;
	var test2 = document.body.offsetHeight;
	if (test1 > test2) {
		x = document.body.scrollWidth;
		y = document.body.scrollHeight;
	}
	else  {
		x = document.body.offsetWidth;
		y = document.body.offsetHeight;
	}

	return {width:x, height:y};
};


RichFaces.Menu.DelayedContextMenu = function(layer, e) {
    if (!e) {
        e = window.event;
    }
    // Modificato da Link.it: Object.assign({}, e) NON copia pageX/pageY/target
    // di un DOM Event nativo (sono ereditate, non own properties), quindi il
    // menu finiva posizionato a (NaN,NaN) -> in alto a sx. Copio manualmente
    // i campi che servono al positioning e al click-routing.
    this.event = {};
    var _evProps = ['pageX','pageY','clientX','clientY','screenX','screenY',
        'target','srcElement','currentTarget','type',
        'altKey','ctrlKey','shiftKey','metaKey','button','which','keyCode'];
    for (var _i = 0; _i < _evProps.length; _i++) {
        try { this.event[_evProps[_i]] = e[_evProps[_i]]; } catch(_) {}
    }
    this.element = menu_eventElement(e);
    this.layer = menu_resolveEl(layer);
    this.show = function() {
		RichFaces.Menu.Layers.shutdown();

		// layer e' il div con Id che termina per "_menu"
		var jqLayer = jQuery(this.layer);
		var hidden = (jqLayer.hasClass('rich-menu-list-border-display-none'));
		if (hidden)
		{
			oldVisibility = jqLayer.hasClass('rich-menu-list-border-visibility');
    		jqLayer.removeClass( "rich-menu-list-border-display-none" ).addClass( "rich-menu-list-border-display" );
    		jqLayer.removeClass( "rich-menu-list-border-visibility" ).addClass( "rich-menu-list-border-visibility-hidden" );
		}

		var cursorRect = Richfaces.jQuery.getPointerRectangle(this.event);
		Richfaces.jQuery.position(cursorRect, this.layer);

		if (hidden){
			jqLayer.removeClass( "rich-menu-list-border-display" ).addClass( "rich-menu-list-border-display-none" );
		}
		jqLayer.removeClass( "rich-menu-list-border-visibility-hidden" ).addClass( "rich-menu-list-border-visibility" );

		RichFaces.Menu.Layers.LMPopUp(this.layer.id, false,e);
        RichFaces.Menu.Layers.clearLMTO();
    }.bind(this);
};


/**
 * Calculates for DROPDOWN
 */
RichFaces.Menu.DelayedDropDown = function(layer, elementId, e) {
	if (!e) {
		e = window.event;
	}

	//bugs RF-2102, RF-2119, RF-3639
	var node = (e.target || e.srcElement);
	var isLabel = false;
	while (node && node.id != elementId.id) {
		if (node.className == 'rich-label-text-decor') {
			isLabel = true;
		}
		node = node.parentNode;
	}

	if (!isLabel) return;

	this.event = e;
	this.element = menu_resolveEl(elementId) || menu_eventElement(e);
	this.layer = menu_resolveEl(layer);
	menu_stopEvent(e);

	this.listPositions = function(jp, dir) {
		var poss = new Array(new Array(2,1,4),new Array(1,2,3),new Array(4,3,2),new Array(3,4,1));
		var list = new Array();
		if (jp>0 && dir>0) {
	      	list.push({jointPoint: jp, direction: dir });
		} else if (jp>0 && dir==0) {
			for(var i=0;i<3;i++) {
				list.push({jointPoint: jp, direction: poss[jp-1][i] });
			}
		} else if (jp==0 && dir>0) {
			for(var i=0;i<3;i++) {
				list.push({jointPoint: poss[dir-1][i], direction: dir });
			}
		} else if (jp==0 && dir==0) {
	      	list.push({jointPoint: 4, direction: 3 });
	      	list.push({jointPoint: 1, direction: 2 });
	      	list.push({jointPoint: 3, direction: 4 });
	      	list.push({jointPoint: 2, direction: 1 });
		}
		return list;
	}.bind(this);

	this.calcPosition = function(jp, dir) {
		var layerLeft;
		var layerTop;
		switch (jp) {
			case 1:
				layerLeft = this.left;
				layerTop = this.top;
				break;
			case 2:
				layerLeft = this.right;
				layerTop = this.top;
				break;
			case 3:
				layerLeft = this.right;
				layerTop = this.bottom;
				break;
			case 4:
				layerLeft = this.left;
				layerTop = this.bottom;
				break;
		}
		switch (dir) {
			case 1:
				layerLeft -= this.layerdim.width;
				layerTop -= this.layerdim.height;
				break;
			case 2:
				layerTop -= this.layerdim.height;
				break;
			case 4:
				layerLeft -= this.layerdim.width;
		}
		return {left: layerLeft, top: layerTop};
	}.bind(this);

	this.show = function() {
		RichFaces.Menu.Layers.shutdown();

		var jqLayer = jQuery(this.layer);
		var hidden = (jqLayer.hasClass('rich-menu-list-border-display-none'));
		var oldVisibility;
		if (hidden)
		{
			oldVisibility = jqLayer.hasClass('rich-menu-list-border-visibility');
    		jqLayer.removeClass( "rich-menu-list-border-display-none" ).addClass( "rich-menu-list-border-display" );
    		jqLayer.removeClass( "rich-menu-list-border-visibility" ).addClass( "rich-menu-list-border-visibility-hidden" );
		}

		var winOffset	= RichFaces.Menu.getWindowScrollOffset();
		var win			= RichFaces.Menu.getWindowDimensions();
		var pageDims	= RichFaces.Menu.getPageDimensions();


		var windowHeight = win.height;
		var windowWidth = win.width;

		var screenOffset = menu_positionedOffset(this.element);
		var innerDiv = this.element.lastChild;
		var dim = menu_getDimensions(this.element);

		var parOffset = menu_cumulativeOffset(this.element);
		var divOffset = menu_cumulativeOffset(innerDiv);
		var deltaX = divOffset[0] - parOffset[0];
		var deltaY = divOffset[1] - parOffset[1];

		// parent element
		this.top	= screenOffset[1];
		this.left	= screenOffset[0];

		this.bottom = this.top + dim.height;
		this.right = this.left + dim.width;

		this.layerdim = menu_getDimensions(this.layer);

		var options = RichFaces.Menu.Layers.layers[this.layer.id].options;

		var jointPoint = 0;
		if (options.jointPoint) {
			var sJp = options.jointPoint.toUpperCase();
			jointPoint = sJp.indexOf('TL') != -1?1:jointPoint;
			jointPoint = sJp.indexOf('TR') != -1?2:jointPoint;
			jointPoint = sJp.indexOf('BR') != -1?3:jointPoint;
			jointPoint = sJp.indexOf('BL') != -1?4:jointPoint;
		}

		var direction = 0;
		if (options.direction) {
			var sDir = options.direction.toUpperCase();
			direction = sDir.indexOf('TOP-LEFT')    != -1?1:direction;
			direction = sDir.indexOf('TOP-RIGHT')   != -1?2:direction;
			direction = sDir.indexOf('BOTTOM-RIGHT')!= -1?3:direction;
			direction = sDir.indexOf('BOTTOM-LEFT') != -1?4:direction;
		}
		var hOffset = options.horizontalOffset || 0;
		var vOffset = options.verticalOffset || 0;

		var listPos = this.listPositions(jointPoint, direction);
		var layerPos;
		var foundPos = false;
		for (var i=0;i<listPos.length;i++) {
			layerPos = this.calcPosition(listPos[i].jointPoint, listPos[i].direction);
			if ((layerPos.left + hOffset >= winOffset.left) &&
				(layerPos.left + hOffset + this.layerdim.width - winOffset.left <= windowWidth) &&
				(layerPos.top + vOffset >= winOffset.top) &&
				(layerPos.top + vOffset + this.layerdim.height - winOffset.top <= windowHeight)) {
				foundPos = true;
				break;
			}
		}
		if (!foundPos) {
			layerPos = this.calcPosition(listPos[0].jointPoint, listPos[0].direction);
		}
		this.layer.style.left = layerPos.left + hOffset - deltaX - this.left + "px";
		this.layer.style.top = layerPos.top + vOffset - deltaY - this.top + "px";

	    this.layer.style.width = this.layer.clientWidth + "px";

		jqLayer.removeClass( "rich-menu-list-border-visibility-hidden" ).addClass( "rich-menu-list-border-visibility" );
		if(hidden){
			jqLayer.removeClass( "rich-menu-list-border-display" ).addClass( "rich-menu-list-border-display-none" );
		}

		RichFaces.Menu.Layers.LMPopUp(this.layer.id, false);
		RichFaces.Menu.Layers.clearLMTO();
	}.bind(this);
};

RichFaces.Menu.DelayedPopUp = function(layer, e) {
	if (!e) {
		e = window.event;
	}

	this.event = e;

	var elt = menu_eventElement(e);
	while (elt && (!elt.tagName || elt.tagName.toLowerCase() != 'div')) {
		elt = elt.parentNode;
	}

	this.element = elt;
	if (this.element.id.indexOf(":folder") == (this.element.id.length -7) ) {
		this.element = this.element.parentNode;
	}
	this.layer = menu_resolveEl(layer);

    this.show = function() {
        if (!RichFaces.Menu.Layers.isVisible(this.layer) &&
        	RichFaces.Menu.Layers.isVisible(RichFaces.Menu.Layers.father[this.layer.id])) {

			var jqLayer = jQuery(this.layer);
			var hidden = (jqLayer.hasClass('rich-menu-list-border-display-none'));
			var oldVisibility;
			if (hidden)
			{
				oldVisibility = jqLayer.hasClass('rich-menu-list-border-visibility');
	    		jqLayer.removeClass( "rich-menu-list-border-display-none" ).addClass( "rich-menu-list-border-display" );
	    		jqLayer.removeClass( "rich-menu-list-border-visibility" ).addClass( "rich-menu-list-border-visibility-hidden" );
			}

	        this.reposition();

			if(hidden){
				jqLayer.removeClass( "rich-menu-list-border-display" ).addClass( "rich-menu-list-border-display-none" );
			}
			jqLayer.removeClass( "rich-menu-list-border-visibility-hidden" ).addClass( "rich-menu-list-border-visibility" );

    	    RichFaces.Menu.Layers.LMPopUp(this.layer, false);
        }
    }.bind(this);
};

RichFaces.Menu.DelayedPopUp.prototype.reposition = function() {
	var windowShift = RichFaces.Menu.getWindowScrollOffset();
	var body = RichFaces.Menu.getWindowDimensions();
    var windowHeight = body.height;
    var windowWidth = body.width;
    var scrolls = {top:0, left:0};
    var screenOffset = menu_positionedOffset(this.element);
    var leftPx = RichFaces.Menu.removePx(this.element.parentNode.parentNode.style.left);
    var topPx = RichFaces.Menu.removePx(this.element.parentNode.parentNode.style.top);
    screenOffset[0]+=Number(leftPx);
    screenOffset[1]+=Number(topPx);
    var cumulativeOffset = menu_cumulativeOffset(this.element);
    var labelOffset = [cumulativeOffset[0] - screenOffset[0], cumulativeOffset[1] - screenOffset[1]];
    var dim = menu_getDimensions(this.element);
    var top = screenOffset[1] + scrolls.top;
    var bottom = top + dim.height;
    var left = screenOffset[0] + scrolls.left;
    var right = left + dim.width;
    var layerdim = menu_getDimensions(this.layer);

	var options = RichFaces.Menu.Layers.layers[this.layer.id].options;
	var dir = 0;
	var vDir = 0;
	if (options.direction) {
		strDirection = options.direction.toUpperCase();
		dir = strDirection.indexOf('LEFT')!=-1?1:dir;
		dir = strDirection.indexOf('RIGHT')!=-1?2:dir;
		if (dir>0) {
			if (strDirection.indexOf('LEFT-UP')!=-1 ||
				strDirection.indexOf('RIGHT-UP')!=-1) vDir = 1;
			if (strDirection.indexOf('LEFT-DOWN')!=-1 ||
				strDirection.indexOf('RIGHT-DOWN')!=-1) vDir = 2;
		}
	}

    var layerLeft = right;
    var layerTop = top - this.layer.firstChild.firstChild.offsetTop;

    if (dir == 0) {
	    if (layerLeft + layerdim.width + labelOffset[0] - windowShift.left >= windowWidth) {
	        var invisibleRight = layerLeft + layerdim.width + labelOffset[0] - windowShift.left - windowWidth;
	        layerLeft = left - layerdim.width;
	    }

	    if (layerLeft  + labelOffset[0] < 0) {
	        if (Math.abs(layerLeft + labelOffset[0]) > invisibleRight) {
	        	layerLeft = right;
	        }
	    }

    } else if (dir == 1) {
        layerLeft = left - layerdim.width;
    }

	if (vDir != 2) {
	    if (layerTop + layerdim.height + labelOffset[1] - windowShift.top >= windowHeight
	    	|| vDir == 1) {
	    	var invisibleBottom = layerTop + layerdim.height + labelOffset[1] - windowShift.top - windowHeight;
	    	var items = this.layer.firstChild.childNodes;
	    	if (items.length > 1) {
	    		var lastItem = items[items.length-2];
		   		var itemOffset = menu_positionedOffset(lastItem);
				layerTop = top - itemOffset[1];
				if (vDir == 0) {
				    if (layerTop < 0) {
				    	if (Math.abs(layerTop) > invisibleBottom) layerTop = top;
				    }
				}
	    	}
	    }
	}

    this.layer.style.left = layerLeft + "px";
    this.layer.style.top = layerTop + "px";

    this.layer.style.width = this.layer.clientWidth + "px";

};
/**
 * set to true when a dropdown box inside menu receives focus
 */
RichFaces.Menu.selectOpen = false;
RichFaces.Menu.MouseIn = false;


function _MenuLayer(id, options) { this.initialize(id, options); }
RichFaces.Menu.Layer = _MenuLayer;
_MenuLayer.prototype = {

	delay : 300,
	hideDelay : 300,

	initialize: function(id, options){
		RichFaces.Menu.Layers.listl.push(id);
   		this.id = id;
   		this.layer = document.getElementById(id);
   		this.level = 0;
   		Object.assign(this, options);
        RichFaces.Menu.fitLayerToContent(this.layer);
        this.items = new Array();
   		RichFaces.Menu.Layers.layers[id] = this;
   		this.bindings = new Array();

		//Usually set on DD menu to true
		this.highlightParent = true;


        this.mouseover =
	       function(e){
	             RichFaces.Menu.MouseIn=true;
		         RichFaces.Menu.Layers.clearLMTO();
				if (this.shouldHighlightParent() && !this.isWithin(e)) {
			      this.highlightLabel();
				}

		         menu_stopEvent(e);
	       }.bind(this);

         this.mouseout =
	         function(e){
 	              RichFaces.Menu.MouseIn = false;
		          if (!RichFaces.Menu.selectOpen) {
			         RichFaces.Menu.Layers.setLMTO(this.hideDelay);
		          }
				if (this.shouldHighlightParent() && !this.isWithin(e)) {
			      this.unHighlightLabel();
				}
		          menu_stopEvent(e);
	         }.bind(this);



 		var binding = new RichFaces.Menu.Layer.Binding (
 				this.id,
 				"mouseover",
 				this.mouseover);

 		this.bindings.push(binding);
 		binding.refresh();
 		binding = new RichFaces.Menu.Layer.Binding (
 				this.id,
 				"mouseout",
 				this.mouseout);
 		this.bindings.push(binding);
 		binding.refresh();

        var arrayinp = Array.from(this.layer.getElementsByTagName("select"));
        for(i=0; i<arrayinp.length; i++){
					var openSelectb = this.openSelect.bind(this);
					var closeSelectb = this.closeSelect.bind(this);
					arrayinp[i].addEventListener("focus", openSelectb);
					arrayinp[i].addEventListener("blur", closeSelectb);
				    var MouseoverInInputb = this.MouseoverInInput.bind(this);
                    var MouseoutInInputb = this.MouseoutInInput.bind(this);
					arrayinp[i].addEventListener("mouseover", MouseoverInInputb);
					arrayinp[i].addEventListener("mouseout", MouseoutInInputb);

					var OnKeyPressb = this.OnKeyPress.bind(this);
					arrayinp[i].addEventListener("keypress", OnKeyPressb);
        }

        arrayinp = Array.from(this.layer.getElementsByTagName("input"));
        for(i=0; i<arrayinp.length; i++){
					var openSelectb = this.openSelect.bind(this);
					var closeSelectb = this.closeSelect.bind(this);
					arrayinp[i].addEventListener("focus", openSelectb);
					arrayinp[i].addEventListener("blur", closeSelectb);
				    var MouseoverInInputb = this.MouseoverInInput.bind(this);
                    var MouseoutInInputb = this.MouseoutInInput.bind(this);
					arrayinp[i].addEventListener("mouseover", MouseoverInInputb);
					arrayinp[i].addEventListener("mouseout", MouseoutInInputb);
					var OnKeyPressb = this.OnKeyPress.bind(this);
					arrayinp[i].addEventListener("keypress", OnKeyPressb);
        }

        arrayinp = Array.from(this.layer.getElementsByTagName("textarea"));
        for(i=0; i<arrayinp.length; i++){
					var openSelectb = this.openSelect.bind(this);
					var closeSelectb = this.closeSelect.bind(this);
					arrayinp[i].addEventListener("focus", openSelectb);
					arrayinp[i].addEventListener("blur", closeSelectb);
				    var MouseoverInInputb = this.MouseoverInInput.bind(this);
                    var MouseoutInInputb = this.MouseoutInInput.bind(this);
					arrayinp[i].addEventListener("mouseover", MouseoverInInputb);
					arrayinp[i].addEventListener("mouseout", MouseoutInInputb);
        }

 	},

	getLabel : function() {
		return RichFaces.Menu.Layers.layers[this.layer.id].layer.parentNode.parentNode;
	},

	highlightLabel: function() {
		var label1 = this.getLabel();
		RichFaces.Menu.Items.replaceClasses(label1,
			['rich-ddmenu-label-unselect'],
			['rich-ddmenu-label-select']);
		if (this.selectedClass) {
			menu_addClass(label1, this.selectedClass);
		}
	},

	unHighlightLabel: function() {
		var label1 = this.getLabel();
		RichFaces.Menu.Items.replaceClasses(label1,
			['rich-ddmenu-label-select'],
			['rich-ddmenu-label-unselect']);
		if (this.selectedClass) {
			menu_removeClass(label1, this.selectedClass);
		}
	},

	shouldHighlightParent : function() {
		var result = this.highlightParent;
		var parent = null;
		if (result && (parent = this.getParentLayer())) {
			result &= parent.shouldHighlightParent();
		}
		return result;
	},

	getParentLayer: function() {
		return this.level > 0 ? RichFaces.Menu.Layers.layers[(RichFaces.Menu.Layers.father[this.id])] : null;
	},

	isWithin : function(event){
		var within = true;
		var targetElement = event.relatedTarget;

		try {
			if (targetElement && targetElement.className=="anonymous-div")
			 return false;
		} catch (e) {
			return false;
		}

		while (targetElement && targetElement.nodeType!=1) targetElement = targetElement.parentNode;

		var srcElement = event.target;
		var layer = document.getElementById(this.id);
		if (targetElement) {
			within = layer.contains(targetElement);
		}

		within &= !!(srcElement && layer.contains(srcElement));

		return within;
	},

     openSelect:  function(event){
	       RichFaces.Menu.selectOpen = true;
	       var ClickInputb = this.ClickInput.bind(this);
           menu_eventElement(event).addEventListener("click", this.ClickInput);

     },



     closeSelect: function(event){
	   RichFaces.Menu.selectOpen = false;
       var ClickInputb = this.ClickInput.bind(this);
       menu_eventElement(event).removeEventListener("click", this.ClickInput);
       if (RichFaces.Menu.MouseIn == false){
	     RichFaces.Menu.Layers.setLMTO(this.hideDelay);
	   }
     },



     OnKeyPress: function(event){

      if(event.keyCode==13){
        RichFaces.Menu.Layers.setLMTO(this.hideDelay);
      }
    },


    MouseoverInInput: function(event){
      var ClickInputb = this.ClickInput.bind(this);
      menu_eventElement(event).addEventListener("click", this.ClickInput);
    },


    ClickInput: function(event){
         var fixedEvent = event || window.event;
      	 if (fixedEvent.stopPropagation) fixedEvent.stopPropagation();
      	 fixedEvent.stopped = true;
         return false;
    },


    MouseoutInInput: function(event){
          var ClickInputb = this.ClickInput.bind(this);
          menu_eventElement(event).removeEventListener("click", this.ClickInput);

    },

 	rebind:function(){
   		(this.bindings || []).forEach(function(binding){ binding.refresh(); });
 	},
	showMe: function(e){
   		this.closeSiblings(e);
   		RichFaces.Menu.Layers.showMenuLayer(this.id, e, this.delay);
   		RichFaces.Menu.Layers.levels[this.level] = this;
	},
	closeSiblings: function(e){
		if(RichFaces.Menu.Layers.levels[this.level] && RichFaces.Menu.Layers.levels[this.level].id != this.id){
   			for(var i = this.level; i < RichFaces.Menu.Layers.levels.length; i++){
   				if(RichFaces.Menu.Layers.levels[i]) {
   					RichFaces.Menu.Layers.levels[i].hideMe();
   				}
   			}
		}
	},
	closeMinors: function(id){
		var item = this.items[id];
			for(var i = this.level + (!item.childMenu?1:2); i < RichFaces.Menu.Layers.levels.length; i++){
				if(RichFaces.Menu.Layers.levels[i]) {
					RichFaces.Menu.Layers.levels[i].hideMe();
				}
			}
		if (item.menu.refItem) {
			item.menu.refItem.highLightGroup(true);
		}

	},
	addItem: function(itemId, options) {
		var item = new RichFaces.Menu.Item(itemId, this, options || {});
		this.items[itemId] = item;
		return this;
	},
	addItems: function(scriptObjects) {
		for ( var i = 0; i < scriptObjects.length; i++) {
			this.addItem.apply(this, scriptObjects[i]);
		}
		return this;
	},
	hideMe: function(e){
		RichFaces.Menu.Layers.clearPopUpTO();
		RichFaces.Menu.Layers.levels[this.level] = null;
		RichFaces.Menu.Layers.LMPopUpL(this.id, false,e);
	},
	asDropDown: function(topLevel, options){
		this.options = options = options || {};
		if (this.options.ongroupactivate){
			this.eventOnGroupActivate = this.options.ongroupactivate.bind(this);
		}
		if (this.options.onitemselect){
			this.eventOnItemSelect = this.options.onitemselect.bind(this);
		}
		if (this.options.oncollapse){
			this.eventOnCollapse = this.options.oncollapse.bind(this);
		}
		if (this.options.onexpand){
			this.eventOnExpand = this.options.onexpand.bind(this);
		}

			var menuOn = function(e) {
                RichFaces.Menu.Layers.showDropDownLayer(this.id, topLevel, e,this.delay);
			};

			var mouseover = function(e) {
                if (!options.disabled && !RichFaces.Menu.isWithin(e, document.getElementById(topLevel))) {
                	this.highlightLabel();
                }
			};

			var menuOff = function(e) {
				RichFaces.Menu.Layers.setLMTO(this.hideDelay);
				RichFaces.Menu.Layers.clearPopUpTO();
			};

			var mouseout = function(e){
                if (!options.disabled && !RichFaces.Menu.isWithin(e, document.getElementById(topLevel))) {
	               	this.unHighlightLabel();
	            }
			};

			var addBinding = function(elementId, eventName, handler) {
		 		var binding = new RichFaces.Menu.Layer.Binding(elementId, eventName, handler);
		 		this.bindings.push(binding);
		 		binding.refresh();
			}.bind(this);

				addBinding(topLevel, this.stripOnPrefix(options.onEvt || "mouseover"), function(e) {
					menuOn.call(this, e);
					mouseover.call(this, e);
				}.bind(this));

			addBinding(topLevel, 'mouseout', function(e) {
				menuOff.call(this, e);
				mouseout.call(this, e);
			}.bind(this));

	 		RichFaces.Menu.Layers.horizontals[this.id] = topLevel;
		return this;
	},

	asSubMenu: function(parentv, refLayerName, options){
		this.options = options = options || {};
		if (this.options.onclose){
			this.eventOnClose = this.options.onclose.bind(this);
		}
		if (this.options.onopen){
			this.eventOnOpen = this.options.onopen.bind(this);
		}

		this.level = RichFaces.Menu.Layers.layers[parentv].level + 1;
   		RichFaces.Menu.Layers.father[this.id] = parentv;
   		var refLayer = document.getElementById(refLayerName);
   		this.refItem = RichFaces.Menu.Layers.layers[parentv].items[refLayerName];
   		this.refItem.childMenu = this;
 		var binding = new RichFaces.Menu.Layer.Binding(refLayerName, this.stripOnPrefix(options.evtName || "mouseover"),	this.showMe.bind(this));
 		this.bindings.push(binding);
 		binding.refresh();


        // set  parents hideDelay
        var menuLayer=this;
		while (menuLayer.level > 0) {
					menuLayer = RichFaces.Menu.Layers.layers[(RichFaces.Menu.Layers.father[menuLayer.id])];
		}
		if (menuLayer && menuLayer.hideDelay){
			this.hideDelay=menuLayer.hideDelay;
		}


		return this;
	},
	asContextMenu: function(options){
   		this.highlightParent = false;
 		this.options = options || {};

 		if (this.options.ongroupactivate){
			this.eventOnGroupActivate = this.options.ongroupactivate.bind(this);
		}

		if (this.options.onitemselect){
			this.eventOnItemSelect = this.options.onitemselect.bind(this);
		}

		if (this.options.oncollapse){
			this.eventOnCollapse = this.options.oncollapse.bind(this, "collapse");
		}

 		if (this.options.onexpand){
 			this.eventOnExpand = this.invokeEvent.bind(this, "expand");
 		}

 		return this;
	},

	invokeEvent : function (event, eventName) {
		var eventFunction = this.options['on'+eventName];
		var result;

		if (eventFunction) {
			var eventObj;
			if (event) {
				eventObj = event;
			} else if( document.createEventObject ) {
				eventObj = document.createEventObject();
			} else if( document.createEvent )	{
				eventObj = document.createEvent('Events');
				eventObj.initEvent(eventName, true, false );
			}
			result = eventFunction.call(this, eventObj);
		}
		if (result!=false) result = true;
		return result;
	},

	stripOnPrefix: function(evtName){
		var indexof = evtName.indexOf('on');
		if(indexof  >= 0){
			evtName = evtName.substr(indexof + 2);
		}
		return evtName;
	}

};

function _MenuLayerBinding(objectId, eventname, handler) { this.initialize(objectId, eventname, handler); }
RichFaces.Menu.Layer.Binding = _MenuLayerBinding;
_MenuLayerBinding.prototype = {
	initialize:function(objectId, eventname, handler){
		this.objectId = objectId;
		this.eventname = eventname;
		this.handler = handler;
	},
	refresh:function(){
		var obj = document.getElementById(this.objectId);
		if(obj){
			obj.removeEventListener(this.eventname, this.handler);
			obj.addEventListener(this.eventname, this.handler);
			return true;
		}
		return false;
	},
	remove:function(){
		var obj = document.getElementById(this.objectId);
		if (obj) {
			obj.removeEventListener(this.eventname, this.handler);
			this.handler=null;
		}
	}
};
RichFaces.Menu.Items = {
	itemClassNames: ['rich-menu-item-enabled'],
	groupClassNames: ['rich-menu-group-enabled'],
	itemHoverClassNames: ['rich-menu-item-hover'],
	groupHoverClassNames: ['rich-menu-group-hover'],
	iconClassNames : [],
	hoverIconClassNames: ['rich-menu-item-icon-selected'],
	labelClassNames: [],
	hoverLabelClassNames: ['rich-menu-item-label-selected'],

	replaceClasses: function(element, toRemove, toAdd) {
		var e = menu_resolveEl(element);
		if (!e) return;
		(toRemove || []).forEach(function(className) { e.classList.remove(className); });
		(toAdd || []).forEach(function(className) { e.classList.add(className); });
	},

	getHoverClassNames: function (item) {
		if (item.options.flagGroup == 1) {
			return this.groupHoverClassNames;
		} else {
			return this.itemHoverClassNames;
		}
	},

	getClassNames: function (item) {
		if (item.options.flagGroup == 1) {
			return this.groupClassNames;
		} else {
			return this.itemClassNames;
		}
	},

	onmouseover: function(item) {
		var element = item.getElement();
		var icon = item.getIcon();
		var labl = item.getLabel();

		var inlineStyle = item.getInlineStyle();
		var hoverStyle = item.getHoverStyle();
		element.style.cssText = inlineStyle.concat(hoverStyle);

		var hoverClass = item.getHoverClasses();
		this.replaceClasses(element, this.getClassNames(item), this.getHoverClassNames(item).concat(hoverClass));

		this.replaceClasses(icon, this.iconClassNames, this.hoverIconClassNames);
		this.replaceClasses(labl, this.labelClassNames, this.hoverLabelClassNames);
	},
	onmouseout : function(item) {
		var element = item.getElement();
		var icon = item.getIcon();
		var labl = item.getLabel();

		var inlineStyle = item.getInlineStyle();
		element.style.cssText = inlineStyle;

		var hoverClass = item.getHoverClasses();
		this.replaceClasses(element, this.getHoverClassNames(item).concat(hoverClass), this.getClassNames(item));
		this.replaceClasses(icon, this.hoverIconClassNames, this.iconClassNames);
		this.replaceClasses(labl, this.hoverLabelClassNames, this.labelClassNames);
	}

};
RichFaces.Menu.isWithin = function (event, element) {
	var within = false;

	var targetElement = event.relatedTarget;

	try {
		if (targetElement && targetElement.className=="anonymous-div")
		 return false;
	} catch (e) {
		return false;
	}

	while (targetElement && targetElement.nodeType!=1)
	{
		targetElement = targetElement.parentNode;
	}

	if (targetElement) {
		within = (targetElement === element) || (element && element.contains(targetElement));
	}

	return within;
};

RichFaces.Menu.Utils = {};

RichFaces.Menu.Utils.itemMouseOut = function(event, element, parentClasses, itemClasses) {

	if(!itemClasses && RichFaces.Menu.isWithin(event, element)){
		return;
	}

	element.className = 'rich-menu-item rich-menu-item-enabled ' + (parentClasses.styleClass || '') + " " + (itemClasses != null ? itemClasses.itemClass || '' : '');
	element.style.cssText = (parentClasses.style || '') + "; " + (itemClasses != null ? itemClasses.itemStyle || '' : '');
	var icon =  typeof element.getIcon == 'fuction' ? element.getIcon() :  RichFaces.Menu.Utils.getIcon(element);
	icon.className='rich-menu-item-icon ' + (parentClasses.iconClass || '');
	var label = typeof element.getLabel == 'fuction' ? element.getLabel() :  RichFaces.Menu.Utils.getLabel(element);
	menu_removeClass(label, 'rich-menu-item-label-selected');

};

RichFaces.Menu.Utils.itemMouseOver = function(event, element, parentClasses, itemClasses) {

	if(!itemClasses && RichFaces.Menu.isWithin(event, element)){
		return;
	}

	element.className = 'rich-menu-item rich-menu-item-hover ' + (parentClasses.styleClass || '') + " " + (parentClasses.selectClass || '') + " " + (itemClasses != null ? itemClasses.selectItemClass || '':'');
	element.style.cssText = (parentClasses.style || '') + "; " + (itemClasses != null ? itemClasses.itemStyle || '' : '') + "; "+ (parentClasses.selectStyle || '') + "; " + (itemClasses != null ? itemClasses.selectItemStyle || '' : '');
	var icon =  typeof element.getIcon == 'fuction' ? element.getIcon() :  RichFaces.Menu.Utils.getIcon(element);
	icon.className='rich-menu-item-icon rich-menu-item-icon-selected ' + (parentClasses.iconClass || '');
	var label = typeof element.getLabel == 'fuction' ? element.getLabel() :  RichFaces.Menu.Utils.getLabel(element);
	menu_addClass(label, 'rich-menu-item-label-selected');

};

RichFaces.Menu.Utils.getIcon = function (element) {
	return document.getElementById(element.id + ':icon');
};

RichFaces.Menu.Utils.getLabel = function (element) {
	return document.getElementById(element.id + ':anchor');
};

function _MenuItem(id, menu, options) { this.initialize(id, menu, options); }
RichFaces.Menu.Item = _MenuItem;
_MenuItem.prototype = {
	initialize: function(id, menu, options) {
		this.options = {
			closeOnClick : true
		};
		Object.assign(this.options, options);
		this.id = id;
		this.menu = menu;
		this.mouseOver = false;


        var oncontextmenu = function(event) {
            if (event) {
                menu_stopEvent(event);
            }

            return false;
        };

		var binding = new RichFaces.Menu.Layer.Binding(id, "mouseover",
 				this.onmouseover.bind(this));
 		menu.bindings.push(binding);
 		binding.refresh();

 		binding = new RichFaces.Menu.Layer.Binding(id, "mouseout",
 				this.onmouseout.bind(this));
 		menu.bindings.push(binding);
 		binding.refresh();

 		binding = new RichFaces.Menu.Layer.Binding(id, "click",
 				this.onclick.bind(this));
 		menu.bindings.push(binding);
 		binding.refresh();
	},


	onclick: function(e){
		if (this.options.closeOnClick) {
			var menuLayer = this.menu;
			while (menuLayer.level > 0) {
				menuLayer = RichFaces.Menu.Layers.layers[(RichFaces.Menu.Layers.father[menuLayer.id])];
 			}
			if (menuLayer && menuLayer.eventOnItemSelect) menuLayer.eventOnItemSelect();
            RichFaces.Menu.Layers.shutdown();
 		}
 		if(!this.options.disabled) {
			RichFaces.Menu.Items.onmouseout(this);
 		}
	},
	getElement: function() {
		return document.getElementById(this.id);
	},
	getIcon: function() {
		return 	RichFaces.Menu.Utils.getIcon(this);

	},
	getLabel: function() {
		return 	RichFaces.Menu.Utils.getLabel(this);
	},
	getInlineStyle: function() {
		return this.options.style || "";
	},
	getHoverStyle: function() {
		return this.options.selectStyle || "";
	},
	getHoverClasses: function() {
		if (this.options.selectClass) {
			return this.options.selectClass.split(/\s+/).filter(Boolean);
		} else {
			return [];
		}
	},

	isDisabled : function() {
		return this.options.disabled || false;
	},
	onmouseover : function(event) {
		var element = this.getElement();

		if (this.options.onmouseover && !this.options.disabled) {
			if (this.options.onmouseover.call(element, event) == false) {
				menu_stopEvent(event);
				return;
			}
		}
		if (RichFaces.Menu.isWithin(event, element)) {
			return;
		}
		this.menu.closeMinors(this.id);
		if (this.isDisabled()) {
			return;
		}
		if (this.options.flagGroup == 1) {
			this.mouseOver = true;
			this.highLightGroup(true);
		}

		RichFaces.Menu.Items.onmouseover(this);

		if (this.options.flagGroup != 1) {
			var menuOptions = this.menu.options;
			RichFaces.Menu.Utils.itemMouseOver(event, element, this.options, menuOptions);
		}
	},
	onmouseout : function(event) {
		if (this.options.onmouseout && !this.options.disabled) {
			if (this.options.onmouseout.call(element, event) == false) {
				menu_stopEvent(event);
				return;
			}
		}
		var element = this.getElement();
		if (RichFaces.Menu.isWithin(event, element)) {
			return;
		}
		if (this.isDisabled()) {
			return;
		}
		if (this.options.flagGroup == 1) {
					this.mouseOver = false;
					this.highLightGroup(false);
 		}

		RichFaces.Menu.Items.onmouseout(this);

		if (this.options.flagGroup != 1) {

			var menuOptions = this.menu.options;
			RichFaces.Menu.Utils.itemMouseOut(event, element, this.options, menuOptions);
		}
	},
	highLightGroup: function(light)  {
		if (light) {
			menu_removeClass(this.id,"rich-menu-group-enabled");

			menu_addClass(this.id,"rich-menu-group-hover");
			if (this.options.selectClass) {
				menu_addClass(this.id, this.options.selectClass);
			}

			menu_addClass(this.id+":icon","rich-menu-item-icon-selected");
			menu_addClass(this.id+":anchor","rich-menu-item-label-selected");
			menu_addClass(this.id+":icon","rich-menu-group-icon-selected");
			menu_addClass(this.id+":anchor","rich-menu-group-label-selected");
		} else {
			if (!this.mouseOver) {
				menu_removeClass(this.id,"rich-menu-group-hover");

				menu_addClass(this.id,"rich-menu-group-enabled");

				if (this.options.selectClass) {
					menu_removeClass(this.id, this.options.selectClass);
				}
				menu_removeClass(this.id+":icon","rich-menu-item-icon-selected");
				menu_removeClass(this.id+":anchor","rich-menu-item-label-selected");
				menu_removeClass(this.id+":icon","rich-menu-group-icon-selected");
				menu_removeClass(this.id+":anchor","rich-menu-group-label-selected");
			}
		}
}

};

RichFaces.Menu.findMenuItem = function (itemId) {
	var layer;
	var menuItem = null;
	for (var id in RichFaces.Menu.Layers.layers) {
		layer = RichFaces.Menu.Layers.layers[id];
		menuItem = layer.items[itemId];
		if (menuItem) break;
	}
	return menuItem;
};

RichFaces.Menu.updateItem = function (event, element, attr) {
	var menuItem = RichFaces.Menu.findMenuItem(element.id);
	var classes = 'rich-menu-item rich-menu-item-enabled';
	if (menuItem) {
		if (menuItem.options.styleClass) classes =+ ' '+menuItem.options.styleClass;
		element.className = classes;
 		if (menuItem.options.onselect) menuItem.options.onselect(event);
	} else if (attr){
		if (attr.styleClass) classes += ' '+attr.styleClass;
		element.className = classes;
 		if (attr.onselect) attr.onselect(event);
	}
};

RichFaces.Menu.submitForm = function (event, element, options) {
	if (!options) {
		options = {};
	}

	RichFaces.Menu.updateItem(event, element, options.a);

	var form = A4J.findForm(element);
	var params = options.p || {};
	var target = options.t || '';

	params[element.id+':hidden'] = element.id;
	Richfaces.jsFormSubmit(element.id, form.id, target, params);
	return false;
};

RichFaces.Menu.groupMouseOut = function(event, element, menuGroupClass, menuGroupStyle) {
	if (RichFaces.Menu.isWithin(event, element)) {
		return;
	}

	element.className = 'rich-menu-group rich-menu-group-enabled ' + (menuGroupClass ? menuGroupClass : '');
	element.style.cssText = menuGroupStyle;
};

RichFaces.Menu.groupMouseOver = function(event, element, menuGroupHoverClass, menuGroupStyle) {
	if (RichFaces.Menu.isWithin(event, element)) {
		return;
	}

	element.className = 'rich-menu-group rich-menu-group-enabled ' + (menuGroupHoverClass ? menuGroupHoverClass : '');
	element.style.cssText = menuGroupStyle;
};
