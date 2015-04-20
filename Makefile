NAME=chinwag

ARCHIVE=$(NAME).zip

BROWSERIFY=./node_modules/.bin/browserify
BROWSERIFY_FLAGS=--debug --extension .jsx -t [ reactify --extension jsx ] -g uglifyify

LESSC=./node_modules/.bin/lessc
LESSC_FLAGS=--clean-css="--s0 --compatibility='*'"

MINIMIZE=./node_modules/.bin/minimize
MINIMIZE_FLAGS=


SRC_DIR=src
DEST_DIR=build
BUILD_METADATA_DIR=build-data

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
	rm -rf $(BUILD_METADATA_DIR)
	rm -f $(ARCHIVE)


$(DEST_DIR) $(BUILD_METADATA_DIR):
	mkdir -p $@

$(DEST_DIR)/scripts $(DEST_DIR)/styles: | $(DEST_DIR)
	mkdir -p $@

$(DEST_DIR)/fonts: $(SRC_DIR)/fonts | $(DEST_DIR)
	cp -ra $</. $@

$(DEST_DIR)/icons: $(SRC_DIR)/icons | $(DEST_DIR)
	cp -ra $</. $@

$(DEST_DIR)/_locales: $(SRC_DIR)/_locales | $(DEST_DIR)
	cp -ra $</. $@


$(DEST_DIR)/scripts/%.bundle.js: $(SRC_DIR)/scripts/%.js $(LIBS) | $(DEST_DIR)/scripts
	$(BROWSERIFY) $(BROWSERIFY_FLAGS) -o $@ $<

$(DEST_DIR)/scripts/%.bundle.js: $(SRC_DIR)/scripts/%.jsx $(LIBS) | $(DEST_DIR)/scripts
	$(BROWSERIFY) $(BROWSERIFY_FLAGS) -o $@ $<


$(DEST_DIR)/styles/%.css: $(SRC_DIR)/styles/%.less | $(DEST_DIR)/styles $(BUILD_METADATA_DIR)
	$(LESSC) -M $< $@ > $(BUILD_METADATA_DIR)/$*.less.makedeps
    #sed -e 's/^[^:]*: *//' < $(BUILD_METADATA_DIR)/$*.less.makedeps | tr -s ' ' '\n' | sed -e 's/$$/:/' >> $(BUILD_METADATA_DIR)/$*.less.makedeps # Presently broken: make thinks it's a regular expression that can't be fulfilled
	$(LESSC) $(LESSC_FLAGS) $< $@

-include $(BUILD_METADATA_DIR)/$(styles_resolved:$(DEST_DIR)/styles/%.css=$(BUILD_METADATA_DIR)/%.less.makedeps)


$(DEST_DIR)/manifest.json: $(SRC_DIR)/manifest.json | $(DEST_DIR)
	cat $< > $@

$(DEST_DIR)/%.html: $(SRC_DIR)/%.html | $(DEST_DIR)
	$(MINIMIZE) $(MINIMIZE_FLAGS) --output $@ $<

$(ARCHIVE): all
	cd $(DEST_DIR) && zip -r ../$(ARCHIVE) .
