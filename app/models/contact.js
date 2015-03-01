import DS from 'ember-data';

var Contact = DS.Model.extend({
	accounts: DS.hasMany('account'),

	name: DS.attr('string'), // Contact's display name
	avatar: DS.attr('string'), // data: avatar
	subscription: DS.attr('string'),

	resources: DS.hasMany('resource'),

	messages: DS.hasMany('message')
});

export default Contact;
