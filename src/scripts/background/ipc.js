import events from 'events';

import {BoundClass} from '../lib/util';
import common from '../lib/common';

class ipcMethods extends BoundClass {
	constructor(handler) {
		super();

		this.ipcHandler = handler;
	}

	subscribe(connection, channel) {
		console.info(connection.port.sender.url, 'subscribed to', channel);
		var subscriptions = this.ipcHandler.subscriptions[channel];
		if(!subscriptions) {
			this.ipcHandler.subscriptions[channel] = [connection];
			return;
		}

		subscriptions.push(connection);
	}
}

class IPCHandler {
	constructor(methodHandler = {}) {
		this.builtinMethods = new ipcMethods(this);
		this.methods = methodHandler;

		this.connections = [];
		this.subscriptions = {};

		chrome.runtime.onConnect.addListener(this.onConnection.bind(this));
	}

	broadcast(channel, method) {
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
	}

	onConnection(port) {
		console.debug('IPC connection from', port.sender.url);
		var newConnection = new IPCConnection(port);
		newConnection.on('message', this.onMessage.bind(this, newConnection));
		newConnection.on('disconnect', this.onDisconnect.bind(this, newConnection));
		this.connections.push(newConnection);
	}

	onDisconnect(connection) {
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
	}

	onMessage(connection, msg) {
		if(msg.constructor !== Object || !msg.hasOwnProperty('method')) {
			console.warn('IPC: Invalid message from', connection.port.sender.url, msg);
			return;
		}

		var args = msg.args;
		if(!args) args = [];

		args.unshift(connection);

		var method = this.methods[msg.method] != null ? this.methods[msg.method] : this.builtinMethods[msg.method];
		if(!method) {
			console.warn('IPC: Unknown method from', connection.port.sender.url, msg.method);
			return;
		}

		var retVal = method.apply(null, args);

		if(msg.id) {
			if(retVal instanceof Promise) {
				retVal.then((val) => {
					connection.sendResponse(msg.id, val);
				});
				return;
			}

			connection.sendResponse(msg.id, retVal);
		}
	}
}

class IPCConnection extends events.EventEmitter {
	constructor(port) {
		this.port = port;

	    this.port.onMessage.addListener(this.onMessage.bind(this));
	    this.port.onDisconnect.addListener(this.onDisconnect.bind(this));
	}

	sendMessage(method) {
	    this.port.postMessage({
	        method: method,
	        args: common.sliceArguments(arguments, 1)
	    });
	}

	sendResponse(id, response) {
	    this.port.postMessage({
	        method: '_response_',
	        id: id,
	        args: [response]
	    });
	}

	onMessage(msg) {
		this.emit('message', msg);
	}

	onDisconnect() {
		this.emit('disconnect');
	}
}

export default IPCHandler;
export {IPCConnection};
