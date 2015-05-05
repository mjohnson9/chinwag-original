var emojione = require('emojione');

emojione.imagePathSVG = 'emoji/';
emojione.imageType = "svg";
emojione.sprites = false;

emojione.cacheBustParam = ""; // Not needed because we load straight from the filesystem

emojione.ascii = true;

module.exports = emojione;
