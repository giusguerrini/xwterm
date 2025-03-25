# xwterm
**Simple web Xterm and ANSI terminal emulator - pure JavaScript, no dependencies**   

## Table of Contents
- [Introduction](#introduction)
- [Setup](#setup)
- [Usage](#usage)
- [Sample server](#sample-server)
- [Full documentation](#full-documentation)
- [Live example](#live-example)
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
**It is recommended to use release versions, unless your goal is to contribute to this project,
as the latest commit may contain experimental or incomplete code.**

## Usage
The following HTML code shows a minimal example of use. It generates a page containing
only a terminal with default properties:

	<html lang="en">
	  <head>
	    <meta charset="UTF-8">
	    <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  </head>
	  <body>
	  </body>
	  <script type="module">
	    import { AnsiTerm } from "./xwterm.js";
	    var ansi = new AnsiTerm();
	  </script>
	</html>

The only thing the programmer has to do is to create an instance of the `AnsiTerm` class.
By default, AnsiTerm's constructor connects its main "div" container to the document body,
but you can put a terminal inside a container of your choice by specifying its ID:

	...
	<div id="myterminal"></div>
	...
	    var ansi = new AnsiTerm("myterminal");

The constructor also accepts some configuration parameters, which you can pass as an
array of key/value pairs. The most important keys are:

- `nLines` : number of text lines (default 25)
- `nColumns` : number of characters in a line (default 80)
- `containerId` : the ID of the container where you want the terminal to be placed (default "", which
means that the constructor will use the document's body)
- `channelType` : the type of channel by which the terminal gets the sream of characters
to display and sends events. "http" (alias "rest", default), "websocket", "dummy" or "custom"
are recognized (see below for details).

Example:

	    var ansi = new AnsiTerm( { nLines: 40, nColumns: 120, containerId: "myterminal" } );


The terminal can use these kinds of channels to communicate with the server
(*NOTE: Here we use the term "server" in an extensive sense, to indicate any form of data source and destination that is suitable to be managed by a terminal.*)

- HTTP
- WebSocket
- Dummy
- Custom protocol

### HTTP
This is the default.
The terminal obtains the stream of characters by periodically sending HTTP GET
requests, and sends terminal events (e.g., key events) to the host by sending HTTP POST
requests. Also, the terminal needs to communicate its initial size to the host through
an additional parameter in GET request. By default, the terminal generates these
requests:

- "/?size=*lines*x*columns*": configure the screen size (e.g., "/?size=40x120").
- "/?console": requests pending character to display.
- "/": the POST request containing the stream of terminal events (mainly keys).

These defaults can be changed by specifying these parameters:

- `httpSize`: specifies the request by which the terminal sends the screen size. The strings
"?lines?" and "?columns?" here are used as placeholders for the actual number of
lines and columns. The default is "/?size=?lines?x?columns?".
- `httpSource`: The request to get the stream of pending characters. Default is "/?console".
- `httpDest`: The POST request to send terminal events. Default is "/".

### WebSocket
The terminal receives characters and sends events through a WebSocket connection. Data are encoded
as JSON objects. By default these JSON tags are used:

- `text` for both incoming and outgoing characters,
- `size` for screen size settings.

Default settings can be changed by specifying these parameters:

- `wsEndpoint`: the server endpoint in the form *host:port*,
- `wsDataTag`: the JSON field for characters in both directions,
- `wsSizeTag`: the JSON field containing the screen size,
- `wsSizeData`: the format of scren sie string, as in `config` HTTP parameter described above.

### Dummy protocol
This is a pseudo-protocol that just sends back to the terminal the data it receives.

### Custom protocol
The programmer has the ability to write its own communication driver for xwterm. Here are the
required steps:

- Write a JavaScript class containing the code that implements the protocol. The class must
extend `AnsiTermDriver` (it is the "dummy" protocol described above).
- Instantiate an object of the class.
- Assign the object to AnsiTerm's configuration parameter `driver`.

If the parameter `driver` is not null, the terminal ignores `channelType` and all
protocol-specific parameters (but you can set `channelType` to "custom" for clarity).


Example (minimal):

	<script type="module">

	import { AnsiTerm, AnsiTermDriver } from "./xwterm.js";

	class CustomDriver extends AnsiTermDriver 
	{
		constructor(params)
		{
			super(params);
		}

		start()
		{ 
			super.start();
			this._set_connection_state(true); // Signal "connected" to the terminal
			this._new_data("Hello!\r\n"); // Send data to the terminal
		}

		_tx(text)
		{
			console.log("From xwterm: " + text);
		}
	}
	
	var ansi = new AnsiTerm( { nLines: 40, nColumns: 120, driver: new CustomDriver() } );
	
	</script>

A simple but more interesting example is in `example/jsconsole.html`.
Also, you can study `xwterm.js` itself, where HTTP and WebSocket driver are defined (`AnsiTermHttpDriver`
and `AnsiTermWeSocketDriver` respectively).

## Sample server
For testing purposes, you can find a minimal terminal server written in Python3 in the
`example` folder.

**Do not use the example as if it were a real terminal server**; it
is meant only to familiarize yourself with the AnsiTerm class and ease its development.

The server implements both HTTP and WebSocket services on TCP port 8000 and 8001
respectively. By default, the server accepts local connections only, but ports and listen
addresses can be changed by command line options. In particular:

- **--bind** *IP address* : Set the IP address mask by which the services are exposed. Default is `127.0.0.1`.
- **--http** *TCP port* : Set the TCP port used by HTTP service. Default is `8000`.
- **--ws** *TCP port* : Set the TCP port used by WebSocket service. Default is `8001`.
- **--no-http** : Disable the HTTP service.
- **--no-websocket** : Disable the WebSocket service.
- **--fix-aiohttp** : a workaround to prevent a bug in `aiohttp` (see below).

To start the server go to the `example` folder and launch `./miniserver.py` (on Linux),
or `python miniserver.py` (on Windows 10). The HTTP service URL is `http://127.0.0.1:8000`,
the WebSocket endpoint is `ws://127.0.0.1:8001`.

The server has been tested on Linux and Windows 10 only. On Linux, a virtual terminal
(pty) and a shell (`bash`) are created for each session. On Windows 10, the ConPTY subsystem is used
to host a command interpreter (`cmd.exe`) for each session.
Here are the server dependencies:

- Python >= 3.12
- aiohttp (`pip install aiohttp`)
- websockets (`pip install websockets`)

Since the server has been written for testing and debugging purposes, security and resource
control have been neglected. Also, there are some known bugs:

- aiohttp has a known issue, described here: [aiohttp-issue-6978](https://github.com/aio-libs/aiohttp/issues/6978).
In this application, it causes an excepion after the very first WebSocket connection.
I am experiencing this issue in aiohttp 3.9.1 (the one available by default in my Linux Mint)
but not (yet) in 3.11.13 (tested on Windows 10 only). As far as I know, the issue has never been
solved officially. At least, I couldn't find any citation in aiohttp's changelog.
This problem happens only if both HTTP and WebSocket services are active.
If you are experiencing this issue, you can add the option **--fix-aiohttp** as a workaround.
Whit this option, the WebSocket server is managed by a separate process running in background
and in quiet mode (i.e., messages suppressed, including the initial port/bind address report).
- On Windows 10, after the first session has been established, the program becomes
insensitive to CTRL-C, and must be killed by Task Manager. This problem is probably related
to the ConPTY subsystem, maybe some cleanup/detach code is required after child process has been lauched.

## Full documentation
A (still incomplete) documentation of the package, mainly classes and their methods, is here:
[API Documentation](https://giusguerrini.github.io/xwterm/index.html)

## Live example
You can test a working example of xwterm here:
[Simple JavaScript Console](https://giusguerrini.github.io/xwterm/jsconsole.html), where an instance of AnsiTerm hosts a basic JavaScript console.

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

As the project grows, some details in the public interface (e.g., parameter names) may change.
This may happen at least until the first "non-beta" release (v1.0.0) is published.

Development and test have been done mainly on recent versions of Chrome and Firefox.
Safari has been tested very superficially. No other browsers have been tested at this time.

About Safari, there is at least a known problem: iOS soft keyboard doesn't appear if
the page doesn't contain an input field. AnsiTerm's canvas is not considered an input field
by Safari, that's why I had to add a simple hand-made soft keyboard. This problem
sometimes appears on Android devices too.

Internationalization, and encoding in general, is also an issue I neglected. My daily
environment is Western Europe (Italy), where "latin1" or "Windows-1252" are sufficient.
More sophisticated encodings are expected to be problematic.

## TODO
Many things to do:
- Clean up code and add comments.
- Add better support for server-side sessions (e.g., cookies, access tokens...)
- Add support for hyperlinks and hyperlink sequences (e.g, `\e]8;;http://example.com\e\\This is a link\e]8;;\e`)
- Add custom CSS properties to configure the terminal. Currently, the configuration comes
  from a set of parameters passed to the constructor.
- Add a configuration item to choose the terminal mode (e.g., "pure ANSI", "xterm", "xterm-256"...).
- Improve the soft keyboard. The current implementation reflects my particular need: Italian 
  keyboards don't have "Tilde" nor "Backquote" keys...
- Add management of alternate character set (see "G0/G1" character set selection sequences).
- Add a history buffer (and a scroll bar, of course).
- Implement resizing and responsiveness. This means the terminal should maintain logical lines as generated by the server
  (i.e., the sequences of characters ending with a line feed), because when the number of columns changes, it is expected
  that logical lines are preserved instead of being truncated to the previous visual line length.

## Enjoy!

