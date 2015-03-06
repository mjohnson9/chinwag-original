import Ember from 'ember';

export default Ember.ArrayController.extend({
	actions: {
		newConversation: function() {
			this.transitionToRoute('conversation-new');
		}
	}
});
