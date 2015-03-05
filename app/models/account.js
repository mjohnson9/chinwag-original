import DS from 'ember-data';

export default DS.Model.extend({
	enabled: DS.attr('boolean', {defaultValue: true}), // Whether or not the account is enabled

	boshURL: DS.attr('string'), // BOSH URL to use for this account
	password: DS.attr('string'), // Account's password

	contacts: DS.hasMany('contact'),
	conversations: DS.hasMany('conversation')
});
