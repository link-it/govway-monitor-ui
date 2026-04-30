/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM:
 *     Class.create()  -> costruttore + .prototype plain
 *     $(id)           -> document.getElementById(id)
 *     $H($A({}))      -> oggetto plain usato come mappa panelId -> instance
 *     hash.merge/get  -> assegnazione/accesso diretto
 *     Element.show/hide -> classList.add/remove (preesistente, ora unico path)
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

function SimpleTogglePanel(panelId, status, options) {
	this.initialize(panelId, status, options);
}

SimpleTogglePanel.prototype = {
	initialize: function(panelId, status, options) {

		this.panelId = panelId;
		this.panelId_head = panelId+"_header";
		this.options = options;
	   	this.status = status;

		if (!this.status) {
			this.status="true";
		}

	},

	toggleToState: function(event) {
		var body = document.getElementById(this.panelId+"_body");
		var switch_on = document.getElementById(this.panelId+"_switch_on");
		var switch_off = document.getElementById(this.panelId+"_switch_off");
		if (this.status=="false"){
			 if (this.invokeEvent("expand",event,"false",body)) {
				body.classList.remove("rich-stglpanel-body-display-none");
				body.classList.add("rich-stglpanel-body-display");
	         	this.status="true";
	         	switch_off.classList.remove("rich-stglpnl-marker-display");
	         	switch_on.classList.remove("rich-stglpnl-marker-display-none");
	         	switch_off.classList.add("rich-stglpnl-marker-display-none");
	         	switch_on.classList.add("rich-stglpnl-marker-display");
			 }
	    } else if (this.invokeEvent("collapse",event,"true",body)) {
	  		 body.classList.remove("rich-stglpanel-body-display");
			 body.classList.add("rich-stglpanel-body-display-none");
             this.status="false";
             switch_on.classList.remove("rich-stglpnl-marker-display");
           	 switch_off.classList.remove("rich-stglpnl-marker-display-none");
         	 switch_on.classList.add("rich-stglpnl-marker-display-none");
         	 switch_off.classList.add("rich-stglpnl-marker-display");
        }

	    if (RichFaces.navigatorType() == RichFaces.MSIE){
		    }
		var paneInput = document.getElementById(this.panelId+"_input");
		if (paneInput) {
			paneInput.value=this.status;
		}
	},

	 invokeEvent: function(eventName, event, value, element) {

		var eventFunction = this.options['on'+eventName];
		var result;

		if (eventFunction)
		{
			var eventObj;

			if (event)
			{
				eventObj = event;
			}
			else if( document.createEventObject )
			{
				eventObj = document.createEventObject();
			}
			else if( document.createEvent )
			{
				eventObj = document.createEvent('Events');
				eventObj.initEvent( eventName, true, false );
			}

			eventObj.rich = {component:this};
			eventObj.rich.value = value;

			try {
				result = eventFunction.call(element, eventObj);
			} catch (e) {
				LOG.warn("Exception: "+e.Message + "\n[on"+eventName + "]");
			}

		}

		if (result!=false) result = true;

		return result;
	}
}

var SimpleTogglePanelManager = {};

SimpleTogglePanelManager.panels = {};

SimpleTogglePanelManager.add = function(value) {
    this.panels[value.panelId] = value;
}

SimpleTogglePanelManager.toggleOnServer = function (event,clientId) {
	var parentForm = A4J.findForm(document.getElementById(clientId + "_header"));
	if(!parentForm || !parentForm.appendChild /* findForm returns surrogate form object */) return;

	var thePanel = this.panels[clientId];
	var element = document.getElementById(clientId);

	if (thePanel.status == "true") {
		if (thePanel.invokeEvent("collapse",event,"true",element)) {
			thePanel.status="false";
		}
	} else {
		if (thePanel.invokeEvent("expand",event,"false",element)) {
			thePanel.status="true";
		}
	}

	var params = {};
	params[clientId] = thePanel.status;
	_JSFFormSubmit(null, parentForm, null, params);

	return false;
}

SimpleTogglePanelManager.toggleOnClient = function (event,panelId) {
	this.panels[panelId].toggleToState(event);
	return false;
}

SimpleTogglePanelManager.toggleOnAjax = function(event,panelId) {
	var element = document.getElementById(panelId);
	var body = document.getElementById(panelId+"_body");
	var thePanel = this.panels[panelId];
	if (thePanel.status == "true") {
		var res = thePanel.invokeEvent("collapse",event,"true",element);
		body.classList.remove("rich-stglpanel-body-display");
		body.classList.add("rich-stglpanel-body-display-none");
		return res
	} else {
		var res = thePanel.invokeEvent("expand",event,"false",element);
		body.classList.remove("rich-stglpanel-body-display-none");
		body.classList.add("rich-stglpanel-body-display");
		return res
	}
}
