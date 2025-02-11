
dest/scrollbar.js: src/scrollbar.js package.json babel.config.js webpack.config.js dest src/example-scroll.js src/index.js
	npx webpack

src/scrollbar.js: ../src/scrollbar.js src
	copy /y ..\src\scrollbar.js src\scrollbar.js

src/example-scroll.js: example-scroll.js src
	copy /y example-scroll.js src\example-scroll.js

src/index.js: index.js src
	copy /y index.js src\index.js

src:
	mkdir src

dest:
	mkdir dest

package.json:
	npm init -y
	npm install --save-dev @babel/core @babel/cli @babel/preset-env
	npm install --save-dev @babel/plugin-transform-modules-commonjs
	npm install --save-dev webpack webpack-cli
	npm install --save-dev babel-loader
	npm install --save-dev core-js@3 
	
clean:
	-del /f /q package.json
	-del /f /q package-lock.json
	-rmdir /s /q src
	-rmdir /s /q dest
	-rmdir /s /q node_modules
