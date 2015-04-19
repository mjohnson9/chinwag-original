NAME=chinwag

BROWSERIFY=./node_modules/.bin/browserify

SRC_DIR=src
DEST_DIR=build

ENTRYPOINTS=$(shell find src/scripts -maxdepth 1 -type f -iname '*.js' -or -iname '*.jsx')
LIBS=$(shell find src/scripts/lib -type f -iname '*.js' -or -iname '*.jsx')


.PHONY: all clean

entrypoint_bundles_part1=$(ENTRYPOINTS:%.js=%.bundle.js)
entrypoint_bundles_part2=$(entrypoint_bundles_part1:%.jsx=%.bundle.js)
entrypoint_bundles=$(subst $(SRC_DIR)/scripts,$(DEST_DIR)/scripts,$(entrypoint_bundles_part2))

all: $(DEST_DIR) $(entrypoint_bundles)

clean:
	rm -rf $(DEST_DIR)

$(DEST_DIR) $(DEST_DIR)/scripts:
	mkdir -p $@

$(DEST_DIR)/scripts/%.bundle.js: $(SRC_DIR)/scripts/%.js $(DEST_DIR) $(DEST_DIR)/scripts $(LIBS)
	$(BROWSERIFY) -t [ reactify --extension jsx ] $< > $@

$(DEST_DIR)/scripts/%.bundle.js: $(SRC_DIR)/scripts/%.jsx $(DEST_DIR) $(DEST_DIR)/scripts $(LIBS)
	$(BROWSERIFY) -t [ reactify --extension jsx ] $< > $@

$(DEST_DIR)/manifest.json: $(SRC_DIR)/manifest.json
	cp $< $@
