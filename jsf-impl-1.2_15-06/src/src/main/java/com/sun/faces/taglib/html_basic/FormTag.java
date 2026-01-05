/*
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS HEADER.
 * 
 * Copyright 1997-2007 Sun Microsystems, Inc. All rights reserved.
 * 
 * The contents of this file are subject to the terms of either the GNU
 * General Public License Version 2 only ("GPL") or the Common Development
 * and Distribution License("CDDL") (collectively, the "License").  You
 * may not use this file except in compliance with the License. You can obtain
 * a copy of the License at https://glassfish.dev.java.net/public/CDDL+GPL.html
 * or glassfish/bootstrap/legal/LICENSE.txt.  See the License for the specific
 * language governing permissions and limitations under the License.
 * 
 * When distributing the software, include this License Header Notice in each
 * file and include the License file at glassfish/bootstrap/legal/LICENSE.txt.
 * Sun designates this particular file as subject to the "Classpath" exception
 * as provided by Sun in the GPL Version 2 section of the License file that
 * accompanied this code.  If applicable, add the following below the License
 * Header, with the fields enclosed by brackets [] replaced by your own
 * identifying information: "Portions Copyrighted [year]
 * [name of copyright owner]"
 * 
 * Contributor(s):
 * 
 * If you wish your version of this file to be governed by only the CDDL or
 * only the GPL Version 2, indicate your decision by adding "[Contributor]
 * elects to include this software in this distribution under the [CDDL or GPL
 * Version 2] license."  If you don't indicate a single choice of license, a
 * recipient has the option to distribute your version of this file under
 * either the CDDL, the GPL Version 2 or to extend the choice of license to
 * its licensees as provided above.  However, if you add GPL Version 2 code
 * and therefore, elected the GPL Version 2 license, then the option applies
 * only if the new code is made subject to such option by the copyright
 * holder.
 */
/*
 * Modificato da Link.it (https://link.it) per applicazione patch di sicurezza e migrazione a jakarta EE
 * 
 * Copyright (c) 2022-2026 Link.it srl (https://link.it). 
 */

package com.sun.faces.taglib.html_basic;

import com.sun.faces.util.Util;
import java.io.IOException;
import jakarta.el.*;
import javax.faces.*;
import javax.faces.component.*;
import javax.faces.context.*;
import javax.faces.convert.*;
import javax.faces.el.*;
import javax.faces.event.*;
import javax.faces.validator.*;
import javax.faces.webapp.*;
import jakarta.servlet.jsp.JspException;


/*
 * ******* GENERATED CODE - DO NOT EDIT *******
 */


public class FormTag extends UIComponentELTag {


    // Setter Methods
    // PROPERTY: prependId
    private jakarta.el.ValueExpression prependId;
    public void setPrependId(jakarta.el.ValueExpression prependId) {
        this.prependId = prependId;
    }

    // PROPERTY: accept
    private jakarta.el.ValueExpression accept;
    public void setAccept(jakarta.el.ValueExpression accept) {
        this.accept = accept;
    }

    // PROPERTY: acceptcharset
    private jakarta.el.ValueExpression acceptcharset;
    public void setAcceptcharset(jakarta.el.ValueExpression acceptcharset) {
        this.acceptcharset = acceptcharset;
    }

    // PROPERTY: dir
    private jakarta.el.ValueExpression dir;
    public void setDir(jakarta.el.ValueExpression dir) {
        this.dir = dir;
    }

    // PROPERTY: enctype
    private jakarta.el.ValueExpression enctype;
    public void setEnctype(jakarta.el.ValueExpression enctype) {
        this.enctype = enctype;
    }

    // PROPERTY: lang
    private jakarta.el.ValueExpression lang;
    public void setLang(jakarta.el.ValueExpression lang) {
        this.lang = lang;
    }

    // PROPERTY: onclick
    private jakarta.el.ValueExpression onclick;
    public void setOnclick(jakarta.el.ValueExpression onclick) {
        this.onclick = onclick;
    }

    // PROPERTY: ondblclick
    private jakarta.el.ValueExpression ondblclick;
    public void setOndblclick(jakarta.el.ValueExpression ondblclick) {
        this.ondblclick = ondblclick;
    }

    // PROPERTY: onkeydown
    private jakarta.el.ValueExpression onkeydown;
    public void setOnkeydown(jakarta.el.ValueExpression onkeydown) {
        this.onkeydown = onkeydown;
    }

    // PROPERTY: onkeypress
    private jakarta.el.ValueExpression onkeypress;
    public void setOnkeypress(jakarta.el.ValueExpression onkeypress) {
        this.onkeypress = onkeypress;
    }

    // PROPERTY: onkeyup
    private jakarta.el.ValueExpression onkeyup;
    public void setOnkeyup(jakarta.el.ValueExpression onkeyup) {
        this.onkeyup = onkeyup;
    }

    // PROPERTY: onmousedown
    private jakarta.el.ValueExpression onmousedown;
    public void setOnmousedown(jakarta.el.ValueExpression onmousedown) {
        this.onmousedown = onmousedown;
    }

    // PROPERTY: onmousemove
    private jakarta.el.ValueExpression onmousemove;
    public void setOnmousemove(jakarta.el.ValueExpression onmousemove) {
        this.onmousemove = onmousemove;
    }

    // PROPERTY: onmouseout
    private jakarta.el.ValueExpression onmouseout;
    public void setOnmouseout(jakarta.el.ValueExpression onmouseout) {
        this.onmouseout = onmouseout;
    }

    // PROPERTY: onmouseover
    private jakarta.el.ValueExpression onmouseover;
    public void setOnmouseover(jakarta.el.ValueExpression onmouseover) {
        this.onmouseover = onmouseover;
    }

    // PROPERTY: onmouseup
    private jakarta.el.ValueExpression onmouseup;
    public void setOnmouseup(jakarta.el.ValueExpression onmouseup) {
        this.onmouseup = onmouseup;
    }

    // PROPERTY: onreset
    private jakarta.el.ValueExpression onreset;
    public void setOnreset(jakarta.el.ValueExpression onreset) {
        this.onreset = onreset;
    }

    // PROPERTY: onsubmit
    private jakarta.el.ValueExpression onsubmit;
    public void setOnsubmit(jakarta.el.ValueExpression onsubmit) {
        this.onsubmit = onsubmit;
    }

    // PROPERTY: style
    private jakarta.el.ValueExpression style;
    public void setStyle(jakarta.el.ValueExpression style) {
        this.style = style;
    }

    // PROPERTY: styleClass
    private jakarta.el.ValueExpression styleClass;
    public void setStyleClass(jakarta.el.ValueExpression styleClass) {
        this.styleClass = styleClass;
    }

    // PROPERTY: target
    private jakarta.el.ValueExpression target;
    public void setTarget(jakarta.el.ValueExpression target) {
        this.target = target;
    }

    // PROPERTY: title
    private jakarta.el.ValueExpression title;
    public void setTitle(jakarta.el.ValueExpression title) {
        this.title = title;
    }


    // General Methods
    public String getRendererType() {
        return "javax.faces.Form";
    }

    public String getComponentType() {
        return "javax.faces.HtmlForm";
    }

    protected void setProperties(UIComponent component) {
        super.setProperties(component);
        javax.faces.component.UIForm form = null;
        try {
            form = (javax.faces.component.UIForm) component;
        } catch (ClassCastException cce) {
            throw new IllegalStateException("Component " + component.toString() + " not expected type.  Expected: javax.faces.component.UIForm.  Perhaps you're missing a tag?");
        }

        if (prependId != null) {
            form.setValueExpression("prependId", prependId);
        }
        if (accept != null) {
            form.setValueExpression("accept", accept);
        }
        if (acceptcharset != null) {
            form.setValueExpression("acceptcharset", acceptcharset);
        }
        if (dir != null) {
            form.setValueExpression("dir", dir);
        }
        if (enctype != null) {
            form.setValueExpression("enctype", enctype);
        }
        if (lang != null) {
            form.setValueExpression("lang", lang);
        }
        if (onclick != null) {
            form.setValueExpression("onclick", onclick);
        }
        if (ondblclick != null) {
            form.setValueExpression("ondblclick", ondblclick);
        }
        if (onkeydown != null) {
            form.setValueExpression("onkeydown", onkeydown);
        }
        if (onkeypress != null) {
            form.setValueExpression("onkeypress", onkeypress);
        }
        if (onkeyup != null) {
            form.setValueExpression("onkeyup", onkeyup);
        }
        if (onmousedown != null) {
            form.setValueExpression("onmousedown", onmousedown);
        }
        if (onmousemove != null) {
            form.setValueExpression("onmousemove", onmousemove);
        }
        if (onmouseout != null) {
            form.setValueExpression("onmouseout", onmouseout);
        }
        if (onmouseover != null) {
            form.setValueExpression("onmouseover", onmouseover);
        }
        if (onmouseup != null) {
            form.setValueExpression("onmouseup", onmouseup);
        }
        if (onreset != null) {
            form.setValueExpression("onreset", onreset);
        }
        if (onsubmit != null) {
            form.setValueExpression("onsubmit", onsubmit);
        }
        if (style != null) {
            form.setValueExpression("style", style);
        }
        if (styleClass != null) {
            form.setValueExpression("styleClass", styleClass);
        }
        if (target != null) {
            form.setValueExpression("target", target);
        }
        if (title != null) {
            form.setValueExpression("title", title);
        }
    }
    // Methods From TagSupport
    public int doStartTag() throws JspException {
        try {
            return super.doStartTag();
        } catch (Exception e) {
            Throwable root = e;
            while (root.getCause() != null) {
                root = root.getCause();
            }
            throw new JspException(root);
        }
    }

    public int doEndTag() throws JspException {
        try {
            return super.doEndTag();
        } catch (Exception e) {
            Throwable root = e;
            while (root.getCause() != null) {
                root = root.getCause();
            }
            throw new JspException(root);
        }
    }

    // RELEASE
    public void release() {
        super.release();

        // component properties
        this.prependId = null;

        // rendered attributes
        this.accept = null;
        this.acceptcharset = null;
        this.dir = null;
        this.enctype = null;
        this.lang = null;
        this.onclick = null;
        this.ondblclick = null;
        this.onkeydown = null;
        this.onkeypress = null;
        this.onkeyup = null;
        this.onmousedown = null;
        this.onmousemove = null;
        this.onmouseout = null;
        this.onmouseover = null;
        this.onmouseup = null;
        this.onreset = null;
        this.onsubmit = null;
        this.style = null;
        this.styleClass = null;
        this.target = null;
        this.title = null;
    }

    public String getDebugString() {
        return "id: " + this.getId() + " class: " + this.getClass().getName();
    }

}
