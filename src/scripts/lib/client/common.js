var moment = require('moment');

console.debug("moment locale set to", moment.locale(chrome.i18n.getUILanguage()));

module.exports = {
	displayName: function(rosterEntry) {
	    var name = rosterEntry.name;
	    if(!name) {
	        name = rosterEntry.jid.split('@')[0];
	    }

	    return name;
	}
};
