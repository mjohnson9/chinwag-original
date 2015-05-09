import events from 'events';

import db from 'db.js';

export default class Store extends events.EventEmitter {
	constructor() {
		super();

		this.ready = false;

		this.avatarCache = {};

		db.open({
			server: 'chinwag',
			version: Date.now(),

			schema: {
				settings: {
					key: {keyPath: 'id'}
				},

				roster: {
					key: {keyPath: 'jid'}
				},

				avatar: {
					key: {keyPath: 'id'}
				},

				conversation: {
					key: {keyPath: 'jid'},
					indexes: {
						lastMessage: {}
					}
				},

				message: {
					key: {keyPath: 'id', autoIncrement: true},
					indexes: {
						conversation: {},
						time: {}
					}
				}
			}
		}).then(this.databaseOpened_.bind(this)).catch(this.databaseError_.bind(this));
	}

	// Global

	clear() {
		this.avatarCache = {};

		return Promise.all([
			this.db_.clear('settings'),
			this.db_.clear('roster'),
			this.db_.clear('conversation'),
			this.db_.clear('message')
		]);
	}

	// Settings

	getSetting(id) {
		return this.db_.settings.get(id).then(obj => { return obj ? obj.value : undefined; });
	}

	setSetting(id, value) {
		return this.db_.settings.update({id: id, value: value});
	}

	removeSetting(id) {
		return this.db_.settings.remove(id);
	}

	// Roster

	getRosterItems() {
		return this.db_.roster.query().all().execute();
	}

	getRosterItem(jid) {
		return this.db_.roster.get(jid);
	}

	setRosterItem(item) {
		return this.db_.roster.update(item);
	}

	setRosterAvatar(jid, avatarID) {
		return this.db_.roster.get(jid).then((rosterItem) => {
			rosterItem.avatar = avatarID;
			return this.setRosterItem(rosterItem);
		});
	}

	removeRosterItem(jid) {
		return this.db_.roster.remove(jid);
	}

	// Avatar

	getAvatar(id) {
		return this.db_.avatar.get(id).then(obj => { return obj ? obj.avatar : undefined; });
	}

	getAvatarURL(id) {
		if(!this.avatarCache[id]) {
			this.avatarCache[id] = this.getAvatar(id).then((blob) => {
				var url = window.URL.createObjectURL(blob);

				return url;
			});
		}

		return this.avatarCache[id];
	}

	addAvatar(id, data) {
		var p = this.db_.avatar.update({id: id, avatar: data});

		p.then(() => {
			if(this.avatarCache[id]) {
				this.avatarCache[id].then((url) => {
					window.URL.revokeObjectURL(url);
				});
			}
			delete this.avatarCache[id];
		});

		return p;
	}

	removeAvatar(id) {
		var p = this.db_.avatar.remove(id);

		p.then(() => {
			if(this.avatarCache[id]) {
				this.avatarCache[id].then((url) => {
					window.URL.revokeObjectURL(url);
				});
			}
			delete this.avatarCache[id];
		});

		return p;
	}

	// Conversations

	getConversations() {
		return this.db_.conversation.query('lastMessage').all().desc().execute();
	}

	getConversation(jid) {
		return this.db_.conversation.get(jid);
	}

	touchConversationMessage(jid, lastMessage=Date.now()) {
		if(lastMessage instanceof Date) lastMessage = lastMessage.getTime();

		return this.db_.conversation.get(jid).then((conv) => {
			if(!conv) conv = {jid: jid};
			else if(conv.lastMessage && conv.lastMessage >= lastMessage) return;
			conv.lastMessage = lastMessage;
			return this.db_.conversation.update(conv);
		});
	}

	touchConversationViewed(jid, lastViewed=Date.now()) {
		if(lastViewed instanceof Date) lastViewed = lastViewed.getTime();

		return this.db_.conversation.get(jid).then((conv) => {
			if(!conv) conv = {jid: jid};
			else if(conv.lastViewed && conv.lastViewed >= lastViewed) return;
			conv.lastViewed = lastViewed;
			return this.db_.conversation.update(conv);
		});
	}

	removeConversation(jid) {
		return this.db_.conversation.remove(jid);
	}

	// Messages

	getMessages(jid, limit) {
		var promise = this.db_.message.query('conversation').only(jid).desc().execute();

		if(limit) {
			promise = promise.then((messages) => {
				return messages.slice(0, limit);
			});
		}

		promise = promise.then((messages) => {
			return messages.reverse();
		});

		return promise;
	}

	getMessagesSince(jid, time, limit) {
		var promise = this.db_.message.query('time').lowerBound(time, true).desc()
		                              .filter('conversation', 'michael@johnson.computer').execute();

		if(limit) {
			promise = promise.then((messages) => {
				return messages.slice(0, limit);
			});
		}

		promise = promise.then((messages) => {
			return messages.reverse();
		});

		return promise;
	}

	addMessage(msg) {
		var normalizedMsg = {
			incoming: msg.incoming,
			conversation: msg.incoming ? msg.from : msg.to,

			from: msg.from,
			to: msg.to,

			body: msg.body,

			time: msg.time.getTime()
		};

		return this.db_.message.add(normalizedMsg).then((stored) => {
			if(!stored) return;
			if(!stored[0]) return;

			return stored[0].id;
		});
	}

	// Misc.

	databaseOpened_(db) {
		console.info('Database ready!');

		this.db_ = db;
		this.ready = true;

		this.emit('ready');
	}

	databaseError_(e) {
		console.error('Failed to open database:', e);

		this.emit('error', new Error(e));
	}
}
