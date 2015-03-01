import Ember from 'ember';

export default Ember.ObjectController.extend({
	needs: ['connections'],

	accountController: function() {
		var connectionMap = this.get('controllers.connections.connections');
		return connectionMap.get(this.get('model.id'));
	}.property('model.id'),

	status: Ember.computed.oneWay('accountController.connectionStatus')
});
