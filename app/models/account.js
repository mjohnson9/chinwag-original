import DS from 'ember-data';

var Account = DS.Model.extend({
	boshURL: DS.attr('string'), // BOSH URL to use for this account
	password: DS.attr('string'), // Account's password

	contacts: DS.hasMany('contact')
});

Account.reopenClass({
	FIXTURES: [
		{id: 'test@nightexcessive.us', password: 'asdf1234', boshURL: 'https://chinwag.nightexcessive.us/http-bind'}
	]
});

export default Account;
