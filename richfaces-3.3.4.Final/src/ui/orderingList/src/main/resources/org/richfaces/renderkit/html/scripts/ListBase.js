/*
 * Modificato da Link.it (https://link.it):
 *   - Class.create() -> costruttore plain,
 *     Object.extend -> Object.assign,
 *     $() -> document.getElementById,
 *     elem.observe / Event.stop / KEY_* -> addEventListener / preventDefault+
 *         stopPropagation / costanti numeriche (_lsKey),
 *     bindAsEventListener -> Function.prototype.bind.
 *
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if(!window.Richfaces) window.Richfaces = {};
Richfaces.disableSelectionText = function(e) {
	e = window.event||e;
	if (e.srcElement) {
		if (e.srcElement.tagName) {
			var tagName = e.srcElement.tagName.toUpperCase();

			if (tagName != "INPUT" && tagName != "TEXTAREA" /* any items more? */) {
				return false;
			}
		}
	}
};


function _RichfacesListBase() { this.initialize.apply(this, arguments); }
Richfaces.ListBase = _RichfacesListBase;

Richfaces.ListBase.compare = function(obj1, obj2) {
	return ((obj1 == obj2) ? 0 : ((obj1 < obj2) ? -1 : 1));
}

Richfaces.ListBase.ORDERING_LIST_CLASSES = {
	normal : "rich-ordering-list-items",
	disabled : "rich-ordering-list-disabled",
	active :  "rich-ordering-list-active"
}

Richfaces.ListBase.ASC = "acs";
Richfaces.ListBase.DESC = "desc";

Richfaces.ListBase.CONTROL_SET = ["A", "INPUT", "TEXTAREA", "SELECT", "OPTION", "BUTTON"];

Richfaces.ListBase.prototype = {
	initialize : function(containerId, controlClass, classes) {
		this["rich:destructor"] = "destroy";
		this.selectedItems = new Array();

		var contentTableId = containerId + "internal_tab";
		this.shuttleTable = document.getElementById(contentTableId);
		this.shuttleTable.onselectstart = Richfaces.disableSelectionText;
		/*
		 * Contratto di accessibilita' della lista (WCAG 1.3.1, 2.1.1, 2.4.7, 4.1.2).
		 *
		 * In origine i tasti della lista li riceve il 'focusKeeper', un <input type="button">
		 * tenuto fuori schermo: le frecce su e giu' scorrono e selezionano le voci (vedi
		 * 'onkeydownHandler'), Ctrl+A seleziona tutto. Un pulsante pero' non puo' fare da
		 * lista: chi usa uno screen reader sentiva un pulsante e nessuna voce, quindi non
		 * sapeva quale elemento stesse selezionando. In piu' il contenitore scorrevole delle
		 * voci ('contentBox') e' di suo raggiungibile con Tab sui browser attuali, e
		 * diventava una seconda sosta che non faceva nulla.
		 *
		 * Il contenitore delle voci diventa la lista: ruolo 'listbox' a selezione multipla,
		 * raggiungibile con Tab, e riceve i tasti al posto del 'focusKeeper', che esce
		 * dall'ordine di tabulazione e dall'albero di accessibilita'. Le righe diventano
		 * opzioni con 'aria-selected', e la voce attiva viene indicata con
		 * 'aria-activedescendant'. Il fuoco resta visibile marcando il contenitore.
		 */
		var tastieraOriginale = document.getElementById(containerId + "focusKeeper");
		var contenuto = document.getElementById(containerId + "contentBox");
		if (contenuto) {
			this.focusKeeper = contenuto;
			if (tastieraOriginale) {
				tastieraOriginale.setAttribute('tabindex', '-1');
				tastieraOriginale.setAttribute('aria-hidden', 'true');
			}
		} else {
			this.focusKeeper = tastieraOriginale;
		}
		this.focusKeeper.focused = false;
		//this.setFocus();
		this.focusKeeper.addEventListener("keydown", (function(e) {this.onkeydownHandler(window.event || e)}).bind(this));
		this.focusKeeper.addEventListener("blur", function (e) {this.focusListener(e);}.bind(this));
		this.focusKeeper.addEventListener("focus", function (e) {this.onfocusHandler(e);}.bind(this));

		this.shuttleTbody = this.shuttleTable.tBodies[0];

		this.activeItem = null;
		this.pseudoActiveItem = null; //it services for items selection by Shift+click
		this.items = null;

		//FIX
		Object.assign(this, classes);

		this.controlClass = controlClass;
		this.retrieveShuttleItems(containerId, controlClass);
		try {
			this.a11yPreparaLista(containerId);
		} catch (e) { /* la semantica accessibile non deve impedire il funzionamento */ }
		this.counter;
		this.shuttle = null;
		this.sortOrder = Richfaces.ListBase.ASC;
		this.clckHandler = function(e) {this.onclickHandler(window.event || e)}.bind(this);
		this.shuttleTable.addEventListener("click", this.clckHandler);

		this.layoutManager = new LayoutManager(containerId + "internal_header_tab", contentTableId);
//---   http://jira.jboss.com/jira/browse/RF-3830 FF3 & Safari only!
		this.tableElement = document.getElementById(contentTableId);
		var rows = this.tableElement.tBodies[0].rows;
		if (rows && rows[0]) {
			this.firstTrElement = rows[0];
			if (this.firstTrElement.addEventListener && (Richfaces.browser.isFF3 || Richfaces.browser.isSafari)) {
				this.imagesOnLoad = this.imageLoadListener.bind(this);
				this.firstTrElement.addEventListener('load',this.imagesOnLoad, true);
		  	}
		}
//---
		var synch = function() {this.layoutManager.widthSynchronization()}.bind(this);
		RichShuttleUtils.execOnLoad(
			synch, RichShuttleUtils.Condition.ElementPresent(this.shuttleTable.parentNode), 100
		);
	},

	imageLoadListener: function (evt){
		this.layoutManager.widthSynchronization();
		if (this.firstTrElement.removeEventListener && (Richfaces.browser.isFF3 || Richfaces.browser.isSafari)) {
			this.firstTrElement.removeEventListener('load',this.imagesOnLoad, true);
		}
	},

	destroy: function() {
		this.shuttleTable.onselectstart = null;
		var items = this.shuttleItems;
		for (var i = 0; i < items.length; i++) {
			items[i].destroy();
		}

	},

	setActiveItem : function(newActiveItem) {
		this.pseudoActiveItem = newActiveItem;
		this.activeItem = newActiveItem;
		this.a11yAggiornaVoceAttiva();
	},

	/*
	 * Semantica della lista: il contenitore e' la 'listbox', le righe le sue opzioni. La
	 * tabella che le impagina e' solo disposizione, e il ruolo 'none' evita che venga
	 * annunciata come tabella dentro la lista.
	 */
	a11yPreparaLista : function(containerId) {
		var lista = this.focusKeeper;
		if (!lista || lista.tagName.toUpperCase() == 'INPUT') {
			return;   // senza contenitore resta il comportamento originale
		}
		lista.setAttribute('role', 'listbox');
		lista.setAttribute('aria-multiselectable', 'true');
		lista.setAttribute('tabindex', '0');
		if (!lista.getAttribute('aria-label') && !lista.getAttribute('aria-labelledby')) {
			var nome = this.a11yTestoIntestazione(containerId);
			lista.setAttribute('aria-label', nome || 'Elenco');
		}
		this.shuttleTable.setAttribute('role', 'none');
		this.shuttleTbody.setAttribute('role', 'none');
		this.a11yPreparaVoci();

		lista.addEventListener("focus", function() {
			lista.classList.add("rich-shuttle-list-focus");
		}, false);
		lista.addEventListener("blur", function() {
			lista.classList.remove("rich-shuttle-list-focus");
		}, false);
	},

	/* Le righe arrivano anche dall'altra lista (spostamenti del listShuttle): la marcatura
	   viene riapplicata a tutte, ed e' idempotente. */
	a11yPreparaVoci : function() {
		var rows = this.shuttleTbody ? this.shuttleTbody.rows : [];
		for (var i = 0; i < rows.length; i++) {
			var row = rows[i];
			row.setAttribute('role', 'option');
			row.setAttribute('aria-selected', (row.item && row.item.isSelected()) ? 'true' : 'false');
			for (var c = 0; c < row.cells.length; c++) {
				row.cells[c].setAttribute('role', 'none');
			}
		}
		this.a11yAggiornaVoceAttiva();
	},

	a11yAggiornaVoceAttiva : function() {
		var lista = this.focusKeeper;
		if (!lista || lista.getAttribute('role') != 'listbox') {
			return;
		}
		var attiva = this.activeItem;
		if (attiva && attiva.id && attiva.parentNode == this.shuttleTbody) {
			lista.setAttribute('aria-activedescendant', attiva.id);
		} else {
			lista.removeAttribute('aria-activedescendant');
		}
	},

	/* Il nome della lista viene dalle intestazioni di colonna, quando ci sono. Non dal
	   contenitore 'headerBox', che racchiude anche i blocchi <style> e tutte le voci: il
	   nome risultante conteneva il codice CSS seguito dall'intero elenco. */
	a11yTestoIntestazione : function(containerId) {
		var intestazione = document.getElementById(containerId + "internal_header_tab");
		if (!intestazione) {
			return '';
		}
		var copia = intestazione.cloneNode(true);
		var esclusi = copia.querySelectorAll('style, script');
		for (var i = 0; i < esclusi.length; i++) {
			esclusi[i].parentNode.removeChild(esclusi[i]);
		}
		return String(copia.textContent || '').replace(/\s+/g, ' ').trim();
	},

	/* Nome esplicito, usato dai componenti che conoscono la propria didascalia: prevale sul
	   nome predefinito ma non su quello dato dalle intestazioni di colonna. */
	a11yImpostaNome : function(nome, sovrascrivi) {
		var lista = this.focusKeeper;
		if (!lista || lista.getAttribute('role') != 'listbox' || !nome) {
			return;
		}
		if (sovrascrivi || lista.getAttribute('aria-label') == 'Elenco') {
			lista.setAttribute('aria-label', nome);
		}
	},

	retrieveShuttleItems : function(containerId, controlClass) {
		var rows = this.shuttleTbody.rows;
		this.shuttleItems = new Array();
		var id;

		for (var i = 0; i < rows.length; i++) {
			var row = rows[i];
			id = row.id.split(containerId + ":")[1];
			var item = new controlClass(null, (id || i), row);
			if (item.isSelected()) {
				this.selectedItems.push(row);
			}
			if (item.isActive()) {
				this.setActiveItem(row);
			}
			this.shuttleItems[i] = item;
		}
	},

	getExtremeItem : function(position) { //FIXME
		var extremeItem = this.selectedItems[0];
		var currentItem;

		for (var i = 1; i < this.selectedItems.length; i++) {
			currentItem = this.selectedItems[i];
			if (position == "first") {
				if (currentItem.rowIndex < extremeItem.rowIndex) {
					extremeItem = currentItem;
				}
			} else {
				if (currentItem.rowIndex > extremeItem.rowIndex) {
					extremeItem = currentItem;
				}
			}
		}
		return extremeItem;
	},

	getEventTargetRow : function(event) {
		var activeElem;
		if (event.target) {
			//activeElem = event.rangeParent.parentNode;
			activeElem = event.target;
		} else {
			activeElem = event.srcElement;
		}

		if (activeElem == null) {
			return;
		}

		if (activeElem.tagName && Richfaces.ListBase.CONTROL_SET.indexOf(activeElem.tagName.toUpperCase()) != -1) {
			return;
		}

		while (activeElem.tagName.toLowerCase() != "tr") {
			activeElem = activeElem.parentNode;
			if (!activeElem.tagName) {
				return; //for IE
			}
		}
		return activeElem;
	},

	onfocusHandler: function (event) {
		if (!this.activeItem && this.shuttleItems.length != 0) {
			this.setActiveItem(this.shuttleItems[0]._node);
		}

		if (this.activeItem) {
			this.activeItem.item.doActive(this.getExtRowClass(this.activeItem.rowIndex), this.columnClasses);
		}
	},

	onclickHandler : function(event) {
		if (event.srcElement && (event.srcElement.tagName.toLowerCase() == "tbody")) {
			return;
		}
		var activeElem = this.getEventTargetRow(event);
		if (activeElem != null) {

			if (event.ctrlKey) {
			 	this.addSelectedItem(activeElem);
			 	this.setActiveItem(activeElem);
			} else if (event.shiftKey) {
				if (!this.pseudoActiveItem) {
					this.selectionItem(activeElem);
					this.setActiveItem(activeElem);
				} else {
					this.selectItemGroup(activeElem);
					this.activeItem = activeElem; //given event works with pseudoActiveItem
				}
			} else {
				this.selectionItem(activeElem);
				this.setActiveItem(activeElem);
			}


			this.setFocus();
		}
	},

	onkeydownHandler : function(event) {
		var action = null;
		switch (event.keyCode) {
			case 38 : //up arrow
					  action = 'up';
					  this.moveActiveItem(action, event);
					  _lsStopEvent(event);
					  break;
			case 40 : //down arrow
					  action = 'down';
					  this.moveActiveItem(action, event);
					  _lsStopEvent(event);
					  break;
			case 65 : // Ctrl + A
					  if (event.ctrlKey) {
						this.selectAll();
					  }
					  this.activeItem.item.doActive(this.getExtRowClass(this.activeItem.rowIndex), this.columnClasses);
					  _lsStopEvent(event);
					  break;
		}
	},

	moveActiveItem : function(action, event) {
		var item = this.activeItem;
		var rows = this.shuttleTbody.rows;
		if ((action == 'up') && (item.rowIndex > 0)) {
			this.changeActiveItems(rows[item.rowIndex - 1], item);
		} else if ((action == 'down') && (item.rowIndex < this.shuttleItems.length - 1)) {
			this.changeActiveItems(rows[item.rowIndex + 1], item);
		}

		this.autoScrolling(action, event);

	},

	changeActiveItems : function(newItem, item) {
		item.item.doNormal();
		this.resetMarked();

		newItem.item.doSelect(this.getExtRowClass(newItem.rowIndex), this.columnClasses);
		newItem.item.doActive(this.getExtRowClass(newItem.rowIndex), this.columnClasses);
		this.setActiveItem(newItem);
		this.selectedItems.push(newItem);
	},

	selectAll : function() {
		this.resetMarked();
		var startIndex = 0;
		var endIndex = this.shuttleItems.length - 1;
		this.selectItemRange(startIndex, endIndex);
	},

	/**
	 * Click handler
	 */
	selectionItem : function(activeItem) {
		var markedShuttleItem = activeItem;

		this.resetMarked();
		if (activeItem.item.isSelected()) {
			activeItem.item.doNormal(this.getExtRowClass(activeItem.rowIndex), this.columnClasses);
		} else {
			activeItem.item.doSelect(this.getExtRowClass(activeItem.rowIndex), this.columnClasses);
			this.selectedItems[0] = markedShuttleItem; //TODO: delete
		}
	},

	/**
	 * CTRL+Click handler
	 */
	addSelectedItem : function(activeItem) {
		var markedShuttleItem = activeItem;

		if (activeItem.item.isSelected()) {
			this.selectedItems.remove(markedShuttleItem); //TODO :delete
			activeItem.item.doNormal(this.getExtRowClass(activeItem.rowIndex), this.columnClasses);
		} else {
			activeItem.item.doSelect(this.getExtRowClass(activeItem.rowIndex), this.columnClasses);
			this.selectedItems.push(markedShuttleItem); //TODO :delete
		}

		if ((this.activeItem != null) && (this.activeItem.rowIndex != activeItem.rowIndex)) {
			//reset activity of an element
			if (this.activeItem.item.isSelected()) {
				this.activeItem.item.doSelect(this.getExtRowClass(this.activeItem.rowIndex), this.columnClasses);
			} else {
				this.activeItem.item.doNormal(this.getExtRowClass(this.activeItem.rowIndex), this.columnClasses);
			}
		}
	},

	/**
	 * Shift+Click handler
	 */
	selectItemGroup : function(currentItem) {
		//FIXME
		var activeItemIndex = this.pseudoActiveItem.rowIndex;
		var startIndex;
		var endIndex;

		if (currentItem.rowIndex > activeItemIndex) {
			startIndex = activeItemIndex;
			endIndex = currentItem.rowIndex;
		} else {
			startIndex = currentItem.rowIndex;
			endIndex = activeItemIndex;
		}

		this.resetMarked();

		this.selectItemRange(startIndex, endIndex);
	},

	selectItemRange : function(startIndex, endIndex) {
		var rows = this.shuttleTbody.rows;
		for (var i = startIndex; i <= endIndex; i++) {
			rows[i].item.doSelect(this.getExtRowClass(rows[i].rowIndex), this.columnClasses);
			this.selectedItems.push(rows[i]);
		}
	},

	resetMarked : function() {
		var rows = this.selectedItems;
		var length = rows.length;
		for (var i = 0; i < length; i++) {
			var shuttleItem = rows[i];
			shuttleItem.item.doNormal(this.getExtRowClass(shuttleItem.rowIndex), this.columnClasses);
		}
		this.selectedItems.length = 0;

		//need to reset active item
	},

	getSelectItemByNode : function(selectItemNode) {
		for (var i = 0; i < this.shuttleItems.length; i++) {
			var item = this.shuttleItems[i];
			if (selectItemNode.rowIndex == item._node.rowIndex) {
				return item;
			}
		}
		return null;
	},

	autoScrolling : function(action, event) {
		this.selectedItems.sort(this.compareByRowIndex);
		var increment;
		var scrollTop = this.shuttleTable.parentNode.scrollTop;

		var shuttleTop = LayoutManager.getElemXY(this.shuttleTable.parentNode).top;

		if (action == 'up' || action == 'first') {
			var targetItemTop = LayoutManager.getElemXY(this.selectedItems[0]).top;
			increment = (targetItemTop - scrollTop) - shuttleTop;
			if (increment < 0) {
				this.shuttleTable.parentNode.scrollTop += increment;
			}
		} else if (action == 'down' || action == 'last') {
			var item = this.selectedItems[this.selectedItems.length - 1];
			var targetItemBottom = LayoutManager.getElemXY(this.selectedItems[this.selectedItems.length - 1]).top + item.offsetHeight;
			var increment = (targetItemBottom - scrollTop) - (shuttleTop + this.shuttleTable.parentNode.clientHeight);
			if (increment > 0) {
				this.shuttleTable.parentNode.scrollTop += increment;
			}
		}
		if (event) _lsStopEvent(event);
	},

	setFocus : function() {
		this.focusKeeper.focus();
		this.focusKeeper.focused = true;
	},

	focusListener : function(e) {
		e = e || window.event;
		this.focusKeeper.focused = false;

		if (this.activeItem) {
			if (this.activeItem.item.isSelected()) {
				this.activeItem.item.doSelect(this.getExtRowClass(this.activeItem.rowIndex), this.columnClasses);
			} else {
				this.activeItem.item.doNormal(this.getExtRowClass(this.activeItem.rowIndex), this.columnClasses);
			}
		}
	},

	compareByLabel : function(obj1, obj2) {
		obj1 = obj1._label;
		obj2 = obj2._label;
		return Richfaces.ListBase.compare(obj1, obj2);
	},

	compareByRowIndex : function(obj1, obj2) {
		obj1 = obj1.rowIndex;
		obj2 = obj2.rowIndex;
		return Richfaces.ListBase.compare(obj1, obj2);
	},

	isListActive : function() {
		if ((this.activeItem != null || this.selectedItems.length != 0) && this.focusKeeper.focused) {
			return true;
		}
		return false;
	},

	getExtRowClass : function(index) {
		return Richfaces.getExternalClass(this.rowClasses, index);
	},

	getSelection : function() {
		var result = [];
		for (var i = 0; i < this.selectedItems.length; i++) {
			result[i] = this.selectedItems[i].item;
		}
		return result;
	},

	getItems : function() {
		return this.shuttleTbody.rows;
	}
}
