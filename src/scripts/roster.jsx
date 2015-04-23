require('./lib/error-reporting');

var React = require('react');

var clientCommon = require('./lib/client/common');
var IPCConnection = require('./lib/client/ipc');
var windows = require('./lib/windows');
var PersonIcon = require('./lib/client/components/person-icon');

var mui = require('material-ui'),
    RaisedButton = mui.RaisedButton;

var RosterItem = React.createClass({
	render: function() {
		var avatar;
        if(this.props.entry.avatar) {
            avatar = <img className="avatar" src={this.props.entry.avatar} />;
        } else {
            avatar = <PersonIcon className="avatar" />;
        }

		return (
			<li title={this.props.entry.jid} onClick={this.entryClicked}>
				<div className="body">
					<div className="avatar-container">
						{avatar}
					</div>
					<div className="content">
						<div className="name">{clientCommon.displayName(this.props.entry)}</div>
					</div>
				</div>
				<div className="divider" />
			</li>
		);
	},

	entryClicked: function(ev) {
		if(ev.button === 0) {
			ev.preventDefault();

			windows.chat(this.props.entry.jid);
		}
	}
});

var Roster = React.createClass({
	componentDidMount: function() {
		this.ipcConnection = new IPCConnection();

		this.ipcConnection.on('rosterUpdated', this.rosterUpdated);

		this.ipcConnection.sendMessage('subscribe', 'roster');
		this.ipcConnection.call(this.rosterUpdated, 'getRoster');

		this.ipcConnection.on('authUpdated', this.authResultReceived);

		this.ipcConnection.sendMessage('subscribe', 'auth');
		this.ipcConnection.call(this.authResultReceived, 'isAuthed');
	},
	componentWillUnmount: function() {
		this.ipcConnection.disconnect();
	},

	authResultReceived: function(result) {
		if(result === null) return;
		this.setState({initialLoading: false, isAuthed: result});
	},

	rosterUpdated: function(roster) {
		if(!roster) roster = [];

		this.setState({roster: roster});
	},

	openSignIn: function() {
		windows.signIn();
		window.close();
	},

	getInitialState: function() {
		return {initialLoading: true, isAuthed: false, roster: []};
	},
	render: function() {
		if(this.state.initialLoading) {
			return <span/>;
		}

		if(!this.state.isAuthed) {
			return (
				<div className="sign-in-prompt">
					<RaisedButton label="Sign in" primary={true} onClick={this.openSignIn} />
				</div>
			);
		}

		var rosterItems = this.state.roster.map(function(entry, index) {
			return (
				<RosterItem entry={entry} key={entry.jid} />
			);
		});
		return (
			<div className="roster">
				<ul>{rosterItems}</ul>
			</div>
		);
	}
});

React.render(
	<Roster/>,
	document.getElementsByTagName('body')[0]
);
