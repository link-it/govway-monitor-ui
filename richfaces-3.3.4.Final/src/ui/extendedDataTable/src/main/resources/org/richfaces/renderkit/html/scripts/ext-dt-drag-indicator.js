/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM:
 *       Object.extend -> Object.assign,
 *       Element.clearChildren -> while (firstChild) removeChild,
 *       Element.show / hide -> style.display,
 *       Element.setStyle -> Object.assign(el.style, ...),
 *       Element.addClassName / removeClassName -> classList.add / remove,
 *       new Insertion.Top -> insertAdjacentHTML('afterbegin', html),
 *       parts.invoke('getContent', p) -> parts.map(x => x.getContent(p)).
 *
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

ExtDragIndicator = {

    init: function(event) {
        var ieVersion = RichFaces.getIEVersion();
        ExtDragIndicator.isIE6 = (ieVersion && ieVersion < 7);
    },

    setContent: function(name, single, params) {
        while (this.firstChild) this.removeChild(this.firstChild);

        var p = DnD.getDnDDefaultParams(this);

        if (!p) {
            p = {};
        }

        if (params) {
            Object.assign(p, params);
        }

        if (!p['marker']) {
            if (p[name]) {
                p['marker'] = p[name];
            } else {
                p['marker'] = this.markers[name];
            }
        }

        var parts;

        if (single) {
            parts = this.indicatorTemplates['single'];
        } else {
            parts = this.indicatorTemplates['multi'];
        }

        this.insertAdjacentHTML('afterbegin', parts.map(function(x) { return x.getContent(p); }).join(''));

        if (ExtDragIndicator.isIE6) {
            this.initIFrame();
        }
    },

    show: function() {
        if (!this.floatedToBody) {
            if (!this.realParent) {
                this.realParent = this.parentNode;
                this._nextSibling = this.nextSibling;
            }
            this.realParent.removeChild(this);
            document.body.appendChild(this);
            this.floatedToBody = true;
        }
        this.style.display = '';
        this.style.position = 'absolute';
    },

    hide: function() {
        this.style.display = 'none';
        this.style.position = '';
        this.offsets = undefined;
        this.leave();
        if (this.floatedToBody && this.realParent) {
            document.body.removeChild(this);
            if (this._nextSibling) {
                this.realParent.insertBefore(this, this._nextSibling);
            } else {
                this.realParent.appendChild(this);
            }
            this.floatedToBody = false;
        }
    },

    position: function(x, y) {
        if (!this.offsets) {
            this.style.display = '';
            this.style.position = 'absolute';
        }
        this.style.left = x + "px";
        this.style.top  = y + "px";
    },

    accept: function() {
        this.classList.remove('drgind_default');
        this.classList.remove('drgind_reject');
        this.classList.add('drgind_accept');

        var acceptClass = this.getAcceptClass();
        if (acceptClass) {
            this.classList.add(acceptClass);
        }
    },

    reject: function() {
        this.classList.remove('drgind_default');
        this.classList.remove('drgind_accept');
        this.classList.add('drgind_reject');

        var rejectClass = this.getRejectClass();
        if (rejectClass) {
            this.classList.add(rejectClass);
        }
    },

    leave: function() {
        this.classList.remove('drgind_accept');
        //this.classList.remove('drgind_reject');
        //this.classList.add('drgind_default');
        this.classList.remove('drgind_default');
        this.classList.add('drgind_reject');

        var acceptClass = this.getAcceptClass();
        var rejectClass = this.getRejectClass();
        if (acceptClass) {
            this.classList.remove(acceptClass);
        }
        if (rejectClass) {
            this.classList.remove(rejectClass);
        }
    },

    getAcceptClass: function() {
        return this.ils_acceptClass;
    },

    getRejectClass: function() {
        return this.ils_rejectClass;
    },

    initIFrame: function() {
        var iframe = document.createElement("iframe");
        iframe.classList.add('rich-dragindicator-iframe');
        this.insertBefore(iframe, this.firstChild);
        var table = iframe.nextSibling;
        iframe.style.width = table.offsetWidth + "px";
        iframe.style.height = table.offsetHeight + "px";
    }
};

function createExtDragIndicator(elt, acceptClass, rejectClass) {
    Object.assign(elt, ExtDragIndicator);
    elt.init();

    elt.ils_acceptClass = acceptClass;
    elt.ils_rejectClass = rejectClass;
}


