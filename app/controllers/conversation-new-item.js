import Ember from 'ember';

export default Ember.ObjectController.extend({
	actions: {
		startConversation: function() {
			this.send('newConversation', this.get('content.id'));
		}
	}
});
