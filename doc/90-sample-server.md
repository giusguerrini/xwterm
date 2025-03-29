**xwterm** - Advanced topic: the sample server  
**A basic HTTP and WebSocket server written in Python**

## Table of Contents
- [Introduction](#introduction)
- [Description and Usage](#description-and-usage)
- [Requirements and Dependencies](#requirements-and-dependencies)
- [Internals](#internals)
- [Known Limitations and Issues](#known-limitations-and-issues)

<h2 id="introduction">Introduction</h2>

For testing purposes, you can find a minimal terminal server written in Python 3 in the
`example` folder.

**Do not use the example as if it were a real terminal server**; it
is meant only to familiarize you with the AnsiTerm class and ease its development.

<h2 id="description-and-usage">Description and Usage</h2>

The server implements both HTTP and WebSocket services on TCP ports 8000 and 8001,
respectively. By default, the server accepts local connections only, but ports and listening
addresses can be changed using command-line options. In particular:

- **--bind** *IP address*: Set the IP address mask by which the services are exposed. Default is `127.0.0.1`.
- **--http** *TCP port*: Set the TCP port used by the HTTP service. Default is `8000`.
- **--ws** *TCP port*: Set the TCP port used by the WebSocket service. Default is `8001`.
- **--no-http**: Disable the HTTP service.
- **--no-websocket**: Disable the WebSocket service.
- **--aiohttp-workaround**: A workaround to prevent a bug in `aiohttp` (see below).

To start the server, go to the `example` folder and launch `./miniserver.py` (on Linux),
or `python miniserver.py` (on Windows 10). The HTTP service URL is `http://127.0.0.1:8000`,
and the WebSocket endpoint is `ws://127.0.0.1:8001`.

<h2 id="requirements-and-dependencies">Requirements and Dependencies</h2>

The server has been tested on Linux and Windows 10 only. On Linux, a virtual terminal
(pty) and a shell (`bash`) are created for each session. On Windows 10, the ConPTY subsystem is used
to host a command interpreter (`cmd.exe`) for each session.  
Here are the server dependencies:

- Python >= 3.12
- aiohttp (`pip install aiohttp` or, on Ubuntu and its derivatives, `apt install python3-aiohttp`)
- websockets (`pip install websockets` or, on Ubuntu and its derivatives, `apt install python3-websockets`)

<h2 id="internals">Internals</h2>

The program uses **asyncio** to manage three activities in parallel:
- Listening to HTTP and WebSocket TCP ports
- Servicing clients for both incoming and outgoing traffic
- Managing session lifecycles, including timeout control

Sessions are modeled by the class `Session`. Each session owns a pair of **asyncio** streams
that implement async traffic management in both directions. Since a number of async tasks are needed to
manage each session, the class `AsyncJob` has been defined. Its purpose is to keep track of a set of related
tasks and manage their lifecycle as a single unit.

Each session also owns a virtual terminal and a command interpreter (`/bin/bash` or `C:\Windows\System32\cmd.exe`) running in it.
On Linux, the traditional **pty** interoperates seamlessly with **asyncio**, on Windows, a certain effort of integration
is needed. The main problem is that Windows' **ConPTY** subsystem doesn't support `OVERLAPPED` operations, which are
at the basis of Python's **asyncio**. The only solution I found is to create a pair of threads to transfer data from (or to,
respectively) the virtual terminal to (or from) a pair of `asyncio.Queue` objects, and then "embed" this in a pair of
simulated `asyncio.StreamReader/Writer` objects (i.e., a local class that pretends to be an async stream by implementing the minimal
interface).  
Moreover, to access **ConPTY** services, the program invokes many low-level calls to `kernel32.dll` through the **ctypes**
Python module, so it contains a bunch of Windows-specific code.

<h2 id="known-limitations-and-issues">Known Limitations and Issues</h2>

By design, the server is a single thread running a number of *async* tasks (Note: this is not completely true on Windows,
where a couple of threads per session are created, but they are just ancillary threads whose usage I would have avoided if I could.
They don't perform real CPU load partitioning).  
Since the server has been written for testing and debugging purposes, security and resource
control have been neglected. Additionally, there are these known bugs:
- aiohttp has a known issue, described here: [aiohttp-issue-6978](https://github.com/aio-libs/aiohttp/issues/6978).
In this application, it causes an exception after the very first WebSocket connection.
I am experiencing this issue in aiohttp 3.9.1 (the one available by default in my Linux Mint)
but not (yet) in 3.11.13 (tested on Windows 10 only). As far as I know, the issue has never been
officially resolved. At least, I couldn't find any mention of it in aiohttp's changelog.
This problem happens only if both HTTP and WebSocket services are active.
If you are experiencing this issue, you can add the option **--aiohttp-workaround** as a workaround.
With this option, the WebSocket server is managed by a separate process running in the background.
- On Windows 10, after the first session has been established, the program becomes
insensitive to CTRL-C and must be killed via Task Manager. This problem is probably related
to the ConPTY subsystem; maybe some cleanup/detach code is required after the child process has been launched. 