require('./lib/error-reporting');

var React = require('react');

var clientCommon = require('./lib/client/common');
var IPCConnection = require('./lib/client/ipc');
var windows = require('./lib/windows');

var mui = require('material-ui'),
    FlatButton = mui.FlatButton,
    TextField = mui.TextField;

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
				jidError: "Username or password is incorrect.",
				passwordError: "Username or password is incorrect."
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

		var username = this.refs.jid.getValue().trim();
		var password = this.refs.password.getValue().trim();

		if(!username) {
			this.setState({jidError: "This field is required."});
		} else {
			this.setState({jidError: ""});
		}

		if(!password) {
			this.setState({passwordError: "This field is required."});
		} else {
			this.setState({passwordError: ""});
		}

		if(!username || !password) {
			return;
		}

		this.setState({loading: true});

		this.ipcConnection.sendMessage('authenticate', username, password);
	},

	getInitialState: function() {
		return {initialLoading: true, isAuthed: false, loading: false, jidError: "", passwordError: ""};
	},

	render: function() {
		if(this.state.initialLoading) {
			return <span/>;
		}

		if(this.state.isAuthed) {
			return (
				<div>
					<p>You are already signed in.</p>
					<FlatButton type="submit" primary={true} label="Sign out" />
					TODO: Implement
				</div>
			);
		}

		var loadingBanner;
		if(this.state.loading) {
			loadingBanner = <div>Logging in...</div>;
			// TODO: Make a better loading indicator
		}

		return (
			<form onSubmit={this.formSubmitted}>
				{loadingBanner}<br/>
				<TextField type="email" ref="jid" hintText="username@domain.com" autofocus disabled={this.state.loading} errorText={this.state.jidError} /><br/>
				<TextField type="password" ref="password" hintText="Password" disabled={this.state.loading} errorText={this.state.passwordError} /><br/>
				<div className="action-button">
					<FlatButton type="submit" disabled={this.state.loading} primary={true} label="Sign in" />
				</div>
			</form>
		);
	}
});

React.render(
	<SignIn/>,
	document.getElementsByTagName('body')[0]
);
