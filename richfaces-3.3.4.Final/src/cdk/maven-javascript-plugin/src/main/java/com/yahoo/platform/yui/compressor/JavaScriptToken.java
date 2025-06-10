/*
 * YUI Compressor
 * http://developer.yahoo.com/yui/compressor/
 * Author: Julien Lecomte -  http://www.julienlecomte.net/
 * Copyright (c) 2011 Yahoo! Inc.  All rights reserved.
 * The copyrights embodied in the content of this file are licensed
 * by Yahoo! Inc. under the BSD (revised) open source license.
 */
/*
 * Modificato da Link.it (https://link.it) per applicazione patch di sicurezza e migrazione a jakarta EE
 * 
 * Copyright (c) 2022-2025 Link.it srl (https://link.it). 
 */
package com.yahoo.platform.yui.compressor;

public class JavaScriptToken {

    private int type;
    private String value;

    JavaScriptToken(int type, String value) {
        this.type = type;
        this.value = value;
    }

    int getType() {
        return type;
    }

    String getValue() {
        return value;
    }
}
