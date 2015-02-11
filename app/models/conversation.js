import Ember from "ember-data";
import DS from "ember-data";

var Conversation = DS.Model.extend({
	name: DS.attr('string'),

	messages: DS.hasMany('message', {async: true}),

	lastMessage: function() {
		console.log("messages:", this.get("messages"));
		return this.get("messages").then(function(messages) {
			console.log("finished message promise:", messages);
			return messages[messages.length-1];
		});
	}.property("messages")
});

Conversation.reopenClass({
	FIXTURES: [
		{id: "test1@nightexcessive.us", name: "Test 1"},
		{id: "test2@nightexcessive.us", name: "Test 2"},
	]
});

export default Conversation;