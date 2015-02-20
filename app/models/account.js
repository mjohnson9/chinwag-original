import DS from 'ember-data';

var Account = DS.Model.extend({
	boshURL: DS.attr('string'), // BOSH URL to use for this account
	password: DS.attr('string'), // Account's password
	resource: DS.attr('string') // Account's resource
});

Account.reopenClass({
	FIXTURES: [
		{id: 'test@nightexcessive.us', password: 'asdf1234', resource: 'chinwag-test-desktop', boshURL: 'https://chinwag.nightexcessive.us/http-bind'}
	]
});

export default Account;
