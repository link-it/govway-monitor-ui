/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM (classList, style.display, getElementById).
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if (!window.RichFaces) window.RichFaces = {};

var RichFaces_FF_Loaded = (RichFaces.navigatorType() == RichFaces.FF);

RichFaces.panelTabs={};
RichFaces.tabPanel={};

RichFaces.createImage =
	function (src) {
		var img = new Image();
		img.src = src;
		return img;
	}

RichFaces.setLabelImages =
	function (element, image, mouseoverimage) {
		if (typeof element == 'string') {
			element = document.getElementById(element);
		}
		if (element) {
			element._image = this.createImage(image);
			element._mouseoverimage = this.createImage(mouseoverimage);
		}
	}

RichFaces.isTabActive = function (tabId) {
	var tab = document.getElementById(tabId);
	if (tab) {
		return tab.classList.contains("rich-tab-active");
	}

	return false;
}

RichFaces.switchTab = function(pane,tab,value){
	var labelSuffix = "_lbl";
	var cellSuffix = "_cell";
	var shiftedTableSuffix = "_shifted";
	var contentSuffix = "";
	var tabs = RichFaces.panelTabs[pane];
	var activeTab;
	var FF = RichFaces_FF_Loaded;
	if(tabs){
		for( var i=0; i<tabs.length; i++){

			var tabi = tabs[i];
			var tabId = tabi.id;
			var tabElement = document.getElementById(tabId + contentSuffix);
			var tabLabelId = tabId +labelSuffix;
			var tabLabel = document.getElementById(tabLabelId);

			var tabCellId = tabId + cellSuffix;
			var tabCell = document.getElementById(tabCellId);

			var shiftedTable = document.getElementById(tabId + shiftedTableSuffix);

			if (tabId == tab) {
				if(tabElement) {
					tabElement.style.display = '';
				}
				activeTab = tabi;
				if (!FF) {
					if (tabLabel) {
						tabLabel.className = tabi.activeClass;
					}

					if (tabCell) {
						tabCell.className = tabi.cellActiveClass;
					}

				}

			} else {
				if (tabElement) {
					tabElement.style.display = 'none';
				}
				if (tabLabel) {
					tabLabel.className = tabi.inactiveClass;
				}
				if (tabCell) {
					tabCell.className = tabi.cellInactiveClass;
				}
				if(shiftedTable) {
					shiftedTable.style.top = "0px";
				}
			}
		}

	}


	if (FF && activeTab) {

		var tabLbl = document.getElementById(activeTab.id + labelSuffix);
		var tabCell = document.getElementById(activeTab.id + cellSuffix);

		if (!tabLbl || !tabLabel
				|| !tabCell ) {
			return;
		}

		var parentTable = RichFaces.findNestingTable(tabLbl);
		var par = parentTable.parentNode;
		var bro = parentTable.nextSibling;

		par.removeChild(parentTable);
		tabLbl.className = activeTab.activeClass;
		par.insertBefore(parentTable, bro);

		parentTable = RichFaces.findNestingTable(tabCell);
		par = parentTable.parentNode;
		bro = parentTable.nextSibling;

		par.removeChild(parentTable);
		tabCell.className = activeTab.cellActiveClass;
		par.insertBefore(parentTable, bro);

	}

	//shift down active tab to cover bottom border
	var shiftedActiveTab = document.getElementById(tab+'_shifted');
	if (shiftedActiveTab) {
		shiftedActiveTab.style.top = "1px";
	}

	// Set value field.
	var paneInput = document.getElementById(pane+"_input");
	if (paneInput) {
		paneInput.value=value;
	}

	/* lo stato ARIA delle schede segue il cambio, anche quando a ridisegnarsi e' il solo
	   contenuto e le intestazioni restano quelle di prima */
	if (RichFaces.aggiornaStatoTab) {
		RichFaces.aggiornaStatoTab(pane);
	}
}

/*
 * Le intestazioni dei tab sono cella di tabella con un gestore di clic: nessun ruolo,
 * 'tabindex' -1, quindi da tastiera non si raggiungono e non si puo' cambiare scheda
 * (WCAG 2.1.1), ne' si capisce quale sia attiva (WCAG 4.1.2).
 *
 * Viene applicato il modello ARIA delle schede: 'tablist' sulla riga che le contiene,
 * 'tab' su ogni intestazione, 'tabpanel' sul contenuto. Le tabelle interposte sono
 * dichiarate di sola presentazione, altrimenti la relazione fra elenco e schede si
 * perderebbe fra righe e celle.
 *
 * L'attivazione e' IMMEDIATA: la freccia sposta il fuoco ed entra nella scheda, come
 * nella console di gestione. Invio e barra spaziatrice restano equivalenti al clic.
 *
 * Per il mouse non cambia nulla.
 */
/* Cambiare scheda comporta una richiesta al server che sostituisce le intestazioni: chi
   ha premuto Invio si ritrova il fuoco sul corpo del documento, in cima alla pagina.
   L'attivazione da tastiera viene quindi annotata, e al ridisegno il fuoco torna sulla
   scheda diventata attiva. L'annotazione ha una scadenza: se il ridisegno non arriva, un
   ridisegno successivo per altro motivo non deve rubare il fuoco a chi sta altrove. */
RichFaces.attivazioniTabDaTastiera = {};

RichFaces.intestazioniTab = function(pane) {
	var tabs = RichFaces.panelTabs[pane];
	var intestazioni = [];
	if (!tabs) {
		return intestazioni;
	}
	for (var i = 0; i < tabs.length; i++) {
		var intestazione = document.getElementById(tabs[i].id + '_lbl');
		if (intestazione) {
			intestazioni.push(intestazione);
		}
	}
	return intestazioni;
};

RichFaces.preparaTastieraTabPanel = function(pane) {

	var intestazioni = RichFaces.intestazioniTab(pane);
	if (!intestazioni.length) {
		return;
	}

	/* antenato comune: e' la riga che raccoglie le intestazioni */
	var elenco = intestazioni[0];
	while (elenco && !intestazioni.every(function(i) { return elenco.contains(i); })) {
		elenco = elenco.parentElement;
	}
	if (elenco) {
		elenco.setAttribute('role', 'tablist');
		var interposti = elenco.querySelectorAll('table, tbody, thead, tr, td, th');
		for (var k = 0; k < interposti.length; k++) {
			if (intestazioni.indexOf(interposti[k]) === -1) {
				interposti[k].setAttribute('role', 'presentation');
			}
		}
	}

	for (var i = 0; i < intestazioni.length; i++) {

		var intestazione = intestazioni[i];
		intestazione.setAttribute('role', 'tab');

		/* il contenuto della scheda non attiva non e' nel documento: arriva dal server
		   al cambio, quindi si dichiara solo quello presente */
		var contenuto = document.getElementById(intestazione.id.replace(/_lbl$/, ''));
		if (contenuto) {
			contenuto.setAttribute('role', 'tabpanel');
			contenuto.setAttribute('aria-labelledby', intestazione.id);
		}

	}

	RichFaces.aggiornaStatoTab(pane);
	RichFaces.riprendiFuocoTab(pane);
	RichFaces.impiantoTastieraTab();
};

/*
 * Il cambio scheda sostituisce le intestazioni: un gestore appeso alla singola cella
 * sparisce con lei, e dalla seconda scheda in poi le frecce non rispondevano piu'.
 * L'ascolto e' quindi delegato al documento, che resta, e un osservatore rimette ruoli e
 * stato sulle intestazioni nuove. Entrambi si installano una volta sola.
 */
RichFaces.impiantoTastieraTabInstallato = false;

RichFaces.paneDellIntestazione = function(intestazione) {
	for (var pane in RichFaces.panelTabs) {
		var tabs = RichFaces.panelTabs[pane];
		if (!tabs) {
			continue;
		}
		for (var i = 0; i < tabs.length; i++) {
			if (tabs[i].id + '_lbl' === intestazione.id) {
				return pane;
			}
		}
	}
	return null;
};

RichFaces.impiantoTastieraTab = function() {

	if (RichFaces.impiantoTastieraTabInstallato) {
		return;
	}
	RichFaces.impiantoTastieraTabInstallato = true;

	document.addEventListener('keydown', function(event) {
		var bersaglio = event.target;
		var intestazione = (bersaglio && bersaglio.closest) ? bersaglio.closest('.rich-tab-header') : null;
		if (!intestazione) {
			return;
		}
		var pane = RichFaces.paneDellIntestazione(intestazione);
		if (pane) {
			RichFaces.tastieraTab(event, pane, intestazione);
		}
	}, false);

	if (typeof MutationObserver === 'undefined') {
		return;
	}
	/* i ruoli si rimettono su cio' che il ridisegno ha sostituito; l'osservatore guarda
	   i soli nodi, non gli attributi, quindi rimetterli non lo richiama */
	var inCoda = false;
	new MutationObserver(function() {
		if (inCoda) {
			return;
		}
		inCoda = true;
		window.requestAnimationFrame(function() {
			inCoda = false;
			for (var pane in RichFaces.panelTabs) {
				RichFaces.preparaTastieraTabPanel(pane);
			}
		});
	}).observe(document.body, { childList: true, subtree: true });
};

/* Dopo un cambio scheda chiesto da tastiera, riporta il fuoco sulla scheda attiva. */
RichFaces.riprendiFuocoTab = function(pane) {

	var scadenza = RichFaces.attivazioniTabDaTastiera[pane];
	if (!scadenza) {
		return;
	}
	delete RichFaces.attivazioniTabDaTastiera[pane];

	if ((new Date()).getTime() > scadenza) {
		return;   // annotazione vecchia: il fuoco e' altrove per volonta' di chi naviga
	}

	var intestazioni = RichFaces.intestazioniTab(pane);
	for (var i = 0; i < intestazioni.length; i++) {
		if (intestazioni[i].classList.contains('rich-tab-active')) {
			intestazioni[i].focus();
			return;
		}
	}
};

RichFaces.tastieraTab = function(event, pane, intestazione) {

	var key = event.keyCode || event.which;
	var intestazioni = RichFaces.intestazioniTab(pane);
	var posizione = intestazioni.indexOf(intestazione);
	if (posizione === -1) {
		return;
	}

	var destinazione = -1;
	if (key === 39 /* DESTRA */ || key === 40 /* GIU' */) {
		destinazione = (posizione + 1) % intestazioni.length;
	} else if (key === 37 /* SINISTRA */ || key === 38 /* SU */) {
		destinazione = (posizione - 1 + intestazioni.length) % intestazioni.length;
	} else if (key === 36 /* INIZIO */) {
		destinazione = 0;
	} else if (key === 35 /* FINE */) {
		destinazione = intestazioni.length - 1;
	} else if (key === 13 /* INVIO */ || key === 32 /* BARRA */) {
		event.preventDefault();
		RichFaces.attivazioniTabDaTastiera[pane] = (new Date()).getTime() + 5000;
		intestazione.click();
		return;
	} else {
		return;
	}

	event.preventDefault();
	/* fuoco mobile: solo la scheda che lo riceve resta raggiungibile con Tab */
	intestazione.setAttribute('tabindex', '-1');
	intestazioni[destinazione].setAttribute('tabindex', '0');
	intestazioni[destinazione].focus();

	/* la freccia entra nella scheda, come nella console di gestione: il fuoco viene poi
	   riportato dove si trova ora, perche' il cambio ridisegna le intestazioni */
	RichFaces.attivazioniTabDaTastiera[pane] = (new Date()).getTime() + 5000;
	intestazioni[destinazione].click();
};

/* Tiene allineati stato e fuoco mobile dopo un cambio di scheda. */
RichFaces.aggiornaStatoTab = function(pane) {

	var intestazioni = RichFaces.intestazioniTab(pane);
	var attivo = -1;

	for (var i = 0; i < intestazioni.length; i++) {
		if (intestazioni[i].classList.contains('rich-tab-active')) {
			attivo = i;
		}
	}
	if (attivo === -1) {
		attivo = 0;
	}

	for (var i = 0; i < intestazioni.length; i++) {
		intestazioni[i].setAttribute('aria-selected', i === attivo ? 'true' : 'false');
		/* il fuoco resta dove si trova: si sposta solo la fermata di Tab */
		if (document.activeElement !== intestazioni[i]) {
			intestazioni[i].setAttribute('tabindex', i === attivo ? '0' : '-1');
		}
	}
};

RichFaces.findNestingTable = function(tablabel) {
	var parent = tablabel.parentNode;

	while(parent && parent.nodeName.toLowerCase() != 'table') {
		parent = parent.parentNode;
	}

	return parent;
}

RichFaces.overTab = function(tab) {
	if (RichFaces._shouldHoverTab(tab)) {
		tab.classList.add('rich-tbpnl-tb-sel');
	}
}
RichFaces.outTab = function(tab) {
	if (RichFaces._shouldHoverTab(tab)) {
		tab.classList.remove('rich-tbpnl-tb-sel');
	}
}

RichFaces._shouldHoverTab = function(tab) {
	return (tab.className.indexOf('rich-tab-active') < 0);
}

RichFaces.onTabChange = function(event, pane,tab) {
	var labelSuffix = "_lbl";
	var tabs = RichFaces.panelTabs[pane];
	var lastActive, newActive;
	if (tabs) {
		for( var i=0; i<tabs.length; i++){
			if (lastActive && newActive) break;
			var tabId = tabs[i].id;
			if (tabId == tab)
				newActive = tabs[i];
			if (RichFaces.isTabActive(tabId +labelSuffix))
				lastActive = tabs[i];
		}
	}
	if (lastActive && newActive) {

		if(event){
			event.leftTabName = lastActive.name;
			event.enteredTabName = newActive.name;
		}

		if (lastActive.ontableave && lastActive.ontableave != "") {
			var func = new Function("event",lastActive.ontableave);
			var result = func(event);
			if (typeof(result) == 'boolean' && !result) return false;
		}
		if (newActive.ontabenter && newActive.ontabenter != "") {
			var func = new Function("event",newActive.ontabenter);
			var result = func(event);
			if (typeof(result) == 'boolean' && !result) return false;
		}
		try{

		var tabPanel = RichFaces.tabPanel[pane];

		if (tabPanel.ontabchange && tabPanel.ontabchange != "") {
				var func = new Function("event",tabPanel.ontabchange);
				var result = func(event);
				if (typeof(result) == 'boolean' && !result) return false;
		}

      }catch(e){
         //todo - waiting for portal friendly code rewrite
      }

   }
	return true;
}
