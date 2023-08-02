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

package com.sun.facelets.el;

import java.util.HashMap;
import java.util.Map;

import jakarta.el.ValueExpression;
import jakarta.el.VariableMapper;

/**
 * Default instance of a VariableMapper backed by a Map
 * 
 * @see jakarta.el.VariableMapper
 * @see jakarta.el.ValueExpression
 * @see java.util.Map
 * 
 * @author Jacob Hookom
 * @version $Id: DefaultVariableMapper.java,v 1.3 2008/07/13 19:01:43 rlubke Exp $
 */
public final class DefaultVariableMapper extends VariableMapper {

    private Map vars;

    public DefaultVariableMapper() {
        super();
    }

    /**
     * @see jakarta.el.VariableMapper#resolveVariable(java.lang.String)
     */
    public ValueExpression resolveVariable(String name) {
        if (this.vars != null) {
            return (ValueExpression) this.vars.get(name);
        }
        return null;
    }

    /**
     * @see jakarta.el.VariableMapper#setVariable(java.lang.String, jakarta.el.ValueExpression)
     */
    public ValueExpression setVariable(String name, ValueExpression expression) {
        if (this.vars == null) {
            this.vars = new HashMap();
        }
        return (ValueExpression) this.vars.put(name, expression);
    }

}
