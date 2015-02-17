import Ember from 'ember';
import Resolver from 'ember/resolver';
import loadInitializers from 'ember/load-initializers';
import config from './config/environment';

window.addEventListener('load', function() {
	if(window.applicationCache != null) {
		window.applicationCache.addEventListener('obsolete', function() {
			if(window.applicationCache.status === window.applicationCache.OBSOLETE) {
				// Due to the special nature of obsolete, we always reload the page.
				window.location.reload();
			}
		}, false);
	}
}, false);

Ember.MODEL_FACTORY_INJECTIONS = true;

var App = Ember.Application.extend({
	modulePrefix: config.modulePrefix,
	podModulePrefix: config.podModulePrefix,
	Resolver: Resolver
});

loadInitializers(App, config.modulePrefix);

export default App;
