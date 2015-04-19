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
	}
};
