NAME = chinwag
MAINS = background.js roster.jsx chat.jsx

BROWSERIFY=./node_modules/.bin/browserify


# -- Tasks ------------------------------------------------------------

%.js: %.jsx



# -- Build artifacts --------------------------------------------------

build/$(NAME).zip: build/$(NAME).bundle.js build/$(NAME).bundle.min.js
	zip -j $@ $^

build/$(NAME).bundle.js: $(MAIN) $(LIB)
	mkdir -p build
	browserify --full-paths --standalone $(STANDALONE) $(MAIN) > $@

build/$(NAME).bundle.min.js: build/$(NAME).bundle.js
	uglifyjs --screw-ie8 build/$(NAME).bundle.js > $@
