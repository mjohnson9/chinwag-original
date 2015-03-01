/* jshint node: true */

module.exports = function(environment) {
	var ENV = {
		modulePrefix: 'chinwag',
		environment: environment,
		baseURL: '/',
		locationType: undefined,
		EmberENV: {
			FEATURES: {
				// Here you can enable experimental features on an ember canary build
				// e.g. 'with-controller': true
			}
		},

		APP: {
			// Here you can pass flags/options to your application instance
			// when it is created
			STROPHE_MIN_LOGLEVEL: 2 // WARN
		},

		contentSecurityPolicy: {
			'default-src': "'none'",
			'script-src': "'self'",
			'font-src': "'self' https://fonts.gstatic.com/s/robotodraft/",
			'connect-src': "*",
			'img-src': "'self' data:",
			'style-src': "'self'",
			'media-src': "'self'"
		}
	};

	if (environment === 'development') {
		// ENV.APP.LOG_RESOLVER = true;
		// ENV.APP.LOG_ACTIVE_GENERATION = true;
		// ENV.APP.LOG_TRANSITIONS = true;
		// ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
		// ENV.APP.LOG_VIEW_LOOKUPS = true;
		ENV.APP.LOG_RAW_XMPP = true;
		ENV.APP.STROPHE_MIN_LOGLEVEL = 0; // DEBUG
		ENV.contentSecurityPolicy['connect-src'] = ENV.contentSecurityPolicy['connect-src']+' https://chinwag.nightexcessive.us/http-bind';
	}

	if (environment === 'test') {
		// Testem prefers this...
		ENV.baseURL = '/';
		ENV.locationType = 'none';

		// keep test console output quieter
		ENV.APP.LOG_ACTIVE_GENERATION = false;
		ENV.APP.LOG_VIEW_LOOKUPS = false;

		ENV.APP.rootElement = '#ember-testing';
	}

	if (environment === 'production') {

	}

	return ENV;
};
