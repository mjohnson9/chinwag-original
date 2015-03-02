import DS from 'ember-data';

export default DS.Model.extend({
	account: DS.belongsTo('account'),
	contact: DS.belongsTo('contact'),

	messages: DS.hasMany('message')
});
