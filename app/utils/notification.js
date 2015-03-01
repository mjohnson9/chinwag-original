import Ember from 'ember';

export default Ember.Object.extend({
	title: undefined,
	body: undefined,
	icon: undefined,
	timeout: undefined,

	_notification: undefined,
	_timeoutTimer: undefined,

	show: function() {
		var notification = new Notification(this.get('title'), {
			body: this.get('body'),
			icon: this.get('icon')
		});

		notification.onshow = this._onShow.bind(this);
		notification.onclose = this._onClose.bind(this);
	},

	hide: function() {

	},

	_onShow: function() {
		var timeout = this.get('timeout');
		if(timeout === undefined) {
			return;
		}

		this.set('_timeoutTimer', Ember.run.later(this._notification, this._notification.close, timeout));
	},

	_onClose: function() {
		var timer = this.get('_timeoutTimer');
		if(timer === undefined) {
			return;
		}

		Ember.run.cancel(timer);
		this.set('_timeoutTimer', undefined);
	}
});
