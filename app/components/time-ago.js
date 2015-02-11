import Ember from "ember";
import moment from "moment";

export default Ember.Component.extend({
	timeAgo: "",
	oldTimeAgo: "",
	calculatedTime: null,
	timer: null,
	
	startClock: function() {
		this.set("calculatedTime", moment(this.get("createdAt")));
		this.clock();
	}.on("didInsertElement"),

	clock: function() {
		var newTimeAgo = this.get("calculatedTime").fromNow();
		
		if (this.get("oldTimeAgo") !== newTimeAgo) {
			this.set("timeAgo", newTimeAgo);
		}
		
		this.set("timer", Ember.run.later(this, this.clock, 3000));
	},

	cancelClock: function() {
		var timer = this.get("timer");
		if(timer !== null) {
			Ember.run.cancel(timer);
		}
	}.on("willDestroyElement")
});