import Ember from 'ember';
import Resolver from 'ember/resolver';
import loadInitializers from 'ember/load-initializers';
import Strophe from 'strophe';
import config from './config/environment';

Strophe.log = function(level, msg) {
	if(level < config.APP.STROPHE_MIN_LOGLEVEL) {
		return;
	}

	switch(level) {
		case Strophe.LogLevel.DEBUG:
			console.debug('[strophe] %s', msg);
			break;
		case Strophe.LogLevel.INFO:
			console.info('[strophe] %s', msg);
			break;
		case Strophe.LogLevel.WARN:
			console.warn('[strophe] %s', msg);
			break;
		case Strophe.LogLevel.ERROR:
			console.error('[strophe] %s', msg);
			break;
		case Strophe.LogLevel.FATAL:
			console.error('[FATAL] [strophe] %s', msg);
			break;
		default:
			throw 'unknown log level: '+level;
			break;
	}
};

Ember.MODEL_FACTORY_INJECTIONS = true;

var App = Ember.Application.extend({
	modulePrefix: config.modulePrefix,
	podModulePrefix: config.podModulePrefix,
	Resolver: Resolver
});

loadInitializers(App, config.modulePrefix);

export default App;
