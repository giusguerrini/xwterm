# Changelog
## [0.21.1] - 2025-05-09
- Fixed a bug in selection capture: characters were not captured when
selecting backward.
- Added methods to register and cancel callbacks for "copy" events.
- Modified AnsiTermDriver interface to clarify which parts are expected
to be redefined in derivative classes.
- Improved examples and documentation (thanks to @emanuelcosta94).

## [0.21.0] - 2025-05-09
- Added methods to register and cancel callbacks for "copy" events.
- Modified AnsiTermDriver interface to clarify which parts are expected
to be redefined in derivative classes.
- Improved examples and documentation (thanks to @emanuelcosta94).

## [0.20.3] - 2025-04-29
- No changes in xwterm.js
Some workarounds in **miniserver.py** to run on an embedded Linux system.
See **90-sample-server.md** for detail.

## [0.20.0] - 2025-04-27
- Fixed a bug in line wrap management.
- Improved usage examples.

## [0.19.0] - 2025-04-21
- miniserver.py fully working with both "conhost" API (default, faster)
and "ConPTY" API (slower, but recommended by Microsoft).

## [0.18.0] - 2025-04-15
- Added a parameter to select the type of scrollbar.
- Modified examples accordingly.

## [0.17.3] - 2025-04-14
- Fixed a bug in history management (wrong index).
- Simplified import of AnsiTerm class.

## [0.17.2] - 2025-04-14
- Added history and scrollbar.
- Added optional custom scrollbar (as separate file).
- Improved miniserver.py for Windows.

## [0.16.0] - 2025-04-04
- Fixed processing of title in Windows, where the string may contain a \x00
- Code refactoring: the optional default decorations are now implemented
  in a separate class; the terminal's core is much simpler now.
- Added an experimental support of history (still incomplete). A custom
  scrollbar has been used (scr/scrollbar.js), so at the moment the feature is
  available only in the minified version of the terminal. Sorry.

## [0.15.0] - 2025-04-02
- Fixed handling of reverse and underline properties, they were conflicting with
  cursor blink (TODO: this probably would apply to bold and italic too).
- Miniserver.py: completed the support of ConPTY on Windows 10 (quite slow).
- Completed RGB color handling (CSI 38;x;r;g;bm and similar sequences).
- Added examples and documentation.
- Added client-side session hints for HTTP connections, so it is possible
  to open different sessions from the same web page.

## [0.14.0] - 2025-03-24
- Fixed cursor position after the last character of a line is inserted. The cursor
  was placed at the beginning of the next line, but for ANSI-XTerm conformance, it
  must stay on the current line and be placed beyond the right margin, hidden.
  This correction makes Midnight Commander for Windows work correctly.
 
## [0.13.0] - 2025-03-21
- Fixed missing "break" in "CSI m" processing, color selection could not work reliably.
- Improved "miniserver.py" and added a welcome/caution message.
- Fixed exit from alternate screen, screen wasn't cleared correctly.

## [0.12.0] - 2025-03-19
- Fixed typos in a function name.
- Restyled the code.
- Added JSdoc comments and automated documntation build.

## [0.11.0] - 2025-03-18
- miniserver.py + ConPTY working (still missing Resize service, TODO)
- Fixed typos in comments and documentation.
- Removed dead code.

## [0.10.0] - 2025-03-16
- Added WebSocket support, and parameters to configure it.
- Added the parameter "channelType" to select the type of
communication ("http", "websocket", "dummy", "custom").
- Test server is now "miniserver.py", that tmplements
 WebSockets (still esperimental) and a simple session management
 (based on cookies).
- The communication part has been abstracted in a separate class,
 the programmer can use that interface to write a specialized
 backend. Custom driver can be passed in "driver" parameter.
- Added examples for WebSocket and custom driver.
- removed "divId" parameter. The terminal always generates its
main div container (unless an external "canvasId" is defined).
The user can choose the container where the terminal must take
place by specifying the new parameter "containerId".

## [0.9.0] - 2025-03-06
- Fixed bound checks in redraw
- Added "selet all" button in status bar
- Added public methods to
  - write text (and ANSI sequences) to terminal
  - send keyboard events to the remote
  - invoke the functions bound to status bar's buttons:
    copy as text/Rich Text/HTML/ANSI to clipboard,
    select all, paste clipboard, toggle freeze state.
- New exaples.
  
## [0.8.0] - 2025-03-05
- Added parameters to enable or disable
  - title bar
  - status bar
  - soft keyboard and optionally function keys.
- Added public methods to register callbacks on
  - title change
  - connection state change
  - freeze state change
- Added a static method to read xwterm's version.
  These new services make it possible to create
  custom decorations on the main canvas. A simple
  example is given in example.html.
- Fixed index overflow during selection. 

## [0.7.0] - 2025-03-01
- Added menu for advanced clipboard copy.

## [0.6.0] - 2025-02-26
- Fixed index overflow during selection.
- Fixed typos in documentation.

## [0.5.0] - 2025-02-25
- Added button to freeze screen state and text field to show current freeze state.
- Freeze also occours during slection.
- Fixed index overflow during selection.

## [0.4.0] - 2025-02-23
- Completed support for partial scroll sequences.
- Code cleanup.
- Added copy/paste.
- Fixed minor bugs.

## [0.3.0] - 2025-01-09
- Code cleanup.
- Fixed character size calculation. The result is now rounded, which resolves a display issue on Firefox.

## [0.2.0] - 2025-01-04
- Fixed numeric keypad handling.
- Code cleanup.
- Added changelog.

## [0.1.0] - 2025-01-02
- Initial release of xwterm.
- Added basic terminal emulation features.
- Implemented HTTP GET/POST communication for terminal events.
- Added minimal Python terminal server for testing purposes.
- Basic support for Chrome and Firefox browsers.
- Added screenshots for Bash, Midnight Commander, htop, and vim.
