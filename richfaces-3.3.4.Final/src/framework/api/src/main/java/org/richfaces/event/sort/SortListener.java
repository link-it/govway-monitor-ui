/*
 *  Copyright
 *      Copyright (c) Exadel,Inc. 2006
 *      All rights reserved.
 *  
 *  History
 *      $Source: /cvs-master/intralinks-jsf-comps/components/data-view-grid/src/component/com/exadel/jsf/event/sort/SortListener.java,v $
 *      $Revision: 1.1 $ 
 */
/*
 * Modificato da Link.it (https://link.it) per applicazione patch di sicurezza e migrazione a jakarta EE
 * 
 * Copyright (c) 2022-2026 Link.it srl (https://link.it). 
 */
package org.richfaces.event.sort;

import javax.faces.event.FacesListener;

/**
 * @author Maksim Kaszynski
 *
 */
public interface SortListener extends FacesListener {
	public void processSort(SortEvent e);
	
}
