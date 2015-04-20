function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

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

	uuid: guid
};
