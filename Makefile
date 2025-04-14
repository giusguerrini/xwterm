SRC_DIR = src
DIST_DIR = dist
SRCS = $(SRC_DIR)/scrollbar.js $(SRC_DIR)/xwterm.js
MIN_JS_FILE = xwterm.min.js

$(DIST_DIR)/$(MIN_JS_FILE): $(SRCS) jsdoc.json README.md docs/*
	@mkdir -p $(DIST_DIR)
	terser $(SRC_DIR)/scrollbar.js -o $(DIST_DIR)/scrollbar.min.js
	terser $(SRC_DIR)/xwterm.js -o $(DIST_DIR)/xwterm.min.js
	npx jsdoc -c jsdoc.json

clean:
	rm -rf $(DIST_DIR)

.PHONY: clean
