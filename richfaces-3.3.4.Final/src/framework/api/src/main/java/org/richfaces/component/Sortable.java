/*
 *  Copyright
 *      Copyright (c) Exadel,Inc. 2006
 *      All rights reserved.
 *  
 *  History
 *      $Source: /cvs-master/intralinks-jsf-comps/components/data-view-grid/src/component/com/exadel/jsf/component/Sortable.java,v $
 *      $Revision: 1.1 $ 
 */
/*
 * Modificato da Link.it (https://link.it) per applicazione patch di sicurezza e migrazione a jakarta EE
 * 
 * Copyright (c) 2022-2025 Link.it srl (https://link.it). 
 */
package org.richfaces.component;

import org.richfaces.model.SortOrder;


/**
 * @author Maksim Kaszynski
 * Base interface for sort capable components
 */
public interface Sortable {
	public SortOrder getSortOrder();
	public void setSortOrder(SortOrder sortOrder);
}
