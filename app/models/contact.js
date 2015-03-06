import DS from 'ember-data';

var Contact = DS.Model.extend({
	jid: function() {
		var id = this.get('id');
		return id.substr(id.indexOf(":")+1);
	}.property('id'),

	account: DS.belongsTo('account'),

	name: DS.attr('string'), // Contact's display name
	avatar: DS.attr('string'), // Avatar URL
	subscription: DS.attr('string'),

	conversation: DS.belongsTo('conversation'),

	resources: DS.hasMany('resource'),

	messages: DS.hasMany('message')
});

Contact.reopenClass({
	FIXTURES: []
});

export default Contact;
