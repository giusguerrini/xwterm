# xwterm
**Simple web Xterm and ANSI terminal emulator - pure JavaScript, no dependencies**   

## Table of Contents
- [Introduction](#introduction)
- [Setup](#setup)
- [Usage](#usage)
- [Screenshots](#screenshots)
- [Caveats](#caveats)
- [TODO](#todo)
- [Enjoy](#enjoy)

## Introduction
The goal of this project is to provide a simple, pure javascript terminal emulator frontend
(i.e., the client side). Connecting to a terminal service is a user's responsibility.
For testing purposes, a very basic terminal server is available here.
This project is still under development.

## Setup
The source is a single JavaScript file (**src/xwterm.js**); once downloaded (e.g.,
by cloning the repository), it is ready to use. To produce a minified version,
run **make** from the project's root directory. **[terser](https://terser.org/)** is
required to do this. The minified file is **dist/xwterm.min.js**. You can also download
the minified file directly from the [GitHub releases page](https://github.com/giusguerrini/xwterm/releases).

## Usage
The following HTML code shows a minimal example of use. It generates a page containing
only a terminal with default properties:

	<html>
	  <head>
	    <style type="text/css"> </style>
	  </head>
	  <body>
	  </body>
	  <script type="module">
	    import { AnsiTerm } from "./xwterm.js";
	    var ansi = new AnsiTerm();
	  </script>
	</html>

The only thing the programmer has to do is to create an instance of the "AnsiTerm" class.
By default, AnsiTerm's constructor generates a private "div" container, but you can
put a terminal inside a "div" of your choice by specifying its ID:

	...
	<div id="myterminal"></div>
	...
	    var ansi = new AnsiTerm("myterminal");

The constructor also accepts some configuration parameters, which you can pass as an
array of key/value pairs. The most important keys are:

- nLines : number of text lines (default 25)
- nColumns : number of characters in a line (default 80)
- divId : the ID of the div where you want the terminal to be placed (default "", which
means that the constructor will create a div by itself)

Example:

	    var ansi = new AnsiTerm( { nLines: 40, nColumns: 120 } );

For testing purposes, you can find a minimal terminal server written in Python in the
"example" folder. It works on Linux only, since it needs "pty" support. To try it, just
go to the "example" folder and launch "./example.py", then open your browser at the URL
http://127.0.0.1:8000 . **Do not use the example as if it were a real terminal server**; it
is meant only to familiarize with the AnsiTerm class and ease its development.

The terminal gets the stream of characters to display by periodically sending HTTP GET
requests, and sends terminal events (e.g., key events) to the host by sending HTTP POST
requests. Also, the terminal needs to communicate its initial size to the host through
an additional parameter in GET request. By default, the terminal generates these
requests:

- "/?size=*lines*x*columns*": configure the screen size (e.g., "/?size=40x120").
- "/?console": requests pending character to display.
- "/": the POST request containing the stream of terminal events (mainly keys).

These defaults can be changed by specifying these parameters:

- "config": specifies the request by which the terminal sends the screen size. The strings
"?lines?" and "?columns?" here are used as placeholders for the actual number of
lines and columns. The default is "/?size=?lines?x?columns?".
- "source": The request to get the stream of pending characters. Default is "/?console".
- "dest": The POST request to send terminal events. Default is "/".

## Screenshots
Here are some images taken while running the shell and some applications that require
full support of graphics functions (Midnight Commander, htop, vim):
![Bash prompt](./doc/xwterm-screenshot-bash.png)
![Midnight Commander](./doc/xwterm-screenshot-mc.png)
![Htop](./doc/xwterm-screenshot-htop.png)
![Vim](./doc/xwterm-screenshot-vim.png)

## Caveats
Please remember that this project is in its early stage.
The project was born out of a specific need of mine in a controlled environment; to make it
fully usable, a certain effort of generalization is still required.

Development and test have been done mainly on recent versions of Chrome and Firefox.
Safari has been tested very superficially. No other browsers have been tested at this time.

About Safari, there is at least a known problem: iOS soft keyboard doesn't appear if
the page doesn't contain an input field. AnsiTerm's canvas is not considered an input field
by Safari, that's why I had to add a simple hand-made soft keyboard.

Internationalization, and encoding in general, is also an issue I neglected. My daily
environment is Western Europe (Italy), where "latin1" or "Windows-1252" are sufficient.
More sophisticated encodings are expected to be problematic.

## TODO
Many things to do:
- Clean up code and add comments.
- Add WebSockets: at the moment, the only available channel to the backend is HTTP GET/POST.
- Add better support for server-side sessions (e.g., cookies, access tokens...)
- Add custom CSS properties to configure the terminal. Currently, the configuration comes
  from a set of parameters passed to the constructor.
- Add a configuration item to choose the terminal mode (e.g., "pure ANSI", "xterm", "xterm-256"...).
- Improve the soft keyboard. The current implementation reflects my particular need: Italian 
  keyboards don't have "Tilde" nor "Backquote" keys...
- Improve clipboard management. "Copy" only selects a range marked by the mouse, "Paste" does 
  not work. Also, "Copy as rich text" and rectangular selection would be useful.
- Add management of alternate character set (see "G0/G1" character set selection sequences).
- Add history buffer (and scroll bar, of course).
- Responsiveness.

## Enjoy!

