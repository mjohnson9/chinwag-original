import DS from 'ember-data';
import Strophe from 'strophe';

var Message = DS.Model.extend({
	contact: DS.belongsTo('contact'),

	from: DS.attr('string'),
	to: DS.attr('string'),

	time: DS.attr('date'),
	message: DS.attr('string'),

	unread: DS.attr('boolean', {defaultValue: true}),

	isIncoming: function() {
		return this.get('contact.id') === Strophe.getBareJidFromJid(this.get('from'));
	}.property('contact', 'from')
});

export default Message;
