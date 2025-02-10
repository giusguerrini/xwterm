
dest/scrollbar.js: src/scrollbar.js package.json .babelrc dest
	npx babel src --out-dir dest

src/scrollbar.js: ../src/scrollbar.js src
	copy ..\src\scrollbar.js src\scrollbar.js

src:
	mkdir src

dest:
	mkdir dest

package.json:
	npm init -y
	npm install --save-dev @babel/core @babel/cli @babel/preset-env
	npm install --save-dev @babel/plugin-transform-modules-commonjs
	
