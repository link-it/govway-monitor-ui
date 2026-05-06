// ClientUILib base.js v1.0.0, Fri Jan 19 19:16:36 CET 2007

// TODO: Copyright (c) 2007, Denis Morozov (dmorozov@exadel.com)
// ...

/*
 * Modificato da Link.it (https://link.it):
 *   - Porting da Prototype a vanilla DOM:
 *       Rimosso il check di Prototype.Version all'inizio di load() — la lib
 *       ora non dipende piu' da Prototype.
 *       $A(...).findAll(...).each(...) -> Array.from + filter + forEach,
 *       $A(...).each(...) -> forEach,
 *       $(...) -> document.getElementById / createElement,
 *       elem.setStyle({...}) -> Object.assign(elem.style, {...}),
 *       Event.observe -> addEventListener,
 *       Event.stop -> preventDefault + stopPropagation,
 *       bindAsEventListener -> Function.prototype.bind,
 *       Element.show -> style.display = '',
 *       Object.extend(Event, {onReady: ...}) -> ClientUILib.onReady (definita
 *           sul namespace della libreria invece che inquinare il global Event).
 *
 * Copyright (c) 2022-2026 Link.it srl (https://link.it).
 * Distribuito sotto la stessa licenza LGPL v2.1 di RichFaces 3.3.4.Final.
 */

if(!ClientUILib) {

var ClientUILib = {
	Version: '1.0.0',
	Name: 'ClientUILib',
	LibraryPath: './',
	packages: [],
	load: function(showLog) {
	  // Modificato da Link.it: rimosso check Prototype.Version (non piu' richiesto).
	  Array.from(document.getElementsByTagName("script"))
	    .filter(function(s) { return (s.src && s.src.match(/ClientUILib\.js(\?.*)?$/)); })
	    .forEach(function(s) {
	      LibraryPath = s.src.replace(/ClientUILib\.js(\?.*)?$/, '');
	    });

	  if(showLog) {
		  ClientUILogger.create("ClientUILogger");
		  this.startTime = (new Date()).getTime();
	  }

	  this.initBrowser();
	},
 	include: function(libraryPackageName) {
		if(!this.packages)
			this.packages=[];
		if(!this.packages[libraryPackageName]) {
			this.packages[libraryPackageName] = true;
			var re = /\./g; // Replace all '.' in package name
			var packagePath = LibraryPath + libraryPackageName.replace(re, "/");
			document.write('<script type="text/javascript" src="' + packagePath + '.js"></script>');
		}
	},
	include2: function(libraryPackageName) {
		if(!this.packages)
			this.packages=[];
		if(!this.packages[libraryPackageName]) {
			this.packages[libraryPackageName] = true;
			var re = /\./g; // Replace all '.' in package name
			var packagePath = LibraryPath + libraryPackageName.replace(re, "/");
			var e = document.createElement("script");
		   	e.src = packagePath+".js";
		   	e.type="text/javascript";
		   	document.getElementsByTagName("head")[0].appendChild(e);
		}
	},
	requireClass: function(libName) {
		// required class not included before
		if(!this.packages[libName]) {
			//this.include2(libName);
			ClientUILib.log(ClientUILogger.ERROR, "Library '" + libName + "' required!!!");
			throw("Package '" + libName + "' is required!");
		}
	},
	declarePackage: function(libName) {
		var pckg = null;
		var packages = libName.split(".");
		packages.forEach(function(s) {
			if(pckg == null) {
//				pckg = eval(s);
				pckg = ClientUILib.customJSONEval(s);
			} else {
				if(!pckg[s]) pckg[s] = {};
				pckg = pckg[s];
			}
	  	});
	  	this.packages[libName] = true;
	},
	customJSONEval: function(data) {
		var result;

	    // Define callback
	    window.evalCallback = function(r){
	        result = r;
	    };

	    var newScript = document.createElement("script");
	    newScript.innerHTML = "evalCallback(" + data + ");";
	    /*
	     * // Add CSP nonce if relevant
	     * newScript.setAttribute("nonce", nonce);
	    */
	    document.head.appendChild(newScript);

	    // Now clean up DOM and global scope
	    document.head.removeChild(newScript);
	    delete window.evalCallback;

	    return result;
	},
	log: function(level, infoText) {
		if(ClientUILogger.isCreated){
			ClientUILogger.log(level, infoText);
		} else {
			switch(level) {
				case ClientUILogger.INFO: LOG.info(infoText); break;
				case ClientUILogger.ERROR: LOG.error(infoText); break;
				case ClientUILogger.WARNING: LOG.warn(infoText); break;
				default: LOG.a4jDebug(infoText);;
			}
		}
	},

	initBrowser: function() {
		var ua = navigator.userAgent.toLowerCase();
		/** @type Boolean */
		this.isOpera = (ua.indexOf('opera') > -1);
	   	/** @type Boolean */
		this.isSafari = (ua.indexOf('webkit') > -1);
	   	/** @type Boolean */
		this.isIE = (window.ActiveXObject);
	   	/** @type Boolean */
		this.isIE7 = (ua.indexOf('msie 7') > -1);
	   	/** @type Boolean */
		this.isIE8 = (ua.indexOf('msie 8') > -1);
	   	/** @type Boolean */
		this.isGecko = !this.isSafari && (ua.indexOf('gecko') > -1);

		if(ua.indexOf("windows") != -1 || ua.indexOf("win32") != -1){
		    /** @type Boolean */
		    this.isWindows = true;
		}else if(ua.indexOf("macintosh") != -1){
			/** @type Boolean */
		    this.isMac = true;
		}
		if(this.isIE && !this.isIE7){
	        try{
	            document.execCommand("BackgroundImageCache", false, true);
	        }catch(e){}
	    }
	}
};

// helper Prototype-free locale
function _cuilSetStyle(el, styles) {
	if (!el) return;
	if (styles) for (var k in styles) {
		if (Object.prototype.hasOwnProperty.call(styles, k)) el.style[k] = styles[k];
	}
}

var ClientUILogger = {
	// log level
	INFO: 		1,
	WARNING: 	2,
	ERROR: 		3,
	EVENT:		4, //KAW EVENT level added to trace events
	ALERT:		5, //KAW ALERT level to stop executing script
	hEnabledLevels: {
		1: true,
		2: true,
		3: true,
		4: true,
		5: false
	},
	// flag logger is initialized
	isCreated: false,
	width: 460,
	height: 600,
	top: 0,
	left: 750,
	bLoggingEnabled: true,
	create: function() {
		this.mainDiv = document.createElement("div");
		_cuilSetStyle(this.mainDiv, {border: '1px black solid', position: 'absolute', padding: '1px'});
		this.logElement = document.createElement("div");
		_cuilSetStyle(this.logElement, {overflow: 'auto', whiteSpace: 'nowrap'});
		this.buttonsContainer = document.createElement("div");

		var clearDiv = this.buttonClear = document.createElement('div');
		_cuilSetStyle(clearDiv, {width: 120 + 'px', height: 25 + 'px', border: '1px black solid'});
		clearDiv.innerHTML = 'Clear';

		var toggleLoggingDiv = this.buttonToggleLogging = document.createElement('div');
		_cuilSetStyle(toggleLoggingDiv, {width: 120 + 'px', height: 25 + 'px',
			border: '1px black solid', position: 'relative',
			top: '-27px', left: '122px'
		});
		toggleLoggingDiv.innerHTML = 'Logging '+this.isLoggingEnabled();

		var toggleAlertDiv = this.buttonToggleAlert = document.createElement('div');
		_cuilSetStyle(toggleAlertDiv, {width: 120 + 'px', height: 25 + 'px',
			border: '1px black solid', position: 'relative',
			top: '-54px', left: '244px'
		});
		toggleAlertDiv.innerHTML = 'Alert '+this.isLevelEnabled(ClientUILogger.ALERT);

		this.buttonsContainer.appendChild(clearDiv);
		this.buttonsContainer.appendChild(toggleLoggingDiv);
		this.buttonsContainer.appendChild(toggleAlertDiv);
		this.mainDiv.appendChild(this.logElement);
		this.mainDiv.appendChild(this.buttonsContainer);

		this.eventClearClicked = this.onClearClick.bind(this);
		this.eventToggleLoggingClicked = this.onToggleLoggingClick.bind(this);
		this.eventToggleAlertClicked = this.onToggleAlertClick.bind(this);
		toggleLoggingDiv.addEventListener('click', ClientUILogger.eventToggleLoggingClicked);
		toggleAlertDiv.addEventListener('click', ClientUILogger.eventToggleAlertClicked);
		clearDiv.addEventListener('click', ClientUILogger.eventClearClicked);
		window.addEventListener('load', ClientUILogger.init);
		window.addEventListener('resize', ClientUILogger.resizeWindow);

		this.isCreated = true;
	},
	onToggleAlertClick: function() {
		this.toggleLevel(ClientUILogger.ALERT);
		this.buttonToggleAlert.innerHTML = 'Alert '+this.isLevelEnabled(ClientUILogger.ALERT);
	},
	onToggleLoggingClick: function(event) {
		this.toggleLogging();
		this.buttonToggleLogging.innerHTML = 'Logging '+this.isLoggingEnabled();
	},
	onClearClick: function(event) {
		if (event) {
			if (event.preventDefault) event.preventDefault();
			if (event.stopPropagation) event.stopPropagation();
		}
		this.logElement.innerHTML = '';
	},
	init: function() {
		if(ClientUILogger.mainDiv)
			document.body.appendChild(ClientUILogger.mainDiv);
		ClientUILogger.show();
	},
	resizeWindow: function() {
		ClientUILogger.show();
	},
	show: function() {
		if(this.logElement) {
			this.mainDiv.style.display = '';
			_cuilSetStyle(this.mainDiv, {width: this.width + 'px',
				height: this.height + 'px',
				top: this.top + 'px',
				left: this.left+ 'px',
				zIndex: '1000'});
			_cuilSetStyle(this.logElement, {width: '100%', height: '90%'});
			_cuilSetStyle(this.buttonsContainer, {width: '100%', height: '10%'});
			//KAW changed logger display place
		}
	},
	isLevelEnabled: function(level) {
		return this.hEnabledLevels[level];
	},
	isLoggingEnabled: function() {
		return this.bLoggingEnabled;
	},
	toggleLogging: function() {
		this.bLoggingEnabled = !this.bLoggingEnabled;
	},
	toggleLevel: function(level) {
		this.hEnabledLevels[level] = !this.hEnabledLevels[level];
	},
	log: function(level, infoText) {
		var bIgnoreLog = !this.isLoggingEnabled() || !this.isLevelEnabled(level);
		if (bIgnoreLog) {
			//PREMATURE RETURN no logging required
			return;
		}

		if (level == ClientUILogger.ALERT) {
			alert(infoText);
		}else{
			var msg = document.createElement("div");
			this.logElement.appendChild(msg);
			_cuilSetStyle(msg, {width: '100%'});

			var font = "bold normal bold 10pt Arial";
			var fontColor = "red";

			switch(level) {
				case ClientUILogger.INFO:
					fontColor = "black";
					font = "normal normal normal 10pt Arial";
					break;
				case ClientUILogger.WARNING:
					fontColor = "blue";
					font = "italic normal normal 10pt Arial";
					break;
				case ClientUILogger.ERROR:
					fontColor = "red";
					font = "normal normal bold 10pt Arial";
					break;
				case ClientUILogger.EVENT:
					fontColor = "green";
					font = "normal normal bold 10pt Arial";
					break;
				default:
					infoText = "UNRESOLVED: level=" + level + ", msg=" + infoText;
			}
			_cuilSetStyle(msg, {font: font});
			_cuilSetStyle(msg, {color: fontColor});
			msg.appendChild(document.createTextNode("> " + infoText));

			this.logElement.scrollTop = this.logElement.scrollHeight;
		}
	},
	getWindowWidth: function(){
	    var innerWidth;
		  if (navigator.appVersion.indexOf('MSIE')>0) {
			  innerWidth = document.body.clientWidth;
	    } else {
			  innerWidth = window.innerWidth;
	    }
	    return innerWidth;
	},
	getWindowHeight: function(){
	    var innerHeight;
		  if (navigator.appVersion.indexOf('MSIE')>0) {
			  innerHeight = document.body.clientHeight;
	    } else {
			  innerHeight = window.innerHeight;
	    }
	    return innerHeight;
	}
};

ClientUILib.load(false); //KAW debugging OFF

// declare predefined packages
var ClientUI = {
	controls: {},
	layouts: {}
};

// Some helper functions\
if(!ClientUILib.isIE){
	HTMLElement.prototype.click = function() {
		var evt = this.ownerDocument.createEvent('MouseEvents');
		evt.initMouseEvent('click', true, true, this.ownerDocument.defaultView, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
		this.dispatchEvent(evt);
	}
};

// Modificato da Link.it: l'originale faceva Object.extend(Event, {onReady: ...})
// inquinando il global Event (oltre a dipendere da Prototype). Ora ClientUILib
// espone direttamente onReady; nessuno consuma Event.onReady nel codebase.
ClientUILib.onReady = function(f) {
	if (document.readyState === 'complete' || document.readyState === 'interactive') {
		setTimeout(f, 0);
	} else {
		document.addEventListener('DOMContentLoaded', f);
	}
};

};
