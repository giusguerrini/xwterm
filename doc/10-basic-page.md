# **xwterm** - Example 1: Basic usage

[Project Home](https://github.com/giusguerrini/xwterm)

**A very simple use case**

## Table of Contents
- [Introduction](#introduction)
- [Default decorations](#default-decorations)
- [Setup](#setup)
- [The code](#the-code)

<h2 id="introduction">Introduction</h2>

In this example, **xwterm** generates a terminal with default size, colors, layout, and ancillary widgets.
This is also an opportunity to describe the functions implemented by the **xwterm** package.
By default, the terminal uses the "traditional" dimensions of 80x25 rows and columns, a black background, and medium white foreground text.
It also uses HTTP as the communication channel.

<h2 id="default-decorations">Default decorations</h2>

Here is a description of the ancillary elements that decorate the terminal:

- A title bar is added at the top of the terminal.
- A status bar is added at the bottom of the terminal.
- The status bar contains these elements (from left to right):
	- A "freeze" button, which allows the user to suspend the processing of incoming characters.
	- A read-only text field displaying the current freeze state. There may be multiple suspensions at the same time, as a suspension can be caused by both the "freeze" button and a clipboard selection. The text shows the suspension count and the number of unprocessed bytes since the terminal was frozen.
	- A read-only text field indicating the current state of the connection with the server.
	- The version number of the **xwterm** package.
	- A "Select all" button, which allows the user to select the entire terminal content.
	- A "Copy" button to copy the selected content to the clipboard as plain text.
	- A "Copy as..." button, which displays a popup menu for advanced "copy to clipboard" operations: "Copy as text," "Copy as ANSI sequences," "Copy as HTML," and "Copy as Rich Text."
	- A "Paste" button, which sends the clipboard content to the server.
- At the bottom, an example of soft keyboard that cotains F1-F12 keys and some
more characters.

<h2 id="setup">Setup</h2>

For the example to work, the sample server **miniserver.py** included in the source package is required.
To start the server, navigate to the `example` folder and launch `./miniserver.py` (on Linux),
or `python miniserver.py` (on Windows 10). The HTTP service URL is `http://127.0.0.1:8000`.
You can find a more detailed description of the sample server here:
[Sample server](https://giusguerrini.github.io/xwterm/90-sample-server.html)

<h2 id="the-code">The code</h2>
This is the HTML code that implements the example. Let's describe the relevant parts:

**Normal HTML document, header, etc.:**

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
	</head>
	<body>
	</body>
</html>
```

**Here we import the `AnsiTerm` class from `xwterm.js` (or `xwterm.min.js` if you are using the minified version, which is recommended in production).**
**Note that we must import the package as a JS module.**

```javascript
<script type="module">
	import "./xwterm.js";
```

**Create an instance of the `AnsiTerm` class and store it in a variable...**

```javascript
	var ansi = new AnsiTerm();
```

**...and that's all! The `AnsiTerm` constructor will create the terminal with default properties.**

```javascript
</script>
```
