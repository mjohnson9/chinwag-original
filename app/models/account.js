import DS from 'ember-data';

var Account = DS.Model.extend({
	boshURL: DS.attr('string'), // BOSH URL to use for this account
	password: DS.attr('string'), // Account's password

	contacts: DS.hasMany('contact')
});

export default Account;
