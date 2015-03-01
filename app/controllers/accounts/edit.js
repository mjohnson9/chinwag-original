import Ember from 'ember';

export default Ember.ObjectController.extend({
	actions: {
		deleteAccount: function() {
			// TODO: Add confirmation dialog
			var account = this.get('model');
			account.deleteRecord();
			account.save();

			this.transitionToRoute('accounts');
		}
	}
});
