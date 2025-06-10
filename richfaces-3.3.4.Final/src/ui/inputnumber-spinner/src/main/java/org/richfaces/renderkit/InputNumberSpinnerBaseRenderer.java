/**
 * License Agreement.
 *
 *  JBoss RichFaces - Ajax4jsf Component Library
 *
 * Copyright (C) 2007  Exadel, Inc.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License version 2.1 as published by the Free Software Foundation.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301  USA
 */
/*
 * Modificato da Link.it (https://link.it) per applicazione patch di sicurezza e migrazione a jakarta EE
 * 
 * Copyright (c) 2022-2025 Link.it srl (https://link.it). 
 */

package org.richfaces.renderkit;

import javax.faces.context.FacesContext;

import org.richfaces.component.UIInputNumberSpinner;

/**
 * @author Giuliano Pintori
 * @since 3.3.4
 * InputNumberSpinner Base renderer implementation
 *  	
 */
public class InputNumberSpinnerBaseRenderer extends org.richfaces.renderkit.InputRendererBase {

	/**
	 * id="#{clientId}"
	     onclick="#{component.attributes['onclick']}"
					ondblclick="#{component.attributes['ondblclick']}"
					onmousedown="#{component.attributes['onmousedown']}"
					onmousemove="#{component.attributes['onmousemove']}"
					onmouseout="#{component.attributes['onmouseout']}"
					onmouseover="#{component.attributes['onmouseover']}"
					onmouseup="#{component.attributes['onmouseup']}"
	 * @param context
	 * @param component
	 * @return
	 */
	public String getTableEventHandlersScript(FacesContext context, UIInputNumberSpinner component) {
		StringBuffer sb = new StringBuffer();
		
		String clientId = component.getClientId(context);
		sb.append("jQuery(document).ready(function() {");
		
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "onclick", "click", "table"));
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "ondblclick", "dblclick", "table"));
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "onmousedown", "mousedown", "table"));
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "onmousemove", "mousemove", "table"));
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "onmouseout", "mouseout", "table"));
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "onmouseover", "mouseover", "table"));
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "onmouseup", "mouseup", "table"));
		
		sb.append("});");
		return sb.toString();
	}
	
	/**
	 * id="#{clientId}Input"
	     onchange="#{component.attributes['onchange']}" 
					onselect="#{component.attributes['onselect']}" 
					onfocus="#{component.attributes['onfocus']}"
					onblur="#{component.attributes['onblur']}"
					onclick='#{component.attributes["oninputclick"]}'
					ondblclick='#{component.attributes["oninputdblclick"]}'
					onkeydown='#{component.attributes["oninputkeydown"]}'
					onkeypress='#{component.attributes["oninputkeypress"]}'
					onkeyup='#{component.attributes["oninputkeyup"]}'
					
					onmousedown='#{component.attributes["oninputmousedown"]}'
					onmousemove='#{component.attributes["oninputmousemove"]}'
					onmouseout='#{component.attributes["oninputmouseout"]}'
					onmouseover='#{component.attributes["oninputmouseover"]}'
					onmouseup='#{component.attributes["oninputmouseup"]}'
	 * @param context
	 * @param component
	 * @return
	 */
	public String getInputEventHandlersScript(FacesContext context, UIInputNumberSpinner component) {
		StringBuffer sb = new StringBuffer();
		
		String clientId = component.getClientId(context) + "Input";
		sb.append("jQuery(document).ready(function() {");
		
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "onchange", "change", "input"));
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "onselect", "select", "input"));
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "onfocus", "focus", "input"));
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "onblur", "blur", "input"));
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "oninputclick", "click", "input"));
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "oninputdblclick", "dblclick", "input"));
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "oninputkeydown", "keydown", "input"));
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "oninputkeypress", "keypress", "input"));
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "oninputkeyup", "keyup", "input"));
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "oninputmousedown", "mousedown", "input"));
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "oninputmousemove", "mousemove", "input"));
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "oninputmouseout", "mouseout", "input"));
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "oninputmouseover", "mouseover", "input"));
		sb.append(getUtils().getScriptContentForEventHandler(context, component, clientId, "oninputmouseup", "mouseup", "input"));
		
		sb.append("});");
		return sb.toString();
	}
}
