var moment = require('moment');

console.debug("moment locale set to", moment.locale(chrome.i18n.getUILanguage()));

function displayName(rosterEntry) {
    var name = rosterEntry.name;
    if(!name) {
        name = rosterEntry.jid.split('@')[0];
    }

    return name;
}

// ==== IPCConnection =====
function IPCConnection() {
    this.responseCallbacks = {};
    this.currentID = 1;

    this.port = chrome.runtime.connect();

    this.port.onMessage.addListener(this.onMessage.bind(this));
    this.port.onDisconnect.addListener(this.onDisconnect.bind(this));
}
heir.inherit(IPCConnection, EventEmitter);

// Methods

IPCConnection.prototype.disconnect = function(method) {
    this.port.disconnect();
};

IPCConnection.prototype.sendMessage = function(method) {
    var s = {
        method: method,
        args: sliceArguments(arguments, 1)
    };

    console.debug('SEND', s);

    this.port.postMessage(s);
};

IPCConnection.prototype.call = function(cb, method) {
    var id = this.currentID++;

    this.responseCallbacks[id] = cb;

    var s = {
        id: id,
        method: method,
        args: sliceArguments(arguments, 2)
    };

    console.debug('SEND', s);

    this.port.postMessage(s);
};

// Callbacks

IPCConnection.prototype.onMessage = function(msg) {
    console.debug('RECV', msg);

    if(msg.method === '_response_') {
        var callback = this.responseCallbacks[msg.id];
        if(!callback) {
            console.error('IPC: received response for unused message id:', msg.id);
            return;
        }

        delete this.responseCallbacks[msg.id];
        callback.apply(window, [msg.args[0]]);
        return;
    }

    this.trigger(msg.method, msg.args);
};

IPCConnection.prototype.onDisconnect = function() {
    console.error('IPC: Got disconnected from background page');
    this.trigger('disconnect');
};

// React components

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

    if(format[simpleName]) {
        var num = moment.duration(diff)[format.unit]();

        if(format.unit === 'seconds' && num === 0) {
            return 'now';
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
        //console.warn('[time-ago]', 'componentWillReceiveProps');
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
