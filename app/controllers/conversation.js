import Ember from 'ember';

export default Ember.ObjectController.extend({
	actions: {
		submit: function() {
			alert("Would send message, but I'm just a prototype!");
		}
	}
});
