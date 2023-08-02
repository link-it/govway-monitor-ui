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


public class MessagesTag extends UIComponentELTag {


    // Setter Methods
    // PROPERTY: globalOnly
    private jakarta.el.ValueExpression globalOnly;
    public void setGlobalOnly(jakarta.el.ValueExpression globalOnly) {
        this.globalOnly = globalOnly;
    }

    // PROPERTY: showDetail
    private jakarta.el.ValueExpression showDetail;
    public void setShowDetail(jakarta.el.ValueExpression showDetail) {
        this.showDetail = showDetail;
    }

    // PROPERTY: showSummary
    private jakarta.el.ValueExpression showSummary;
    public void setShowSummary(jakarta.el.ValueExpression showSummary) {
        this.showSummary = showSummary;
    }

    // PROPERTY: dir
    private jakarta.el.ValueExpression dir;
    public void setDir(jakarta.el.ValueExpression dir) {
        this.dir = dir;
    }

    // PROPERTY: errorClass
    private jakarta.el.ValueExpression errorClass;
    public void setErrorClass(jakarta.el.ValueExpression errorClass) {
        this.errorClass = errorClass;
    }

    // PROPERTY: errorStyle
    private jakarta.el.ValueExpression errorStyle;
    public void setErrorStyle(jakarta.el.ValueExpression errorStyle) {
        this.errorStyle = errorStyle;
    }

    // PROPERTY: fatalClass
    private jakarta.el.ValueExpression fatalClass;
    public void setFatalClass(jakarta.el.ValueExpression fatalClass) {
        this.fatalClass = fatalClass;
    }

    // PROPERTY: fatalStyle
    private jakarta.el.ValueExpression fatalStyle;
    public void setFatalStyle(jakarta.el.ValueExpression fatalStyle) {
        this.fatalStyle = fatalStyle;
    }

    // PROPERTY: infoClass
    private jakarta.el.ValueExpression infoClass;
    public void setInfoClass(jakarta.el.ValueExpression infoClass) {
        this.infoClass = infoClass;
    }

    // PROPERTY: infoStyle
    private jakarta.el.ValueExpression infoStyle;
    public void setInfoStyle(jakarta.el.ValueExpression infoStyle) {
        this.infoStyle = infoStyle;
    }

    // PROPERTY: lang
    private jakarta.el.ValueExpression lang;
    public void setLang(jakarta.el.ValueExpression lang) {
        this.lang = lang;
    }

    // PROPERTY: layout
    private jakarta.el.ValueExpression layout;
    public void setLayout(jakarta.el.ValueExpression layout) {
        this.layout = layout;
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

    // PROPERTY: title
    private jakarta.el.ValueExpression title;
    public void setTitle(jakarta.el.ValueExpression title) {
        this.title = title;
    }

    // PROPERTY: tooltip
    private jakarta.el.ValueExpression tooltip;
    public void setTooltip(jakarta.el.ValueExpression tooltip) {
        this.tooltip = tooltip;
    }

    // PROPERTY: warnClass
    private jakarta.el.ValueExpression warnClass;
    public void setWarnClass(jakarta.el.ValueExpression warnClass) {
        this.warnClass = warnClass;
    }

    // PROPERTY: warnStyle
    private jakarta.el.ValueExpression warnStyle;
    public void setWarnStyle(jakarta.el.ValueExpression warnStyle) {
        this.warnStyle = warnStyle;
    }


    // General Methods
    public String getRendererType() {
        return "javax.faces.Messages";
    }

    public String getComponentType() {
        return "javax.faces.HtmlMessages";
    }

    protected void setProperties(UIComponent component) {
        super.setProperties(component);
        javax.faces.component.UIMessages messages = null;
        try {
            messages = (javax.faces.component.UIMessages) component;
        } catch (ClassCastException cce) {
            throw new IllegalStateException("Component " + component.toString() + " not expected type.  Expected: javax.faces.component.UIMessages.  Perhaps you're missing a tag?");
        }

        if (globalOnly != null) {
            messages.setValueExpression("globalOnly", globalOnly);
        }
        if (showDetail != null) {
            messages.setValueExpression("showDetail", showDetail);
        }
        if (showSummary != null) {
            messages.setValueExpression("showSummary", showSummary);
        }
        if (dir != null) {
            messages.setValueExpression("dir", dir);
        }
        if (errorClass != null) {
            messages.setValueExpression("errorClass", errorClass);
        }
        if (errorStyle != null) {
            messages.setValueExpression("errorStyle", errorStyle);
        }
        if (fatalClass != null) {
            messages.setValueExpression("fatalClass", fatalClass);
        }
        if (fatalStyle != null) {
            messages.setValueExpression("fatalStyle", fatalStyle);
        }
        if (infoClass != null) {
            messages.setValueExpression("infoClass", infoClass);
        }
        if (infoStyle != null) {
            messages.setValueExpression("infoStyle", infoStyle);
        }
        if (lang != null) {
            messages.setValueExpression("lang", lang);
        }
        if (layout != null) {
            messages.setValueExpression("layout", layout);
        }
        if (style != null) {
            messages.setValueExpression("style", style);
        }
        if (styleClass != null) {
            messages.setValueExpression("styleClass", styleClass);
        }
        if (title != null) {
            messages.setValueExpression("title", title);
        }
        if (tooltip != null) {
            messages.setValueExpression("tooltip", tooltip);
        }
        if (warnClass != null) {
            messages.setValueExpression("warnClass", warnClass);
        }
        if (warnStyle != null) {
            messages.setValueExpression("warnStyle", warnStyle);
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
        this.globalOnly = null;
        this.showDetail = null;
        this.showSummary = null;

        // rendered attributes
        this.dir = null;
        this.errorClass = null;
        this.errorStyle = null;
        this.fatalClass = null;
        this.fatalStyle = null;
        this.infoClass = null;
        this.infoStyle = null;
        this.lang = null;
        this.layout = null;
        this.style = null;
        this.styleClass = null;
        this.title = null;
        this.tooltip = null;
        this.warnClass = null;
        this.warnStyle = null;
    }

    public String getDebugString() {
        return "id: " + this.getId() + " class: " + this.getClass().getName();
    }

}
