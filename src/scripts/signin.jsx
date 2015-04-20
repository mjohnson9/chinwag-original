require('./lib/error-reporting');

var React = require('react');

var clientCommon = require('./lib/client/common');
var IPCConnection = require('./lib/client/ipc');
var windows = require('./lib/windows');

var SignIn = React.createClass({
	componentDidMount: function() {
		this.ipcConnection = new IPCConnection();

		this.ipcConnection.on('authUpdated', this.authResultReceived);

		this.ipcConnection.sendMessage('subscribe', 'auth');
		this.ipcConnection.call(this.isAuthedResult, 'isAuthed');
	},
	componentWillUnmount: function() {
		this.ipcConnection.disconnect();
	},

	isAuthedResult: function(result) {
		if(result === null) return;

		this.setState({
			initialLoading: false,
			isAuthed: result
		});
	},

	authResultReceived: function(result) {
		if(result === null) return;

		if(!result) {
			this.setState({
				loading: false,
				failed: true
			});
			return;
		}

		windows.roster(this.rosterOpened);
	},

	rosterOpened: function(result) {
		window.close();
	},


	formSubmitted: function(ev) {
		ev.preventDefault();

		this.setState({loading: true, failed: false});

		var username = React.findDOMNode(this.refs.jid).value.trim();
		var password = React.findDOMNode(this.refs.password).value.trim();

		if(!username || !password) {
			return;
		}

		this.ipcConnection.sendMessage('authenticate', username, password);
	},

	getInitialState: function() {
		return {initialLoading: true, isAuthed: false, loading: false, failed: false};
	},

	render: function() {
		if(this.state.initialLoading) {
			return <span/>;
		}

		if(this.state.isAuthed) {
			return (
				<div>
					<p>You are already logged in.</p>
					<button>Log out</button>
				</div>
			);
		}

		var loadingBanner;
		if(this.state.loading) {
			loadingBanner = <div>Logging in...</div>;
		}

		var errorMessage;
		if(this.state.failed) {
			errorMessage = <div>Invalid username or password.</div>;
		}

		return (
			<form onSubmit={this.formSubmitted}>
				{loadingBanner}
				{errorMessage}
				<input type="email" ref="jid" placeholder="username@domain" required disabled={this.state.loading} />
				<input type="password" ref="password" placeholder="Password" required disabled={this.state.loading} />
				<button type="submit" disabled={this.state.loading}>Login</button>
			</form>
		);
	}
});

React.render(
	<SignIn/>,
	document.getElementsByTagName('body')[0]
);
