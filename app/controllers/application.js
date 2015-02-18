import Ember from 'ember';
import moment from 'moment';

var millisecond = 1;
var second = millisecond*1000;
var minute = second*60;
var hour = minute*60;
//var day = hour*24;

var applicationCacheEvents = ['checking', 'downloading', 'progress', 'error', 'obsolete', 'cached', 'noupdate', 'updateready'];

export default Ember.Controller.extend({
	updateInterval: 1*hour+5*minute,
	updateInaccuracy: 30*minute,

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

		this.set('updateStatus', undefined);
		this.set('lastUpdateCheck', undefined);
		switch(window.applicationCache.status) {
			case window.applicationCache.UNCACHED:
				this.set('updateStatus', 'Updates are disabled. You are using the live version of the client.');
				break;
			case window.applicationCache.IDLE:
				this.set('lastUpdateCheck', moment());
				this._setUpdateClock();
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
				this.set('updateStatus', 'Updates are disabled. Refresh to load the live version of the client.');
				break;
			default:
				this.set('updateStatus', 'Unknown status: '+window.applicationCache.status);
				break;
		}
	},

	_setUpdateClock: function() {
		this._cancelUpdateClock();

		var lastUpdateCheck = this.get('lastUpdateCheck');
		if(lastUpdateCheck == null) {
			return;
		}

		var nextUpdateCheck = lastUpdateCheck.add(this.updateInterval+(Math.random()*this.updateInaccuracy));
		console.log('[application-cache]', 'Next update check at', nextUpdateCheck.format());

		this.set('updateTimer', Ember.run.later(this, this._checkForUpdates, nextUpdateCheck.diff()));
	},

	_cancelUpdateClock: function() {
		var timer = this.get('updateTimer');
		if(timer != null) {
			Ember.Logger.debug('[application-cache]', 'Update timer cancelled');
			Ember.run.cancel(timer);
			this.set('updateTimer', undefined);
		}
	}.on('willDestroyElement'),

	_checkForUpdates: function() {
		window.applicationCache.update();
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
	}.property('updateStatusInternal', 'updateSupported')
});
