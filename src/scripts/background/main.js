import buffer from 'buffer';

import Connection from './connection';
import IPCHandler from './ipc';
import windows from '../lib/windows';

class BackgroundPage {
	constructor() {
		chrome.browserAction.onClicked.addListener(this.browserActionClicked.bind(this));
	    chrome.runtime.onInstalled.addListener(this.onInstalled.bind(this));

	    this.ipcHandler = new IPCHandler(this);

	    this.createClient();
	}

	createClient() {
		chrome.storage.local.get(['credentials', 'roster'], this.initialStorageRetrieve.bind(this));
	}

	authenticate(jid, password) {
	    console.debug('Received authenticate request. Removing existing authentication data.');
	    if(this.client) {
	        console.debug('Stopping client...');
	        this.client.stop();
	        delete this.client;
	    }

	    chrome.storage.local.remove(['credentials', 'roster'], this.authenticate_.bind(this, jid, password));
	}

	authenticate_(jid, password) {
	    console.debug('Starting new client...');
	    this.createClient_({
	        jid: jid,
	        password: password
	    });
	}

	createClient_(credentials, roster) {
		if(this.client) {
	        this.client.stop();
	        delete this.client;
	    }

	    this.client = new Connection(credentials, roster);

	    this.client.on('credentialsUpdated', this.credentialsUpdated.bind(this));
	    this.client.on('rosterUpdated', this.rosterUpdated.bind(this));
	    this.client.on('messagesUpdated', this.messagesUpdated.bind(this));
	    this.client.on('authResult', this.authResult.bind(this));

	    this.client.start();
	}

	getRoster() {
	    if(this.client === undefined) {
	        return null;
	    }

	    return this.client.roster;
	}

	getMessageHistory(jid) {
	    if(this.client === undefined) {
	        return null;
	    }

	    return this.client.messages[jid];
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
	    var stringified = JSON.stringify(credentials);
	    chrome.storage.local.set({credentials: stringified});
	}

	rosterUpdated(roster) {
	    this.ipcHandler.broadcast('roster', 'rosterUpdated', this.getRoster());

	    chrome.storage.local.set({roster: JSON.stringify(roster)});
	}

	messagesUpdated(jid, messageHistory) {
    	this.ipcHandler.broadcast('messages:'+jid, 'messagesUpdated', messageHistory);
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
	    var credentials;
	    if(objects.credentials) {
	        credentials = JSON.parse(objects.credentials);
	        for(var propertyName in credentials) {
	            if(!credentials.hasOwnProperty(propertyName)) {
	                continue;
	            }

	            var property = credentials[propertyName];
	            if(!(property instanceof Object)) {
	                continue;
	            }
	            if(property.type !== "Buffer") {
	                continue;
	            }

	            var arr = new buffer.Buffer(property.data);
	            credentials[propertyName] = arr;
	        }
	    }

	    if(!credentials) {
	        this.requiresAuth = true;
	        this.ipcHandler.broadcast('auth', 'authUpdated', !this.requiresAuth);
	        return;
	    }

	    var savedRoster;
	    if(objects.roster) {
	        savedRoster = JSON.parse(objects.roster);
	    }

	    this.createClient_(credentials, savedRoster);
	}
}

export default BackgroundPage;
