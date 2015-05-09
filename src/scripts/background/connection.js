import events from 'events';

import XMPP from 'stanza.io';

import common from '../lib/common';

var manifest = chrome.runtime.getManifest();

function getXMPPLang() {
	return chrome.i18n.getUILanguage().split("-")[0];
}

class Connection extends events.EventEmitter {
	constructor(credentials, rosterVersion) {
		this.loginJID_ = credentials.jid;
		this.client = new XMPP.Client({
			softwareVersion: {
				name: manifest.name,
				version: manifest.version
			},
			capsNode: `https://chrome.google.com/webstore/detail/${manifest.name.toLowerCase()}/${chrome.runtime.id}`,

			lang: getXMPPLang(),

			useStreamManagement: false, // TODO: Remove for production

			jid: credentials.jid,
			credentials: {
				password: credentials.password,

				serverKey: credentials.serverKey,
				clientKey: credentials.clientKey,
				saltedPassword: credentials.saltedPassword
			},

			rosterVer: rosterVersion,

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

		this.emit('roster:received');

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
			item.jid = item.jid.bare;

			if(item.subscription === "remove") {
				this.emit('roster:remove', item.jid);
				continue;
			}

			this.emit('roster:update', item);
		}

		this.emit('roster:version', iq.roster.ver);
	}

	avatarReceived(stanza) {
		if(stanza.source != 'pubsub') return; // Right now, pubsub is the only one that we can get enough metadata from.

		var jid = stanza.jid.bare;

		var avatars = [];

		for(var i = 0, iLen = stanza.avatars.length; i < iLen; i++) {
			var avatar = stanza.avatars[i];
			avatars.push({
				source: stanza.source,
				mimeType: avatar.type,

				width: parseInt(avatar.width),
				height: parseInt(avatar.height),

				id: avatar.id
			});
		}

		this.emit('avatar:list', jid, avatars);

		/*var user = stanza.jid.bare;

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
			this.emit('rosterUpdated', true, rosterItem);
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

		if(avatarToFetch !== undefined) this.client.getAvatar(user, avatarToFetch.id, this.avatarFetched.bind(this, avatarToFetch.type));*/
	}

	fetchAvatarPubsub(jid, info) {
		return new Promise((resolve, reject) => {
			this.client.getAvatar(jid, info.id, (_, stanza) => {
				resolve(this.base64toBlob_(stanza.pubsub.retrieve.item.avatarData, info.mimeType));
			});
		});
	}

	fetchAvatar(jid, info) {
		switch(info.source) {
		case 'pubsub':
			return this.fetchAvatarPubsub(jid, info);
		default:
			throw new Error(`Unknown avatar source: ${source}`);
		}
	}

	base64toBlob_(b64Data, contentType, sliceSize) {
		contentType = contentType || '';
		sliceSize = sliceSize || 512;

		var byteCharacters = atob(b64Data);
		var byteArrays = [];

		for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
			var slice = byteCharacters.slice(offset, offset + sliceSize);

			var byteNumbers = new Array(slice.length);
			for (var i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}

			var byteArray = new Uint8Array(byteNumbers);

			byteArrays.push(byteArray);
		}

		var blob = new Blob(byteArrays, {type: contentType});
		return blob;
	}

	/*avatarFetched(mimeType, _, stanza) {
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


			this.emit('rosterUpdated', true, rosterItem);

			found = true;
			break;
		}

		if(!found) {
			return;
		}
	}*/

	handleMessage(incoming, stanza) {
		if(!stanza.body) {
			console.warn('Ignored message:', incoming ? '(incoming)' : '(outgoing)', stanza);
			// chat state or other marker message
			return;
		}

		var msg = {
			incoming: incoming,

			from: stanza.from.bare != "" ? stanza.from.bare : this.client.jid.bare,
			to: stanza.to.bare,

			body: stanza.body
		};

		if(stanza.delay && stanza.delay.stamp) {
			msg.time = stanza.delay.stamp;
		} else {
			msg.time = new Date();
		}

		this.emit('message', msg);
	}
}


export default Connection;
