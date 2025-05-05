# **xwterm** - Communication drivers

[Project Home](https://github.com/giusguerrini/xwterm)

## Table of Contents
- [Introduction](#introduction)
- [HTTP](#http)
- [WebSocket](#websocket)
- [Dummy protocol](#dummy-protocol)
- [Custom protocol](#custom-protocol)

<h2 id="Introduction">Introduction</h2>

The terminal can use these kinds of channels to communicate with the server
(*NOTE: Here we use the term "server" in an extensive sense, to indicate any form of data source and destination that is suitable to be managed by a terminal.*)

- HTTP
- WebSocket
- Dummy
- Custom protocol

The communication layer is represented by a (sort of) abstract class which provides the common interface.
Real protocol drivers extend the base class to implement the specific operations. 

<h2 id="http">HTTP</h2>

This is the default.
The terminal obtains the stream of characters by periodically sending HTTP GET
requests, and sends terminal events (e.g., key events) to the host by sending HTTP POST
requests. Also, the terminal needs to communicate its initial size to the host through
an additional parameter in GET request. By default, the terminal generates these
requests:

- `/?size=`*lines*x*columns*: configure the screen size (e.g., `/?size=40x120`).
- `/?console`: requests pending character to display.
- `/`: the POST request containing the stream of terminal events (mainly keys).

These defaults can be changed by specifying these parameters:

- `httpSize`: specifies the request by which the terminal sends the screen size. The strings
`?lines?` and `?columns?` are used as placeholders for the actual number of
lines and columns. The default is `/?size=?lines?x?columns?`.
- `httpSource`: The request to get the stream of pending characters. Default is `/?console`.
- `httpDest`: The POST request to send terminal events. Default is `/`.

<h2 id="websocket">WebSocket</h2>

The terminal receives characters and sends events through a WebSocket connection. Data are encoded
as JSON objects. By default these JSON tags are used:

- `text` for both incoming and outgoing characters,
- `size` for screen size settings.

Default settings can be changed by specifying these parameters:

- `wsEndpoint`: the server endpoint in the form *host:port*,
- `wsDataTag`: the JSON field for characters in both directions,
- `wsSizeTag`: the JSON field containing the screen size,
- `wsSizeData`: the format of scren sie string, as in `config` HTTP parameter described above.

<h2 id="dummy-protocol">Dummy protocol</h2>

This is a pseudo-protocol that just sends back to the terminal the data it receives.

<h2 id="custom-protocol">Custom protocol</h2>

The programmer has the ability to write its own communication driver for xwterm. Here are the
required steps:

- Write a JavaScript class containing the code that implements the protocol. The class must
extend `AnsiTermDriver` (it is the "dummy" protocol described above).
- Instantiate an object of the class.
- Assign the object to AnsiTerm's configuration parameter `driver`.

If the parameter `driver` is not null, the terminal ignores `channelType` and all
protocol-specific parameters (but you can set `channelType` to "custom" for clarity).


Example (minimal):

```html
	<script type="module">
```

```javascript
	import "./xwterm.js";

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
```
	
```html
	</script>
```

A simple but more interesting example is in `example/jsconsole.html`.
Also, you can study `xwterm.js` itself, where HTTP and WebSocket driver are defined (`AnsiTermHttpDriver`
and `AnsiTermWeSocketDriver` respectively).

