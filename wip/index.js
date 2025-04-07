
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

import { AnsiTerm, AnsiTermDriver, AnsiTermDriverHttp, AnsiTermDriverWebsocket} from './xwterm.js';


window.AnsiTerm = AnsiTerm;
window.AnsiTermDriver = AnsiTermDriver;
window.AnsiTermDriverHttp = AnsiTermDriverHttp;
window.AnsiTermDriverWebsocket = AnsiTermDriverWebsocket;



