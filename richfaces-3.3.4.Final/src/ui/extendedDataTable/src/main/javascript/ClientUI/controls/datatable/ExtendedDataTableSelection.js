/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM (vedi header in ExtendedDataTable.js
 *     per la legenda completa). Per questo file in particolare:
 *       Class.create({...})           -> costruttore + Object.assign,
 *       Object.extend(new Object(),o) -> Object.assign({}, o),
 *       arr.clone() / arr.size() / arr.each(fn)
 *           -> arr.slice() / arr.length / arr.forEach(fn),
 *       Event.KEY_UP / KEY_DOWN / KEY_TAB -> 38 / 40 / 9.
 *
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

/* Class taken from ScrollableDataTable - unmodified */
function _ExtDtSelection() { this.initialize.apply(this, arguments); }
ExtendedDataTable.Selection = _ExtDtSelection;
Object.assign(_ExtDtSelection.prototype, {
	initialize: function() {
		this.ranges = [];
	},

	addId: function(id) {
		id = parseInt(id);
		if(this.isSelectedId(id))
			return;
		var i = 0;
		while(i < this.ranges.length && id >= this.ranges[i++].indexes[1]);
		i--;
		if(this.ranges[i-1] && id==(this.ranges[i-1].indexes[1]+1) ) {
			if(id==(this.ranges[i].indexes[0]-1)) {
				this.ranges[i-1].indexes[1] = this.ranges[i].indexes[1];
				this.removeRange(i);
			} else {
				this.ranges[i-1].indexes[1]++;
			}
		} else {
			if(this.ranges[i]){
				if(this.ranges[i] && id==(this.ranges[i].indexes[0]-1)) {
					this.ranges[i].indexes[0]--;
				} else {
					if(id==(this.ranges[i].indexes[1]+1)){
						this.ranges[i].indexes[1]++;
					} else {
						if(id<this.ranges[i].indexes[1]){
							this.addRange(i, new ExtendedDataTable.Range(id, id));
						} else {
							this.addRange(i + 1, new ExtendedDataTable.Range(id, id));
						}
					}
				}
			} else {
				this.addRange(i, new ExtendedDataTable.Range(id, id));
			}
		}
	},

	addRange: function(index, range) {
		var i = this.ranges.push(range) - 2;
		if(index >= 0) {
			while(i>=index)
				this.ranges[i+1] = this.ranges[i--];
			this.ranges[i+1] = range;
		}
	},

	removeRange: function(index) {
		var i = index + 1;
		while(i!=this.ranges.length)
			this.ranges[i-1] = this.ranges[i++];
		this.ranges.pop();
	},

	isSelectedId: function(id) {
		var i = 0;
		while(i < this.ranges.length && id >= this.ranges[i].indexes[0]) {
			if(id >= this.ranges[i].indexes[0] && id <= this.ranges[i].indexes[1]) {
				return true;
			} else {
				i++;
			}
		}
		return false;
	},

	getSelectedIdsQuantity: function() {
		var number = 0;
		var l = this.ranges.length;
		for (var i = 0; i < l; i++) {
			number+= this.ranges[i].size();
		}
		return number;
	},

	size: function () {
		return this.getSelectedIdsQuantity();
	},

	removeId: function(id) {
		id = parseInt(id);
		if(!this.isSelectedId(id))
			return;
		var i = 0;
		while(i < this.ranges.length && id > this.ranges[i++].indexes[1]);
		i--;
		if(this.ranges[i]) {
			if(id==(this.ranges[i].indexes[1]) ) {
				if(id==(this.ranges[i].indexes[0])){
					this.removeRange(i);
				} else {
					this.ranges[i].indexes[1]--;
				}
			} else {
				if(id==(this.ranges[i].indexes[0])){
					this.ranges[i].indexes[0]++;
				} else {
				this.addRange(i+1, new ExtendedDataTable.Range(id+1, this.ranges[i].indexes[1]));
				this.ranges[i].indexes[1] = id-1;
				}
			}
		}
	},

	getState: function() {
		var s = this.clone();
		return {
			size: function() {
					return s.size();
			},

			each: function(iterator) {
				s.each(iterator);
  			},

			isSelected: function(id) {
				return s.isSelectedId(id);
  			},

  			equals: function(state) {
  			    var equal = s.size() == state.size();
  			    if(equal) {
  			        s.each(function(id) {
  			            if(equal) {
  			                equal = state.isSelected(id);
  			            }
  			        });
  			    }
  			    return equal;
  			}
		};
	},

	clone: function() {
		var ret =  Object.assign({}, this);
		var l = ret.ranges.length;
		ret.ranges = new Array(l);
		for (var i = 0; i < l; i++) {
			ret.ranges[i] = this.ranges[i].clone();
		}
 		return ret;
 	},

	each: function(iterator) {
		var l = this.ranges.length;
		for (var i = 0; i < l; i++) {
			this.ranges[i].each(iterator);
		}
 	},

  	getRanges: function() {
		return this.ranges;
	},

	setRanges: function(ranges) {
		this.ranges = ranges;
	},

	initRanges: function(rangeStrRArray) {
		if(rangeStrRArray.length == 0) {
			this.ranges = [];
			return;
		}
		this.ranges = new Array(rangeStrRArray.length);
		var indexStrRArray;
		var l = this.ranges.length;
		for(var i = 0; i < l; i++) {
			indexStrRArray = rangeStrRArray[i].split(",");
			this.ranges[i] = new ExtendedDataTable.Range(parseInt(indexStrRArray[0]), parseInt(indexStrRArray[1]));
		}

	},

	inspectRanges: function() {
		var ranges = this.getRanges();
		var ret = "";
		ranges.forEach( function(r) { ret += r.inspect(); } );
		return ret;
	},

	/**
	    Compares states and returns true if they are different
	*/
	isChanged: function(state1, state2) {
	    return !state1.equals(state2);
	},

	isInRange: function(range, selection) {
	    return selection >= range[0] && selection <= range[1];
	}
});


/* Class taken from ScrollableDataTable - unmodified */
function _ExtDtRange() { this.initialize.apply(this, arguments); }
ExtendedDataTable.Range = _ExtDtRange;
Object.assign(_ExtDtRange.prototype, {
	initialize: function(startIndex, endIndex) {
		this.indexes = [startIndex, endIndex];
	},

	inspect: function() {
		return this.indexes[0] + "," + this.indexes[1] + ";";
	},
	toString: function() {
		return this.inspect();
	},

	size: function() {
		return this.indexes[1] - this.indexes[0] + 1;;
	},

	each: function(iterator) {
		var j = this.indexes[0];
		while(j <= this.indexes[1]) {
      		iterator(j++);
		}
  	},

	clone: function() {
		var ret = Object.assign({}, this);
		ret.indexes = this.indexes.slice();
		return ret;
  	}
});

/* Modified class from ScrollableDataTable */
function _ExtDtSelectionManager() { this.initialize.apply(this, arguments); }
ExtendedDataTable.SelectionManager = _ExtDtSelectionManager;
Object.assign(_ExtDtSelectionManager.prototype, {
	initialize: function(options, owner) {
		this.dataTable = owner;
		this.options = options;
		this.selectionFlag;
		this.firstIndex;
		this.activeRow = -1;
		var element = options.gridId;
		this.gridElement = document.getElementById(element + ":n");

		this.prefix = options.gridId;
		this.selection = new ExtendedDataTable.Selection();

		this.inputElement = options.selectionInput;
		this.onselectionchange = options.onselectionchange;
		this.selectedClass = options.selectedClass;
		this.activeClass = options.activeClass;


	},
	destroy: function(){
		this.removeListeners();
		this.gridElement = null;
	},
	refreshEvents: function() {
		this.setListeners();
		if(this.options.selectionMode != "none") {
			this.eventKeyPress = this.processKeyDown.bind(this);
			document.addEventListener("keydown", this.eventKeyPress);
		}
		var self = this;
		A4J.AJAX.AddListener({
			onafterajax: function(req, event, data) {
				if(!document.getElementById(self.prefix + ":n")) {
					if(self.eventKeyPress)
						document.removeEventListener("keydown", self.eventKeyPress);
				}
			}
		});
		if (document.selection) {
			this.eventResetSelection = this.resetSelection.bind(this);
			this.gridElement.addEventListener("click", this.eventResetSelection);
		}

		this.eventLostFocus = this.processLostFocus.bind(this);
		document.addEventListener("click", this.eventLostFocus);

		this.eventPreventLostFocus = this.processPreventLostFocus.bind(this);
		this.gridElement.addEventListener("click", this.eventPreventLostFocus);
	},

	restoreState: function() {
		this.selectionFlag = null;
		var selStrAr = document.getElementById(this.inputElement).value.split(";");
		var activeRow = NaN;
		while (selStrAr.length != 0 && selStrAr[selStrAr.length - 1].indexOf(",") == -1 &&
			isNaN(activeRow = Number(selStrAr.pop())));
		if (!isNaN(activeRow)) {
			this.setActiveRow(activeRow);
		}
		this.selection.initRanges(selStrAr);
		var i = 0;
		var j;
		while(i < this.selection.ranges.length) {
			j = this.selection.ranges[i].indexes[0];
			while(j <= this.selection.ranges[i].indexes[1]) {
				var nElement = document.getElementById(this.prefix + ":n:" + j);
				_edtAddClass(nElement, "extdt-row-selected");
				_edtAddClass(nElement, "rich-sdt-row-selected");
				_edtAddClass(nElement, this.selectedClass);
				j++;
			}
			i++;
		}
		this.oldState = this.selection.getState();
	},

	setListeners: function() {
		//May need optimization by attaching listeners to whole rows instead of all cells
		var nrows = document.getElementById(this.prefix + ":n").rows;
		this.rowCount = nrows.length;
		var rowIndex;
		var groupingExists = document.getElementById(this.prefix + ":group-row:0") != null;
		if(!groupingExists) { //simple listener binding
			if(this.options.selectionMode != "none") {
				for(var i = 0; i < this.rowCount; i++) {
                    var arr = nrows[i].id.split(":");
                    rowIndex = Number(arr[arr.length-1]);
					this.addListener(nrows[i], rowIndex);
				}
			}
		} else { //extended listener binding with grouping
			var groupRow;
			var lastGroupId = 0;
			var bGroupExpanded = true;
			var bHideFirstRow = false;
			if (ClientUILib.isIE) {
				//hide first fake ie row to ensure proper rendering
				bHideFirstRow = true;
			};
			var groupId;
			var groupItems = [];
			var groupItem = 0;
			var groups = [];
			var groupRows = this.dataTable.groupRows;
			for(var i = 0; i < this.rowCount; i++) {
				tempo = nrows[i].id.split(this.prefix)[1];
				var tempArr = tempo.split(":")
				groupRow = tempArr[1] == "group-row";
				groupId = Number(tempArr[2]);
				if(groupRow) {
					groups[lastGroupId] = groupItems;
					bGroupExpanded = (groupRows[groupId].getAttribute('expanded') == 'true');
					var textSpan = groupRows[lastGroupId].lastChild.lastChild;
					var txtNode = document.createTextNode("(" + groupItems.length + ")");
					if (textSpan.lastChild) {
						textSpan.replaceChild(txtNode, textSpan.lastChild);
					}else{
						textSpan.appendChild(txtNode);
					}
					groupItem = 0;
					groupItems = [];
					lastGroupId = groupId;
				} else {
					if(this.options.selectionMode != "none") {
                        var arr = nrows[i].id.split(":");
                        rowIndex = Number(arr[arr.length-1]);
                        this.addListener(nrows[i], rowIndex);
					}
					groupItems[groupItem++] = nrows[i];
					if ( (i==0) && (bHideFirstRow) ) {

					}
					if (!bGroupExpanded) {
						nrows[i].style.display = 'none';
						if ((ClientUILib.isIE) && (i!=0)){
							//prevent IE from showing borders of cells
							//which parents have been hidden :|
							var cells = nrows[i].childNodes;
							var l = cells.length;
							for (var j = 0; j < l; j++) {
								cells[j].style.borderStyle = 'none';
							}
						}
					}
				}
			}
			groups[lastGroupId] = groupItems;
			var textSpan = groupRows[lastGroupId].lastChild.lastChild;
			var txtNode = document.createTextNode("(" + groupItems.length + ")");
			if (textSpan.lastChild) {
				textSpan.replaceChild(txtNode, textSpan.lastChild);
			}else{
				textSpan.appendChild(txtNode);
			}
			this.dataTable.groups = groups;
		}
	},
	/*
		Modification: instead of providing listener for each cell,
		one is provided for a whole row
	*/
	addListener: function(tr, rowIndex) {
		if (tr) {
			var listener = this.processClick.bind(this, rowIndex);
			Utils.DOM.Event.removeListeners(tr);
			Utils.DOM.Event.observe(tr, "click", listener);
		}
	},

	removeListeners: function(){
		if(this.eventKeyPress) { // added if to ensure that all keydown event listeners are not removed
			document.removeEventListener("keydown", this.eventKeyPress);
		}
		if (document.selection) {
			this.gridElement.removeEventListener("click", this.eventResetSelection);
		}
		document.removeEventListener("click", this.eventLostFocus);
		this.gridElement.removeEventListener("click", this.eventPreventLostFocus);
		if(this.options.selectionMode != "none") {
			var nrows = document.getElementById(this.prefix + ":n").rows;
			var rowCount = nrows.length;
			for(var i = 0; i < this.rowCount; i++) {
				Utils.DOM.Event.removeListeners(nrows[i]);
			}
		}
	},

/*	getGridSelection: function() {
		return this.selection.getRanges();
	},*/

	processPreventLostFocus: function() {
		this.inFocus = true;
		this.preventLostFocus = true;
	},

	processLostFocus: function() {
		if (!this.preventLostFocus) {
			this.lostFocus();
		} else {
			this.preventLostFocus = false;
		}
	},

	lostFocus: function() {
		this.inFocus = false;
	},

	processKeyDown: function(event) {
		var nGrid = document.getElementById(this.prefix + ":n");
		if (nGrid && nGrid.rows.length > 0) {
			if(!event.shiftKey) {
				this.shiftRow = null;
			}
			var range, rowIndex;
			var activeRow = this.activeRow;
			var noDefault = false;
			var arr = nGrid.rows[0].id.split(":");
			this.firstIndex = Number(arr[arr.length-1]);
			switch (event.keyCode || event.charCode) {
				case _edtKey.UP:
					if (this.inFocus && activeRow != null) {
						if(this.firstIndex != activeRow) {
							rowIndex = (this.rowCount + activeRow - 1) % this.rowCount;
							if (!event.ctrlKey && !event.shiftKey) {
								this.selectionFlag = "x";
								range = [rowIndex, rowIndex];
								this.setSelection(range);
							} else if (!event.ctrlKey && event.shiftKey
							             && this.options.selectionMode == "multi") {
								if(!this.shiftRow) {
									this.shiftRow = this.activeRow;
								}
								if(this.shiftRow >= this.activeRow) {
									this.addRowToSelection(rowIndex);
								} else {
									this.removeRowFromSelection(activeRow);
								}
							}
							noDefault = true;
							this.setActiveRow(rowIndex);
						} else {
							//this.grid.getBody().showRow("up");
						}
					}
					break;
				case _edtKey.DOWN:
					if (this.inFocus && activeRow != null) {
						rowIndex = (activeRow + 1) % this.rowCount;
						if(this.firstIndex != rowIndex) {
							if (!event.ctrlKey && !event.shiftKey) {
								this.selectionFlag = "x";
								range = [rowIndex, rowIndex];
								this.setSelection(range);
							} else if (!event.ctrlKey && event.shiftKey
							             && this.options.selectionMode == "multi") {
								if(!this.shiftRow) {
									this.shiftRow = this.activeRow;
								}
								if(this.shiftRow <= this.activeRow) {
									this.addRowToSelection(rowIndex);
								} else {
									this.removeRowFromSelection(activeRow);
								}
							}
							noDefault = true;
							this.setActiveRow(rowIndex);
						} else {
							//this.grid.getBody().showRow("down");
						}
					}
					break;
				case 65: case 97:								// Ctrl-A
					if (this.inFocus && event.ctrlKey && !event.altKey
							&& this.options.selectionMode == "multi") {
						this.selectionFlag = "a";
						for (var i = 0; i <  this.rowCount; i++) {
							this.addRowToSelection(i);
						}
						noDefault = true;
					}
					break;
				case _edtKey.TAB:
					this.lostFocus();
			}
			if (noDefault) {
				this.dataTable.showRow(this.activeRow);
				this.selectionChanged(event);
				if (event.preventBubble) event.preventBubble();
				_edtStopEvent(event);
			}
		}
	},

	/*
		Modified method:
		Component supports three selection modes:
		none - no selection allowed
		single - only one row can be selected at a time (no ctrl or shift)
		multi - normal full-featured selection mode
	*/
	processClick: function(event, rowIndex) {
		if (this.options.selectionMode == "none") {
			return;
		}

		var bSingleSelection = this.options.selectionMode == "single";

		if(!event.shiftKey) {
			this.shiftRow = null;
		}
		var range;

		if ( event.shiftKey && !event.ctrlKey && !bSingleSelection && !event.altKey) {
            var arr = document.getElementById(this.prefix + ":n").rows[0].id.split(":");
            this.firstIndex = Number(arr[arr.length-1]);
			this.selectionFlag = "x";
			if(!this.shiftRow) {
				this.shiftRow = this.activeRow;
			}
			this.startRow = this.shiftRow;
			if (((this.startRow <= rowIndex) && (this.firstIndex <= this.startRow || rowIndex < this.firstIndex))
				|| (this.startRow > rowIndex && this.firstIndex < this.startRow && rowIndex <= this.firstIndex)) {
				this.endRow = rowIndex;
			} else {
				this.endRow = this.startRow;
				this.startRow = rowIndex;
			}
			if(this.startRow > this.endRow) { //bugfix
				//without this selection of first row with shift was broken
				var t = this.startRow;
				this.startRow = this.endRow;
				this.endRow = t;
			}
			range = [this.startRow, this.endRow];
			this.setSelection(range);
		} else if (!event.shiftKey &&  event.ctrlKey && !event.altKey) {
			if (this.selection.isSelectedId(rowIndex)) {
				this.removeRowFromSelection(rowIndex);
			} else {
				if (!bSingleSelection || this.selection.size() == 0) {
					this.addRowToSelection(rowIndex);
				}
			}
		} else  if (!event.shiftKey && !event.ctrlKey && !event.altKey) {
			this.selectionFlag = "x";
			range = [rowIndex, rowIndex];
			this.setSelection(range);
		}
		this.setActiveRow(rowIndex);
		if (event.shiftKey) {
			if (window.getSelection) {
				window.getSelection().removeAllRanges();
			} else if (document.selection) {
				document.selection.empty();
			}
		}
		this.selectionChanged(event);
	},

	/**
	   Changes the saved state of the selection and fires
	   the onselectionchange event if selection is changed.
	   The function that is passed as onselectionchange event
	   accepts an event parameter that contains both old and new selections
	*/
	selectionChanged: function(event) {
		document.getElementById(this.inputElement).value = this.selection.inspectRanges()
		                                 + this.activeRow + ";"
		                                 + (this.selectionFlag ? this.selectionFlag : "");
		var state = this.selection.getState();
		event.oldSelection = this.oldState;
		event.newSelection = state; //save the new state for processing
		if(this.onselectionchange //event is defined
		        && this.selection.isChanged(this.oldState, state)) { //selection actualy changed
		    this.onselectionchange(event);
		}
		this.oldState = state; //remember current state
	},

	setShiftRow: function(event) {
		if(event.shiftKey) {
			if(!this.shiftRow) {
				this.shiftRow = this.activeRow;
			}
		} else {
			this.shiftRow = null;
		}
	},

	setSelection: function(range) {
		//TODO test for extreemes - first rows, last rows, all rows
		var l = this.selection.ranges.length;
		for(var i = l - 1;i >= 0; i--) {
			var selection = this.selection.ranges[i].indexes;
			if(selection == range) {
				continue;
			}
			var j = selection[0];
			for(j;j <= selection[1];j++) {
				this.removeRowFromSelection(j);
			}
		}
		if(range[0] == range[1]) {
		  this.addRowToSelection(range[0]);
		  return;
		}
		var i = range[0];
		if((range[1] != this.rowCount-1)&& this.rowCount > 1){
			range[1] = (range[1] + 1) % this.rowCount;
		}
		while (i != range[1]) {
			this.addRowToSelection(i);
			i = (i + 1) % this.rowCount;
		}
		if((range[1] == this.rowCount-1)&& this.rowCount > 1){
			this.addRowToSelection(this.rowCount-1);
		}
	},

	resetSelection: function(e) {
		if(e.shiftKey) {
			document.selection.empty();
		}
	},

	addRowToSelection: function(rowIndex) {
		this.selection.addId(rowIndex);
		var nElement = document.getElementById(this.prefix + ":n:" + rowIndex);
		_edtAddClass(nElement, "extdt-row-selected");
		_edtAddClass(nElement, "rich-sdt-row-selected");
		_edtAddClass(nElement, this.selectedClass);
	},

	removeRowFromSelection: function(rowIndex) {
		this.selection.removeId(rowIndex);
		var nElement = document.getElementById(this.prefix + ":n:" + rowIndex);
		_edtRemoveClass(nElement, "extdt-row-selected");
		_edtRemoveClass(nElement, "rich-sdt-row-selected");
		_edtRemoveClass(nElement, this.selectedClass);
	},

	setActiveRow: function(rowIndex) {
		var fElement, nElement;
		if(this.activeRow != null) {
			nElement = document.getElementById(this.prefix + ":n:" + this.activeRow);
			_edtRemoveClass(nElement, "extdt-row-active");
			_edtRemoveClass(nElement, "rich-sdt-row-active");
			_edtRemoveClass(nElement, this.activeClass);
		}
		nElement = document.getElementById(this.prefix + ":n:" + rowIndex);
		_edtAddClass(nElement, "extdt-row-active");
		_edtAddClass(nElement, "rich-sdt-row-active");
		_edtAddClass(nElement, this.activeClass);
		this.activeRow = rowIndex;
	}
});
