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

package com.sun.facelets.tag;

import com.sun.facelets.FaceletContext;
import com.sun.facelets.util.ParameterCheck;
import javax.faces.component.UIComponent;

/**
 * A base tag for wiring state to an object instance based on rules populated at
 * the time of creating a MetaRuleset.
 * 
 * @author Jacob Hookom
 * @version $Id: MetaTagHandler.java,v 1.3.2.1 2009/08/19 21:43:58 edburns Exp $
 */
public abstract class MetaTagHandler extends TagHandler {

    private Class lastType = Object.class;

    private Metadata mapper;

    public MetaTagHandler(TagConfig config) {
        super(config);
    }

    /**
     * Extend this method in order to add your own rules.
     * 
     * @param type
     * @return
     */
    protected MetaRuleset createMetaRuleset(Class type) {
        ParameterCheck.notNull("type", type);
        return new MetaRulesetImpl(this.tag, type, false);
    }

  /**
   * special version of {@link #createMetaRuleset(Class)} to be used for
   * recreation of the ValueExpression's only in case the bindingsState is not
   * stored to the viewState.
   * 
   * @param type
   * @return
   */
  protected MetaRuleset recreateMetaRuleset(Class type) {
    ParameterCheck.notNull("type", type);
    return new MetaRulesetImpl(this.tag, type, true);
  }

    /**
     * Invoking/extending this method will cause the results of the created
     * MetaRuleset to auto-wire state to the passed instance.
     * 
     * @param ctx
     * @param instance
     */
    protected void setAttributes(FaceletContext ctx, Object instance) {
        if (instance != null) {
            Class type = instance.getClass();
            if (mapper == null || !this.lastType.equals(type)) {
                this.lastType = type;
                this.mapper = this.createMetaRuleset(type).finish();
            }
            this.mapper.applyMetadata(ctx, instance);
        }
    }

  public void recreateValueExpressions(FaceletContext ctx, UIComponent instance) {
    if (instance != null) {
      Class type = instance.getClass();
      if (mapper == null || !this.lastType.equals(type)) {
        this.lastType = type;
        this.mapper = this.recreateMetaRuleset(type).finish();
      }
      this.mapper.applyMetadata(ctx, instance);
    }
  }
}
