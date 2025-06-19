# Changelog
## [0.25.1] - 2025-06-19
- AnsiTerm: Added a "resize" method (experimental), and a method to
register/cancel a callback when the terminal receives one of the ANSI
sequences that change te cursor key mappings (see "multi.html" for an
example of use).
- Fixed an error (typo) in some of the methods that cancel callbacks.
- Added sound (ASCII "BEL", code 0x07) ad a method to turn it on, off,
and configure some characteristics.
- Restored history size default to 1000 (it was left to 20 for testing).

## [0.25.0] - 2025-06-19
- AnsiTerm: Added a "resize" method (experimental), and a method to
register/cancel a callback when the terminal receives one of the ANSI
sequences that change te cursor key mappings (see "multi.html" for an
example of use).
- Fixed an error (typo) in some of the methods that cancel callbacks.
- Added sound (ASCII "BEL", code 0x07) ad a method to turn it on, off,
and configure some characteristics.

## [0.24.1] - 2025-06-09
- miniserver.py: Fixed a wrong path in case of missing modules on
python 3.6 and embedded linux: a hard-coded path was minstakenly published.

## [0.24.0] - 2025-05-29
- miniserver.py: Fixed (hopefully) a long-standing malfunction in some versions
of aiohttp when usng websockets. "--fix-aiohttp" option should not be necessary anymore.
- Improved examples: added a simple soft keyboard in "multi.html" to ease testing
on mobile devices; prevented a possible problem with CR/CRLF in "custom-statusbar.html"
in case of bad GIT configuration.
- AnsiTerm: added the method "sendText" to send characters (including ANSI sequences)
to the backend.

## [0.23.0] - 2025-05-24
- Added the "palette" parameter, which allows the user to choose the base 
palette style (colors from 0 to 15). The parameter can be set to one of
the following values:
  - "default": the default palette is used (similar to Xterm's, but brighter),
  - **null** (or not defined): the default palette is used, but the *background* and 
    *foreground* parameters redefine colors *0* and *7*, respectively,
  - "windows": the palette used by Windows 10 for its consoles,
  - "vscode": the default palette used by Visual Studio Code,
  - "xterm": the traditional palette used by Xterm,
  - an array of 16 colors defined by the user.
- Corrected the clipboard selection when the secondary screen is active.
Now, the selection is applied to the secondary screen, that is, the screen
currently displayed.
- The **multi.html** example has been enhanced with the ability to choose 
the palette and terminal dimensions.
- 
## [0.22.0] - 2025-05-22
- Unified history and screen management.
- Added logical line tracking, in preparation for the addition of resizing.
- Added handling for "\x1B[*n*@" sequence ("insert *n* spaces"), which was
still missing (incredibly!).
- The base palette has been made slightly brighter.

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
