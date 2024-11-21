/**
 * 
 */
/*
 * Modificato da Link.it (https://link.it) per applicazione patch di sicurezza e migrazione a jakarta EE
 * 
 * Copyright (c) 2022-2024 Link.it srl (https://link.it). 
 */
package org.richfaces.skin;

/**
 * @author asmirnov
 *
 */
public interface Theme {
	
	public String getRendererType();
	
	public String getStyle();
	
	public String getScript();
	
	public Object getProperty(String name);

}
