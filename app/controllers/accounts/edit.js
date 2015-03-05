import Ember from 'ember';

// TODO: Save changes to the model
export default Ember.ObjectController.extend({
	needs: ['connections'],

	accountController: function() {
		var connectionMap = this.get('controllers.connections.connections');
		return connectionMap.get(this.get('model.id'));
	}.property('model.id'),
	status: Ember.computed.oneWay('accountController.connectionStatus'),

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
