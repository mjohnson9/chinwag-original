var rollbar = require('./vendor/rollbar.js');

var rollbarConfig = {
    accessToken: '11ad751054b74ad28937674220f82ce2',
    captureUncaught: true,
    payload: {
        environment: process.env.NODE_ENV,

        client: {
        	javascript: {
        		source_map_enabled: true,
        		code_version: process.env.GIT_SHA,
        		guess_uncaught_frames: true
        	}
        }
    }
};

var session = rollbar.init(rollbarConfig);
window.rollbar = session;
