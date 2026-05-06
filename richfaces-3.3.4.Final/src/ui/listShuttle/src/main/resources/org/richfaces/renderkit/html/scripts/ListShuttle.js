/*
 * Modificato da Link.it (https://link.it):
 *   - Class.create(parent) -> Object.create(parent.prototype) per le sotto-
 *     classi Source/Target,
 *     Class.create() -> costruttore plain,
 *     $() -> document.getElementById,
 *     elem.observe / elem.fire -> addEventListener / CustomEvent dispatch
 *         (helper _lsFire),
 *     Event.stopObserving -> removeEventListener,
 *     Event.KEY_TAB -> 9 (_lsKey.TAB),
 *     bindAsEventListener -> Function.prototype.bind.
 *
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if(!window.Richfaces) window.Richfaces = {};

function _RichfacesListShuttle() { this.initialize.apply(this, arguments); }
Richfaces.ListShuttle = _RichfacesListShuttle;

function _RichfacesListShuttleSource() { this.initialize.apply(this, arguments); }
_RichfacesListShuttleSource.prototype = Object.create(Richfaces.ListBase.prototype);
_RichfacesListShuttleSource.prototype.constructor = _RichfacesListShuttleSource;
Richfaces.ListShuttle.Source = _RichfacesListShuttleSource;

function _RichfacesListShuttleTarget() { this.initialize.apply(this, arguments); }
_RichfacesListShuttleTarget.prototype = Object.create(Richfaces.OrderingList.prototype);
_RichfacesListShuttleTarget.prototype.constructor = _RichfacesListShuttleTarget;
Richfaces.ListShuttle.Target = _RichfacesListShuttleTarget;

function _RichfacesListShuttleSourceSelectItem() { this.initialize.apply(this, arguments); }
_RichfacesListShuttleSourceSelectItem.prototype = Object.create(Richfaces.SelectItem.prototype);
_RichfacesListShuttleSourceSelectItem.prototype.constructor = _RichfacesListShuttleSourceSelectItem;
Richfaces.ListShuttle.Source.SelectItem = _RichfacesListShuttleSourceSelectItem;
Richfaces.ListShuttle.Source.SelectItem.prototype.CLASSES = {
	ROW : {
		ACTIVE   : "rich-shuttle-source-row-active",
		SELECTED : "rich-shuttle-source-row-selected",
		DISABLED : "rich-shuttle-source-row-disabled",
		NORMAL   : "rich-shuttle-source-row"
	},
	CELL : {
		ACTIVE   : "rich-shuttle-source-cell-active",
		SELECTED : "rich-shuttle-source-cell-selected",
		DISABLED : "rich-shuttle-source-cell-disabled",
		NORMAL   : "rich-shuttle-source-cell",
		BEGIN:	" rich-shuttle-source-cell-first",
		END:	" rich-shuttle-source-cell-last"
	}
}

function _RichfacesListShuttleTargetSelectItem() { this.initialize.apply(this, arguments); }
_RichfacesListShuttleTargetSelectItem.prototype = Object.create(Richfaces.SelectItem.prototype);
_RichfacesListShuttleTargetSelectItem.prototype.constructor = _RichfacesListShuttleTargetSelectItem;
Richfaces.ListShuttle.Target.SelectItem = _RichfacesListShuttleTargetSelectItem;
Richfaces.ListShuttle.Target.SelectItem.prototype.CLASSES = {
	ROW : {
		ACTIVE   : "rich-shuttle-target-row-active",
		SELECTED : "rich-shuttle-target-row-selected",
		DISABLED : "rich-shuttle-target-row-disabled",
		NORMAL   : "rich-shuttle-target-row"
	},
	CELL : {
		ACTIVE   : "rich-shuttle-target-cell-active",
		SELECTED : "rich-shuttle-target-cell-selected",
		DISABLED : "rich-shuttle-target-cell-disabled",
		NORMAL   : "rich-shuttle-target-cell",
		BEGIN:	" rich-shuttle-target-cell-first",
		END:	" rich-shuttle-target-cell-last"
	}
}

Richfaces.ListShuttle.prototype = {
	HANDLERS : {
		copy:      function (e) { this.copy(); return false; },
		copyAll:   function (e) { this.copyAll(); return false; },
		remove:    function (e) { this.remove(); return false; },
		removeAll: function (e) { this.removeAll(); return false; }
	},

	initialize: function(id, options) {
		options = options || {};
		this["rich:destructor"] = "destroy";

		var internalOptions = options.internalOptions || {};
		this.createLists(id, internalOptions);

		this.container = document.getElementById(id);
		this.container.component = this;
		this.events = options.events || {};

		this.isFocused = false;
		this.wasMouseDown = false;
		this.skipBlurEvent = false;

		this.targetLayoutManager = this.targetList.layoutManager;
		this.sourceLayoutManager = this.sourceList.layoutManager;

		//for focus\blur custom events
		this.container.addEventListener("focus", function (e) {this.focusOrBlurHandlerLS(e);}.bind(this));
		this.container.addEventListener("keypress", function (e) {this.focusOrBlurHandlerLS(e);}.bind(this));
		this.container.addEventListener("keydown", function (e) {this.focusOrBlurHandlerLS(e);}.bind(this));
		this.container.addEventListener("mousedown", function (e) {this.focusOrBlurHandlerLS(e);}.bind(this));
		this.container.addEventListener("click", function (e) {this.focusOrBlurHandlerLS(e);}.bind(this));
		this.container.addEventListener("blur", function (e) {this.focusOrBlurHandlerLS(e);}.bind(this));

		if (options.switchByClick) {
			this.targetList.shuttleTable.addEventListener("click", function(e) {this.moveItemByClick(window.event||e, this.targetList, this.sourceList)}.bind(this));
			this.sourceList.shuttleTable.addEventListener("click", function(e) {this.moveItemByClick(window.event||e, this.sourceList, this.targetList)}.bind(this));
			this.sourceList.shuttleTable.removeEventListener("click", this.sourceList.clckHandler);
			this.targetList.shuttleTable.removeEventListener("click", this.targetList.clckHandler);
		} else {
			if (options.switchByDblClick){
				this.targetList.shuttleTable.addEventListener("dblclick", function(e) {this.moveItemByClick(window.event||e, this.targetList, this.sourceList)}.bind(this));
				this.sourceList.shuttleTable.addEventListener("dblclick", function(e) {this.moveItemByClick(window.event||e, this.sourceList, this.targetList)}.bind(this));
			}
			this.sourceList._onclickHandler = this.sourceList.onclickHandler;
			this.sourceList.onclickHandler = function(e) { this.onclickHandler(e, this.sourceList); }.bind(this);
			this.targetList._onclickHandler = this.targetList.onclickHandler;
			this.targetList.onclickHandler = function(e) { this.onclickHandler(e, this.targetList); }.bind(this);
		}

		this.sourceList._onkeydownHandler = this.sourceList.onkeydownHandler;
		this.sourceList.onkeydownHandler = function(e) { this.onkeydownHandler(e, this.sourceList); }.bind(this);
		this.targetList._onkeydownHandler = this.targetList.onkeydownHandler;
		this.targetList.onkeydownHandler = function(e) { this.onkeydownHandler(e, this.targetList); }.bind(this);

		this.controlList = new Array();
		this.initControlList(id);

		for (var e in this.events) {
			if (e && this.events[e]) {
				this.container.addEventListener("rich:" + e.toString(), this.events[e]);
			}
		}
	},

	createLists: function(id, options) {
		this.sourceList = new Richfaces.ListShuttle.Source(id, Richfaces.ListShuttle.Source.SelectItem, options.classes);
		options.idFuffix = "tl";
		options.itemClass = Richfaces.ListShuttle.Target.SelectItem;
		this.targetList = new Richfaces.ListShuttle.Target(id, options);
	},

	destroy: function() {
		this.container.component = null;
		this.targetList.destroy();
		this.sourceList.destroy();
	},

	initControlList : function(containerId, ids) {
		var ids = ['copy', 'copyAll', 'remove', 'removeAll'];
		for (var i = 0; i < ids.length; i++) {
			var id = ids[i];
			var node = document.getElementById(containerId + id);
			var disNode = document.getElementById(containerId + "dis" + id);
			if (node && disNode) {
				node.addEventListener('click', this.HANDLERS[id].bind(this));
				this.controlList[i] = new Richfaces.Control(node, disNode, false, false, id);
			}
		}
	},

	controlListManager : function() {
		//this.controlsProcessing();
		this.controlsProcessing(["copy", "copyAll", "removeAll" ,"remove"], "enable");
		if (this.sourceList.shuttleItems.length < 1)
			this.controlsProcessing(["copy", "copyAll"], "disable");
		if (this.sourceList.selectedItems.length < 1)
			this.controlsProcessing(["copy"] , "disable");
		if (this.targetList.shuttleItems.length < 1)
			this.controlsProcessing(["removeAll" ,"remove"], "disable");
		if (this.targetList.selectedItems.length < 1) {
			this.controlsProcessing(["remove"], "disable");
		}
	},

	onclickHandler : function(event, component) {
		component._onclickHandler(event);
		this.controlListManager();
	},

	onkeydownHandler : function(event, component) {
		component._onkeydownHandler(event);
		this.controlListManager();
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

	moveItems : function(sourceComponent, targetComponent, items) {
		if (Richfaces.invokeEvent(this.events.onlistchange, this.container, "rich:onlistchange", {sourceItems: sourceComponent.shuttleItems, targetItems: targetComponent.shuttleItems})) {
			if (items.length > 0) {
				var length = items.length;
				for (var i = 0; items.length > 0;) {
					var item = items[i];
					this.moveItem(sourceComponent, targetComponent, item);
				}
				this.controlListManager();
				if (this.targetList.controlListManager) {
					this.targetList.controlListManager();
				}

				this.targetLayoutManager.widthSynchronization();
				this.sourceLayoutManager.widthSynchronization();

				_lsFire(this.container, "rich:onlistchanged", {sourceItems: sourceComponent.shuttleItems, targetItems: targetComponent.shuttleItems});
			}
		}
	},

	moveItem : function(sourceComponent, targetComponent, item) {
		if (!item) {
			return;
		}
		if (!(item instanceof Richfaces.SelectItem)) {
			item = sourceComponent.getSelectItemByNode(item);
		}
		if (Richfaces.browser.isFF2 && (targetComponent.shuttleTbody.rows.length == 0)) {
			this.tableUpdate(targetComponent);
		}

		this.addItem(targetComponent, item);
		this.removeItem(sourceComponent, item);
	},

	removeItem : function(component, item) {
		var items = component.shuttleItems;
		component.selectedItems.remove(item._node);
		items.remove(item);
		if (item == component.activeItem) {
			component.activeItem == null;
		}
	},

	addItem : function(component, item) {
		item.doNormal(Richfaces.getExternalClass(item.rowIndex), component.columnClasses);

		component.shuttleTbody.insertBefore(item._node, null);
		component.shuttleItems.push(item);
	},

	tableUpdate : function(component) {
		var table = component.shuttleTable;
		var tbody = table.tBodies[0];
		var newTbody = tbody.cloneNode(false);
		table.removeChild(tbody);
		table.appendChild(newTbody);
		component.shuttleTbody = table.tBodies[0];
	},

	moveItemByClick : function(event, sourceComponent, targetComponent, layoutManager) {
		if (Richfaces.invokeEvent(this.events.onlistchange, this.container, "rich:onlistchange", {sourceItems: sourceComponent.shuttleItems, targetItems: targetComponent.shuttleItems})) {
			var item = this.sourceList.getEventTargetRow(event);
			this.moveItem(sourceComponent, targetComponent, item);

			this.controlListManager();
			if (this.targetList.controlListManager) {
				this.targetList.controlListManager();
			}

			this.targetLayoutManager.widthSynchronization();
			this.sourceLayoutManager.widthSynchronization();

			_lsFire(this.container, "rich:onlistchanged", {sourceItems: sourceComponent.shuttleItems, targetItems: targetComponent.shuttleItems});
		}
	},

	copyAll : function() {
		_lsFire(this.container, "rich:oncopyallclick", {sourceItems: this.sourceList.shuttleItems, targetItems: this.targetList.shuttleItems, selection: this.sourceList.getSelection()});
		this.moveItems(this.sourceList, this.targetList, this.sourceList.shuttleItems);
	},

	copy : function() {
		_lsFire(this.container, "rich:oncopyclick", {sourceItems: this.sourceList.shuttleItems, targetItems: this.targetList.shuttleItems, selection: this.sourceList.getSelection()});
		this.moveItems(this.sourceList, this.targetList, this.sourceList.selectedItems);
	},

	removeAll : function() {
		_lsFire(this.container, "rich:onremoveallclick", {sourceItems: this.sourceList.shuttleItems, targetItems: this.targetList.shuttleItems, selection: this.targetList.getSelection()});
		this.moveItems(this.targetList, this.sourceList, this.targetList.shuttleItems);
	},

	remove : function() {
		_lsFire(this.container, "rich:onremoveclick", {sourceItems: this.sourceList.shuttleItems, targetItems: this.targetList.shuttleItems, selection: this.targetList.getSelection()});
		this.moveItems(this.targetList, this.sourceList, this.targetList.selectedItems);
	},

	up : function() {
		this.targetList.up();
	},

	down : function() {
		this.targetList.down();
	},

	top : function() {
		this.targetList.top();
	},

	bottom : function() {
		this.targetList.bottom();
	},

	focusOrBlurHandlerLS : function(e) {
		var componentID = e.target.id;
		if (e.type == "keydown") {
			var code = e.which;
			this.skipBlurEvent = false;
			this.wasKeyDown = true;
			if (_lsKey.TAB == code) {
				if (e.shiftKey) {
					if ((componentID == this.sourceList.focusKeeper.id) && this.isFocused) {
						//blur:shift+tab keys were pressed
						this.fireOnblurEvent();
					} else {
						this.skipBlurEvent = true;
					}
				} else {
					if ((componentID == this.targetList.focusKeeper.id) && this.isFocused) {
						//blur:tab key was pressed
						this.fireOnblurEvent();

					} else {
						this.skipBlurEvent = true;
					}
				}
			}
		} else if (e.type == "mousedown") {
			this.skipBlurEvent = false;
			this.wasMouseDown = true;
			if (!this.isFocused) {
				this.fireOnfocusEvent();
			}
		} else if (e.type == "click") {
			this.wasMouseDown = false;
		} else if (e.type == "keypress") {
			this.wasKeyDown = false;
		} else if (e.type == "focus") {
			if (componentID == this.sourceList.focusKeeper.id && !this.wasMouseDown && !this.isFocused) {
				//focus:tab key was pressed
				this.fireOnfocusEvent();
			} else if (componentID == this.targetList.focusKeeper.id && !this.wasMouseDown && !this.isFocused) {
				//focus:shift+tab keys were pressed
				this.fireOnfocusEvent();
			}
		} else if (e.type == "blur") {
			//onblur event
			if (!this.wasMouseDown && !this.wasKeyDown && this.isFocused && !this.skipBlurEvent) {
				//blur:click component outside
				this.fireOnblurEvent();
			}
		}
	},

	fireOnfocusEvent : function() {
		//LOG.warn("fireOnfocusEvent|");
		this.isFocused = true;
		_lsFire(this.container, "rich:onfocus", {});
	},

	fireOnblurEvent : function() {
		//LOG.warn("fireOnblurEvent|");
		this.isFocused = false;
		_lsFire(this.container, "rich:onblur", {});
	}
};
