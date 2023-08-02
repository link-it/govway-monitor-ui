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
 * Modificato da Link.it (https://link.it) per applicazione patch di sicurezza
 * 
 * Copyright (c) 2022-2023 Link.it srl (https://link.it). 
 */
package org.richfaces.renderkit;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.faces.component.UIComponent;
import javax.faces.component.UIParameter;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;

import org.ajax4jsf.javascript.JSFunction;
import org.ajax4jsf.javascript.ScriptUtils;
import org.ajax4jsf.renderkit.AjaxRendererUtils;
import org.ajax4jsf.renderkit.RendererUtils;
import org.ajax4jsf.renderkit.RendererUtils.HTML;
import org.richfaces.component.UISwitchablePanel;
import org.richfaces.component.UITab;
import org.richfaces.component.UITabPanel;
import org.richfaces.component.util.HtmlUtil;


/**
 * @author Nick Belaevski - nbelaevski@exadel.com
 *         created 12.01.2007
 */
public class TabHeaderRendererBase extends org.ajax4jsf.renderkit.HeaderResourcesRendererBase {

    private static final String LABEL_SUFFIX = "_lbl";

    protected Class<? extends UIComponent> getComponentClass() {
        return UITab.class;
    }
    
    // find and encode UIParameter's components
    //TODO generify
    //TODO move the code to utils
    public List<String> encodeParams(FacesContext context, UITab component) throws IOException {
    	
    	UITab menuItem = component;
    	List<String> params = new ArrayList<String>();
    	//TODO use StringBuilder
    	StringBuffer buff = new StringBuffer();
    	
    	//TODO use getChildCount() > 0
    	List<UIComponent> children = menuItem.getChildren();
    	for (Iterator<UIComponent> iterator = children.iterator(); iterator.hasNext();) {
    		UIComponent child = iterator.next();
	
    		if(child instanceof UIParameter){
					
    			UIParameter param = (UIParameter)child;
				String name = param.getName();
				
				if (name != null) {
					
					Object value = param.getValue();
					buff.append("_params[");
					buff.append(ScriptUtils.toScript(name));
					buff.append("] = ");
					buff.append(ScriptUtils.toScript(value));
					buff.append(";");
					
					//TODO ???
					params.add(buff.toString());

					buff.setLength(0);
				}
			}
    	}
    	
    	return params;
  	}	
    
    public void encodeTabLabel(FacesContext context, UITab tab) throws IOException {
        ResponseWriter writer = context.getResponseWriter();

        String label = tab.getLabel();

        if (label == null) {
            label = "";
        }

        String clientId = tab.getClientId(context);
        
        String cssId = RendererUtils.getCssId(clientId);
        String cssClassName = cssId + "-shifted-style";
        
        writer.writeAttribute(HTML.class_ATTRIBUTE, cssClassName, null);
    }

	public String getOnClickEventHandler(FacesContext context, UITab tab) throws IOException {
		String script = "";
		boolean disabled = tab.isDisabled();
		UITabPanel pane = tab.getPane();
		String method = tab.getSwitchTypeOrDefault();
        boolean ajax = UISwitchablePanel.AJAX_METHOD.equals(method);
        boolean clientSide = UISwitchablePanel.CLIENT_METHOD.equals(method);
        String clientId = tab.getClientId(context);
		
        if (!disabled) {
        	StringBuffer sb = new StringBuffer();
            if (clientSide) {
                sb.append("if (RichFaces.onTabChange(event, '");
				sb.append(pane.getClientId(context));
				sb.append("','");
				sb.append(clientId);
				sb.append("')) RichFaces.switchTab('");
				sb.append(pane.getClientId(context));
				sb.append("','");
				sb.append(clientId);
				sb.append("','");
				sb.append(getUtils().formatValue(context, pane, tab.getName()));
				sb.append("');");
            } else {
                String activeCheck = "if (RichFaces.isTabActive('" + clientId + LABEL_SUFFIX + "')) return false;";
                String eventCheck = " if (!RichFaces.onTabChange(event, '"+pane.getClientId(context)+"','"+clientId+"')) return false;";
                
                if (ajax) {
                    JSFunction function = AjaxRendererUtils.buildAjaxFunction(tab, context);
                    Map<String,Object> eventOptions = AjaxRendererUtils.buildEventOptions(context, tab, true);
                    function.addParameter(eventOptions);
                    
                    //TODO remove this.onclick = null
                    sb.append(activeCheck);
                    sb.append(eventCheck);
                    function.appendScript(sb);
                    sb.append("; return false; this.onclick = null;");
//                    String script = buffer.toString();
//                    writer.writeAttribute(HTML.onclick_ATTRIBUTE, activeCheck + eventCheck +  script, null);
                } else /* TODO if server */ {
                	sb.append(activeCheck);
                    sb.append(eventCheck);
                    
                	sb.append("var _formName = A4J.findForm(this).id; var _paramName = '" + clientId + "_server_submit'; var _params = new Object(); _params[_paramName] = _paramName; ");
                    List<String> params = encodeParams(context, tab);
                    
                    for (Iterator<String> iterator = params.iterator(); iterator.hasNext();) {
						sb.append(iterator.next());
					}
                    
                    sb.append("_JSFFormSubmit('");
                    sb.append(clientId);
                    sb.append("', _formName, null, _params);");
                    //TODO remove this.onclick = null
                    sb.append("this.onclick = null; _clearJSFFormParameters(_formName, null, [_paramName]);");

//                    writer.writeAttribute(HTML.onclick_ATTRIBUTE, activeCheck + eventCheck + script.toString()
//                            /* "RichFaces.submitTab(this,'"+clientId + "_inp" +"','"+pane.getClientId(context)+"');"*/, null);
                }
            }
            
            script = sb.toString();
        }
        
        return script;
	}
    
    public void encodeTabLabelClass(FacesContext context, UITab tab) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        
        String clientId = tab.getClientId(context);
        
        String defShift = tab.isActive() ? "position:relative; top:1px;" : "position:relative;";
        String componentStyle = (String) tab.getAttributes().get("style");
        String style = defShift + (componentStyle != null ? componentStyle : "");
        
        String width = tab.getLabelWidth();
        
        style += ";height : 100%; ";
        if (width != null) {
            //TODO use qualifySize
            style += " width: " + getUtils().encodePctOrPx(width) + ";";
        }

        String cssId = RendererUtils.getCssId(clientId);
        String cssClassName = cssId + "-shifted-style";
        String finalClass = "." + cssClassName + " {" + style + "}";
        
        writer.writeText(finalClass, null);
    }

    //TODO review
    public boolean getRendersChildren() {
        return true;
    }

    public void encodeCellClasses(FacesContext context, UITab tab) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        String labelClass;
        if (tab.isDisabled()) {
            labelClass = TabPanelRendererBase.DISABLED_CELL_CLASSES;
        } else {
            if (tab.isActive()) {
                labelClass = TabPanelRendererBase.ACTIVE_CELL_CLASSES;
            } else {
                labelClass = TabPanelRendererBase.INACTIVE_CELL_CLASSES;
            }
        }
        String clientId = tab.getClientId(context);
        String cssId = RendererUtils.getCssId(clientId);
        labelClass = labelClass + " " + cssId + "-tab-cell-td-style";

        writer.writeAttribute(HTML.class_ATTRIBUTE, labelClass, null);
    }

    public void writeLabel(FacesContext context, UITab tab) throws IOException {
        ResponseWriter writer = context.getResponseWriter();

        String labelClass = "";
        if (tab.isDisabled()) {
            labelClass = TabPanelRendererBase.getDisabledTabClass(tab);
        } else {
            if (tab.isActive()) {
                labelClass = TabPanelRendererBase.getActiveTabClass(tab);
            } else {
                labelClass = TabPanelRendererBase.getInactiveTabClass(tab);
            }
        }
        writer.writeAttribute(HTML.class_ATTRIBUTE, labelClass, "tabClass");
        String title = tab.getTitle();
        if (title != null && title.length() != 0) {
            writer.writeAttribute(HTML.title_ATTRIBUTE, title, null);
        }
        
        //TODO make "label" constant
        UIComponent facet = tab.getFacet("label");

        if (facet != null && facet.isRendered()) {
            renderChild(context, facet);
        } else {
            String label = tab.getLabel();

            if (label == null || label.length() == 0) {
        	//TODO to constant
        	label = "&#160;";
        	writer.write(label);
            }else{
        	writer.writeText(label,null);
            }

        }
        
    }
    
    /**
     *   writer.writeAttribute(HTML.onmouseover_ATTRIBUTE, ONMOUSEOVER, "tabOnMouseOver");
            writer.writeAttribute(HTML.onmouseout_ATTRIBUTE, ONMOUSEOUT, "tabOnMouseOut");
       onclick="#{component.attributes['onlabelclick']}"
								onkeypress="#{component.attributes['onlabelkeypress']}"
								ondblclick="#{component.attributes['onlabeldblclick']}"
								onkeyup="#{component.attributes['onlabelkeyup']}"
								onkeydown="#{component.attributes['onlabelkeydown']}"
								onmousedown="#{component.attributes['onlabelmousedown']}"
								onmouseup="#{component.attributes['onlabelmouseup']}"
								onmousemove="#{component.attributes['onlabelmousemove']}"
     */
    public String getLabelEventsHandler(FacesContext context, UITab tab) throws IOException {
    	StringBuffer sb = new StringBuffer();
    	String tag = "td";
    	String clientId = tab.getClientId(context) + "_lbl";
    	
    	// writer.writeAttribute(HTML.onmouseover_ATTRIBUTE, ONMOUSEOVER, "tabOnMouseOver");
    	sb.append("jQuery(\""+tag+"[id$='"+clientId+"']\")."+"mouseover"+"(function() {");
		sb.append(ONMOUSEOVER);
		sb.append("});");
//		sb.append("\n");
    	
    	// writer.writeAttribute(HTML.onmouseout_ATTRIBUTE, ONMOUSEOUT, "tabOnMouseOut");
		sb.append("jQuery(\""+tag+"[id$='"+clientId+"']\")."+"mouseout"+"(function() {");
		sb.append(ONMOUSEOUT);
		sb.append("});");
//		sb.append("\n");
    	
    	// onclick="#{component.attributes['onlabelclick']}"
		addEvent(tab, sb, tag, clientId, "onlabelclick", "click");
    	
    	// onkeypress="#{component.attributes['onlabelkeypress']}"
		addEvent(tab, sb, tag, clientId, "onlabelkeypress", "keypress");
    	
    	// ondblclick="#{component.attributes['onlabeldblclick']}"
		addEvent(tab, sb, tag, clientId, "onlabeldblclick", "dblclick");
    	
    	// onkeyup="#{component.attributes['onlabelkeyup']}"
		addEvent(tab, sb, tag, clientId, "onlabelkeyup", "keyup");
    	
    	// onkeydown="#{component.attributes['onlabelkeydown']}"
		addEvent(tab, sb, tag, clientId, "onlabelkeydown", "keydown");
    	
    	// onmousedown="#{component.attributes['onlabelmousedown']}"
		addEvent(tab, sb, tag, clientId, "onlabelmousedown", "mousedown");
    	
    	// onmouseup="#{component.attributes['onlabelmouseup']}"
		addEvent(tab, sb, tag, clientId, "onlabelmouseup", "mouseup");
    	
    	// onmousemove="#{component.attributes['onlabelmousemove']}"
		addEvent(tab, sb, tag, clientId, "onlabelmousemove", "mousemove");
    	
    	return sb.toString();
    }

	private void addEvent(UITab tab, StringBuffer sb, String tag, String clientId, String attribute,
			String jQueryEvent) {
		Object event = tab.getAttributes().get(attribute);
    	if(null != event){
		    sb.append("jQuery(\""+tag+"[id$='"+clientId+"']\")."+jQueryEvent+"(function() {");
			sb.append(event);
			sb.append("});");
//			sb.append("\n");
	    }
	}

    protected String encodeTabLabelWidth(FacesContext context, UITab tab) {
        String labelWidth = tab.getLabelWidth();
        if (labelWidth == null || labelWidth.trim().length() == 0) {
            return "";
        }

        return "width: " + HtmlUtil.qualifySize(labelWidth) + ";";
    }

    public String encodeHeaderSpacing(FacesContext context, UITab tab) throws IOException {
        UITabPanel pane = tab.getPane();
        String headerSpacing = pane.getHeaderSpacing();
        return "width: " + HtmlUtil.qualifySize(headerSpacing) + "; ";
    }

    private static final String ONMOUSEOVER = "RichFaces.overTab(this);";
    private static final String ONMOUSEOUT = "RichFaces.outTab(this);";
}
