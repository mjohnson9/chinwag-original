import DS from 'ember-data';

var Conversation = DS.Model.extend({
	account: DS.belongsTo('account'),
	contact: DS.belongsTo('contact'),

	messages: DS.hasMany('message')
});

Conversation.reopenClass({
	FIXTURES: []
});

export default Conversation;
