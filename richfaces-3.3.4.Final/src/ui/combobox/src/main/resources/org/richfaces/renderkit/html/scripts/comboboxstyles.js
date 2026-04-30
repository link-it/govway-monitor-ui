/*
 * Modificato da Link.it (https://link.it):
 *   - Class.create() -> costruttore plain.
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if (!window.Richfaces) window.Richfaces = {};

function _RichfacesComboBoxStyles() { this.initialize.apply(this, arguments); }
Richfaces.ComboBoxStyles = _RichfacesComboBoxStyles;

_RichfacesComboBoxStyles.prototype = {
	
	initialize : function () {
		this.commonStyles =	{
			
			button : { classes : {
						normal : "rich-combobox-font-inactive rich-combobox-button-icon-inactive rich-combobox-button-inactive", 
						active : "rich-combobox-font rich-combobox-button-icon rich-combobox-button", 
						disabled : "rich-combobox-font-disabled rich-combobox-button-icon-disabled rich-combobox-button-disabled",
						hovered : "rich-combobox-button-hovered"},
						
				   style : {
						normal: "",
					 	active: "",
						disabled: ""}
				 },	 







		
		buttonbg : {
			classes : { 
				normal:"rich-combobox-font-inactive rich-combobox-button-background-inactive rich-combobox-button-inactive", 
				active: "rich-combobox-font rich-combobox-button-background rich-combobox-button",
				disabled : "rich-combobox-font-disabled rich-combobox-button-background-disabled rich-combobox-button-disabled"}
			},    
			
		buttonicon : {style : {
						normal: "",
						active: "",
						disabled: ""}
					 },	 	                 	 	   		   	  

		
		field : {classes: {
					normal : "rich-combobox-font-inactive rich-combobox-input-inactive", 
					active : "rich-combobox-font rich-combobox-input", 
					disabled : "rich-combobox-font-disabled rich-combobox-input-disabled"
			 	},
			 	
				 style : {
					normal : "",
					active : "",
					disabled : ""
				}
		},	
			
		combolist : {
			list : {
				classes :{
					active : "rich-combobox-list-cord rich-combobox-list-scroll rich-combobox-list-decoration rich-combobox-list-position"},
					style : {active: ""






					}
			},  	  		 	  
				
			item : {normal : "rich-combobox-item", 
				selected : "rich-combobox-item rich-combobox-item-selected"
			}
		}
		
		
		
		
		
		}	
	},
	
	getCommonStyles : function() {
		return this.commonStyles;
	}
	

};



