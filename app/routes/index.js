import Ember from 'ember';

export default Ember.Route.extend({
	model: function() {
		return [
			{
				jid: "test1@nightexcessive.us",
				name: "Test 1",
				avatar_url: "https://secure.gravatar.com/avatar/4092542016a60f00a2cdee2601a2e571?d=identicon",
				last_message: "Derp"
			},
			{
				jid: "test2@nightexcessive.us",
				name: "Test 2",
				avatar_url: "https://secure.gravatar.com/avatar/4092542016a60f00a2cdee2601a2e571?d=identicon",
				last_message: "Derp 2"
			}
		];
	}
});
