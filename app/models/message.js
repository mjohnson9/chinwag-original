import DS from 'ember-data';
import Strophe from 'strophe';

var Message = DS.Model.extend({
	conversation: DS.belongsTo('conversation'),

	from: DS.attr('string'),
	to: DS.attr('string'),

	time: DS.attr('date'),
	message: DS.attr('string'),

	isIncoming: function() {
		return Strophe.getBareJidFromJid(this.get('from')) !== this.get('conversation.account.id');
	}.property('conversation', 'from')
});

export default Message;
