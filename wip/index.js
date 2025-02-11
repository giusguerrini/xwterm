
/* // Only working with classes exported by "export" >:(
 *
const context = require.context('./', true, /\.js$/);
const exportedClasses = {};

context.keys().forEach(key => {
    const module = context(key);
    const className = key.replace('./', '').replace('.js', '');
    exportedClasses[className] = module.default || module;
});

Object.assign(window, exportedClasses);
*/

import './scrollbar.js'

