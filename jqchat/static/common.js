// Javascript scripts used in all projects

function ExceptionHandler(){
/* Catch JS errors in the browsers and tell the server about them.
	 Originally I took the error handler from the jQuery docs:
	 http://docs.jquery.com/Events/error#fn
	 However, this does not work, see:
	 http://www.nabble.com/mysterious-$(window).error-behavior-td21633537s27240.html
	 I followed that page's advice and switched to a window.onerror instead.
	 
	 Furthermore, is basically an IE-only feature at the moment:
	 - Firefox support is borked (http://blogs.cozi.com/tech/2008/04/javascript-error-tracking-why-windowonerror-is-not-enough.html)
	 - Safari and Opera don't support it at all.
	 So it's useful - after all, IE is still majority browser - but not failsafe.
	 	
*/
	window.onerror = function(msg, uri, line) {
		jQuery.post("/common/javascript_errors/", {msg: msg, uri: uri, line: line});
	}
};

//$.toJSON(), takes an object and serialises it into a JSON string. 
// taken from http://www.overset.com/2008/04/11/mark-gibsons-json-jquery-updated/.
(function ($) {
    m = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
	},
	$.toJSON = function (value, whitelist) {
		var a,          // The array holding the partial texts.
			i,          // The loop counter.
			k,          // The member key.
			l,          // Length.
			r = /["\\\x00-\x1f\x7f-\x9f]/g,
			v;          // The member value.

		switch (typeof value) {
		case 'string':
			return r.test(value) ?
				'"' + value.replace(r, function (a) {
					var c = m[a];
					if (c) {
						return c;
					}
					c = a.charCodeAt();
					return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
				}) + '"' :
				'"' + value + '"';

		case 'number':
			return isFinite(value) ? String(value) : 'null';

		case 'boolean':
		case 'null':
			return String(value);

		case 'object':
			if (!value) {
				return 'null';
			}
			if (typeof value.toJSON === 'function') {
				return $.toJSON(value.toJSON());
			}
			a = [];
			if (typeof value.length === 'number' &&
					!(value.propertyIsEnumerable('length'))) {
				l = value.length;
				for (i = 0; i < l; i += 1) {
					a.push($.toJSON(value[i], whitelist) || 'null');
				}
				return '[' + a.join(',') + ']';
			}
			if (whitelist) {
				l = whitelist.length;
				for (i = 0; i < l; i += 1) {
					k = whitelist[i];
					if (typeof k === 'string') {
						v = $.toJSON(value[k], whitelist);
						if (v) {
							a.push($.toJSON(k) + ':' + v);
						}
					}
				}
			} else {
				for (k in value) {
					if (typeof k === 'string') {
						v = $.toJSON(value[k], whitelist);
						if (v) {
							a.push($.toJSON(k) + ':' + v);
						}
					}
				}
			}
			return '{' + a.join(',') + '}';
		}
	};
	
})(jQuery);

GLOBALS = []