/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM:
 *     Class.create({...})         -> costruttore + .prototype plain
 *     $(id)                       -> document.getElementById(id)
 *     Event.observe(el,name,fn)   -> el.addEventListener(name, fn)
 *     Event.fire(el, name, memo)  -> CustomEvent + dispatchEvent.
 *   Importante: il renderer Java emette inline come handler
 *      function(event) { ...; event.memo.page; ... }
 *   quindi l'oggetto evento ricevuto dal listener deve avere `.memo`.
 *   Su CustomEvent moderno l'analogo e' `.detail`; per retro-compat con il
 *   codice generato dal renderer, qui impostiamo manualmente anche `.memo`
 *   sulla CustomEvent prima di dispatcharla.
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 *
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if (!window.Richfaces) {
	window.Richfaces = {};
}

Richfaces.DatascrollerScrollEvent = "rich:datascroller:onscroll";

function _richfacesDatascrollerFire(element, eventName, memo) {
	var ev;
	if (typeof CustomEvent === "function") {
		ev = new CustomEvent(eventName, { detail: memo, bubbles: true, cancelable: true });
	} else {
		ev = document.createEvent("Event");
		ev.initEvent(eventName, true, true);
	}
	// retro-compat con codice generato dal renderer (event.memo.page).
	ev.memo = memo;
	element.dispatchEvent(ev);
	return ev;
}

function Datascroller(clientId, submitFunction) {
	this.initialize(clientId, submitFunction);
}

Richfaces.Datascroller = Datascroller;

// Helper invocato dagli onclick inline emessi da DataScrollerRenderer.getOnClick
// (Java side). Sostituisce la vecchia chiamata `Event.fire(this, name, memo)`
// di Prototype, che dispatchava un evento DOM 'dataavailable' (non intercettato
// dal listener addEventListener moderno).
Richfaces.Datascroller.fire = function(element, page) {
	_richfacesDatascrollerFire(element, Richfaces.DatascrollerScrollEvent, {'page': page});
};

Datascroller.prototype = {
	initialize: function(clientId, submitFunction) {
		this.element = document.getElementById(clientId);
		this.element.component = this;

		this["rich:destructor"] = "destroy";

		this.element.addEventListener(Richfaces.DatascrollerScrollEvent, submitFunction);
	},

	destroy: function() {
		this.element.component = undefined;
		this.element = undefined;
	},

	switchToPage: function(page) {
		if (typeof page != 'undefined' && page != null) {
			_richfacesDatascrollerFire(this.element, Richfaces.DatascrollerScrollEvent, {'page': page});
		}
	},

	next: function() {
		this.switchToPage("next");
	},

	previous: function() {
		this.switchToPage("previous");
	},

	first: function() {
		this.switchToPage("first");
	},

	last: function() {
		this.switchToPage("last");
	},

	fastForward: function() {
		this.switchToPage("fastforward");
	},

	fastRewind: function() {
		this.switchToPage("fastrewind");
	}
};

/* ---------------------------------------------------------------------------
 * Accessibilita' da tastiera dell'impaginatore (WCAG 2.1.1, 4.1.2).
 *
 * I comandi di pagina sono <td> con un gestore del clic emesso dal renderer:
 * senza ruolo ne' 'tabindex' non sono raggiungibili col Tab, quindi chi non usa
 * il mouse non puo' cambiare pagina in nessun elenco. I <td> non portano
 * nemmeno un nome: il contenuto e' un'icona.
 *
 * Qui diventano comandi con nome, attivabili con Invio e barra spaziatrice; i
 * comandi spenti (classe '...-dsbld') restano fuori dalla tabulazione e sono
 * dichiarati disabilitati. Il numero di pagina corrente e' marcato
 * 'aria-current'. L'impaginatore viene ridisegnato a ogni cambio di pagina,
 * quindi la marcatura si riapplica osservando il documento.
 *
 * Il comportamento col mouse non cambia: l'attivazione da tastiera scatena
 * lo stesso clic.
 * ------------------------------------------------------------------------- */
(function () {
	var NOMI = [
		[/first/i,       'Prima pagina'],
		[/fastrewind/i,  'Indietro di piu\' pagine'],
		[/prev/i,        'Pagina precedente'],
		[/next/i,        'Pagina successiva'],
		[/fastforward/i, 'Avanti di piu\' pagine'],
		[/last/i,        'Ultima pagina']
	];

	function nomeDelComando(cella) {
		for (var i = 0; i < NOMI.length; i++) {
			if (NOMI[i][0].test(cella.id || '')) return NOMI[i][1];
		}
		var numero = (cella.textContent || '').trim();
		return /^\d+$/.test(numero) ? 'Pagina ' + numero : null;
	}

	var FOCALIZZABILE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

	function marca(cella) {
		/* In alcune viste il facet dentro la cella e' gia' un collegamento, quindi l'impaginatore
		   e' gia' raggiungibile: marcare anche la cella creerebbe un comando dentro un comando
		   (axe: nested-interactive) e un bersaglio piu' piccolo del minimo, perche' le celle sono
		   adiacenti mentre il collegamento gode della distanza dai vicini. Si interviene solo
		   dove dentro non c'e' nulla di focalizzabile. */
		if (cella.querySelector(FOCALIZZABILE)) {
			cella.removeAttribute('role');
			cella.removeAttribute('tabindex');
			cella.removeAttribute('aria-label');
			return;
		}
		var spento = /-dsbld/.test(cella.className);
		cella.setAttribute('role', 'button');
		var nome = nomeDelComando(cella);
		if (nome) cella.setAttribute('aria-label', nome);
		if (spento) {
			cella.setAttribute('aria-disabled', 'true');
			cella.removeAttribute('tabindex');
		} else {
			cella.removeAttribute('aria-disabled');
			cella.setAttribute('tabindex', '0');
		}
		if (/rich-datascr-act(\s|$)/.test(cella.className)) cella.setAttribute('aria-current', 'page');
		else cella.removeAttribute('aria-current');
	}

	function marcaTutti() {
		var celle = document.querySelectorAll('td.rich-datascr-button, td.rich-datascr-act, td.rich-datascr-inact');
		for (var i = 0; i < celle.length; i++) marca(celle[i]);
	}

	function impianto() {
		if (document.documentElement.getAttribute('data-gw-datascroller')) return;
		document.documentElement.setAttribute('data-gw-datascroller', 'si');

		document.addEventListener('keydown', function (evento) {
			var tasto = evento.keyCode || evento.which;
			if (tasto !== 13 /* INVIO */ && tasto !== 32 /* SPAZIO */) return;
			var cella = evento.target && evento.target.closest ?
					evento.target.closest('td.rich-datascr-button, td.rich-datascr-act, td.rich-datascr-inact') : null;
			if (!cella || cella.getAttribute('aria-disabled') === 'true') return;
			evento.preventDefault();
			cella.click();
		}, false);

		/* l'impaginatore torna dal server a ogni cambio di pagina: la marcatura
		   va rifatta sui nodi nuovi */
		if (window.MutationObserver) {
			new MutationObserver(function () { marcaTutti(); })
				.observe(document.body, { childList: true, subtree: true });
		}
		marcaTutti();
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', impianto, false);
	else impianto();
})();
