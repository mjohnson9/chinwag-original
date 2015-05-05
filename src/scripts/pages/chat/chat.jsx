export default React.createClass({
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
        this.ipcConnection.call((success) => {
            if(!success) {
                if(this.state.messages.dirty) {
                    this.setState({messages: oldMessages});
                }
                return;
            }
        }, 'sendMessage', this.jid, messagePlaintext, messageHTML);

        this.setState({messages: this.state.messages});
    },

    rosterUpdated: function(roster) {
        if(!roster) roster = [];

        var entry;

        for(let thisEntry of roster) {
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
