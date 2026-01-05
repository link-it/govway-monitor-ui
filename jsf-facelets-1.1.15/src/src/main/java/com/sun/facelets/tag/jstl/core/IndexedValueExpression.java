/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*
 * Modificato da Link.it (https://link.it) per applicazione patch di sicurezza e migrazione a jakarta EE
 * 
 * Copyright (c) 2022-2026 Link.it srl (https://link.it). 
 */

package com.sun.facelets.tag.jstl.core;

import jakarta.el.ELContext;
import jakarta.el.ValueExpression;

/**
 * @author Jacob Hookom
 * @version $Id: IndexedValueExpression.java,v 1.4 2008/07/13 19:01:43 rlubke Exp $
 */
public final class IndexedValueExpression extends ValueExpression {

    /**
     * 
     */
    private static final long serialVersionUID = 1L;

    private final Integer i;

    private final ValueExpression orig;

    /**
     * 
     */
    public IndexedValueExpression(ValueExpression orig, int i) {
        this.i = new Integer(i);
        this.orig = orig;
    }

    /*
     * (non-Javadoc)
     * 
     * @see jakarta.el.ValueExpression#getValue(jakarta.el.ELContext)
     */
    public Object getValue(ELContext context) {
        Object base = this.orig.getValue(context);
        if (base != null) {
            context.setPropertyResolved(false);
            return context.getELResolver().getValue(context, base, i);
        }
        return null;
    }

    /*
     * (non-Javadoc)
     * 
     * @see jakarta.el.ValueExpression#setValue(jakarta.el.ELContext,
     *      java.lang.Object)
     */
    public void setValue(ELContext context, Object value) {
        Object base = this.orig.getValue(context);
        if (base != null) {
            context.setPropertyResolved(false);
            context.getELResolver().setValue(context, base, i, value);
        }
    }

    /*
     * (non-Javadoc)
     * 
     * @see jakarta.el.ValueExpression#isReadOnly(jakarta.el.ELContext)
     */
    public boolean isReadOnly(ELContext context) {
        Object base = this.orig.getValue(context);
        if (base != null) {
            context.setPropertyResolved(false);
            return context.getELResolver().isReadOnly(context, base, i);
        }
        return true;
    }

    /*
     * (non-Javadoc)
     * 
     * @see jakarta.el.ValueExpression#getType(jakarta.el.ELContext)
     */
    public Class getType(ELContext context) {
        Object base = this.orig.getValue(context);
        if (base != null) {
            context.setPropertyResolved(false);
            return context.getELResolver().getType(context, base, i);
        }
        return null;
    }

    /*
     * (non-Javadoc)
     * 
     * @see jakarta.el.ValueExpression#getExpectedType()
     */
    public Class getExpectedType() {
        return Object.class;
    }

    /*
     * (non-Javadoc)
     * 
     * @see jakarta.el.Expression#getExpressionString()
     */
    public String getExpressionString() {
        return this.orig.getExpressionString();
    }

    /*
     * (non-Javadoc)
     * 
     * @see jakarta.el.Expression#equals(java.lang.Object)
     */
    public boolean equals(Object obj) {
        return this.orig.equals(obj);
    }

    /*
     * (non-Javadoc)
     * 
     * @see jakarta.el.Expression#hashCode()
     */
    public int hashCode() {
        return this.orig.hashCode();
    }

    /*
     * (non-Javadoc)
     * 
     * @see jakarta.el.Expression#isLiteralText()
     */
    public boolean isLiteralText() {
        return false;
    }

}
