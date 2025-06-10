/**
 * 
 */
/*
 * Modificato da Link.it (https://link.it) per applicazione patch di sicurezza e migrazione a jakarta EE
 * 
 * Copyright (c) 2022-2025 Link.it srl (https://link.it). 
 */
package org.richfaces.validator;

import java.util.Collection;
import java.util.Set;

import javax.faces.context.FacesContext;

/**
 * @author asmirnov
 *
 */
public class NullValidator extends ObjectValidator {

	/* (non-Javadoc)
	 * @see org.richfaces.validator.ObjectValidator#validate(java.lang.Object, java.lang.String, java.lang.Object, java.util.Locale)
	 */
	@Override
	protected Collection<String> validate(FacesContext facesContext, Object base, String property,
			Object value, Set<String> profiles) {
		// do nothing.
		return null;
	}

	/* (non-Javadoc)
	 * @see org.richfaces.validator.ObjectValidator#validateGraph(javax.faces.context.FacesContext, java.lang.Object, java.util.Set)
	 */
	@Override
	public Collection<String> validateGraph(FacesContext context, Object value,
			Set<String> profiles) {
		// do nothing
		return null;
	}

}
