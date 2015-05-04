function map(promiseMap) {
	var keys = [];
	var promises = [];
	for(let k in promiseMap) {
		if(!promiseMap.hasOwnProperty(k)) {
			continue;
		}

		keys.push(k);
		promises.push(promiseMap[k]);
	}

	return Promise.all(promises).then(function(results) {
		var returnMap = {};
		keys.forEach((key, i) => {
			returnMap[key] = results[i];
		})

		return returnMap;
	});
}

export {map};
