import Ember from 'ember';

export default Ember.ObjectController.extend({
	actions: {
		sendMessage: function() {
			this.set('messageToSend', '');
			alert('Would send message, but I\'m just a prototype!');
		}
	}
});
