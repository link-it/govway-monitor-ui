/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM:
 *       Class.create() -> costruttore plain,
 *       Object.extend -> Object.assign,
 *       Object.clone -> Object.assign({}, ...),
 *       Element.addClassName/removeClassName/show/hide/getStyle/insert
 *           -> classList / style.display / getComputedStyle / insertAdjacentHTML
 *           (helper _cal*),
 *       Element._returnOffset / Position.cumulativeOffset / realOffset / within
 *           -> helper _calCumulativeOffset / _calRealOffset / _calWithin /
 *           _calReturnOffset,
 *       Insertion.After -> insertAdjacentHTML('afterend', ...),
 *       Event.observe / stopObserving / element / stop / findElement /
 *           pointerX / pointerY -> addEventListener / removeEventListener /
 *           preventDefault+stopPropagation (helper _cal*),
 *       bind -> Function.prototype.bind,
 *       markup.invoke('getContent', ctx) -> markup.map(m => m.getContent(ctx)),
 *       String.prototype.parseColor -> _calParseColor (parser locale rgb/hex),
 *       elem.viewportOffset -> getBoundingClientRect-based,
 *       elem.getOffsetParent -> elem.offsetParent || document.body.
 *     Rimossi i blocchi `Object.assign(Event,{findElementByAttr})` e
 *     `Object.assign(Element,{replaceClassName})`: erano dead code (definiti
 *     ma mai chiamati altrove nel file).
 *
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if(!window.LOG){
	window.LOG = {warn:function(){}};
}

if (!window.Richfaces) window.Richfaces={};

Richfaces.Calendar={};

// --- helper Prototype-free locali al modulo ---
function _calResolve(el) { return (typeof el === 'string') ? document.getElementById(el) : el; }
function _calAddClass(el, cls) {
	el = _calResolve(el);
	if (el && cls && el.classList) el.classList.add(cls);
}
function _calRemoveClass(el, cls) {
	el = _calResolve(el);
	if (el && cls && el.classList) el.classList.remove(cls);
}
function _calShow(el) { el = _calResolve(el); if (el) el.style.display = ''; }
function _calHide(el) { el = _calResolve(el); if (el) el.style.display = 'none'; }
function _calGetStyle(el, prop) {
	el = _calResolve(el);
	if (!el) return null;
	if (el.style && el.style.display === 'none') return null;
	var cs = window.getComputedStyle(el);
	return cs ? cs.getPropertyValue(prop) : null;
}
function _calReplace(el, html) {
	el = _calResolve(el);
	if (!el) return;
	if (el.outerHTML !== undefined) {
		el.outerHTML = html;
	} else if (el.parentNode) {
		var tmp = document.createElement('div');
		tmp.innerHTML = html;
		while (tmp.firstChild) {
			el.parentNode.insertBefore(tmp.firstChild, el);
		}
		el.parentNode.removeChild(el);
	}
}
function _calInsertAfter(el, html) {
	el = _calResolve(el);
	if (el) el.insertAdjacentHTML('afterend', html);
}
function _calReturnOffset(l, t) {
	var arr = [l, t];
	arr.left = l;
	arr.top = t;
	return arr;
}
function _calCumulativeOffset(el) {
	el = _calResolve(el);
	var l = 0, t = 0;
	while (el) {
		l += el.offsetLeft || 0;
		t += el.offsetTop || 0;
		el = el.offsetParent;
	}
	return _calReturnOffset(l, t);
}
function _calRealOffset(el) {
	el = _calResolve(el);
	var l = 0, t = 0;
	while (el && el !== document) {
		l += el.scrollLeft || 0;
		t += el.scrollTop || 0;
		el = el.parentNode;
	}
	return _calReturnOffset(l, t);
}
function _calClonePositionByIds(targetId, sourceId, opts) {
	var t = _calResolve(targetId);
	var s = _calResolve(sourceId);
	if (!t || !s) return;
	var off = _calCumulativeOffset(s);
	opts = opts || {};
	t.style.left = (off.left + (opts.offsetLeft || 0)) + 'px';
	t.style.top  = (off.top  + (opts.offsetTop  || 0)) + 'px';
}
function _calWithin(el, x, y) {
	el = _calResolve(el);
	if (!el) return false;
	var off = _calCumulativeOffset(el);
	return (y >= off.top && y < off.top + el.offsetHeight && x >= off.left && x < off.left + el.offsetWidth);
}
function _calViewportOffset(el) {
	el = _calResolve(el);
	if (!el) return _calReturnOffset(0, 0);
	var rect = el.getBoundingClientRect();
	return _calReturnOffset(rect.left, rect.top);
}
function _calGetOffsetParent(el) {
	el = _calResolve(el);
	return (el && el.offsetParent) ? el.offsetParent : document.body;
}
function _calEventTarget(e) { return e.target || e.srcElement; }
function _calStopEvent(e) {
	if (!e) return;
	if (e.preventDefault) e.preventDefault();
	if (e.stopPropagation) e.stopPropagation();
	e.cancelBubble = true;
	e.returnValue = false;
}
function _calFindElement(e, tag) {
	tag = (tag || '').toLowerCase();
	var el = _calEventTarget(e);
	while (el && el !== document) {
		if (el.tagName && el.tagName.toLowerCase() === tag) return el;
		el = el.parentNode;
	}
	return null;
}
function _calPointerX(e) {
	if (typeof e.pageX === 'number') return e.pageX;
	var doc = document.documentElement, body = document.body;
	return (e.clientX || 0) + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || 0);
}
function _calPointerY(e) {
	if (typeof e.pageY === 'number') return e.pageY;
	var doc = document.documentElement, body = document.body;
	return (e.clientY || 0) + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || 0);
}
function _calObserve(elOrId, ev, fn) {
	var el = _calResolve(elOrId);
	if (el && el.addEventListener) el.addEventListener(ev, fn, false);
}
function _calStopObserving(elOrId, ev, fn) {
	var el = _calResolve(elOrId);
	if (el && el.removeEventListener) el.removeEventListener(ev, fn, false);
}
function _calParseColor(s) {
	if (!s) return '#ffffff';
	s = String(s);
	if (s.charAt(0) === '#' && s.length === 7) return s.toLowerCase();
	if (s.charAt(0) === '#' && s.length === 4) {
		return ('#' + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2) + s.charAt(3) + s.charAt(3)).toLowerCase();
	}
	var m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
	if (m) {
		var hex = function(n) { var h = parseInt(n, 10).toString(16); return h.length === 1 ? '0' + h : h; };
		return ('#' + hex(m[1]) + hex(m[2]) + hex(m[3])).toLowerCase();
	}
	return s;
}
Richfaces.Calendar.setElementPosition = function(element, baseElement, jointPoint, direction, offset)
{
	// parameters:
	// baseElement: Dom element or {left:, top:, width:, height:};
	// jointPoint: {x:,y:} or ('top-left','top-right','bottom'-left,'bottom-right')
	// direction:  ('top-left','top-right','bottom'-left,'bottom-right', 'auto')
	// offset: {dx:,dy:}
	
	if (!offset) offset = {dx:0,dy:0};
	
	var elementDim = Richfaces.Calendar.getOffsetDimensions(element);
	var baseElementDim;
	var baseOffset;
	
	if (baseElement.left!=undefined)
	{
		baseElementDim = {width: baseElement.width, height: baseElement.height};
		baseOffset = [baseElement.left, baseElement.top];
		
	} else
	{
		baseElementDim = Richfaces.Calendar.getOffsetDimensions(baseElement);
		baseOffset = _calCumulativeOffset(baseElement);
	}
	
	var windowRect = Richfaces.Calendar.getWindowViewport();
	
	// jointPoint
	var ox=baseOffset[0];
	var oy=baseOffset[1];
	var re = /^(top|bottom)-(left|right)$/;
	var match;
	
	if (typeof jointPoint=='object') {ox = jointPoint.x; oy = jointPoint.y}
	else if ( jointPoint && (match=jointPoint.toLowerCase().match(re))!=null )
	{
		if (match[2]=='right') ox+=baseElementDim.width;
		if (match[1]=='bottom') oy+=baseElementDim.height;
	} else
	{
		// ??? auto 
	}
	
	// direction
	if (direction && (match=direction.toLowerCase().match(re))!=null )
	{
		var d = direction.toLowerCase().split('-');
		if (match[2]=='left') ox-=elementDim.width+offset.dx; else if (match[2]=='right') ox+=offset.dx;
		if (match[1]=='top') oy-=elementDim.height+offset.dy; else if (match[1]=='bottom') oy+=offset.dy; 
	} else
	{
		// auto
		var theBest = {square:0};
		// jointPoint: bottom-right, direction: bottom-left
		var basex = baseOffset[0]-offset.dx;
		var basey = baseOffset[1]+offset.dy;
		var rect = {right: basex + baseElementDim.width, top: basey + baseElementDim.height};
		rect.left = rect.right - elementDim.width;
		rect.bottom = rect.top + elementDim.height;
		ox = rect.left; oy = rect.top;
		var s = Richfaces.Calendar.checkCollision(rect, windowRect);
		if (s!=0)
		{
			if (ox>=0 && oy>=0 && theBest.square<s) theBest = {x:ox, y:oy, square:s};
			// jointPoint: top-right, direction: top-left
			basex = baseOffset[0]-offset.dx;
			basey = baseOffset[1]-offset.dy;
			rect = {right: basex + baseElementDim.width, bottom: basey};
			rect.left = rect.right - elementDim.width;
			rect.top = rect.bottom - elementDim.height;
			ox = rect.left; oy = rect.top;
			s = Richfaces.Calendar.checkCollision(rect, windowRect);
			if (s!=0)
			{
				if (ox>=0 && oy>=0 && theBest.square<s) theBest = {x:ox, y:oy, square:s};
				// jointPoint: bottom-left, direction: bottom-right
				basex = baseOffset[0]+offset.dx;
				basey = baseOffset[1]+offset.dy;
				rect = {left: basex, top: basey + baseElementDim.height};
				rect.right = rect.left + elementDim.width;
				rect.bottom = rect.top + elementDim.height;
				ox = rect.left; oy = rect.top;
				s = Richfaces.Calendar.checkCollision(rect, windowRect);
				if (s!=0)
				{
					if (ox>=0 && oy>=0 && theBest.square<s) theBest = {x:ox, y:oy, square:s};
					// jointPoint: top-left, direction: top-right
					basex = baseOffset[0]+offset.dx;
					basey = baseOffset[1]-offset.dy;
					rect = {left: basex, bottom: basey};
					rect.right = rect.left + elementDim.width;
					rect.top = rect.bottom - elementDim.height;
					ox = rect.left; oy = rect.top;
					s = Richfaces.Calendar.checkCollision(rect, windowRect);
					if (s!=0)
					{
						// the best way selection
						if (ox<0 || oy<0 || theBest.square>s) {ox=theBest.x; oy=theBest.y}
					}
				}
			}
			
		}
	}
	
	var els = element.style;
	var originalVisibility = els.visibility;
	var originalPosition = els.position;
	var originalDisplay = els.display;
	els.visibility = 'hidden';
	els.position = 'absolute';
	els.display = '';
	
	if (!window.opera)
	{
   		var parentOffset = _calViewportOffset(_calGetOffsetParent(element));
   		ox -= parentOffset[0];
		oy -= parentOffset[1];
	} else if (element.offsetParent)
	{
		// for Opera only
		if (element.offsetParent!=document.body)
		{
			var parentOffset=_calCumulativeOffset(element.offsetParent);
			ox -= parentOffset[0];
			oy -= parentOffset[1];
			ox += element.offsetParent.scrollLeft;
			oy += element.offsetParent.scrollTop;
		} else {
			var parentOffset = Richfaces.Calendar.cumulativeScrollOffset(element);
			ox += parentOffset[0];
			oy += parentOffset[1];
		}
	}

	els.display = originalDisplay;
	els.position = originalPosition;
	els.visibility = originalVisibility;
	element.style.left = ox + 'px';
	element.style.top = oy + 'px';
};

Richfaces.Calendar.cumulativeScrollOffset = function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.scrollTop  || 0;
      valueL += element.scrollLeft || 0;
      element = element.parentNode;
    } while (element && element != document.body);
    return _calReturnOffset(valueL, valueT);
};

Richfaces.Calendar.getOffsetDimensions = function(element) {
	// from prototype 1.5.0 // Pavel Yascenko
    element = _calResolve(element);
    var display = _calGetStyle(element, 'display');
    if (display != 'none' && display != null) // Safari bug
      return {width: element.offsetWidth, height: element.offsetHeight};

    // All *Width and *Height properties give 0 on elements with display none,
    // so enable the element temporarily
    var els = element.style;
    var originalVisibility = els.visibility;
    var originalPosition = els.position;
    var originalDisplay = els.display;
    els.visibility = 'hidden';
    els.position = 'absolute';
    els.display = 'block';
    var originalWidth = element.offsetWidth; // was element.clientWidth // Pavel Yascenko
    var originalHeight = element.offsetHeight; // was element.clientHeight // Pavel Yascenko
    els.display = originalDisplay;
    els.position = originalPosition;
    els.visibility = originalVisibility;
    return {width: originalWidth, height: originalHeight};
};
 
Richfaces.Calendar.checkCollision = function(elementRect, windowRect, windowOffset)
{
	if (elementRect.left >= windowRect.left &&
		elementRect.top >= windowRect.top &&
		elementRect.right <= windowRect.right &&  
		elementRect.bottom <= windowRect.bottom)
		return 0;
	
	var rect = {left:   (elementRect.left>windowRect.left ? elementRect.left : windowRect.left),
				top:    (elementRect.top>windowRect.top ? elementRect.top : windowRect.top),
				right:  (elementRect.right<windowRect.right ? elementRect.right : windowRect.right),
				bottom: (elementRect.bottom<windowRect.bottom ? elementRect.bottom : windowRect.bottom)};
	return (rect.right-rect.left)* (rect.bottom-rect.top);
};


Richfaces.Calendar.getWindowDimensions = function() {
    var w =  self.innerWidth
                || document.documentElement.clientWidth
                || document.body.clientWidth
                || 0;
    var h =  self.innerHeight
                || document.documentElement.clientHeight
                || document.body.clientHeight
                || 0;
	return {width:w, height: h};
};

Richfaces.Calendar.getWindowScrollOffset = function() {
    var dx =  window.pageXOffset
                || document.documentElement.scrollLeft
                || document.body.scrollLeft
                || 0;
    var dy =  window.pageYOffset
                || document.documentElement.scrollTop
                || document.body.scrollTop
                || 0;
	return {left:dx, top: dy};
};

Richfaces.Calendar.getWindowViewport = function() {
	var windowDim = Richfaces.Calendar.getWindowDimensions();
	var windowOffset = Richfaces.Calendar.getWindowScrollOffset();
	return {left:windowOffset.left, top:windowOffset.top, right: windowDim.width+windowOffset.left, bottom: windowDim.height+windowOffset.top};
};

Richfaces.Calendar.clonePosition = function (elements, source)
{
		if (!elements.length) elements = [elements];
		var offset = _calCumulativeOffset(source);
		offset = {left:offset[0], top:offset[1]};
		var offsetTemp;
		if (source.style.position!='absolute')
		{
			offsetTemp = _calRealOffset(source);
			offset.left -= offsetTemp.left;
			offset.top -= offsetTemp.top;
			offsetTemp = Richfaces.Calendar.getWindowScrollOffset();
			offset.left += offsetTemp.left;
			offset.top += offsetTemp.top;
		}

		for (var i=0;i<elements.length;i++)
		{
			offsetTemp = Richfaces.Calendar.getParentOffset(elements[i]);
			elements[i].style.left = (offset.left - offsetTemp.left) + 'px';
			elements[i].style.top = (offset.top - offsetTemp.top) + 'px';
		}
		return offset;
};

Richfaces.Calendar.getParentOffset = function(element)
{
		var offset = {left:0,top:0};
		var els = element.style;
		if (els.display!='none')
		{
			if (element.offsetParent && element.offsetParent!=document.body)
				offset = _calCumulativeOffset(element.offsetParent);
		}
		else
		{
			var originalVisibility = els.visibility;
			var originalPosition = els.position;
			var originalDisplay = els.display;
			els.visibility = 'hidden';
			els.position = 'absolute';
			els.display = '';
			if (element.offsetParent && element.offsetParent!=document.body)
				offset = _calCumulativeOffset(element.offsetParent);
			els.display = originalDisplay;
			els.position = originalPosition;
			els.visibility = originalVisibility;
		}

		return offset;
};

Richfaces.Calendar.joinArray = function(array, begin, end, separator)
{
	var value = '';
	if (array.length!=0) value = begin+array.pop()+end;
	while (array.length)
		value = begin+array.pop()+end+separator+value;
	return value;
};

Richfaces.Calendar.getMonthByLabel = function (monthLabel, monthNames) {
    var toLowerMonthLabel = monthLabel.toLowerCase();
    var i = 0;
    while (i < monthNames.length) {
        if (monthNames[i].toLowerCase() == toLowerMonthLabel) {
            return i;
        }
        
        i++;
    }
};

// Rimossi blocchi Object.assign(Event,{findElementByAttr}) e
// Object.assign(Element,{replaceClassName}): definivano metodi mai chiamati
// nel resto del file.

/* Year:
 *	y,yy - 00-99
 *	yyy+ - 1999
 * Month:
 *	M - 1-12
 *	MM - 01-12
 *	MMM - short (Jul)
 *	MMMM+ - long (July)
 * Date:
 *	d - 1-31
 *	dd+ - 01-31 */
Richfaces.Calendar.getDefaultMonthNames = function(shortNames)
{
	return (shortNames
			? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
			: ['January','February','March','April','May','June','July','August','September','October','November','December']);
};

Richfaces.Calendar.addLocale = function (locale, symbols) {
	if (!Richfaces.Calendar[locale]) {
		Richfaces.Calendar[locale] = symbols;
	}
};

/*Richfaces.Calendar.getDefaultWeekDayNames = function(shortNames)
{
	return (shortNames
			? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
			: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']);
};*/

Richfaces.Calendar.parseDate = function(dateString, pattern, monthNames, monthNamesShort)
{
	var re = /([.*+?^<>=!:${}()[\]\/\\])/g;
	var monthNamesStr
	var monthNamesShortStr;
	if (!monthNames) {
		monthNames = Richfaces.Calendar.getDefaultMonthNames();
		monthNamesStr = monthNames.join('|');
	} else {
		monthNamesStr = monthNames.join('|').replace(re, '\\$1');
	}

	if (!monthNamesShort) {
		monthNamesShort = Richfaces.Calendar.getDefaultMonthNames(true);
		monthNamesShortStr = monthNamesShort.join('|');
	} else {
		monthNamesShortStr = monthNamesShort.join('|').replace(re, '\\$1');
	}
	
	var counter=1;
	var y,m,d;
	var a,h,min;
	var shortLabel=false;
	
	pattern = pattern.replace(/([.*+?^<>=!:${}()|[\]\/\\])/g, '\\$1');
	pattern = pattern.replace(/(y+|M+|d+|a|H{1,2}|h{1,2}|m{2})/g,
		function($1) {
			switch ($1) {
	            case 'y'  :
	            case 'yy' : y=counter; counter++; return '(\\d{2})';
	            case 'MM' : m=counter; counter++; return '(\\d{2})';
	            case 'M'  : m=counter; counter++; return '(\\d{1,2})';
	            case 'd'  : d=counter; counter++; return '(\\d{1,2})';
	            case 'MMM': m=counter; counter++; shortLabel=true; return '('+monthNamesShortStr+')';
	            case 'a'  : a=counter; counter++; return '(AM|am|PM|pm)?';
	            case 'HH' :
	            case 'hh' : h=counter; counter++; return '(\\d{2})?';
	            case 'H'  :
	            case 'h'  : h=counter; counter++; return '(\\d{1,2})?';
	            case 'mm' : min=counter; counter++; return '(\\d{2})?';
			}
	        // y+,M+,d+
			var ch = $1.charAt(0);
			if (ch=='y') {y=counter; counter++; return '(\\d{3,4})'};
			if (ch=='M') {m=counter; counter++; return '('+monthNamesStr+')'};
			if (ch=='d') {d=counter; counter++; return '(\\d{2})'};
		}
	);

	var re = new RegExp(pattern,'i');
	var match = dateString.match(re);
	if (match!=null)
	{
		var yy = parseInt(match[y],10); if (isNaN(yy)) return null; else if (yy<70) yy+=2000; else if (yy<100) yy+=1900;
		var mm = parseInt(match[m],10); if (isNaN(mm)) mm = Richfaces.Calendar.getMonthByLabel(match[m], shortLabel ? monthNamesShort : monthNames); else if (--mm<0 || mm>11) return null;
		var dd = parseInt(match[d],10); if (isNaN(dd) || dd<1 || dd>daysInMonth(yy, mm)) return null;

		// time parsing
		if (min!=undefined && h!=undefined)
		{			
			var hh,mmin,aa;
			mmin = parseInt(match[min],10); if (isNaN(mmin) || mmin<0 || mmin>59) return null;
			hh = parseInt(match[h],10); if (isNaN(hh)) return null;
			if (a!=undefined)
			{
				aa = match[a];
				if (!aa) return null;
				aa = aa.toLowerCase();
				if ((aa!='am' && aa!='pm') || hh<1 || hh>12) return null;
				if (aa=='pm')
				{
					if (hh!=12) hh+=12;
				} else if (hh==12) hh = 0;
			}
			else if (hh<0 || hh>23) return null;

			return new Date(yy, mm, dd, hh, mmin, 0);
		}
		
		return new Date(yy, mm, dd);
	}
	return null;
};

Richfaces.Calendar.formatDate = function(date, pattern, monthNames, monthNamesShort) {
	if (!monthNames) monthNames = Richfaces.Calendar.getDefaultMonthNames();
	if (!monthNamesShort) monthNamesShort = Richfaces.Calendar.getDefaultMonthNames(true);
	var mm; var dd; var hh; var min;
    var result = pattern.replace(/(\\\\|\\[yMdaHhm])|(y+|M+|d+|a|H{1,2}|h{1,2}|m{2})/g,
        function($1,$2,$3) {
        	if ($2) return $2.charAt(1);
			switch ($3) {
	            case 'y':
	            case 'yy':  return date.getYear().toString().slice(-2);
	            case 'M':   return (date.getMonth()+1);
	            case 'MM':  return ((mm = date.getMonth()+1)<10 ? '0'+mm : mm);
	            case 'MMM': return monthNamesShort[date.getMonth()];
		        case 'd':   return date.getDate();
	            case 'a'  : return (date.getHours()<12 ? 'AM' : 'PM');
	            case 'HH' : return ((hh = date.getHours())<10 ? '0'+hh : hh);
	            case 'H'  : return date.getHours();
	            case 'hh' : return ((hh = date.getHours())==0 ? '12' : (hh<10 ? '0'+hh : (hh>21 ? hh-12 : (hh>12) ? '0'+(hh-12) : hh)));
	            case 'h'  : return ((hh = date.getHours())==0 ? '12' : (hh>12 ? hh-12 : hh));
	            case 'mm' : return ((min = date.getMinutes())<10 ? '0'+min : min);
			}
	        // y+,M+,d+
			var ch = $3.charAt(0);
			if (ch=='y') return date.getFullYear();
			if (ch=='M') return monthNames[date.getMonth()];
			if (ch=='d') return ((dd = date.getDate())<10 ? '0'+dd : dd);
		}
	);
	return result;
};

Richfaces.Calendar.escape = function (str)
{
	return str.replace(/([yMdaHhm\\])/g,"\\$1");
};
	
Richfaces.Calendar.unescape = function (str)
{
	return str.replace(/\\([yMdaHhm\\])/g,"$1");
};	



function isLeapYear(year) {
	return new Date(year, 1, 29).getDate()==29;
}

function daysInMonth(year,month) {
	return 32 - new Date(year, month, 32).getDate();
}

function daysInMonthByDate(date) {
	return 32 - new Date(date.getFullYear(), date.getMonth(), 32).getDate();
}

function getDay(date, firstWeekDay ) {
	var value = date.getDay() - firstWeekDay;
	if (value < 0) value = 7 + value;
	return value;
}

function getFirstWeek(year, mdifw, fdow) {
	var date = new Date(year,0,1);
	var firstday = getDay(date, fdow);
	
	var weeknumber = (7-firstday<mdifw) ? 0 : 1;
	
	return {date:date, firstDay:firstday, weekNumber:weeknumber, mdifw:mdifw, fdow:fdow};
}

function getLastWeekOfPrevYear(o) {
	var year = o.date.getFullYear()-1;
	var days = (isLeapYear(year) ? 366 : 365);
	var obj = getFirstWeek(year, o.mdifw, o.fdow);
	days = (days - 7 + o.firstDay);
	var weeks = Math.floor(days/7)+1;
	  
	return  weeks+obj.weekNumber;
}

function weekNumber(year, month, mdifw, fdow) {
	
	var o = getFirstWeek(year, mdifw, fdow);
	
	if (month==0) 
	{
		if (o.weekNumber==1) return 1;
		return getLastWeekOfPrevYear(o);
	}
	var	oneweek =  604800000;
	var d = new Date(year, month,1);
		d.setDate( 1+o.firstDay + (getDay(d,fdow)==0?1:0));
		
	weeknumber = o.weekNumber + Math.floor((d.getTime() - o.date.getTime()) / oneweek);
	
	return weeknumber;
}

function Calendar() { this.initialize.apply(this, arguments); }
window.Calendar = Calendar;
Object.assign(Calendar.prototype, {
    initialize: function(id, locale, options, markups) {
		// dayListMarkup - day cell markup
		//		context: {day, date, weekNumber, weekDayNumber, isWeekend, isCurrentMonth,  elementId, component}
		// weekNumberMarkup - week number cell markup
		//		context: {weekNumber, elementId, component}
		// weekDayMarkup - week day cell markup
		//		context: {weekDayLabel, weekDayLabelShort, weekDayNumber, isWeekend, elementId, component}

		// headerMarkup
		// footerMarkup
		// optionalHeaderMarkup - user defined header (optional)
		// optionalFooterMarkup - user defined footer (optional)
		
		// currentDate - date to show month (day not used) (mm/yyyy) 
		// selectedDate - selected date (mm/dd/yyyy)
		// weekDayLabels - collection of week day labels keyed by week day numbers
		// weekDayLabelsShort - collection of week day short labels keyed by week day numbers
		// minDaysInFirstWeek - locale-specific constant defining number of days in the first week
		// firstWeekDay - (0..6) locale-specific constant defining number of the first week day
		// showWeekDaysBar - show WeekDays Bar [default value is true]
		// showWeeksBar - show Weeks numbers bar [default value is true]
		// showApplyButton
		// showHeader
		// showFooter
		
		// POPUP description
		// direction - [top-left, top-right, bottom-left, bottom-right, auto]
		// jointPoint - [top-left, top-right, bottom-left, bottom-right]
		// popup - true
		// id+PopupButton, id+InputDate,  
				
		// boundaryDatesMode - boundary dates onclick action:
		// 						"inactive" or undefined - no action (default)
		//						"scroll" - change current month
		//						"select" - change current month and select date
		//
		// todayControlMode - today control onclick action:
		//						"scroll"
		//						"select"
		//						"hidden"
		
		// isDayEnabled - end-developer JS function
		// dayStyleClass - end-developer JS function that provide style class for day's cells.
		
		// dayCellClass - add div to day cell with class 'rich-calendar-cell-div' and add this class to TD if defined  
		// style - table style
		// styleClass - table class
		
		// disabled
		// readonly
		
		// nonceValue da includere nei tag style
		
		//var _d = new Date();

		this.id = id;
		
		this.params = Object.assign({}, Richfaces.Calendar.defaultOptions);
		Object.assign(this.params, Richfaces.Calendar[locale]);
		Object.assign(this.params, options);
		Object.assign(this.params, markups);
		// labels
		var value = options.labels || {};
		var defaultLabels = {apply:'Apply', today:'Today', clean:'Clean', ok:'OK', cancel:'Cancel', close:'x'};

		for (var name in defaultLabels) {
			if (!value[name]) value[name] = defaultLabels[name];
		}
		this.params.labels = value;
		
		this.popupOffset = {dx:this.params.horizontalOffset, dy:this.params.verticalOffset};
		
		//
		if (!this.params.popup) this.params.showApplyButton = false;
		
		//
		this.params.boundaryDatesMode = this.params.boundaryDatesMode.toLowerCase();
		this.params.todayControlMode = this.params.todayControlMode.toLowerCase();
		
		// time
		this.setTimeProperties();
		
		this.customDayListMarkup = (this.params.dayListMarkup!=CalendarView.dayList);
		
		this.currentDate = this.params.currentDate ? this.params.currentDate : (this.params.selectedDate ? this.params.selectedDate : new Date());
		this.currentDate.setDate(1);
		this.selectedDate = this.params.selectedDate;
				
		this.todayDate = new Date();
		
		this.firstWeekendDayNumber = 6-this.params.firstWeekDay;
		this.secondWeekendDayNumber = (this.params.firstWeekDay>0 ? 7-this.params.firstWeekDay : 0);
		
		this.calendarContext = new CalendarContext(this);
		
		this.DATE_ELEMENT_ID = this.id+'DayCell';
		this.WEEKNUMBER_BAR_ID = this.id+"WeekNum";
		this.WEEKNUMBER_ELEMENT_ID = this.WEEKNUMBER_BAR_ID+'Cell';
		this.WEEKDAY_BAR_ID = this.id+"WeekDay";
		this.WEEKDAY_ELEMENT_ID = this.WEEKDAY_BAR_ID+'Cell';
		this.POPUP_ID = this.id+'Popup';
		this.POPUP_BUTTON_ID = this.id+'PopupButton';
		this.INPUT_DATE_ID = this.id+'InputDate';
		this.IFRAME_ID = this.id+'IFrame';
		this.EDITOR_ID = this.id+'Editor';
		this.EDITOR_SHADOW_ID = this.id+'EditorShadow';

		this.TIME_EDITOR_LAYOUT_ID = this.id+'TimeEditorLayout';
		this.DATE_EDITOR_LAYOUT_ID = this.id+'DateEditorLayout';
		this.EDITOR_LAYOUT_SHADOW_ID = this.id+'EditorLayoutShadow';
		this.TIME_EDITOR_BUTTON_OK = this.id+'TimeEditorButtonOk';
		this.TIME_EDITOR_BUTTON_CANCEL = this.id+'TimeEditorButtonCancel';
		this.DATE_EDITOR_BUTTON_OK = this.id+'DateEditorButtonOk';
		this.DATE_EDITOR_BUTTON_CANCEL = this.id+'DateEditorButtonCancel';
		
		
		//this.popupIntervalId=null;
		
		this.firstDateIndex = 0;
		
		this.daysData = {startDate:null, days:[]};
		this.days = [];
		this.todayCellId = null;
		this.todayCellColor = "";

		this.selectedDateCellId = null;
		this.selectedDateCellColor = "";
		
		var popupStyles = "";
		this.isVisible = true;
		if (this.params.popup==true)
		{
			// popup mode initialisation
//			popupStyles = "display:none; position:absolute;"
			popupStyles = "position:absolute;"
			this.isVisible = false;
		}
		
		var popupStyleClass = '';
		if(this.params.styleClass)
			popupStyleClass = this.params.styleClass;
		
		var nonceValue = this.params.nonceValue;
		var htmlStyleTextBegin = '<style type="text/css" nonce="'+nonceValue+'" >';
		var htmlStyleTextEnd = '</style>';

		var tempStr = "_calResolve('"+this.id+"').component.";

		var textHeaderStyleCssClass = 'rich-calendar-popup-style-' + this.params.cssId;
		var htmlTextHeaderStyle = htmlStyleTextBegin + '.' + textHeaderStyleCssClass+ '{' + popupStyles+this.params.style+ '}' + htmlStyleTextEnd;
		var htmlTextHeader = '<table id="'+this.id+'" border="0" cellpadding="0" cellspacing="0" class="rich-calendar-exterior rich-calendar-popup '+popupStyleClass+' '+textHeaderStyleCssClass+' rich-calendar-display-none"><tbody>';
		var colspan = (this.params.showWeeksBar ? "8" : "7");
		var htmlHeaderOptional = (this.params.optionalHeaderMarkup) ? '<tr><td class="rich-calendar-header-optional" colspan="'+colspan+'" id="'+this.id+'HeaderOptional"></td></tr>' : '';
		var htmlFooterOptional = (this.params.optionalFooterMarkup) ? '<tr><td class="rich-calendar-footer-optional" colspan="'+colspan+'" id="'+this.id+'FooterOptional"></td></tr>' : '';
		var htmlControlsHeader = (this.params.showHeader ? '<tr><td class="rich-calendar-header" colspan="'+colspan+'" id="'+this.id+'Header"></td></tr>' : '');
		var htmlControlsFooter = (this.params.showFooter ? '<tr><td class="rich-calendar-footer" colspan="'+colspan+'" id="'+this.id+'Footer"></td></tr>' : '');
		var htmlTextFooter = '</tbody></table><div>' + htmlTextHeaderStyle + '</div>';
		var htmlTextIFrame = '<iframe src="javascript:\'\'" frameborder="0" scrolling="no" id="' + this.IFRAME_ID + '" style="display:none; position: absolute; width: 1px; height: 1px; background-color:white;">'+'</iframe>';

		// days bar creation
		var styleClass;
		var bottomStyleClass;
		var htmlTextWeekDayBar=[];
		var context;

		// var eventsStr = this.params.disabled || this.params.readonly ? '' : 'onclick="'+tempStr+'eventCellOnClick(event, this);" onmouseover="'+tempStr+'eventCellOnMouseOver(event, this);" onmouseout="'+tempStr+'eventCellOnMouseOut(event, this);"';	
		if (this.params.showWeekDaysBar)
		{ 
			htmlTextWeekDayBar.push('<tr id="'+this.WEEKDAY_BAR_ID+'">');
			if (this.params.showWeeksBar) htmlTextWeekDayBar.push('<td class="rich-calendar-days"><br/></td>');
			var weekDayCounter = this.params.firstWeekDay;
			for (var i=0;i<7;i++)
			{
				context = {weekDayLabel: this.params.weekDayLabels[weekDayCounter], weekDayLabelShort: this.params.weekDayLabelsShort[weekDayCounter], weekDayNumber:weekDayCounter, isWeekend:this.isWeekend(i), elementId:this.WEEKDAY_ELEMENT_ID+i, component:this}; 
				var weekDayHtml = this.evaluateMarkup(this.params.weekDayMarkup, context );
				if (weekDayCounter==6) weekDayCounter=0; else weekDayCounter++;

				styleClass = "rich-calendar-days";
				if (context.isWeekend)
				{
					styleClass += " rich-calendar-weekends";
				}
				if (i==6) styleClass += " rich-right-cell";
				htmlTextWeekDayBar.push('<td class="'+styleClass+'" id="'+context.elementId+'">'+weekDayHtml+'</td>');
			}
			htmlTextWeekDayBar.push('</tr>\n');
		}

		// week & weekNumber creation
		var htmlTextWeek=[];
		var p=0;
		this.dayCellClassName = [];

		for (k=1;k<7;k++)
		{
			bottomStyleClass = (k==6 ? "rich-bottom-cell " : "");			
			htmlTextWeek.push('<tr id="'+this.WEEKNUMBER_BAR_ID+k+'">');
			if (this.params.showWeeksBar)
			{
				context = {weekNumber: k, elementId:this.WEEKNUMBER_ELEMENT_ID+k, component:this}; 
				var weekNumberHtml = this.evaluateMarkup(this.params.weekNumberMarkup, context );
				htmlTextWeek.push('<td class="rich-calendar-week '+bottomStyleClass+'" id="'+context.elementId+'">'+weekNumberHtml+'</td>');
			}
			
			// day cells creation 
			for (var i=0;i<7;i++)
			{
				styleClass = bottomStyleClass+(!this.params.dayCellClass ? "rich-calendar-cell-size" : (!this.customDayListMarkup ? this.params.dayCellClass : ""))+" rich-calendar-cell";
				if (i==this.firstWeekendDayNumber || i==this.secondWeekendDayNumber) styleClass+=" rich-calendar-holly";
				if (i==6) styleClass+=" rich-right-cell";
				
				// styleClass +=' rich-calendar-cell-evt'; // per agganciare gli event handler
				
				this.dayCellClassName.push(styleClass);
				htmlTextWeek.push('<td class="'+styleClass+'" id="'+this.DATE_ELEMENT_ID+p+'" '+
				// eventsStr+
				'>'+(this.customDayListMarkup ? '<div class="rich-calendar-cell-div'+(this.params.dayCellClass ? ' '+this.params.dayCellClass : '')+'"></div>' : '')+'</td>');
				p++;
			}
			htmlTextWeek.push('</tr>');
		}
		
		var obj = _calResolve(this.POPUP_ID).nextSibling;
		if (this.params.popup && Richfaces.browser.isIE6)
		{
			do {	
				if (obj.id == this.IFRAME_ID)
				{
					var iframe = obj;
					obj = obj.nextSibling;
					_calReplace(iframe, htmlTextIFrame);
					break;
				}
			} while (obj = obj.nextSibling);
		}
		
		do {
			if (obj.id == id)
			{
				var div = obj;
				obj = obj.previousSibling;
				_calReplace(div, htmlTextHeader+htmlHeaderOptional+htmlControlsHeader+htmlTextWeekDayBar.join('')+htmlTextWeek.join('')+htmlControlsFooter+htmlFooterOptional+htmlTextFooter);				
				break;
			}
		} while (obj = obj.nextSibling);
		
		// set content
		obj=obj.nextSibling;
		obj.component = this;
		obj.richfacesComponent="richfaces:calendar";
		this["rich:destructor"] = "destructor";
		
		// memory leaks fix
		obj = null;
		
		if(this.params.submitFunction)	this.submitFunction = this.params.submitFunction.bind(this);
		this.prepareEvents();
		
		// add onclick event handlers to input field and popup button
		if (this.params.popup && !this.params.disabled)
		{
			var handler = this.customFunctionEval('event', "_calResolve('"+this.id+"').component.doSwitch();").bind();
			_calObserve(this.POPUP_BUTTON_ID, "click", handler);
			if (!this.params.enableManualInput) 
			{
				_calObserve(this.INPUT_DATE_ID, "click", handler);
			}
		}
		
		this.scrollElements = null;
		
		//alert(new Date().getTime()-_d.getTime());
	},
	
	
	customFunctionEval: function() {
	    var renderNode = document.createElement("script"),
	        len = arguments.length,
	        source = arguments[len-1],
	        args = [];
	
	    if ( 1 < len ) {
	        for ( var i=0; i<(len-1); i++ ) {
	            args.push(arguments[i]);
	        }
	    }
	
	    renderNode.text = "function __ifYouAbsolutelyMustUseIt() { return function("+args.join(", ")+") {" + source + "}}";
	    renderNode.nonce = document.getElementById('expiredMsgScript').nonce;
	   // renderNode.setAttribute('nonce', nonce);
	
	    document.head.appendChild(renderNode).parentNode.removeChild(renderNode);
	    return __ifYouAbsolutelyMustUseIt();
	},
	
	destructor: function()
	{
		if (this.params.popup && this.isVisible)
		{
			Richfaces.removeScrollEventHandlers(this.scrollElements, this.eventOnScroll);
			_calStopObserving(window.document, "click", this.eventOnCollapse);
		}
	},
	
	dateEditorSelectYear: function(value)
	{
		if (this.dateEditorYearID)
		{
			_calRemoveClass(this.dateEditorYearID, 'rich-calendar-editor-btn-selected');
		}
		this.dateEditorYear = this.dateEditorStartYear + value;
		this.dateEditorYearID = this.DATE_EDITOR_LAYOUT_ID+'Y'+value;
		_calAddClass(this.dateEditorYearID, 'rich-calendar-editor-btn-selected');
	},
	
	dateEditorSelectMonth: function(value)
	{
		this.dateEditorMonth = value;
		_calRemoveClass(this.dateEditorMonthID, 'rich-calendar-editor-btn-selected');
		this.dateEditorMonthID = this.DATE_EDITOR_LAYOUT_ID+'M'+value;
		_calAddClass(this.dateEditorMonthID, 'rich-calendar-editor-btn-selected');
	},
	
	scrollEditorYear: function(value)
	{
		var element = _calResolve(this.DATE_EDITOR_LAYOUT_ID+'TR');

		if (this.dateEditorYearID)
		{
			_calRemoveClass(this.dateEditorYearID, 'rich-calendar-editor-btn-selected');
			this.dateEditorYearID='';
		}

		if (!value)
		{
			// update month selection when open editor (value == 0)
			if (this.dateEditorMonth != this.getCurrentMonth())
			{
				this.dateEditorMonth = this.getCurrentMonth();
				_calRemoveClass(this.dateEditorMonthID, 'rich-calendar-editor-btn-selected');
				this.dateEditorMonthID = this.DATE_EDITOR_LAYOUT_ID+'M'+this.dateEditorMonth;
				_calAddClass(this.dateEditorMonthID, 'rich-calendar-editor-btn-selected');
			}			
		}
		
		if (element)
		{
			var div;
			var year = this.dateEditorStartYear = this.dateEditorStartYear+value*10;
			for (var i=0;i<5;i++)
			{
				element = element.nextSibling;
				div = element.firstChild.nextSibling.nextSibling;
				div.firstChild.innerHTML=year;
				if (year == this.dateEditorYear)
				{
					_calAddClass(div.firstChild, 'rich-calendar-editor-btn-selected');
					this.dateEditorYearID = div.firstChild.id;
				}
				div = div.nextSibling;
				div.firstChild.innerHTML=year+5;
				if (year+5  == this.dateEditorYear)
				{
					_calAddClass(div.firstChild, 'rich-calendar-editor-btn-selected');
					this.dateEditorYearID = div.firstChild.id;
				}
				year++;
			}
		}
	},
	
	updateDateEditor: function()
	{
		this.dateEditorYear = this.getCurrentYear();
		this.dateEditorStartYear = this.getCurrentYear() - 4;
		this.scrollEditorYear(0);
	},

	updateTimeEditor: function()
	{
		var th=_calResolve(this.id+'TimeHours');
		var ts=_calResolve(this.id+'TimeSign');
		var tm=_calResolve(this.id+'TimeMinutes');
				
		var h = this.selectedDate.getHours();
		var m = this.selectedDate.getMinutes();
		if (this.timeType==2)
		{
			var a = (h<12 ? 'AM' : 'PM');
			ts.value = a;
			h = (h==0 ? '12' : (h>12 ? h-12 : h));
		}
		th.value = (this.timeHoursDigits==2 && h<10 ? '0'+h : h);
		tm.value = (m<10 ? '0'+m : m);
	},


	createEditor: function()
	{
		var element = _calResolve(this.id);
		var htmlBegin = '<div id="'+this.EDITOR_SHADOW_ID+'" class="rich-calendar-editor-shadow rich-calendar-position-absolute rich-calendar-display-none"></div><table border="0" cellpadding="0" cellspacing="0" id="'+this.EDITOR_ID
		+'" class="rich-calendar-position-absolute rich-calendar-display-none"><tbody><tr><td class="rich-calendar-editor-container" align="center"><div class="rich-calendar-position-relative rich-calendar-width-centopercento">';
		var htmlContent = '<div id="'+this.EDITOR_LAYOUT_SHADOW_ID+'" class="rich-calendar-editor-layout-shadow"></div>';
		
		var htmlEnd = '</div></td></tr></tbody></table>';
		_calInsertAfter(element, htmlBegin+htmlContent+htmlEnd);
		//+this.evaluateMarkup(CalendarView.timeEditor, this.calendarContext)+
		var editor_shadow = _calResolve(this.EDITOR_SHADOW_ID);
		var editor = _calResolve(this.EDITOR_ID);
		var zindex = _calGetStyle(element, 'z-index');
		editor_shadow.style.zIndex = zindex;
		editor.style.zIndex = parseInt(zindex,10)+1;

		this.isEditorCreated = true;

		return editor;
	},

	createTimeEditorLayout: function(editor)
	{
		_calInsertAfter(this.EDITOR_LAYOUT_SHADOW_ID, this.evaluateMarkup(this.calendarContext.timeEditorLayout, this.calendarContext));

		var th=_calResolve(this.id+'TimeHours');
		var ts;
		var tm=_calResolve(this.id+'TimeMinutes');
		if (this.timeType==1)
		{
			sbjQuery(th).SpinButton({digits:this.timeHoursDigits,min:0,max:23});
		}
		else
		{
			sbjQuery(th).SpinButton({digits:this.timeHoursDigits,min:1,max:12});
			ts=_calResolve(this.id+'TimeSign');				
			sbjQuery(ts).SpinButton({});
		}
		sbjQuery(tm).SpinButton({digits:2,min:0,max:59});
		
		this.correctEditorButtons(editor, this.TIME_EDITOR_BUTTON_OK, this.TIME_EDITOR_BUTTON_CANCEL);
		
		this.isTimeEditorLayoutCreated = true;
		this.attachTimeEditorEventHandlers();	
	},
	
	correctEditorButtons: function(editor, buttonID1, buttonID2)
	{
		var button1 = _calResolve(buttonID1);
		var button2 = _calResolve(buttonID2);
		
		jQuery(editor).removeClass( "rich-calendar-visibility-noattr" ).addClass( "rich-calendar-visibility-hidden" );
		jQuery(editor).removeClass( "rich-calendar-display-none" ).addClass( "rich-calendar-display" );
		
		var width1 = Richfaces.Calendar.getOffsetDimensions(button1.firstChild).width; 
		var width2 = Richfaces.Calendar.getOffsetDimensions(button2.firstChild).width;
		
		jQuery(editor).removeClass( "rich-calendar-visibility-hidden" ).addClass( "rich-calendar-visibility-noattr" );
		jQuery(editor).removeClass( "rich-calendar-display" ).addClass( "rich-calendar-display-none" );
		
		var styleWidth = Richfaces.getComputedStyleSize(button1,'width')
				
		if (width1>styleWidth || width2>styleWidth)
		{
			button1.style.width = button2.style.width = (width1>width2 ? width1 : width2)+"px";
		}
	},
	
	createDECell: function(id, value, buttonType, param, className)
	{
		if (buttonType==0)
		{
			return '<div id="'+id+'" class="rich-calendar-editor-btn'+(className ? ' '+className : '')+'">'+value+'</div>';
		}
		else 
		{
			return '<div id="'+id+'" class="rich-calendar-editor-btn'+(className ? ' '+className : '')+ '" _val="'+param+'">'+value+'</div>';
		}
	},

	createDateEditorLayout: function(editor)
	{
		var htmlBegin = '<table id="'+this.DATE_EDITOR_LAYOUT_ID+'" class="rich-calendar-date-layout" border="0" cellpadding="0" cellspacing="0"><tbody><tr id="'+this.DATE_EDITOR_LAYOUT_ID+'TR">';
		var htmlEnd = '</tr></tbody></table>';
		var month = 0;
		this.dateEditorYear = this.getCurrentYear();
		var year = this.dateEditorStartYear = this.dateEditorYear-4;
		var htmlContent = '<td align="center">'+this.createDECell(this.DATE_EDITOR_LAYOUT_ID+'M'+month, this.params.monthLabelsShort[month], 1, month)+'</td>'
						 +'<td align="center" class="rich-calendar-date-layout-split">'+this.createDECell(this.DATE_EDITOR_LAYOUT_ID+'M'+(month+6), this.params.monthLabelsShort[month+6], 1, month+6)+'</td>'
						 +'<td align="center">'+this.createDECell(this.DATE_EDITOR_LAYOUT_ID+'_LT','&lt;', 0, -1)+'</td>'
						 +'<td align="center">'+this.createDECell(this.DATE_EDITOR_LAYOUT_ID+'_GT','&gt;', 0, 1)+'</td>';
			month++;
		
		for (var i=0;i<5;i++)
		{
			htmlContent+='</tr><tr><td align="center">'+this.createDECell(this.DATE_EDITOR_LAYOUT_ID+'M'+month, this.params.monthLabelsShort[month], 1, month)+'</td>'
						+'<td align="center" class="rich-calendar-date-layout-split">'+this.createDECell(this.DATE_EDITOR_LAYOUT_ID+'M'+(month+6), this.params.monthLabelsShort[month+6], 1, month+6)+'</td>'
						+'<td align="center">'+this.createDECell(this.DATE_EDITOR_LAYOUT_ID+'Y'+i, year, 2, i, (i==4 ? 'rich-calendar-editor-btn-selected' : ''))+'</td>'
						+'<td align="center">'+this.createDECell(this.DATE_EDITOR_LAYOUT_ID+'Y'+(i+5), year+5, 2, i+5)+'</td>';
			month++;
			year++;
		}
		this.dateEditorYearID = this.DATE_EDITOR_LAYOUT_ID+'Y4';
		this.dateEditorMonth = this.getCurrentMonth();
		this.dateEditorMonthID = this.DATE_EDITOR_LAYOUT_ID+'M'+this.dateEditorMonth;
		
		htmlContent+='</tr><tr><td colspan="2" class="rich-calendar-date-layout-ok">'+
					 '<div id="'+this.DATE_EDITOR_BUTTON_OK+'" class="rich-calendar-time-btn rich-calendar-float-right"><span>'+this.params.labels.ok+'</span></div>'+
					 '</td><td colspan="2" class="rich-calendar-date-layout-cancel">'+
					 '<div id="'+this.DATE_EDITOR_BUTTON_CANCEL+'" class="rich-calendar-time-btn rich-calendar-float-left"><span>'+this.params.labels.cancel+'</span></div>'+
					 '</td>';


		_calInsertAfter(this.EDITOR_LAYOUT_SHADOW_ID, htmlBegin+htmlContent+htmlEnd);
		
		_calAddClass(this.dateEditorMonthID, 'rich-calendar-editor-btn-selected');
		
		this.correctEditorButtons(editor, this.DATE_EDITOR_BUTTON_OK, this.DATE_EDITOR_BUTTON_CANCEL);
		
		this.isDateEditorLayoutCreated = true;
		this.attachDateEditorEventHandlers();	
	},	
	
	createSpinnerTable: function(id) {
		return '<table cellspacing="0" cellpadding="0" border="0"><tbody><tr>'+
					'<td class="rich-calendar-spinner-input-container">'+
						'<input id="' + id + '" name="' + id + '" class="rich-calendar-spinner-input" type="text" />'+
					'</td>'+	
					'<td class="rich-calendar-spinner-buttons">'+
						'<table border="0" cellspacing="0" cellpadding="0"><tbody>'+
							'<tr><td>'+
								'<div id="'+id+'BtnUp" class="rich-calendar-spinner-up"><span></span></div>'+
							'</td></tr>'+
							'<tr><td>'+
								'<div id="'+id+'BtnDown" class="rich-calendar-spinner-down"><span></span></div>'+
							'</td></tr>'+
						'</tbody></table>'+
					'</td>'+
				'</tr></tbody></table>';
	},
	
	setTimeProperties: function() {
		this.timeType = 0;

		var dateTimePattern = this.params.datePattern;
		var pattern = [];
		var re = /(\\\\|\\[yMdaHhm])|(y+|M+|d+|a|H{1,2}|h{1,2}|m{2})/g;
		var r;
		while (r = re.exec(dateTimePattern))
			if (!r[1])
  				pattern.push({str:r[0],marker:r[2],idx:r.index});
  		
  		var datePattern = "";
  		var timePattern = "";
  		
		var digits,h,hh,m,a;
		var id = this.id;
		
		var getString = function (p) {
			return (p.length==0 ? obj.marker : dateTimePattern.substring(pattern[i-1].str.length+pattern[i-1].idx, obj.idx+obj.str.length));
		};
		
  		for (var i=0;i<pattern.length;i++)
  		{
  			var obj = pattern[i];
  			var ch = obj.marker.charAt(0);
  			if (ch=='y'||ch=='M'||ch=='d') datePattern+=getString(datePattern);
  			else if (ch=='a')
  			{
  				a=true;
  				timePattern+=getString(timePattern);
  			}
  			else if (ch=='H')
  			{
  				h=true;
  				digits=obj.marker.length;
  				timePattern+=getString(timePattern);
  			}
  			else if (ch=='h')
  			{
  				hh=true;
  				digits=obj.marker.length;
  				timePattern+=getString(timePattern);
  			}
  			else if (ch=='m')
  			{
  				m=true;
  				timePattern+=getString(timePattern);
  			}
  			
  			
  		}
  		this.datePattern = datePattern;
  		this.timePattern = timePattern;

  		var calendar = this;
  		
		this.timePatternHtml = timePattern.replace(/(\\\\|\\[yMdaHhm])|(H{1,2}|h{1,2}|m{2}|a)/g,
			function($1,$2,$3) {
				if ($2) return $2.charAt(1);
				switch ($3) {
		            case 'a'  : return '</td><td>'+calendar.createSpinnerTable(id+'TimeSign')+'</td><td>';
		            case 'H'  :
		            case 'HH' :
		            case 'h'  :
		            case 'hh' : return '</td><td>'+calendar.createSpinnerTable(id+'TimeHours')+'</td><td>';
		            case 'mm' : return '</td><td>'+calendar.createSpinnerTable(id+'TimeMinutes')+'</td><td>';
				}
			}
		);
		
		this.timePatternHtml = '<table border="0" cellpadding="0"><tbody><tr><td>'+this.timePatternHtml+'</td></tr></tbody></table>';
  		
		if (m && h)
		{
			this.timeType = 1;
		}
		else if (m && hh && a) 
		{
			this.timeType = 2;
		}
		this.timeHoursDigits = digits;
	},
	
	eventOnScroll: function (e) {
		this.doCollapse();
	},
	
	doCollapse: function() {
		
		if (!this.params.popup || !this.isVisible) return;
		
		var element = _calResolve(this.id);
		
		if (this.invokeEvent("collapse", element))
		{
			if (this.isEditorVisible) this.hideEditor();
			Richfaces.removeScrollEventHandlers(this.scrollElements, this.eventOnScroll);
			_calStopObserving(window.document, "click", this.eventOnCollapse);
			
			var iframe=null;
			if (Richfaces.browser.isIE6) iframe = _calResolve(this.IFRAME_ID);
			if (iframe) _calHide(iframe);
			
			var calT = jQuery(element);
			calT.removeClass( "rich-calendar-display" ).addClass( "rich-calendar-display-none" );
			
			this.isVisible = false;

		}
	},

	collapse: function() {
		this.doCollapse();
	},
	
	doExpand: function(e) {
		if (!this.isRendered) {
			this.isRendered = true;
			this.render();
		}
		this.skipEventOnCollapse = false;
		if (e && e.type=='click') this.skipEventOnCollapse = true;
		if (!this.params.popup || this.isVisible) return;
		
		var element = _calResolve(this.id);

		if (this.invokeEvent("expand", element, e))
		{
			var iframe=null;
			if (Richfaces.browser.isIE6) iframe = _calResolve(this.IFRAME_ID);

			var base = _calResolve(this.POPUP_ID)
			var baseInput = base.firstChild;
			var baseButton = baseInput.nextSibling;
			
			if (baseInput && baseInput.value!=undefined)
			{
				this.selectDate(baseInput.value, false, {event:e, element:element});
			}
			
			//rect calculation
			
			var offsetBase = _calCumulativeOffset(baseButton);
			
			if (this.params.showInput)
			{
				var offsetBase1 = _calCumulativeOffset(baseInput);
			
				offsetBase = [offsetBase[0]<offsetBase1[0] ? offsetBase[0] : offsetBase1[0],
							  offsetBase[1]<offsetBase1[1] ? offsetBase[1] : offsetBase1[1]];
				var offsetDimInput = Richfaces.Calendar.getOffsetDimensions(baseInput);
			}
			
			var offsetDimBase = Richfaces.Calendar.getOffsetDimensions(base);
			var offsetDimButton = Richfaces.Calendar.getOffsetDimensions(baseButton);
			var offsetTemp = (window.opera ? [0,0] : _calRealOffset(baseButton));
			//alert("offsetBase:"+offsetBase+" offsetTemp:"+offsetTemp+' scrollTop:'+baseButton.offsetParent.scrollTop+" offsetParent:"+baseButton.offsetParent);
			var o = {left: offsetBase[0]-offsetTemp[0],
					 top: offsetBase[1]-offsetTemp[1],
					 width: offsetDimBase.width,
					 height: (offsetDimInput && offsetDimInput.height>offsetDimButton.height ? offsetDimInput.height : offsetDimButton.height)};
					 
			Richfaces.Calendar.setElementPosition(element, o, this.params.jointPoint, this.params.direction, this.popupOffset);
	
			if (iframe)
			{
				iframe.style.left = element.style.left;
				iframe.style.top = element.style.top;
				var edim = Richfaces.Calendar.getOffsetDimensions(element);
				iframe.style.width = edim.width+'px';
				iframe.style.height = edim.height+'px';
				_calShow(iframe);
			}
			
			var calT = jQuery(element);
			calT.removeClass( "rich-calendar-display-none" ).addClass( "rich-calendar-display" );
			
			this.isVisible = true;

			_calObserve(window.document, "click", this.eventOnCollapse);
			
			Richfaces.removeScrollEventHandlers(this.scrollElements, this.eventOnScroll);
			this.scrollElements = Richfaces.setupScrollEventHandlers(element, this.eventOnScroll);
		}
		
		this.attachEventHandlers();
	},

	expand: function(e) {
		this.doExpand(e);
	},
	
	doSwitch: function(e) {
		this.isVisible ? this.doCollapse() : this.doExpand(e);
	},

	switchState: function(e) {
		this.doSwitch(e);
	},
	
	eventOnCollapse: function (e) {
		if (this.skipEventOnCollapse)
		{
			this.skipEventOnCollapse = false;
			return true;
		}

		if (_calEventTarget(e).id == this.POPUP_BUTTON_ID || (!this.params.enableManualInput && _calEventTarget(e).id == this.INPUT_DATE_ID) ) return true;
		
		// TODO: remove line below and check functionality
		if (_calWithin(_calResolve(this.id), _calPointerX(e), _calPointerY(e))) return true;
		this.doCollapse();
		
		return true;
	},
	
	setInputField: function(dateStr, event)
	{
		var field = _calResolve(this.INPUT_DATE_ID);
		if (field.value!=dateStr)
		{
			field.value=dateStr;
			this.invokeEvent("changed",field, event, this.selectedDate);
		}
	},
	
	getCurrentDate: function() {
		return this.currentDate;
	},	
	getSelectedDate: function() {
		if (!this.selectedDate) return null; else return this.selectedDate;
	},
	getSelectedDateString: function(pattern) {
		if (!this.selectedDate) return "";
		if (!pattern) pattern = this.params.datePattern;
		return Richfaces.Calendar.formatDate(this.selectedDate, pattern, this.params.monthLabels, this.params.monthLabelsShort);
	},

	getPrevYear: function() {
		var value = this.currentDate.getFullYear()-1;
		if (value<0) value = 0;
		return value;
	},
	getPrevMonth: function(asMonthLabel) {
		var value = this.currentDate.getMonth()-1;
		if (value < 0 ) value = 11;
		if (asMonthLabel)
		{
			return this.params.monthLabels[value];
		} else return value;
	},
	getCurrentYear: function() {
		return this.currentDate.getFullYear();
	},
	getCurrentMonth: function(asMonthLabel) {
		var value = this.currentDate.getMonth();
		if (asMonthLabel)
		{
			return this.params.monthLabels[value];
		} else return value;
	},
	getNextYear: function() {
		return this.currentDate.getFullYear()+1;
	},
	getNextMonth: function(asMonthLabel) {
		var value = this.currentDate.getMonth()+1;
		if (value > 11 ) value = 0;
		if (asMonthLabel)
		{
			return this.params.monthLabels[value];
		} else return value;
	},
	
	isWeekend: function(weekday) {
		return (weekday == this.firstWeekendDayNumber || weekday == this.secondWeekendDayNumber);
	},
	
	prepareEvents: function() {
		this.eventOnCollapse = this.eventOnCollapse.bind(this);
		this.eventOnScroll = this.eventOnScroll.bind(this);
	},
	
	invokeEvent: function(eventName, element, event, date) {
		var eventFunction = this.params['on'+eventName];
		var result;

		if (eventFunction)
		{
			var eventObj;

			if (event)
			{
				eventObj = event;
			}
			else if( document.createEventObject ) 
			{
				eventObj = document.createEventObject();
			}
			else if( document.createEvent )
			{
				eventObj = document.createEvent('Events');
				eventObj.initEvent( eventName, true, false );
			}
			
			eventObj.rich = {component:this};
			eventObj.rich.date = date;

			try
			{
				result = eventFunction.call(element, eventObj);
			}
			catch (e) { LOG.warn("Exception: "+e.Message + "\n[on"+eventName + "]"); }

		}
		
		if (result!=false) result = true;
		
		return result;
	},
	
	setupTimeForDate: function (date) {
		if (this.selectedDate && (!this.params.resetTimeOnDateSelect || 
			(this.selectedDate.getFullYear() == date.getFullYear() && 
			this.selectedDate.getMonth() == date.getMonth() &&
			this.selectedDate.getDate() == date.getDate())))
		{
			date.setHours(this.selectedDate.getHours());
			date.setMinutes(this.selectedDate.getMinutes());
		} else
		{
			date.setHours(this.params.defaultTime.hours);
			date.setMinutes(this.params.defaultTime.minutes);
		}
	},
	
	eventCellOnClick: function (e, obj) {
		var daydata = this.days[parseInt(obj.id.substr(this.DATE_ELEMENT_ID.length),10)];
		if (daydata.enabled && daydata._month==0)
		{
			var date=new Date(this.currentDate);
			date.setDate(daydata.day);
			if (this.timeType)
			{
				this.setupTimeForDate(date);
			}
			
			if (this.selectDate(date,true, {event:e, element:obj}) && !this.params.showApplyButton)
			{
				this.doCollapse();
			}
				
		} else if (daydata._month!=0){
			if (this.params.boundaryDatesMode == "scroll") 
				if (daydata._month==-1) this.prevMonth(); else this.nextMonth();
			else if (this.params.boundaryDatesMode == "select") 
			{
				var date = new Date(daydata.date);
				if (this.timeType)
				{
					this.setupTimeForDate(date);
				}
				
				if (this.selectDate(date, false, {event:e, element:obj}) && !this.params.showApplyButton)
				{
				 	this.doCollapse();
				}
			}
		}
	},

	eventCellOnMouseOver: function (e, obj) {
		var daydata = this.days[parseInt(obj.id.substr(this.DATE_ELEMENT_ID.length),10)];
		if (this.invokeEvent("datemouseover", obj, e, daydata.date) && daydata.enabled)
		{
			if (daydata._month==0 && obj.id!=this.selectedDateCellId && obj.id!=this.todayCellId) _calAddClass(obj,'rich-calendar-hover');
		}
	},
	
	eventCellOnMouseOut: function (e, obj) {
		var daydata = this.days[parseInt(obj.id.substr(this.DATE_ELEMENT_ID.length),10)];
		if (this.invokeEvent("datemouseout", obj, e, daydata.date) && daydata.enabled)
		{
			if (daydata._month==0 && obj.id!=this.selectedDateCellId && obj.id!=this.todayCellId) _calRemoveClass(obj,'rich-calendar-hover');
		}
	},

	load:function(daysData, isAjaxMode)	{
		//	startDate,
		//	daysData:array[]
		//	{
		//			day
		//			enabled boolean
		//			text1: 'Meeting...',
		//			text2: 'Meeting...'
		//			tooltip 
		//			hasTooltip 
		//			styleClass
		//	}
		
		//if (!_calResolve(this.id).component) return;
		
		if (daysData) {
			this.daysData = this.indexData(daysData, isAjaxMode);
		} else {
			this.daysData = null;
		}
		
		this.isRendered = false;
		if (this.isVisible) {
			this.render();
		}; 
		
		if (typeof this.afterLoad=='function') 
		{
			this.afterLoad();
			this.afterLoad=null;
		}
	},
	
	indexData:function(daysData, isAjaxMode) {
		var dateYear = daysData.startDate.getFullYear();
		var dateMonth = daysData.startDate.getMonth();
		
		daysData.index = [];
		daysData.index[dateYear+'-'+dateMonth] = 0;
		if (isAjaxMode)
		{
			this.currentDate = daysData.startDate;
			this.currentDate.setDate(1);
			return daysData;
		}
		var idx = daysInMonthByDate(daysData.startDate)-daysData.startDate.getDate()+1;
		
		while (daysData.days[idx])
		{
			if (dateMonth==11) {dateYear++; dateMonth=0;} else dateMonth++;
			daysData.index[dateYear+'-'+dateMonth] = idx;
			idx+= (32 - new Date(dateYear, dateMonth, 32).getDate());
		}
		return daysData;
	},
	
	getCellBackgroundColor: function(element)
	{
		var result;
		if (Richfaces.browser.isSafari && this.params.popup && !this.isVisible)
		{
			// Safari 2.0 fix 
			// if [display:none] _calGetStyle() function returns null;
			var els = _calResolve(this.id).style;
			var originalVisibility = els.visibility;
			var originalDisplay = els.display;
			els.visibility = 'hidden';
			els.display = '';
			result = _calParseColor(_calGetStyle(element, 'background-color'));
			els.display = originalDisplay;
			els.visibility = originalVisibility;
		} else 
		{					
			result = _calParseColor(_calGetStyle(element, 'background-color'));
		}
		
		return result;
	},
	
	clearEffect: function (element_id, effect, className, className1)
	{
		if (effect) 
		{
			effect.cancel();
			effect=null;
		}
		if (element_id)
		{
			var e = _calResolve(element_id);
			e.style['backgroundColor'] = '';
			if (className) _calRemoveClass(e, className);
			if (className1) _calAddClass(e, className1);
		}
		return null;
	},
	
	render:function() {
		//var _d=new Date();
		this.isRendered = true;
		this.todayDate = new Date();		
		
		var currentYear = this.getCurrentYear();
		var currentMonth = this.getCurrentMonth();
		
		var todayflag = (currentYear == this.todayDate.getFullYear() && currentMonth == this.todayDate.getMonth());
		var todaydate =  this.todayDate.getDate();
		
		var selectedflag = this.selectedDate && (currentYear == this.selectedDate.getFullYear() && currentMonth == this.selectedDate.getMonth())
		var selecteddate = this.selectedDate && this.selectedDate.getDate();

		var wd = getDay(this.currentDate, this.params.firstWeekDay);
		var currentMonthDays = daysInMonthByDate(this.currentDate);
		var previousMonthDays = daysInMonth(currentYear, currentMonth-1);
		
		var p=0;
		var month=-1;
		this.days = [];
		var dayCounter = previousMonthDays  - wd + 1;
		
		// previuos month days
		if (wd>0) while (dayCounter<=previousMonthDays)
		{
			this.days.push({day:dayCounter, isWeekend: this.isWeekend(p), _month:month}); dayCounter++; p++;
		}
			
		dayCounter = 1;
		month=0;
		
		this.firstDateIndex = p;

		// current month days
		if (this.daysData && this.daysData.index[currentYear+'-'+currentMonth]!=undefined)
		{
			var idx = this.daysData.index[currentYear+'-'+currentMonth];
			if (this.daysData.startDate.getFullYear()==currentYear && this.daysData.startDate.getMonth()==currentMonth)
			{
				var firstDay = firstDay=(this.daysData.days[idx].day ? this.daysData.days[idx].day : this.daysData.startDate.getDate());
				while (dayCounter<firstDay)
				{
					this.days.push({day:dayCounter, isWeekend:this.isWeekend(p%7), _month:month});
				
					dayCounter++;
					p++;
				}
			}
			
			var len = this.daysData.days.length;
			var obj;
			var flag;
			while (idx<len && dayCounter<=currentMonthDays)
			{
				flag = this.isWeekend(p%7);
				obj = this.daysData.days[idx];
				obj.day = dayCounter;
				obj.isWeekend = flag;
				obj._month = month;
				this.days.push(obj);
				idx++;
				dayCounter++;
				p++;
			}
		}
		while (p<42)
		{
			if (dayCounter>currentMonthDays) {dayCounter=1; month=1;}
			this.days.push({day:dayCounter, isWeekend: this.isWeekend(p%7), _month:month});
			dayCounter++;
			p++;
		}
		
		// render
		this.renderHF();
		
		//days render
		p=0;
		var element;
		var dataobj;
		var wn;
		if (this.params.showWeeksBar) wn = weekNumber(currentYear, currentMonth, this.params.minDaysInFirstWeek, this.params.firstWeekDay); /// fix it
		this.selectedDayElement=null;
		var weekflag=true;

		var e;
		
		var boundaryDatesModeFlag = (this.params.boundaryDatesMode == "scroll" || this.params.boundaryDatesMode == "select");
		
		this.todayCellId = this.clearEffect(this.todayCellId, this.highlightEffect);
		this.selectedDateCellId = this.clearEffect(this.selectedDateCellId, this.highlightEffect2);
		
		//var _d=new Date();
		var obj = _calResolve(this.WEEKNUMBER_BAR_ID+"1");
		for (var k=1;k<7;k++)
		{
			//
			dataobj = this.days[p];
			
			element = obj.firstChild;
			var weeknumber; 

			// week number update			
			if (this.params.showWeeksBar)
			{
				// TODO: fix:  there is no weekNumber in dataobj if showWeeksBar == false;
				if (weekflag && currentMonth==11 &&
				   (k==5||k==6) &&
				   (dataobj._month==1 || (7 - (currentMonthDays - dataobj.day + 1)) >= this.params.minDaysInFirstWeek) )
				{
					wn=1;
					weekflag=false;
				}
				weeknumber = wn;
			    element.innerHTML = this.evaluateMarkup(this.params.weekNumberMarkup, {weekNumber: wn++, elementId:element.id, component:this} );
			    if (k==1&&wn>52) wn=1;
			    element = element.nextSibling;
			}
			
			var weekdaycounter = this.params.firstWeekDay;
			var contentElement = null;

			while (element)
			{
				dataobj.elementId=element.id;
				dataobj.date=new Date(currentYear, currentMonth+dataobj._month, dataobj.day);
				dataobj.weekNumber = weeknumber;
				dataobj.component = this;
				dataobj.isCurrentMonth = (dataobj._month==0);
				dataobj.weekDayNumber = weekdaycounter;

				// call user function to get day state
				if (dataobj.enabled != false) dataobj.enabled = this.params.isDayEnabled(dataobj);
				// call user function to custom class style
				if (!dataobj.styleClass) dataobj.customStyleClass = this.params.dayStyleClass(dataobj);
				else
				{
					var styleclass = this.params.dayStyleClass(dataobj);
					dataobj.customStyleClass = dataobj.styleClass;
					if (styleclass) dataobj.customStyleClass += " " + styleclass;
				}

				contentElement = (this.customDayListMarkup ? element.firstChild : element);
				contentElement.innerHTML = this.evaluateMarkup(this.params.dayListMarkup, dataobj );

				if (weekdaycounter==6) weekdaycounter=0; else weekdaycounter++;
				
				var classNames = this.dayCellClassName[p];
				
				// class styles
				if (dataobj._month!=0) 
				{
					classNames+=' rich-calendar-boundary-dates';
					if (!this.params.disabled && !this.params.readonly && boundaryDatesModeFlag)
					{
						classNames+=' rich-calendar-btn';
					}
				}
				else 
				{
					if (todayflag && dataobj.day==todaydate) 
					{
						this.todayCellId = element.id;
						this.todayCellColor = this.getCellBackgroundColor(element);
						classNames+=" rich-calendar-today";
					}
				
					if (selectedflag && dataobj.day==selecteddate)
					{
						this.selectedDateCellId = element.id;
						this.selectedDateCellColor = this.getCellBackgroundColor(element);
						classNames+=" rich-calendar-select";
					} 
					else if (!this.params.disabled && !this.params.readonly && dataobj.enabled) classNames+=' rich-calendar-btn';

					// add custom style class
					if (dataobj.customStyleClass) 
					{
						classNames+=' '+dataobj.customStyleClass;
					}
				}
				element.className = classNames;
				
				p++;

				dataobj = this.days[p];
				element=element.nextSibling;
			}
			obj = obj.nextSibling;
		}
		
		//alert(new Date().getTime()-_d.getTime());
		
		// hack for IE 6.0 //fix 1072 // TODO check this bug again 
		/*if (Richfaces.browser.isIE6)
		{
			var element = _calResolve(this.id);
			if (element)
			{
				element.style.width = "0px";
				element.style.height = "0px";
			}
		}*/
		
		this.attachEventHandlers();
	},

	renderHF: function()
	{
		if (this.params.showHeader) this.renderMarkup(this.params.headerMarkup, this.id+"Header", this.calendarContext);
		if (this.params.showFooter) this.renderMarkup(this.params.footerMarkup, this.id+"Footer", this.calendarContext);
		
		this.renderHeaderOptional();
		this.renderFooterOptional();			
	},

	renderHeaderOptional: function()
	{
		this.renderMarkup(this.params.optionalHeaderMarkup, this.id+"HeaderOptional", this.calendarContext);
	},	

	renderFooterOptional: function()
	{
		this.renderMarkup(this.params.optionalFooterMarkup, this.id+"FooterOptional", this.calendarContext);
	},
	
	renderMarkup: function (markup, elementId, context)
	{
		if (!markup) return;

		var e = _calResolve(elementId);
		if (!e) return; 
	
		e.innerHTML = markup.map(function(m) { return m.getContent(context); }).join('');
	},
	
	evaluateMarkup: function(markup, context)
	{
		if (!markup) return "";
		return markup.map(function(m) { return m.getContent(context); }).join('');
	},
	
	onUpdate: function()
	{
		var formattedDate = Richfaces.Calendar.formatDate(this.getCurrentDate(),"MM/yyyy");
		_calResolve(this.id+'InputCurrentDate').value=formattedDate;
		
		if (this.submitFunction)
			this.submitFunction(formattedDate);
		else
			this.render();
	},
	
	nextMonth: function() {
		this.changeCurrentDateOffset(0,1);
	},
	
	prevMonth: function() {
		this.changeCurrentDateOffset(0,-1);
	},
	
	nextYear: function() {
		this.changeCurrentDateOffset(1,0);
	},
	
	prevYear: function() {
		this.changeCurrentDateOffset(-1,0);
	},
	
	changeCurrentDate: function(year, month, noUpdate) {
		if (this.getCurrentMonth()!=month || this.getCurrentYear()!=year)
		{
			var date = new Date(year, month,1);
			if (this.invokeEvent("currentdateselect", _calResolve(this.id), null, date))
			{
				// fix for RF-2450.
				// Additional event is fired: after the hidden input with current date
				// value is updated in function onUpdate() and then
				// the "currentdateselected" Event is fired.
				this.currentDate = date;
				if (noUpdate) this.render(); else this.onUpdate();
				this.invokeEvent("currentdateselected", _calResolve(this.id), null, date);
				return true;
			}
		}
		return false;
	},
	
	changeCurrentDateOffset: function(yearOffset, monthOffset) {
		var date = new Date(this.currentDate.getFullYear()+yearOffset, this.currentDate.getMonth()+monthOffset,1);
			
		if (this.invokeEvent("currentdateselect", _calResolve(this.id), null, date))
		{
			// fix for RF-2450.
			// Additional event is fired: after the hidden input with current date
			// value is updated in function onUpdate() and then
			// the "currentdateselected" Event is fired.
			this.currentDate = date;
			this.onUpdate();
			this.invokeEvent("currentdateselected", _calResolve(this.id), null, date);
		}
	},

	today: function(noUpdate, noHighlight) {

			var now = new Date();
	
			var nowyear = now.getFullYear();
			var nowmonth = now.getMonth();
			var nowdate = now.getDate();
			var updateflag = false;
			
			if (nowdate!=this.todayDate.getDate()) {updateflag=true; this.todayDate = now;}
			
			if (nowyear != this.currentDate.getFullYear() || nowmonth != this.currentDate.getMonth() )
			{
				updateflag = true;
				this.currentDate = new Date(nowyear, nowmonth, 1);
			}
	
			if (this.params.todayControlMode=='select')
			{
				noHighlight=true;
			}
			
			if (updateflag)
			{
				if (noUpdate) this.render(); else this.onUpdate();
			}
			else
			{
				// highlight today
				
				if (this.isVisible && this.todayCellId && !noHighlight)
				{
					this.clearEffect(this.todayCellId, this.highlightEffect);
					if (this.todayCellColor!="transparent")
					{
						this.highlightEffect = new Effect.Highlight(_calResolve(this.todayCellId), {startcolor: this.todayCellColor, duration:0.3, transition: Effect.Transitions.sinoidal,
						afterFinish: this.onHighlightFinish});
					}
				}
			}
	
			// todayControl select mode
			if (this.params.todayControlMode=='select' && !this.params.disabled && !this.params.readonly)
				if (updateflag && !noUpdate && this.submitFunction)
				{
					this.afterLoad = this.selectToday;
				}
				else this.selectToday();
		
		this.attachEventHandlers();
	},

	selectToday: function()
	{
		if (this.todayCellId)
		{
			var daydata = this.days[parseInt(_calResolve(this.todayCellId).id.substr(this.DATE_ELEMENT_ID.length),10)];
			var today = new Date();
			var date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
			if (this.timeType)
			{
				this.setupTimeForDate(date);
			}
			if (daydata.enabled && this.selectDate(date,true) && !this.params.showApplyButton)
			{
				this.doCollapse();
			}
		}		
	},
	
	onHighlightFinish: function (object)
	{
		object.element.style['backgroundColor'] = '';
	},
	
	selectDate: function(date, noUpdate, eventData) {
		
		if (!eventData)
		{
			eventData = {event: null, element: null};
		}
		
		var oldSelectedDate = this.selectedDate;
		var newSelectedDate;
		if (date)
		{
			if (typeof date=='string') 
			{
				date = Richfaces.Calendar.parseDate(date,this.params.datePattern, this.params.monthLabels, this.params.monthLabelsShort);
			}
			newSelectedDate = date;
		}
		else
		{
			newSelectedDate = null;
		}

		// fire user event
		var flag = true;
		var isDateChange = false;
		if ( (oldSelectedDate - newSelectedDate) && (oldSelectedDate!=null || newSelectedDate!=null) )
		{
			isDateChange = true;
			flag = this.invokeEvent("dateselect", eventData.element, eventData.event, date);
		}	
		
		if (flag)
		{		   
			if (newSelectedDate!=null)
			{
				if (newSelectedDate.getMonth()==this.currentDate.getMonth() && newSelectedDate.getFullYear()==this.currentDate.getFullYear())
				{
					this.selectedDate = newSelectedDate;
					if (!oldSelectedDate || (oldSelectedDate - this.selectedDate))
					{
						// find cell and change style class
						var e = _calResolve(this.DATE_ELEMENT_ID+(this.firstDateIndex + this.selectedDate.getDate()-1));
						
						this.clearEffect(this.selectedDateCellId, this.highlightEffect2, "rich-calendar-select", (this.params.disabled || this.params.readonly ? null : "rich-calendar-btn"));
						this.selectedDateCellId = e.id;
						this.selectedDateCellColor = this.getCellBackgroundColor(e);
	
						_calRemoveClass(e, "rich-calendar-btn");
						_calRemoveClass(e, "rich-calendar-hover");
						_calAddClass(e, "rich-calendar-select");
	
						this.renderHF();
					}
					else if (this.timeType!=0) this.renderHF();
				}
				else
				{
					//RF-5600
					this.selectedDate = newSelectedDate;

					// change currentDate and call this.onUpdate();
					if (this.changeCurrentDate(newSelectedDate.getFullYear(), newSelectedDate.getMonth(), noUpdate))
					{
						//this.selectedDate = newSelectedDate;
					} else {
						this.selectedDate = oldSelectedDate;
						isDateChange = false;
					}
				}
			}
			else
			{
				this.selectedDate = null;

				this.clearEffect(this.selectedDateCellId, this.highlightEffect2, "rich-calendar-select", (this.params.disabled || this.params.readonly ? null : "rich-calendar-btn"));
				
				if (this.selectedDateCellId)
				{
					this.selectedDateCellId = null;
					this.renderHF();					
				}
				
				var date = new Date();
				if (this.currentDate.getMonth()==date.getMonth() && this.currentDate.getFullYear()==date.getFullYear())
				{
					this.renderHF();
				}
				
				var todayControlMode = this.params.todayControlMode;
				this.params.todayControlMode = '';
				this.today(noUpdate, true);
				this.params.todayControlMode = todayControlMode;
			}
			
			// call user event
			if (isDateChange)
			{
				this.invokeEvent("dateselected", eventData.element, eventData.event, this.selectedDate);
				if (!this.params.showApplyButton)
				{
					this.setInputField(this.selectedDate!=null ? this.getSelectedDateString(this.params.datePattern) : "", eventData.event);
				}
			}
		}
		
		return isDateChange;			
	},
	
	resetSelectedDate: function()
	{
		if (!this.selectedDate) return;
		if (this.invokeEvent("dateselect", null, null, null))
		{
			this.selectedDate = null;
			this.invokeEvent("dateselected", null, null, null);
			
			this.selectedDateCellId = this.clearEffect(this.selectedDateCellId, this.highlightEffect2, "rich-calendar-select", (this.params.disabled || this.params.readonly ? null : "rich-calendar-btn"));
			 
			this.renderHF();
			if (!this.params.showApplyButton)
			{
				this.setInputField("", null);
				this.doCollapse();
			}
		}
	},
	
	showSelectedDate: function()
	{	
		if (!this.selectedDate) return;
		if (this.currentDate.getMonth()!=this.selectedDate.getMonth() || this.currentDate.getFullYear()!=this.selectedDate.getFullYear())
		{
			this.currentDate = new Date(this.selectedDate);
			this.currentDate.setDate(1);
			this.onUpdate();
		}
		else
		{
			// highlight Selected Date
			if (this.isVisible && this.selectedDateCellId)
			{
				this.clearEffect(this.selectedDateCellId, this.highlightEffect2);
				if (this.selectedDateCellColor!="transparent")
				{
					this.highlightEffect2 = new Effect.Highlight(_calResolve(this.selectedDateCellId), {startcolor: this.selectedDateCellColor, duration:0.3, transition: Effect.Transitions.sinoidal,
					afterFinish: this.onHighlightFinish});
				}
			}			
		}
	},
	
	close: function(updateDate)
	{
		if (updateDate)
		{
			this.setInputField(this.getSelectedDateString(this.params.datePattern), null);
		}		
		this.doCollapse();
	},
	
	setEditorPosition: function (element, editor, shadow)
	{
		element;
		
		var dim = Richfaces.Calendar.getOffsetDimensions(element);
		editor.style.width = shadow.style.width = dim.width + 'px';
		editor.style.height = shadow.style.height = dim.height + 'px';
		
		Richfaces.Calendar.clonePosition([editor,shadow], element);
	},
	
	showTimeEditor: function()
	{
		var editor;
		if (this.timeType==0) return;
		if (!this.isEditorCreated) editor = this.createEditor();
		else editor = _calResolve(this.EDITOR_ID);
		if (!this.isTimeEditorLayoutCreated) this.createTimeEditorLayout(editor);
		
//		_calResolve(this.TIME_EDITOR_LAYOUT_ID).show();
		jQuery(_calResolve(this.TIME_EDITOR_LAYOUT_ID)).removeClass( "rich-calendar-display-none" ).addClass( "rich-calendar-display" );
		
		var editor_shadow = _calResolve(this.EDITOR_SHADOW_ID);
		
		this.setEditorPosition(_calResolve(this.id), editor, editor_shadow);
		
		this.updateTimeEditor();
		
//		editor_shadow.show();
		jQuery(editor_shadow).removeClass( "rich-calendar-display-none" ).addClass( "rich-calendar-display" );
		
//		editor.show();
		jQuery(editor).removeClass( "rich-calendar-display-none" ).addClass( "rich-calendar-display" );
		
		_calClonePositionByIds(this.EDITOR_LAYOUT_SHADOW_ID, this.TIME_EDITOR_LAYOUT_ID, {offsetLeft: 3, offsetTop: 3});
		this.isEditorVisible = true;	
		//this.attachTimeEditorEventHandlers();	
	},

	hideEditor: function()
	{
		if (this.isTimeEditorLayoutCreated) {
			jQuery(_calResolve(this.TIME_EDITOR_LAYOUT_ID)).removeClass( "rich-calendar-display" ).addClass( "rich-calendar-display-none" );
		}
		if (this.isDateEditorLayoutCreated) {
			jQuery(_calResolve(this.DATE_EDITOR_LAYOUT_ID)).removeClass( "rich-calendar-display" ).addClass( "rich-calendar-display-none" );
			}
		
		jQuery(_calResolve(this.EDITOR_ID)).removeClass( "rich-calendar-display" ).addClass( "rich-calendar-display-none" );
		jQuery(_calResolve(this.EDITOR_SHADOW_ID)).removeClass( "rich-calendar-display" ).addClass( "rich-calendar-display-none" );
		
		this.isEditorVisible = false;		
	},
	
	hideTimeEditor: function(updateTime)
	{
		this.hideEditor();
		if (updateTime && this.selectedDate)
		{
			var m = parseInt(_calResolve(this.id+'TimeMinutes').value,10);
			var h=parseInt(_calResolve(this.id+'TimeHours').value,10);
			if (this.timeType==2)
			{
				if (_calResolve(this.id+'TimeSign').value.toLowerCase()=="am")
				{
					if (h==12) h = 0;					
				}
				else
				{
					if (h!=12) h+=12;
				}
			}
			var date = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate(), h, m, 0);
			if (date-this.selectedDate && this.invokeEvent("timeselect",null, null, date))
			{
				this.selectedDate = date;
				this.renderHF();
				if (!this.params.popup || !this.params.showApplyButton) this.setInputField(this.getSelectedDateString(this.params.datePattern), null);
				this.invokeEvent("timeselected",null, null, this.selectedDate);
			}
		}
		if (this.params.popup && !this.params.showApplyButton) this.close(false);		
	},
	
	showDateEditor: function()
	{
		var editor;
		if (!this.isEditorCreated) editor = this.createEditor();
		else editor = _calResolve(this.EDITOR_ID);
		if (!this.isDateEditorLayoutCreated) this.createDateEditorLayout(editor);
		else this.updateDateEditor();
	
//		_calResolve(this.DATE_EDITOR_LAYOUT_ID).show();
		jQuery(_calResolve(this.DATE_EDITOR_LAYOUT_ID)).removeClass( "rich-calendar-display-none" ).addClass( "rich-calendar-display" );
			
		var editor_shadow = _calResolve(this.EDITOR_SHADOW_ID);
			
		this.setEditorPosition(_calResolve(this.id), editor, editor_shadow);
			
		//		editor_shadow.show();
		jQuery(editor_shadow).removeClass( "rich-calendar-display-none" ).addClass( "rich-calendar-display" );
		//		editor.show();
		jQuery(editor).removeClass( "rich-calendar-display-none" ).addClass( "rich-calendar-display" );
			
		_calClonePositionByIds(this.EDITOR_LAYOUT_SHADOW_ID, this.DATE_EDITOR_LAYOUT_ID, {offsetLeft: 3, offsetTop: 3});
			
		this.isEditorVisible = true;
	},
	
	hideDateEditor: function(updateCurrentDate)
	{
		this.hideEditor();
		if (updateCurrentDate)
		{
			this.changeCurrentDate(this.dateEditorYear, this.dateEditorMonth);
		}
	},
	
	attachEventHandlers: function(){
		var myId = this.id;
		
		// eventi del comando next year
			// onclick: (functionName ? "Richfaces.getComponent('calendar',this)."+functionName+"("+(paramsStr ? paramsStr : "")+");" : "")+"return true;"
			// onmouseover:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'",
			// onmouseout:"this.className='rich-calendar-tool-btn'", 
			// onmousedown:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'", 
			// onmouseup:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'"
		if(!this.params.disabled){
			if(!jQuery("div[id$='" + myId + "NextYearControl']").attr('clickbind')){
				jQuery("div[id$='" + myId + "NextYearControl']").click(function() { Richfaces.getComponent('calendar',this).nextYear(); return true; });
				jQuery("div[id$='" + myId + "NextYearControl']").mouseover(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
				jQuery("div[id$='" + myId + "NextYearControl']").mouseout(function() { this.className='rich-calendar-tool-btn'; });
				jQuery("div[id$='" + myId + "NextYearControl']").mousedown(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'; });
				jQuery("div[id$='" + myId + "NextYearControl']").mouseup(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
				jQuery("div[id$='" + myId + "NextYearControl']").attr('clickbind','clickbind');
			}
		}
		
		// eventi del comando previous year
			// onclick: (functionName ? "Richfaces.getComponent('calendar',this)."+functionName+"("+(paramsStr ? paramsStr : "")+");" : "")+"return true;"
			// onmouseover:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'",
			// onmouseout:"this.className='rich-calendar-tool-btn'", 
			// onmousedown:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'", 
			// onmouseup:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'"
		if(!this.params.disabled){
			if(!jQuery("div[id$='" + myId + "PreviousYearControl']").attr('clickbind')){
				jQuery("div[id$='" + myId + "PreviousYearControl']").click(function() { Richfaces.getComponent('calendar',this).prevYear(); return true; });
				jQuery("div[id$='" + myId + "PreviousYearControl']").mouseover(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
				jQuery("div[id$='" + myId + "PreviousYearControl']").mouseout(function() { this.className='rich-calendar-tool-btn'; });
				jQuery("div[id$='" + myId + "PreviousYearControl']").mousedown(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'; });
				jQuery("div[id$='" + myId + "PreviousYearControl']").mouseup(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
				jQuery("div[id$='" + myId + "PreviousYearControl']").attr('clickbind','clickbind');
			}
		}
		
		// eventi del comando next month
			// onclick: (functionName ? "Richfaces.getComponent('calendar',this)."+functionName+"("+(paramsStr ? paramsStr : "")+");" : "")+"return true;"
			// onmouseover:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'",
			// onmouseout:"this.className='rich-calendar-tool-btn'", 
			// onmousedown:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'", 
			// onmouseup:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'"
		if(!this.params.disabled){
			if(!jQuery("div[id$='" + myId + "NextMonthControl']").attr('clickbind')){
				jQuery("div[id$='" + myId + "NextMonthControl']").click(function() { Richfaces.getComponent('calendar',this).nextMonth(); return true; });
				jQuery("div[id$='" + myId + "NextMonthControl']").mouseover(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
				jQuery("div[id$='" + myId + "NextMonthControl']").mouseout(function() { this.className='rich-calendar-tool-btn'; });
				jQuery("div[id$='" + myId + "NextMonthControl']").mousedown(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'; });
				jQuery("div[id$='" + myId + "NextMonthControl']").mouseup(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
				jQuery("div[id$='" + myId + "NextMonthControl']").attr('clickbind','clickbind');
			}
		}
		
		// eventi del comando previous month
			// onclick: (functionName ? "Richfaces.getComponent('calendar',this)."+functionName+"("+(paramsStr ? paramsStr : "")+");" : "")+"return true;"
			// onmouseover:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'",
			// onmouseout:"this.className='rich-calendar-tool-btn'", 
			// onmousedown:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'", 
			// onmouseup:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'"
		if(!this.params.disabled){
			if(!jQuery("div[id$='" + myId + "PreviousMonthControl']").attr('clickbind')){
				jQuery("div[id$='" + myId + "PreviousMonthControl']").click(function() { Richfaces.getComponent('calendar',this).prevMonth(); return true; });
				jQuery("div[id$='" + myId + "PreviousMonthControl']").mouseover(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
				jQuery("div[id$='" + myId + "PreviousMonthControl']").mouseout(function() { this.className='rich-calendar-tool-btn'; });
				jQuery("div[id$='" + myId + "PreviousMonthControl']").mousedown(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'; });
				jQuery("div[id$='" + myId + "PreviousMonthControl']").mouseup(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
				jQuery("div[id$='" + myId + "PreviousMonthControl']").attr('clickbind','clickbind');
			}
		}
		
		// eventi del comando close
			// onclick: (functionName ? "Richfaces.getComponent('calendar',this)."+functionName+"("+(paramsStr ? paramsStr : "")+");" : "")+"return true;"  "close", "false"
			// onmouseover:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'",
			// onmouseout:"this.className='rich-calendar-tool-btn'", 
			// onmousedown:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'", 
			// onmouseup:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'"
		if(this.params.popup){
			if(!jQuery("div[id$='" + myId + "CloseControl']").attr('clickbind')){
				jQuery("div[id$='" + myId + "CloseControl']").click(function() { Richfaces.getComponent('calendar',this).close(false); return true; });
				jQuery("div[id$='" + myId + "CloseControl']").mouseover(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
				jQuery("div[id$='" + myId + "CloseControl']").mouseout(function() { this.className='rich-calendar-tool-btn'; });
				jQuery("div[id$='" + myId + "CloseControl']").mousedown(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'; });
				jQuery("div[id$='" + myId + "CloseControl']").mouseup(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
				jQuery("div[id$='" + myId + "CloseControl']").attr('clickbind','clickbind');
			}
		}
		
		// eventi del comando currentMonth
			// onclick: (functionName ? "Richfaces.getComponent('calendar',this)."+functionName+"("+(paramsStr ? paramsStr : "")+");" : "")+"return true;" 
			// onmouseover:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'",
			// onmouseout:"this.className='rich-calendar-tool-btn'", 
			// onmousedown:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'", 
			// onmouseup:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'"
		if(!this.params.disabled){
			if(!jQuery("div[id$='" + myId + "CurrentMonthControl']").attr('clickbind')){
				jQuery("div[id$='" + myId + "CurrentMonthControl']").click(function() { Richfaces.getComponent('calendar',this).showDateEditor(); return true; });
				jQuery("div[id$='" + myId + "CurrentMonthControl']").mouseover(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
				jQuery("div[id$='" + myId + "CurrentMonthControl']").mouseout(function() { this.className='rich-calendar-tool-btn'; });
				jQuery("div[id$='" + myId + "CurrentMonthControl']").mousedown(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'; });
				jQuery("div[id$='" + myId + "CurrentMonthControl']").mouseup(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
				jQuery("div[id$='" + myId + "CurrentMonthControl']").attr('clickbind','clickbind');
			}
		}
		
		// eventi del comando today
			// onclick: (functionName ? "Richfaces.getComponent('calendar',this)."+functionName+"("+(paramsStr ? paramsStr : "")+");" : "")+"return true;" 
			// onmouseover:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'",
			// onmouseout:"this.className='rich-calendar-tool-btn'", 
			// onmousedown:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'", 
			// onmouseup:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'"
		if(!this.params.disabled && this.params.todayControlMode!='hidden'){
			if(!jQuery("div[id$='" + myId + "TodayControl']").attr('clickbind')){
				jQuery("div[id$='" + myId + "TodayControl']").click(function() { Richfaces.getComponent('calendar',this).today(); return true; });
				jQuery("div[id$='" + myId + "TodayControl']").mouseover(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
				jQuery("div[id$='" + myId + "TodayControl']").mouseout(function() { this.className='rich-calendar-tool-btn'; });
				jQuery("div[id$='" + myId + "TodayControl']").mousedown(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'; });
				jQuery("div[id$='" + myId + "TodayControl']").mouseup(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
				jQuery("div[id$='" + myId + "TodayControl']").attr('clickbind','clickbind');
			}
		}
		
		// eventi del comando clean  
			// onclick: (functionName ? "Richfaces.getComponent('calendar',this)."+functionName+"("+(paramsStr ? paramsStr : "")+");" : "")+"return true;" 
			// onmouseover:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'",
			// onmouseout:"this.className='rich-calendar-tool-btn'", 
			// onmousedown:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'", 
			// onmouseup:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'"
		if(!this.params.disabled && !this.params.readonly && this.selectedDate){
			if(!jQuery("div[id$='" + myId + "CleanControl']").attr('clickbind')){
				jQuery("div[id$='" + myId + "CleanControl']").click(function() { Richfaces.getComponent('calendar',this).resetSelectedDate(); return true; });
				jQuery("div[id$='" + myId + "CleanControl']").mouseover(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
				jQuery("div[id$='" + myId + "CleanControl']").mouseout(function() { this.className='rich-calendar-tool-btn'; });
				jQuery("div[id$='" + myId + "CleanControl']").mousedown(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'; });
				jQuery("div[id$='" + myId + "CleanControl']").mouseup(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
				jQuery("div[id$='" + myId + "CleanControl']").attr('clickbind','clickbind');
			}
		}
		
		// eventi del comando time editor 
			// onclick: (functionName ? "Richfaces.getComponent('calendar',this)."+functionName+"("+(paramsStr ? paramsStr : "")+");" : "")+"return true;" 
			// onmouseover:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'",
			// onmouseout:"this.className='rich-calendar-tool-btn'", 
			// onmousedown:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'", 
			// onmouseup:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'"
		if(!this.params.disabled && !this.params.readonly){
			if(!jQuery("div[id$='" + myId + "TimeControl']").attr('clickbind')){
				jQuery("div[id$='" + myId + "TimeControl']").click(function() { Richfaces.getComponent('calendar',this).showTimeEditor(); return true; });
				jQuery("div[id$='" + myId + "TimeControl']").mouseover(function() { _calRemoveClass(this, 'rich-calendar-tool-btn-press'); });
				jQuery("div[id$='" + myId + "TimeControl']").mouseout(function() { _calAddClass(this, 'rich-calendar-tool-btn-press'); });
				jQuery("div[id$='" + myId + "TimeControl']").mousedown(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'; });
				jQuery("div[id$='" + myId + "TimeControl']").mouseup(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
				jQuery("div[id$='" + myId + "TimeControl']").attr('clickbind','clickbind');
			}
		}
		
		// eventi del comando selected date
			// onclick: (functionName ? "Richfaces.getComponent('calendar',this)."+functionName+"("+(paramsStr ? paramsStr : "")+");" : "")+"return true;"
			// onmouseover:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'",
			// onmouseout:"this.className='rich-calendar-tool-btn'", 
			// onmousedown:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'", 
			// onmouseup:"this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'"
		if(!this.params.disabled){
			if(!jQuery("div[id$='" + myId + "SelectedDateControl']").attr('clickbind')){
				jQuery("div[id$='" + myId + "SelectedDateControl']").click(function() { Richfaces.getComponent('calendar',this).showSelectedDate(); return true; });
				jQuery("div[id$='" + myId + "SelectedDateControl']").mouseover(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
				jQuery("div[id$='" + myId + "SelectedDateControl']").mouseout(function() { this.className='rich-calendar-tool-btn'; });
				jQuery("div[id$='" + myId + "SelectedDateControl']").mousedown(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press'; });
				jQuery("div[id$='" + myId + "SelectedDateControl']").mouseup(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
				jQuery("div[id$='" + myId + "SelectedDateControl']").attr('clickbind','clickbind');
			}
		}
	},
	
	attachTimeEditorEventHandlers: function(){
		var myId = this.id;
		
		// time editor button ok
		// function(context){return context.calendar.TIME_EDITOR_BUTTON_OK}, 
		// 'onmousedown': "_calAddClass(this, 'rich-calendar-time-btn-press');",
		// 'onmouseout': "_calRemoveClass(this, 'rich-calendar-time-btn-press');",
		// 'onmouseup': "_calRemoveClass(this, 'rich-calendar-time-btn-press');",
		// 'onclick': function(context){return "_calResolve('"+context.calendar.id+"').component.hideTimeEditor(true)";}},
		
		jQuery("div[id$='" + this.TIME_EDITOR_BUTTON_OK + "']").click(function() { return _calResolve(myId).component.hideTimeEditor(true); });
		//jQuery("div[id$='" + this.TIME_EDITOR_BUTTON_OK + "']").mouseover(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
		jQuery("div[id$='" + this.TIME_EDITOR_BUTTON_OK + "']").mouseout(function() { _calRemoveClass(this, 'rich-calendar-time-btn-press'); });
		jQuery("div[id$='" + this.TIME_EDITOR_BUTTON_OK + "']").mousedown(function() { _calAddClass(this, 'rich-calendar-time-btn-press'); });
		jQuery("div[id$='" + this.TIME_EDITOR_BUTTON_OK + "']").mouseup(function() { _calRemoveClass(this, 'rich-calendar-time-btn-press'); });
		
		// time editor button cancel
		// function(context){return context.calendar.TIME_EDITOR_BUTTON_CANCEL},  'onclick': function(context){return "_calResolve('"+context.calendar.id+"').component.hideTimeEditor(false)";}},
		// 'onmousedown': "_calAddClass(this, 'rich-calendar-time-btn-press');",
		// 'onmouseout': "_calRemoveClass(this, 'rich-calendar-time-btn-press');",
		// 'onmouseup': "_calRemoveClass(this, 'rich-calendar-time-btn-press');",
		// 'onclick': function(context){return "_calResolve('"+context.calendar.id+"').component.hideTimeEditor(false)";}},
		
		jQuery("div[id$='" + this.TIME_EDITOR_BUTTON_CANCEL + "']").click(function() { return _calResolve(myId).component.hideTimeEditor(false); });
		//jQuery("div[id$='" + this.TIME_EDITOR_BUTTON_CANCEL + "']").mouseover(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
		jQuery("div[id$='" + this.TIME_EDITOR_BUTTON_CANCEL + "']").mouseout(function() { _calRemoveClass(this, 'rich-calendar-time-btn-press'); });
		jQuery("div[id$='" + this.TIME_EDITOR_BUTTON_CANCEL + "']").mousedown(function() { _calAddClass(this, 'rich-calendar-time-btn-press'); });
		jQuery("div[id$='" + this.TIME_EDITOR_BUTTON_CANCEL + "']").mouseup(function() { _calRemoveClass(this, 'rich-calendar-time-btn-press'); });
		
		// spinner per la selezione dei valori
		// id = id + 
		/* 		            case 'a'  : return '</td><td>'+calendar.createSpinnerTable(id+'TimeSign')+'</td><td>';
		            case 'H'  :
		            case 'HH' :
		            case 'h'  :
		            case 'hh' : return '</td><td>'+calendar.createSpinnerTable(id+'TimeHours')+'</td><td>';
		            case 'mm' : return '</td><td>'+calendar.createSpinnerTable(id+'TimeMinutes')+'</td><td>'; 			
				'<tr><td>'+
								'<div id="'+id+'BtnUp" class="rich-calendar-spinner-up"'+
									' onmousedown="this.className=\'rich-calendar-spinner-up rich-calendar-spinner-pressed\'"'+
									' onmouseup="this.className=\'rich-calendar-spinner-up\'"'+ 
									' onmouseout="this.className=\'rich-calendar-spinner-up\'"><span></span></div>'+
							'</td></tr>'+
							'<tr><td>'+
								'<div id="'+id+'BtnDown" class="rich-calendar-spinner-down"'+
									' onmousedown="this.className=\'rich-calendar-spinner-down rich-calendar-spinner-pressed\'"'+
									' onmouseup="this.className=\'rich-calendar-spinner-down\'"'+
									' onmouseout="this.className=\'rich-calendar-spinner-down\'"><span></span></div>'+
									*/
		if(jQuery("div[id$='" + myId + "TimeSignBtnUp']").length > 0){
			jQuery("div[id$='" + myId + "TimeSignBtnUp']").mouseout(function() { this.className='rich-calendar-spinner-up'; });
			jQuery("div[id$='" + myId + "TimeSignBtnUp']").mousedown(function() { this.className='rich-calendar-spinner-up rich-calendar-spinner-pressed'; });
			jQuery("div[id$='" + myId + "TimeSignBtnUp']").mouseup(function() { this.className='rich-calendar-spinner-up'; });
		}
		if(jQuery("div[id$='" + myId + "TimeSignBtnDown']").length > 0){
			jQuery("div[id$='" + myId + "TimeSignBtnDown']").mouseout(function() { this.className='rich-calendar-spinner-down'; });
			jQuery("div[id$='" + myId + "TimeSignBtnDown']").mousedown(function() { this.className='rich-calendar-spinner-down rich-calendar-spinner-pressed'; });
			jQuery("div[id$='" + myId + "TimeSignBtnDown']").mouseup(function() { this.className='rich-calendar-spinner-down'; });
		}
		
		if(jQuery("div[id$='" + myId + "TimeHoursBtnUp']").length > 0){
			jQuery("div[id$='" + myId + "TimeHoursBtnUp']").mouseout(function() { this.className='rich-calendar-spinner-up'; });
			jQuery("div[id$='" + myId + "TimeHoursBtnUp']").mousedown(function() { this.className='rich-calendar-spinner-up rich-calendar-spinner-pressed'; });
			jQuery("div[id$='" + myId + "TimeHoursBtnUp']").mouseup(function() { this.className='rich-calendar-spinner-up'; });
		}
		if(jQuery("div[id$='" + myId + "TimeHoursBtnDown']").length > 0){
			jQuery("div[id$='" + myId + "TimeHoursBtnDown']").mouseout(function() { this.className='rich-calendar-spinner-down'; });
			jQuery("div[id$='" + myId + "TimeHoursBtnDown']").mousedown(function() { this.className='rich-calendar-spinner-down rich-calendar-spinner-pressed'; });
			jQuery("div[id$='" + myId + "TimeHoursBtnDown']").mouseup(function() { this.className='rich-calendar-spinner-down'; });
		}
		
		if(jQuery("div[id$='" + myId + "TimeMinutesBtnUp']").length > 0){
			jQuery("div[id$='" + myId + "TimeMinutesBtnUp']").mouseout(function() { this.className='rich-calendar-spinner-up'; });
			jQuery("div[id$='" + myId + "TimeMinutesBtnUp']").mousedown(function() { this.className='rich-calendar-spinner-up rich-calendar-spinner-pressed'; });
			jQuery("div[id$='" + myId + "TimeMinutesBtnUp']").mouseup(function() { this.className='rich-calendar-spinner-up'; });
		}
		if(jQuery("div[id$='" + myId + "TimeMinutesBtnDown']").length > 0){
			jQuery("div[id$='" + myId + "TimeMinutesBtnDown']").mouseout(function() { this.className='rich-calendar-spinner-down'; });
			jQuery("div[id$='" + myId + "TimeMinutesBtnDown']").mousedown(function() { this.className='rich-calendar-spinner-down rich-calendar-spinner-pressed'; });
			jQuery("div[id$='" + myId + "TimeMinutesBtnDown']").mouseup(function() { this.className='rich-calendar-spinner-down'; });
		}
		
		// tabella ombra
		 //<table border="0" cellpadding="0" cellspacing="0" id="'+this.EDITOR_ID
		// +'" class="rich-calendar-position-absolute rich-calendar-display-none" onclick="_calResolve(\''+this.id+'\').component.skipEventOnCollapse=true;">
		if(jQuery("table[id$='" + this.EDITOR_ID + "']").length > 0){
			jQuery("table[id$='" + this.EDITOR_ID + "']").click(function() { return _calResolve(myId).component.skipEventOnCollapse=true; });
		}
	},
	
	attachDateEditorEventHandlers: function(){
		var myId = this.id;
		
		// date editor button ok
		// function(context){return context.calendar.DATE_EDITOR_BUTTON_OK}, 
		// 'onmousedown': "_calAddClass(this, 'rich-calendar-time-btn-press');",
		// 'onmouseout': "_calRemoveClass(this, 'rich-calendar-time-btn-press');",
		// 'onmouseup': "_calRemoveClass(this, 'rich-calendar-time-btn-press');",
		// 'onclick': function(context){return "_calResolve('"+context.calendar.id+"').component.hideDateEditor(true)";}},
		
		jQuery("div[id$='" + this.DATE_EDITOR_BUTTON_OK + "']").click(function() { return _calResolve(myId).component.hideDateEditor(true); });
		//jQuery("div[id$='" + this.DATE_EDITOR_BUTTON_OK + "']").mouseover(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
		jQuery("div[id$='" + this.DATE_EDITOR_BUTTON_OK + "']").mouseout(function() { _calRemoveClass(this, 'rich-calendar-time-btn-press'); });
		jQuery("div[id$='" + this.DATE_EDITOR_BUTTON_OK + "']").mousedown(function() { _calAddClass(this, 'rich-calendar-time-btn-press'); });
		jQuery("div[id$='" + this.DATE_EDITOR_BUTTON_OK + "']").mouseup(function() { _calRemoveClass(this, 'rich-calendar-time-btn-press'); });
		
		// date editor button cancel
		// function(context){return context.calendar.DATE_EDITOR_BUTTON_CANCEL},  'onclick': function(context){return "_calResolve('"+context.calendar.id+"').component.hideTimeEditor(false)";}},
		// 'onmousedown': "_calAddClass(this, 'rich-calendar-time-btn-press');",
		// 'onmouseout': "_calRemoveClass(this, 'rich-calendar-time-btn-press');",
		// 'onmouseup': "_calRemoveClass(this, 'rich-calendar-time-btn-press');",
		// 'onclick': function(context){return "_calResolve('"+context.calendar.id+"').component.hideDateEditor(false)";}},
		
		jQuery("div[id$='" + this.DATE_EDITOR_BUTTON_CANCEL + "']").click(function() { return _calResolve(myId).component.hideDateEditor(false); });
		//jQuery("div[id$='" + this.DATE_EDITOR_BUTTON_CANCEL + "']").mouseover(function() { this.className='rich-calendar-tool-btn rich-calendar-tool-btn-hover'; });
		jQuery("div[id$='" + this.DATE_EDITOR_BUTTON_CANCEL + "']").mouseout(function() { _calRemoveClass(this, 'rich-calendar-time-btn-press'); });
		jQuery("div[id$='" + this.DATE_EDITOR_BUTTON_CANCEL + "']").mousedown(function() { _calAddClass(this, 'rich-calendar-time-btn-press'); });
		jQuery("div[id$='" + this.DATE_EDITOR_BUTTON_CANCEL + "']").mouseup(function() { _calRemoveClass(this, 'rich-calendar-time-btn-press'); });
		
		
		// Frecce per scorrere gli anni freccia LT this.createDECell(this.DATE_EDITOR_LAYOUT_ID+'_LT','&lt;', 0, -1)
		// onmouseover="this.className=\'rich-calendar-editor-btn rich-calendar-editor-tool-over\';" this.DATE_EDITOR_LAYOUT_ID+'_LT'
		// onmouseout="this.className=\'rich-calendar-editor-btn\';" 
		// onmousedown="this.className=\'rich-calendar-editor-btn rich-calendar-editor-tool-press\';" 
		// onmouseup="this.className=\'rich-calendar-editor-btn rich-calendar-editor-tool-over\';" 
		//  onclick="_calResolve(\''+this.id+'\').component.scrollEditorYear('+param+');">'+value+'</div>';
		jQuery("div[id$='" + this.DATE_EDITOR_LAYOUT_ID + "_LT']").click(function() { return _calResolve(myId).component.scrollEditorYear(-1); });
		jQuery("div[id$='" + this.DATE_EDITOR_LAYOUT_ID + "_LT']").mouseover(function() { this.className='rich-calendar-editor-btn rich-calendar-editor-tool-over'; });
		jQuery("div[id$='" + this.DATE_EDITOR_LAYOUT_ID + "_LT']").mouseout(function() { this.className='rich-calendar-editor-btn'; });
		jQuery("div[id$='" + this.DATE_EDITOR_LAYOUT_ID + "_LT']").mousedown(function() { this.className='rich-calendar-editor-btn rich-calendar-editor-tool-press'; });
		jQuery("div[id$='" + this.DATE_EDITOR_LAYOUT_ID + "_LT']").mouseup(function() { this.className='rich-calendar-editor-btn rich-calendar-editor-tool-over'; });
	
		// Frecce per scorrere gli anni freccia GT this.createDECell(this.DATE_EDITOR_LAYOUT_ID+'_GT','&gt;', 0, 1)
		// onmouseover="this.className=\'rich-calendar-editor-btn rich-calendar-editor-tool-over\';" this.DATE_EDITOR_LAYOUT_ID+'_GT'
		// onmouseout="this.className=\'rich-calendar-editor-btn\';" 
		// onmousedown="this.className=\'rich-calendar-editor-btn rich-calendar-editor-tool-press\';" 
		// onmouseup="this.className=\'rich-calendar-editor-btn rich-calendar-editor-tool-over\';" 
		//  onclick="_calResolve(\''+this.id+'\').component.scrollEditorYear('+param+');">'+value+'</div>';
		jQuery("div[id$='" + this.DATE_EDITOR_LAYOUT_ID + "_GT']").click(function() { return _calResolve(myId).component.scrollEditorYear(1); });
		jQuery("div[id$='" + this.DATE_EDITOR_LAYOUT_ID + "_GT']").mouseover(function() { this.className='rich-calendar-editor-btn rich-calendar-editor-tool-over'; });
		jQuery("div[id$='" + this.DATE_EDITOR_LAYOUT_ID + "_GT']").mouseout(function() { this.className='rich-calendar-editor-btn'; });
		jQuery("div[id$='" + this.DATE_EDITOR_LAYOUT_ID + "_GT']").mousedown(function() { this.className='rich-calendar-editor-btn rich-calendar-editor-tool-press'; });
		jQuery("div[id$='" + this.DATE_EDITOR_LAYOUT_ID + "_GT']").mouseup(function() { this.className='rich-calendar-editor-btn rich-calendar-editor-tool-over'; });
		
		// tasti mese
		// var onclick = (buttonType==1 ? '_calResolve(\''+this.id+'\').component.dateEditorSelectMonth('+param+');': '_calResolve(\''+this.id+'\').component.dateEditorSelectYear('+param+');' );
		//	return '<div id="'+id+'" class="rich-calendar-editor-btn'+(className ? ' '+className : '')+ 
		//'" onmouseover="_calAddClass(this, \'rich-calendar-editor-btn-over\');" onmouseout="_calRemoveClass(this,\'rich-calendar-editor-btn-over\');" onclick="'+onclick+'">'+value+'</div>';
		
		jQuery("div[id*='" + this.DATE_EDITOR_LAYOUT_ID + "M']").click(function() { var newVal = parseInt(this.getAttribute('_val'));  return _calResolve(myId).component.dateEditorSelectMonth(newVal); });
		jQuery("div[id*='" + this.DATE_EDITOR_LAYOUT_ID + "M']").mouseover(function() { _calAddClass(this, 'rich-calendar-editor-btn-over'); });
		jQuery("div[id*='" + this.DATE_EDITOR_LAYOUT_ID + "M']").mouseout(function() { _calRemoveClass(this, 'rich-calendar-editor-btn-over');  });
//		jQuery("div[id*='" + this.DATE_EDITOR_LAYOUT_ID + "M']").mousedown(function() { this.className='rich-calendar-editor-btn rich-calendar-editor-btn-press'; });
//		jQuery("div[id*='" + this.DATE_EDITOR_LAYOUT_ID + "M']").mouseup(function() { this.className='rich-calendar-editor-btn rich-calendar-editor-btn-over'; });
	
		// tasti anno
		// var onclick = (buttonType==1 ? '_calResolve(\''+this.id+'\').component.dateEditorSelectMonth('+param+');': '_calResolve(\''+this.id+'\').component.dateEditorSelectYear('+param+');' );
		//	return '<div id="'+id+'" class="rich-calendar-editor-btn'+(className ? ' '+className : '')+ 
		//'" onmouseover="_calAddClass(this, \'rich-calendar-editor-btn-over\');" onmouseout="_calRemoveClass(this,\'rich-calendar-editor-btn-over\');" onclick="'+onclick+'">'+value+'</div>';
		
		jQuery("div[id*='" + this.DATE_EDITOR_LAYOUT_ID + "Y']").click(function() { var newVal =  parseInt(this.getAttribute('_val'));  return _calResolve(myId).component.dateEditorSelectYear(newVal); });
		jQuery("div[id*='" + this.DATE_EDITOR_LAYOUT_ID + "Y']").mouseover(function() { _calAddClass(this, 'rich-calendar-editor-btn-over'); });
		jQuery("div[id*='" + this.DATE_EDITOR_LAYOUT_ID + "Y']").mouseout(function() { _calRemoveClass(this, 'rich-calendar-editor-btn-over');  });
//		jQuery("div[id*='" + this.DATE_EDITOR_LAYOUT_ID + "Y']").mousedown(function() { this.className='rich-calendar-editor-btn rich-calendar-editor-btn-press'; });
//		jQuery("div[id*='" + this.DATE_EDITOR_LAYOUT_ID + "Y']").mouseup(function() { this.className='rich-calendar-editor-btn rich-calendar-editor-btn-over'; });				
	}
});

CalendarView = {};
CalendarView.getControl = function(text, attributes, functionName, paramsStr) {
	return new E('div',attributes,[new T(text)]);
};

CalendarView.getSelectedDateControl = function(calendar) {
	
	if (!calendar.selectedDate || calendar.params.showApplyButton) return "";
	
	var calendarId = calendar.id;
	var elementId = calendarId + 'SelectedDateControl';
	var text = Richfaces.Calendar.formatDate(calendar.selectedDate,(calendar.timeType ? calendar.datePattern : calendar.params.datePattern), calendar.params.monthLabels, calendar.params.monthLabelsShort);
	var markup = ( calendar.params.disabled ? 
					new E('div', {'class': 'rich-calendar-tool-btn-disabled', 'id' : elementId}, [new ET(text)]) : 
					new E('div', {'class': 'rich-calendar-tool-btn', 'id' : elementId}, [new ET(text)]) );

	return markup;
};

CalendarView.getTimeControl = function(calendar) {
	
	if (!calendar.selectedDate || !calendar.timeType) return "";
	
	var text = Richfaces.Calendar.formatDate(calendar.selectedDate, calendar.timePattern, calendar.params.monthLabels, calendar.params.monthLabelsShort);

	var calendarId = calendar.id;
	var elementId = calendarId + 'TimeControl';
	var markup = calendar.params.disabled || calendar.params.readonly ? 
				new E('div', {'class': 'rich-calendar-tool-btn-disabled', 'id' : elementId}, [new ET(text)]) : 
				new E('div', {'class': 'rich-calendar-tool-btn rich-calendar-tool-btn-hover rich-calendar-tool-btn-press', 'id' : elementId	}, [new ET(text)]);

	return markup;
};

CalendarView.toolButtonAttributes = {className: "rich-calendar-tool-btn"};
CalendarView.nextYearControl = function (context) {
	var calendarId = context.calendar.id;
	var elementId = calendarId + 'NextYearControl';
	var attr = Object.assign({ id: elementId }, CalendarView.toolButtonAttributes);
	
	return (!context.calendar.params.disabled ? CalendarView.getControl(">>", attr, "nextYear") : "");
};
CalendarView.previousYearControl = function (context) {
	var calendarId = context.calendar.id;
	var elementId = calendarId + 'PreviousYearControl';
	var attr = Object.assign({ id: elementId }, CalendarView.toolButtonAttributes);
	
	return (!context.calendar.params.disabled ? CalendarView.getControl("<<", attr, "prevYear") : "");
};
CalendarView.nextMonthControl = function (context) {
	var calendarId = context.calendar.id;
	var elementId = calendarId + 'NextMonthControl';
	var attr = Object.assign({ id: elementId }, CalendarView.toolButtonAttributes);
	
	return (!context.calendar.params.disabled ? CalendarView.getControl(">", attr, "nextMonth") : "");
};
CalendarView.previousMonthControl = function (context) {
	var calendarId = context.calendar.id;
	var elementId = calendarId + 'PreviousMonthControl';
	var attr = Object.assign({ id: elementId }, CalendarView.toolButtonAttributes);
	
	return (!context.calendar.params.disabled ? CalendarView.getControl("<", attr, "prevMonth") : "");
};
CalendarView.currentMonthControl = function (context) {
	var calendarId = context.calendar.id;
	var elementId = calendarId + 'CurrentMonthControl';
	var attr = Object.assign({ id: elementId }, CalendarView.toolButtonAttributes);
	
	var text = Richfaces.Calendar.formatDate(context.calendar.getCurrentDate(), "MMMM, yyyy", context.monthLabels, context.monthLabelsShort);
	var markup = context.calendar.params.disabled ? new E('div',{className: "rich-calendar-tool-btn-disabled"},[new T(text)]) : CalendarView.getControl(text, attr, "showDateEditor");
	return markup;
};
CalendarView.todayControl = function (context) {
	var calendarId = context.calendar.id;
	var elementId = calendarId + 'TodayControl';
	var attr = Object.assign({ id: elementId }, CalendarView.toolButtonAttributes);
	
	return (!context.calendar.params.disabled && context.calendar.params.todayControlMode!='hidden' ? CalendarView.getControl(context.controlLabels.today, attr, "today") : "");
};
CalendarView.closeControl = function (context) {
	var calendarId = context.calendar.id;
	var elementId = calendarId + 'CloseControl';
	var attr = Object.assign({ id: elementId }, CalendarView.toolButtonAttributes);
	
	return (context.calendar.params.popup ? CalendarView.getControl(context.controlLabels.close, attr, "close", "false") : "");
};
CalendarView.applyControl = function (context) {
	var calendarId = context.calendar.id;
	var elementId = calendarId + 'ApplyControl';
	var attr = Object.assign({ id: elementId }, CalendarView.toolButtonAttributes);
	
	return (!context.calendar.params.disabled && !context.calendar.params.readonly && context.calendar.params.showApplyButton ? CalendarView.getControl(context.controlLabels.apply, attr, "close", "true") : "");
};
CalendarView.cleanControl = function (context) {
	var calendarId = context.calendar.id;
	var elementId = calendarId + 'CleanControl';
	var attr = Object.assign({ id: elementId }, CalendarView.toolButtonAttributes);
	
	return (!context.calendar.params.disabled && !context.calendar.params.readonly && context.calendar.selectedDate ? CalendarView.getControl(context.controlLabels.clean, attr, "resetSelectedDate") : "");
};

CalendarView.selectedDateControl = function (context) {	return CalendarView.getSelectedDateControl(context.calendar);};
CalendarView.timeControl = function (context) {	return CalendarView.getTimeControl(context.calendar);};
CalendarView.timeEditorFields = function (context) {return context.calendar.timePatternHtml;};

CalendarView.header = [
	new E('table',{'border': '0', 'cellpadding': '0', 'cellspacing': '0', 'width': '100%'},
		[
			new E('tbody',{},
			[
				new E('tr',{},
				[
					new E('td',{'class': 'rich-calendar-tool'},
					[
						new ET(function (context) { return Richfaces.evalMacro("previousYearControl", context)})
					]),
					new E('td',{'class': 'rich-calendar-tool'},
					[
						new ET(function (context) { return Richfaces.evalMacro("previousMonthControl", context)})
					]),
					new E('td',{'class': 'rich-calendar-month'},
					[
						new ET(function (context) { return Richfaces.evalMacro("currentMonthControl", context)})
					]),				
					new E('td',{'class': 'rich-calendar-tool'},
					[
						new ET(function (context) { return Richfaces.evalMacro("nextMonthControl", context)})
					]),
					new E('td',{'class': 'rich-calendar-tool'},
					[
						new ET(function (context) { return Richfaces.evalMacro("nextYearControl", context)})
					]),
					new E('td',{'class': function(context){return (this.isEmpty ? 'rich-calendar-tool rich-calendar-tool-close rich-calendar-display-none' : 'rich-calendar-tool rich-calendar-tool-close');}},
					[
						new ET(function (context) { return Richfaces.evalMacro("closeControl", context)})
					])
				])
			])
		]
	)];
	
CalendarView.footer = [
	new E('table',{'border': '0', 'cellpadding': '0', 'cellspacing': '0', 'width': '100%'},
		[
			new E('tbody',{},
			[
				new E('tr',{},
				[
					new E('td',{'class': function(context){return (this.isEmpty ? 'rich-calendar-toolfooter rich-calendar-display-none' : 'rich-calendar-toolfooter');}},
					[
						new ET(function (context) { return Richfaces.evalMacro("selectedDateControl", context)})
					]),
					new E('td',{'class': function(context){return (this.isEmpty ? 'rich-calendar-toolfooter rich-calendar-display-none' : 'rich-calendar-toolfooter');}},
					[
						new ET(function (context) { return Richfaces.evalMacro("cleanControl", context)})
					]),
					new E('td',{'class': function(context){return (this.isEmpty ? 'rich-calendar-toolfooter rich-calendar-display-none' : 'rich-calendar-toolfooter');}},
					[
						new ET(function (context) { return Richfaces.evalMacro("timeControl", context)})
					]),
					new E('td',{'class': 'rich-calendar-toolfooter rich-calendar-background-image-none', 'width': '100%'}, []),
					new E('td',{'class': function(context){return (this.isEmpty ? 'rich-calendar-toolfooter rich-calendar-display-none' : 'rich-calendar-toolfooter')+(context.calendar.params.disabled || context.calendar.params.readonly || !context.calendar.params.showApplyButton ? ' rich-calendar-background-image-none' : '');}},
					[
						new ET(function (context) { return Richfaces.evalMacro("todayControl", context)})
					]),
					new E('td',{'class': function(context){return (this.isEmpty ? 'rich-calendar-toolfooter rich-calendar-display-none' : 'rich-calendar-toolfooter')+' rich-calendar-background-image-none';}},
					[
						new ET(function (context) { return Richfaces.evalMacro("applyControl", context)})
					])
				])
			])
		]
	)];
	
CalendarView.timeEditorLayout = [

        new E('table',{'id': function(context){return context.calendar.TIME_EDITOR_LAYOUT_ID}, 'border': '0', 'cellpadding': '0', 'cellspacing': '0', 'class': 'rich-calendar-time-layout'},
		[
			new E('tbody',{},
			[
				new E('tr',{},
				[
					new E('td',{'class': 'rich-calendar-time-layout-fields', 'colspan': '2', 'align': 'center'},
					[
						new ET(function (context) { return Richfaces.evalMacro("timeEditorFields", context)})
					])
				]),
				new E('tr',{},
				[
					new E('td',{'class': 'rich-calendar-time-layout-ok'},
					[
						new E('div',{'id': function(context){return context.calendar.TIME_EDITOR_BUTTON_OK}, 'class': 'rich-calendar-time-btn rich-calendar-float-right'},
						[
							new E('span',{},
							[
								new ET(function (context) { return context.controlLabels.ok; })
							])
						])
					])
					,
					new E('td',{'class': 'rich-calendar-time-layout-cancel'},
					[
						new E('div',{'id': function(context){return context.calendar.TIME_EDITOR_BUTTON_CANCEL}, 'class': 'rich-calendar-time-btn rich-calendar-float-left'},
						[
							new E('span',{},
							[
								new ET(function (context) { return context.controlLabels.cancel; })
							])
						])
					])
				])
			])
		]
	)];

CalendarView.dayList = [new ET(function (context) { return context.day})];
CalendarView.weekNumber = [new ET(function (context) { return context.weekNumber})];
CalendarView.weekDay = [new ET(function (context) { return context.weekDayLabelShort})];

function CalendarContext() { this.initialize.apply(this, arguments); }
window.CalendarContext = CalendarContext;
Object.assign(CalendarContext.prototype, {
    initialize: function(calendar) {
    	this.calendar=calendar;
		this.monthLabels=calendar.params.monthLabels;
		this.monthLabelsShort=calendar.params.monthLabelsShort;
		this.weekDayLabels=calendar.params.weekDayLabels;
		this.weekDayLabelsShort=calendar.params.weekDayLabelsShort;
		this.controlLabels=calendar.params.labels;
	},
	nextYearControl: CalendarView.nextYearControl,
	previousYearControl: CalendarView.previousYearControl,
	nextMonthControl: CalendarView.nextMonthControl,
	previousMonthControl: CalendarView.previousMonthControl,
	currentMonthControl: CalendarView.currentMonthControl,
	selectedDateControl: CalendarView.selectedDateControl,
	cleanControl: CalendarView.cleanControl,
	timeControl: CalendarView.timeControl,
	todayControl: CalendarView.todayControl,
	closeControl: CalendarView.closeControl,
	applyControl: CalendarView.applyControl,
	timeEditorFields: CalendarView.timeEditorFields,
	timeEditorLayout: CalendarView.timeEditorLayout
});

Richfaces.Calendar.defaultOptions = {
		showWeekDaysBar: true,
		showWeeksBar: true,
		datePattern: "MMM d, yyyy",
		horizontalOffset: 0,
		verticalOffset: 0,
		dayListMarkup: CalendarView.dayList,
		weekNumberMarkup: CalendarView.weekNumber,
		weekDayMarkup: CalendarView.weekDay,
		headerMarkup: CalendarView.header,
		footerMarkup: CalendarView.footer,
		isDayEnabled: function (context) {return true;},
		dayStyleClass: function (context) {return "";},
		showHeader: true,
		showFooter: true,
		direction: "bottom-right",
		jointPoint: "bottom-left",
		popup: true,
		boundaryDatesMode: "inactive",
		todayControlMode: "select",
		style: "",
		className: "",
		disabled: false,
		readonly: false,
		enableManualInput: false,
		showInput: true,
		resetTimeOnDateSelect: false,
		style: "z-index: 3;",
		showApplyButton: false,
		selectedDate: null,
		currentDate: null,
		defaultTime: {hours:12,minutes:0}
};

// must be :defaultTime, minDaysInFirstWeek, firstWeekday, weekDayLabels, weekDayLabelsShort, monthLabels, monthLabelsShort