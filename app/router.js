import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
	this.resource('settings', function() {
		this.resource('accounts', function() {
			this.route('add');
			this.route('edit', {path: '/:account_id'});
		});

		this.route('updates');
	});

	this.resource('conversation', {path: '/conversation/:contact_id'});
});

export default Router;
