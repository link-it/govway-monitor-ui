/*
 * Modificato da Link.it (https://link.it) per applicazione patch di sicurezza e migrazione a jakarta EE
 * 
 * Copyright (c) 2022-2024 Link.it srl (https://link.it). 
 */
package org.richfaces.helloworld.service;

import javax.ejb.Local;

@Local
public interface Manager {
	public String sayHello();
}
