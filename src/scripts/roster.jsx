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
	},
	componentWillUnmount: function() {
		this.ipcConnection.disconnect();
	},

	rosterUpdated: function(roster) {
		if(roster === 'not ready yet') return;

		this.setState({roster: roster});
	},

	getInitialState: function() {
		return {roster: []};
	},
	render: function() {
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
