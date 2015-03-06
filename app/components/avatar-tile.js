import Ember from 'ember';

export default Ember.Component.extend({
	tagName: 'img',
	attributeBindings: ['tileURL:src', 'title', 'alt'],

	tileURL: function() {
		var name = this.get('name');
		if(name == null || name.length <= 0) {
			return;
		}

		var letter = name[0].toLowerCase();
		return "/avatar-tiles/"+letter+".png";
	}.property('name')
});
