import Ember from 'ember';
import Strophe from 'strophe';
//import { $msg, $iq, $pres } from 'strophe';

//import UUID from '../utils/uuid';
//import config from '../config/environment';

var statusMap = {};
for(var statusName in Strophe.Status) {
	if(!Strophe.Status.hasOwnProperty(statusName)) { continue; }

	statusMap[Strophe.Status[statusName]] = statusName;
}

/*var Connection = Ember.Object.extend({
	account: null,

	connection: null,
	controller: null,
	store: null,

	connectionStatus: undefined,

	connect: function() {
		console.debug('[connections]', '['+this.get('account.id')+']', 'Initiating connection via '+this.get('account.boshURL')+'...');

		var connection = new Strophe.Connection(this.get('account.boshURL'));
		if(config.APP.LOG_RAW_XMPP) {
			connection.rawInput = this.stropheRawIn.bind(this);
			connection.rawOutput = this.stropheRawOut.bind(this);
		}
		this.set('connection', connection);

		var connectJID = this.get('account.id');

		connection.connect(connectJID, this.get('account.password'), this.onConnect.bind(this));
	},

	disconnect: function(sync, reason) {
		console.warn('[connections]', '['+this.get('account.id')+']', 'Disconnecting...');

		this.connection._options.sync = sync;
		this.connection.flush();
		this.connection.disconnect(reason);
	},

	sendMessage: function(to, body) {
		this.get('connection').send($msg({
			to: to,
			type: 'chat'
		}).c('body').t(body));

		var contact = this.store.getById('contact', to);
		if(contact == null) {
			console.warn('[connections]', '['+this.get('account.id')+']', 'Sent message to unknown contact:', to);

			contact = this.store.createRecord('contact', {
				id: to,
				name: to,
				subscription: 'none'
			});
			contact.get('accounts').pushObject(this.get('account'));
			this.get('account.contacts').pushObject(contact);
		}

		var message = {
			id: UUID(),
			contact: contact,

			from: this.get('account.id'),
			to: to,

			time: new Date(),

			message: body
		};
		console.debug('[connections]', '['+this.get('account.id')+']', 'Sent chat message to', to, message);
		contact.get('messages').pushObject(this.store.createRecord('message', message));
	},

	stropheRawIn: function(data) {
		console.debug('[connections]', '['+this.get('account.id')+']', '[RECV]', data);
	},

	stropheRawOut: function(data) {
		console.debug('[connections]', '['+this.get('account.id')+']', '[SEND]', data);
	},

	onConnect: function(status) {
		this.set('connectionStatus', statusMap[status]);
		switch(status) {
			case Strophe.Status.CONNECTING:
				console.debug('[connections]', '['+this.get('account.id')+']', 'Connecting...');
				break;
			case Strophe.Status.ERROR:
				console.warn('[connections]', '['+this.get('account.id')+']', 'Connection error.');
				break;
			case Strophe.Status.AUTHFAIL:
				console.warn('[connections]', '['+this.get('account.id')+']', 'Authentication failed.');
				break;
			case Strophe.Status.CONNFAIL:
				console.warn('[connections]', '['+this.get('account.id')+']', 'Connection to XMPP server failed.');
				break;
			case Strophe.Status.DISCONNECTING:
				console.debug('[connections]', '['+this.get('account.id')+']', 'Disconnecting...');
				break;
			case Strophe.Status.DISCONNECTED:
				console.debug('[connections]', '['+this.get('account.id')+']', 'Disconnected.');
				break;
			case Strophe.Status.CONNECTED:
				console.debug('[connections]', '['+this.get('account.id')+']', 'Connected.');
				this.onConnected();
				break;
			default:
				console.warn('[connections]', '['+this.get('account.id')+']', 'Unhandled status:', status);
				break;
		}
	},

	onConnected: function() {
		// Handle incoming chat messages
		this.connection.addHandler(this.onChatMessage.bind(this), null, 'message', 'chat');

		// Handle roster changes
		this.connection.addHandler(this.onRosterChange.bind(this), Strophe.NS.ROSTER, 'iq', 'set');

		// Handle presence changes
		this.connection.addHandler(this.onPresenceChange.bind(this), null, 'presence');

		// Send our initial presence
		console.debug('[connections]', '['+this.get('account.id')+']', 'Sending initial presence...');
		this.connection.send($pres());

		// Ask the server for our roster
		console.debug('[connections]', '['+this.get('account.id')+']', 'Retrieving roster...');
		this.connection.sendIQ($iq({type: 'get'}).c('query', {xmlns: Strophe.NS.ROSTER}), this.onRosterResults.bind(this));
	},

	onRosterResults: function(stanza) {
		var rosterItems = Ember.$(stanza).find('item');

		var parsed = rosterItems.map(function(index, item) {
			item = Ember.$(item);

			return {
				name: item.attr('name'),
				jid: item.attr('jid'),
				subscription: item.attr('subscription')
			};
		});

		var store = this.get('store');
		parsed.each(function(index, item) {
			var record = store.getById('contact', this.get('account.id')+':'+item.jid);
			if(record == null) {
				record = store.createRecord('contact', {
					id: item.jid,
					name: item.name,
					subscription: item.subscription
				});
				record.get('accounts').pushObject(this.get('account'));

				this.get('account.contacts').pushObject(record);
				console.debug('[connections]', '['+this.get('account.id')+']', 'Added contact:', item);
				return;
			}

			record.set('name', item.name);
			record.set('subscription', item.subscription);
			record.get('accounts').pushObject(this.get('account'));

			console.debug('[connections]', '['+this.get('account.id')+']', 'Updated contact:', item);
		}.bind(this));

		return true;
	},

	onChatMessage: function(stanza) {
		stanza = Ember.$(stanza);

		var from = stanza.attr('from');
		var fromBare = Strophe.getBareJidFromJid(from);

		var contact = this.store.getById('contact', fromBare);
		if(contact == null) {
			console.warn('[connections]', '['+this.get('account.id')+']', 'Received message from unknown contact:', fromBare);

			contact = this.store.createRecord('contact', {
				id: fromBare,
				name: fromBare,
				subscription: 'none'
			});
			contact.get('accounts').pushObject(this.get('account'));
			this.get('account.contacts').pushObject(contact);
		}

		var message = {
			id: UUID(),
			contact: contact,

			from: from,
			to: stanza.attr('to'),

			time: new Date(),

			message: stanza.find('body').text()
		};
		console.debug('[connections]', '['+this.get('account.id')+']', 'Received chat message:', message);
		contact.get('messages').pushObject(this.store.createRecord('message', message));

		if(window.Notification != null) {
			var notification = new window.Notification(contact.get('name'), {
				icon: contact.get('avatar'),
				body: message.message,
				tag: message.id
			});

			notification.onclick = this.onNotificationClicked(fromBare, notification).bind(this);
		}

		this.controller.playNotificationSound();

		return true;
	},

	onNotificationClicked: function(bareJID, notification) {
		return function() {
			this.controller.transitionToRoute('conversation', bareJID);
			window.focus();
			notification.close();
		};
	},

	onRosterChange: function(stanza) {
		console.debug('[connections]', '['+this.get('account.id')+']', 'Received roster change:', stanza);
		return true;
	},

	onPresenceChange: function(stanza) {
		console.debug('[connections]', '['+this.get('account.id')+']', 'Received presence change:', stanza);
		return true;
	}
});*/

export default Ember.ArrayController.extend({
	notificationSound: null,

	connections: null,
	unloadBind: null,

	_initConnections: function() {
		this.set('unloadBind', this.cleanup.bind(this, 'Page closed.'));
		Ember.$(window).on('beforeunload', this.get('unloadBind'));
		this.set('connections', Ember.Map.create());
	}.on('init'),

	_initNotifications: function() {
		if(window.Notification != null) {
			window.Notification.requestPermission();
		}
		if(window.Audio != null) {
			this.notificationSound = new Audio('/sounds/received.m4a');
			this.notificationSound.preload = 'auto';
		}
	}.on('init'),

	cleanup: function(reason) {
		console.debug('[connections]', 'Cleaning up connections...');
		this.get('connections').forEach(function(connection) {
			connection.disconnect(true, reason);
		}, this);
		Ember.$(window).off('beforeunload', this.get('unloadBind'));
	}.on('willDestroy'),

	model: function() {
		console.debug('[connections]', 'Fetching accounts...');
		return this.store.filter('account', {}, function() {
			return true;
		});
	}.property(),

	contentArrayDidChange: function(content, start, removeCount, addCount) {
		this._super(content, start, removeCount, addCount);

		if(addCount > 0) {
			for(var i = 0, j = start+addCount; i < j; i++) {
				this.newAccount(content.objectAt(i));
			}
			return;
		}
		if(removeCount > 0) {
			console.debug('[connections]', 'Removed:', content, start, removeCount, addCount);
			return;
		}

		throw 'Shouldn\'t be able to get here';
	},

	newAccount: function(account) {
		console.debug('[connections]', 'New account:', account);

		/*var connections = this.get('connections');

		var fullJID = account.get('id');
		var resource = account.get('resource');
		if(resource != null && resource.length > 0) {
			fullJID += '/'+resource;
		}

		var connection = Connection.create({
			account: account,

			controller: this,
			store: this.get('store')
		});

		connections.set(account.get('id'), connection);

		connection.connect();*/
	},

	accountRemoved: function(account) {
		console.debug('[connections]', 'Account removed:', account);
	},

	playNotificationSound: function() {
		if(this.notificationSound != null) {
			this.notificationSound.currentTime = 0;
			this.notificationSound.play();
		}
	}
});
