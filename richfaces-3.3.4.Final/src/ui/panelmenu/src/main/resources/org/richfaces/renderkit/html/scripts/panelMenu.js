/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM:
 *     Class.create()                      -> costruttore + .prototype plain
 *     $(id)                               -> document.getElementById(id)
 *     Element.extend(el)                  -> no-op (rimosso, gli element nativi
 *                                            espongono gia' classList/style)
 *     Event.observe(el, evt, fn, cap)     -> el.addEventListener(evt, fn, cap)
 *     bindAsEventListener(this)           -> .bind(this)
 *     Event.findElement(e, "form")        -> (e.target||e.srcElement).closest("form")
 *     Element.show(el) / Element.hide(el) -> el.style.display = '' / 'none'
 *     Element.setStyle(el, styles)        -> setElementStyles(el, styles)
 *     el.addClassName / removeClassName   -> el.classList.add / remove
 *     el.select(selector)                 -> el.querySelectorAll(selector)
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

// Helper privato per applicare un oggetto di stili a un element. Replica la
// semantica di Prototype.Element.setStyle: chiavi camelCase o hyphenated.
function _panelMenuApplyStyles(elem, styles) {
	if (!elem || !styles) return;
	for (var key in styles) {
		if (Object.prototype.hasOwnProperty.call(styles, key)) {
			var prop = key.indexOf('-') === -1
				? key
				: key.replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); });
			elem.style[prop] = styles[key];
		}
	}
}

var PanelMenuStorage = new Object();

function PanelMenu(myId, so) {
	this.initialize(myId, so);
}

PanelMenu.prototype = {
	initialize: function(myId, so) {
		this.myId = myId;

		this.childObj = new Array();
		this.expandSingle = so;
		this.lastExpanded = null;
		this.selectedClass = 'rich-pmenu-selected-element';
		this.is = 'panelMenu';
		this.selectedNameInput = document.getElementById(myId + 'selectedItemName');
		this.selectedChild = this.selectedNameInput.value;
		PanelMenuStorage[myId] = this;
	},

	_getIds: function(elt, ids) {
		var child = Richfaces.firstDescendant(elt);
		while (child) {
			if (child.id) {
				ids[child.id] = child;

				if (child.tagName) {
					var tagName = child.tagName.toLowerCase();

					if (tagName == 'div') {
						this._getIds(child, ids);
					} else if (child.rows) {
						var rows = child.rows;
						for (var i = 0; i < rows.length; i++ ) {
							var cells = rows[i].cells;
							for (var j = 0; j < cells.length; j++ ) {
								var cell = cells[j];
								if (/^icon/.test(cell.id)) {
									ids[cell.id] = cell;
								}
							}
						}
					}
				}
			}

			child = Richfaces.next(child);
		}
	},

	getIds: function() {
		var root = document.getElementById(this.myId);
		var ids = {};
		ids[root.id] = root;

		this._getIds(root, ids);

		return ids;
	}
};

function PanelMenuItem(idsMap, params, ids, options, hoveredStyles, hoveredClasses, level, haveDynamicIcon, action, opened, ajaxFunction, onItemHover, iconAlign, iconExpanded, iconCollapsed, iconSpacer) {
	this.initialize(idsMap, params, ids, options, hoveredStyles, hoveredClasses, level, haveDynamicIcon, action, opened, ajaxFunction, onItemHover, iconAlign, iconExpanded, iconCollapsed, iconSpacer);
}

PanelMenuItem.prototype = {
	initialize: function(idsMap, params,ids, options, hoveredStyles, hoveredClasses, level, haveDynamicIcon, action, opened, ajaxFunction, onItemHover, iconAlign, iconExpanded, iconCollapsed, iconSpacer){
		if (!ids.parentId){return};
		this.type = options.type;
		this.onopen = options.onopen;
		this.itemId = ids.myId;
		this.onclose = options.onclose;
		this.event = options.event;
		this.disabled = options.disabled;
		this.name = options.name;
		this.params = params;
		this.myId = ids.myId;

		this.mode = options.mode;
		if (!this.mode)
			this.mode = ("node" == this.type) ? "none" : "server";

		this.ajaxSubmit = ajaxFunction;
		this.onItemHover = onItemHover;
		this.target = options.target;

		this.hoveredStyles = hoveredStyles;
		this.hoveredClasses = hoveredClasses;
		this.tdhider = idsMap[ids.myId];
		if (!this.tdhider) {
			this.tdhider = document.getElementById(ids.myId);
		}
		this.tablehider = Richfaces.firstDescendant(this.tdhider);
		this.haveDynamicIcon = haveDynamicIcon;
		if (this.haveDynamicIcon==true) {
			var iconSwitcherId = "icon" + ids.myId;
			this.iconswitcher = idsMap[iconSwitcherId];
			if (!this.iconswitcher) {
				this.iconswitcher = document.getElementById(iconSwitcherId);
			}
		}
		this.childObj = new Array();
		this.parentObj = PanelMenuStorage[ids.parentId];
		this.parentObj.childObj.push(this);
		var parent = this.parentObj;
		while (parent) {
			if (parent.is && "panelMenu" == parent.is) {
				this.expandSingle = parent.expandSingle;
				break;
			}
			parent = parent.parentObj;
		}
		// parent - root menu object
		this.rootMenu = parent;

		if(this.rootMenu.selectedChild == this.name){
			this.selected = true;
		} else {
			this.selected = false;
		}
		this.clientId = ids.myId;

		this.mainRow = this.tablehider.rows[0];

		var mainCells = this.mainRow.cells;

		this.leftIcon = Richfaces.lastDescendant(mainCells[0]);
		this.labelArea = mainCells[1];
		this.rightIcon = Richfaces.firstDescendant(mainCells[2]);
		this.content = this.tdhider.querySelectorAll(".rich-pmenu-group-self-label")[0];
		this.iconAlign = iconAlign;

		this.iconCollapsed = iconCollapsed;
		this.iconExpanded = iconExpanded;
		this.iconSpacer = iconSpacer;
		if(action){
			this.action = action;
		}
		PanelMenuStorage[ids.myId] = this;

		this.initialStyles=null;
		this.hasInitialSylesChecked=false;

		this._attachBehaviors();
		this.inputs = this._getDirectChildrenByTag(this.content,"INPUT");
			for (var i=0;i<this.inputs.length;i++){
				if (this.inputs[i].name.indexOf("panelMenuState")!=-1){
					this.inputState = this.inputs[i];
				} else if (this.inputs[i].name.indexOf("panelMenuAction")!=-1){
					this.inputAction = this.inputs[i];
				}
			}
		if (opened){
			this.parentObj.lastExpanded = this;
			this.expand();
		} else {
			this.expanded = false;
		}
		if (this.parentObj.type=="node"&&this.parentObj.expanded){
			if (this.type=="node")
			this.tdhider.style.display="";
		}

		this.tdhider.component = this;
	},

	collapse: function(){
		if (!this.disabled) {
			if (this.expanded){
				// TODO: PY: don't understand why we are using _getDirectChildrenByTag. We have this.inputs, this.inputState, this.inputAction
				if (this._getDirectChildrenByTag(this.content,"INPUT")[0]!=null){
				this._getDirectChildrenByTag(this.content,"INPUT")[0].value="closed";}
				for (var i = 0; i < this.childObj.length; i++){
					if (this.childObj[i]._getDirectChildrenByTag(this.childObj[i].content,"INPUT")[0]!=null){
					this.childObj[i]._getDirectChildrenByTag(this.childObj[i].content,"INPUT")[0].value="";}
					if (this.haveDynamicIcon){
						var img = null;
						if (this.iconAlign=="right"){
							img = this.rightIcon;
						} else {
							img = this.leftIcon;
						}

						if (img!=null){
							if (this.iconCollapsed!="none"){
								if (this.iconCollapsed!=null) {
									if (this.iconCollapsed.length != 0) {
										img.style.display = '';
										img.src = this.iconCollapsed;
									} else {
										img.style.display = 'none';
										img.src = this.iconSpacer;
									}
								} else {
									img.style.display = '';
									img.src = this.iconSpacer;
								}
							}
						}
					}
					this.childObj[i].collapse();
					this.childObj[i].hide();
					//this.childObj[i].tdhider.style.display="none";
					//this.childObj[i].tablehider.style.display="none";
				}
			}
			this.expanded = false;
		}
	},

	hide: function(){
		this.tdhider.style.display = 'none';
//		if(this.inputState){
//			this.inputState.value="closed";
//		}
	},

	expand: function(){
		if (!this.disabled) {
			var parent = this.parentObj;
			while (parent) {
				if (parent.type && "node" == parent.type) {
					parent.expand();
				}
				parent = parent.parentObj;
			}
			if (!this.expanded) {
				if (this._getDirectChildrenByTag(this.content,"INPUT")[0]!=null){
					this.inputState.value="opened";
				}

				if (this.haveDynamicIcon){
					var img = null
					if (this.iconAlign=="right"){
						img = this.rightIcon;
					} else {
						img = this.leftIcon;
					}
					if (img!=null){
						if (this.iconExpanded!="none"){
							if (this.iconExpanded!=null) {
								if (this.iconExpanded.length != 0) {
									img.style.display = '';
									img.src = this.iconExpanded;
								} else {
									img.style.display = 'none';
									img.src = this.iconSpacer;
								}
							} else {
								img.style.display = '';
								img.src = this.iconSpacer;
							}
						}
					}
				}

				for (var i = 0; i < this.childObj.length; i++){
					this.childObj[i].show();
				}
			}
			this.expanded = true;
		}
	},

	show: function(){
//		if (this.type!="node")
//			this.inputState.value="opened";
		this.tdhider.style.display="";
		this.tablehider.style.display="";
		this.tdhider.style.display = "";
	},

	preTrigger: function(e){
		//this.inputAction.setAttribute('value', this.tdhider.id);
		this.inputAction.setAttribute('value', this.clientId);
	},

	postTrigger: function(e){
		this.inputAction.setAttribute('value', '');
	},


	trigger: function(e){
		if ("none" == this.mode)
			return;

		this.preTrigger(e);
		var target = e.target || e.srcElement;
		var form = target.closest ? target.closest("form") : null;
		if (!form) {
			// fallback: cammina manualmente la catena (browser molto vecchi)
			var n = target;
			while (n && n.tagName && n.tagName.toLowerCase() !== "form") {
				n = n.parentNode;
			}
			form = n;
		}
		if ("server" == this.mode) {
			Richfaces.jsFormSubmit(this.myId, form.id, this.target,this.params);
			//form.submit();
		}
		else if ("ajax" == this.mode) {
			var event = e;
			eval(this.ajaxSubmit);
		}
		this.postTrigger(e);
	},

	itemClicked: function(e){
		this.globalClearSelection();
		this.setSelectedClass();

		this.rootMenu.selectedNameInput.value = this.name;

		if(this.action){
			if (this.action=='panelMenuNodeAction'){
				if (this.expanded){
					if ("node" == this.type){
						if (new Function(this.onclose+";return true;")()){
							this.collapse();
						}
					}
					this.trigger(e);
				} else {
					if (this.parentObj.expandSingle){
						if (this.parentObj.lastExpanded!=null){
							this.parentObj.lastExpanded.collapse();
						}
						if ("node" == this.type){
							if (new Function(this.onopen+";return true;")()){
								this.expand();
							}
						}
						this.trigger(e);
						this.parentObj.lastExpanded = this;
					} else {
						if ("node" == this.type){
							if (new Function(this.onopen+";return true;")()){
								this.expand();
							}
						}
						this.trigger(e);
					}
				}
			} else {
				this.trigger(e);
			}
		} else {
			if(this.mode == 'none'){
				return;
			}

			if (this.expanded){
				if ("node" == this.type){
					if (new Function(this.onclose + ";return true;")()){
						this.collapse();
					}
				}
				this.trigger(e);
			} else {
				if (this.parentObj.expandSingle){
					if (this.parentObj.lastExpanded!=null){
						this.parentObj.lastExpanded.collapse();
					}
					if ("node" == this.type){
						if (new Function(this.onopen+";return true;")()){
							this.expand();
						}
					}
					// trigger event not only for action, but also for actionListener
					this.trigger(e);
					//if (this.action){
					//	this.trigger(e);
					//}
					this.parentObj.lastExpanded = this;
				} else {
					if ("node" == this.type){
						if (new Function(this.onopen+";return true;")()){
							this.expand();
						}
					}
					this.trigger(e);
				}
			}
		}
	},

	globalClearSelection: function(e) {
		for(var key in PanelMenuStorage){
			if(PanelMenuStorage.hasOwnProperty(key)){
				if(PanelMenuStorage[key].type == 'node' || PanelMenuStorage[key].type == 'item'){
					PanelMenuStorage[key].removeSelectedClass();
				}
			}
		}
	},



	setSelectedClass: function(e){
		this.mainRow.classList.add(this.rootMenu.selectedClass);
	},
	removeSelectedClass: function(e){
		this.mainRow.classList.remove(this.rootMenu.selectedClass);
	},


	addHoverStyles: function(e) {
		if(!this.selected){
			if(!this.hasInitialSylesChecked){
				this.initialStyles = this.tablehider.style.cssText;
				this.hasInitialSylesChecked = true;
			}
			if (this.hoveredStyles) {
				_panelMenuApplyStyles(this.tablehider, this.hoveredStyles);
			}
			if (this.hoveredClasses)
				for (i = 0; i < this.hoveredClasses.length; i++) {
					this.tablehider.classList.add(this.hoveredClasses[i]);
				}
		}
	},

   removeHoverStyles: function(e) {
   		if(!this.selected){
			if (this.hoveredStyles && this.hasInitialSylesChecked) {
				this.tablehider.style.cssText = this.initialStyles;
			}

	   		if (this.hoveredClasses)
				for (var i = 0; i < this.hoveredClasses.length; i++){
					this.tablehider.classList.remove(this.hoveredClasses[i]);
				}
		}
	},

   _getDirectChildrenByTag: function(e, tagName) {
      var allKids = e.childNodes;
      var kids = new Array();
	  tagName = tagName.toLowerCase();
      for( var i = 0 ; i < allKids.length ; i++ )
         if ( allKids[i] && allKids[i].tagName && allKids[i].tagName.toLowerCase() == tagName )
            kids.push(allKids[i]);
      return kids;
   },

   _fireEditEvent: function(e){
		if( document.createEvent ) {
			var evObj = document.createEvent('HTMLEvents');
			evObj.initEvent( e, true, false );
			this.edit.dispatchEvent(evObj);
		} else if( document.createEventObject ) {
			this.edit.fireEvent('on' + e);
		}
	},

   hoverItem: function (e){
   		if(this.onItemHover != ""){
			eval(this.onItemHover);
		}
   },

 	_attachBehaviors: function() {
 		if (!this.disabled) {
	 		if (this.event)
	 			this.tablehider.addEventListener(this.event, this.itemClicked.bind(this), false);
	 		else
				this.tablehider.addEventListener("click", this.itemClicked.bind(this), false);

			this.tdhider.addEventListener("mouseover", this.hoverItem.bind(this), false);

			this.tablehider.addEventListener("mouseover", this.addHoverStyles.bind(this), false);
			this.tablehider.addEventListener("mouseout", this.removeHoverStyles.bind(this), false);

		}
	},

	doCollapse: function(e) {
		this.collapse();
	},

	doExpand: function(e) {
		this.expand();
	}

};

PanelMenu.doExpand = function (id) {
	var group = PanelMenuStorage[id];
	if (group && group.type && "node" == group.type) {
		var parent = group.parentObj;
		if (parent.expandSingle){
			if (group.parentObj.lastExpanded!=null){
				group.parentObj.lastExpanded.collapse();
			}
		}
		if (!group.expanded && new Function(group.onopen+";return true;")()){
			group.expand();
		}
	}else if(group.childObj&&group.childObj.length>0){
		for (var i=0;i<group.childObj.length;i++){
			PanelMenu.doExpand(group.childObj[i].clientId);
		}
	}
}

PanelMenu.doCollapse = function (id) {
	var group = PanelMenuStorage[id];
	if (group && group.type && "node" == group.type) {
		if (group.expanded && new Function(group.onclose+";return true;")()){
			group.collapse();
		}
	}else if(group.childObj&&group.childObj.length>0){
		for (var i=0;i<group.childObj.length;i++){
			PanelMenu.doCollapse(group.childObj[i].clientId);
		}
	}
}
