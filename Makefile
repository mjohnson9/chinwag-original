NAME = chinwag
ENTRYPOINTS = background.js roster.jsx chat.jsx

DEST_DIR=build

BROWSERIFY=./node_modules/.bin/browserify

.PHONY: clean

entrypoint_bundles=$(ENTRYPOINTS:%.js=%.bundle.js)

all: clean $(entrypoint_bundles)

clean:
	rm -rf $(DEST_DIR)

$(DEST_DIR):
	mkdir -p $@

%.bundle.js: %.jsx
	$(BROWSERIFY) -t [ reactify --extension jsx ] $? > $@

%.bundle.js: %.js
	$(BROWSERIFY) -t [ reactify --extension jsx ] $? > $@
