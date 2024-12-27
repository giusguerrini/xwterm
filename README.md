# xwterm
**Simple web Xterm and ANSI terminal emulator - pure JavaScrpt, no dependencies**   

## Introduction
The goal of this project is to provide a simple, pure javascript terminal emulator frontend
(i.e., the client side). Connecting to a terminal service is a user's job.
For testing purtposes, a very basic terminal server is available here.
This project is still a work-in-progress.

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
- nColumns : number o characters in a line (default 80)
- divId : the ID of the div where you want the terminal to be placed (default "", which
means that the constructor will create a div by itself)

Example:

	    var ansi = new AnsiTerm( { nLines: 40, nColumns: 120 } );

For testing purposes, you can find a minimal terminal server written in Python in the
"example" folder. It works on Linux only, since it needs "pty" support. To try it, just
go to the "example" folder and launch "./example.py", then open your browser at the URL
http://127.0.0.1:8000 . **Do not use the example as if it were a real terminal server**; it
is meant only to familiarize with the AnsiTerm class and ease its development.

## TODO
Many things to do:
- Clean up code and add comments.
- Add WebSockets: at the moment, the only available channel to the backend is HTTP GET/POST.
- Add custom CSS properties to configure the terminal. Currently, the configuration comes
  from a set of parameters passed to the constructor.
- Add a configuration item to choose the terminal mode (e.g., "pure ANSI", "xterm", "xterm-256"...).
- Improve the soft keyboard. The current implementation reflects my particular need: Italian 
  keyboards don't have "Tilde" nor "Backquote" keys...
- Improve clipboard management. "Copy" only selects a range marked by the mouse, "Paste" does 
  not work. Also, "Copy as rich text" and rectangular selection would be useful.
- Add management of alternate chracter set (see "G0/G1" character set selection sequences).
- Add history buffer (and scroll bar, of course).

