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
var diffBeforeTime = 6*hour; // 6 hours
var diffBeforeDatetime = 20*hour; // 20 hours

var actionTime = 5*second;

Message.reopenClass({
	FIXTURES: [
		{id: "t2h1", conversation: "test2@nightexcessive.us", from: "test2@nightexcessive.us", to: "receiver@nightexcessive.us", time: moment().subtract(diffBeforeDatetime-actionTime).toDate(), message: "Hello 1"},
		{id: "t2h2", conversation: "test2@nightexcessive.us", from: "test2@nightexcessive.us", to: "receiver@nightexcessive.us", time: moment().subtract(diffBeforeTime-actionTime).toDate(), message: "Hello 2"},
		{id: "t2h3", conversation: "test2@nightexcessive.us", from: "test2@nightexcessive.us", to: "receiver@nightexcessive.us", time: moment().subtract(diffBeforeFromNow-actionTime).toDate(), message: "Hello 3"},
		{id: "t2h4", conversation: "test2@nightexcessive.us", from: "test2@nightexcessive.us", to: "receiver@nightexcessive.us", time: moment().toDate(), message: "Hello 4"},

		{id: "t1h1", conversation: "test1@nightexcessive.us", from: "test1@nightexcessive.us", to: "receiver@nightexcessive.us", time: moment().subtract(diffBeforeDatetime-actionTime).toDate(), message: "Hello 1"},
		{id: "t1h2", conversation: "test1@nightexcessive.us", from: "test1@nightexcessive.us", to: "receiver@nightexcessive.us", time: moment().subtract(diffBeforeTime-actionTime).toDate(), message: "Hello 2"},
		{id: "t1h3", conversation: "test1@nightexcessive.us", from: "test1@nightexcessive.us", to: "receiver@nightexcessive.us", time: moment().subtract(diffBeforeFromNow-actionTime).toDate(), message: "Hello 3"},
		{id: "t1h4", conversation: "test1@nightexcessive.us", from: "test1@nightexcessive.us", to: "receiver@nightexcessive.us", time: moment().toDate(), message: "Hello 4"},
	]
});

export default Message;