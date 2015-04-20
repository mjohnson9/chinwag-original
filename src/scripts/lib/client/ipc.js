var EventEmitter = require('events').EventEmitter;

var heir = require('heir');

var sliceArguments = require('../common').sliceArguments;


function IPCConnection() {
    this.responseCallbacks = {};
    this.currentID = 1;

    this.port = chrome.runtime.connect();
    console.debug('IPC: Connected');

    this.port.onMessage.addListener(this.onMessage.bind(this));
    this.port.onDisconnect.addListener(this.onDisconnect.bind(this));
}
heir.inherit(IPCConnection, EventEmitter);

// Methods

IPCConnection.prototype.disconnect = function(method) {
    this.port.disconnect();
};

IPCConnection.prototype.sendMessage = function(method) {
    var s = {
        method: method,
        args: sliceArguments(arguments, 1)
    };

    console.debug('SEND', s);

    this.port.postMessage(s);
};

IPCConnection.prototype.call = function(cb, method) {
    var id = this.currentID++;

    this.responseCallbacks[id] = cb;

    var s = {
        id: id,
        method: method,
        args: sliceArguments(arguments, 2)
    };

    console.debug('SEND', s);

    this.port.postMessage(s);
};

// Callbacks

IPCConnection.prototype.onMessage = function(msg) {
    console.debug('RECV', msg);

    if(msg.method === '_response_') {
        var callback = this.responseCallbacks[msg.id];
        if(!callback) {
            console.error('IPC: received response for unused message id:', msg.id);
            return;
        }

        delete this.responseCallbacks[msg.id];
        callback.apply(window, [msg.args[0]]);
        return;
    }

    msg.args.unshift(msg.method);

    this.emit.apply(this, msg.args);
};

IPCConnection.prototype.onDisconnect = function() {
    console.error('IPC: Got disconnected from background page');
    this.emit('disconnect');
    window.location.reload();
};

module.exports = IPCConnection;
