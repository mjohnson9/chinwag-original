import Ember from 'ember';

export default Ember.Component.extend({
	classNames: 'modal-dialog',

	actions: {
		close: function() {
			return this.sendAction();
		}
	}
});
