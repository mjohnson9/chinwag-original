import Ember from 'ember';
import Resolver from 'ember/resolver';
import loadInitializers from 'ember/load-initializers';
import config from './config/environment';

window.addEventListener('load', function() {
	if(window.applicationCache != null) {
		var reloadPage = function() {
			window.location.reload();
		};
		window.applicationCache.addEventListener('updateready', function() {
			if(window.applicationCache.status === window.applicationCache.UPDATEREADY) {
				return reloadPage();
			}
		}, false);
		window.applicationCache.addEventListener('obsolete', function() {
			if(window.applicationCache.status === window.applicationCache.OBSOLETE) {
				return reloadPage();
			}
		}, false);
	}
}, false);

Ember.MODEL_FACTORY_INJECTIONS = true;

var App = Ember.Application.extend({
	modulePrefix: config.modulePrefix,
	podModulePrefix: config.podModulePrefix,
	Resolver: Resolver,

	customEvents: {
		checking: 'applicationCacheChecking'
	}
});

loadInitializers(App, config.modulePrefix);

export default App;
