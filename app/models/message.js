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

Message.reopenClass({
	FIXTURES: [
		{id: "t2h1", conversation: "test2@nightexcessive.us", from: "test2@nightexcessive.us", to: "receiver@nightexcessive.us", time: new Date("2015-02-11T00:10:23.783Z"), message: "Hello 1"},
		{id: "t2h2", conversation: "test2@nightexcessive.us", from: "test2@nightexcessive.us", to: "receiver@nightexcessive.us", time: new Date("2015-02-11T00:10:23.783Z"), message: "Hello 2"},
		{id: "t2h3", conversation: "test2@nightexcessive.us", from: "test2@nightexcessive.us", to: "receiver@nightexcessive.us", time: new Date("2015-02-11T00:10:23.783Z"), message: "Hello 3"},

		{id: "t1h1", conversation: "test1@nightexcessive.us", from: "test1@nightexcessive.us", to: "receiver@nightexcessive.us", time: new Date("2015-02-11T00:12:14.783Z"), message: "Hello 1"},
		{id: "t1h2", conversation: "test1@nightexcessive.us", from: "test1@nightexcessive.us", to: "receiver@nightexcessive.us", time: new Date("2015-02-11T00:12:19.783Z"), message: "Hello 2"},
		{id: "t1h3", conversation: "test1@nightexcessive.us", from: "test1@nightexcessive.us", to: "receiver@nightexcessive.us", time: new Date("2015-02-11T00:12:23.783Z"), message: "Hello 3"}
	]
});

export default Message;