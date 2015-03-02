import Ember from 'ember';

export default Ember.Controller.extend({
	needs: ['updates'],

	updateLastCheck: Ember.computed.alias('controllers.updates.lastCheck'),
	updateNextCheck: Ember.computed.alias('controllers.updates.nextCheck'),

	updateStatus: function() {
		var status = this.get('controllers.updates.status.status');

		switch(status) {
			case 'noupdate':
				return;
			case 'error':
				//return 'Updates are disabled. You are using the live version of the client.';
				return 'An error occurred while checking for updates.';
			case 'checking':
				return 'Checking for updates...';
			case 'downloading':
				var progress = this.get('controllers.updates.status.progress');
				if(progress == null) {
					return 'Downloading updates...';
				}
				var progressFormatted = (progress*100).toFixed(1);
				return 'Downloading updates: '+progressFormatted+'%';
			case 'updateready':
				return 'Updates downloaded. Refresh the client for it to take effect.';
			case 'obsolete':
				return 'Updates are disabled. Refresh the client to load the live version.';
			case 'unsupported':
				return 'Your browser does not support updates.';
			default:
				return 'Unknown update status: '+status;
		}
	}.property('controllers.updates.status.status', 'controllers.updates.status.progress'),

	showLastCheck: function() {
		var status = this.get('controllers.updates.status.status');

		return status === 'noupdate';
	}.property('controllers.updates.status.status'),

	updateDisabled: function() {
		var status = this.get('controllers.updates.status.status');

		return status !== 'noupdate';
	}.property('controllers.updates.status.status'),

	updateShowRefresh: function() {
		var status = this.get('controllers.updates.status.status');

		return status === 'updateready' || status === 'obsolete';
	}.property('controllers.updates.status.status'),

	actions: {
		refreshPage: function() {
			window.location.reload();
		},

		checkForUpdates: function() {
			this.get('controllers.updates').checkForUpdates();
		}
	}
});
