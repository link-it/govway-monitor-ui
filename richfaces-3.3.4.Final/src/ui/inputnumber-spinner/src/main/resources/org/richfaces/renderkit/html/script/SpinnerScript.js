/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM:
 *     Class.create()                    -> costruttore + .prototype plain
 *     Object.extend(t, s)               -> Object.assign(t, s)
 *     $()                               -> document.getElementById o passthrough
 *                                          se gia' Node (helper _spnR)
 *     Element.setStyle(el, {...})       -> Object.assign(el.style, {...})
 *     Event.element(e)                  -> e.target || e.srcElement
 *     Event.KEY_UP / Event.KEY_DOWN     -> 38 / 40 (costanti Prototype)
 *     bindAsEventListener(this)         -> .bind(this)
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if (!window.Richfaces) window.Richfaces = {};

// Helper: replica $() di Prototype che accetta sia id stringa sia Node.
function _spnR(e) {
	if (!e) return null;
	if (typeof e === 'string') return document.getElementById(e);
	return e; // already a Node
}

function _RichfacesSpinner(id, options) { this.initialize(id, options); }
Richfaces.Spinner = _RichfacesSpinner;
_RichfacesSpinner.prototype = {

		//default values of options
		cycled: true,
		enableManualInput: true,
		disabled: false,
		required: false,
		clientErrorMessage: null,
		min:0,
		max:100,
		delta:1,
		onup: null,
		ondown: null,
		onerr: null,

		initialize: function(id, options) {
		this.id			= id;
		this.content	= document.getElementById(id +"Edit");
		var buttonsId   = id +"Buttons";
		this.controls	= document.getElementById(buttonsId);
		this.fie		= document.getElementById(id +"For");
		this.items		= new Array();
		this.table		= document.getElementById(buttonsId.substr(buttonsId.indexOf("buttons")+7));
		if (RichFaces.navigatorType() == RichFaces.FF ||
				RichFaces.navigatorType() == RichFaces.NETSCAPE) {
			if (!this.fie){
				var jqTable = jQuery(this.table);
				jqTable.addClass( "rich-spinner-tab-display-moz" );
			}
		}
		Object.assign(this, options);
		if (!this.disabled){
			this.buttonUp = null;
			this.buttonDown = null;
		}
		this.min = Number(this.min);
		this.max = Number(this.max);

		this.cycled		= this.cycled;
		this.enableManualInput		= this.enableManualInput;
		var edit = this._getDirectChildrenByTag(this.content,'INPUT')[0];

		// Le tre righe seguenti erano nell'originale come .bindAsEventListener(edit)
		// senza assegnamento del risultato: erano gia' no-op. Conservate equivalenti.
		this.upClick.bind(edit);
		this.downClick.bind(edit);
		this.error.bind(edit);

		this.required = this.required;
		this._attachBehaviors();
		this._load();

	},

	switchItems: function( e ) {
		var editValue = this.controls.edit.value;
		if (e == 'up'){
			if ("" == editValue) {
				this.controls.edit.value = this.min;
			} else {
				editValue -= this.delta*-1;
				editValue = this.roundFloat(editValue);
				if ( editValue <= this.max && editValue >= this.min){
					this.controls.edit.value = editValue;
				} else {
					if (this.cycled){
						if (this.delta>0){
							this.controls.edit.value = this.min;
						} else {
							this.controls.edit.value = this.max;
						}
					} else {
						this.error(e,this.clientErrorMessage);
						this.controls.fireEditEvent("error");
						this.controls.edit.value = this.max;
						return true;
					}
				}
			}
		} else {
			if ("" == editValue) {
				this.controls.edit.value = this.max;
			} else {
				editValue -= this.delta;
				editValue = this.roundFloat(editValue);
				if (editValue >= this.min && editValue <= this.max){
					this.controls.edit.value = editValue;
				} else {
					if (this.cycled){
						if (this.delta<0){
							this.controls.edit.value = this.min;
						} else {
							this.controls.edit.value = this.max;
						}
					} else {
						this.error(e,this.clientErrorMessage);
						this.controls.fireEditEvent("error");
						this.controls.edit.value = this.min;
						return true;
					}
				}
			}
		}
		return false;
	},

	roundFloat: function(x){
		var str = this.delta.toString();
		var power = 0;
		if (!/\./.test(str)) {
			if (this.delta >= 1) {
				return x;
			}
			if (/e/.test(str)) {
				power = str.split("-")[1];
			}
		} else {
			power = str.length - str.indexOf(".") - 1;
		}
		var ret = x.toFixed(power);
		return ret;
	},

	_load: function(){
		this.controls.edit.readOnly = this.enableManualInput ? "" : "readOnly";
		if (this.disabled) {
			this.controls.edit.readOnly = "readOnly";
			this.controls.edit.style.color = "gray";
		} else {
			this.controls.edit.style.color = "";
		}
	},

	_attachBehaviors: function(){
		var edit		= this._getDirectChildrenByTag(this.content,'INPUT')[0];
		var buttonUp	= null;
		var buttonDown	= null;

		/*
		 * I due pulsanti venivano individuati per posizione: prima e seconda riga
		 * della tabella '...Buttons'. Con il decremento a sinistra del campo e
		 * l'incremento a destra quella tabella non esiste piu', quindi si cercano
		 * per id, che il template garantisce. La ricerca per posizione resta come
		 * ripiego, per non rompere eventuali altre disposizioni.
		 */
		var inputUp		= this.id ? document.getElementById(this.id +"BtnUp") : null;
		var inputDown	= this.id ? document.getElementById(this.id +"BtnDown") : null;

		if (inputUp && inputDown) {
			this.buttonUp = inputUp;
			this.buttonDown = inputDown;
			buttonUp = inputUp.parentNode;
			buttonDown = inputDown.parentNode;
		} else {
			/*
			 * La discesa posizionale solleva un'eccezione se un anello manca: succede
			 * quando lo script di inizializzazione viene rivalutato mentre il markup
			 * dello spinner non e' nel DOM. Ogni passaggio e' quindi protetto.
			 */
			var tbody		= this.controls ? this._getDirectChildrenByTag(this.controls,'TBODY')[0] : null;
			var controls	= tbody ? this._getDirectChildrenByTag(tbody,'TR') : [];
			if (controls.length > 1){
				buttonUp	= this._getDirectChildrenByTag(controls[0],'TD')[0];
				buttonDown	= this._getDirectChildrenByTag(controls[1],'TD')[0];
				this.buttonUp = buttonUp ? this._getDirectChildrenByTag(buttonUp,'INPUT')[0] : null;
				this.buttonDown = buttonDown ? this._getDirectChildrenByTag(buttonDown,'INPUT')[0] : null;
			}
		}

		if (!buttonUp || !buttonDown || !edit){
			return; // markup incompleto: nulla da agganciare
		}

		var upImg		= null;
		var downImg		= null;
		this.controls 	= new Richfaces.Spinner.Controls( this, {button:buttonUp,img:upImg}, {button:buttonDown,img:downImg}, edit );
	},

	_getDirectChildrenByTag: function( e, tagName ) {

		var kids = new Array();
		var allKids = e.childNodes;
		for( var i = 0 ; i < allKids.length ; i++ ){
			if ( allKids[i] && allKids[i].tagName && allKids[i].tagName.toUpperCase() == tagName.toUpperCase() ){
				kids.push(allKids[i]);
			}
		}
		return kids;

	},

	_removePx: function(e){
		return e.substring(0,e.indexOf('px'));
	},

	upClick: function(){
		return true;
	},

	downClick: function(){
		return true;
	},

	error: function(event,clientErrorMessage){
		return true;
	}
};

function _RichfacesSpinnerControls(spinner, up, down, edit) { this.initialize(spinner, up, down, edit); }
Richfaces.Spinner.Controls = _RichfacesSpinnerControls;
_RichfacesSpinnerControls.prototype = {

	initialize: function( spinner, up, down, edit ) {
		this.spinner= spinner;
		this.up		= _spnR(up.button);
		this.upimg	= _spnR(up.img);
		this.down	= _spnR(down.button);
		this.downimg= _spnR(down.img);

		this.mousedown = false;
		this.onUpButton = false;
		this.onDownButton = false;

		this.fie = this.spinner.fie;

		this.edit	= _spnR(edit);
		this.originalColor = edit.style.color;
		this.prevEditValue = (this.edit.value || !this.spinner.required) ? this.edit.value : this.spinner.min;
		this.edit.value = this.prevEditValue;
		this.previousMU = window.document.onmouseup;
		this.previousMM = window.document.onmousemove;
		if (!spinner.disabled){
			this._attachBehaviors();
			this.edit.style.color = this.originalColor;
		} else {
			if (!this.fie){
				this.edit.style.color = "gray";
			}
		}
	},

	upClick: function(e){
	   	if (e.preventDefault) {
	   		e.preventDefault();
	    }
		var isError = this.spinner.switchItems('up');
		this.spinner.upClick();
		if(!isError){
			window.document.onmouseup = this.mouseUp.bind(this);
			this.mousedown=true;
			this.timer = setTimeout(this.continueUpClick.bind(this), 750);
		}
	},

	downClick: function(e){
	   	if (e.preventDefault) {
	   		e.preventDefault();
	    }
		var isError = this.spinner.switchItems('down');
		this.spinner.downClick();
		if(!isError){
			window.document.onmouseup = this.mouseUp.bind(this);
			this.mousedown = true;
			this.timer = setTimeout(this.continueDownClick.bind(this), 750);
		}
	},

	continueUpClick: function(){
		if (!this.mousedown) return;
		window.document.onmousemove = this.mouseMoveUp.bind(this);
		this.spinner.switchItems('up');
		if ( this.timer ){
			clearTimeout(this.timer);
		}
		this.timer = setTimeout(this.continueUpClick.bind(this), 100);
	},

	continueDownClick: function(){
		if (!this.mousedown) return;
		window.document.onmousemove = this.mouseMoveDown.bind(this);
		this.spinner.switchItems('down');
		if ( this.timer ){
			clearTimeout(this.timer);
		}
		this.timer = setTimeout(this.continueDownClick.bind(this), 100);
	},

	mouseUp: function(e){
		clearTimeout(this.timer);
		if (this.spinner.ch == "true"){
			if (!this.onUpButton)
				this.upUp();
			if (!this.onDownButton)
			this.downUp();
		}
		if (this.mousedown){
			this.mousedown=false;
			this.fireEditEvent("change");
		}
	},

	mouseMoveDown: function(e){
	   	if (e.preventDefault) {
         e.preventDefault();
	    }
	    var srcEl = e.target || e.srcElement;
	    if ((this.downimg!=srcEl) ){
		window.document.onmousemove = this.previousMM;
		clearTimeout(this.timer);
		this.mousedown=false;
		if (this.spinner.ch == "true"){
			if (!this.onUpButton)
				this.upUp();
			if (!this.onDownButton)
			this.downUp();
		}
		this.fireEditEvent("change");
		}
	},

	mouseMoveUp: function(e){
	   	if (e.preventDefault) {
         e.preventDefault();
	    }
	    var srcEl = e.target || e.srcElement;
	    if (this.upimg!=srcEl){
		window.document.onmousemove = this.previousMM;
		clearTimeout(this.timer);
		this.mousedown=false;
		if (this.spinner.ch == "true"){
			if (!this.onUpButton)
				this.upUp();
			if (!this.onDownButton)
			this.downUp();
		}
		this.fireEditEvent("change");
		}
	},

	inputChange: function(e) {
		if ((this.edit.value == "" && this.spinner.required) || isNaN(Number(this.edit.value))){
			this.edit.value = this.prevEditValue;
		} else if ("" != this.edit.value) {
			if (Number(this.edit.value) > this.spinner.max){
				this.edit.value = this.spinner.max;
			} else if (Number(this.edit.value) < this.spinner.min) {
				this.edit.value = this.spinner.min;
			}
		}
		if ("" != this.edit.value)
			this.prevEditValue = this.edit.value;
		if (this.eventEditOnChange)
			this.eventEditOnChange();

	},

	editChange: function(e) {
		if ((this.edit.value < this.spinner.max) && (this.edit.value > this.spinner.min) && !isNaN(Number(this.edit.value)) && this.edit.value != ""){
			this.prevEditValue = this.edit.value;
		}

        switch (e.keyCode) {
	        case 38: // KEY_UP
	        	this.spinner.switchItems('up');
	            return;
	        case 40: // KEY_DOWN
	        	this.spinner.switchItems('down');
	            return;
        }

		if (e.keyCode == 13){
			if (this.spinner.required || "" != this.edit.value)
				this.edit.value = this.getValidValue(this.edit.value);
			if (this.edit.form) {
				this.edit.form.submit();
			}
		}
	},

	getValidValue : function(value){
		if (isNaN(value) || value == "")
			return this.prevEditValue;
		if ( value > this.spinner.max)
			return this.spinner.max;
		if (value < this.spinner.min)
			return this.spinner.min;
		return value;
	},

	drag: function() {
	 return false;
	},

	_attachBehaviors: function(){
		this.up.onmousedown	= this.upClick.bind(this);
		this.down.onmousedown = this.downClick.bind(this);
		this.up.onmouseup = this.mouseUp.bind(this);
		this.down.onmouseup = this.mouseUp.bind(this);
		this.edit.onkeydown	= this.editChange.bind(this);
		this._attachKeyboardBehaviors();
		this.eventInputChange= this.inputChange.bind(this);
		if (this.edit.onchange){
			this.eventEditOnChange = this.edit.onchange;
		}
		this.edit.onchange = this.eventInputChange.bind(this.edit);
	},

	/*
	 * I due pulsanti reagivano al solo 'mousedown': da tastiera Invio e Spazio
	 * scatenano 'click', quindi non producevano alcun effetto. Il valore si puo' gia'
	 * cambiare con le frecce su e giu' nel campo numerico (vedi 'editChange'), e i
	 * pulsanti sono fuori dall'ordine di tabulazione come le frecce di un
	 * 'input type=number' nativo; se pero' ricevono il fuoco devono funzionare.
	 * Come il percorso col mouse, dopo l'incremento viene emesso 'change', che e'
	 * cio' che l'applicazione usa per aggiornare il grafico.
	 */
	_attachKeyboardBehaviors: function(){
		var controls = this;
		var attivazione = function(direzione){
			return function(e){
				var tasto = e.keyCode || e.which;
				if (tasto != 13 /* KEY_RETURN */ && tasto != 32 /* KEY_SPACE */){
					return true;
				}
				controls.spinner.switchItems(direzione);
				controls.fireEditEvent("change");
				if (e.preventDefault){
					e.preventDefault();
				}
				return false;
			};
		};
		if (this.spinner.buttonUp){
			this.spinner.buttonUp.onkeydown = attivazione('up');
		}
		if (this.spinner.buttonDown){
			this.spinner.buttonDown.onkeydown = attivazione('down');
		}
	},

	fireEditEvent: function(e){
		if( document.createEvent ) {
			var evObj = document.createEvent('HTMLEvents');
			evObj.initEvent( e, true, false );
			this.edit.dispatchEvent(evObj);
		} else if( document.createEventObject ) {
			this.edit.fireEvent('on' + e);
		}
	}
};
