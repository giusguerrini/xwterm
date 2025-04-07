
all:: src dest dest/scrollbar.js

dest/xwterm.js: src/xwterm.js src/scrollbar.js src/index.js package.json babel.config.js webpack.config.js
	npx webpack

src/scrollbar.js: ../src/scrollbar.js
	cp ../src/scrollbar.js src/scrollbar.js

src/xwterm.js: ../src/xwterm.js
	cp ../src/xwterm.js src/xwterm.js

src/index.js: index.js
	cp index.js src/index.js

src:
	mkdir src

dest:
	mkdir dest

package.json:
	npm init -y
	npm install --save-dev @babel/core @babel/cli @babel/preset-env
	npm install --save-dev @babel/plugin-transform-modules-commonjs
	npm install --save-dev babel-plugin-transform-remove-strict-mode
	npm install --save-dev webpack webpack-cli
	npm install --save-dev terser-webpack-plugin
	npm install --save-dev babel-loader
	npm install --save-dev core-js@3 
	npm install --save-dev jsdoc
	
	
clean:
	rm -rf src dest package.json package-lock.json node_modules
