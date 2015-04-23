require('./lib/error-reporting');

var Buffer = require('buffer').Buffer;
var EventEmitter = require('events').EventEmitter;
var crypto = require('crypto');

function sha1(data, encoding) {
    var h = crypto.createHash('sha1');
    h.update(data, encoding);
    return h.digest('hex');
}

var heir = require('heir');
var XMPP = require('stanza.io');

var common = require('./lib/common');
var windows = require('./lib/windows');

var manifest = chrome.runtime.getManifest();

// ===== BackgroundPage =====
function BackgroundPage() {
    chrome.browserAction.onClicked.addListener(this.browserActionClicked.bind(this));
    chrome.runtime.onInstalled.addListener(this.onInstalled.bind(this));

    this.ipcHandler = new IPCHandler(this);

    this.createClient();
}

// Methods

BackgroundPage.prototype.createClient = function() {
    chrome.storage.local.get(['credentials', 'roster'], this.initialStorageRetrieve.bind(this));
};

BackgroundPage.prototype.authenticate = function(jid, password) {
    console.debug('Received authenticate request. Removing existing authentication data.');
    if(this.client) {
        console.debug('Stopping client...');
        this.client.stop();
        delete this.client;
    }

    chrome.storage.local.remove(['credentials', 'roster'], this.authenticate_.bind(this, jid, password));
};

BackgroundPage.prototype.authenticate_ = function(jid, password) {
    console.debug('Starting new client...');
    this.createClient_({
        jid: jid,
        password: password
    });
};

BackgroundPage.prototype.createClient_ = function(credentials, roster) {
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
};

BackgroundPage.prototype.getRoster = function() {
    if(this.client === undefined) {
        return null;
    }

    return this.client.roster;
};

BackgroundPage.prototype.getMessageHistory = function(jid) {
    if(this.client === undefined) {
        return null;
    }

    return this.client.messages[jid];
};

BackgroundPage.prototype.sendMessage = function(jid, message) {
    if(this.client === undefined) {
        return false;
    }

    this.client.sendMessage(jid, message);
    return true;
};

// Callbacks

BackgroundPage.prototype.browserActionClicked = function() {
    if(this.requiresAuth === true) {
        windows.signIn();
        return;
    }
    windows.roster();
};

BackgroundPage.prototype.credentialsUpdated = function(credentials) {
    var stringified = JSON.stringify(credentials);
    chrome.storage.local.set({credentials: stringified});
};

BackgroundPage.prototype.rosterUpdated = function(roster) {
    this.ipcHandler.broadcast('roster', 'rosterUpdated', this.getRoster());

    chrome.storage.local.set({roster: JSON.stringify(roster)});
};

BackgroundPage.prototype.messagesUpdated = function(jid, messageHistory) {
    this.ipcHandler.broadcast('messages:'+jid, 'messagesUpdated', messageHistory);
};

BackgroundPage.prototype.authResult = function(success) {
    this.requiresAuth = !success;
    this.ipcHandler.broadcast('auth', 'authUpdated', success);
};

BackgroundPage.prototype.onInstalled = function(reason) {
    if(reason === 'install') {
        windows.roster();
    }
};

BackgroundPage.prototype.initialStorageRetrieve = function(objects) {
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

            var arr = new Buffer(property.data);
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
};

// ==== IPCHandler =====
function IPCHandler(bp) {
    this.page = bp;

    this.connections = [];
    this.subscriptions = {};

    chrome.runtime.onConnect.addListener(this.onConnection.bind(this));
}

// Methods

IPCHandler.prototype.broadcast = function(channel, method) {
    var subscriptions = this.subscriptions[channel];
    if(!subscriptions) {
        return;
    }

    var args = common.sliceArguments(arguments, 2);
    args.unshift(method);

    for(var i = 0; i < subscriptions.length; i++) {
        var subscription = subscriptions[i];
        subscription.sendMessage.apply(subscription, args);
    }
};

// Remote methods

IPCHandler.prototype.methods = {};

IPCHandler.prototype.methods.subscribe = function(connection, channel) {
    console.info(connection.port.sender.url, 'subscribed to', channel);
    var subscriptions = this.subscriptions[channel];
    if(!subscriptions) {
        this.subscriptions[channel] = [connection];
        return;
    }

    subscriptions.push(connection);
};

IPCHandler.prototype.methods.getRoster = function() {
    return this.page.getRoster();
};

IPCHandler.prototype.methods.isAuthed = function() {
    if(this.page.requiresAuth === undefined) {
        return null;
    }
    return !this.page.requiresAuth;
};

IPCHandler.prototype.methods.authenticate = function(connection, jid, password) {
    this.page.authenticate(jid, password);
};

IPCHandler.prototype.methods.getMessageHistory = function(connection, jid) {
    return this.page.getMessageHistory(jid);
};

IPCHandler.prototype.methods.sendMessage = function(connection, jid, message) {
    return this.page.sendMessage(jid, message);
};

// Callbacks

IPCHandler.prototype.onConnection = function(port) {
    console.debug('IPC connection from', port.sender.url);
    var newConnection = new IPCConnection(port);
    newConnection.on('message', this.onMessage.bind(this, newConnection));
    newConnection.on('disconnect', this.onDisconnect.bind(this, newConnection));
    this.connections.push(newConnection);
};

IPCHandler.prototype.onDisconnect = function(connection) {
    for(var i = 0; i < this.connections.length; i++) {
        var thisConnection = this.connections[i];
        if(thisConnection !== connection) {
            continue;
        }
        this.connections.splice(i, 1);
        i--;
    }

    for(var channel in this.subscriptions) {
        if(!this.subscriptions.hasOwnProperty(channel)) {
            continue;
        }

        var subscriptions = this.subscriptions[channel];

        for(var j = 0; j < subscriptions.length; j++) {
            var subscription = subscriptions[j];
            if(subscription !== connection) {
                continue;
            }

            subscriptions.splice(j, 1);
            j--;
        }
    }

    console.debug('IPC disconnect from', connection.port.sender.url);
};

IPCHandler.prototype.onMessage = function(connection, msg) {
    if(msg.constructor !== Object || !msg.hasOwnProperty('method')) {
        console.warn('IPC: Invalid message from', connection.port.sender.url, msg);
        return;
    }

    var args = msg.args;
    if(!args) args = [];

    args.unshift(connection);

    var method = this.methods[msg.method];
    if(!method) {
        console.warn('IPC: Unknown method from', connection.port.sender.url, msg.method);
        return;
    }

    var retVal = method.apply(this, args);

    if(msg.id) {
        connection.sendResponse(msg.id, retVal);
    }
};

// ==== IPCConnection =====
function IPCConnection(port) {
    this.port = port;

    this.port.onMessage.addListener(this.onMessage.bind(this));
    this.port.onDisconnect.addListener(this.onDisconnect.bind(this));
}
heir.inherit(IPCConnection, EventEmitter);

// Methods

IPCConnection.prototype.sendMessage = function(method) {
    this.port.postMessage({
        method: method,
        args: common.sliceArguments(arguments, 1)
    });
};

IPCConnection.prototype.sendResponse = function(id, response) {
    this.port.postMessage({
        method: '_response_',
        id: id,
        args: [response]
    });
};

// Callbacks

IPCConnection.prototype.onMessage = function(msg) {
    this.emit('message', msg);
};

IPCConnection.prototype.onDisconnect = function() {
    this.emit('disconnect');
};

function getXMPPLang() {
    return chrome.i18n.getUILanguage().split("-")[0];
}

// ==== Connection =====
function Connection(credentials, savedRoster) {
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
heir.inherit(Connection, EventEmitter);

// Methods

Connection.prototype.loadPlugins_ = function() {
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
};

Connection.prototype.start = function() {
    this.client.connect();
};

Connection.prototype.stop = function() {
    this.client.disconnect();
};

Connection.prototype.getStorableRoster = function() {
    var storable = new Array(this.roster.length);

    for(var i = 0, len = this.roster.length; i < len; i++) {
        storable[i] = this.standardizeRosterEntry_(this.roster[i]);
    }

    return {
        version: this.roster.version,
        data: storable
    };
};

Connection.prototype.decodeStoredRoster = function(stored) {
    if(!stored || !stored.data) {
        return [];
    }
    var roster = new Array(stored.data.length);
    roster.version = stored.version;

    for(var i = 0, len = stored.data.length; i < len; i++) {
        roster[i] = this.unstandardizeRosterEntry_(stored.data[i]);
    }

    return roster;
};

// Prepares a roster entry for JSON stringifying for storage.
Connection.prototype.standardizeRosterEntry_ = function(entry) {
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
};

// Turns a standardized roster entry back into a normal roster entry
Connection.prototype.unstandardizeRosterEntry_ = function(entry) {
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
};

Connection.prototype.updateCredentials_ = function(newCredentials) {
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
};

Connection.prototype.sendMessage = function(to, body) {
    this.client.sendMessage({
        type: 'chat',
        to: to,
        body: body
    });
};

// Callbacks

var consoleDebug = console.debug.bind(console, '[XMPP]');

Connection.prototype.debugLogging = function(name, ev) {
    if(name.indexOf('iq') === 0 || name.indexOf('id:') === 0) return;
    switch(name) {
        case 'raw:incoming':
        case 'raw:outgoing':
        case 'stream:data':
        case 'stanza':
            break;
        default:
            consoleDebug.apply(console, arguments);
            break;
    }
}

Connection.prototype.sessionStarted = function() {
    this.client.enableCarbons();
    this.client.getRoster(this.initialRosterReceived.bind(this));
};

Connection.prototype.authResult = function(success, credentials) {
    if(success) {
        this.updateCredentials_(credentials);
    }

    this.emit('authResult', success);
};

Connection.prototype.initialRosterReceived = function(_, response) {
    this.rosterReceived(response);

    this.client.sendPresence({
        caps: this.client.disco.caps
    });
};

Connection.prototype.rosterReceived = function(iq) {
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
};

var avatarTypeWhitelist = {
    "image/png": true,
    "image/jpeg": true,
    "image/gif": true,
    "image/webp": true
};

Connection.prototype.avatarReceived = function(stanza) {
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
};

Connection.prototype.avatarFetched = function(mimeType, _, stanza) {
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
};

Connection.prototype.handleMessage = function(incoming, stanza) {
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
};

window.backgroundPage = new BackgroundPage();
