/*
 * Modificato da Link.it (https://link.it):
 *   - Class.create(parent) / Class.create(parent, {...}) -> Object.create
 *     (parent.prototype) + Object.assign,
 *     $super(...) -> parent.prototype.method.call(this, ...),
 *     $() -> document.getElementById,
 *     elem.observe / elem.fire -> addEventListener / CustomEvent dispatch
 *         (helper _lsFire),
 *     bindAsEventListener -> Function.prototype.bind,
 *     Event.stop -> preventDefault + stopPropagation (_lsStopEvent).
 *
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if(!window.Richfaces) window.Richfaces = {};

function _RichfacesOrderingListSelectItem() { this.initialize.apply(this, arguments); }
_RichfacesOrderingListSelectItem.prototype = Object.create(Richfaces.SelectItem.prototype);
_RichfacesOrderingListSelectItem.prototype.constructor = _RichfacesOrderingListSelectItem;
Richfaces.OrderingListSelectItem = _RichfacesOrderingListSelectItem;
Richfaces.OrderingListSelectItem.prototype.CLASSES = {
	ROW : {
		ACTIVE   : "rich-ordering-list-row-active",
		SELECTED : "rich-ordering-list-row-selected",
		DISABLED : "rich-ordering-list-row-disabled",
		NORMAL   : "rich-ordering-list-row"
	},
	CELL : {
		ACTIVE   : "rich-ordering-list-cell-active",
		SELECTED : "rich-ordering-list-cell-selected",
		DISABLED : "rich-ordering-list-cell-disabled",
		NORMAL   : "rich-ordering-list-cell",
		BEGIN:	" rich-ordering-list-cell-first",
		END:	" rich-ordering-list-cell-last"
	}
};
// NB: era ',' nell'originale Prototype perche' la riga successiva era
// un'espressione (Class.create(...)), e l'operatore virgola la concatenava
// in un'unica statement. Ora che la riga successiva e' una function
// declaration, il ',' la trasformerebbe in function expression e
// _RichfacesOrderingList non sarebbe definito nello scope globale.

function _RichfacesOrderingList() { this.initialize.apply(this, arguments); }
_RichfacesOrderingList.prototype = Object.create(Richfaces.ListBase.prototype);
_RichfacesOrderingList.prototype.constructor = _RichfacesOrderingList;
Richfaces.OrderingList = _RichfacesOrderingList;

Object.assign(Richfaces.OrderingList.prototype, {
	initialize: function(id, options) {
		options = options || {};
		var containerId = id + (options.idFuffix || "");
		Richfaces.ListBase.prototype.initialize.call(this, containerId, options.itemClass || Richfaces.OrderingListSelectItem, options.classes);
		this.container = document.getElementById(id);
		this.container.component = this;

		this.events = options.events || {};
		this.controlList = new Array();
		this.initControlList(id);

		for (var e in this.events) {
			if (e && this.events[e]) {
				this.container.addEventListener("rich:" + e.toString(), this.events[e]);
			}
		}
	},

	destroy: function() {
		Richfaces.ListBase.prototype.destroy.call(this);

		this.container.component = null;
	},

	initControlList : function(containerId) {
		var ids = ['up', 'down', 'last', 'first'];
		for (var i = 0; i < ids.length; i++) {
			var id = ids[i];
			var node = document.getElementById(containerId + id);
			var disNode = document.getElementById(containerId + "dis" + id);
			if (node && disNode) {
				node.addEventListener('click', Richfaces.OrderingList.HANDLERS[id].bind(this));
				this.controlList[i] = new Richfaces.Control(node, disNode, false, false, id);
			}
		}
	},

	controlListManager : function() {
		this.selectedItems.sort(this.compareByRowIndex);
		var control;
		//FIXME
		this.controlsProcessing(["first", "last", "down", "up"], "enable");
		if ((this.shuttleItems.length == 0) || (this.selectedItems.length == 0)) {
			this.controlsProcessing(["first", "last", "down", "up"], "disable");
		} else {
			if (this.selectedItems[0].rowIndex == 0)
				this.controlsProcessing(["first", "up"], "disable");
			if (this.selectedItems[this.selectedItems.length - 1].rowIndex == (this.shuttleItems.length - 1))
				this.controlsProcessing(["down", "last"], "disable");
		}
	},

	controlsProcessing : function(disabledControls , action) {
		for (var i = 0; i < this.controlList.length; i++) {
			control = this.controlList[i];
			if (control != null) {
				if (disabledControls != null && disabledControls.indexOf(control.action) != -1) {
					if (action == "disable") {
						control.doDisable();
					} else {
						control.doEnable();
					}
				}
			}
		}
	},

	onclickHandler : function(event) {
		Richfaces.ListBase.prototype.onclickHandler.call(this, event);
		this.controlListManager();
	},

	moveActiveItem : function(action, event) {
		Richfaces.ListBase.prototype.moveActiveItem.call(this, action, event);
		this.controlListManager();
	},

	moveSelectedItems : function(action, event) {
		if (this.selectedItems.length > 0) {

			if (Richfaces.invokeEvent(this.events.onorderchange, this.container, "rich:onorderchange", {items: this.shuttleItems})) {
				event = window.event||event;
				var rows = this.shuttleTbody.rows;
				var item;

				this.selectedItems.sort(this.compareByRowIndex);

				if ((action == 'up') && this.getExtremeItem("first").previousSibling) {
					for (var i = 0; i < this.selectedItems.length; i++) {
						item = this.selectedItems[i];
						item.parentNode.insertBefore(item, item.previousSibling);
					}
				} else if ((action == 'down') && this.getExtremeItem("last").nextSibling) {
					for (var i = this.selectedItems.length - 1; i > -1; i--) {
						item = this.selectedItems[i];
						item.parentNode.insertBefore(item.nextSibling, item);
					}
				} else if (action == 'first') {
					var incr = this.selectedItems[0].rowIndex;
					for (var i = 0; i < this.selectedItems.length; i++) {
						item = this.selectedItems[i];
						item.parentNode.insertBefore(item, rows[item.rowIndex - incr]);
					}
				} else if (action == 'last') {
					var length = this.shuttleItems.length;
					var incr = length - this.selectedItems[this.selectedItems.length - 1].rowIndex;
					for (var i = this.selectedItems.length - 1; i > -1; i--) {
						item = this.selectedItems[i];
						if (item.rowIndex + incr > length - 1) {
							item.parentNode.insertBefore(item, null);
						} else {
							item.parentNode.insertBefore(item, rows[item.rowIndex + incr]);
						}
					}
				}

				this.shuttleItems = new Array();
				for (var i = 0; i < rows.length; i++) {
					this.shuttleItems.push(rows[i].item);
				}
				if (action != null)
					this.autoScrolling(action, event);

				_lsFire(this.container, "rich:onorderchanged", {items: this.shuttleItems});
				this.controlListManager();
			}
		}
	},

	onkeydownHandler : function(event) {
		var action = null;
		switch (event.keyCode) {
			case 34 : action = 'last';
					  this.moveSelectedItems(action ,event);
					  _lsStopEvent(event);
			 		  break; //page down
			case 33 : action = 'first';
					  this.moveSelectedItems(action, event);
					  _lsStopEvent(event);
					  break; //page up
			case 38 : //up arrow
					  action = 'up';
					  if (event.ctrlKey) {
					  	this.moveSelectedItems(action, event);
					  } else {
					  	this.moveActiveItem(action, event);
					  }
					  _lsStopEvent(event);
					  break;
			case 40 : //down arrow
					  action = 'down';
					  if (event.ctrlKey) {
					  	 this.moveSelectedItems(action ,event);
					  } else {
					  	this.moveActiveItem(action, event);
					  }
					  _lsStopEvent(event);
					  break;
			case 65 : // Ctrl + A
					  if (event.ctrlKey) {
						this.selectAll();
					  }
					  this.activeItem.item.doActive(this.getExtRowClass(this.activeItem.rowIndex), this.columnClasses);
					  this.controlListManager();
					  _lsStopEvent(event);
					  break;
		}
	},

	top : function(e) {
		_lsFire(this.container, "rich:ontopclick", {items: this.shuttleItems, selection: this.getSelection()});
		this.moveSelectedItems("first", e);
	},

	bottom : function(e) {
		_lsFire(this.container, "rich:onbottomclick", {items: this.shuttleItems, selection: this.getSelection()});
		this.moveSelectedItems("last", e);
	},

	up : function(e) {
		_lsFire(this.container, "rich:onupclick", {items: this.shuttleItems, selection: this.getSelection()});
		this.moveSelectedItems("up", e);
	},

	down : function(e) {
		_lsFire(this.container, "rich:ondownclick", {items: this.shuttleItems, selection: this.getSelection()});
		this.moveSelectedItems("down", e);
	}

});

Richfaces.OrderingList.ACTIVITY_MARKER = "a";
Richfaces.OrderingList.SELECTION_MARKER = "s";
Richfaces.OrderingList.ITEM_SEPARATOR = ",";

Richfaces.OrderingList.HANDLERS = {
	first: function (e) { this.top(e); return false; },
	last: function (e) { this.bottom(e); return false; },
	up: function (e) { this.up(e); return false; },
	down: function (e) { this.down(e); return false; }
};
