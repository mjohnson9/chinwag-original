import Ember from "ember";
import moment from "moment";

var millisecond = 1;
var second = millisecond*1000;
var minute = second*60;
var hour = minute*60;
var day = hour*24;

var diffBeforeFromNow = 45*second; // 30 seconds
var diffBeforeTime = 1*hour; // 1 hour
var diffBeforeShortDatetime = 22*hour; // 22 hours
var diffBeforeLongDatetime = 4*day; // 4 days
var diffBeforeFullDatetime = 345*day; // 345 days

function nextFromNowChange(diff) {
	if(diff < 45*second) {
		return 45 * second - diff;
	} else if(diff < 90*second) {
		return 90 * second - diff;
	} else if(diff < 45*minute) {
		return minute - diff % minute;
	} else if(diff < 90*minute) {
		return 90 * minute - diff;
	} else if(diff < 22*hour) {
		return hour - diff % hour;
	} else {
		Ember.Logger.error("Unable to calculate next fromNow change for "+diff+"ms. Using 5 seconds.");
		return 5*second;
	}
}

export default Ember.Component.extend({
	timeAgo: "",
	oldTimeAgo: "",
	calculatedTime: null,
	timer: null,

	startClock: function() {
		this.cancelClock();

		var createdAt = this.get("createdAt");
		if(createdAt == null) {
			this.set("calculatedTime", null);
			return;
		}

		this.set("calculatedTime", moment(createdAt));
		this.clock();
	}.on("didInsertElement").observes("createdAt"),

	clock: function() {
		var calculatedTime = this.get("calculatedTime");
		if(calculatedTime === null) {
			return;
		}

		var diff = -(calculatedTime.diff());
		var nextChange; // how long until this should change

		if(diff < diffBeforeFromNow) {
			this.set("timeAgo", "now");
			nextChange = diffBeforeFromNow-diff;
		} else if(diff < diffBeforeTime) {
			this.set("timeAgo", calculatedTime.fromNow());
			nextChange = Math.min(diffBeforeTime-diff, nextFromNowChange(diff));
		} else if(diff < diffBeforeShortDatetime) {
			this.set("timeAgo", calculatedTime.format("LT"));
			nextChange = diffBeforeShortDatetime-diff;
		} else if(diff < diffBeforeLongDatetime) {
			this.set("timeAgo", calculatedTime.format("ddd, LT"));
			nextChange = diffBeforeLongDatetime-diff;
		} else if(diff < diffBeforeFullDatetime) {
			this.set("timeAgo", calculatedTime.format("MMM D, LT"));
			nextChange = diffBeforeFullDatetime-diff;
		} else {
			this.set("timeAgo", calculatedTime.format("l LT"));
			nextChange = diffBeforeFullDatetime-diff;
		}

		if(nextChange >= 0) {
			Ember.Logger.debug("[time-ago]", calculatedTime.format(), "Updating in "+(nextChange+50)+"ms");
			this.set("timer", Ember.run.later(this, this.clock, nextChange+50));
		} else {
			Ember.Logger.debug("[time-ago]", calculatedTime.format(), "Never updating again");
		}
	},

	cancelClock: function() {
		var timer = this.get("timer");
		if(timer != null) {
			Ember.Logger.debug("[time-ago]", this.get("calculatedTime").format(), "Timer cancelled");
			Ember.run.cancel(timer);
			this.set('timer', undefined);
		}
	}.on("willDestroyElement")
});
