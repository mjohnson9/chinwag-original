import Ember from 'ember';
import Strophe from 'strophe';
import { $build, $msg, $iq, $pres } from 'strophe';

import UUID from '../utils/uuid';
import config from '../config/environment';

var Connection = Ember.Object.extend({
	boshURL: null,
	jid: null,
	password: null,

	connection: null,
	store: null,

	connect: function() {
		Ember.Logger.debug('[connections]', '['+this.get('jid')+']', 'Initiating connection via '+this.get('boshURL')+'...');

		var connection = new Strophe.Connection(this.get('boshURL'));
		if(config.APP.LOG_RAW_XMPP) {
			connection.rawInput = this.stropheRawIn.bind(this);
			connection.rawOutput = this.stropheRawOut.bind(this);
		}
		this.set('connection', connection);

		connection.connect(this.get('jid'), this.get('password'), this.onConnect.bind(this));
	},

	sendInitialPresence: function() {
		Ember.Logger.debug('[connections]', '['+this.get('jid')+']', 'Sending initial presence...');
		this.connection.send($pres());
	},

	stropheRawIn: function(data) {
		Ember.Logger.debug('[connections]', '['+this.get('jid')+']', '[RECV]', data);
	},

	stropheRawOut: function(data) {
		Ember.Logger.debug('[connections]', '['+this.get('jid')+']', '[SEND]', data);
	},

	onConnect: function(status) {
		switch(status) {
			case Strophe.Status.CONNECTING:
				Ember.Logger.debug('[connections]', '['+this.get('jid')+']', 'Connecting...');
				break;
			case Strophe.Status.ERROR:
				Ember.Logger.warn('[connections]', '['+this.get('jid')+']', 'Connection error.');
				break;
			case Strophe.Status.AUTHFAIL:
				Ember.Logger.warn('[connections]', '['+this.get('jid')+']', 'Authentication failed.');
				break;
			case Strophe.Status.CONNFAIL:
				Ember.Logger.warn('[connections]', '['+this.get('jid')+']', 'Connection to XMPP server failed.');
				break;
			case Strophe.Status.DISCONNECTING:
				Ember.Logger.debug('[connections]', '['+this.get('jid')+']', 'Disconnecting...');
				break;
			case Strophe.Status.DISCONNECTED:
				Ember.Logger.debug('[connections]', '['+this.get('jid')+']', 'Disconnected.');
				break;
			case Strophe.Status.CONNECTED:
				Ember.Logger.debug('[connections]', '['+this.get('jid')+']', 'Connected.');
				this.onConnected();
				break;
			default:
				Ember.Logger.warn('[connections]', '['+this.get('jid')+']', 'Unknown status:', status);
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
		this.sendInitialPresence();

		// Ask the server for our roster
		Ember.Logger.debug('[connections]', '['+this.get('jid')+']', 'Retrieving roster...');
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
			var record = store.getById('contact', item.jid);
			if(record == null) {
				store.createRecord('contact', {
					id: item.jid,
					name: item.name,
					subscription: item.subscription
				});
				Ember.Logger.debug('[connections]', '['+this.get('jid')+']', 'Added contact:', item);
				return;
			}

			record.set('name', item.name);
			record.set('subscription', item.subscription);
			Ember.Logger.debug('[connections]', '['+this.get('jid')+']', 'Updated contact:', item);
		}.bind(this));

		return true;
	},

	onChatMessage: function(stanza) {
		stanza = Ember.$(stanza);

		var from = stanza.attr('from');
		var fromBare = Strophe.getBareJidFromJid(from);

		var contact = this.store.getById('contact', fromBare);
		if(contact == null) {
			Ember.Logger.warn('[connections]', '['+this.get('jid')+']', 'Received message from unknown contact:', fromBare);

			contact = this.store.createRecord('contact', {
				id: fromBare
			});
		}

		if(!contact.get('messages')) {
			contact.set('messages', Ember.A());
		}

		var message = {
			id: UUID(),
			contact: contact,

			from: from,
			to: stanza.attr('to'),

			time: new Date(),

			message: stanza.find('body').text()
		};
		Ember.Logger.debug('[connections]', '['+this.get('jid')+']', 'Received chat message:', message);

		contact.get('messages').pushObject(this.store.createRecord('message', message));

		return true;
	},

	onRosterChange: function(stanza) {
		Ember.Logger.debug('[connections]', '['+this.get('jid')+']', 'Received roster change:', stanza);
		return true;
	},

	onPresenceChange: function(stanza) {
		Ember.Logger.debug('[connections]', '['+this.get('jid')+']', 'Received presence change:', stanza);
		return true;
	}
});

export default Ember.ArrayController.extend({
	connections: null,

	_initConnections: function() {
		this.set('connections', Ember.Map.create());
	}.on('init'),

	model: function() {
		Ember.Logger.debug('[connections]', 'Fetching accounts...');
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
			return;
		}

		throw 'Shouldn\'t be able to get here';
	},

	newAccount: function(account) {
		Ember.Logger.debug('[connections]', 'New account:', account);

		var connections = this.get('connections');

		var fullJID = account.get('id');
		var resource = account.get('resource');
		if(resource != null && resource.length > 0) {
			fullJID += '/'+resource;
		}

		var connection = Connection.create({
			boshURL: account.get('boshURL'),
			jid: fullJID,
			password: account.get('password'),

			store: this.get('store')
		});

		connections.set(account.get('id'), connection);

		connection.connect();
	},

	accountRemoved: function(account) {
		Ember.Logger.debug('[connections]', 'Account removed:', account);
	}
});
