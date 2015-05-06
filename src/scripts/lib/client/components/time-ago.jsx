var moment = require('moment');
var React = require('react/addons');


var times = {
    milliseconds: 1,
    seconds: 1000,
    minutes: 1000*60,
    hours: 1000*60*60,
    days: 1000*60*60*24
};

var formats = [
    /*{
        unit: 'seconds',
        short: 's',
        long: ' second',
        until: times.minutes
    },*/
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

    if(format[simpleName]) {
        var num = moment.duration(diff)[format.unit]();

        if(format.unit === 'minutes' && num === 0) {
            return long ? 'just now' : 'now';
        }

        if(num < 1) {
            num = 1;
        }

        var unitString = format[simpleName];
        if(long && num > 1) {
            unitString += 's';
        }

        return num+unitString;
    }

    if(format[formatName]) {
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
        if(!format.until || diff < format.until) {
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
                if(format.until) {
                    retData.nextChange = Math.min(format.until-diff, timeUnit - diff % timeUnit);
                }
            }

            return retData;
        }
    }

    throw 'Given difference outside of usable range';
}

var TimeAgo = React.createClass({
    componentDidMount: function() {
        this.calculateTimestamp();
        this.startClock();
    },
    componentWillUnmount: function() {
        this.cancelClock();
    },
    componentWillReceiveProps: function(newProps) {
        var shouldClock = false,
            shouldTimestamp = false;
        if(newProps.time !== this.props.time) {
            shouldClock = true;
            shouldTimestamp = true;
        }
        if(newProps.long !== this.props.long) {
            shouldClock = true;
        }

        if(shouldClock) {
            this.cancelClock();
            this.clock(newProps);
        }
        if(shouldTimestamp) {
            this.calculateTimestamp(newProps);
        }
    },

    startClock: function() {
        this.cancelClock();
        this.clock();
    },
    cancelClock: function() {
        if(!this.timer) {
            return;
        }

        clearTimeout(this.timer);
        delete this.timer;
    },

    clock: function(props) {
        if(!props) {
            props = this.props;
        }

        var calculatedTime = moment(props.time);

        var formatData = getFormatted(calculatedTime, !!props.long);

        var timeAgo = formatData.text;
        this.setState({timeAgo: timeAgo});

        if(!formatData.nextChange) {
            return;
        }

        this.timer = setTimeout(this.clock, formatData.nextChange+1);
    },
    calculateTimestamp: function(props) {
        if(!props) {
            props = this.props;
        }

        var calculatedTime = moment(props.time);

        this.setState({timestamp: calculatedTime.format("ll LT")});
    },

    getInitialState: function() {
        return {timeAgo: "...", timestamp: "..."};
    },

    render: function() {
        return (
            <span title={this.state.timestamp}>
                {this.state.timeAgo}
            </span>
        );
    }
});

module.exports = TimeAgo;
