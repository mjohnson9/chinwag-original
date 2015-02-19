import DS from 'ember-data';
import moment from 'moment';

var Message = DS.Model.extend({
	conversation: DS.belongsTo('conversation', {async: true}),

	from: DS.attr('string'),
	to: DS.attr('string'),

	time: DS.attr('date'),
	message: DS.attr('string')
});

var millisecond = 1;
var second = millisecond*1000;
var minute = second*60;
var hour = minute*60;
var day = hour*24;

var actionTime = 5*second;

Message.reopenClass({
	FIXTURES: [
		{id: 't1h1', conversation: 'michael@nightexcessive.us', from: 'michael@nightexcessive.us', to: 'receiver@nightexcessive.us', time: moment().subtract(day*7-actionTime).toDate(), message: 'Hello (week)'},
		{id: 't1h2', conversation: 'michael@nightexcessive.us', from: 'michael@nightexcessive.us', to: 'receiver@nightexcessive.us', time: moment().subtract(day-actionTime).toDate(), message: 'Hello (day)'},
		{id: 't1h3', conversation: 'michael@nightexcessive.us', from: 'michael@nightexcessive.us', to: 'receiver@nightexcessive.us', time: moment().subtract(hour-actionTime).toDate(), message: 'Hello (hour)'},
		{id: 't1h4', conversation: 'michael@nightexcessive.us', from: 'michael@nightexcessive.us', to: 'receiver@nightexcessive.us', time: moment().subtract(minute-actionTime).toDate(), message: 'Hello (minute)'},
		{id: 't1h5', conversation: 'michael@nightexcessive.us', from: 'michael@nightexcessive.us', to: 'receiver@nightexcessive.us', time: moment().toDate(), message: 'Hello (now)'},

		{id: 't2h1', conversation: 'test@nightexcessive.us', from: 'test@nightexcessive.us', to: 'receiver@nightexcessive.us', time: moment().subtract(day*7-actionTime).toDate(), message: 'Hello (week)'},
		{id: 't2h2', conversation: 'test@nightexcessive.us', from: 'test@nightexcessive.us', to: 'receiver@nightexcessive.us', time: moment().subtract(day-actionTime).toDate(), message: 'Hello (day)'},
		{id: 't2h3', conversation: 'test@nightexcessive.us', from: 'test@nightexcessive.us', to: 'receiver@nightexcessive.us', time: moment().subtract(hour-actionTime).toDate(), message: 'Hello (hour)'},
		{id: 't2h4', conversation: 'test@nightexcessive.us', from: 'test@nightexcessive.us', to: 'receiver@nightexcessive.us', time: moment().subtract(minute-actionTime).toDate(), message: 'Hello (minute)'},
		{id: 't2h5', conversation: 'test@nightexcessive.us', from: 'test@nightexcessive.us', to: 'receiver@nightexcessive.us', time: moment().toDate(), message: 'Hello (now)'},
	]
});

export default Message;
