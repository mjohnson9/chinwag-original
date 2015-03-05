import Ember from 'ember';

export default Ember.ObjectController.extend({
	needs: ['connections'],

	accountController: function() {
		var connectionMap = this.get('controllers.connections.connections');
		var connection = connectionMap.get(this.get('model.id'));
		console.warn('connection:', connection);
		return connection;
	}.property('model.id', 'controllers.connections.connections'),

	status: Ember.computed.oneWay('accountController.connection.connection.status')
});
