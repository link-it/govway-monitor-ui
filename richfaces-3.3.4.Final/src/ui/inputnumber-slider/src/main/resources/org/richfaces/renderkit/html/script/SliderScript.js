/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM:
 *     Class.create()                     -> costruttore + .prototype plain
 *     Object.extend(t, s)                -> Object.assign(t, s)
 *     $(idOrEl)                          -> document.getElementById o passthrough (helper _slR)
 *     Element.show/hide(el)              -> el.style.display = '' / 'none'
 *     Element.setStyle(el, {...})        -> Object.assign(el.style, {...})
 *     Event.observe / stopObserving      -> addEventListener / removeEventListener (helper _slObserve)
 *     Event.stop(e)                      -> preventDefault + stopPropagation
 *     Event.element(e)                   -> e.target || e.srcElement
 *     Event.isLeftClick(e)               -> (e.button === 0 || e.which === 1)
 *     Event.pointerX/pointerY(e)         -> e.pageX / e.pageY (con fallback)
 *     Position.cumulativeOffset(el)      -> _slCumulativeOffset(el) (array [left, top])
 *     bindAsEventListener(this)          -> .bind(this)
 *     new PeriodicalExecuter(fn, secs)   -> _slPeriodical(fn, secs) (oggetto con .stop())
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if(!window.Richfaces) window.Richfaces = {};

// Helpers privati
function _slR(e) {
	if (!e) return null;
	if (typeof e === 'string') return document.getElementById(e);
	return e;
}
function _slObserve(elOrId, evt, fn, capture) {
	var el = _slR(elOrId);
	if (el) el.addEventListener(evt, fn, capture || false);
}
function _slStopObserve(elOrId, evt, fn, capture) {
	var el = _slR(elOrId);
	if (el) el.removeEventListener(evt, fn, capture || false);
}
function _slStop(e) {
	if (!e) return;
	if (e.preventDefault) e.preventDefault();
	if (e.stopPropagation) e.stopPropagation();
}
function _slIsLeftClick(e) {
	return (e && (e.button === 0 || e.which === 1));
}
function _slPointerX(e) {
	return e.pageX != null ? e.pageX : (e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft || 0));
}
function _slPointerY(e) {
	return e.pageY != null ? e.pageY : (e.clientY + (document.documentElement.scrollTop || document.body.scrollTop || 0));
}
function _slCumulativeOffset(el) {
	var l = 0, t = 0;
	while (el) {
		t += el.offsetTop || 0;
		l += el.offsetLeft || 0;
		el = el.offsetParent;
	}
	return [l, t];
}
function _slPeriodical(fn, intervalSec) {
	var id = setInterval(fn, intervalSec * 1000);
	return { stop: function() { clearInterval(id); } };
}

function _RichfacesSlider(id, options) { this.initialize(id, options); }
Richfaces.Slider = _RichfacesSlider;
_RichfacesSlider.prototype = {
	initialize: function(id, options) {
	//default values of options
	var defaultOptions = {
			handleSelectedClass: null,
			disabled: false,
			required: false,
			showArrows: false,
			disabled: false,
			onchange: null,
			clientErrorMessage: null,
			showToolTip: true,
			step: 1,
			minValue: 0,
			maxValue: 100,
			delay: 200,
			onslide: null,
			sliderValue: null,
			width: "200px",
			height: "20px",
			orientation: "horizontal"
	};
	Object.assign(defaultOptions, options);
		this.handle = document.getElementById( id + "Handle" );
		this.tip = document.getElementById( id + "Tip" );
		this.track = document.getElementById( id + "Track" );
		this.mainTable = document.getElementById( id );
		var inputId = id + "Input";
		this.input = document.getElementById(inputId) || document.getElementsByName(inputId)[0];
		if(defaultOptions.showArrows){
			var arrowIncId = id + "ArrowInc";
			this.arrowInc = document.getElementById(arrowIncId) || document.getElementsByName(arrowIncId)[0];
			var arrowDecId = id + "ArrowDec";
	        this.arrowDec = document.getElementById(arrowDecId) || document.getElementsByName(arrowDecId)[0];
			var tipArrowIncId = id + "TipArrowInc";
	        this.tipArrowInc = document.getElementById(tipArrowIncId) || document.getElementsByName(tipArrowIncId)[0];
			var tipArrowDecId = id + "TipArrowDec";
	        this.tipArrowDec = document.getElementById(tipArrowDecId) || document.getElementsByName(tipArrowDecId)[0];
		}
		this.options = defaultOptions;
		//QUICK FIX for RF-7930 // need to be reworked
		this.options.minValue = parseFloat(this.options.minValue);
		this.options.maxValue = parseFloat(this.options.maxValue);

		this.orientation = this.options.orientation;

		this.classes = {};
		this.classes.arrow = "rich-inslider-handler";
		this.classes.arrowSelected = "rich-inslider-handler-selected";
		if(this.handle.className.indexOf('rich-inslider-visibility-hidden') > -1){
			this.classes.temp = this.trim(this.handle.className.replace("rich-inslider-visibility-hidden",""));
		} else{
			this.classes.temp = this.handle.className;
		}

		this.classes.base = " " + this.trim(this.classes.temp.replace("rich-inslider-handler",""));

		if(this.orientation=="vertical"){
			  this.classes.arrow = "rich-inslider-handler-vertical";
			  this.classes.arrowSelected = "rich-inslider-handler-selected-vertical";
			  this.classes.base = " " + this.trim(this.classes.temp.replace("rich-inslider-handler-vertical",""));
			}

        this.classes.handleSelected = defaultOptions.handleSelectedClass ? " " + defaultOptions.handleSelectedClass : "";

		this.table = this.findTableForTrack(this.track);

		this.input.value = this.options.sliderValue;
		this.prevInputValue = this.input.value;
		this.graggedImageOn = false;
		this.value	 = 0;
		this.digCount = 0;
		this.delay = this.options.delay;
		if("" == this.input.value){
			  this.input.value = this.options.minValue;
		}

		this.step = this.options.step;
		if ( (this.step+"").indexOf(".")!=-1 ){
			var stepStr = (this.step+"");
			this.digCount = (stepStr.substring(stepStr.indexOf(".")+1,stepStr.length)).length;
		}
		this.availableValues = this.calculateAvailableValues();

		this.tip.maxlength = (this.options.maxValue + "").length + (this.digCount != 0 ? this.digCount + 1 : 0);
		if(this.options.showArrows){
			this.tipArrowInc.maxlength = this.tip.maxlength;
	        this.tipArrowDec.maxlength = this.tip.maxlength;
		}

		this.handleLength = 9;

		this.active	 = false;
		this.dragging = false;
		this.editInFocus = false;

		this.disabled = this.options.disabled ? true : false;

		var tr = this.track.childNodes[0];

		this.prevMouseUp = window.document.onmouseup;
		this.prevMouseMove = window.document.onmousemove;

		this.documentBodyOload	= this.load.bind(this);
		window.addEventListener("load", this.documentBodyOload);

		this.eventWindowResized = this.windowResized.bind(this);
		window.addEventListener("resize", this.eventWindowResized);

		this.period = "";

		if(!this.options.disabled){
			this.eventMouseUp		= this.processMouseUp.bind(this);
			this.eventMouseMove		= this.update.bind(this);
			this.eventMouseDown		= this.startDrag.bind(this);
			this.eventEditFocus		= this.editFocus.bind(this);
			this.eventEditBlur		= this.editBlur.bind(this);
			this.eventEditChange	= this.editChange.bind(this);
			this.eventEditValidate	= this.inputValidate.bind(this);
			this.eventInputChange	= this.inputChange.bind(this);
			this.eventWindowMouseOut= this.windowMouseOut.bind(this);
			this.eventIncrease      = this.increase.bind(this);
			this.eventDecrease      = this.decrease.bind(this);
			this.eventIncreaseDown  = this.increaseDown.bind(this);
            this.eventDecreaseDown  = this.decreaseDown.bind(this);
			this.eventIncreaseUp    = this.increaseUp.bind(this);
            this.eventDecreaseUp    = this.decreaseUp.bind(this);

			if (this.options.onerror) {
				this.eventError = this.customFunctionEval("event","clientErrorMessage",this.options.onerror);
			}

			if (this.options.onchange != ""){
				this.eventChanged = this.customFunctionEval("event",this.options.onchange).bind(this);
			}

			_slObserve(this.track, "mousedown", this.eventMouseDown);
			_slObserve(tr, "mousedown", this.eventMouseDown);
			_slObserve(this.input, "keydown", this.eventEditValidate);
			_slObserve(this.input, "keyup", this.eventEditChange);
			_slObserve(this.input, "focus", this.eventEditFocus);
			_slObserve(this.input, "blur", this.eventEditBlur);
			if(this.input.onchange){
				this.eventInputOnChange = this.input.onchange.bind(this.input);
				this.input.onchange = null;
			}
			_slObserve(this.input, "change", this.eventInputChange);
			if(this.options.showArrows){
				_slObserve(this.arrowInc, "mousedown", this.eventIncreaseDown);
				_slObserve(this.arrowDec, "mousedown", this.eventDecreaseDown);
				_slObserve(this.arrowInc, "mouseup", this.eventIncreaseUp);
	            _slObserve(this.arrowDec, "mouseup", this.eventDecreaseUp);
			}
		}
		this.initialized = true;

        this.setInitialValue();

		this.required = defaultOptions.required;

		this.mainTable.component = this;
		this["rich:destructor"] = "destroy";

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

	    document.head.appendChild(renderNode).parentNode.removeChild(renderNode);
	    return __ifYouAbsolutelyMustUseIt();
	},

	destroy: function ()
	{
		this.handle = null;
		this.tip = null;
		this.tipArrowInc = null;
		this.tipArrowDec = null;
		this.arrowInc = null;
        this.arrowDec = null;
		this.track = null;
		this.mainTable.component = null;
		this.mainTable = null;
		this.input = null;
		this.table = null;
		window.document.onmouseup = this.prevMouseUp;
		window.document.onmousemove = this.prevMouseMove;
		this.prevMouseUp = null;
		this.prevMouseMove = null;
		window.removeEventListener("load", this.documentBodyOload);
		window.removeEventListener("resize", this.eventWindowResized);
	},

	setInitialValue: function(){
		this.setValue(parseFloat(this.options.sliderValue || this.options.minValue));
		var jqHandler = jQuery(this.handle);
		jqHandler.removeClass( "rich-inslider-visibility-hidden" ).addClass( "rich-inslider-visibility" );
		this.prevValue = this.value;
		this.valueChanged = false;
		if(this.options.showArrows){
			if(this.orientation=="vertical"){
	            this.tipArrowInc.style.left = (this.arrowInc.offsetWidth) + "px";
	            this.tipArrowDec.style.left = (this.arrowDec.offsetWidth) + "px";
	        } else {
	            this.tipArrowInc.style.top = "-" + (this.arrowInc.offsetHeight + 3) + "px";
	            this.tipArrowDec.style.top = "-" + (this.arrowDec.offsetHeight + 3) + "px";
	        }
		}
	},

   calculateAvailableValues : function(){
        var values = new Array();
        var value = this.roundFloat(this.options.minValue);
        var i = 0;
        while (value < this.options.maxValue){
            values[i] = value;
            value = this.roundFloat(value + parseFloat(this.step));
            i++;
        }
        values[i] = this.roundFloat(this.options.maxValue);

        return values;
    },

	roundFloat: function(x){
		if (!this.digCount)
			return Math.round(x);

		return parseFloat(Number(x).toFixed(this.digCount));
	},

	windowMouseOut : function(evt){
		var elt = null;
		if (evt.srcElement){
			elt = evt.toElement;
		} else {
			elt = evt.relatedTarget;
		}
		if (elt == null) {
			this.endDrag(evt);
		}
	},

	windowResized : function(evt){
		this.setValue(this.value);
	},

	findTableForTrack: function(elem) {
		var parent = elem.parentElement || elem.parentNode;
		if (parent.tagName.toUpperCase()=="TABLE") {
			return parent;
		} else {
			return this.findTableForTrack(parent);
		}
	},

    getNearestValue: function(value){
        var pos;
        pos = this.binsearch(this.availableValues, value);
        if (pos>0) {
        	var prevPos = pos-1;
        	if ( Math.abs(value-this.availableValues[prevPos])<
        		 Math.abs(this.availableValues[pos]-value) ) {
        		pos = prevPos;
        	}
        }
        return this.roundFloat(this.availableValues[pos]);
    },

    binsearch: function(v, t) {
        var i = 0;
        var j = v.length - 1;
        var k;
        while (i < j) {
            k = Math.round((i + j) / 2 + 0.5) - 1;
            if (t <= v[k]) j = k;
            else i = k + 1;
        }

        return i;
    },


    setValue: function(sliderValue){
	    if (isNaN(sliderValue)){
	     sliderValue=0;
	    }
		var newValue = this.getNearestValue(sliderValue);
		this.value = newValue;

		if ((!this.editInFocus || newValue==sliderValue) && (this.required || "" != this.input.value || this.updating)){
			this.input.value = this.value;
			if(this.options.orientation == "vertical"){
                this.handle.style.top = this.translateToPx(this.value);
            } else {
			    this.handle.style.left = this.translateToPx(this.value);
			}
		} else
		{
			if(this.options.orientation == "vertical"){
                this.handle.style.top = "-9px";
            } else {
			    this.handle.style.left = "0px";
			}
		}
		if (!this.tip.firstChild) {
			this.tip.appendChild(window.document.createTextNode(this.value));
		}
		if(this.options.showArrows){
			if (!this.tipArrowInc.firstChild) {
	            this.tipArrowInc.appendChild(window.document.createTextNode(this.value));
	        }
	        if (!this.tipArrowDec.firstChild) {
	            this.tipArrowDec.appendChild(window.document.createTextNode(this.value));
	        }
	        this.tipArrowInc.firstChild.nodeValue= this.value;
			this.tipArrowDec.firstChild.nodeValue= this.value;
		}

		this.tip.firstChild.nodeValue= this.value;
		if(this.options.orientation == "vertical"){
		  this.tip.style.top = (this.handle.offsetTop) + "px";
		} else {
 		  this.tip.style.left = this.handle.offsetLeft + "px";
 		}
	},



	translateToPx: function(value) {
		if(this.options.orientation == "vertical"){
		    return Math.round(
	            ((this.maximumOffset() - this.handleLength)/(this.options.maxValue-this.options.minValue)) *
	            (this.options.maxValue - value) - this.maximumOffset()) + "px";
	    }
		return Math.round(
			((this.maximumOffset() - this.handleLength)/(this.options.maxValue-this.options.minValue)) *
			(value - this.options.minValue)) + "px";
	},

	translateToValue: function(offset) {
		if(this.options.orientation == "vertical"){
		    return (this.options.maxValue -((offset/(this.maximumOffset() - this.handleLength) *
	            (this.options.maxValue-this.options.minValue))));
		}
		return ((offset/(this.maximumOffset() - this.handleLength) *
			(this.options.maxValue-this.options.minValue)) + this.options.minValue);
	},

	maximumOffset: function(){
		if(this.options.orientation == "vertical"){
			   return this.removePx(this.track.style.height || this.track.offsetHeight || this.options.height);
			}
		return this.removePx(this.track.style.width || this.track.offsetWidth || this.options.width);
	},

	removePx: function(e){
		if ((e+"").indexOf("px")!=-1)
			return (e+"").substring(0,e.length-2);
		else
			return e;
	},

	startDrag: function(event) {
		if (this.editInFocus) {
			this.input.blur();
        }

		window.document.onmouseup = this.eventMouseUp.bind(this);
		window.document.onmousemove = this.eventMouseMove.bind(this);
		_slObserve(document, "mouseout", this.eventWindowMouseOut);
		this.editBlur();
		this.prevMouseDownEvent = event;

		if(_slIsLeftClick(event)) {
			if(!this.disabled){
				this.handle.className = this.classes.arrowSelected + this.classes.base + this.classes.handleSelected;
				if (this.options.showToolTip){
					this.tip.style.display = '';
					this.tip.style.top = '-' + (this.tip.offsetHeight+2) + 'px';
				}
				Richfaces.createEvent("mousedown", this.mainTable, null, null).fire();
				this.active = true;
				var handle = event.target || event.srcElement;

				var pointer;
				if(this.orientation=="vertical"){
				    pointer = _slPointerY(event);
				} else {
				    pointer = _slPointerX(event);
				}
				var offsets = _slCumulativeOffset(this.track);
				this.updating = true;

				var value;
				if(this.orientation=="vertical"){
                    value = this.translateToValue( ( pointer - offsets[1] ) -(this.handleLength/2));
                } else {
                    value = this.translateToValue( ( pointer - offsets[0] ) -(this.handleLength/2));
                }
				if(this.invokeEvent("slide",event,this.getNearestValue(value),this.input)){
					this.setValue(value);
				}

				this.updating = false;
				var offsets	= _slCumulativeOffset(this.handle);
				if(this.orientation=="vertical"){
                    this.offsetX = pointer - offsets[1];
                } else {
                    this.offsetX = pointer - offsets[0];
                }
			}
			_slStop(event);
		}
	},

	update: function(event) {
		this.updating = true;
		if(this.active) {
			if(!this.dragging) this.dragging = true;
			this.draw(event);
			_slStop(event);
		}
		this.updating = false;
	},

	draw: function(event) {
		if(this.orientation=="vertical"){
	        var pointer = _slPointerY(event);
            var offsets = _slCumulativeOffset(this.track);
            pointer -= this.offsetX + offsets[1];
            this.setValue(this.translateToValue( pointer ));
	    } else{
			var pointer = _slPointerX(event);
			var offsets = _slCumulativeOffset(this.track);
			pointer -= this.offsetX + offsets[0];
			this.setValue(this.translateToValue( pointer ));
		}
	},

	processMouseUp: function(event) {
		this.endDrag(event);
		this.fireClickIfNeeded(event);
	},

	endDrag: function(event) {
		window.document.onmouseup = this.prevMouseUp;
		window.document.onmousemove = this.prevMouseMove;
		_slStopObserve(document, "mouseout", this.eventWindowMouseOut, false);
		if (this.options.showToolTip){
			this.tip.style.display = 'none';
		}
		if (this.eventChanged && this.isValueChanged()){
			this.eventChanged(event);
		}
		this.handle.className = this.classes.arrow + this.classes.base;
		if(this.active && this.dragging) {
			this.active = false;
			this.dragging = false;
			Richfaces.createEvent("mouseup", this.mainTable, null, null).fire();
			_slStop(event);
		}
		if (RichFaces.navigatorType() != RichFaces.MSIE)
			Richfaces.createEvent("change", this.input, null, null).fire();
	},

	fireClickIfNeeded: function(event){
		if ((this.prevMouseDownEvent.target != event.target
			&& RichFaces.navigatorType() == RichFaces.FF)
			|| (RichFaces.getOperaVersion()
			&& RichFaces.getOperaVersion() < 9.0
			&& event.target.tagName.toLowerCase() != "div")) {
				Richfaces.createEvent("click", this.mainTable, null, null).fire();
		}
	},

	isValueChanged : function(){
		var ret =this.prevValue != this.value
		this.prevValue = this.value;
		return ret;
	},

	increase : function(event){
	    var v = parseFloat(this.value) + parseFloat(this.step);
        this.setValue(Number( v < this.options.maxValue ? v : this.options.maxValue));
        this.input.value = this.value;
        if (this.eventChanged && this.isValueChanged()){
            this.eventChanged(event);
        }
	},

	decrease : function(event){
	    var v = parseFloat(this.value) - parseFloat(this.step);
	    this.setValue(Number(v > this.options.minValue ? v : this.options.minValue));
        this.input.value = this.value;
        if (this.eventChanged && this.isValueChanged()){
            this.eventChanged(event);
        }
    },

    increaseDown : function(event){
        this.arrowButton = event.target || event.srcElement;
        this.arrowButton.className = this.arrowButton.className.replace("Class","SelectedClass").replace("al","al-selected");
        window.document.onmouseup = this.eventIncreaseUp.bind(this);
        if(!this.disabled){
            if (this.options.showToolTip){
                this.tipArrowInc.style.display = '';
            }
        }
        this.eventIncrease(event);
        this._periodicalExecuter = _slPeriodical(this.eventIncrease, this.delay/1000);
    },

    decreaseDown : function(event){
        this.arrowButton = event.target || event.srcElement;
        this.arrowButton.className = this.arrowButton.className.replace("Class","SelectedClass").replace("al","al-selected");
        window.document.onmouseup = this.eventDecreaseUp.bind(this);
        if(!this.disabled){
            if (this.options.showToolTip){
                this.tipArrowDec.style.display = '';
            }
        }
        this.eventDecrease(event);
        this._periodicalExecuter = _slPeriodical(this.eventDecrease, this.delay/1000);
    },

    increaseUp : function(event){
        this._periodicalExecuter.stop();
        if (this.options.showToolTip){
            this.tipArrowInc.style.display = 'none';
        }
        this.arrowButton.className = this.arrowButton.className.replace("SelectedClass","Class").replace("al-selected","al");
        window.document.onmouseup = this.prevMouseUp;
    },

    decreaseUp : function(event){
	    this._periodicalExecuter.stop();
        if (this.options.showToolTip){
            this.tipArrowDec.style.display = 'none';
        }
        this.arrowButton.className = this.arrowButton.className.replace("SelectedClass","Class").replace("al-selected","al");
        window.document.onmouseup = this.prevMouseUp;
    },

	inputChange: function(e) {
		this.editInFocus = false;
		if (isNaN(Number(this.input.value))){
			this.setValue(this.value);
		} else {
			if (this.outOfRange)
				if (this.eventError)
					this.eventError(e,this.options.clientErrorMessage);
			this.setValue(Number(this.input.value));
		}
		this.value = this.input.value ? this.input.value : this.value ;
		if(this.eventInputOnChange){
			this.eventInputOnChange();
		}
		if (this.eventChanged && this.isValueChanged()){
			this.eventChanged(e);
		}
	},

	inputValidate: function(e) {
		if ( e.keyCode == 13 ){
			if (isNaN(Number(this.input.value))){
				this.input.value = this.value;
				this.editBlur();
				this.setValue(this.value);
			}
		}
	},

	editChange: function(e) {
		if (this.input.value=='-') return;
		if (isNaN(Number(this.input.value))){
			this.setValue(Number(this.value));
			this.input.value = this.value;

			if (this.eventError){
				this.eventError(e,this.options.clientErrorMessage);
			}
		} else {
			if (!( e.keyCode >= 37 && e.keyCode <= 40 )){
				this.setValue(Number(this.input.value));
			}
		}

		if (e.keyCode == 13) {
			if (this.required || "" != this.input.value) {
				this.setValue(Number(this.value));
			    this.input.value = this.value;
			}
			if (this.input.form) {
				this.input.form.submit();
			}
		}
		if (this.eventChanged && this.isValueChanged()){
			this.eventChanged(e);
		}

	},

	editFocus: function(){
		this.editInFocus = true;
	},

	editBlur: function(){
		this.editInFocus = false;
	    if ((this.input.value+"").indexOf(this.value) != 0){
    		 this.setValue(this.input.value);
             this.eventInputChange();
	    }
	    else{
		     this.setValue(this.input.value);
		}
	},

	load: function(){
		// fix RF-895
		if(this.input.value){
			this.options.sliderValue = this.input.value;
		}

		this.setInitialValue();
	},

	trim : function(str){
		return str.replace(/^\s+|\s+$/, '');
	},

	invokeEvent: function(eventName, event, value, element) {

		var eventFunction = this.options['on'+eventName];
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
			eventObj.rich.value = value;

			try
			{
				result = eventFunction.call(element, eventObj);
			}
			catch (e) { LOG.warn("Exception: "+e.Message + "\n[on"+eventName + "]"); }

		}

		if (result!=false) result = true;

		return result;
	}

};
