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
 * Copyright (c) 2022-2025 Link.it srl (https://link.it). 
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


public class CommandButtonTag extends UIComponentELTag {


    // Setter Methods
    // PROPERTY: action
    private jakarta.el.MethodExpression action;
    public void setAction(jakarta.el.MethodExpression action) {
        this.action = action;
    }

    // PROPERTY: actionListener
    private jakarta.el.MethodExpression actionListener;
    public void setActionListener(jakarta.el.MethodExpression actionListener) {
        this.actionListener = actionListener;
    }

    // PROPERTY: immediate
    private jakarta.el.ValueExpression immediate;
    public void setImmediate(jakarta.el.ValueExpression immediate) {
        this.immediate = immediate;
    }

    // PROPERTY: value
    private jakarta.el.ValueExpression value;
    public void setValue(jakarta.el.ValueExpression value) {
        this.value = value;
    }

    // PROPERTY: accesskey
    private jakarta.el.ValueExpression accesskey;
    public void setAccesskey(jakarta.el.ValueExpression accesskey) {
        this.accesskey = accesskey;
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

    // PROPERTY: disabled
    private jakarta.el.ValueExpression disabled;
    public void setDisabled(jakarta.el.ValueExpression disabled) {
        this.disabled = disabled;
    }

    // PROPERTY: image
    private jakarta.el.ValueExpression image;
    public void setImage(jakarta.el.ValueExpression image) {
        this.image = image;
    }

    // PROPERTY: label
    private jakarta.el.ValueExpression label;
    public void setLabel(jakarta.el.ValueExpression label) {
        this.label = label;
    }

    // PROPERTY: lang
    private jakarta.el.ValueExpression lang;
    public void setLang(jakarta.el.ValueExpression lang) {
        this.lang = lang;
    }

    // PROPERTY: onblur
    private jakarta.el.ValueExpression onblur;
    public void setOnblur(jakarta.el.ValueExpression onblur) {
        this.onblur = onblur;
    }

    // PROPERTY: onchange
    private jakarta.el.ValueExpression onchange;
    public void setOnchange(jakarta.el.ValueExpression onchange) {
        this.onchange = onchange;
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

    // PROPERTY: onfocus
    private jakarta.el.ValueExpression onfocus;
    public void setOnfocus(jakarta.el.ValueExpression onfocus) {
        this.onfocus = onfocus;
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

    // PROPERTY: onselect
    private jakarta.el.ValueExpression onselect;
    public void setOnselect(jakarta.el.ValueExpression onselect) {
        this.onselect = onselect;
    }

    // PROPERTY: readonly
    private jakarta.el.ValueExpression readonly;
    public void setReadonly(jakarta.el.ValueExpression readonly) {
        this.readonly = readonly;
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

    // PROPERTY: tabindex
    private jakarta.el.ValueExpression tabindex;
    public void setTabindex(jakarta.el.ValueExpression tabindex) {
        this.tabindex = tabindex;
    }

    // PROPERTY: title
    private jakarta.el.ValueExpression title;
    public void setTitle(jakarta.el.ValueExpression title) {
        this.title = title;
    }

    // PROPERTY: type
    private jakarta.el.ValueExpression type;
    public void setType(jakarta.el.ValueExpression type) {
        this.type = type;
    }


    // General Methods
    public String getRendererType() {
        return "javax.faces.Button";
    }

    public String getComponentType() {
        return "javax.faces.HtmlCommandButton";
    }

    protected void setProperties(UIComponent component) {
        super.setProperties(component);
        javax.faces.component.UICommand command = null;
        try {
            command = (javax.faces.component.UICommand) component;
        } catch (ClassCastException cce) {
            throw new IllegalStateException("Component " + component.toString() + " not expected type.  Expected: javax.faces.component.UICommand.  Perhaps you're missing a tag?");
        }

        if (action != null) {
            command.setActionExpression(action);
        }
        if (actionListener != null) {
            command.addActionListener(new MethodExpressionActionListener(actionListener));
        }
        if (immediate != null) {
            command.setValueExpression("immediate", immediate);
        }
        if (value != null) {
            command.setValueExpression("value", value);
        }
        if (accesskey != null) {
            command.setValueExpression("accesskey", accesskey);
        }
        if (alt != null) {
            command.setValueExpression("alt", alt);
        }
        if (dir != null) {
            command.setValueExpression("dir", dir);
        }
        if (disabled != null) {
            command.setValueExpression("disabled", disabled);
        }
        if (image != null) {
            command.setValueExpression("image", image);
        }
        if (label != null) {
            command.setValueExpression("label", label);
        }
        if (lang != null) {
            command.setValueExpression("lang", lang);
        }
        if (onblur != null) {
            command.setValueExpression("onblur", onblur);
        }
        if (onchange != null) {
            command.setValueExpression("onchange", onchange);
        }
        if (onclick != null) {
            command.setValueExpression("onclick", onclick);
        }
        if (ondblclick != null) {
            command.setValueExpression("ondblclick", ondblclick);
        }
        if (onfocus != null) {
            command.setValueExpression("onfocus", onfocus);
        }
        if (onkeydown != null) {
            command.setValueExpression("onkeydown", onkeydown);
        }
        if (onkeypress != null) {
            command.setValueExpression("onkeypress", onkeypress);
        }
        if (onkeyup != null) {
            command.setValueExpression("onkeyup", onkeyup);
        }
        if (onmousedown != null) {
            command.setValueExpression("onmousedown", onmousedown);
        }
        if (onmousemove != null) {
            command.setValueExpression("onmousemove", onmousemove);
        }
        if (onmouseout != null) {
            command.setValueExpression("onmouseout", onmouseout);
        }
        if (onmouseover != null) {
            command.setValueExpression("onmouseover", onmouseover);
        }
        if (onmouseup != null) {
            command.setValueExpression("onmouseup", onmouseup);
        }
        if (onselect != null) {
            command.setValueExpression("onselect", onselect);
        }
        if (readonly != null) {
            command.setValueExpression("readonly", readonly);
        }
        if (style != null) {
            command.setValueExpression("style", style);
        }
        if (styleClass != null) {
            command.setValueExpression("styleClass", styleClass);
        }
        if (tabindex != null) {
            command.setValueExpression("tabindex", tabindex);
        }
        if (title != null) {
            command.setValueExpression("title", title);
        }
        if (type != null) {
            command.setValueExpression("type", type);
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
        this.action = null;
        this.actionListener = null;
        this.immediate = null;
        this.value = null;

        // rendered attributes
        this.accesskey = null;
        this.alt = null;
        this.dir = null;
        this.disabled = null;
        this.image = null;
        this.label = null;
        this.lang = null;
        this.onblur = null;
        this.onchange = null;
        this.onclick = null;
        this.ondblclick = null;
        this.onfocus = null;
        this.onkeydown = null;
        this.onkeypress = null;
        this.onkeyup = null;
        this.onmousedown = null;
        this.onmousemove = null;
        this.onmouseout = null;
        this.onmouseover = null;
        this.onmouseup = null;
        this.onselect = null;
        this.readonly = null;
        this.style = null;
        this.styleClass = null;
        this.tabindex = null;
        this.title = null;
        this.type = null;
    }

    public String getDebugString() {
        return "id: " + this.getId() + " class: " + this.getClass().getName();
    }

}
