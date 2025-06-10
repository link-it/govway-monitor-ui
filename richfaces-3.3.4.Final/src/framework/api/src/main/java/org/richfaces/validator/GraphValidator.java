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

import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.validator.Validator;
import javax.faces.validator.ValidatorException;

/**
 * This interface should be implemented by the JSF {@link Validator} which able to
 * validate entire graph.
 * @author asmirnov
 *
 */
public interface GraphValidator {
	
	public Collection<String> validateGraph(FacesContext context, UIComponent component, Object value,
			Object profiles)  throws ValidatorException ;

}
