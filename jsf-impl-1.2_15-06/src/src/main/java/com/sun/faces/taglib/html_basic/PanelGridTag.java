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
 * Copyright (c) 2022-2024 Link.it srl (https://link.it). 
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


public class PanelGridTag extends UIComponentELTag {


    // Setter Methods
    // PROPERTY: bgcolor
    private jakarta.el.ValueExpression bgcolor;
    public void setBgcolor(jakarta.el.ValueExpression bgcolor) {
        this.bgcolor = bgcolor;
    }

    // PROPERTY: border
    private jakarta.el.ValueExpression border;
    public void setBorder(jakarta.el.ValueExpression border) {
        this.border = border;
    }

    // PROPERTY: captionClass
    private jakarta.el.ValueExpression captionClass;
    public void setCaptionClass(jakarta.el.ValueExpression captionClass) {
        this.captionClass = captionClass;
    }

    // PROPERTY: captionStyle
    private jakarta.el.ValueExpression captionStyle;
    public void setCaptionStyle(jakarta.el.ValueExpression captionStyle) {
        this.captionStyle = captionStyle;
    }

    // PROPERTY: cellpadding
    private jakarta.el.ValueExpression cellpadding;
    public void setCellpadding(jakarta.el.ValueExpression cellpadding) {
        this.cellpadding = cellpadding;
    }

    // PROPERTY: cellspacing
    private jakarta.el.ValueExpression cellspacing;
    public void setCellspacing(jakarta.el.ValueExpression cellspacing) {
        this.cellspacing = cellspacing;
    }

    // PROPERTY: columnClasses
    private jakarta.el.ValueExpression columnClasses;
    public void setColumnClasses(jakarta.el.ValueExpression columnClasses) {
        this.columnClasses = columnClasses;
    }

    // PROPERTY: columns
    private jakarta.el.ValueExpression columns;
    public void setColumns(jakarta.el.ValueExpression columns) {
        this.columns = columns;
    }

    // PROPERTY: dir
    private jakarta.el.ValueExpression dir;
    public void setDir(jakarta.el.ValueExpression dir) {
        this.dir = dir;
    }

    // PROPERTY: footerClass
    private jakarta.el.ValueExpression footerClass;
    public void setFooterClass(jakarta.el.ValueExpression footerClass) {
        this.footerClass = footerClass;
    }

    // PROPERTY: frame
    private jakarta.el.ValueExpression frame;
    public void setFrame(jakarta.el.ValueExpression frame) {
        this.frame = frame;
    }

    // PROPERTY: headerClass
    private jakarta.el.ValueExpression headerClass;
    public void setHeaderClass(jakarta.el.ValueExpression headerClass) {
        this.headerClass = headerClass;
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

    // PROPERTY: rowClasses
    private jakarta.el.ValueExpression rowClasses;
    public void setRowClasses(jakarta.el.ValueExpression rowClasses) {
        this.rowClasses = rowClasses;
    }

    // PROPERTY: rules
    private jakarta.el.ValueExpression rules;
    public void setRules(jakarta.el.ValueExpression rules) {
        this.rules = rules;
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

    // PROPERTY: summary
    private jakarta.el.ValueExpression summary;
    public void setSummary(jakarta.el.ValueExpression summary) {
        this.summary = summary;
    }

    // PROPERTY: title
    private jakarta.el.ValueExpression title;
    public void setTitle(jakarta.el.ValueExpression title) {
        this.title = title;
    }

    // PROPERTY: width
    private jakarta.el.ValueExpression width;
    public void setWidth(jakarta.el.ValueExpression width) {
        this.width = width;
    }


    // General Methods
    public String getRendererType() {
        return "javax.faces.Grid";
    }

    public String getComponentType() {
        return "javax.faces.HtmlPanelGrid";
    }

    protected void setProperties(UIComponent component) {
        super.setProperties(component);
        javax.faces.component.UIPanel panel = null;
        try {
            panel = (javax.faces.component.UIPanel) component;
        } catch (ClassCastException cce) {
            throw new IllegalStateException("Component " + component.toString() + " not expected type.  Expected: javax.faces.component.UIPanel.  Perhaps you're missing a tag?");
        }

        if (bgcolor != null) {
            panel.setValueExpression("bgcolor", bgcolor);
        }
        if (border != null) {
            panel.setValueExpression("border", border);
        }
        if (captionClass != null) {
            panel.setValueExpression("captionClass", captionClass);
        }
        if (captionStyle != null) {
            panel.setValueExpression("captionStyle", captionStyle);
        }
        if (cellpadding != null) {
            panel.setValueExpression("cellpadding", cellpadding);
        }
        if (cellspacing != null) {
            panel.setValueExpression("cellspacing", cellspacing);
        }
        if (columnClasses != null) {
            panel.setValueExpression("columnClasses", columnClasses);
        }
        if (columns != null) {
            panel.setValueExpression("columns", columns);
        }
        if (dir != null) {
            panel.setValueExpression("dir", dir);
        }
        if (footerClass != null) {
            panel.setValueExpression("footerClass", footerClass);
        }
        if (frame != null) {
            panel.setValueExpression("frame", frame);
        }
        if (headerClass != null) {
            panel.setValueExpression("headerClass", headerClass);
        }
        if (lang != null) {
            panel.setValueExpression("lang", lang);
        }
        if (onclick != null) {
            panel.setValueExpression("onclick", onclick);
        }
        if (ondblclick != null) {
            panel.setValueExpression("ondblclick", ondblclick);
        }
        if (onkeydown != null) {
            panel.setValueExpression("onkeydown", onkeydown);
        }
        if (onkeypress != null) {
            panel.setValueExpression("onkeypress", onkeypress);
        }
        if (onkeyup != null) {
            panel.setValueExpression("onkeyup", onkeyup);
        }
        if (onmousedown != null) {
            panel.setValueExpression("onmousedown", onmousedown);
        }
        if (onmousemove != null) {
            panel.setValueExpression("onmousemove", onmousemove);
        }
        if (onmouseout != null) {
            panel.setValueExpression("onmouseout", onmouseout);
        }
        if (onmouseover != null) {
            panel.setValueExpression("onmouseover", onmouseover);
        }
        if (onmouseup != null) {
            panel.setValueExpression("onmouseup", onmouseup);
        }
        if (rowClasses != null) {
            panel.setValueExpression("rowClasses", rowClasses);
        }
        if (rules != null) {
            panel.setValueExpression("rules", rules);
        }
        if (style != null) {
            panel.setValueExpression("style", style);
        }
        if (styleClass != null) {
            panel.setValueExpression("styleClass", styleClass);
        }
        if (summary != null) {
            panel.setValueExpression("summary", summary);
        }
        if (title != null) {
            panel.setValueExpression("title", title);
        }
        if (width != null) {
            panel.setValueExpression("width", width);
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

        // rendered attributes
        this.bgcolor = null;
        this.border = null;
        this.captionClass = null;
        this.captionStyle = null;
        this.cellpadding = null;
        this.cellspacing = null;
        this.columnClasses = null;
        this.columns = null;
        this.dir = null;
        this.footerClass = null;
        this.frame = null;
        this.headerClass = null;
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
        this.rowClasses = null;
        this.rules = null;
        this.style = null;
        this.styleClass = null;
        this.summary = null;
        this.title = null;
        this.width = null;
    }

    public String getDebugString() {
        return "id: " + this.getId() + " class: " + this.getClass().getName();
    }

}
