import Ember from 'ember';
import Strophe from 'strophe';
import {$msg, $iq, $pres} from 'strophe';

import config from '../config/environment';

var statusMap = {};
for(var statusName in Strophe.Status) {
	if(!Strophe.Status.hasOwnProperty(statusName)) { continue; }

	statusMap[Strophe.Status[statusName]] = statusName;
}

export default Ember.Object.extend(Ember.Evented, {
	connection: null,

	status: 'DISCONNECTED',

	connect: function(jid, password, boshURL) {
		var connection = new Strophe.Connection(boshURL);
		if(config.APP.LOG_RAW_XMPP) {
			connection.rawInput = this.stropheRawIn.bind(this);
			connection.rawOutput = this.stropheRawOut.bind(this);
		}
		this.set('connection', connection);

		connection.connect(jid, password, this.onStatusUpdate.bind(this));
	},

	disconnect: function(sync, reason) {
		var connection = this.get('connection');

		if(connection == null) {
			return;
		}

		connection._options.sync = sync;
		connection.flush();
		connection.disconnect(reason);
	},

	reconnect: function(sync) {
		this.disconnect(sync);
		this.connect();
	},

	sendMessage: function(to, body) {
		this.get('connection').send($msg({
			to: to,
			type: 'chat'
		}).c('body').t(body));

		console.debug('[l-connection] [%s] Sent change message to %s: %s', this.get('jid'), to, body);
	},

	stropheRawIn: function(data) {
		console.debug('[l-connection] [%s] [RECV] %s', this.get('jid'), data);
	},

	stropheRawOut: function(data) {
		console.debug('[l-connection] [%s] [SEND] %s', this.get('jid'), data);
	},

	onStatusUpdate: function(status) {
		this.set('status', statusMap[status]);
		console.debug('[l-connection] [%s] New status: %s (%d)', this.get('jid'), statusMap[status], status);
		switch(status) {
			case Strophe.Status.DISCONNECTED:
				this.trigger('disconnected');
				break;
			case Strophe.Status.CONNECTED:
				this.trigger('connected');
				break;
		}
	},

	onDisconnected: function() {
		this.set('connection', undefined);
	}.on('disconnected'),

	onConnected: function() {
		var connection = this.get('connection');

		connection.pause();

		// Handle incoming chat messages
		connection.addHandler(this.onChatMessage.bind(this), null, 'message', 'chat');

		// Handle roster changes
		connection.addHandler(this.onRosterUpdate.bind(this), Strophe.NS.ROSTER, 'iq', 'set');

		// Handle presence changes
		connection.addHandler(this.onPresenceChange.bind(this), null, 'presence');

		// Send our initial presence
		console.debug('[l-connection] [%s] Sending initial presence...', this.get('jid'));
		connection.send($pres());

		// Ask the server for our roster
		console.debug('[l-connection] [%s] Retrieving roster...', this.get('jid'));
		connection.sendIQ($iq({type: 'get'}).c('query', {xmlns: Strophe.NS.ROSTER}), this.onRosterResults.bind(this));

		connection.resume();
	}.on('connected'),

	onRosterResults: function(stanza) {
		var rosterItems = Ember.$(stanza).find('item');

		rosterItems.each(function(index, item) {
			item = Ember.$(item);

			this.trigger('rosterItem', {
				name: item.attr('name'),
				jid: item.attr('jid'),
				subscription: item.attr('subscription'),
				approved: item.attr('approved') == null ? undefined : item.attr('approved') === 'true',
				ask: item.attr('ask')
			});
		}.bind(this));

		return true;
	},

	onRosterUpdate: function(stanza) {
		stanza = Ember.$(stanza);

		var connection = this.get('connection');

		var from = stanza.attr('from');
		if(from && from !== "" && from !== connection.jid && from !== Strophe.getBareJidFromJid(connection.jid)) {
			// Receiving client MUST ignore stanza unless it has no from or from == user's bare JID
			return true;
		}

		connection.send($iq({type: 'result', id: stanza.attr('id'), from: connection.jid}));

		var items = stanza.find('item');
		items.each(function(index, item) {
			item = Ember.$(item);

			var jid = item.attr('jid');

			var subscription = item.attr('subscription');
			if(subscription === 'remove') {
				this.trigger('rosterItemRemoved', jid);
				return;
			}

			this.trigger('rosterItem', {
				name: item.attr('name'),
				jid: jid,
				subscription: subscription,
				approved: item.attr('approved') == null ? undefined : item.attr('approved') === 'true',
				ask: item.attr('ask')
			});
		}.bind(this));

		return true;
	},

	onChatMessage: function(stanza) {
		stanza = Ember.$(stanza);

		console.debug('[l-connection] [%s] Received chat message:', this.get('jid'), stanza);

		return true;
	},

	onNotificationClicked: function(bareJID, notification) {
		return function() {
			this.controller.transitionToRoute('conversation', bareJID);
			window.focus();
			notification.close();
		};
	},

	onPresenceChange: function(stanza) {
		console.debug('[l-connection] [%s] Received presence change:', this.get('jid'), stanza);
		return true;
	}
});

/**
 * Checks that an Account's server is able to be connected to and that the given
 * credentials are valid.
 *
 * @method checkAccount
 */
export function checkAccount(account) {
	return new Ember.RSVP.Promise(function(resolve, reject) {
		var connection = new Strophe.Connection(account.boshURL);
		connection.connect(account.id, account.password, function(status) {
			console.debug('[connection]', '[checkAccount]', arguments);
			switch(status) {
				case Strophe.Status.CONNECTING:
					break;
				case Strophe.Status.CONNECTED:
					resolve();
					connection.disconnect();
					break;
				case Strophe.Status.CONNFAIL:
					reject({
						message: 'Failed to connect',
						internalMessage: 'CONNFAIL'
					});
					connection.disconnect();
					break;
				case Strophe.Status.AUTHFAIL:
					reject({
						message: 'Incorrect username or password',
						internalMessage: 'AUTHFAIL'
					});
					connection.disconnect();
					break;
				case Strophe.Status.DISCONNECTING:
				case Strophe.Status.DISCONNECTED:
					break;
				default:
					console.error('[connection]', '[checkAccount]', 'Unhandled status:', status);
					reject({
						message: 'Internal error',
						internalMessage: 'Unhandled status: '+status
					});
					connection.disconnect();
					break;
			}
		});
	});
}
