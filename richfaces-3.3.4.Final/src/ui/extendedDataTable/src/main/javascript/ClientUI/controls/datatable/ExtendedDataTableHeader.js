/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM (vedi header in ExtendedDataTable.js
 *     per la legenda completa). Per questa classe in particolare:
 *       Class.create(parent,{...})    -> Object.create(parent.prototype) +
 *                                        Object.assign,
 *       $super(...)                   -> ClientUI.common.box.Box.prototype
 *                                        .initialize.call(this, ...),
 *       Object.isNumber(x)            -> typeof x === 'number',
 *       elem.childElements()          -> Array.from(elem.children),
 *       arr.size()                    -> arr.length.
 *
 *     I metodi setStyle/getHeight/getY/getWidth chiamati su Box wrapper
 *     (this.headerRow, etc.) restano: Box e' nel modulo scrollableDataTable
 *     non ancora portato.
 *
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

function _ExtDtHeader() { this.initialize.apply(this, arguments); }
_ExtDtHeader.prototype = Object.create(ClientUI.common.box.Box.prototype);
_ExtDtHeader.prototype.constructor = _ExtDtHeader;
ExtendedDataTable.DataTable.header = _ExtDtHeader;

Object.assign(_ExtDtHeader.prototype, {
	// constructor
	initialize: function(elementId, extDt) {
		this.extDt = extDt;
		this.extDtId = this.extDt.id;
		this.enableContextMenu = this.extDt.options.enableContextMenu;
		ClientUI.common.box.Box.prototype.initialize.call(this, elementId, extDt, true);

		//register events
		this.eventSepClick = this.OnSepClick.bind(this);
		this.eventSepMouseDown = this.OnSepMouseDown.bind(this);
		this.eventSepMouseMove = this.OnSepMouseMove.bind(this);
		this.eventSepMouseUp = this.OnSepMouseUp.bind(this);
		this.eventHeaderCellMouseOver = this.OnHeaderCellMouseOver.bind(this);
		this.eventHeaderCellMouseOut = this.OnHeaderCellMouseOut.bind(this);
		if (this.enableContextMenu) {
			var showMenuFct = this.extDt.options.showMenuFunction;
			if (showMenuFct) {
				this.showMenuFct = showMenuFct;
				this.menuImageMouseDown = this.OnMenuImageMouseDown.bind(this);
			};
		}
		if (this.extDt.sortFct) {
			this.eventHeaderCellClicked = this.OnHeaderCellMouseClicked.bind(this);
		}
		this.createControl(elementId);
	},

	OnHeaderCellMouseOver: function(event) {
		if (this.enableContextMenu) {
			var el = this.extDt._findParentElement(event, "th");
			var menuDiv = document.getElementById(el.id+"header:menuDiv");
			menuDiv.className = "extdt-menu-div-on";
		}
	},

    OnHeaderCellMouseOut: function(event) {
    	if (this.enableContextMenu) {
			var el = this.extDt._findParentElement(event, "th");
			var menuDiv = document.getElementById(el.id+"header:menuDiv");
			menuDiv.className = "extdt-menu-div-out";
		}
    },

    OnHeaderCellMouseClicked: function(event) {
		//get column id
		var el = this.extDt._findParentElement(event, "th");
		var columnId = (el) ? el.id : null;

		if (columnId && (columnId != "")){
			this.extDt.sortBy(columnId, null, event);
		}
		_edtStopEvent(event);
	},

	getCaption: function() {
       return this.caption;
    },

	getCaptionHeight: function() {
	   var caption = this.getCaption();
	   if (caption) {
	       return caption.getHeight();
	   }else{
	       return 0;
	   }
	},

	addListeners: function(){
		var columnCells = this.getColumnCells();
        var l = columnCells.length;
        for (var i = 0; i< l-1; i++) {
            var headerChild = columnCells[i];
            //remove listeners
            Utils.DOM.Event.removeListeners(headerChild);
            //add listeners
            Utils.DOM.Event.observe(headerChild,'mouseover',this.eventHeaderCellMouseOver);
            Utils.DOM.Event.observe(headerChild,'mouseout',this.eventHeaderCellMouseOut);

            var isSortable = headerChild.getAttribute('sortable');
            if ((isSortable) && (isSortable.indexOf('true') == 0)) {
            	var sortDiv = document.getElementById(headerChild.id + ":sortDiv");
            	if (sortDiv){
                	Utils.DOM.Event.observe(sortDiv, 'click',  this.eventHeaderCellClicked);
                }
            }
            // Modificato da Link.it: gli accessi indice fisso b[2]/b[3]/b[5]/b[7]
            // contavano sui 3 <script> emessi da renderDragSupport/renderDropSupport
            // come figli diretti del TD colonna. Quei <script> sono stati rimossi
            // nel cleanup drag-drop, quindi gli indici sono shiftati. Uso ora
            // selettori per classe (robusti a futuri shift).
            var headerChildChildren = Array.from(headerChild.children);
            if (headerChildChildren == null || headerChildChildren.length == 0){
				continue;
			}
			if (this.enableContextMenu) {
				var menuImage = headerChild.querySelector('.extdt-menu-div-out, .extdt-menu-div-on');
				if (menuImage) {
					Utils.DOM.Event.removeListeners(menuImage);
					Utils.DOM.Event.observe(menuImage,'click',this.menuImageMouseDown);
				}
			};
            var sepSpan = headerChild.querySelector('.extdt-hsep');
			if (sepSpan) {
				Utils.DOM.Event.removeListeners(sepSpan);
				Utils.DOM.Event.observe(sepSpan, 'click',  this.eventSepClick);
				Utils.DOM.Event.observe(sepSpan, 'mousedown', this.eventSepMouseDown);
				Utils.DOM.Event.observe(sepSpan, 'mousemove', this.eventSepMouseMove);
				Utils.DOM.Event.observe(sepSpan, 'mouseup', this.eventSepMouseUp);
			}
        }
	},

    removeListeners: function() {
        var columnCells = this.getColumnCells();
        var l = columnCells.length;
        for (var i = 0; i< l-1; i++) {
            var headerChild = columnCells[i];
            Utils.DOM.Event.removeListeners(headerChild);

            var sortDiv = document.getElementById(headerChild.id + ":sortDiv");
            if (sortDiv){
               	Utils.DOM.Event.stopObserving(sortDiv, 'click');
            }

            // Modificato da Link.it: vedi commento in addListeners — query by class.
            if (this.enableContextMenu) {
				var menuImage = headerChild.querySelector('.extdt-menu-div-out, .extdt-menu-div-on');
				if (menuImage) Utils.DOM.Event.removeListeners(menuImage);
			}
            var sepSpan = headerChild.querySelector('.extdt-hsep');
            if (sepSpan) Utils.DOM.Event.removeListeners(sepSpan);
        };
    },

	getVisibleWidth: function() {
		var sum = 0;
		var l = this.getColumnsNumber();
		for(var i = 0; i < l-1; i++){
			sum += this.getColumnWidth(i);
		}
		return sum;
	},

	createControl: function(elementId) {
		if(!elementId) {
			errMsg = "Invalid id specified for ExtendedDataTableGridHeader.";
			throw(errMsg);
		}

		if(!this.parseTemplate(elementId)) {
			//TODO insert comment about header structure here
			errMsg = "TODO insert commnet about header structure here";
			throw(errMsg);
		}
	},

	parseTemplate: function(template) {
		if(!template) {
			return false;
		}
		this.headerRow = new ClientUI.common.box.Box(this.extDtId +":headerRow",this.getElement(),true);
		this.filterRow = new ClientUI.common.box.Box(this.extDtId +":filterRow",this.getElement(),true);
		this.caption = new ClientUI.common.box.Box(this.extDtId +":caption",this.getElement(),true);
		var colgroup = document.getElementById(this.extDtId +":colgroup:header");
        this.cols = colgroup.getElementsByTagName("col");
        this.columnsNumber = this.cols.length;
		this.columnCells = Array.from(this.headerRow.getElement().children);
		return true;
	},
	getColumns: function() {
		return this.cols;
	},
    getColumn: function(index) {
        if (this.isValidColumnNumber(index)) {
            return this.cols[index];
        }else{
            return null;
        }
    },
	getColumnCells: function() {
		return this.columnCells;
	},
	getColumnsNumber: function() {
		return this.columnsNumber;
	},

	setColumnWidth: function(columnIndex, newWidth) {
	   if (columnIndex >= this.getColumnsNumber()) {
	       return false;
	   }else{
	       if (!newWidth) {
	           newWidth = null;
	       }
	       this.getColumns()[columnIndex].width = newWidth;
	   }
	},

	isValidColumnNumber: function(columnNumber) {
        return ((columnNumber < this.getColumnsNumber()) && (columnNumber >=0))
	},

	getColumnWidth: function(columnNumber) {
		if (this.isValidColumnNumber(columnNumber)) {
			var col = this.getColumnCells()[columnNumber];
            if (col.offsetWidth != null) {
                return col.offsetWidth;
            }else{
                col = this.getColumns()[columnNumber];
                return parseInt(col.width);
            }
		}else{
			return null;
		}
	},

	isColumnWidthPercentage: function(columnNumber) {
        if (this.isValidColumnNumber(columnNumber)) {
            var col = this.getColumns()[columnNumber];
            var width = col.width;
            if ((typeof width !== 'number') && (width.indexOf('%') != -1)) {
                return true;
            }else{
                return false;
            }
        }else{
            return null;
        }
	},

	getHeightWithoutFacets: function() {
		return this.headerRow.getHeight() + this.filterRow.getHeight();
	},

	getTotalHeight: function() {
        var ret = this.headerRow.getHeight() + this.filterRow.getHeight();
        if (this.caption) {
            ret += this.caption.getHeight();
        }
        return ret;
	},

	OnMenuImageMouseDown: function(event) {
		var el = this.extDt._findParentElement(event, "th");
		var columnId = (el) ? el.id : null;

		if (columnId && (columnId != "")){
			var menuId = "#" + columnId + "menu";
			menuId = menuId.replace(/:/g,"\\:");
			this.showMenuFct(event, columnId, menuId);
		}
		_edtStopEvent(event);
	},

	adjustSeparators: function() {
		var columnCells = this.getColumnCells();
		var l = columnCells.length;
		for (var i=0; i<l-1; i++) {
			var headerChild = columnCells[i];
			var headerNextChild = columnCells[i+1];
			// Modificato da Link.it: vedi commento in addListeners — query by class.
			var sepSpan = headerChild.querySelector('.extdt-hsep');
			if (!sepSpan) continue;
			var dropSpans = headerChild.querySelectorAll('.extdt-hdrop');
			var dropSpanLeft = dropSpans[0];
			var dropSpanRight = dropSpans[1];
			var menuImage = headerChild.querySelector('.extdt-menu-div-out, .extdt-menu-div-on');
			var headerRowHeight = this.headerRow.getHeight();
			var headerRowY = this.headerRow.getY();
			sepSpan.columnIndex = i;
			var sd = (sepSpan.offsetWidth)/2 + 1;
			var spanLeft = headerNextChild.offsetLeft - sd;
			_edtSetStyle(sepSpan, {height: headerRowHeight+'px', top: headerRowY+'px', left: spanLeft+'px'});
			if (menuImage) {
				_edtSetStyle(menuImage, {top: headerRowY + 'px', left: (headerNextChild.offsetLeft-menuImage.offsetWidth - 1)+'px'});
			}
			var w = parseInt(headerChild.offsetWidth/2);
			if (dropSpanLeft) _edtSetStyle(dropSpanLeft, {top: headerRowY+'px', left: (headerChild.offsetLeft) +'px', height: headerRowHeight+'px', width: w+'px'});
			if (dropSpanRight) _edtSetStyle(dropSpanRight, {top: headerRowY+'px', left: (headerChild.offsetLeft + w) +'px', height: headerRowHeight+'px', width: w+'px'});
		}
		this.lastColWidth = this.extDt.getColumnWidth(this.getColumnsNumber()-1);
		if (ClientUILib.isIE){
			this.lastColWidth -= 15;
		}
	},

	OnSepClick: function(event) {
		_edtStopEvent(event);
		this.dragColumnInfo.mouseDown = false;
	},

	OnSepMouseDown: function(event) {
		_edtStopEvent(event);
		this.dragColumnInfo = {
			srcElement: event.target || event.srcElement,
			dragStarted: false,
			mouseDown: true,
			startX: _edtPointerX(event),
			originalX: 0
		};
		var srcElement = this.dragColumnInfo.srcElement;
		this.maxDelta = this.getColumnWidth(this.getColumnsNumber()-1);
		this.maxDelta -= this.extDt.getScrollbarWidth();
        if (ClientUILib.isOpera) {
            this.maxDelta -= 1;
        };
		this.minDelta = this.minColumnWidth - this.getColumnWidth(srcElement.columnIndex);
		document.addEventListener('mousemove', this.eventSepMouseMove, true);
		document.addEventListener('mouseup', this.eventSepMouseUp, true);
	},

	_showSplitter: function(index) {
		if(!this.columnSplitter) {
			this._createSplitter();
		}

		var pos = this.dragColumnInfo.srcElement.offsetLeft;
		pos += 6; //6 stands for width of the separatorSpan
		this.dragColumnInfo.originalX = pos;
		this.columnSplitter.show();
		this.columnSplitter.setHeight(this.extDt.scrollingDiv.getHeight()+
			this.getHeightWithoutFacets()
		);
		this.columnSplitter.moveTo(pos, this.headerRow.getY());
	},
	_hideSplitter: function() {
		if(this.columnSplitter) {
			this.columnSplitter.hide();
		}
	},
	_createSplitter: function() {
		this.columnSplitter = new ClientUI.common.box.Box(this.extDtId +":cs", this.extDt.grid);
		this.columnSplitter.makeAbsolute();
		this.columnSplitter.setWidth(this.minColumnWidth);
	},

	OnSepMouseUp: function(event) {
		_edtStopEvent(event);
		document.removeEventListener('mousemove', this.eventSepMouseMove, true);
		document.removeEventListener('mouseup', this.eventSepMouseUp, true);
		if(this.dragColumnInfo && this.dragColumnInfo.dragStarted) {

			this.dragColumnInfo.dragStarted = false;
			this.dragColumnInfo.mouseDown = false;

			var delta = _edtPointerX(event) -
				this.dragColumnInfo.startX;
			if (delta < this.minDelta) {
				delta = this.minDelta;
			}
			if (!this.disableMaxDelta && delta > this.maxDelta) {
				delta = this.maxDelta;
			}
			var columnIndex = this.dragColumnInfo.srcElement.columnIndex;
			var newWidth = this.getColumnWidth(columnIndex) + delta;

			this.extDt.setColumnWidth(columnIndex, newWidth);
			this.setColumnWidth(columnIndex,newWidth);
			this.extDt.updateLayout();
			if (this.extDt.onColumnResize){
				//set properly value to this.columnWidths
				this.extDt.columnWidths = "";
				for (i=0; i<this.columnsNumber; i++){
					this.extDt.columnWidths += "" + this.getColumnWidth(i) + ";";
				}//for
				this.extDt.onColumnResize(event, this.extDt.columnWidths);
			}
		}
		this._hideSplitter();

	},

	OnSepMouseMove: function(event) {
		if(this.dragColumnInfo && this.dragColumnInfo.mouseDown) {
			if(!this.dragColumnInfo.dragStarted) {
				this.dragColumnInfo.dragStarted = true;
				this._showSplitter(this.dragColumnInfo.srcElement.columnIndex);
			}
			var delta = _edtPointerX(event) -
				this.dragColumnInfo.startX
			if (delta < this.minDelta) {
				delta = this.minDelta;
			}
			if (!this.disableMaxDelta && delta > this.maxDelta) {
				delta = this.maxDelta;
			}
			var x = this.dragColumnInfo.originalX + delta;
			var finalX = x - this.minColumnWidth - 6 //6 stands for sep span width;
			this.columnSplitter.moveToX(finalX);
			_edtStopEvent(event);
		}
	}

});
