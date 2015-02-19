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
		},

		manifest: {
			appcacheFile: '/manifest.appcache',
			excludePaths: ['index.html'],
			includePaths: [
				// Index
				'/',

				// Roboto Draft font files
				//   default font face
				'https://fonts.gstatic.com/s/robotodraft/v1/0xES5Sl_v6oyT7dAKuoni4gp9Q8gbYrhqGlRav_IXfk.woff2',
				'https://fonts.gstatic.com/s/robotodraft/v1/0xES5Sl_v6oyT7dAKuoni7rIa-7acMAeDBVuclsi6Gc.woff',
				//   medium font face
				'https://fonts.gstatic.com/s/robotodraft/v1/u0_CMoUf3y3-4Ss4ci-VwXJuJo8UJJfpGKt7pXjBv4s.woff2',
				'https://fonts.gstatic.com/s/robotodraft/v1/u0_CMoUf3y3-4Ss4ci-VwaTA90I55Xt7owhZwpPnMsc.woff',
				//   bold font face
				'https://fonts.gstatic.com/s/robotodraft/v1/u0_CMoUf3y3-4Ss4ci-Vwf79_ZuUxCigM2DespTnFaw.woff2',
				'https://fonts.gstatic.com/s/robotodraft/v1/u0_CMoUf3y3-4Ss4ci-VwRbnBKKEOwRKgsHDreGcocg.woff',
				//   italic font face
				'https://fonts.gstatic.com/s/robotodraft/v1/er-TIW55l9KWsTS1x9bTfgeOulFbQKHxPa89BaxZzA0.woff2',
				'https://fonts.gstatic.com/s/robotodraft/v1/er-TIW55l9KWsTS1x9bTfoo3ZslTYfJv0R05CazkwN8.woff'
			],
			fallback: ['* /'],
			network: ['/http-bind']
		},

		contentSecurityPolicy: {
			'default-src': "'none'",
			'script-src': "'self'",
			'font-src': "'self' https://fonts.gstatic.com/s/robotodraft/",
			'connect-src': "'self'",
			'img-src': "'self' data:",
			'style-src': "'self'",
			'media-src': "'self'"
		}
	};

	if (environment === 'development') {
		/*ENV.APP.LOG_RESOLVER = true;
		ENV.APP.LOG_ACTIVE_GENERATION = true;
		ENV.APP.LOG_TRANSITIONS = true;
		ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
		ENV.APP.LOG_VIEW_LOOKUPS = true;*/
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
