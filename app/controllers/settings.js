import Ember from 'ember';
import config from '../config/environment';

export default Ember.Controller.extend({
	needs: ['application'],

	version: config.currentRevision,

	updateShowRefresh: Ember.computed.alias('controllers.application.updateShowRefresh'),
	updateDisabled: Ember.computed.alias('controllers.application.updateDisabled'),
	updateStatus: Ember.computed.alias('controllers.application.updateStatus'),

	actions: {
		refreshPage: function() {
			window.location.reload();
		},

		checkForUpdates: function() {
			window.applicationCache.update();
		}
	}
});
