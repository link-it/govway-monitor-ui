/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM + jQuery (gia' in pagina):
 *     Class.create()                    -> costruttore + .prototype plain
 *     $(id)                             -> document.getElementById(id)
 *     Object.extend(t, s)               -> Object.assign(t, s)
 *     Element.show(el)/hide(el)         -> el.style.display = '' / 'none'
 *     Element.setStyle(el, hash)        -> ModalPanel._applyStyles(el, hash)
 *     Element.getStyle(el, prop)        -> getComputedStyle(el).getPropertyValue(prop)
 *     Event.observe/stopObserving       -> addEventListener/removeEventListener
 *     Event.stop(e)                     -> e.preventDefault(); e.stopPropagation();
 *     Event.element(e)                  -> e.target || e.srcElement
 *     bindAsEventListener(this)         -> .bind(this)
 *     new Insertion.Top(el, html)       -> el.insertAdjacentHTML('afterbegin', html)
 *     $H(obj).keys()                    -> Object.keys(obj)
 *     array.without(item)               -> array.filter(x => x !== item)
 *     array.last()                      -> array[array.length - 1]
 *     Prototype.Browser.IE check        -> rimosso (IE non supportato)
 *   I rami che usano eDiv.style.setExpression/removeExpression sono lasciati
 *   intatti: sono dietro feature-detect, gia' inerti su browser non-IE.
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if (!window.DW) {
	window.DW = {};
}

if (!window.Richfaces) {
	window.Richfaces = {};
}

function discardElement(element) {
    var garbageBin = document.getElementById('IELeakGarbageBin');
    if (!garbageBin) {
        garbageBin = document.createElement('DIV');
        garbageBin.id = 'IELeakGarbageBin';
        garbageBin.style.display = 'none';
        document.body.appendChild(garbageBin);
    }

	window.RichFaces.Memory.clean(element);
    // move the element to the garbage bin
    garbageBin.appendChild(element);
    garbageBin.innerHTML = '';
}

Selection = {};
Selection.eventHandler=function(event){
	if (event.preventDefault) event.preventDefault();
	if (event.stopPropagation) event.stopPropagation();
};
Selection.eventHandler = Selection.eventHandler.bind(Selection);
Selection.disableSelection = function (element)
{
	if (typeof element.onselectstart!="undefined") //IE legacy
	{
		element.addEventListener('selectstart', this.eventHandler);
	}
	else if (typeof element.style.MozUserSelect!="undefined") //Firefox
	{
		element.style.MozUserSelect="none";
	}
	else //All other (ie: Opera)
	{
		element.addEventListener('mousedown', this.eventHandler);
	}
}

Selection.enableSelection = function (element)
{
	if (typeof element.onselectstart!="undefined") //IE legacy
	{
		element.removeEventListener('selectstart', this.eventHandler);
	}
	else if (typeof element.style.MozUserSelect!="undefined") //Firefox
	{
		element.style.MozUserSelect="";
	}
	else //All other (ie: Opera)
	{
		element.removeEventListener('mousedown', this.eventHandler);
	}
}

function ModalPanel(id, options) {
	this.initialize(id, options);
}

// Helper: applica un oggetto di stili (chiavi camelCase o hyphenated) a un element.
// Replica la semantica di Prototype.Element.setStyle.
ModalPanel._applyStyles = function (elem, styles) {
	if (!elem || !styles) return;
	for (var key in styles) {
		if (Object.prototype.hasOwnProperty.call(styles, key)) {
			var prop = key.indexOf('-') === -1
				? key
				: key.replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); });
			elem.style[prop] = styles[key];
		}
	}
};

// Helper: rimuove la prima occorrenza di item da arr (no-op se non trovato).
ModalPanel._without = function (arr, item) {
	return arr.filter(function (x) { return x !== item; });
};

{
	var ieVersion = RichFaces.getIEVersion();
	if (ieVersion && ieVersion < 7) {
		ModalPanel.disableSelects = true;
	}
}

ModalPanel.panels = new Array();
ModalPanel.activePanels = new Array();

function getSizeElement() {
	var element;
	var element;
	if (RichFaces.navigatorType() != RichFaces.OPERA && document.compatMode=='CSS1Compat') {
		element = document.documentElement;
	} else {
		element = document.body;
	}

	return element;
}

ModalPanel.getMinimumSize = function(size) {
	return Math.max(size, 2*ModalPanel.Sizer.INITIAL_MIN + 2);
};

ModalPanel.prototype = {
	initialize: function(id, options) {
		this["rich:destructor"] = "destroy";

		this.markerId = document.getElementById(id);

		this.id = document.getElementById(id + "Container");

		this.options = options;

		this.baseZIndex = this.options.zindex ? this.options.zindex : 100;

		this.minWidth = ModalPanel.getMinimumSize(this.options.minWidth);
		this.minHeight = ModalPanel.getMinimumSize(this.options.minHeight);

		this.div = id + "Div";
		this.cursorDiv = id + "CursorDiv";
		this.cdiv = id + "CDiv";
		this.contentDiv = id + "ContentDiv";
		this.contentTable = id + "ContentTable";
		this.shadowDiv = id + "ShadowDiv";

		this.borders = new Array();

		if (this.options.resizeable) {
			this.borders.push(new ModalPanel.Border(id + "ResizerN", this, "N-resize", ModalPanel.Sizer.N));
			this.borders.push(new ModalPanel.Border(id + "ResizerE", this, "E-resize", ModalPanel.Sizer.E));
			this.borders.push(new ModalPanel.Border(id + "ResizerS", this, "S-resize", ModalPanel.Sizer.S));
			this.borders.push(new ModalPanel.Border(id + "ResizerW", this, "W-resize", ModalPanel.Sizer.W));

			this.borders.push(new ModalPanel.Border(id + "ResizerNWU", this, "NW-resize", ModalPanel.Sizer.NWU));
			this.borders.push(new ModalPanel.Border(id + "ResizerNEU", this, "NE-resize", ModalPanel.Sizer.NEU));
			this.borders.push(new ModalPanel.Border(id + "ResizerNEL", this, "NE-resize", ModalPanel.Sizer.NEL));
			this.borders.push(new ModalPanel.Border(id + "ResizerSEU", this, "SE-resize", ModalPanel.Sizer.SEU));
			this.borders.push(new ModalPanel.Border(id + "ResizerSEL", this, "SE-resize", ModalPanel.Sizer.SEL));
			this.borders.push(new ModalPanel.Border(id + "ResizerSWL", this, "SW-resize", ModalPanel.Sizer.SWL));
			this.borders.push(new ModalPanel.Border(id + "ResizerSWU", this, "SW-resize", ModalPanel.Sizer.SWU));
			this.borders.push(new ModalPanel.Border(id + "ResizerNWL", this, "NW-resize", ModalPanel.Sizer.NWL));
		}

		if (this.options.moveable && document.getElementById(id + "Header")) {
			this.header = new ModalPanel.Border(id + "Header", this, "move", ModalPanel.Header);
		}

		this.markerId.component = this;

		var eDiv = document.getElementById(this.div);
		if (eDiv.style.setExpression)
			if (ModalPanel.disableSelects /* IE 6 */ || Richfaces.getComputedStyle(eDiv, "position") != "fixed" /* IE again, not in strict mode*/)

		{
			eDiv.style.position = "absolute";

			var eCursorDiv = document.getElementById(this.cursorDiv);
			eCursorDiv.style.position = "absolute";

			//that is to apply filter
			eDiv.style.zoom = "1";
			eCursorDiv.style.zoom = "1";

			var eCdiv = document.getElementById(this.cdiv);
			eCdiv.style.position = "absolute";
			eCdiv.parentNode.style.position = "absolute";

			eCdiv.mpUseExpr = true;
		}

		ModalPanel.panels.push(this);

		this.eventFirstOnfocus = this.firstOnfocus.bind(this);
		this.eventLastOnfocus = this.lastOnfocus.bind(this);

		this.firstHref = id + "FirstHref";
		this.lastHref = id + "LastHref";

		this.selectBehavior = options.selectBehavior;
	},

	_saveInputValues: function(element) {
		// Fix originale per RF-3856 (checkbox/radio in IE6/7/8 beta 2): rimosso, IE non supportato.
	},

	width: function() {
		return this.getSizedElement().clientWidth;
	},

	height: function() {
		return this.getSizedElement().clientHeight;
	},

	getSizedElement: function() {
		if (!this._sizedElement) {
			this._sizedElement = document.getElementById(this.cdiv);
		}

		return this._sizedElement;
	},

	getContentElement: function() {
		if (!this._contentElement) {
			this._contentElement = this.options.autosized ? document.getElementById(this.contentTable) : document.getElementById(this.contentDiv);
		}

		return this._contentElement;
	},

	destroy: function() {

		if (this.observerSize) {
			window.clearInterval(this.observerSize);
			this.observerSize = null;
		}

		this._contentElement = null;
		this._sizedElement = null;

		ModalPanel.panels = ModalPanel._without(ModalPanel.panels, this);

        this.enableSelects();

        ModalPanel.activePanels = ModalPanel._without(ModalPanel.activePanels, this);

        this.parent = null;
        this.firstOutside = null;
        this.lastOutside = null;
        if (this.header) {
        	this.header.destroy();
			this.header=null;
        }

		for (var k = 0; k < this.borders.length; k++ ) {
			this.borders[k].destroy();
		}
		this.borders = null;

		setTimeout(function() {
			if (this.domReattached) {
				var element = this.id;
				var parent = element.parentNode;
				if (parent) {
					parent.removeChild(element);
					discardElement(element);
				}
			}
		}.bind(this), 0);

        this.markerId.component = null;
        this.markerId = null;
	},

	initIframe : function() {
        if (this.contentWindow) {
			ModalPanel._applyStyles(this.contentWindow.document.body, { "margin" : "0px 0px 0px 0px" });
		} else {
			//TODO opera etc.

		}

		var bgColor = window.getComputedStyle(document.body).getPropertyValue('background-color');
		if ("transparent" == bgColor) {
			this.style.filter = "alpha(opacity=0)";
			this.style.opacity = "0";
		}

		//this.style.opacity = "0.5";
		//this.style.filter='progid:DXImageTransform.Microsoft.Alpha(style=0,opacity=50)';
		//var iframeBodyStyle = this.contentWindow.document.body.style;
		//iframeBodyStyle.backgroundColor = "#d0d0d0";
		//iframeBodyStyle.filter = "alpha(opacity=50)";
		//iframeBodyStyle.opacity = "0.5";
		//iframeBodyStyle.zIndex = "99";
	},

	enableSelect: function(elt) {
		if (elt._mdwProcessed) {
			elt._mdwProcessed = undefined;

			if (elt._mdwDisabled) {
				elt.disabled = false;
				elt._mdwDisabled = undefined;
			}

			if (typeof elt._mdwHidden != "undefined") {
				elt.style.visibility = elt._mdwHidden;
				elt._mdwHidden = undefined;
			}
		}
	},

	disableSelect: function(elt) {
		if (!elt._mdwProcessed) {
			elt._mdwProcessed = true;

			if ("hide" == this.selectBehavior) {
				if (elt.style.visibility != "hidden") {
					elt._mdwHidden = elt.style.visibility;
					elt.style.visibility = "hidden";
				}
			} else {
				if (!elt.disabled) {
					elt.disabled = true;
					elt._mdwDisabled = true;
				}
			}
		}
	},

	enableInnerSelects: function() {
		if (ModalPanel.disableSelects) {
			var selects = this.id.getElementsByTagName("SELECT");
			for (var k = 0; k < selects.length; k++) {
				this.enableSelect(selects[k]);
			}
		}
	},

	disableInnerSelects: function() {
		if (ModalPanel.disableSelects) {
			var selects = this.id.getElementsByTagName("SELECT");
			for (var k = 0; k < selects.length; k++) {
				this.disableSelect(selects[k]);
			}
		}
	},

	enableSelects: function() {
		if (!ModalPanel.disableSelects) {
			return ;
		}

		var lastPanel = ModalPanel.activePanels[ModalPanel.activePanels.length - 1];
		var newLastPanel = ModalPanel.activePanels[ModalPanel.activePanels.length - 2];

		if (newLastPanel) {
			if (lastPanel == this) {
				//we've just closed top panel, re-enable next panel if any
				newLastPanel.enableInnerSelects();
			}
		} else {
			var selects = document.body.getElementsByTagName("SELECT");
			for (var i = 0; i < selects.length; i++) {
				this.enableSelect(selects[i]);
			}
		}
	},

	disableOuterSelects: function() {
		if (!ModalPanel.disableSelects) {
			return ;
		}

		var lastPanel = ModalPanel.activePanels[ModalPanel.activePanels.length - 1];

		if (lastPanel) {
			//we need to disable only the last opened panel
			lastPanel.disableInnerSelects();
			this.enableInnerSelects();
		} else {
			//disable all outer
			var selects = document.body.getElementsByTagName("SELECT");

			var innerSelects = this.id.getElementsByTagName("SELECT");
			var firstInnerSelect = innerSelects[0];
			var lastInnerSelect = innerSelects[innerSelects.length - 1];

			var selectsAreInner = false;

			for (var i = 0; i < selects.length; i++) {
				var select = selects[i];
				if (select == firstInnerSelect) {
					selectsAreInner = true;
				}

				if (!selectsAreInner) {
					this.disableSelect(select);
				}

				if (select == lastInnerSelect) {
					selectsAreInner = false;
				}
			}
		}
	},

	setLeft: function(pos) {
		var eCdiv = document.getElementById(this.cdiv);
		if (eCdiv.mpUseExpr) {
			eCdiv.mpLeft = pos;
		} else {
			eCdiv.style.left = pos + "px";
		}
	},

	setTop: function(pos) {
		var eCdiv = document.getElementById(this.cdiv);
		if (eCdiv.mpUseExpr) {
			eCdiv.mpTop = pos;
		} else {
			eCdiv.style.top = pos + "px";
		}
	},

	firstOnfocus: function(event) {
		var e = document.getElementById(this.firstHref);
		if (e && (ModalPanel.activePanels[ModalPanel.activePanels.length - 1] == this)) {
			e.focus();
		}
	},

	lastOnfocus: function(event) {
		var e = document.getElementById(this.lastHref);
		if (e && (ModalPanel.activePanels[ModalPanel.activePanels.length - 1] == this)) {
			e.focus();
		}
	},

	formElements: "|a|input|select|button|textarea|",

	processAllFocusElements: function(root, callback) {
		var idx = -1;
		var tagName;

		if (root.focus && root.nodeType == 1 && (tagName = root.tagName) &&
			// Many not visible elements have focus method, we is had to avoid processing them.
			(idx = this.formElements.indexOf(tagName.toLowerCase())) != -1 &&
			this.formElements.charAt(idx - 1) === '|' &&
			this.formElements.charAt(idx + tagName.length) === '|' &&
			!root.disabled && root.type!="hidden") {
				callback.call(this, root);
		} else {
			if (root != this.id) {
				var child = root.firstChild;
				while (child) {
					if (!child.style || child.style.display != 'none') {
						this.processAllFocusElements(child, callback);
					}
					child = child.nextSibling;
				}
			}
		}
	},

	processTabindexes:	function(input) {
		if (!this.firstOutside && !(input.tagName.toLowerCase()=="select" && ModalPanel.disableSelects)) {
			this.firstOutside = input;
		}
		this.lastOutside = input;
		if (input.tabIndex && !input.prevTabIndex) {
			input.prevTabIndex = input.tabIndex;
		}
		input.tabIndex = undefined;
		if (input.accesskey  && !input.prevAccesskey) {
			input.prevAccesskey = input.accesskey;
		}
		input.accesskey = undefined;
	},

	restoreTabindexes:	function(input) {
		if (input.prevTabIndex) {
			input.tabIndex = input.prevTabIndex;
			input.prevTabIndex = undefined;
		}
		if (input.prevAccesskey) {
			input.accesskey = input.prevAccesskey;
			input.prevAccesskey = undefined;
		}
	},

	/*
	 * Contratto di accessibilita' della finestra modale (WCAG 2.1.1 e 2.4.3).
	 *
	 * La contenzione del fuoco originale non funziona sui browser attuali:
	 * 'processTabindexes' assegna 'input.tabIndex = undefined' per escludere dalla
	 * tabulazione tutto cio' che sta fuori dalla finestra, idioma dell'epoca di IE che
	 * oggi converte a 0 — quindi non esclude nulla — e il rimbalzo e' agganciato al solo
	 * primo e ultimo elemento focalizzabile del documento, che tabulando dall'interno non
	 * si incontrano. Inoltre 'show' lascia il fuoco sulla sentinella 'LastHref', un
	 * pulsante vuoto: chi usa la tastiera si trovava fuori dai comandi visibili e con Tab
	 * finiva nella pagina sottostante.
	 *
	 * Qui la finestra dichiara il proprio ruolo, prende il fuoco sul primo comando utile,
	 * lo trattiene ciclando su Tab e Maiusc+Tab, si chiude con Esc e alla chiusura
	 * restituisce il fuoco all'elemento da cui era stata aperta. La macchina originale non
	 * viene toccata.
	 */
	a11yFocusableElements: function() {
		var contenitore = document.getElementById(this.cdiv);
		if (!contenitore) {
			return [];
		}
		var candidati = contenitore.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [tabindex]');
		var utili = [];
		for (var i = 0; i < candidati.length; i++) {
			var el = candidati[i];
			if (el.disabled || el.tabIndex < 0) {
				continue;
			}
			if (el.className && String(el.className).indexOf('rich-mpnl-button') !== -1) {
				continue;   // sentinelle del componente: non sono comandi
			}
			if (el.offsetParent === null) {
				continue;   // non reso
			}
			utili.push(el);
		}
		return utili;
	},

	/* Va invocato in cima a 'show', prima che il componente sposti il fuoco sulla propria
	   sentinella: catturandolo dopo si memorizzerebbe la sentinella, che a finestra chiusa
	   non e' piu' focalizzabile, e il fuoco andrebbe perso sul body. */
	a11yRememberFocus: function() {
		var contenitore = document.getElementById(this.cdiv);
		var attivo = document.activeElement;
		if (attivo && contenitore && contenitore.contains(attivo)) {
			return;   // gia' dentro la finestra: non e' il punto di partenza
		}
		this.a11yPreviousFocus = attivo;
	},

	/* Il comando di chiusura sta nell'area 'controls' dell'intestazione ed e' un'immagine con
	   un gestore di clic: non e' raggiungibile con Tab. Esc chiude gia' la finestra, ma un
	   comando visibile che il fuoco non raggiunge resta inutilizzabile per chi non usa il
	   mouse. Vengono resi operabili i soli comandi che hanno gia' un nome ('alt' o 'title'):
	   un'immagine senza nome e' decorativa e diventerebbe un pulsante muto. */
	a11yPreparaComandiIntestazione: function() {
		var contenitore = document.getElementById(this.cdiv);
		if (!contenitore) {
			return;
		}
		var aree = contenitore.querySelectorAll('.rich-mpnl-controls');
		for (var i = 0; i < aree.length; i++) {
			var comandi = aree[i].querySelectorAll('img');
			for (var j = 0; j < comandi.length; j++) {
				var comando = comandi[j];
				if (comando.getAttribute('data-gw-comando-tastiera') === 'si') {
					continue;
				}
				var nome = comando.getAttribute('alt') || comando.getAttribute('title') || '';
				if (!nome) {
					continue;
				}
				comando.setAttribute('data-gw-comando-tastiera', 'si');
				comando.setAttribute('role', 'button');
				comando.setAttribute('aria-label', nome);
				comando.setAttribute('tabindex', '0');
				comando.addEventListener('keydown', function(event) {
					var key = event.keyCode || event.which;
					if (key === 13 /* Invio */ || key === 32 /* Barra */) {
						event.preventDefault();
						this.click();
					}
				}, false);
			}
		}
	},

	a11yOnShow: function() {
		var contenitore = document.getElementById(this.cdiv);
		if (!contenitore) {
			return;
		}

		contenitore.setAttribute('role', 'dialog');
		contenitore.setAttribute('aria-modal', 'true');
		var intestazione = contenitore.querySelector('.rich-mpnl-header, [id$="Header"]');
		if (intestazione) {
			if (!intestazione.id) {
				intestazione.id = this.cdiv + 'A11yHeader';
			}
			contenitore.setAttribute('aria-labelledby', intestazione.id);
		}

		if (!this.a11yKeydown) {
			this.a11yKeydown = this.a11yHandleKeydown.bind(this);
			contenitore.addEventListener('keydown', this.a11yKeydown, false);
		}

		this.a11yPreparaComandiIntestazione();

		/* Il fuoco va differito e riprovato entro una finestra breve, per due motivi:
		   quando 'show' termina la finestra non e' ancora resa e 'focus()' su un elemento
		   non reso non ha effetto; e il contenuto di molte finestre viene ripopolato da una
		   chiamata AJAX che sostituisce gli elementi, distruggendo quello appena messo a
		   fuoco. I tentativi sono limitati nel tempo e agiscono solo se il fuoco e' fuori
		   dalla finestra, per non contrastare gli spostamenti di chi la sta usando. */
		var pannello = this;
		var prendiIlFuoco = function() {
			if (contenitore.contains(document.activeElement)) {
				return true;
			}
			var comandi = pannello.a11yFocusableElements();
			/* Il primo elemento in ordine di documento e' ora il comando di chiusura
			   nell'intestazione: il fuoco iniziale va invece nel contenuto, dove sta
			   l'operazione per cui la finestra e' stata aperta. La chiusura resta la prima
			   fermata di Tab. */
			var nelContenuto = [];
			for (var k = 0; k < comandi.length; k++) {
				if (!comandi[k].closest || !comandi[k].closest('.rich-mpnl-controls')) {
					nelContenuto.push(comandi[k]);
				}
			}
			var primo = nelContenuto.length ? nelContenuto[0] : comandi[0];
			if (primo) {
				primo.focus();
			} else if (contenitore.offsetParent !== null) {
				contenitore.setAttribute('tabindex', '-1');
				contenitore.focus();
			}
			return contenitore.contains(document.activeElement);
		};
		var attese = [0, 150, 400, 800];
		for (var t = 0; t < attese.length; t++) {
			window.setTimeout(function() {
				if (pannello.shown) {
					prendiIlFuoco();
				}
			}, attese[t]);
		}
	},

	a11yHandleKeydown: function(event) {
		var key = event.keyCode || event.which;
		if (key === 27 /* ESC */) {
			if (this.options && this.options.keepVisualState === true) {
				return true;
			}
			event.preventDefault();
			this.hide(event);
			return false;
		}
		if (key !== 9 /* TAB */) {
			return true;
		}
		var comandi = this.a11yFocusableElements();
		if (comandi.length < 1) {
			return true;
		}
		var primo = comandi[0];
		var ultimo = comandi[comandi.length - 1];
		if (event.shiftKey && document.activeElement === primo) {
			event.preventDefault();
			ultimo.focus();
			return false;
		}
		if (!event.shiftKey && document.activeElement === ultimo) {
			event.preventDefault();
			primo.focus();
			return false;
		}
		return true;
	},

	a11yOnHide: function() {
		var contenitore = document.getElementById(this.cdiv);
		if (contenitore) {
			contenitore.removeAttribute('aria-modal');
			if (this.a11yKeydown) {
				contenitore.removeEventListener('keydown', this.a11yKeydown, false);
				this.a11yKeydown = null;
			}
		}
		/* La restituzione del fuoco va differita: il resto di 'hide' smonta la finestra e
		   sposta il fuoco, quindi un focus() dato qui verrebbe perso. E l'elemento di
		   partenza puo' essere stato sostituito da un re-render AJAX: in quel caso si
		   ricerca per id, che JSF mantiene stabile. */
		var precedente = this.a11yPreviousFocus;
		var idPrecedente = (precedente && precedente.id) ? precedente.id : null;
		this.a11yPreviousFocus = null;

		window.setTimeout(function() {
			var bersaglio = null;
			if (precedente && precedente.focus && document.body.contains(precedente)) {
				bersaglio = precedente;
			} else if (idPrecedente) {
				bersaglio = document.getElementById(idPrecedente);
			}
			if (bersaglio && bersaglio.focus && bersaglio.offsetParent !== null) {
				bersaglio.focus();
			}
		}, 0);
	},

	preventFocus:	function() {
		this.processAllFocusElements(document, this.processTabindexes);

		if (this.firstOutside) {
			this.firstOutside.addEventListener("focus", this.eventFirstOnfocus);
		}
		if (this.lastOutside && this.lastOutside != this.firstOutside) {
			this.lastOutside.addEventListener("focus", this.eventLastOnfocus);
		}
	},

	restoreFocus: function() {
		this.processAllFocusElements(document, this.restoreTabindexes);

		if (this.firstOutside) {
			this.firstOutside.removeEventListener("focus", this.eventFirstOnfocus);
			this.firstOutside = null;
		}
		if (this.lastOutside) {
			this.lastOutside.removeEventListener("focus", this.eventLastOnfocus);
			this.lastOutside = null;
		}
	},

	show: function(event, opts) {
		if(!this.shown && this.invokeEvent("beforeshow",event,null,element)) {

			var element = this.id;
			var jqElement = jQuery(element);

			try {
				this.a11yRememberFocus();
			} catch (e) { /* la restituzione del fuoco non deve impedire l'apertura */ }

			this.preventFocus();

	        if (!this.domReattached) {
				this.parent = element.parentNode;

				var domElementAttachment;
				if (opts) {
					domElementAttachment = opts.domElementAttachment;
				}

				if (!domElementAttachment) {
					domElementAttachment = this.options.domElementAttachment;
				}

				var newParent;
				if ('parent' == domElementAttachment) {
					newParent = this.parent;
				} else if ('form' == domElementAttachment) {
					newParent = this._findForm(element) || document.body;
				} else {
					//default - body
					newParent = document.body;
				}

				if (newParent != this.parent) {
					this._saveInputValues(element);
					newParent.insertBefore(element, null);
					this.domReattached = true;
				} else {
					this.parent.style.display = '';
				}
			}

			var eCdiv = document.getElementById(this.cdiv);
			var jqEDiv = jQuery(eCdiv);
			var forms = eCdiv.getElementsByTagName("form");

			if (this.options.keepVisualState && forms) {
				this.formOnsubmit = this.setStateInput.bind(this);
				for (var i = 0; i < forms.length; i++) {
					forms[i].addEventListener("submit", this.formOnsubmit);
				}
			}

			var eIframe;
			if ((ModalPanel.disableSelects || this.options.overlapEmbedObjects) && !this.iframe) {
                        this.iframe = this.id.id + "IFrame";
				eCdiv.insertAdjacentHTML('afterbegin',
                         	"<iframe src=\"javascript:''\" frameborder=\"0\" scrolling=\"no\" id=\"" + this.iframe + "\" " +
				"class=\"rich-mpnl-iframe\" style=\"width: 1px; height: 1px;\">" +
				"</iframe>");

				eIframe = document.getElementById(this.iframe);

				//eIframe.onload = this.initIframe.bind(eIframe);
				eIframe.addEventListener('load', this.initIframe.bind(eIframe));
			}

			var options = {};
			this.userOptions = {};

			if (!eCdiv.mpSet) {
				Object.assign(options, this.options);
			}

			if (opts) {
				Object.assign(options, opts);
				Object.assign(this.userOptions, opts);
			}

			this.currentMinHeight = ModalPanel.getMinimumSize((options.minHeight || options.minHeight == 0) ? options.minHeight : this.minHeight);
			this.currentMinWidth = ModalPanel.getMinimumSize((options.minWidth || options.minWidth == 0) ? options.minWidth : this.minWidth);

			var eContentElt = this.getContentElement();

			if (!this.options.autosized) {
				if (options.width && options.width == -1)
					options.width = 300;
				if (options.height && options.height == -1)
					options.height = 200;
			}

			if (options.width && options.width != -1) {
				if (this.currentMinWidth > options.width) {
					options.width = this.currentMinWidth;
				}

				eContentElt.style.width = options.width + (/px/.test(options.width) ? '' : 'px');
			}

			if (options.height && options.height != -1) {
				if (this.currentMinHeight > options.height) {
					options.height = this.currentMinHeight;
				}

				eContentElt.style.height = options.height + (/px/.test(options.height) ? '' : 'px');
			}

			eCdiv.mpSet = true;

			this.disableOuterSelects();
			ModalPanel.activePanels = ModalPanel._without(ModalPanel.activePanels, this);
			ModalPanel.activePanels.push(this);

			//this.shape.init(eCdiv, this.options);

			var eDiv = document.getElementById(this.div);
			// Rimosso da Link.it: blocco basato su HTMLElement.style.setExpression(),
			// API IE-only deprecata in IE8 e rimossa in IE11. Su browser moderni
			// era dead code (setExpression non esiste).

			jqElement.removeClass( "rich-modalpanel-display-none" ).addClass( "rich-modalpanel-display" );
    		jqElement.removeClass( "rich-modalpanel-visibility" ).addClass( "rich-modalpanel-visibility-hidden" );

			this.correctShadowSize();

			if (options.left) {
				var _left;
				if (options.left != "auto") {
					_left = parseInt(options.left, 10);
				} else {
					var cw = getSizeElement().clientWidth;
				 	var _width = this.width(); //Richfaces.getComputedStyleSize(eContentElt, "width");
					if (cw >= _width) {
					 	_left = (cw - _width) / 2;
					} else {
						_left = 0;
					}
				}

				this.setLeft(Math.round(_left));
			}

			if (options.top) {
				var _top;
				if (options.top != "auto") {
					_top = parseInt(options.top, 10);
				} else {
					var cw = getSizeElement().clientHeight;
					var _height = this.height(); //Richfaces.getComputedStyleSize(eContentElt, "height");
					if (cw >= _height) {
						_top = (cw - _height) / 2;
					} else {
						_top = 0;
					}
				}

				this.setTop(Math.round(_top));
			}

			if (this.options.autosized) {
				this.observerSize =
			        window.setInterval(this.correctShadowSize.bind(this), 500);
			}

			this.doResizeOrMove(ModalPanel.Sizer.Diff.EMPTY);

			for (var k = 0; k < this.borders.length; k++ ) {
				this.borders[k].doPosition();
			}

			if (this.header) {
				this.header.doPosition();
			}

    		jqElement.removeClass( "rich-modalpanel-visibility-hidden" ).addClass( "rich-modalpanel-visibility" );
    		jqEDiv.removeClass( "rich-modalpanel-display" ).addClass( "rich-modalpanel-display-none" );

			this.lastOnfocus();

	    	jqEDiv.removeClass( "rich-modalpanel-display-none" ).addClass( "rich-modalpanel-display" );

	    	var event = {};
	    	event.parameters = opts || {};
	    	this.shown = true;
	    	this.invokeEvent("show",event,null,element);
	    	try {
	    		this.a11yOnShow();   // dopo 'lastOnfocus', cosi' il fuoco utile prevale
	    	} catch (e) { /* la mancanza dei tasti non deve impedire l'uso col mouse */ }
		}
	},

	startDrag: function(border) {
		for (var k = 0; k < this.borders.length; k++ ) {
			this.borders[k].hide();
		}
		Selection.disableSelection(document.body);
	},

	endDrag: function(border) {
		for (var k = 0; k < this.borders.length; k++ ) {
			this.borders[k].show();
			this.borders[k].doPosition();
		}
		Selection.enableSelection(document.body);
	},

	hide: function(event, opts) {
		if (this.shown && this.invokeEvent("beforehide",event,null,element)) {

			this.currentMinHeight = undefined;
			this.currentMinWidth = undefined;

			this.restoreFocus();
			try {
				this.a11yOnHide();
			} catch (e) { /* vedi sopra */ }

	        this.enableSelects();

			ModalPanel.activePanels = ModalPanel._without(ModalPanel.activePanels, this);

			var eDiv = document.getElementById(this.div);
			var eCdiv = document.getElementById(this.cdiv);
			var jqEDiv = jQuery(eCdiv);

			if (eDiv.style.position == "absolute") {
				eDiv.style.removeExpression("width");
				eDiv.style.removeExpression("height");

				eDiv.style.removeExpression("left");
				eDiv.style.removeExpression("top");

				var eCursorDiv = document.getElementById(this.cursorDiv);
				eCursorDiv.style.removeExpression("width");
				eCursorDiv.style.removeExpression("height");

				eCursorDiv.style.removeExpression("left");
				eCursorDiv.style.removeExpression("top");

				eCdiv.style.removeExpression("left");
				eCdiv.style.removeExpression("top");
			}

			// this.id è già un Node (impostato in initialize: this.id = getElementById(id+"Container")).
			// L'originale Prototype $(this.id) ritornava il Node stesso; document.getElementById(Node)
			// invece torna null e fa fallire .appendChild(null) sotto. Quindi uso this.id direttamente.
			var element = this.id;
			var jqElement = jQuery(element); // uso jQuey per comodita''

			jqElement.removeClass( "rich-modalpanel-display" ).addClass( "rich-modalpanel-display-none" );

			if (this.parent) {
				if (this.domReattached) {
					this._saveInputValues(element);

					this.parent.appendChild(element);

					this.domReattached = false;
				} else {
					this.parent.style.display = 'none';
				}
			}

			var event = {};
			event.parameters = opts || {};
			if (this.options && this.options.onhide) {
				this.options.onhide(event);
			}

			var forms = eCdiv.getElementsByTagName("form");
			if (this.options.keepVisualState && forms) {
				for (var i = 0; i < forms.length; i++) {
					forms[i].removeEventListener("submit", this.formOnsubmit);
				}
			}

			this.shown = false;

			if (this.observerSize) {
				window.clearInterval(this.observerSize);
				this.observerSize = null;
			}

			if (ModalPanel.activePanels.length > 0) {
				ModalPanel.activePanels[ModalPanel.activePanels.length - 1].preventFocus();
			}
		}
	},

	_getStyle: function(elt, name) {
		return parseInt(elt.style[name].replace("px", ""), 10);
	},

	doResizeOrMove: function(diff) {
		var vetoes = {};
		var cssHash = {};
		var cssHashWH = {};

		var vetoeChange = false;
		var newSize;

		var eContentElt = this.getContentElement();

		newSize = this._getStyle(eContentElt, "width");//Richfaces.getComputedStyleSize(eContentDiv, "width");

		var oldSize = newSize;
		newSize += diff.deltaWidth || 0;

		if (newSize >= this.currentMinWidth || this.options.autosized) {
			if (diff.deltaWidth) {
				cssHashWH.width = newSize + 'px';
			}
		} else {
			if (diff.deltaWidth) {
				cssHashWH.width = this.currentMinWidth + 'px';

				vetoes.vx = oldSize - this.currentMinWidth;
			}

			vetoes.x = true;
		}

		if (vetoes.vx && diff.deltaX) {
			diff.deltaX = -vetoes.vx;
		}

		var eCdiv = document.getElementById(this.cdiv);

		if (diff.deltaX && (vetoes.vx || !vetoes.x)) {
			if (vetoes.vx) {
				diff.deltaX = vetoes.vx;
			}
			var newPos;

			newPos = this._getStyle(eCdiv, "left");//Richfaces.getComputedStyleSize(eCdiv, "left");
			newPos += diff.deltaX;
			cssHash.left = newPos + 'px';
		}

		newSize = this._getStyle(eContentElt, "height")//;Richfaces.getComputedStyleSize(eContentDiv, "height");

		var oldSize = newSize;
		newSize += diff.deltaHeight || 0;

		if (newSize >= this.currentMinHeight || this.options.autosized) {
			if (diff.deltaHeight) {
				cssHashWH.height = newSize + 'px';
			}
		} else {
			if (diff.deltaHeight) {
				cssHashWH.height = this.currentMinHeight + 'px';

				vetoes.vy = oldSize - this.currentMinHeight;
			}

			vetoes.y = true;
		}

		if (vetoes.vy && diff.deltaY) {
			diff.deltaY = -vetoes.vy;
		}

		if (diff.deltaY && (vetoes.vy || !vetoes.y)) {
			if (vetoes.vy) {
				diff.deltaY = vetoes.vy;
			}

			var newPos;
			if (eCdiv.mpUseExpr) {
				newPos = eCdiv.mpTop || 0;
				newPos += diff.deltaY;

				eCdiv.mpTop = newPos;
				cssHash.top = newPos + 'px';
			} else {
				newPos = this._getStyle(eCdiv, "top");//Richfaces.getComputedStyleSize(eCdiv, "top");
				newPos += diff.deltaY;
				cssHash.top = newPos + 'px';
			}
		}

		ModalPanel._applyStyles(eContentElt, cssHashWH);

		ModalPanel._applyStyles(eCdiv, cssHash);

		this.correctShadowSize();

		Object.assign(this.userOptions, cssHash);
		Object.assign(this.userOptions, cssHashWH);

		var w = this.width();
		var h = this.height();

		this.reductionData = null;

		if (w <= 2*ModalPanel.Sizer.INITIAL_MAX) {
			this.reductionData = {};
			this.reductionData.w = w;
		}

		if (h <= 2*ModalPanel.Sizer.INITIAL_MAX) {
			if (!this.reductionData) {
				this.reductionData = {};
			}

			this.reductionData.h = h;
		}

		if (this.header) {
			this.header.doPosition();
		}

		return vetoes;
	},

	_findForm: function(elt) {
		var target = elt;
		while (target) {
			if (!target.tagName /* document node doesn't have tagName */
					|| target.tagName.toLowerCase() != "form") {

				target = target.parentNode;
			} else {
				break;
			}
		}

		return target;
	},

	setStateInput: function(e) {
		var target = e.target || e.srcElement;
		if (e && target) {
			// Concret input but not entire form is a target element for onsubmit in FF
			target = this._findForm(target);

			var input = document.createElement("input");
			input.type = "hidden";
			input.id = this.markerId.id + "OpenedState";
			input.name = this.markerId.id + "OpenedState";
			input.value = this.shown ? "true" : "false";
			target.appendChild(input);

			var keys = Object.keys(this.userOptions);
			if (keys) {
				for (var i = 0; i < keys.length; i++) {
					input = document.createElement("input");
					input.type = "hidden";
					input.id = this.id.id + "StateOption_" + keys[i];
					input.name = this.id.id + "StateOption_" + keys[i];
					input.value = this.userOptions[keys[i]];
					target.appendChild(input);

				}
			}

			return true;
		}
	},

	correctShadowSize: function() {
		var eShadowDiv = document.getElementById(this.shadowDiv);
		if (!eShadowDiv) {
			return;
		}
		var eIframe = document.getElementById(this.iframe);

		var dx = 0;
		var dy = 0;
		if (!Richfaces.browser.isIE)
		{
			dx = eShadowDiv.offsetWidth-eShadowDiv.clientWidth;
			dy = eShadowDiv.offsetHeight-eShadowDiv.clientHeight;
		}
		var w = this.width();
		var h = this.height();
		eShadowDiv.style.width = (w-dx)+"px";
		eShadowDiv.style.height = (h-dy)+"px";

		if (eIframe) {
			eIframe.style.width = w+"px";
			eIframe.style.height = h+"px";
		}
	},

	invokeEvent: function(eventName, event, value, element) {

		var eventFunction = this.options['on'+eventName];
		var result;

		if (eventFunction) {
			var eventObj;
			if (event) {
				eventObj = event;
			}
			else if(document.createEventObject) {
				eventObj = document.createEventObject();
			}
			else if( document.createEvent ) {
				eventObj = document.createEvent('Events');
				eventObj.initEvent( eventName, true, false );
			}

			eventObj.rich = {component:this};
			eventObj.rich.value = value;

			try	{
				result = eventFunction.call(element, eventObj);
			}
			catch (e) { LOG.warn("Exception: "+e.Message + "\n[on"+eventName + "]"); }
		}

		if (result!=false) {
			 result = true;
		}
		return result;
	}
}

Richfaces.findModalPanel = function (id) {
	if (id) {
		var prefId = (id.charAt(0) == ':' ? id : ':' + id);

		for (var i = 0; i < ModalPanel.panels.length; i++ ) {
			var pnl = ModalPanel.panels[i];
			if (pnl && pnl.markerId) {
				var pnlId = pnl.markerId.id;

				if (pnlId) {
					//try to match ids
					if (pnlId.length >= prefId.length) {
						var substr = pnlId.substring(pnlId.length - prefId.length, pnlId.length);
						if (substr == prefId) {
							return pnl.markerId;
						}
					}
				}
			}
		}
	}
}

Richfaces.showModalPanel = function (id, opts, event) {

	var invoke =
		(Richfaces.browser.isIE || Richfaces.browser.isSafari) ?
		function(f) {
				if (document.readyState != "complete") {
					var args = arguments;
					var dis = this;
				window.setTimeout(
					function() {
						args.callee.apply(dis,args );
					}, 50);
			} else {
				f();
			}
		} :
		function(f) {
			f();
		};

	var panel = document.getElementById(id);
	if (!panel) {
		panel = Richfaces.findModalPanel(id);
	}
	invoke(function() {
		panel.component.show(event, opts);
	});
};

Richfaces.hideModalPanel = function (id, opts, event) {
	var panel = document.getElementById(id);
	if (!panel) {
		panel = Richfaces.findModalPanel(id);
	}
	panel.component.hide(event, opts);
};

Richfaces.hideTopModalPanel = function(event, opts) {
	var mp = ModalPanel.activePanels[ModalPanel.activePanels.length - 1];
	if (mp) {
		mp.hide(event, opts);
	}
}
