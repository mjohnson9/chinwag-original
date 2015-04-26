function checkIgnoreQuery(expected, location) {
	return location.pathname === expected;
}

function checkWithQuery(expected, location) {
	return location.pathname+location.search === expected;
}

function findWindow(page, ignoreQuery, cb) {
	var views = chrome.extension.getViews({type:'tab'});

	var checkFunc;
	if(ignoreQuery) checkFunc = checkIgnoreQuery;
	else checkFunc = checkWithQuery;

	for(var i = 0, len = views.length; i < len; i++) {
		var view = views[i];
		if(checkFunc(page, view.location)) {
			view.chrome.windows.getCurrent(function(w) {
				cb(w);
			});
			return;
		}
	}

	cb(false);
}

module.exports = {
	roster_: function(cb, result) {
		if(!result) {
			chrome.windows.create({
				url: '/roster.html',

				width: 260,
				height: 460,

				focused: true,
				type: 'detached_panel'
			}, cb);
			return;
		}

		chrome.windows.update(result.id, {
			focused: true
		});
		cb(result);
	},
	roster: function(cb) {
		findWindow('/roster.html', true, this.roster_.bind(this, cb));
	},

	chat_: function(jid, cb, result) {
		if(!result) {
			chrome.windows.create({
				url: '/chat.html?jid='+encodeURIComponent(jid),

				width: 260,
				height: 460,

				focused: true,
				type: 'detached_panel'
			}, cb);
			return;
		}

		chrome.windows.update(result.id, {
			focused: true
		});
		cb(result);
	},
	chat: function(jid, cb) {
		findWindow('/chat.html?jid='+encodeURIComponent(jid), false, this.chat_.bind(this, jid, cb));
	},

	signIn_: function(cb, result) {
		if(!result) {
			chrome.windows.create({
				url: '/signin.html',

				width: 540,
				height: 300,

				focused: true,
				type: 'detached_panel'
			}, cb);
			return;
		}

		chrome.windows.update(result.id, {
			focused: true
		});
		cb(result);
	},
	signIn: function(cb) {
		findWindow('/signin.html', true, this.signIn_.bind(this, cb));
	}
};
