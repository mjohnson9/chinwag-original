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
		throw "can not calculate next change for "+diff+"ms";
	}
}

export default Ember.Component.extend({
	timeAgo: "",
	oldTimeAgo: "",
	calculatedTime: null,
	timer: null,
	
	startClock: function() {
		this.cancelClock();
		this.set("calculatedTime", moment(this.get("createdAt")));
		this.clock();
	}.on("didInsertElement").observes("createdAt"),

	clock: function() {
		var diff = -(this.get("calculatedTime").diff());
		var nextChange; // how long until this should change

		console.groupCollapsed("time:", this.get("calculatedTime").format());
		console.log("diff:", diff);
		
		if(diff < diffBeforeFromNow) {
			console.log("method:", "now");
			this.set("timeAgo", "now");
			nextChange = diffBeforeFromNow-diff;
		} else if(diff < diffBeforeTime) {
			console.log("method:", "fromNow");
			this.set("timeAgo", this.get("calculatedTime").fromNow(true));
			nextChange = Math.min(diffBeforeTime-diff, nextFromNowChange(diff));
		} else if(diff < diffBeforeShortDatetime) {
			console.log("method:", "time");
			this.set("timeAgo", this.get("calculatedTime").format("LT"));
			nextChange = diffBeforeShortDatetime-diff;
		} else if(diff < diffBeforeLongDatetime) {
			console.log("method:", "short datetime");
			this.set("timeAgo", this.get("calculatedTime").format("ddd, LT"));
			nextChange = diffBeforeLongDatetime-diff;
		} else {
			console.log("method:", "long datetime");
			this.set("timeAgo", this.get("calculatedTime").format("MMM D, LT"));
			nextChange = -1;
		}

		console.log("timeAgo:", this.get("timeAgo"));

		if(nextChange >= 0) {
			console.info("Updating in", (nextChange+500)+"ms", "("+moment.duration(nextChange+500).humanize()+")");
			this.set("timer", Ember.run.later(this, this.clock, nextChange+500));
		} else {
			console.info("Never updating again");
		}

		console.groupEnd();
	},

	cancelClock: function() {
		var timer = this.get("timer");
		if(timer !== null) {
			Ember.run.cancel(timer);
		}
	}.on("willDestroyElement")
});