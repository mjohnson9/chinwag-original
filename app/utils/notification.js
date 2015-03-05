import Ember from 'ember';

export default Ember.Object.extend(Ember.Evented, {
	title: undefined,
	body: undefined,
	icon: undefined,
	timeout: undefined,

	_notification: undefined,
	_timeoutTimer: undefined,

	show: function() {
		var notification = new window.Notification(this.get('title'), {
			body: this.get('body'),
			icon: this.get('icon')
		});

		notification.onshow = this._onShow.bind(this);
		notification.onclose = this._onClose.bind(this);
	},

	hide: function() {
		this.get('notification').close();
	},

	_onShow: function() {
		this.trigger('show');

		var timeout = this.get('timeout');
		if(timeout === undefined) {
			return;
		}

		this.set('_timeoutTimer', Ember.run.later(this, this.hide, timeout));
	},

	_onClose: function() {
		this.trigger('close');

		var timer = this.get('_timeoutTimer');
		if(timer === undefined) {
			return;
		}

		Ember.run.cancel(timer);
		this.set('_timeoutTimer', undefined);
	}
});
