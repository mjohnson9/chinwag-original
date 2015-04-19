module.exports = {
	roster: function(cb) {
		chrome.windows.create({
			url: 'roster.html',

			width: 260,
			height: 460,

			focused: true,
			type: 'detached_panel'
		}, cb);
	},

	chat: function(jid) {
		chrome.windows.create({
			url: 'chat.html?jid='+encodeURIComponent(jid),

			width: 260,
			height: 460,

			focused: true,
			type: 'detached_panel'
		});
	}
};
