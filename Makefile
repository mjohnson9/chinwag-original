NAME=chinwag

BROWSERIFY=./node_modules/.bin/browserify
BROWSERIFY_FLAGS=--extension .jsx -t [ reactify --extension jsx ]

SRC_DIR=src
DEST_DIR=build

PAGES=$(shell find $(SRC_DIR) -maxdepth 1 -type f -iname '*.html')

ENTRYPOINTS=$(shell find $(SRC_DIR)/scripts -maxdepth 1 -type f -iname '*.js' -or -iname '*.jsx')
LIBS=$(shell find $(SRC_DIR)/scripts/lib -type f -iname '*.js' -or -iname '*.jsx')


.PHONY: all clean

entrypoint_bundles_part1=$(ENTRYPOINTS:%.js=%.bundle.js)
entrypoint_bundles_part2=$(entrypoint_bundles_part1:%.jsx=%.bundle.js)
entrypoint_bundles=$(subst $(SRC_DIR)/scripts,$(DEST_DIR)/scripts,$(entrypoint_bundles_part2))


pages_resolved=$(subst $(SRC_DIR),$(DEST_DIR),$(PAGES))


all: $(DEST_DIR)/manifest.json $(entrypoint_bundles) $(pages_resolved)

clean:
	rm -rf $(DEST_DIR)

$(DEST_DIR):
	mkdir -p $@

$(DEST_DIR)/scripts: $(DEST_DIR)
	mkdir -p $@

$(DEST_DIR)/scripts/%.bundle.js: $(SRC_DIR)/scripts/%.js $(LIBS) $(DEST_DIR)/scripts
	$(BROWSERIFY) $(BROWSERIFY_FLAGS) -o $@ $<

$(DEST_DIR)/scripts/%.bundle.js: $(SRC_DIR)/scripts/%.jsx $(LIBS) $(DEST_DIR)/scripts
	$(BROWSERIFY) $(BROWSERIFY_FLAGS) -o $@ $<

$(DEST_DIR)/manifest.json: $(SRC_DIR)/manifest.json $(DEST_DIR)
	cp $< $@

$(DEST_DIR)/%.html: $(SRC_DIR)/%.html $(DEST_DIR)
	cp $< $@
