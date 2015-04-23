require('./lib/error-reporting');

var React = require('react');

var common = require('./lib/common');
var clientCommon = require('./lib/client/common');
var IPCConnection = require('./lib/client/ipc');
var TimeAgo = require('./lib/client/components/time-ago');
var PersonIcon = require('./lib/client/components/person-icon');

var qs = (function(a) {
    if (a === "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i)
    {
        var p=a[i].split('=', 2);
        if (p.length == 1)
            b[p[0]] = "";
        else
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
})(window.location.search.substr(1).split('&'));

var SendBox = React.createClass({
    submit: function(ev) {
        if(ev.key !== "Enter" || ev.ctrlKey || ev.shiftKey) return;

        ev.preventDefault();

        var inputBox = React.findDOMNode(this.refs.inputBox);

        var messagePlaintext = inputBox.innerText.trim();
        var messageHTML = inputBox.innerHTML.trim();
        if(!messagePlaintext || !messageHTML) {
            return;
        }

        inputBox.innerHTML = "";

        this.props.onSendMessage(messagePlaintext, messageHTML);
    },
    render: function() {
        return (
            <div className="sendBox">
                <span ref="inputBox" onKeyPress={this.submit} contentEditable={true}/>
            </div>
        );
    }
});

var Message = React.createClass({
    render: function() {
        var avatar;
        if(this.props.message.incoming) {
            if(this.props.rosterEntry.avatar) {
                avatar = <img className="avatar" src={this.props.rosterEntry.avatar.url} />;
            } else {
                avatar = <PersonIcon className="avatar" />;
            }
        }

        return (
            <li className={"message"+(!this.props.message.incoming ? " sent" : "")}>
                {avatar}
                <span>
                    <p>{this.props.message.body}</p>
                    <div className="info">
                        <TimeAgo time={this.props.message.time} />
                    </div>
                </span>
            </li>
        );
    }
});

var Chat = React.createClass({
    componentDidMount: function() {
        this.jid = qs.jid;

        this.ipcConnection = new IPCConnection();

        this.ipcConnection.on('rosterUpdated', this.rosterUpdated);
        this.ipcConnection.on('messagesUpdated', this.messagesUpdated);

        this.ipcConnection.sendMessage('subscribe', 'roster');
        this.ipcConnection.sendMessage('subscribe', 'messages:'+this.jid);
        this.ipcConnection.call(this.rosterUpdated, 'getRoster');
        this.ipcConnection.call(this.messagesUpdated, 'getMessageHistory', this.jid);
    },

    componentWillUnmount: function() {
        this.ipcConnection.disconnect();
    },

    onSendMessage: function(messagePlaintext, messageHTML) {
        var oldMessages = this.state.messages.slice();
        this.state.messages.dirty = true;
        this.state.messages.push({
            _internalID: common.uuid(),

            body: messagePlaintext,
            incoming: false,
            time: new Date().toISOString(),
            to: this.jid
        });
        this.ipcConnection.call(function(success) {
            if(!success) {
                if(this.state.messages.dirty) {
                    this.setState({messages: oldMessages});
                }
                return;
            }
        }.bind(this), 'sendMessage', this.jid, messagePlaintext, messageHTML);

        this.setState({messages: this.state.messages});
    },

    rosterUpdated: function(roster) {
        if(!roster) return;

        var entry;

        for(var i = 0, len = roster.length; i < len; i++) {
            var thisEntry = roster[i];
            if(thisEntry.jid !== this.jid) {
                continue;
            }

            entry = thisEntry;
            break;
        }

        this.setState({rosterEntry: entry});
    },

    messagesUpdated: function(messageHistory) {
        if(!messageHistory) messageHistory = [];

        this.setState({messages: messageHistory});
    },

    getInitialState: function() {
        return {rosterEntry: undefined, messages: []};
    },

    componentWillUpdate: function() {
        this.shouldScrollBottom = (window.innerHeight + window.scrollY) >= (document.body.scrollHeight-20);
    },

    componentDidUpdate: function() {
        if (this.shouldScrollBottom) {
            window.scrollTo(0, document.body.scrollHeight);
        }
    },

    render: function() {
        if(this.state.rosterEntry === undefined) {
            return (
                <div className="roster">
                    <title>{this.jid}</title>
                </div>
            );
        }

        var messages = this.state.messages.map(function(message, index) {
            return (
                <Message rosterEntry={this.state.rosterEntry} message={message} key={message._internalID} />
            );
        }.bind(this));

        return (
            <div className="chat">
                <title>{clientCommon.displayName(this.state.rosterEntry)}</title>
                <ul>{messages}</ul>
                <SendBox onSendMessage={this.onSendMessage} />
            </div>
        );
    }
});

React.render(
    <Chat/>,
    document.getElementsByTagName('body')[0]
);
