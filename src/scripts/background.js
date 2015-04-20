require('./lib/error-reporting');

var EventEmitter = require('events').EventEmitter;

var heir = require('heir');
var XMPP = require('stanza.io');

var common = require('./lib/common');
var windows = require('./lib/windows');

var manifest = chrome.runtime.getManifest();

// ===== BackgroundPage =====
function BackgroundPage() {
    chrome.browserAction.onClicked.addListener(this.browserActionClicked.bind(this));

    this.ipcHandler = new IPCHandler(this);

    this.client = new Connection('nightexcessive-test@jappix.com', 'asdf123');
    this.client.start();

    this.client.on('rosterUpdated', this.rosterUpdated.bind(this));
    this.client.on('messagesUpdated', this.messagesUpdated.bind(this));
}

// Methods

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

    this.client.client.sendMessage({
        to: jid,
        body: message
    });
    return true;
};

// Callbacks

BackgroundPage.prototype.browserActionClicked = function() {
    windows.roster();
};

BackgroundPage.prototype.rosterUpdated = function(roster) {
    this.ipcHandler.broadcast('roster', 'rosterUpdated', roster);
};

BackgroundPage.prototype.messagesUpdated = function(jid, messageHistory) {
    this.ipcHandler.broadcast('messages:'+jid, 'messagesUpdated', messageHistory);
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

// ==== Connection =====
function Connection(jid, password) {
    this.ready = false;
    this.roster = [];

    this.messages = {};

    this.client = XMPP.createClient({
        softwareVersion: {
            name: 'Chinwag',
            version: manifest.version
        },

        useStreamManagement: false, // TODO: Remove for production

        jid: jid,
        password: password,


        transport: 'old-websocket',
        wsURL: 'wss://websocket.jappix.com:443/'
    });

    // Bind events
    this.client.on('*', this.debugLogging.bind(this));

    this.client.on('session:started', this.sessionStarted.bind(this));

    this.client.on('roster:update', this.rosterReceived.bind(this));

    this.client.on('message', this.handleMessage.bind(this, true));
    this.client.on('message:sent', this.handleMessage.bind(this, false));
}
heir.inherit(Connection, EventEmitter);

// Methods

Connection.prototype.start = function() {
    this.client.connect();
};

Connection.prototype.stop = function() {
    this.client.disconnect();
};

Connection.prototype.fetchAvatar = function(jid) {
    this.client.getAvatar(jid, "", this.avatarReceived.bind(this));
};

// Callbacks

var domParser = new DOMParser();

Connection.prototype.debugLogging = console.debug.bind(console, '[XMPP]');/*function(name, ev) {
    switch(name) {
    case 'raw:incoming':
        console.debug('[XMPP]', '[RECV]', domParser.parseFromString(ev, "text/xml").documentElement);
        break;
    case 'raw:outgoing':
        console.debug('[XMPP]', '[SEND]', domParser.parseFromString(ev, "text/xml").documentElement);
        break;
    case 'stream:data':
    case 'stanza':
        // ignore these two: they're too common
        break;
    case 'avatar':
        console.warn.bind(console, '[XMPP]');
        break;
    default:
        .apply();
        break;
    }
};*/

Connection.prototype.sessionStarted = function() {
    console.debug('Session started');
    //this.client.enableCarbons();
    this.client.getRoster(this.initialRosterReceived.bind(this));
};

Connection.prototype.initialRosterReceived = function(_, response) {
    this.rosterReceived(response);

    this.client.sendPresence();
    this.ready = true;
};

Connection.prototype.rosterReceived = function(iq) {
    var roster = iq.roster;

    for(var i = 0; i < roster.items.length; i++) {
        var item = roster.items[i];

        if(item.subscription === "remove") {
            for(var j = 0; j < this.roster.length; j++) {
                var internalItem = this.roster[j];
                if(internalItem.jid.bare === item.jid.bare) {
                    continue;
                }

                if(internalItem.avatar) {
                    window.URL.revokeObjectURL(internalItem.avatar);
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

            this.fetchAvatar(item.jid);
        }
    }

    console.info('Roster updated:', this.roster);
    this.emit('rosterUpdated', this.roster);
};

function base64toBlob(base64Data, contentType) {
    contentType = contentType || '';
    var sliceSize = 1024;
    var byteCharacters = atob(base64Data);
    var bytesLength = byteCharacters.length;
    var slicesCount = Math.ceil(bytesLength / sliceSize);
    var byteArrays = new Array(slicesCount);

    for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        var begin = sliceIndex * sliceSize;
        var end = Math.min(begin + sliceSize, bytesLength);

        var bytes = new Array(end - begin);
        for (var offset = begin, i = 0 ; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, { type: contentType });
}

Connection.prototype.avatarReceived = function(_, stanza) {
    var user = stanza.from.bare;
    var avatar = base64toBlob(stanza.pubsub.retrieve.item.avatarData, "image/png");
    var avatarUrl = window.URL.createObjectURL(avatar);

    var found = false;
    for(var i = 0; i < this.roster.length; i++) {
        var rosterItem = this.roster[i];
        if(rosterItem.jid.bare !== user) {
            continue;
        }

        rosterItem.avatar = avatarUrl;
        found = true;
        break;
    }

    if(!found) {
        window.URL.revokeObjectURL(avatarUrl);
        return;
    }

    this.emit('rosterUpdated', this.roster);
};

function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

Connection.prototype.handleMessage = function(incoming, stanza) {
    if(!stanza.body) {
        console.warn('message unhandled:', incoming, stanza);
        // chat state or other marker message
        return;
    }

    console.log('message handled:', incoming, stanza);

    var msg = {
        _internalID: guid(),

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

var backgroundPage = new BackgroundPage();
