import Ember from "ember";
import moment from "moment";

var millisecond = 1;
var second = millisecond*1000;
var minute = second*60;
var hour = minute*60;
var day = hour*24;

var diffBeforeFromNow = 45*second; // 30 seconds
var diffBeforeTime = 6*hour; // 6 hours
var diffBeforeDatetime = 20*hour; // 20 hours

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
		throw "can not yet calculate next change for "+diff+"ms";
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
		
		if(diff < diffBeforeFromNow) {
			this.set("timeAgo", "Now");
			nextChange = diffBeforeFromNow-diff;
		} else if(diff < diffBeforeTime) {
			this.set("timeAgo", this.get("calculatedTime").fromNow(true));
			nextChange = nextFromNowChange(diff);
		} else if(diff < diffBeforeDatetime) {
			this.set("timeAgo", this.get("calculatedTime").format("LT"));
			nextChange = diffBeforeDatetime-diff;
		} else {
			this.set("timeAgo", this.get("calculatedTime").format("l LT"));
			nextChange = -1;
		}

		if(nextChange >= 0) {
			this.set("timer", Ember.run.later(this, this.clock, nextChange+500));
		}
	},

	cancelClock: function() {
		var timer = this.get("timer");
		if(timer !== null) {
			Ember.run.cancel(timer);
		}
	}.on("willDestroyElement")
});