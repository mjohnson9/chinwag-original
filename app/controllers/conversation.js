import Ember from 'ember';

export default Ember.ObjectController.extend({
	needs: ['connections'],

	actions: {
		sendMessage: function() {
			var message = this.get('messageToSend');
			this.set('messageToSend', '');
			if(message == null) {
				return;
			}
			message = message.trim();
			if(message.length <= 0) {
				return;
			}

			var account = this.get('accounts').objectAt(0);
			if(account == null) {
				Ember.Logger.error('[conversation]', 'Cannot find account for contact:', this.get('id'));
				return;
			}

			var connectionMap = this.get('controllers.connections.connections');
			var connection = connectionMap.get(account.get('id'));
			connection.sendMessage(this.get('id'), message);
		}
	}
});
