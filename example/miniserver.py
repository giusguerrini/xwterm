#!/usr/bin/python3

# Miniserver. Requires aiohttp (pip install aiohttp)

import os
import sys
import platform
import string
import random
import asyncio
import aiohttp
import struct
import aiohttp.web
import mimetypes
import time
import json
try:
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

if platform.system() == "Linux":
    pass
else:

    #
    # ctypes.wintypes integration...
    #

    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

    #LONG = ctypes.c_long
    HRESULT = wintypes.LONG

    PROC_THREAD_ATTRIBUTE_PSEUDOCONSOLE = 0x00020016

    class STARTUPINFOA(Structure):
        _fields_ = [
            ("cb", wintypes.DWORD),
            ("lpReserved", wintypes.LPSTR),
            ("lpDesktop", wintypes.LPSTR),
            ("lpTitle", wintypes.LPSTR),
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

    class StartupInfoEx(ctypes.Structure):
        _fields_ = [
            ("StartupInfo", STARTUPINFOA),
            ("lpAttributeList", ctypes.c_void_p)
        ]

    class COORD(ctypes.Structure):
        _fields_ = [("X", wintypes.SHORT), ("Y", wintypes.SHORT)]

    kernel32.CreatePseudoConsole.argtypes = [
        COORD,
        wintypes.HANDLE,
        wintypes.HANDLE,
        wintypes.DWORD, 
        ctypes.POINTER(ctypes.c_void_p)
    ]

    kernel32.CreatePseudoConsole.restype = HRESULT

    class SMALL_RECT(ctypes.Structure):
        _fields_ = [("Left", ctypes.c_short), ("Top", ctypes.c_short),
                    ("Right", ctypes.c_short), ("Bottom", ctypes.c_short)]

    kernel32.SetConsoleScreenBufferSize.argtypes = [wintypes.HANDLE, COORD]
    kernel32.SetConsoleScreenBufferSize.restype = wintypes.BOOL

    kernel32.SetConsoleWindowInfo.argtypes = [wintypes.HANDLE, ctypes.wintypes.BOOL, POINTER(SMALL_RECT)]
    kernel32.SetConsoleWindowInfo.restype = wintypes.BOOL


DEFAULT_NLINES=40
DEFAULT_NCOLUMNS=120

CONSOLE_URL="/"
DATA_REQUEST_PARAM="console"
SET_SIZE_PARAM="size" # e.g. size=25x80
DEFAULT_URL="/example.html"

#DEBUG_FLAGS = {"async", "process", "session", "http", "websocket"}
DEBUG_FLAGS = {"async", "process", "session", "websocket"}

SESSION_IDLE_CHECK_PERIOD = 10
SESSION_IDLE_TIMEOUT = 10 #30

def find_valid_utf8(text):
    for i in range(len(text), 0, -1):
        try:
            t = text[:i].decode('utf-8')
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
                    except asyncio.CancelledError:
                        pass
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
        print("Process ", self.name, ": Size=", li, ",", co)

        new_buffer_size = COORD(co, li)
        result = kernel32.SetConsoleScreenBufferSize(self.pty, new_buffer_size)
        if not result:
            raise ctypes.WinError(ctypes.get_last_error())

        new_window_size = SMALL_RECT(0, 0, co - 1, li - 1)
        result = kernel32.SetConsoleWindowInfo(self.pty, True, ctypes.byref(new_window_size))
        if not result:
            raise ctypes.WinError(ctypes.get_last_error())

    def set_size(self, li, co):
        print("Process ", self.name, ": Size=", li, ",", co)
        try:
            self.set_size_core(li, co)
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

        self.set_size(DEFAULT_NLINES, DEFAULT_NCOLUMNS)

        #os.write(fd, bytes("\n", "UTF-8"))
        loop = asyncio.get_running_loop()

        wr = await loop.connect_write_pipe(asyncio.streams.FlowControlMixin, os.fdopen(fd, 'wb'))
        writer_transport, writer_protocol = wr;
        writer = asyncio.StreamWriter(writer_transport, writer_protocol, None, loop)

        reader = asyncio.StreamReader()
        protocol = asyncio.StreamReaderProtocol(reader)
        await loop.connect_read_pipe(lambda: protocol, os.fdopen(fd, 'rb'))

        async def end_shell():
            try:
                os.kill(pid, signal.SIGKILL)
            except asyncio.CancelledError:
                raise
            except:
                pass
            try:
                os.close(fd)
            except asyncio.CancelledError:
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

    async def run_windows(self):

        cmd = ["cmd.exe", "/a"]

        if True:

            self.pty = ctypes.c_void_p()
            size = COORD(DEFAULT_NCOLUMNS, DEFAULT_NLINES)
            kernel32.CreatePseudoConsole(size, ctypes.c_void_p(), ctypes.c_void_p(), 0, ctypes.byref(self.pty))

            attr_size = ctypes.wintypes.SIZE_T()
            kernel32.InitializeProcThreadAttributeList(None, 1, 0, ctypes.byref(attr_size))
            attr_list = ctypes.create_string_buffer(attr_size.value)
            kernel32.InitializeProcThreadAttributeList(attr_list, 1, 0, ctypes.byref(attr_size))

            kernel32.UpdateProcThreadAttribute(
                attr_list,
                0,
                PROC_THREAD_ATTRIBUTE_PSEUDOCONSOLE,
                self.pty,
                ctypes.sizeof(ctypes.c_void_p),
                None,
                None
            )

            startupinfo = StartupInfoEx()
            startupinfo.StartupInfo.cb = ctypes.sizeof(startupinfo)
            startupinfo.lpAttributeList = attr_list

            proc = await asyncio.create_subprocess_exec(*cmd,
                                                        startupinfo = startupinfo,
                                                        stdin = asyncio.subprocess.PIPE,
                                                        stdout = asyncio.subprocess.PIPE,
                                                        stderr = asyncio.subprocess.PIPE) 
            reader = proc.stdout
            reader_err = proc.stderr
            writer = proc.stdin

            async def end_shell():
                try:
                    kernel32.ClosePseudoConsole(self.pty)
                except asyncio.CancelledError:
                    raise
                except:
                    pass
                try:
                    proc.proc.kill()
                except asyncio.CancelledError:
                    raise
                except:
                    pass
                try:
                    await proc.proc.wait()
                except asyncio.CancelledError:
                    raise
                except:
                    pass


        else:

            proc = await asyncio.create_subprocess_exec(*cmd,
                                                        stdin = asyncio.subprocess.PIPE,
                                                        stdout = asyncio.subprocess.PIPE,
                                                        stderr = asyncio.subprocess.PIPE) 
            reader = proc.stdout
            reader_err = proc.stderr
            writer = proc.stdin

            async def end_shell():
                try:
                    proc.proc.kill()
                except asyncio.CancelledError:
                    raise
                except:
                    pass
                try:
                    await proc.proc.wait()
                except asyncio.CancelledError:
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
        except asyncio.CancelledError:
            raise
        except:
            pass


class Session:


    def  __init__(self, sid):
        self.sid = sid
        self.shell = None
        self.visited =  False
        self.rxq = asyncio.Queue()
        self.txq = asyncio.Queue()
        self.last_visited = time.time()
        self.task = None
        self.job = None
        self.pending_data = b""
        Session.sessions[self.sid] = self


    async def create(sid):
        
        session = Session(sid)
        
        session.shell = await Shell.create(sid)

        #print("Session ", session.sid, ": starting I/O tasks")

        tasks = list()

        tasks.append(asyncio.create_task(session.read_from_process(session.shell.rd)))
        tasks.append(asyncio.create_task(session.write_to_process(session.shell.wr)))
        if session.shell.err:
            tasks.append(asyncio.create_task(session.read_from_process(session.shell.err)))

        async def on_close(task):
            await session.shell.terminate()
            del Session.sessions[session.sid]
            #print("Session ", session.sid, ": exiting")


        session.job = AsyncJob(*tasks, name = session.sid,
                               on_task_termination = on_close,
                               terminate_on_first_competed = True)
        
        return session



    async def terminate(self):
        try:
            await self.job.cancel()
        except asyncio.CancelledError:
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
            txq = self.txq
            while True:
                data = await reader.read(1000)
                if not data:
                    break
                try:
                    data = self.get_pending_data(True) + data
                    #d = data.decode('utf-8')
                    d, remt = find_valid_utf8(data)
                    self.add_pending_data(remt)
                    if len(d) > 0:
                        await txq.put(d)
                except asyncio.CancelledError:
                    raise
                except Exception as e:
                    print(e)
        except asyncio.CancelledError:
            raise
        except Exception as e:
            print(e)
        #print("Session ", self.sid, ": stdout/stderr closing...")

    async def write_to_process(self, writer):
        rxq = self.rxq
        while True:
            message = await rxq.get()
            try:
                t = ''
                try:
                    d = json.loads(message)
                    t = d['text']
                except asyncio.CancelledError:
                    raise
                except:
                    t = message
                if t != '':
                    writer.write(t.encode())
                    await writer.drain()
            except asyncio.CancelledError:
                raise
            except Exception as e:
                print(e)
                break
        #print("Session ", self.sid, ": stdin closing...")

    async def request_handler(request):

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
        if sid and sid in Session.sessions:
            # Existing session
            #print("Existing session: ", session_id);
            session = Session.sessions[sid]
        else:
            # New session
            sid = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
            session = await Session.create(sid)
            await Session.manager.add(session.job.main)

        session.last_visited = time.time()

        return session

    # Global session collection
    sessions = {}
    manager = None

    async def cleaner():
        #print("Session cleaner started")
        while True:
            await asyncio.sleep(SESSION_IDLE_CHECK_PERIOD)
            #print("Session cleaner loop")
            s = Session.sessions.copy()
            for sid in s:
                session = Session.sessions[sid]
                if (time.time() - session.last_visited > SESSION_IDLE_TIMEOUT):
                    #print("Session ", session.sid, ": timeout -- closing...")
                    await session.terminate()
                    print("Session ", session.sid, ": timeout -- closed")

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
    file_path = request.match_info.get('file_path', 'example.html')
    if os.path.exists(file_path):
        with open(file_path, 'rb') as file:
            content = file.read()
        mime_type, _ = mimetypes.guess_type(file_path)
        #print("File ", file_path, " mime-type ", mime_type)
        if mime_type is None:
            mime_type = 'application/octet-stream'
    response = aiohttp.web.Response(body=content, content_type=mime_type)
    return response

@Session.decorator
async def do_GET(request, session):
    #print("GET: Session=", session.sid);
    params = request.query

    if (SET_SIZE_PARAM in params) or (DATA_REQUEST_PARAM in params): 

        if (SET_SIZE_PARAM in params): 
            try:
                sz = params[SET_SIZE_PARAM].split("x")
                if len(sz) >= 2:
                    li = int(sz[0])
                    co = int(sz[1])
                    session.shell.set_size(li, co)
            except asyncio.CancelledError:
                raise
            except Exception as e:
                print(e)

        text = "";
        if not session.visited:
            text = "Session ID = " + session.sid + "\r\n"
            session.visited = True;
        #response = aiohttp.web.Response(text=f'Visits: {session_data["visits"]}')
        #text += session.get_pending_text(True)
        try:
            while True:
                t = session.txq.get_nowait()
                if t == "":
                    break
                text += t
            #text = text.decode('utf-8')
            #text, remt = find_valid_utf8(text)
            #session.add_pending_text(remt)
        except asyncio.CancelledError:
            raise
        except:
            pass
        response = aiohttp.web.Response(body=json.dumps({ 'text': text }), content_type='application/json')
        #print("GET: Session=", session_id, " Data=", sessions[session_id]);
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
        data = await request.text()
        #
        # data = data.decode("UTF-8")
        #print("POST: Data=", data)
        await session.rxq.put(data)
        response = aiohttp.web.Response(text='', status = 200)
    except asyncio.CancelledError:
        raise
    except Exception as e:
        print("POST: error", e)
        response = aiohttp.web.Response(text='Bad request', status = 400)
    return response

@Session.decorator
async def do_PUT(request, session):
    response = aiohttp.web.Response(text='Bad request', status = 400)
    return response

async def init_app():

    session_manager = Session.setup()

    app = aiohttp.web.Application()
    app.add_routes([aiohttp.web.get('/', do_GET),
                    aiohttp.web.get('/{file_path:.*}', do_GET_files),
                    aiohttp.web.post('/', do_POST),
                    aiohttp.web.put('/', do_PUT)])
    

    async def run_session_manager(app):
        asyncio.create_task(session_manager())

    app.on_startup.append(run_session_manager)

    return app

mimetypes.add_type('application/javascript', '.js')

if __name__ == '__main__':
    aiohttp.web.run_app(init_app(), host='127.0.0.1', port=8000)

