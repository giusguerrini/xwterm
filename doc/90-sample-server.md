**xwterm** - Advanced topic: the sample server  
**A basic HTTP and WebSocket server written in Python**

## Table of Contents
- [Introduction](#introduction)
- [Description and Usage](#description-and-usage)
- [Requirements and Dependencies](#requirements-and-dependencies)
- [An experiment on an embedded Linux system](#experiment-on-embedded-linux)
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

The program also accepts these parameters to adjust some internal details:

- **--aiohttp-workaround**: A workaround to prevent a bug in `aiohttp`. See [Known Limitations and Issues](#known-limitations-and-issues) for details.
- **--use-conpty**: (Windows only) Use *ConPTY* API to create virtual terminals. See [Internals](#internals) for details.
- **--use-conhost**: (Windows only) Use *conhost.exe* to create virtual terminals. See [Internals](#internals) for details.
- **--initial-size** *colums*x*lines* : Initial size of the virtual screen.

To start the server, go to the `example` folder and launch `./miniserver.py` (on Linux),
or `python miniserver.py` (on Windows 10). The HTTP service URL is `http://127.0.0.1:8000`,
and the WebSocket endpoint is `ws://127.0.0.1:8001`.

<h2 id="requirements-and-dependencies">Requirements and Dependencies</h2>

The server has been tested on Linux and Windows 10 only. On Linux, a virtual terminal
(pty) and a shell (`bash`) are created for each session. On Windows 10, the ConPTY subsystem is used
to host a command interpreter (`cmd.exe`) for each session.
The version of Python I tipically use to launch the server is 3.12 or newer. While I don't believe this is
a strict requirement, but I haven't had the opportunity to test the program on older systems. A notable exception
is outlined in the next paragraph.
The program requires at least one of the following packages:

For HTTP service:
- aiohttp (`pip install aiohttp` or, for Ubuntu and its derivatives, `apt install python3-aiohttp`)

For WebSocket service:
- websockets (`pip install websockets` or, for Ubuntu and its derivatives, `apt install python3-websockets`)

If one of these packages is unavailable, the corresponding service will be disabled.
However, the program can still function with the remaining service. 


<h2 id="experiment-on-embedded-linux">An experiment on an embedded Linux system</h2>


I recently needed to run **miniserver.py** on a minimal and rather old Linux installation.
The system was a customized version of a Debian 11 ("Bullseye"), hosting a basic installation of Python 3.6
without any addons. To save space, package managers "pip", "apt", and even "deb" had been removed.
Despite this, I succesfully got the program to work by downloading the required packages from Python's
main repository end extracing them into the **example/modules** directory. I modified **miniserver.py**
so it tries to import the dependencies from the default path first, and falls back to **modules**
subdirectory in case of failure. I also implemented some simple workarounds to address the compatibility
issues caused by the outdated package versions.

The archive **example/python-3_6-addons.tgz** contains the entire **modules** subfolder. I created it
with the hope that it might assist anyone who finds themselves similar situation. It also contains
the additional subfolder **mod-zip** in which the original package archives are stored.
Please note that, while **websockets** package is compact and self-contained, **aiohttp** depends on
several additional modules. If you need to keep your disk image small, I recommend enabling WebSocket
protocol only, and removing **aiohttp** along with its dependencies.


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
This design ensures that the server can operate on Windows while maintaining similar functionality to its Linux counterpart.

### Linux-Specific Implementation Details
On Linux, the traditional **pty** API is used. It interoperates seamlessly with **asyncio** module.

### Windows-Specific Implementation Details
On Windows, the official API for creating virtual terminals is **ConPTY**. However, as we will see, its usage is challenging and has induced me to look for alternatives (*NOTE* virtual terminal support for Windows in Python does exist, but it doesn't tntegrate well with **asyncio**). Surprisingly, there is an official package maintained and distributed by Microsoft, in which virtual terminals are generated through a different API. It's the OpenSSH port on Windows ([here](https://github.com/PowerShell/openssh-portable)). When it needs a virtual terminal, it launches the program **conhost.exe**, with *sdtdin* and *stdout* redirected to pipes. It also includes some command-line options to specify the program to run in the terminal, the size of the virtual screen, and a *pipe HANDLE* through which the controlling process can send resize requests. More surprisingly, in some support forums (sponsored by Microsoft), they state that 'OpenSSH should stop using conhost'. However, OpenSSH relies on conhost for a reason: it enables the creation of pipes in OVERLAPPED mode, which **ConPTY** does not support.
Anyway, **miniserver.py** supports both **conhost** (the default) and **ConPTY** (safer, but slower). The command line options **--use-conpty** and **--use-conhost** allow the user to select which API to use.

#### ConPTY
The integration with the **ConPTY** subsystem requires some considerations. The program uses the **ctypes** module to interact with low-level Windows APIs, such as `kernel32.dll`, to create and manage virtual terminals. This approach introduces some complexity and platform-specific code. Key points include:

- **Thread Management**: Two threads are created per session to handle data transfer between the virtual terminal and `asyncio.Queue` objects. These threads simulate asynchronous streams to maintain compatibility with the `asyncio` framework.
- **ConPTY Limitations**: The lack of support for `OVERLAPPED` operations in ConPTY necessitates this workaround. This limitation complicates the implementation but ensures functional compatibility with the `asyncio` event loop.
- **Error Handling**: Special care is taken to handle edge cases and errors specific to the Windows environment, such as process cleanup and resource management.

This approach works, but it's slow. Specifically, some programs (e.g. [Midnight Commander](https://github.com/adamyg/mcwin32)) frequently redraw the entire screen, which takes about two seconds to complete.

#### Conhost

Since **conhost** allows OVERLAPPED pipes, its integration with **asyncio** is easier: we can use **asyncio.create_subprocess_exec** to launch it. There is still a problem with resize: **asyncio.create_subprocess_exec** seems unable to share additional handles, so resize commands can't be sent. The problem is that **asyncio.create_subprocess_exec** seems to do its best to make the inheritance of additional handles impossible.
The only solution I've found is to create a named pipe and a helper process that receives the name of the pipe as a command-line argument,
opens it, and then launches conhost.exe using **subprocess.Popen**, which allows arbitrary handle inheritance. The helper process is a new instance of **miniserver.py** itself with the "secret" argument **--conhost-helper**. In this way, at the cost of an additional process,
the transfer of data to and from the terminal is reasonably fast.

<h2 id="known-limitations-and-issues">Known Limitations and Issues</h2>

By design, the server is a single thread running a number of *async* tasks (Note: this is not completely true on Windows if ConPTY
is used. In that case a couple of threads per session are created, but they are just ancillary threads whose usage I would
have avoided if I could. They don't perform real CPU load partitioning).  
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
- On Windows, after the first session has been established, the program may become
insensitive to CTRL-C and must be killed via Task Manager or by closing its terminal. This problem is probably related
to the ConPTY subsystem; maybe some cleanup/detach code is required after the child process has been launched.
