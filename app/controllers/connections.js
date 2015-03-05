import Ember from 'ember';
import Connection from 'chinwag/utils/connection';

export default Ember.ArrayController.extend({
	notificationSound: null,

	connections: null,
	unloadBind: null,

	_initConnections: function() {
		this.set('connections', Ember.Map.create());
	}.on('init'),

	_initNotifications: function() {
		if(window.Notification != null) {
			window.Notification.requestPermission();
		}
		if(window.Audio != null) {
			this.notificationSound = new Audio('/sounds/received.m4a');
			this.notificationSound.preload = 'auto';
		}
	}.on('init'),

	_initModels: function() {
		console.debug('[connections] Fetching accounts...');
		this.set('model', this.store.filter('account', {}, function() {
			return true;
		}));
	}.on('init'),

	actions: {
		playNotificationSound: function() {
			if(this.notificationSound != null) {
				this.notificationSound.currentTime = 0;
				this.notificationSound.play();
			}
		}
	}
});
