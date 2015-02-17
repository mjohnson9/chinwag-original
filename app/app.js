import Ember from 'ember';
import Resolver from 'ember/resolver';
import loadInitializers from 'ember/load-initializers';
import config from './config/environment';

window.addEventListener('load', function(e) {
	if(window.applicationCache != null) {
		window.applicationCache.addEventListener('updateready', function(e) {
			if(window.applicationCache.status == window.applicationCache.UPDATEREADY) {
				window.applicationCache.swapCache();
				window.location.reload();
			}
		}, false);
		window.applicationCache.addEventListener('obsolete', function(e) {
			if(window.applicationCache.status == window.applicationCache.OBSOLETE) {
				window.location.reload();
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
