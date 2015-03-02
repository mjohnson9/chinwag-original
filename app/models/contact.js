import DS from 'ember-data';

export default DS.Model.extend({
	account: DS.belongsTo('account'),

	name: DS.attr('string'), // Contact's display name
	avatar: DS.attr('string'), // Avatar URL
	subscription: DS.attr('string'),

	conversation: DS.belongsTo('conversation'),

	resources: DS.hasMany('resource'),

	messages: DS.hasMany('message')
});
