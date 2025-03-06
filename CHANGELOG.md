# Changelog
## [0.9.0] - 2025-03-06
- Fixed bound checks in redraw
- Added "selet all" button in status bar
- Added public methods to
 - write text (and ANSI sequences) to terminal
 - send keyboard events to the remote
 - invoke the functions bound to status bar's buttons:
 copy as text/Rich Text/HTML/ANSI to clipboard,
 select all, paste clipboard, toggle freeze state.
  
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
