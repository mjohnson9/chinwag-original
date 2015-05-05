import buffer from 'buffer';

import {BoundClass} from '../lib/util';
import Connection from './connection';
import IPCHandler from './ipc';
import Storage from './storage';
import * as promiseUtil from '../lib/promise';
import windows from '../lib/windows';

class ipcMethods extends BoundClass {
	constructor(page) {
		super();

		this.page = page;
	}

	getRoster() {
		return this.page.getRoster();
	}

	isAuthed() {
		if(this.page.requiresAuth === undefined) {
			return null;
		}

		return !this.page.requiresAuth;
	}

	authenticate(connection, jid, password) {
		this.page.authenticate(jid, password);
	}

	getMessageHistory(connection, jid) {
		return this.page.getMessageHistory(jid/*, 50*/);
	}

	sendMessage(connection, jid, message) {
		return this.page.sendMessage(jid, message);
	}
}

class BackgroundPage {
	constructor() {
		chrome.browserAction.onClicked.addListener(this.browserActionClicked.bind(this));
	    chrome.runtime.onInstalled.addListener(this.onInstalled.bind(this));

	    this.ipcHandler = new IPCHandler(new ipcMethods(this));

	    this.storage = new Storage();
	    this.storagePromise = new Promise((resolve, reject) => {
	    	this.storage.once('ready', () => resolve())
	    });

	    this.createClient();
	}

	createClient() {
		return this.storagePromise.then(() => {
			return promiseUtil.map({
				credentials: this.storage.getSetting('credentials'),
				rosterVersion: this.storage.getSetting('rosterVersion')
			}).then(this.initialStorageRetrieve.bind(this));
		});
	}

	authenticate(jid, password) {
	    console.debug('Received authenticate request. Removing existing authentication data.');

	    if(this.client) {
	        console.debug('Stopping client...');
	        this.client.stop();
	        delete this.client;
	    }

	    return this.storagePromise.then(() => {
        	return this.storage.clear().then(this.authenticate_.bind(this, jid, password));
	    });
	}

	authenticate_(jid, password) {
	    console.debug('Starting new client...');
	    this.createClient_({
	        jid: jid,
	        password: password
	    });
	}

	createClient_(credentials, rosterVersion) {
		if(this.client) {
	        this.client.stop();
	        delete this.client;
	    }

	    this.client = new Connection(credentials, rosterVersion);

	    this.client.on('credentialsUpdated', this.credentialsUpdated.bind(this));
	    this.client.on('roster:update', this.rosterUpdated.bind(this, true));
	    this.client.on('roster:remove', this.rosterUpdated.bind(this, false));
	    this.client.on('roster:version', this.newRosterVersion.bind(this));
	    this.client.on('message', this.handleMessage.bind(this));
	    this.client.on('authResult', this.authResult.bind(this));

	    this.client.start();
	}

	getRoster() {
	    return this.storagePromise.then(() => {
    		return this.storage.getRosterItems();
    	});
	}

	sendMessage(jid, message) {
	    if(this.client === undefined) {
	        return false;
	    }

	    this.client.sendMessage(jid, message);
	    return true;
	}

	browserActionClicked() {
	    if(this.requiresAuth === true) {
	        windows.signIn();
	        return;
	    }
	    windows.roster();
	}

	credentialsUpdated(credentials) {
	    return this.storagePromise.then(() => {
	    	return this.storage.setSetting('credentials', credentials);
	    });
	}

	broadcastNewRoster_() {
		return this.storagePromise.then(() => {
			return this.storage.getRosterItems().then((rosterItems) => {
				this.ipcHandler.broadcast('roster', 'rosterUpdated', rosterItems);
			});
		});
	}

	rosterUpdated(add, rosterItem) {
	    if(!add) {
	    	return this.storage.removeRosterItem(rosterItem).then(this.broadcastNewRoster_.bind(this));;
	    }

	    return this.storage.setRosterItem(rosterItem).then(this.broadcastNewRoster_.bind(this));
	}

	newRosterVersion(version) {
		return this.storagePromise.then(() => {
			return this.storage.setSetting('rosterVersion', version);
		});
	}

	getMessageHistory(jid, limit) {
	    return this.storagePromise.then(() => {
    		return this.storage.getMessages(jid, limit);
    	});
	}

	handleMessage(msg) {
		var jid = msg.incoming ? msg.from : msg.to;

    	return this.storagePromise.then(() => {
    		return this.storage.addMessage(msg).then((msgID) => {
	    		return this.getMessageHistory(jid).then((messages) => {
	    			this.ipcHandler.broadcast('messages:'+jid, 'messagesUpdated', messages);
	    		});
	    	});
    	});
	}

	authResult(success) {
	    this.requiresAuth = !success;
	    this.ipcHandler.broadcast('auth', 'authUpdated', success);
	}

	onInstalled(reason) {
	    if(reason === 'install') {
	        windows.roster();
	    }
	}

	initialStorageRetrieve(objects) {
		console.info('initialStorageRetrieve:', objects);

	    if(objects.credentials) {
	        for(var propertyName in objects.credentials) {
	            if(!objects.credentials.hasOwnProperty(propertyName)) {
	                continue;
	            }

	            var property = objects.credentials[propertyName];
	            if(!(property instanceof Uint8Array)) {
	                continue;
	            }

	            objects.credentials[propertyName] = buffer.Buffer(property, property.length, 0);
	        }
	    }

	    if(!objects.credentials) {
	        this.requiresAuth = true;
	        this.ipcHandler.broadcast('auth', 'authUpdated', !this.requiresAuth);
	        return;
	    }

	    this.createClient_(objects.credentials, objects.rosterVersion);
	}
}

export default BackgroundPage;
