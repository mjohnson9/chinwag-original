import Ember from 'ember';
import Resolver from 'ember/resolver';
import loadInitializers from 'ember/load-initializers';
import Strophe from 'strophe';
import config from './config/environment';

Strophe.log = function(level, msg) {
	if(level < config.APP.STROPHE_MIN_LOGLEVEL) {
		return;
	}

	var logFunction;
	switch(level) {
		case Strophe.LogLevel.DEBUG:
			logFunction = 'debug';
			break;
		case Strophe.LogLevel.INFO:
			logFunction = 'info';
			break;
		case Strophe.LogLevel.WARN:
			logFunction = 'warn';
			break;
		case Strophe.LogLevel.ERROR:
			logFunction = 'error';
			break;
		case Strophe.LogLevel.FATAL:
			Ember.Logger.error('[FATAL]', '[strophe]', msg);
			break;
		default:
			throw 'unknown log level: '+level;
	}

	Ember.Logger[logFunction]('[strophe]', msg);
};

Ember.MODEL_FACTORY_INJECTIONS = true;

var App = Ember.Application.extend({
	modulePrefix: config.modulePrefix,
	podModulePrefix: config.podModulePrefix,
	Resolver: Resolver
});

loadInitializers(App, config.modulePrefix);

export default App;
