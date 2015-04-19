module.exports = {
	sliceArguments: function(toSlice, startIndex, num) {
		var args = [];
		var len = toSlice.length,
			end = len;

		if(num) {
			end = Math.min(startIndex + num, len);
		}

		for(var i = startIndex; i < end; i++) {
			args.push(toSlice[i]);
		}

		return args;
	},

	windows: {
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
	}
};
