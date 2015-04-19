NAME = chinwag
ENTRYPOINTS = background.js roster.jsx chat.jsx

SRC_DIR=src
DEST_DIR=build

BROWSERIFY=./node_modules/.bin/browserify

.PHONY: all clean

entrypoint_bundles=$(ENTRYPOINTS:%.js=build/scripts/%.bundle.js)

all: clean $(DEST_DIR)/manifest.json $(entrypoint_bundles)

clean:
	rm -rf $(DEST_DIR)

$(DEST_DIR) $(DEST_DIR)/scripts:
	mkdir $(subst /,\,$@)

$(DEST_DIR)/scripts/%.bundle.js: $(SRC_DIR)/scripts/%.js $(DEST_DIR) $(DEST_DIR)/scripts
	$(BROWSERIFY) -t [ reactify --extension jsx ] $< > $@

$(DEST_DIR)/scripts/%.bundle.js: $(SRC_DIR)/scripts/%.jsx $(DEST_DIR) $(DEST_DIR)/scripts
	$(BROWSERIFY) -t [ reactify --extension jsx ] $< > $@

$(DEST_DIR)/manifest.json: $(SRC_DIR)/manifest.json
	cp $< $@
