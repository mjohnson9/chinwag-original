import events from 'events';

import XMPP from 'stanza.io';

import common from '../lib/common';

var manifest = chrome.runtime.getManifest();

function getXMPPLang() {
    return chrome.i18n.getUILanguage().split("-")[0];
}

class Connection extends events.EventEmitter {
	constructor(credentials, savedRoster) {
		if(savedRoster) {
	        this.roster = this.decodeStoredRoster(savedRoster);
	    } else {
	        this.roster = [];
	    }

	    this.messages = {};

	    this.loginJID_ = credentials.jid;
	    this.client = new XMPP.Client({
	        softwareVersion: {
	            name: 'Chinwag',
	            version: manifest.version
	        },
	        capsNode: 'https://chrome.google.com/webstore/detail/chinwag/redacted', // TODO: Replace with actual URL

	        lang: getXMPPLang(),

	        useStreamManagement: false, // TODO: Remove for production

	        jid: credentials.jid,
	        credentials: {
	            password: credentials.password,

	            serverKey: credentials.serverKey,
	            clientKey: credentials.clientKey,
	            saltedPassword: credentials.saltedPassword
	        },

	        rosterVer: this.roster.version,

	        transports: ['websocket', 'bosh']
	    });

	    this.loadPlugins_();


	    // Bind events
	    this.client.on('*', this.debugLogging.bind(this));

	    this.client.on('auth:success', this.authResult.bind(this, true));
	    this.client.on('auth:failed', this.authResult.bind(this, false));

	    this.client.on('session:started', this.sessionStarted.bind(this));

	    this.client.on('roster:update', this.rosterReceived.bind(this));
	    this.client.on('avatar', this.avatarReceived.bind(this));

	    this.client.on('message', this.handleMessage.bind(this, true));
	    this.client.on('message:sent', this.handleMessage.bind(this, false));
	}

	loadPlugins_() {
	    this.client.use(require('stanza.io/lib/plugins/disco'));

	    this.client.use(require('stanza.io/lib/plugins/roster'));

	    this.client.use(require('stanza.io/lib/plugins/version'));

	    this.client.use(require('stanza.io/lib/plugins/time'));

	    this.client.use(require('stanza.io/lib/plugins/delayed'));
	    this.client.use(require('stanza.io/lib/plugins/forwarding'));
	    this.client.use(require('stanza.io/lib/plugins/carbons'));

	    this.client.use(require('stanza.io/lib/plugins/pubsub'));
	    this.client.use(require('stanza.io/lib/plugins/avatar'));

	    this.client.updateCaps();
	}

	start() {
		this.client.connect();
	}

	stop() {
		this.client.disconnect();
	}

	getStorableRoster() {
		var storable = new Array(this.roster.length);

	    for(var i = 0, len = this.roster.length; i < len; i++) {
	        storable[i] = this.standardizeRosterEntry_(this.roster[i]);
	    }

	    return {
	        version: this.roster.version,
	        data: storable
	    };
	}

	decodeStoredRoster(stored) {
		if(!stored || !stored.data) {
	        return [];
	    }
	    var roster = new Array(stored.data.length);
	    roster.version = stored.version;

	    for(var i = 0, len = stored.data.length; i < len; i++) {
	        roster[i] = this.unstandardizeRosterEntry_(stored.data[i]);
	    }

	    return roster;
	}

	standardizeRosterEntry_(entry) {
		var res = {
	        jid: entry.jid.bare || entry.jid,
	        name: entry.name,
	        subscription: entry.subscription,
	    };
	    if(entry.avatar) {
	        res.avatar = {
	            id: entry.avatar.id,
	            url: entry.avatar.url
	        };
	    }

	    return res;
	}

	unstandardizeRosterEntry_(entry) {
		var res = {
	        jid: new XMPP.JID(entry.jid),
	        name: entry.name,
	        subscription: entry.subscription
	    };
	    if(entry.avatar) {
	        res.avatar = {
	            id: entry.avatar.id,
	            url: entry.avatar.url
	        };
	    }

	    return res;
	}

	updateCredentials_(newCredentials) {
		var credentials = {
	        jid: this.loginJID_
	    };

	    if(this.loginJID) {
	        delete this.loginJID_;
	    }

	    if(newCredentials.serverKey && newCredentials.clientKey && newCredentials.saltedPassword) {
	        credentials.serverKey = newCredentials.serverKey;
	        credentials.clientKey = newCredentials.clientKey;
	        credentials.saltedPassword = newCredentials.saltedPassword;
	    } else {
	        credentials.password = newCredentials.password;
	    }

	    this.emit('credentialsUpdated', credentials);
	}

	sendMessage(to, body) {
	    this.client.sendMessage({
	        type: 'chat',
	        to: to,
	        body: body
	    });
	}

	debugLogging(name, ev) {
		switch(name) {
			case 'raw:incoming':
			case 'raw:outgoing':
			case 'stream:data':
			case 'stanza':
				break;
			default:
				console.debug('[XMPP]', name, ev);
				break;
		}
	}

	sessionStarted() {
		this.client.enableCarbons();
		this.client.getRoster(this.initialRosterReceived.bind(this));
	}

	authResult(success, credentials) {
	    if(success) {
	        this.updateCredentials_(credentials);
	    }

	    this.emit('authResult', success);
	}

	initialRosterReceived(_, response) {
	    this.rosterReceived(response);

	    this.client.sendPresence({
	        caps: this.client.disco.caps
	    });
	}

	rosterReceived(iq) {
		var roster = iq.roster;
	    if(!roster || !roster.items) {
	        // This is just an ack that our version is up-to-date
	        // or that the roster is empty
	        return;
	    }

	    for(var i = 0; i < roster.items.length; i++) {
	        var item = roster.items[i];

	        if(item.subscription === "remove") {
	            for(var j = 0; j < this.roster.length; j++) {
	                var internalItem = this.roster[j];
	                if(internalItem.jid.bare === item.jid.bare) {
	                    continue;
	                }

	                if(internalItem.avatar) {
	                    delete internalItem.avatar;
	                }

	                this.roster.splice(j, 1);
	                j--;
	            }
	            continue;
	        }

	        var found = false;

	        for(var k = 0; k < this.roster.length; k++) {
	            var updateItem = this.roster[k];
	            if(updateItem.jid.bare !== item.jid.bare) {
	                continue;
	            }

	            item.avatar = updateItem.avatar;
	            this.roster[k] = item;

	            found = true;
	            break;
	        }

	        if(!found) {
	            this.roster.push(item);
	        }
	    }

	    this.roster.version = iq.roster.ver;

	    this.emit('rosterUpdated', this.getStorableRoster(this.roster));
	}

	avatarReceived(stanza) {
		if(stanza.source !== 'pubsub') return;

	    var user = stanza.jid.bare;

	    var found = false;
	    var rosterItem;
	    for(var i = 0; i < this.roster.length; i++) {
	        var r = this.roster[i];
	        if(r.jid.bare !== user) {
	            continue;
	        }

	        rosterItem = r;
	        break;
	    }

	    if(!rosterItem) {
	        return;
	    }

	    if(!stanza.avatars || stanza.avatars.length === 0) {
	        delete rosterItem.avatar;
	        this.emit('rosterUpdated', this.getStorableRoster(this.roster));
	        return;
	    }

	    var avatarToFetch;
	    for(var j = 0, jLen = stanza.avatars.length; j < jLen; j++) {
	        var avatar = stanza.avatars[j];

	        if(!avatarTypeWhitelist[avatar.type]) continue;

	        var avatarID = avatar.id;

	        if(rosterItem.avatar && avatarID === rosterItem.avatar.id) {
	            return;
	        }

	        avatarToFetch = avatar;
	        break;
	    }

	    console.debug('avatar to fetch:', avatarToFetch);

	    if(avatarToFetch !== undefined) this.client.getAvatar(user, avatarToFetch.id, this.avatarFetched.bind(this, avatarToFetch.type));
	}

	avatarFetched(mimeType, _, stanza) {
		console.debug('avatar fetched:', mimeType, stanza);
	    var user = stanza.from.bare;

	    var item = stanza.pubsub.retrieve.item;
	    var avatarUrl = "data:"+mimeType+";base64,"+(item.avatarData.replace("\n", ""));
	    var avatarID = item.id;

	    var found = false;
	    for(var i = 0; i < this.roster.length; i++) {
	        var rosterItem = this.roster[i];
	        if(rosterItem.jid.bare !== user) {
	            continue;
	        }

	        rosterItem.avatar = {
	            id: avatarID,
	            url: avatarUrl
	        };
	        found = true;
	        break;
	    }

	    if(!found) {
	        return;
	    }

	    this.emit('rosterUpdated', this.getStorableRoster(this.roster));
	}

	handleMessage(incoming, stanza) {
		if(!stanza.body) {
	        console.warn('message unhandled:', incoming, stanza);
	        // chat state or other marker message
	        return;
	    }

	    var msg = {
	        _internalID: common.uuid(),

	        from: stanza.from.bare,
	        to: stanza.to.bare,
	        body: stanza.body,
	        incoming: incoming
	    };

	    if(stanza.delay && stanza.delay.stamp) {
	        msg.time = stanza.delay.stamp;
	    } else {
	        msg.time = new Date();
	    }
	    msg.time = msg.time.toISOString();

	    var conversation;
	    if(incoming) {
	        conversation = stanza.from.bare;
	    } else {
	        conversation = stanza.to.bare;
	    }

	    var messageHistory = this.messages[conversation];
	    if(!messageHistory) {
	        messageHistory = [msg];
	        this.messages[conversation] = messageHistory;
	    } else {
	        var firstMessage = messageHistory[messageHistory.length-1];
	        if(Date.parse(firstMessage.time) < Date.parse(msg.time)) {
	            messageHistory.push(msg);
	        } else {
	            for(var i = messageHistory.length-1; i >= 0; i--) {
	                var thisMessage = messageHistory[i];
	                if(Date.parse(thisMessage.time) < Date.parse(msg.time)) {
	                    continue;
	                }

	                messageHistory.splice(i, 0, msg);
	                break;
	            }
	        }
	    }

	    if(messageHistory.length > 50) {
	        messageHistory = messageHistory.splice(messageHistory.length - 50);
	        this.messages[conversation] = messageHistory;
	    }

	    this.emit('messagesUpdated', conversation, messageHistory);
	}
}


export default Connection;
