import Ember from 'ember';
import moment from "moment";
import config from '../config/environment';

function statusToString(status) {
	switch(status) {
		case window.applicationCache.UNCACHED:
			return 'uncached';
		case window.applicationCache.IDLE:
			return 'idle';
		case window.applicationCache.CHECKING:
			return 'checking';
		case window.applicationCache.DOWNLOADING:
			return 'downloading';
		case window.applicationCache.UPDATEREADY:
			return 'update_ready';
		case window.applicationCache.OBSOLETE:
			return 'obsolete';
		default:
			return 'unknown';
	}
}

var applicationCacheEvents = ['checking', 'downloading', 'progress', 'error', 'obsolete', 'cached', 'noupdate', 'updateready'];

export default Ember.Controller.extend({
	needs: ['application'],

	version: config.currentRevision,

	_updateSupported: function() {
		this.set('updateSupported', window.applicationCache != null);
	}.on('init'),

	_updateStatus: function(e) {
		this.set('updateStatusInternal', window.applicationCache.status);

		if(e != null && e.type != null) {
			switch(e.type) {
				case 'progress':
					if(e.lengthComputable) {
						var progress = (e.loaded/e.total*100).toFixed(1);
						this.set('updateStatus', 'Downloading updates: '+progress+'%');
						return;
					}
					break;
			}
		}

		switch(window.applicationCache.status) {
			case window.applicationCache.UNCACHED:
				this.set('updateStatus', 'Updates disabled. You are using the live version of the client.');
				break;
			case window.applicationCache.IDLE:
				this.set('updateStatus', 'No updates available.');
				break;
			case window.applicationCache.CHECKING:
				this.set('updateStatus', 'Checking for updates...');
				break;
			case window.applicationCache.DOWNLOADING:
				this.set('updateStatus', 'Downloading updates...');
				break;
			case window.applicationCache.UPDATEREADY:
				this.set('updateStatus', 'Update downloaded. Refresh the client for it to take effect.');
				break;
			case window.applicationCache.OBSOLETE:
				this.set('updateStatus', 'Updates disabled. Refresh to load the live version of the client.');
				break;
			default:
				this.set('updateStatus', 'Unknown status: '+window.applicationCache.status);
				break;
		}
	},

	_teardownEventListeners: function() {
		if(this._updateStatusClosure != null) {
			for(var i = 0; i < applicationCacheEvents.length; i++) {
				console.log('[application-cache]', 'Removed listener for', applicationCacheEvents[i]);
				window.applicationCache.removeEventListener(applicationCacheEvents[i], this._updateStatusClosure, false);
			}

			delete this._updateStatusClosure;
		}
	}.on('willDestroy'),

	_setupEventListeners: function() {
		if(!this.get('updateSupported')) {
			this.set('updateStatus', 'Your browser not support updates.');
			return;
		}

		this._updateStatusClosure = this._updateStatus.bind(this);

		for(var i = 0; i < applicationCacheEvents.length; i++) {
			console.log('[application-cache]', 'Added listener for', applicationCacheEvents[i]);
			window.applicationCache.addEventListener(applicationCacheEvents[i], this._updateStatusClosure, false);
		}

		this._updateStatus();
	}.observes('updateSupported'),

	updateDisabled: function() {
		if(!this.get('updateSupported')) {
			return true;
		}

		var updateStatus = this.get('updateStatusInternal');
		return updateStatus !== window.applicationCache.IDLE;
	}.property('updateStatusInternal', 'updateSupported'),

	updateShowRefresh: function() {
		if(!this.get('updateSupported')) {
			return false;
		}

		var updateStatus = this.get('updateStatusInternal');
		return updateStatus === window.applicationCache.UPDATEREADY || updateStatus === window.applicationCache.OBSOLETE;
	}.property('updateStatusInternal', 'updateSupported'),

	actions: {
		refreshPage: function() {
			window.location.reload();
		},

		checkForUpdates: function() {
			window.applicationCache.update();
		}
	}
});
