# **xwterm** - Example 1: Basic usage
**A very simple use case**

## Table of Contents
- [Introduction](#introduction)
- [Default decorations](#default-decorations)
- [Setup](#setup)
- [The code](#the-code)

## Introduction
In this example, **xwterm** generates a terminal with default size, colors, layout and ancillary widgets.
This isa also a chance to describe the functions implemented by **xwterm** package.
The terminal takes takes by default the "traditional" number of rows and colums of "80x25", black backgroung, medium white foreground.
It also uses HTTP as communication channel.

## Default decorations
Here is a decription of ancillary elements that decorate the terminal:

- A title bar is added on top of the terminal.
- A status bar is added at the bottom of the terminal.
- The status bas contains these elements (from left to right):
  - A "freeze" button, by which the user can suspend the processing of incoming characters,
  - A read-only text in which the current freeze state is shown. There may be multiple suspension at the same time, since a suspensiona
may be due to both the "freeze" button and by a clipboard selection. The text shows the suspension count and the number of unprocessed
bytes since the terminal has been frozen.
  - A read only text indicating the current state of the connection with the server.
  - The version numer of **xwterm** pakage.
  - A "Select all" button, by which the user may select the whole terminal content.
  - A "Copy" button to copy the selected content to clipboard as plain text.
  - A "Copy as..." button, which shows a popup menu to access advanced "copy to clipboard" operations: "Copy as text", "Copy as ANSI sequences",
"Copy as HTML" and "Copy as Rich Text".
  - A "Paste" button, by which the clipboard content is sent to the server.

## Setup

For the example to work, the sample server **miniserver.py** contained in the source package is required.
To start the server, go to the `example` folder and launch `./miniserver.py` (on Linux),
or `python miniserver.py` (on Windows 10). The HTTP service URL is `http://127.0.0.1:8000`.
You can rfind a more detailed description of the sample server here:
[Sample server](https://giusguerrini.github.io/xwterm/90-sample-server.html)

## The code
This is the HTML code that implements the example. Let's describe the relevant parts:

**Normal HTML document, header etc...**

	<!DOCTYPE html>
	<html lang="en">
	  <head>
	    <meta charset="UTF-8">
	    <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  </head>
	  <body>
	  </body>

**Here we import the `AnsiTerm` class from `xwterm.js` (or `xwterm.min.js` if you are using the minified version, which is recommended in production).**
**Note that we must import the package as a JS module.**

	  <script type="module">
	    import { AnsiTerm } from "./xwterm.js";

**Create an instance of `AnsiTerm` class and store them in a variable...**

	    var ansi = new AnsiTerm();

**...and that's all! `AnsiTerm`'s constructor will create the terminal with default properties.**

	  </script>
	</html>


