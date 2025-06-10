/**
 * 
 */
/*
 * Modificato da Link.it (https://link.it) per applicazione patch di sicurezza e migrazione a jakarta EE
 * 
 * Copyright (c) 2022-2025 Link.it srl (https://link.it). 
 */
package org.richfaces.renderkit.html;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;

import org.ajax4jsf.renderkit.RendererBase;
import org.ajax4jsf.renderkit.RendererUtils;
import org.ajax4jsf.renderkit.RendererUtils.HTML;
import org.richfaces.component.LayoutPosition;
import org.richfaces.component.LayoutStructure;
import org.richfaces.component.UILayoutPanel;

/**
 * @author asmirnov
 * 
 */
public class LayoutPanelRenderer extends RendererBase {
	private static final Object[] LAYOUT_EXCLUSIONS = { HTML.id_ATTRIBUTE,
			HTML.style_ATTRIBUTE };
	
	private String uuid;
	
	public String getUuid() {
		if(uuid == null) {
			uuid = UUID.randomUUID().toString().replace("-", "");
		}
		
		return uuid;
	}

	@Override
	protected void doEncodeBegin(ResponseWriter writer, FacesContext context,
			UIComponent component) throws IOException {
		writer.startElement(HTML.DIV_ELEM, component);
		getUtils().encodeCustomId(context, component);
		getUtils().encodePassThruWithExclusionsArray(context, component,
				LAYOUT_EXCLUSIONS);
		String layoutStyle = layoutStyle(context, (UILayoutPanel) component);
		if (null != layoutStyle) {
			writer.writeAttribute(HTML.class_ATTRIBUTE, "css-" + getUuid(), null);
//			writer.writeAttribute(HTML.style_ATTRIBUTE, layoutStyle, "style");
		}
	}

	public String layoutStyle(FacesContext context, UILayoutPanel panel) {
		StringBuilder style = new StringBuilder();
		LayoutPosition position = panel.getPosition();
		Map<String, Object> requestMap = context.getExternalContext().getRequestMap();
		Object parentLayout = requestMap.get(LayoutRenderer.LAYOUT_STRUCTURE_ATTRIBUTE);
		LayoutStructure structure;
		if (null != parentLayout && parentLayout instanceof LayoutStructure) {
			structure = (LayoutStructure) parentLayout;			
		} else {
			structure = new LayoutStructure(panel);
			structure.calculateWidth();
		}
		Object componentStyle = panel.getAttributes().get(HTML.style_ATTRIBUTE);
		if (null != componentStyle) {
			style.append(componentStyle).append(";");
		}
		if (!LayoutPosition.top.equals(position)
				&& !LayoutPosition.bottom.equals(position)) {
			if (LayoutPosition.right.equals(position)) {
				style.append("float:right;");
			} else {
				style.append("float:left;");
			}
			// calculate real width.
			float coef = 1.0f-((float)structure.getDeep()/100.00f);
			String width = structure.getWidth(panel,coef);
			 if(null != width){
			 style.append("width:").append(width).append(";");
			 coef = coef*0.95f;
			 width = structure.getWidth(panel,coef);;
			 style.append("*width:").append(width).append(";");
			 }
		} else {
			// top and buttom style.
		}
		return style.length() > 0 ? style.toString() : null;
	}

	@Override
	protected void doEncodeEnd(ResponseWriter writer, FacesContext context,
			UIComponent component) throws IOException {
		writer.endElement(HTML.DIV_ELEM);
		
		String layoutStyle = layoutStyle(context, (UILayoutPanel) component);
		if (null != layoutStyle) {
//			writer.writeAttribute(HTML.style_ATTRIBUTE, layoutStyle, "style");

			writer.startElement(HTML.STYLE_ELEM, component);
			writer.writeAttribute(HTML.TYPE_ATTR, "text/css", null);
			String cspValue = RendererUtils.getCspNonceValue(context);
			if(cspValue != null) {
				writer.writeAttribute(HTML.nonce_ATTRIBUTE, cspValue, null);
			}
			StringBuilder sb = new StringBuilder();
			sb.append(".").append("css-").append(getUuid()).append(" {\n").append(layoutStyle).append(";\n").append("zoom:1;\n").append("}\n");
			
			writer.writeText(sb.toString(), null);
			writer.endElement(HTML.STYLE_ELEM);
		}
	}

	@Override
	protected Class<? extends UIComponent> getComponentClass() {
		return UILayoutPanel.class;
	}
}
