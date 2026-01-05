/**
 * License Agreement.
 *
 * Rich Faces - Natural Ajax for Java Server Faces (JSF)
 *
 * Copyright (C) 2007 Exadel, Inc.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License version 2.1 as published by the Free Software Foundation.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301  USA
 */
/*
 * Modificato da Link.it (https://link.it) per applicazione patch di sicurezza e migrazione a jakarta EE
 * 
 * Copyright (c) 2022-2026 Link.it srl (https://link.it). 
 */
/*
 * ELContextMock.java		Date created: 14.12.2007
 * Last modified by: $Author$
 * $Revision$	$Date$
 */

package org.ajax4jsf.tests;

import jakarta.el.ELContext;
import jakarta.el.ELResolver;
import jakarta.el.FunctionMapper;
import jakarta.el.VariableMapper;

/**
 * TODO Class description goes here.
 * @author Andrey Markavtsov
 *
 */
public class MockELContext extends ELContext {

    /* (non-Javadoc)
     * @see jakarta.el.ELContext#getELResolver()
     */
    @Override
    public ELResolver getELResolver() {
	// TODO Auto-generated method stub
	return null;
    }

    /* (non-Javadoc)
     * @see jakarta.el.ELContext#getFunctionMapper()
     */
    @Override
    public FunctionMapper getFunctionMapper() {
	// TODO Auto-generated method stub
	return null;
    }

    /* (non-Javadoc)
     * @see jakarta.el.ELContext#getVariableMapper()
     */
    @Override
    public VariableMapper getVariableMapper() {
	// TODO Auto-generated method stub
	return null;
    }

}
