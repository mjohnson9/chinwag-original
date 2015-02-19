import DS from "ember-data";

var Conversation = DS.Model.extend({
	contact: DS.belongsTo("contact", {async: true}), // Contact that this conversation belongs to

	messages: DS.hasMany('message', {async: true}), // Any messages sent in this conversation

	lastMessage: function() { // The last message sent in this conversation
		return this.get("messages").then(function(messages) {
			return messages[messages.length-1];
		});
	}.property("messages")
});

Conversation.reopenClass({
	FIXTURES: [
		{id: "michael@nightexcessive.us", contact: "michael@nightexcessive.us", messages: ["t1h1", "t1h2", "t1h3", "t1h4", "t1h5"]},
		{id: "test@nightexcessive.us", contact: "test@nightexcessive.us", messages: ["t2h1", "t2h2", "t2h3", "t2h4", "t2h5"]},
	]
});

export default Conversation;
