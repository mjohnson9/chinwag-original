import Ember from 'ember';
import Connection from 'chinwag/utils/connection';

var reconnectTime = 3*1000,
    maxBackoff = 20;

export default Ember.Controller.extend({
	needs: ['connections'],

	connection: undefined,
	connectionBackoffStage: 0,
	connectionTimer: undefined,

	init: function() {
		this._super.apply(this, arguments);

		console.debug('[connection] [%s] Inserted into global mapping', this.get('model.id'));
		this.get('controllers.connections.connections').set(this.get('model.id'), this);

		this.set('connection', Connection.create({
			jid: this.get('model.id'),
			password: this.get('model.password'),
			boshURL: this.get('model.boshURL')
		}));
		this.get('connection').
			on('disconnected', this.onDisconnected.bind(this)).
			on('connected', this.onConnected.bind(this)).
			on('rosterItem', this.onRosterItem.bind(this)).
			on('rosterItemRemoved', this.onRosterItemRemoved.bind(this));
		if(this.get('model.enabled')) {
			this.connect();
		}
	},

	connect: function() {
		this.get('connection').connect(this.get('model.id'), this.get('model.password'), this.get('model.boshURL'));
	},

	willDestroy: function() {
		this._super.apply(this, arguments);

		this.get('connection').disconnect(true); // Synchronous disconnect

		console.debug('[connection] [%s] Removed from global mapping', this.get('model.id'));
		this.get('controllers.connections.connections').delete(this.get('model.id'));
	},

	enabledChanged: function() {
		console.debug('[connections] [%s] Enabled changed: %s', this.get('model.id'), this.get('model.enabled'), arguments);
		if(this.get('model.enabled')) {
			if(this.get('connection.connection') != null) {
				this.get('connection').disconnect();
				return;
			}

			this.connect();
		} else {
			this.get('connection').disconnect();
		}
		this.send('playNotificationSound');
	}.observes('model.enabled'),

	getContactID: function(bareJid) {
		return this.get('model.id')+':'+bareJid;
	},

	onRosterItem: function(rawItem) {
		// Prepare the item for insertion
		var item = {
			id: this.getContactID(rawItem.jid),
			account: this.get('model.id'),
			name: rawItem.name,
			subscription: rawItem.subscription
		};

		console.debug('[connections] [%s] Roster item updated:', this.get('model.id'), item);
		this.store.push('contact', item);
	},

	onRosterItemRemoved: function(jid) {
		console.debug('[connections] [%s] Roster item removed:', this.get('model.id'), jid);

		var contact = this.store.getById('contact', this.getContactID(jid));
		if(contact == null) {
			console.warn('[connections] [%s] Attempted to delete unknown roster item:', this.get('model.id'), jid);
			return;
		}

		contact.deleteRecord();
	},

	onDisconnected: function() {
		if(this.get('model.enabled')) {
			var backoffStage = this.get('connectionBackoffStage');
			this.set('connectionBackoffStage', Math.min(maxBackoff, backoffStage+1));
			var retryTime = reconnectTime*backoffStage;
			retryTime += (Math.random()*(retryTime/5));

			if(this.get('connectionTimer') != null) {
				Ember.run.cancel(this.get('connectionTimer'));
				this.set('connectionTimer', undefined);
			}

			console.debug('[connections] [%s] Attempting to reconnect in %dms...', this.get('model.id'), retryTime);
			this.set('connectionTimer', Ember.run.later(this, this.connect, retryTime));
		}
	},

	onConnected: function() {
		this.set('connectionBackoffStage', 0);
	}
});
