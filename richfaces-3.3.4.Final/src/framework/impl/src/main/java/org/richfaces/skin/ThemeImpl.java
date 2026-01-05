/**
 * 
 */
/*
 * Modificato da Link.it (https://link.it) per applicazione patch di sicurezza e migrazione a jakarta EE
 * 
 * Copyright (c) 2022-2026 Link.it srl (https://link.it). 
 */
package org.richfaces.skin;

import java.util.Properties;

import jakarta.el.ValueExpression;
import javax.faces.context.FacesContext;

/**
 * @author asmirnov
 *
 */
public class ThemeImpl implements Theme {
	
	private final Properties themeProperties;

	/**
	 * @param themeProperties
	 */
	public ThemeImpl(Properties themeProperties) {
		this.themeProperties = themeProperties;
	}

	/* (non-Javadoc)
	 * @see org.richfaces.skin.Theme#getProperty(java.lang.String)
	 */
	public Object getProperty(String name) {
		Object property = themeProperties.get(name);
		if (property instanceof ValueExpression) {
			ValueExpression ve = (ValueExpression) property;
			property = ve.getValue(FacesContext.getCurrentInstance().getELContext());
		}
		return property;
	}

	/* (non-Javadoc)
	 * @see org.richfaces.skin.Theme#getRendererType()
	 */
	public String getRendererType() {
		return (String) getProperty("rendererType");
	}

	/* (non-Javadoc)
	 * @see org.richfaces.skin.Theme#getScript()
	 */
	public String getScript() {
		return (String) getProperty("script");
	}

	/* (non-Javadoc)
	 * @see org.richfaces.skin.Theme#getStyle()
	 */
	public String getStyle() {
		return (String) getProperty("styleSheet");
	}

}
