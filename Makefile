NAME=chinwag

ARCHIVE=$(NAME).zip

BROWSERIFY=./node_modules/.bin/browserify
BROWSERIFY_FLAGS=--debug --extension .jsx -t [ reactify --extension jsx ] -g uglifyify

LESSC=./node_modules/.bin/lessc
LESSC_FLAGS=--clean-css="--s0 --compatibility='*'"

SRC_DIR=src
DEST_DIR=build

PAGES=$(shell find $(SRC_DIR) -maxdepth 1 -type f -iname '*.html')

ENTRYPOINTS=$(shell find $(SRC_DIR)/scripts -maxdepth 1 -type f -iname '*.js' -or -iname '*.jsx')
LIBS=$(shell find $(SRC_DIR)/scripts/lib -type f -iname '*.js' -or -iname '*.jsx')

STYLES=$(SRC_DIR)/styles/chat.less $(SRC_DIR)/styles/roster.less
STYLES_LIBS=$(SRC_DIR)/styles/common.less $(SRC_DIR)/styles/material-typography.less


.PHONY: all clean

entrypoint_bundles_part1=$(ENTRYPOINTS:%.js=%.bundle.js)
entrypoint_bundles_part2=$(entrypoint_bundles_part1:%.jsx=%.bundle.js)
entrypoint_bundles=$(subst $(SRC_DIR)/scripts,$(DEST_DIR)/scripts,$(entrypoint_bundles_part2))

pages_resolved=$(subst $(SRC_DIR),$(DEST_DIR),$(PAGES))

styles_part1=$(STYLES:%.less=%.css)
styles_resolved=$(subst $(SRC_DIR),$(DEST_DIR),$(styles_part1))


all: $(DEST_DIR)/manifest.json $(DEST_DIR)/fonts $(DEST_DIR)/icons $(DEST_DIR)/_locales $(entrypoint_bundles) $(pages_resolved) $(styles_resolved)

clean:
	rm -rf $(DEST_DIR)
	rm -f $(ARCHIVE)


$(DEST_DIR):
	mkdir -p $@
	touch $@ # We have to touch folders so that Make doesn't keep trying to create them because of timestamp mismatches

$(DEST_DIR)/scripts $(DEST_DIR)/styles: $(DEST_DIR)
	mkdir -p $@
	touch $@ # We have to touch folders so that Make doesn't keep trying to create them because of timestamp mismatches

$(DEST_DIR)/fonts: $(SRC_DIR)/fonts $(DEST_DIR)
	cp -ra $</. $@
	touch $@ # We have to touch folders so that Make doesn't keep trying to create them because of timestamp mismatches

$(DEST_DIR)/icons: $(SRC_DIR)/icons $(DEST_DIR)
	cp -ra $</. $@
	touch $@ # We have to touch folders so that Make doesn't keep trying to create them because of timestamp mismatches

$(DEST_DIR)/_locales: $(SRC_DIR)/_locales $(DEST_DIR)
	cp -ra $</. $@
	touch $@ # We have to touch folders so that Make doesn't keep trying to create them because of timestamp mismatches


$(DEST_DIR)/scripts/%.bundle.js: $(SRC_DIR)/scripts/%.js $(LIBS) $(DEST_DIR)/scripts
	$(BROWSERIFY) $(BROWSERIFY_FLAGS) -o $@ $<

$(DEST_DIR)/scripts/%.bundle.js: $(SRC_DIR)/scripts/%.jsx $(LIBS) $(DEST_DIR)/scripts
	$(BROWSERIFY) $(BROWSERIFY_FLAGS) -o $@ $<


$(DEST_DIR)/styles/%.css: $(SRC_DIR)/styles/%.less $(STYLES_LIBS) $(DEST_DIR)/styles
	$(LESSC) $(LESSC_FLAGS) $< $@


$(DEST_DIR)/manifest.json: $(SRC_DIR)/manifest.json $(DEST_DIR)
	cp $< $@

$(DEST_DIR)/%.html: $(SRC_DIR)/%.html $(DEST_DIR)
	cp $< $@

$(ARCHIVE): all
	cd $(DEST_DIR) && zip -r ../$(ARCHIVE) .
