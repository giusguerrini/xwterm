#!/usr/bin/python3
#
# miniserver.py
#
# This program implements a very basic HTTP and WebSocket server.
# It is meant for testing the xwterm package and familiarizing with it.
# It is NOT intended to be used in real applications. In particular,
# its usage as a public, exposed to the internet, terminal server
# is strongly discouraged.
#
# Requirements:
#  python >= 3.12
#  pip (if you miss some packages)
#  aiohttp (pip install aiohttp)
#  websockets (pip install websockets)
#
# Warning! aiohttp has a known issue (https://github.com/aio-libs/aiohttp/issues/6978).
# In this application, it causes an excepion after the very first WebSocket connection.
# I am experiencing this issue in aiohttp 3.9.l (the one available by default in my Linux Mint)
# but not (yet) in 3.11.13 (tested on Windows 10 only).
# As far as I know, the issue has never been solved officially. At least, I couldn't
# find any citation in aiohttp's changelog.
#

VERSION = '1.7'

has_aiohttp = True
has_websockets = True

import os

home_dir = os.path.dirname(os.path.abspath(__file__))
doc_dir = home_dir
upload_dir = os.path.join(doc_dir, 'uploads')
try:
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
except OSError as e:
    print("Cannot create upload directory: ", e, ", upload disabled")
    upload_dir = None
mod_dir = os.path.join(doc_dir, 'modules')

import sys
import platform
import string
import random
import asyncio
import struct
import mimetypes
import time
import json
import threading
import logging
import subprocess
import datetime
try:
    import aiohttp
    import aiohttp.web
except:
    sys.path.append(mod_dir)
    for p in [ 'aiohttp-3.7.4.post0', 'multidict-6.0.4', 'yarl-1.8.1', 'idna-ssl-1.1.0' ]:
        m = os.path.join(mod_dir, p)
        sys.path.append(m)
    try:
        import aiohttp
        import aiohttp.web
    except:
        has_aiohttp = False

try:
    import websockets
except:
    sys.path.append(mod_dir)
    sys.path.append(os.path.join(mod_dir, 'websockets-8.1/src'))
    try:
        import websockets
    except:
        has_websockets = False
try:
    import io
    import msvcrt
    import ctypes
    from ctypes import wintypes, Structure
    from ctypes.wintypes import HANDLE, DWORD, BOOL
except:
    pass
try:
    import fcntl
    import pty
    import termios
    import signal
except:
    pass

# Hacks for oldest Python versions (3.6, in my tests)
if not hasattr(asyncio, 'create_task'):
    asyncio.create_task = asyncio.ensure_future
if not hasattr(asyncio, 'get_running_loop'):
    asyncio.get_running_loop = asyncio.get_event_loop
if not hasattr(asyncio, 'run'):
    def loop(x):
        return asyncio.get_event_loop().run_until_complete(x)
    asyncio.run = loop

if platform.system() == "Linux":
    pass
else:

    #
    # ctypes.wintypes integration...
    #

    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

    #LONG = ctypes.c_long
    HRESULT = wintypes.LONG
    SIZE_T = ctypes.c_size_t

    ReOpenFile = kernel32.ReOpenFile
    ReOpenFile.argtypes = [ctypes.c_void_p, ctypes.c_uint32, ctypes.c_uint32, ctypes.c_uint32]
    ReOpenFile.restype = ctypes.c_void_p

    FILE_READ_CONTROL = 0x00020000
    FILE_WRITE_DATA = 0x0002
    FILE_WRITE_ATTRIBUTES = 0x0100
    FILE_WRITE_EA = 0x0010
    FILE_APPEND_DATA = 0x0004
    FILE_SYNCHRONIZE = 0x00100000 
    FILE_GENERIC_WRITE = FILE_READ_CONTROL | FILE_WRITE_DATA | FILE_WRITE_ATTRIBUTES | FILE_WRITE_EA | FILE_APPEND_DATA | FILE_SYNCHRONIZE

    FILE_READ_DATA = 0x0001
    FILE_READ_ATTRIBUTES = 0x0080
    FILE_READ_EA = 0x0008
    FILE_GENERIC_READ = FILE_READ_CONTROL | FILE_READ_DATA | FILE_READ_ATTRIBUTES | FILE_READ_EA | FILE_SYNCHRONIZE

    FILE_FLAG_OVERLAPPED = 0x40000000

    FILE_ATTRIBUTE_NORMAL = 0x00000080

    GENERIC_READ = 0x80000000
    GENERIC_WRITE = 0x40000000

    OPEN_EXISTING = 3

    PROC_THREAD_ATTRIBUTE_PSEUDOCONSOLE = 0x00020016
    STARTF_USESTDHANDLES = 0x00000100 

    class SECURITY_ATTRIBUTES(Structure):
        _fields_ = [
            ("nLength", DWORD),
            ("lpSecurityDescriptor", wintypes.LPVOID),
            ("bInheritHandle", BOOL),
        ]
    
    CreateFileW = kernel32.CreateFileW
    CreateFileW.argtypes = [
        wintypes.LPWSTR,
        DWORD,
        DWORD,
        ctypes.POINTER(SECURITY_ATTRIBUTES),
        DWORD,
        DWORD,
        wintypes.HANDLE,
    ]

    DuplicateHandle = kernel32.DuplicateHandle;
    DuplicateHandle.argtypes = [
        wintypes.HANDLE,
        wintypes.HANDLE,
        wintypes.HANDLE,
        ctypes.POINTER(wintypes.HANDLE),
        DWORD,
        BOOL,
        DWORD,
    ]
    
    DUPLICATE_CLOSE_SOURCE = 0x0001
    DUPLICATE_SAME_ACCESS = 0x0002


    class STARTUPINFOW(Structure):
        _fields_ = [
            ("cb", wintypes.DWORD),
            ("lpReserved", wintypes.LPWSTR),
            ("lpDesktop", wintypes.LPWSTR),
            ("lpTitle", wintypes.LPWSTR),
            ("dwX", wintypes.DWORD),
            ("dwY", wintypes.DWORD),
            ("dwXSize", wintypes.DWORD),
            ("dwYSize", wintypes.DWORD),
            ("dwXCountChars", wintypes.DWORD),
            ("dwYCountChars", wintypes.DWORD),
            ("dwFillAttribute", wintypes.DWORD),
            ("dwFlags", wintypes.DWORD),
            ("wShowWindow", wintypes.WORD),
            ("cbReserved2", wintypes.WORD),
            ("lpReserved2", wintypes.LPBYTE),
            ("hStdInput", wintypes.HANDLE),
            ("hStdOutput", wintypes.HANDLE),
            ("hStdError", wintypes.HANDLE)
        ]

    class STARTUPINFOWEX(ctypes.Structure):
        _fields_ = [
            ("StartupInfo", STARTUPINFOW),
            ("lpAttributeList", ctypes.c_void_p)
        ]

    class PROCESS_INFORMATION(ctypes.Structure):
        _fields_ = [
            ("hProcess", HANDLE),
            ("hThread", HANDLE),
            ("dwProcessId", DWORD),
            ("dwThreadId", DWORD),
        ]


    CreateProcessW = kernel32.CreateProcessW
    CreateProcessW.argtypes = [
        wintypes.LPWSTR,                 # lpApplicationName
        wintypes.LPWSTR,                 # lpCommandLine
        wintypes.LPVOID,                 # lpProcessAttributes
        wintypes.LPVOID,                 # lpThreadAttributes
        BOOL,                   # bInheritHandles
        DWORD,                  # dwCreationFlags
        wintypes.LPVOID,                 # lpEnvironment
        wintypes.LPWSTR,                 # lpCurrentDirectory
        ctypes.POINTER(STARTUPINFOWEX),  # lpStartupInfo
        ctypes.POINTER(PROCESS_INFORMATION), # lpProcessInformation
    ]
    CreateProcessW.restype = BOOL

    class COORD(ctypes.Structure):
        _fields_ = [("X", wintypes.SHORT), ("Y", wintypes.SHORT)]

    CreatePseudoConsole = kernel32.CreatePseudoConsole
    CreatePseudoConsole.argtypes = [
        COORD,
        wintypes.HANDLE,
        wintypes.HANDLE,
        wintypes.DWORD, 
        ctypes.POINTER(ctypes.c_void_p)
    ]

    CreatePseudoConsole.restype = HRESULT

    PTY_SIGNAL_RESIZE_WINDOW = 8

    class PTY_SIGNAL_RESIZE_MESSAGE(ctypes.Structure):
        _fields_ = [
            ("code", wintypes.SHORT),
            ("x", wintypes.SHORT),
            ("y", wintypes.SHORT),
        ]


    CreatePipe = kernel32.CreatePipe
    CreatePipe.argtypes = [
        ctypes.POINTER(wintypes.HANDLE),
        ctypes.POINTER(wintypes.HANDLE), 
        ctypes.POINTER(SECURITY_ATTRIBUTES),
        wintypes.DWORD,]

    CreateNamedPipeW = kernel32.CreateNamedPipeW
    CreateNamedPipeW.argtypes = [
        wintypes.LPWSTR, # lpName
        DWORD, # dwOpenMode
        DWORD, # dwPipeMode
        DWORD, # nMaxInstances
        DWORD, # nOutBufferSize
        DWORD, # nInBufferSize
        DWORD, # nDefaultTimeOut
        ctypes.POINTER(SECURITY_ATTRIBUTES), # lpSecurityAttributes
    ]


    ConnectNamedPipe = kernel32.ConnectNamedPipe
    ConnectNamedPipe.argtypes = [wintypes.HANDLE, wintypes.LPVOID ]
    ConnectNamedPipe.restype = BOOL

    PIPE_ACCESS_INBOUND = 0x00000001
    PIPE_ACCESS_OUTBOUND = 0x00000002
    PIPE_TYPE_BYTE = 0x00000000
    PIPE_WAIT = 0x00000000

    w32_pipe_count = 0

    WriteFile = kernel32.WriteFile
    WriteFile.argtypes = [wintypes.HANDLE, wintypes.LPVOID, wintypes.DWORD, wintypes.LPVOID, wintypes.LPVOID ]
    WriteFile.restype = BOOL

    SetHandleInformation = kernel32.SetHandleInformation
    SetHandleInformation.argtypes = [wintypes.HANDLE, wintypes.DWORD, wintypes.DWORD]

    SetConsoleCtrlHandler = kernel32.SetConsoleCtrlHandler
    SetConsoleCtrlHandler.argtypes = [wintypes.LPVOID, BOOL]

    CREATE_NO_WINDOW = 0x08000000
    EXTENDED_STARTUPINFO_PRESENT = 0x00080000
    HANDLE_FLAG_INHERIT = 0x00000001
    #INVALID_HANDLE_VALUE = ctypes.cast(-1, ctypes.c_void_p)
    INVALID_HANDLE_VALUE = 0xFFFFFFFFFFFFFFFF

    class SMALL_RECT(ctypes.Structure):
        _fields_ = [("Left", ctypes.c_short), ("Top", ctypes.c_short),
                    ("Right", ctypes.c_short), ("Bottom", ctypes.c_short)]

    #kernel32.SetConsoleScreenBufferSize.argtypes = [wintypes.HANDLE, COORD]
    #kernel32.SetConsoleScreenBufferSize.restype = wintypes.BOOL

    #kernel32.SetConsoleWindowInfo.argtypes = [wintypes.HANDLE, ctypes.wintypes.BOOL, ctypes.POINTER(SMALL_RECT)]
    #kernel32.SetConsoleWindowInfo.restype = wintypes.BOOL

    ResizePseudoConsole = kernel32.ResizePseudoConsole
    ResizePseudoConsole.argtypes = [wintypes.HANDLE, COORD]
    ResizePseudoConsole.restype = HRESULT

##################################################################

DEFAULT_NLINES=40
DEFAULT_NCOLUMNS=120

DEFAULT_BIND_ADDRESS = '127.0.0.1'

DEFAULT_HTTP_PORT = 8000
CONSOLE_URL="/"
DATA_REQUEST_PARAM="console"
SESSION_HINT_PARAM="session"
SET_SIZE_PARAM="size" # e.g. size=25x80
LIST_SESSIONS_PARAM="sessions"
KILL_SESSIONS_PARAM="kill"
DEFAULT_FILE="index.html"

DEFAULT_WEBSOCKET_PORT = 8001

#DEBUG_FLAGS = {"async", "process", "session", "http", "websocket"}
DEBUG_FLAGS = {"async", "process", "session", "websocket"}

SESSION_IDLE_CHECK_PERIOD = 10
SESSION_IDLE_TIMEOUT = 120 #10

initial_nlines = DEFAULT_NLINES
initial_ncolumns = DEFAULT_NCOLUMNS
bind_address = DEFAULT_BIND_ADDRESS
http_port = DEFAULT_HTTP_PORT
websocket_port = DEFAULT_WEBSOCKET_PORT
debug = False
enable_http = True
conhost_helper_pipe = None
enable_websocket = True
quiet = False
fix_aiohttp = False
enable_welcome = True
# Set to True to emulate what OpenSSH does on Windows.
# It is not the recommended way to use ConPTY, but it works.
use_conhost = True #False, if you want to conform to Microsoft recommendations

if platform.system() == "Linux":
    default_encoding = 'utf-8'
else:
    #default_encoding = 'cp1252'
    default_encoding = 'utf-8'

def find_valid_encoded(text):
    for i in range(len(text), 0, -1):
        try:
            t = text[:i].decode(default_encoding)
            return t, text[i:]
        except UnicodeDecodeError:
            continue
    return "", text

class AsyncJob:

    def dump(self):
        return self.name

    def __init__(self, *tasklist, name="?", on_task_termination=None, terminate_on_first_competed=False):
        self.on_task_termination = on_task_termination
        self.terminate_on_first_competed = terminate_on_first_competed
        self.name = name
        self.signal_q = asyncio.Queue()
        self.tasks = set()
        for t in tasklist:
            self.tasks.add(t)
        self.listener = asyncio.create_task(self.listen())
        self.tasks.add(self.listener)
        self.main = asyncio.create_task(self.job())

    async def listen(self):
        #print("Job ", self.name, ": waiting for signal")
        ok = await self.signal_q.get()
        #print("Job ", self.name, ": got signal ", ok)
        return ok
    
    async def job(self):

        while True:
            #print("Job ", self.name, ": waiting for tasks")
            
            tasks = list(self.tasks)
            tasks.append(self.listener)

            done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)

            #print("Job ", self.name, ": ", len(done), " completed, ", len(pending), " pending")

            end = False

            #for task in pending:
            #   print("Task pending: ", task)

            for task in done:
                #print("Task done: ", task)
                result = await task
                if task == self.listener:
                    #print("Job ", self.name, ": signaled ", result)
                    if not result:
                        end = True
                    self.listener = None
                else:
                    self.tasks.remove(task)
                    if self.terminate_on_first_competed:
                        end = True
                
            if end:
                #print("Job ", self.name, ": terminating...")
                for task in pending:
                    task.cancel()
                    try:
                    #
                    # Hell, cancellation exception is propagated up to the current task...
                    #
                        await task            
                    except (asyncio.CancelledError):
                        pass
                    except (GeneratorExit):
                        raise
                    except:
                        pass
                #print("Job ", self.name, ": invoking termination callback ", self.on_task_termination)
                if self.on_task_termination:
                    await self.on_task_termination(task)
                #print("Job ", self.name, ": terminated")
                break
            if not self.listener:
                self.listener = asyncio.create_task(self.listen())



    async def add(self, task):
        self.tasks.add(task)
        await self.signal_q.put(True)

    async def cancel(self):
        await self.signal_q.put(False)

    
class Shell:

    def  __init__(self, name):
        self.pid = None
        self.proc = None
        self.fd = None
        self.rd = None
        self.wr = None
        self.err = None
        self.kill = None
        self.name = name or ""
        self.pty = None
        self.li = DEFAULT_NLINES
        self.co = DEFAULT_NCOLUMNS

        #print("New shell: name=", self.name)
        if platform.system() == "Linux":
            self.run = self.run_linux
            self.set_size_core = self.set_size_linux
        else:
            self.run = self.run_windows
            self.set_size_core = self.set_size_windows

    # Platoform-specific pseudo-terminal size management

    def set_size_linux(self, li, co):
        s = struct.pack('HHHH', li, co, 0, 0)
        fcntl.ioctl(self.fd, termios.TIOCSWINSZ, s)
 
    def set_size_windows(self, li, co):
        if use_conhost:
            msg = PTY_SIGNAL_RESIZE_MESSAGE()
            msg.code = PTY_SIGNAL_RESIZE_WINDOW
            msg.x = co
            msg.y = li
            msgb = ctypes.string_at(ctypes.byref(msg), ctypes.sizeof(msg))
            if not WriteFile(self.proc['control_pipe'], ctypes.byref(msg), ctypes.sizeof(msg), None, None):
                raise ctypes.WinError(ctypes.get_last_error())
        else:
            size = COORD(co, li)
            result = ResizePseudoConsole(self.pty, size)
            if result != 0:
                raise ctypes.WinError(ctypes.get_last_error())

    def set_size(self, li, co):
        print("Process ", self.name, ": Size=", li, ",", co)
        try:
            self.set_size_core(li, co)
            self.li = li
            self.co = co
        except Exception as e:
            print("Process ", self.name, ": resize failed: ", e)


    # Platoform-specific shell process management

    async def run_linux(self):
        [pid, fd] = pty.fork()

        if pid == 0:
            os.execv("/bin/bash", ["bash"])
            print("Process ", self.name, ": exec(bash) failed")
            sys.exit(1)

        self.fd = fd

        flag = fcntl.fcntl(fd, fcntl.F_GETFD)
        fcntl.fcntl(fd, fcntl.F_SETFL, flag | os.O_NONBLOCK)

        self.set_size(initial_nlines, initial_ncolumns)

        #os.write(fd, bytes("\n", "UTF-8"))
        loop = asyncio.get_running_loop()

        wr = await loop.connect_write_pipe(asyncio.streams.FlowControlMixin, os.fdopen(fd, 'wb'))
        writer_transport, writer_protocol = wr
        writer = asyncio.StreamWriter(writer_transport, writer_protocol, None, loop)

        reader = asyncio.StreamReader()
        protocol = asyncio.StreamReaderProtocol(reader)
        await loop.connect_read_pipe(lambda: protocol, os.fdopen(fd, 'rb'))

        async def end_shell():
            try:
                writer.close()
                await writer.wait_close()
                os.kill(pid, signal.SIGKILL)
            except (asyncio.CancelledError, GeneratorExit):
                raise
            except:
                pass
            try:
                os.close(fd)
            except (asyncio.CancelledError, GeneratorExit):
                raise
            except:
                pass

        self.pid = pid
        self.proc = None
        self.fd = fd
        self.rd = reader
        self.wr = writer
        self.err = None
        self.kill = end_shell
        self.pty = None

    def conhost_helper(pipe, command, width, height):
        #print("conhost_helper: pipe=", pipe, " command=", command, " width=", width, " height=", height)
        try:
            handle = HANDLE()
            Shell.winpipe_client(pipe, handle, False, False);
            command = [ 'conhost.exe',  '--headless', '--width', width, '--height', height,
                        '--signal', hex(handle.value),
                        '--', command ]
            process = subprocess.Popen(command,
                    stdin=sys.stdin, stdout=sys.stdout, stderr=sys.stderr,
                    close_fds=False)
            process.wait()
        except Exception as e:
            print(e)

    def winpipename():
        global w32_pipe_count
        name = "\\\\.\\Pipe\\miniserver." + str(kernel32.GetCurrentProcessId()) + "." + str(w32_pipe_count)
        w32_pipe_count = w32_pipe_count + 1
        return name

    def winpipe_client(pipe, h_ref, wr, over):
        sa = SECURITY_ATTRIBUTES()
        sa.bInheritHandle = True
        sa.lpSecurityDescriptor = None
        sa.nLength = ctypes.sizeof(sa)

        f = FILE_ATTRIBUTE_NORMAL
        if over:
            f = f | FILE_FLAG_OVERLAPPED

        if wr:
            mode = GENERIC_WRITE
        else:
            mode = GENERIC_READ

        h_ref.value = CreateFileW(ctypes.c_wchar_p(pipe), mode, 0, ctypes.byref(sa), OPEN_EXISTING, f, None)

    def winpipe_server(pipe, h_ref, wr, over):
        sa = SECURITY_ATTRIBUTES()
        sa.bInheritHandle = True
        sa.lpSecurityDescriptor = None
        sa.nLength = ctypes.sizeof(sa)

        if wr:
            f = PIPE_ACCESS_OUTBOUND
        else:
            f = PIPE_ACCESS_INBOUND
        if over:
            f = f | FILE_FLAG_OVERLAPPED

        h_ref.value = CreateNamedPipeW(ctypes.c_wchar_p(pipe), f, PIPE_TYPE_BYTE | PIPE_WAIT, 1, 4096, 4096, 0, ctypes.byref(sa))

    def winpipe(in_ref, out_ref, wr, over, anon):
        if not anon:
            pipe = Shell.winpipename()
            if not (out_ref is None):
                Shell.winpipe_server(pipe, out_ref, wr, over)
            if not (in_ref is None):
                Shell.winpipe_client(pipe, in_ref, not wr, over)
        else:
            sa = SECURITY_ATTRIBUTES()
            sa.bInheritHandle = True
            sa.lpSecurityDescriptor = None
            sa.nLength = ctypes.sizeof(sa)
            pipe = ''
            if not CreatePipe(ctypes.byref(in_ref), ctypes.byref(out_ref), ctypes.byref(sa), 0):
                raise ctypes.WinError(ctypes.get_last_error())
        return pipe

    async def run_windows(self):

#
# NOTE: OpenSSH for Windows creates three NAMED PIPES and then launches
# this process:
#
# command = 'conhost.exe --headless --width '
#         + str(initial_ncolumns) + ' --height ' + str(initial_nlines)
#         + ' --signal ' + hex(control_read.value) + '' + ' -- ' + command
#
# where "control_write" is the write side of the third pipe. It brings
# screen size events.
# It looks quite weird, but it works better than ConPTY...
# ...but Microsoft recommends to use ConPTY...
#
        command = "cmd.exe"

        SetConsoleCtrlHandler(None, False)

        control_read = wintypes.HANDLE()
        control_write = wintypes.HANDLE()

        if use_conhost:

# Conhost.
#
# "Just launch conhost.exe, right?"
# Wrong. To signal screen size changes,
# a separate pipe must be created. Conhost receives
# the handle of the pipe's read side as a hexadecimal
# string in its command line.
# "Okay, let's create the pipe as inheritable and convert
# its read side to hexadecimal."
# Sorry, that's not enough. The problem is that "asyncio.create_subprocess_exec"
# seems to do its best to make the inheritance of additional handles impossible.
# The only solution I've found is to create a named pipe and a helper process
# that receives the name of the pipe as a command-line argument,
# opens it, and then launches conhost.exe using subprocess.Popen,
# which allows arbitrary handle inheritance.
# The helper process is a new instance of this program with the "secret" argument
# "--conhost-helper".
 

            pipename = Shell.winpipename()
            control_write_pipe = None
            Shell.winpipe_server(pipename, control_write, True, False);
            args = [ os.path.realpath(sys.executable), sys.argv[0],
                     '--conhost-helper', pipename, command,
                     str(initial_ncolumns), str(initial_nlines) ]
            process = await asyncio.create_subprocess_exec(
                *args,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE)
            proc = {
                    "process": process,
                    "control_pipe": control_write
                    }
            if not ConnectNamedPipe(control_write, None):
                raise ctypes.WinError(ctypes.get_last_error())
            reader = process.stdout
            writer = process.stdin
            self.pty = None
        else:

# ConPTY.
#
# ConPTY's requirements are completely incompatible with
# asyncio. A pair of blocking pipe ise required, which
# forces us to create a pair of threads and async queues
# to trasfer data to the child process. It works, but it's so slow...

            stdin_read = wintypes.HANDLE()
            stdin_write = wintypes.HANDLE()
            stdout_read = wintypes.HANDLE()
            stdout_write = wintypes.HANDLE()
            Shell.winpipe(stdin_read, stdin_write, True, True, True)
            Shell.winpipe(stdout_read, stdout_write, False, True, True)

            attr_size = SIZE_T()
            if not kernel32.InitializeProcThreadAttributeList(None, 1, 0, ctypes.byref(attr_size)):
                #raise ctypes.WinError(ctypes.get_last_error())
                pass
            attr_list = ctypes.create_string_buffer(attr_size.value)
            if not kernel32.InitializeProcThreadAttributeList(attr_list, 1, 0, ctypes.byref(attr_size)):
                raise ctypes.WinError(ctypes.get_last_error())
            self.pty = ctypes.c_void_p()

            size = COORD(initial_ncolumns, initial_nlines)

            rv = CreatePseudoConsole(size, stdin_read, stdout_write, 0, ctypes.byref(self.pty))
            if rv != 0:
                raise ctypes.WinError(ctypes.get_last_error())

            success = kernel32.UpdateProcThreadAttribute( attr_list, 0, PROC_THREAD_ATTRIBUTE_PSEUDOCONSOLE,
                    self.pty, ctypes.sizeof(ctypes.c_void_p), None, None)
            if not success:
                raise ctypes.WinError(ctypes.get_last_error())

            startupinfo = STARTUPINFOWEX()
            startupinfo.StartupInfo.cb = ctypes.sizeof(startupinfo)
            startupinfo.lpAttributeList = ctypes.cast(ctypes.addressof(attr_list), ctypes.c_void_p)

            startupinfo.StartupInfo.dwFlags = STARTF_USESTDHANDLES
            startupinfo.StartupInfo.hStdInput = stdin_read
            startupinfo.StartupInfo.hStdOutput = stdout_write
            startupinfo.StartupInfo.hStdError = stdout_write

            stdin_fd = msvcrt.open_osfhandle(stdin_write.value, os.O_WRONLY)
            stdout_fd = msvcrt.open_osfhandle(stdout_read.value, os.O_RDONLY)

            stdin_pipe = os.fdopen(stdin_fd, 'wb')
            stdout_pipe = os.fdopen(stdout_fd, 'rb')

            pi = PROCESS_INFORMATION()

            flags = EXTENDED_STARTUPINFO_PRESENT

            success = CreateProcessW( None, ctypes.c_wchar_p(command), None, None,
                False, flags, None, None, ctypes.byref(startupinfo), ctypes.byref(pi))

            kernel32.CloseHandle(stdin_read)
            kernel32.CloseHandle(stdout_write)

            if not success:
                raise ctypes.WinError(ctypes.get_last_error())

            #
            # Since ConPty only implements synchronous I/O, we have to create a pair of threads
            # to integrate the pseudoterminal in asyncio :-(
            # Not handy.
            #
            # Ok, let's try (NO, I WILL NOT USE POLLING, even though this is just a test program).
            #
            # asyncio provides an "run_coroutine_threadsafe"... the only thing that can make thareds
            # and coroutines interoperate.
            #

            stdin_queue = asyncio.Queue()
            stdout_queue = asyncio.Queue()

            loop = asyncio.get_running_loop()

            def read_from_process_thr():
                try:
                    while True:
                        data = stdout_pipe.read(1)
                        asyncio.run_coroutine_threadsafe(stdout_queue.put(data), loop).result()
                except (asyncio.CancelledError, GeneratorExit):
                    raise
                except Exception as e:
                    print(e)
                    pass

            th_read = threading.Thread(target=read_from_process_thr)
            th_read.start()

            class QueueStreamReader:
                def __init__(self, queue):
                    self.queue = queue
                    self.buffer = b''

                async def read(self, n=-1):
                    while len(self.buffer) < n or n == -1:
                        if len(self.buffer) > 0:
                            try:
                                data = await self.queue.get_nowait()
                            except asyncio.QueueEmpty:
                                break
                            except:
                                raise
                        else:    
                            data = await self.queue.get()
                        if data is None:
                            break
                        self.buffer += data
                    if n == -1:
                        result, self.buffer = self.buffer, b''
                    else:
                        result, self.buffer = self.buffer[:n], self.buffer[n:]
                    return result

            reader = QueueStreamReader(stdout_queue)


            def write_to_process_thr():
                try:
                    async def queue_get():
                        data = await stdin_queue.get()
                        return data
                    while True:
                        data = asyncio.run_coroutine_threadsafe(queue_get(), loop).result()
                        if data is None:
                            break
                        stdin_pipe.write(data)
                        stdin_pipe.flush()
                except (asyncio.CancelledError, GeneratorExit):
                    raise
                except Exception as e:
                    pass

            th_write = threading.Thread(target=write_to_process_thr)
            th_write.start()

            class QueueStreamWriter:
                def __init__(self, queue):
                    self.queue = queue
                    self.buffer = b''

                def write(self, data):
                    self.buffer += data

                async def drain(self):
                    await self.queue.put(self.buffer)
                    self.buffer = b''


            writer = QueueStreamWriter(stdin_queue)
            proc = {
                    "pi": pi,
                    "th_read": th_read,
                    "th_write": th_write,
                    "stdin_queue": stdin_queue,
                    "stdout_queue": stdout_queue,
                    "stdin_pipe": stdin_pipe,
                    "stdout_pipe": stdout_pipe
                    }

        reader_err = None
        
        async def end_shell():
            #print("end_shell: ", self.proc.hProcess)
            try:
                self.proc.pi.stdin_queue.put(None)
            except (asyncio.CancelledError, GeneratorExit):
                raise
            except:
                pass
            try:
                kernel32.TerminateProcess(self.proc.pi.hProcess, 0)
            except (asyncio.CancelledError, GeneratorExit):
                raise
            except:
                pass
            try:
                kernel32.CloseHandle(self.proc.pi.hProcess)
            except (asyncio.CancelledError, GeneratorExit):
                raise
            except:
                pass
            try:
                kernel32.CloseHandle(self.proc.pi.hThread)
            except (asyncio.CancelledError, GeneratorExit):
                raise
            except:
                pass
            try:
                kernel32.ClosePseudoConsole(self.pty)
            except (asyncio.CancelledError, GeneratorExit):
                raise
            except:
                pass
            try:
                self.proc.stdout_pipe.close()
            except (asyncio.CancelledError, GeneratorExit):
                raise
            except:
                pass
            try:
                self.proc.stdin_pipe.close()
            except (asyncio.CancelledError, GeneratorExit):
                raise
            except:
                pass
            try:
                kernel32.CloseHandle(self.proc.control_pipe)
            except (asyncio.CancelledError, GeneratorExit):
                raise
            except:
                pass
            try:
                self.proc.th_read.join()
            except (asyncio.CancelledError, GeneratorExit):
                raise
            except:
                pass
            try:
                self.proc.th_write.join()
            except (asyncio.CancelledError, GeneratorExit):
                raise
            except:
                pass
            try:
                self.proc.process.terminate()
            except (asyncio.CancelledError, GeneratorExit):
                raise
            except:
                pass


        self.pid = None
        self.proc = proc
        self.fd = None
        self.rd = reader
        self.wr = writer
        self.err = reader_err
        self.kill = end_shell

    async def run(self):
        #print("New shell: name=", self.name)
        if platform.system() == "Linux":
            return await self.run_linux()
        else:
            return await self.run_windows()
        
    async def create(name):
        shell = Shell(name)
        await shell.run()
        return shell

    async def terminate(self):
        try:
            await self.kill()
        except (asyncio.CancelledError, GeneratorExit):
            raise
        except:
            pass


class Session:


    def  __init__(self, sid, persistent=False):
        self.sid = sid
        self.start_time = datetime.datetime.now().strftime("%Y/%m/%d %H:%M:%S")
        self.shell = None
        self.rxq = asyncio.Queue()
        self.txq = asyncio.Queue()
        self.visited = time.time()
        self.persistent = persistent
        self.task = None
        self.job = None
        self.pending_data = b""
        Session.sessions[self.sid] = self

    async def activate(self):

        if self.shell:
            return
        
        self.shell = await Shell.create(self.sid)

        print("Session ", self.sid, ": starting shell")

        tasks = list()

        tasks.append(asyncio.create_task(self.read_from_process(self.shell.rd)))
        tasks.append(asyncio.create_task(self.write_to_process(self.shell.wr)))
        if self.shell.err:
            tasks.append(asyncio.create_task(self.read_from_process(self.shell.err)))

        async def on_close(task):
            await self.shell.terminate()
            if self.sid in Session.sessions:
                del Session.sessions[self.sid]
            print("Session ", self.sid, ": exiting")


        self.job = AsyncJob(*tasks, name = self.sid,
                               on_task_termination = on_close,
                               terminate_on_first_competed = True)
        
        await Session.manager.add(self.job.main)


    async def terminate(self):
        try:
            await self.job.cancel()
        except (asyncio.CancelledError, GeneratorExit):
            raise
        except:
            pass

    def get_pending_data(self, clear):
        t = self.pending_data
        if clear:
            self.pending_data = b""
        return t

    def add_pending_data(self, data):
        self.pending_data = self.pending_data + data

    async def read_from_process(self, reader):
        #print("self=", self, " reader=", reader)
        try:
            while True:
                data = await reader.read(1000)
                if not data:
                    break
                try:
                    data = self.get_pending_data(True) + data
                    #d = data.decode('utf-8')
                    d, remt = find_valid_encoded(data)
                    self.add_pending_data(remt)
                    if len(d) > 0:
                        await self.txq.put(d)
                except (asyncio.CancelledError, GeneratorExit):
                    raise
                except Exception as e:
                    print(e)
        except (asyncio.CancelledError, GeneratorExit):
            raise
        except Exception as e:
            print(e)
        #print("Session ", self.sid, ": stdout/stderr closing...")

    async def write_to_process(self, writer):
        while True:
            message = await self.rxq.get()
            try:
                t = ''
                try:
                    d = json.loads(message)
                    if 'text' in d:
                        t = d['text']
                    if 'size' in d:
                        self.set_size_from_text(d['size'])                        
                except (asyncio.CancelledError, GeneratorExit):
                    raise
                except:
                    t = message
                if t != '':
                    writer.write(t.encode(default_encoding))
                    await writer.drain()
            except (asyncio.CancelledError, GeneratorExit):
                raise
            except Exception as e:
                print(e)
                break
        #print("Session ", self.sid, ": stdin closing...")

    def set_size_from_text(self,text):
        try:
            sz = text.split("x")
            if len(sz) >= 2:
                li = int(sz[0])
                co = int(sz[1])
                self.shell.set_size(li, co)
        except Exception as e:
            print(e)

            
    async def new_session_by_sid(sid, persistent = False):
        print("New session, ID = ", sid)
        session = Session(sid, persistent)
        #await Session.manager.add(session.job.main)
        return session

    async def new_session(persistent = False):
        sid = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
        return await Session.new_session_by_sid(sid, persistent)

    async def request_handler(request):

        sid = None
        hint = False
        params = request.query
        if SESSION_HINT_PARAM in params:
            sid = params[SESSION_HINT_PARAM]
            hint = True
            #print("HINT = ", sid)

        if not sid:
            sid = request.cookies.get('session_id')
            if not sid:
                #
                # Hack: chrome on Windows ignore some cookies...
                #
                if "Cookie" in request.headers:
                    cl = request.headers["Cookie"]
                    cookies = {}
                    for cookie in cl.split('; '):
                        key, value = cookie.split('=', 1)
                        cookies[key] = value
                    if 'session_id' in cookies:
                        sid = cookies['session_id']

        #print("Receive session ID: ", session_id or "");
        if sid:
            if sid in Session.sessions:
                # Existing session
                #print("Existing session: ", session_id);
                session = Session.sessions[sid]
            elif hint:
                session = await Session.new_session_by_sid(sid)      
            else:
                session = await Session.new_session()
        else:
            # New session
            session = await Session.new_session()

        session.visited = time.time()

        return session

    # Global session collection
    sessions = {}
    manager = None

    async def kill_session(sid):
        if sid in Session.sessions:
            session = Session.sessions[sid]
            await session.terminate()
            del Session.sessions[sid]
    
    async def cleaner():
        #print("Session cleaner started")
        while True:
            await asyncio.sleep(SESSION_IDLE_CHECK_PERIOD)
            #print("Session cleaner loop")
            s = Session.sessions.copy()
            for sid in s:
                session = s[sid]
                if ((not session.persistent) and (time.time() - session.visited > SESSION_IDLE_TIMEOUT)):
                    #print("Session ", sid, ": timeout -- closing...")
                    await Session.kill_session(sid)
                    print("Session ", sid, ": timeout -- closed")


    def setup():
        Session.sessions = {}
        cleaner = asyncio.create_task(Session.cleaner())
        Session.manager = AsyncJob(cleaner, name = "[Manager]",
                               on_task_termination = None,
                               terminate_on_first_competed = False)
        return Session.manager.job


    # This decorator adds session management to the core request logic.
    # Core function receive session ID and session data as additional parameters.
    def decorator(fn):
        async def wrapper(request):
            if "http" in DEBUG_FLAGS:
                print("Request:")
                print(" Method:", request.method)
                print(" URL:", request.url)
                print(" Headers:", request.headers)
                print(" Cookies:", request.cookies)
                print(" Query String:", request.query_string)
                print(" Query Parameters:", request.query)
            session = await Session.request_handler(request)
            response = await fn(request, session)
            response.set_cookie('session_id', session.sid, path='/')
            if "http" in DEBUG_FLAGS:
                print("Response:")
                print(" Headers:", response.headers)
                print(" Cookies:", response.cookies)
            return response
        return wrapper


async def get_files(request, session):
    file_path = request.match_info.get('file_path', DEFAULT_FILE)
    content = ""
    fp = os.path.join(doc_dir, file_path)
    if not os.path.exists(fp):
        fp = os.path.join(os.path.dirname(doc_dir), "src", file_path)
    if not os.path.exists(fp):
        fp = os.path.join(os.path.dirname(doc_dir), "dist", file_path)
    if not os.path.exists(fp):
        fp = os.path.join(os.path.dirname(doc_dir), "wip", file_path)
    try:
#        print("session " + session.sid + ": opening " + file_path + " path=" + fp);
        with open(fp, 'rb') as file:
            content = file.read()
        mime_type, _ = mimetypes.guess_type(fp)
        if mime_type is None:
            mime_type = 'application/octet-stream'
        response = aiohttp.web.Response(body=content, content_type=mime_type)
    except (asyncio.CancelledError, GeneratorExit):
        raise
    except Exception as e:
        print(e)
        response = aiohttp.web.Response(text='Not found', status = 404)
    return response

@Session.decorator
async def do_GET(request, session):
    #print("GET: Session=", session.sid);
    params = request.query

    if (SET_SIZE_PARAM in params) or (DATA_REQUEST_PARAM in params): 

        await session.activate()

        if (SET_SIZE_PARAM in params): 
            session.set_size_from_text(params[SET_SIZE_PARAM])

        text = ""
        try:
            while True:
                t = session.txq.get_nowait()
                text += t
        except (asyncio.CancelledError, GeneratorExit):
            raise
        except:
            pass
        response = aiohttp.web.Response(body=json.dumps({ 'text': text }), content_type='application/json')
        #print("GET: Session=", session_id, " Data=", sessions[session_id]);

    elif LIST_SESSIONS_PARAM in params:

        s = Session.sessions.copy()
        sl = []
        for sid in s:
            session = s[sid]
            sz = "-"
            if session.shell:
                sz = str(session.shell.co) + "x" + str(session.shell.li)
            so = { "sid": sid,
                   "ty": session.persistent,
                   "sz": sz,
                   "dt": session.start_time,
                   "tm": int(time.time() - session.visited) }
            sl.append(so)
        response = aiohttp.web.Response(body=json.dumps(sl), content_type='application/json')

    elif KILL_SESSIONS_PARAM in params:
        sid = params[KILL_SESSIONS_PARAM]
        await Session.kill_session(sid)
        print("Session ", sid, ": killed")
        response = aiohttp.web.Response(body=json.dumps({}), content_type='application/json')

    else:
        response = await get_files(request, session)

    return response



@Session.decorator
async def do_GET_files(request, session):
    return await get_files(request, session)

@Session.decorator
async def do_POST(request, session):
    #print("POST: Session=", session.sid);
    try:
        await session.activate()
        data = await request.text()
        await session.rxq.put(data)
        response = aiohttp.web.Response(text='', status = 200)
    except (asyncio.CancelledError, GeneratorExit):
        raise
    except Exception as e:
        print("POST: error", e)
        response = aiohttp.web.Response(text='Bad request', status = 400)
    return response

@Session.decorator
async def do_PUT(request, session):
    #print("PUT: Session=", session.sid)
    if upload_dir is None:        
        response = aiohttp.web.Response(text='Bad request', status = 500)
    else:
        file_path = request.match_info.get('file_path', 'default.bin')
        fp = os.path.join(upload_dir, file_path)

        async def upload():
            try:
                file = open(fp, 'wb')
                while True:
                    chunk = await request.content.read(1024)
                    if not chunk:
                        file.close()
                        break
                    file.write(chunk)
            except (asyncio.CancelledError, GeneratorExit):
                raise
            except Exception as e:
                print("Error opening file for upload:", e)
                return False
            return True
        
        result = await upload()
        if not result:
            response = aiohttp.web.Response(text='Error uploading file', status = 500)
        else:
            print(f'File {file_path} uploaded successfully to {fp}')
            response = aiohttp.web.Response(text='', status = 200)
    return response

async def websocket_server():

    print('*** Websocket server ready - bind address=' + bind_address + ':' + str(websocket_port))

    async def read_from_websocket(ws, session):
        async for data in ws:
            try:
                await session.rxq.put(data)
                session.visited = time.time()
            except (asyncio.CancelledError, GeneratorExit):
                raise
            except Exception as e:
                #print("WS recv: ", e)
                break

    async def write_to_websocket(ws, session):
        while True:
            try:
                d = await session.txq.get()
                await ws.send(json.dumps({ 'text': d }))
                session.visited = time.time()
            except (asyncio.CancelledError, GeneratorExit):
                raise
            except Exception as e:
                #print("WS send: ", e)
                break

    async def websocket_connection(ws, path = None):

        #print("WS connection, peer = ", json.dumps(ws.remote_address))
        session = await Session.new_session(persistent = True)
        await session.activate()
        tasks = list()
        
        #print("WS connection, shell running, peer = ", json.dumps(ws.remote_address))

        tasks.append(asyncio.create_task(read_from_websocket(ws, session)))
        tasks.append(asyncio.create_task(write_to_websocket(ws, session)))

        async def on_close(task):
            #print("WS connection closed, peer = ", json.dumps(ws.remote_address))
            try:
                await ws.close()
            except (asyncio.CancelledError, GeneratorExit):
                raise
            except:
                pass

        job = AsyncJob(*tasks, name="WS " + json.dumps(ws.remote_address), on_task_termination=on_close, terminate_on_first_competed=True)

        await job.main

        #print("WS connection exiting, peer = ", json.dumps(ws.remote_address))


# Although it's documented that this is the way, it doesn't work reliably everywhere.
# In particular, on many linux distributions the server dies suddenly.
    #while True:
    #    async with websockets.serve(websocket_connection, bind_address, websocket_port):
    #        await asyncio.Future()

# Source of this approach: https://github.com/hzlmn/sketch/issues/4#issuecomment-1311185375
# Note that the post also recommends to "save somewhere" the task, or the GC will
# destroy it at the first opportunity. See below.
    wsserver = await websockets.serve(websocket_connection, bind_address, websocket_port)
    if hasattr(wsserver, 'serve_forever'):
        await wsserver.serve_forever()

async def init_http_server():

    print('*** HTTP server ready - bind address=' + bind_address + ':' + str(http_port) + ' root=' + doc_dir)

    http_server = aiohttp.web.Application()
    http_server.add_routes([aiohttp.web.get('/', do_GET),
                            aiohttp.web.get('/{file_path:.*}', do_GET_files),
                            aiohttp.web.post('/', do_POST),
                            aiohttp.web.put('/{file_path:.*}', do_PUT)])

    session_manager = Session.setup()

    # See comment above
    sesson_manager_task = None
    async def run_session_manager(http_server):
        sesson_manager_task = asyncio.create_task(session_manager())
    http_server.on_startup.append(run_session_manager)
    
    # See comment above
    wstask = None

    if enable_websocket:
        async def run_websocket_server(http_server):
            wstask = asyncio.create_task(websocket_server())
        http_server.on_startup.append(run_websocket_server)
    
    return http_server

mimetypes.add_type('application/javascript', '.js')


if __name__ == '__main__':

    if platform.system() != "Linux":
        kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)

    def welcome():
        print('')
        print('miniserver.py rel.', VERSION)
        print('\x1B[96m')
        print('This is a minimal HTTP and WebSocket terminal server.')
        print('It is intended to help experiment and develop xwterm.js (AnsiTerm)')
        print('and applications that use it.')
        print('\x1B[93m')
        print('It is NOT intended to be used as a real terminal server, as it lacks')
        print('the minimal security checks and resource controls. If you nevertheless')
        print('use it in a real production environment, and in particular expose its')
        print('services to the Internet, you do so at your own risk.')
        print('\x1B[0m')
        if (platform.system() != "Linux") and use_conhost:
            print('\x1B[96m')
            print('WARNING: using undocumented feature "conhost.exe" as virtual terminal manager.')
            print('Although it is considerably faster, it is not officially supported by Microsoft.')
            print('If you have any troubles, add \x1B[1m--use-conpty\x1B[22m option.')
            print('\x1B[0m')

    def usage():
        normal = '\x1B[0m'
        bold  = normal + '\x1B[1m\x1B[96m'
        italic  = normal + '\x1B[3m\x1B[93m'
        orop = normal + ' | ' + bold
        comment = normal + ' : '
        print('\nUsage:')
        print(' '+bold+'-b'+orop+'-bind'+orop+'-bindaddr '+italic+'IP addrress'+comment+'bind address for services. Default='+str(DEFAULT_BIND_ADDRESS))
        print(' '+bold+'-http'+orop+'-httpport '+italic+'TCP port'+comment+'TCP port for HTTP service. Default='+str(DEFAULT_HTTP_PORT))
        print(' '+bold+'-docdir'+orop+'-docroot'+orop+'-wwwroot'+orop+'-root'+orop+'-doc '+italic+'directory'+comment+'Root directory for HTTP service. Default='+italic+'program directory'+normal)
        print(' '+bold+'-ws'+orop+'-wsport'+orop+'-websocket'+orop+'-websocketport '+italic+'TCP port'+comment+'TCP port for WebSocket service. Default='+str(DEFAULT_WEBSOCKET_PORT))
        print(' '+bold+'-no-http'+comment+'Disable HTTP service')
        print(' '+bold+'-no-websocket'+comment+'Disable WebSocket service')
        if platform.system() != "Linux":
            print(' '+bold+'-use-conhost'+comment+'(Windows only) Use conhost.exe instead of ConPTY (default, but not officially supported by M$)')
            print(' '+bold+'-use-conpty'+comment+'(Windows only) Use ConPTY API (recommended by M$, but slow)')
        print(' '+bold+'-initial-size'+orop+'-default-size '+italic+'columns'+normal+'x'+italic+'lines'+comment+'Initial screen size. Default='+str(DEFAULT_NCOLUMNS)+'x'+str(DEFAULT_NLINES))
        print(' '+bold+'-no-welcome'+comment+'Disable welcome message')
        print(' '+bold+'-fix-aiohttp'+comment+'Launch WebSocket server in a separate process to prevent aiohttp bug')
        print(' '+bold+'-d'+orop+'-debug'+comment+'Enable debug mode')
        print(' '+bold+'-q'+orop+'-quiet'+comment+'Quiet mode, no messages')
        print(' '+bold+'-h'+orop+'-help'+comment+'This help')
        print('')
        sys.exit(0)

    args = [ x.lower() for x in sys.argv[1:] ]

    while len(args) > 0:

        opt = args[0]
        opt = opt.replace('--', '-')
        args = args[1:]
        #print('"' + opt + '"')
        if opt in [ "-http", "-httpport", "-b", "-bind", "-bindaddr", "-ws", "-wsport", "-websocket", "-websocketport",
                    "-docdir", "-docroot", "-wwwroot", "-root", "-doc",
                    "-initial-size", "-default-size" ]:

            if len(args) == 0:
                usage()
            arg = args[0]
            args = args[1:]
            if opt in [ "-http", "-httpport" ]:
                http_port = arg
            elif opt in [ "-ws", "-wsport", "-websocket", "-websocketport" ]:
                websocket_port = arg
            elif opt in [ "-docdir", "-docroot", "-wwwroot", "-root", "-doc" ]:
                doc_dir = arg
            elif opt in [ "-b", "-bind", "-bindaddr" ]:
                bind_address = arg
            elif opt in [ "-initial-size", "-defailt-silze" ]:
                try:
                    initial_ncolumns, initial_nlines = arg.split("x")
                    initial_ncolumns = int(initial_ncolumns)
                    initial_nlines = int(initial_nlines)
                except:
                    usage()
                if initial_ncolumns < 1 or initial_nlines < 1:
                    usage()
            
        elif opt in [ "-h", "-help", "-no-http", "-no-websocket", "-d", "-debug", "-q", "quiet",
                      "-fix-aiohttp", "-aiohttp-workaround", "-no-welcome", '-use-conhost', '-use-conpty' ]:

            if opt in [ "-d", "-debug" ]:
                debug = True
            elif opt in [ "-q", "-quiet" ]:
                quiet = True
            elif opt in [ "-h", "-help" ]:
                usage()
            elif opt in [ "-no-http" ]:
                enable_http = False
            elif opt in [ "-no-websocket" ]:
                enable_websocket = False
            elif opt in [ "-fix-aiohttp", "-aiohttp-workaround" ]:
                fix_aiohttp = True
            elif opt in [ "-no-welcome" ]:
                enable_welcome = False
            elif opt in [ "-use-conhost" ]:
                use_conhost = True
            elif opt in [ "-use-conpty" ]:
                use_conhost = False
        
        elif opt in [ "-conhost-helper" ]:
            if len(args) != 4:
                usage()
            conhost_helper_pipe = args[0]
            conhost_helper_command = args[1]
            conhost_helper_width = args[2]
            conhost_helper_height = args[3]
            args = args[4:]

        else:
            print('Unknown option: "', opt, '"')
            usage()

    
    def no_print(*args):
        pass


    if conhost_helper_pipe:
        #print("conhost_helper")
        Shell.conhost_helper(conhost_helper_pipe, conhost_helper_command, conhost_helper_width, conhost_helper_height)
        sys.exit(0)

    if quiet:
        print = no_print

    if enable_welcome:
        welcome()

    f_enable_http = enable_http
    if (not has_aiohttp) and enable_http:
        enable_http = False
        print('\x1B[96m')
        print('WARNING: \x1B[93maiohttp\x1B[96m module not found, HTTP service not available.')
        print('\x1B[0m')
    f_enable_websocket = enable_websocket
    if (not has_websockets) and enable_websocket:
        enable_websocket = False
        print('\x1B[96m')
        print('WARNING: \x1B[93mwebsockets\x1B[96m module not found, WebSocket service not available.')
        print('\x1B[0m')
    if (f_enable_http and not enable_http) and (f_enable_websocket and not enable_websocket):
        print('Install missing modules and retry')
        sys.exit(1)

# An ugly hack to prevent a bug that affects some versions of aiohttp,
# in which the websocket listener task is terminated (and never awaited, too)
# by the http listener at the first WebSocket connection.
# So we reserve a separate process to manage WebSocket, and the main one
# manages HTTP.

    if fix_aiohttp and enable_websocket and enable_http:
        rv = os.spawnl(os.P_NOWAIT, sys.executable, sys.executable, __file__,
                       '-no-welcome', '-no-http', '-ws', str(websocket_port), '-bind', bind_address) 
        enable_websocket = False

    if debug:
        logging.basicConfig(level=logging.WARNING)

    if enable_http:

        aiohttp.web.run_app(init_http_server(), host=bind_address, port=http_port, print=no_print)

    elif enable_websocket:

        async def wsonly():

            session_manager = Session.setup()

            sm = asyncio.create_task(session_manager())
            ws = asyncio.create_task(websocket_server())

            tasks = list()
            tasks.append(sm)
            tasks.append(ws)

            await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)

        asyncio.run(wsonly())
    else:
        usage()

