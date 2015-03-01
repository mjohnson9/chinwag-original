import Ember from 'ember';
import config from 'chinwag/config/environment';

export default Ember.Controller.extend({
	version: config.currentRevision
});
