require('./lib/error-reporting');

var React = require('react');

var clientCommon = require('./lib/client/common');
var IPCConnection = require('./lib/client/ipc');
var windows = require('./lib/windows');

var RosterItem = React.createClass({
	render: function() {
		return (
			<li title={this.props.entry.jid} onClick={this.entryClicked}>
				<img src={this.props.entry.avatar} className="avatar" />
				<span className="name">{clientCommon.displayName(this.props.entry)}</span>
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
					<button onClick={this.openSignIn}>Sign in</button>
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
