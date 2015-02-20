import DS from 'ember-data';

var Resource = DS.Model.extend({
	contact: DS.belongsTo('contact'),
	name: DS.attr('string'), // Resource's name
	presence: DS.attr('string')
});

export default Resource;
