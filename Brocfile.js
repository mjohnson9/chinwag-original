/* global require, module */
var mergeTrees = require('broccoli-merge-trees');
var manifest = require('broccoli-manifest');

var EmberApp = require('ember-cli/lib/broccoli/ember-app');

var app = new EmberApp();

// Use `app.import` to add additional libraries to the generated
// output files.
//
// If you need to use different assets in different
// environments, specify an object as the first parameter. That
// object's keys should be the environment name and the values
// should be the asset to use in that environment.
//
// If the library that you are including contains AMD or ES6
// modules that you would like to import into your application
// please specify an object with the list of modules as keys
// along with the exports of each module as its value.

app.import(app.bowerDirectory + '/moment/min/moment-with-locales.js');
app.import(app.bowerDirectory + '/ember-cli-moment-shim/moment-shim.js', {
	exports: {
		moment: ['default']
	}
});
app.import(app.bowerDirectory + '/moment-timezone/moment-timezone.js');

var tree = app.toTree();

if(app.env == 'production') {
	var manifestTree = manifest(tree, {
		appcacheFile: '/manifest.appcache',
		includePaths: [
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
		fallback: ['* /index.html'],
		network: []
	});
	tree = mergeTrees([tree, manifestTree]);
}

module.exports = tree;
