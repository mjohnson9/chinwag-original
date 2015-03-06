import Ember from 'ember';

export default Ember.ArrayController.extend({
	itemController: 'conversation-new-item',

	actions: {
		newConversation: function(contact_id) {
			var id = contact_id+':conversation';

			if(this.store.hasRecordForId('conversation', id)) {
				this.transitionToRoute('conversation', id);
				return;
			}

			var account_id = contact_id.substr(0, contact_id.indexOf(':'));

			var account = this.store.getById('account', account_id);
			if(account == null) {
				console.error('Attempted to add a conversation for an account that doesn\'t exist:', account_id);
				return;
			}

			var contact = this.store.getById('contact', contact_id);
			if(contact == null) {
				console.error('Attempted to add a conversation for a contact that doesn\'t exist:', contact_id);
				return;
			}

			this.store.createRecord('conversation', {
				id: id,
				account: account,
				contact: contact
			}).save().then(function() {
				this.transitionToRoute('conversation', id);
			}.bind(this)).catch(function(e) {
				console.error('Failed to save conversation:', e);
				alert('TODO: Handle conversation save failure');
			}.bind(this));
		}
	}
});
