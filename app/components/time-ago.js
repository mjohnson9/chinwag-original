import Ember from 'ember';
import moment from 'moment';

var times = {
	milliseconds: 1,
	seconds: 1000,
	minutes: 1000*60,
	hours: 1000*60*60,
	days: 1000*60*60*24
};

var formats = [
	{
		unit: 'seconds',
		short: 's',
		long: ' second',
		until: times.minutes
	},
	{
		unit: 'minutes',
		short: 'm',
		long: ' minute',
		until: times.hours
	},
	{
		unit: 'hours',
		short: 'h',
		long: ' hour',
		until: times.days
	},
	{
		unit: 'days',
		short: 'd',
		until: times.days*7
	},
	{
		shortFormat: 'l',
		longFormat: 'MMM D'
	}
];

function formatAs(format, time, rawDiff, long) {
	var diff = Math.abs(rawDiff);

	var simpleName, formatName;
	if(long) {
		simpleName = 'long';
		formatName = 'longFormat';
	} else {
		simpleName = 'short';
		formatName = 'shortFormat';
	}

	if(format[simpleName] != null) {
		var num = moment.duration(diff)[format.unit]();
		if(num < 1) {
			num = 1;
		}

		var unitString = format[simpleName];
		if(long && num > 1) {
			unitString += 's';
		}

		return num+unitString;
	}

	if(format[formatName] != null) {
		return time.format(format[formatName]);
	}

	return null;
}

function getFormatted(time, long) {
	var rawDiff = time.diff();
	var futureDate = rawDiff>0;
	var diff = Math.abs(rawDiff);

	for(var i = 0, j = formats.length; i < j; i++) {
		var format = formats[i];
		if(format.until == null || diff < format.until) {
			var retData = {
				text: formatAs(format, time, rawDiff, long)
			};

			if(retData.text === null) {
				continue;
			}

			var nextFormat;
			var timeUnit = times[format.unit];
			if(futureDate) {
				if(i === 0) {
					retData.nextChange = diff;
				} else {
					nextFormat = formats[i-1];
					retData.nextChange = Math.min(diff-nextFormat.until, diff % timeUnit);
				}
			} else {
				if(format.until != null) {
					retData.nextChange = Math.min(format.until-diff, timeUnit - diff % timeUnit);
				}
			}

			return retData;
		}
	}

	throw 'Given difference outside of usable range';
}

export default Ember.Component.extend({
	tagName: 'span',
	attributeBindings: ['formattedDate:title'],

	timeAgo: '',
	long: false,
	calculatedTime: null,
	timer: null,

	formattedDate: function() {
		var calculatedTime = this.get('calculatedTime');
		if(calculatedTime == null) {
			return '';
		}

		return calculatedTime.format('LT [-] ll');
	}.property('calculatedTime'),

	startClock: function() {
		this.cancelClock();

		var createdAt = this.get('createdAt');
		if(createdAt == null) {
			this.set('calculatedTime', null);
			return;
		}

		this.set('calculatedTime', moment(createdAt));
		this.clock();
	}.on('didInsertElement').observes('createdAt', 'long'),

	clock: function() {
		var calculatedTime = this.get('calculatedTime');
		if(calculatedTime === null) {
			return;
		}

		var long = !!this.get('long');

		var formatData = getFormatted(calculatedTime, long);

		this.set('timeAgo', formatData.text);

		if(formatData.nextChange != null) {
			Ember.Logger.debug('[time-ago]', calculatedTime.format(), 'Updating in '+(formatData.nextChange+1)+'ms');
			this.set('timer', Ember.run.later(this, this.clock, formatData.nextChange+1));
		} else {
			Ember.Logger.debug('[time-ago]', calculatedTime.format(), 'Never updating again');
		}
	},

	cancelClock: function() {
		var timer = this.get('timer');
		if(timer != null) {
			Ember.Logger.debug('[time-ago]', this.get('calculatedTime').format(), 'Timer cancelled');
			Ember.run.cancel(timer);
			this.set('timer', undefined);
		}
	}.on('willDestroyElement')
});
