/*
 *  Copyright
 *      Copyright (c) Exadel,Inc. 2006
 *      All rights reserved.
 *  
 *  History
 *      $Source: /cvs-master/intralinks-jsf-comps/components/data-view-grid/src/component/com/exadel/jsf/event/sort/SortSource.java,v $
 *      $Revision: 1.1 $ 
 */
/*
 * Modificato da Link.it (https://link.it) per applicazione patch di sicurezza e migrazione a jakarta EE
 * 
 * Copyright (c) 2022-2024 Link.it srl (https://link.it). 
 */
package org.richfaces.event.sort;

/**
 * @author Maksim Kaszynski
 *
 */
public interface SortSource {
	public void addSortListener(SortListener listener);
	public void removeSortListener(SortListener listener);
	public SortListener[] getSortListeners();
}
