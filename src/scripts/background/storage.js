import events from 'events';

import db from 'db.js';

export default class Store extends events.EventEmitter {
	constructor() {
		super();

		this.ready = false;

		db.open({
			server: 'chinwag',
			version: Date.now(),

			schema: {
				settings: {
					key: {keyPath: 'id'}
				},

				roster: {
					key: {keyPath: 'jid'}
				}
			}
		}).then(this.databaseOpened_.bind(this)).catch(this.databaseError_.bind(this));
	}

	// Global

	clear() {
		return Promise.all([this.db_.clear('settings'), this.db_.clear('roster')]);
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

	setRosterItem(item) {
		return this.db_.roster.update(item);
	}

	removeRosterItem(jid) {
		return this.db_.roster.remove(jid);
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
