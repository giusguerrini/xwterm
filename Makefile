SRC_DIR = src
DIST_DIR = dist
JS_FILE = xwterm.js
MIN_JS_FILE = xwterm.min.js

$(DIST_DIR)/$(MIN_JS_FILE): $(SRC_DIR)/$(JS_FILE) jsdoc.json README.md docs/*
	@mkdir -p $(DIST_DIR)
	terser $(SRC_DIR)/$(JS_FILE) -o $(DIST_DIR)/$(MIN_JS_FILE)
	npx jsdoc -c jsdoc.json

clean:
	rm -rf $(DIST_DIR)

.PHONY: clean
