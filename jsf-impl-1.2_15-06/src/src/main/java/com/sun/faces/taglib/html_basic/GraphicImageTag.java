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


public class GraphicImageTag extends UIComponentELTag {


    // Setter Methods
    // PROPERTY: url
    private jakarta.el.ValueExpression url;
    public void setUrl(jakarta.el.ValueExpression url) {
        this.url = url;
    }

    // PROPERTY: value
    private jakarta.el.ValueExpression value;
    public void setValue(jakarta.el.ValueExpression value) {
        this.value = value;
    }

    // PROPERTY: alt
    private jakarta.el.ValueExpression alt;
    public void setAlt(jakarta.el.ValueExpression alt) {
        this.alt = alt;
    }

    // PROPERTY: dir
    private jakarta.el.ValueExpression dir;
    public void setDir(jakarta.el.ValueExpression dir) {
        this.dir = dir;
    }

    // PROPERTY: height
    private jakarta.el.ValueExpression height;
    public void setHeight(jakarta.el.ValueExpression height) {
        this.height = height;
    }

    // PROPERTY: ismap
    private jakarta.el.ValueExpression ismap;
    public void setIsmap(jakarta.el.ValueExpression ismap) {
        this.ismap = ismap;
    }

    // PROPERTY: lang
    private jakarta.el.ValueExpression lang;
    public void setLang(jakarta.el.ValueExpression lang) {
        this.lang = lang;
    }

    // PROPERTY: longdesc
    private jakarta.el.ValueExpression longdesc;
    public void setLongdesc(jakarta.el.ValueExpression longdesc) {
        this.longdesc = longdesc;
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

    // PROPERTY: usemap
    private jakarta.el.ValueExpression usemap;
    public void setUsemap(jakarta.el.ValueExpression usemap) {
        this.usemap = usemap;
    }

    // PROPERTY: width
    private jakarta.el.ValueExpression width;
    public void setWidth(jakarta.el.ValueExpression width) {
        this.width = width;
    }


    // General Methods
    public String getRendererType() {
        return "javax.faces.Image";
    }

    public String getComponentType() {
        return "javax.faces.HtmlGraphicImage";
    }

    protected void setProperties(UIComponent component) {
        super.setProperties(component);
        javax.faces.component.UIGraphic graphic = null;
        try {
            graphic = (javax.faces.component.UIGraphic) component;
        } catch (ClassCastException cce) {
            throw new IllegalStateException("Component " + component.toString() + " not expected type.  Expected: javax.faces.component.UIGraphic.  Perhaps you're missing a tag?");
        }

        if (url != null) {
            graphic.setValueExpression("url", url);
        }
        if (value != null) {
            graphic.setValueExpression("value", value);
        }
        if (alt != null) {
            graphic.setValueExpression("alt", alt);
        }
        if (dir != null) {
            graphic.setValueExpression("dir", dir);
        }
        if (height != null) {
            graphic.setValueExpression("height", height);
        }
        if (ismap != null) {
            graphic.setValueExpression("ismap", ismap);
        }
        if (lang != null) {
            graphic.setValueExpression("lang", lang);
        }
        if (longdesc != null) {
            graphic.setValueExpression("longdesc", longdesc);
        }
        if (onclick != null) {
            graphic.setValueExpression("onclick", onclick);
        }
        if (ondblclick != null) {
            graphic.setValueExpression("ondblclick", ondblclick);
        }
        if (onkeydown != null) {
            graphic.setValueExpression("onkeydown", onkeydown);
        }
        if (onkeypress != null) {
            graphic.setValueExpression("onkeypress", onkeypress);
        }
        if (onkeyup != null) {
            graphic.setValueExpression("onkeyup", onkeyup);
        }
        if (onmousedown != null) {
            graphic.setValueExpression("onmousedown", onmousedown);
        }
        if (onmousemove != null) {
            graphic.setValueExpression("onmousemove", onmousemove);
        }
        if (onmouseout != null) {
            graphic.setValueExpression("onmouseout", onmouseout);
        }
        if (onmouseover != null) {
            graphic.setValueExpression("onmouseover", onmouseover);
        }
        if (onmouseup != null) {
            graphic.setValueExpression("onmouseup", onmouseup);
        }
        if (style != null) {
            graphic.setValueExpression("style", style);
        }
        if (styleClass != null) {
            graphic.setValueExpression("styleClass", styleClass);
        }
        if (title != null) {
            graphic.setValueExpression("title", title);
        }
        if (usemap != null) {
            graphic.setValueExpression("usemap", usemap);
        }
        if (width != null) {
            graphic.setValueExpression("width", width);
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
        this.url = null;
        this.value = null;

        // rendered attributes
        this.alt = null;
        this.dir = null;
        this.height = null;
        this.ismap = null;
        this.lang = null;
        this.longdesc = null;
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
        this.style = null;
        this.styleClass = null;
        this.title = null;
        this.usemap = null;
        this.width = null;
    }

    public String getDebugString() {
        return "id: " + this.getId() + " class: " + this.getClass().getName();
    }

}
