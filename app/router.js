import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
	this.route('settings');

	this.resource('conversation', {path: '/conversation/:contact_id'});
});

export default Router;
