/**
 * 
 */
/*
 * Modificato da Link.it (https://link.it) per applicazione patch di sicurezza e migrazione a jakarta EE
 * 
 * Copyright (c) 2022-2026 Link.it srl (https://link.it). 
 */
package org.richfaces.component;

/**
 * Stage class to keep backward compatibility.
 * @author asmirnov
 * @deprecated That class has been renamed, Use {@link UIAjaxValidator} instead
 *
 */
public abstract class UIBeanValidator extends UIAjaxValidator {

	/* (non-Javadoc)
	 * @see javax.faces.component.UIComponent#getFamily()
	 */
	@Override
	public String getFamily() {
		return COMPONENT_FAMILY;
	}


}
