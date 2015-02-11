import DS from "ember-data";
import moment from "moment";

var Message = DS.Model.extend({
	conversation: DS.belongsTo('conversation', {async: true}),

	from: DS.attr('string'),
	to: DS.attr('string'),

	time: DS.attr('date'),
	message: DS.attr('string'),

	timeFormatted: function() {
		return moment(this.get("time")).format("l LT");
	}.property("time")
});

var millisecond = 1;
var second = millisecond*1000;
var minute = second*60;
var hour = minute*60;
var day = hour*24;

var diffBeforeFromNow = 45*second; // 30 seconds
var diffBeforeTime = 1*hour; // 1 hour
var diffBeforeShortDatetime = 22*hour; // 22 hours
var diffBeforeLongDatetime = 4*day; // 4 days

var actionTime = 5*second;

Message.reopenClass({
	FIXTURES: [
		{id: "t2h1", conversation: "test2@nightexcessive.us", from: "test2@nightexcessive.us", to: "receiver@nightexcessive.us", time: moment().subtract(diffBeforeLongDatetime-actionTime).toDate(), message: "Hello (long datetime)"},
		{id: "t2h2", conversation: "test2@nightexcessive.us", from: "test2@nightexcessive.us", to: "receiver@nightexcessive.us", time: moment().subtract(diffBeforeShortDatetime-actionTime).toDate(), message: "Hello (short datetime)"},
		{id: "t2h3", conversation: "test2@nightexcessive.us", from: "test2@nightexcessive.us", to: "receiver@nightexcessive.us", time: moment().subtract(diffBeforeTime-actionTime).toDate(), message: "Hello (time)"},
		{id: "t2h4", conversation: "test2@nightexcessive.us", from: "test2@nightexcessive.us", to: "receiver@nightexcessive.us", time: moment().subtract(diffBeforeFromNow-actionTime).toDate(), message: "Hello (fromNow)"},
		{id: "t2h5", conversation: "test2@nightexcessive.us", from: "test2@nightexcessive.us", to: "receiver@nightexcessive.us", time: moment().toDate(), message: "Hello (now)"},

		{id: "t1h1", conversation: "test1@nightexcessive.us", from: "test1@nightexcessive.us", to: "receiver@nightexcessive.us", time: moment().subtract(diffBeforeLongDatetime-actionTime).toDate(), message: "Hello (long datetime)"},
		{id: "t1h2", conversation: "test1@nightexcessive.us", from: "test1@nightexcessive.us", to: "receiver@nightexcessive.us", time: moment().subtract(diffBeforeShortDatetime-actionTime).toDate(), message: "Hello (short datetime)"},
		{id: "t1h3", conversation: "test1@nightexcessive.us", from: "test1@nightexcessive.us", to: "receiver@nightexcessive.us", time: moment().subtract(diffBeforeTime-actionTime).toDate(), message: "Hello (time)"},
		{id: "t1h4", conversation: "test1@nightexcessive.us", from: "test1@nightexcessive.us", to: "receiver@nightexcessive.us", time: moment().subtract(diffBeforeFromNow-actionTime).toDate(), message: "Hello (fromNow)"},
		{id: "t1h5", conversation: "test1@nightexcessive.us", from: "test1@nightexcessive.us", to: "receiver@nightexcessive.us", time: moment().toDate(), message: "Hello (now)"},
	]
});

export default Message;