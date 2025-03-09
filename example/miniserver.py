#!/usr/bin/python3

# Miniserver. Requires aiohttp (pip install aiohttp)

import os
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
    import fcntl
    import pty
    import termios
    import signal
except:
    pass

DEFAULT_NLINES=40
DEFAULT_NCOLUMNS=120

CONSOLE_URL="/"
DATA_REQUEST_PARAM="console"
SET_SIZE_PARAM="size" # e.g. size=25x80
DEFAULT_URL="/example.html"

# Linux only
def set_size(fd, li, co):
    try:
        s = struct.pack('HHHH', li, co, 0, 0)
        fcntl.ioctl(fd, termios.TIOCSWINSZ, s)
    except:
        pass

class AyncJob:

    def __init__(self, name="?", on_task_termination=None, terminate_on_first_competed=False, *tasklist):
        self.on_task_termination = on_task_termination
        self.terminate_on_first_competed = terminate_on_first_competed
        self.name = name
        self.signal_q = asyncio.Queue()
        self.tasks = set()
        self.listener = asyncio.create_task(self.listen())
        self.tasks.append(self.listener)
        for t in tasklist:
            self.tasks.add(t)

    async def listen(self):
        print("Job ", self.name, ": waiting for signal")
        ok = await self.signal_q.get()
        print("Job ", self.name, ": got signal ", ok)
        return ok
    
    async def job(self):

        while True:
            print("Job ", self.name, ": waiting for tasks")
            
            tasks = list(self.tasks)
            tasks.append(self.listener)

            done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)

            print("Job ", self.name, ": ", len(done), " completed, ", len(pending), " pending")

            end = False

            for task in done:
                result = await task
                if task == self.listener:
                    print("Job ", self.name, ": got signal ", result)
                    self.listener = asyncio.create_task(self.listen())
                    end = not result
                else:
                    self.tasks.remove(task)
                    if self.on_task_termination:
                        self.on_task_termination(task)
                    if self.terminate_on_first_competed:
                        end = True
                
            if end:
                print("Job ", self.name, ": terminating...")
                for task in pending:
                    print(" ...cancel ", task)
                    task.cancel()
                    await task            
                print("Job ", self.name, ": terminated")
                break


    async def add(self, task):
        self.tasks.add(task)
        await self.signal_q.put(True)

    

class Shell:
    def  __init__(process):
        process.pid = None
        process.proc = None
        process.fd = None
        process.rd = None
        process.wr = None
        process.err = None
        process.kill = None

class Session:
    def  __init__(self, sid, process):
        self.sid = sid
        self.process = process
        self.visited =  False
        self.rxq = asyncio.Queue()
        self.txq = asyncio.Queue()
        self.last_visited = time.time()
        self.task = None


# Platoform-specific shell process management

async def new_shell_linux():
    [pid, fd] = pty.fork()

    if pid == 0:
        os.execv("/bin/bash", ["bash"])

    flag = fcntl.fcntl(fd, fcntl.F_GETFD)
    fcntl.fcntl(fd, fcntl.F_SETFL, flag | os.O_NONBLOCK)

    set_size(fd, DEFAULT_NLINES, DEFAULT_NCOLUMNS)

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
        except:
            pass
        try:
            os.close(fd)
        except:
            pass

    process = Shell()
    process.pid = pid
    process.proc = None
    process.fd = fd
    process.rd = reader
    process.wr = writer
    process.err = None
    process.kill = end_shell

    return process

async def new_shell_windows():
    cmd = ["cmd.exe", "/a"];

    #stdout, stderr = proc.communicate()

    loop = asyncio.get_running_loop()

    proc = await asyncio.create_subprocess_exec(*cmd, stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    reader = proc.stdout
    reader_err = proc.stderr
    writer = proc.stdin

    async def end_shell():
        try:
            proc.proc.kill()
        except:
            pass
        try:
            await proc.proc.wait()
        except:
            pass

    process = Shell()
    process.pid = None
    process.proc = proc
    process.fd = None
    process.rd = reader
    process.wr = writer
    process.err = reader_err
    process.kill = end_shell

    return process

async def new_shell():
    print("New shell...")
    if platform.system() == "Linux":
        return await new_shell_linux()
    else:
        return await new_shell_windows()

async def end_shell(session):
    try:
        await session.process.kill()
    except:
        pass

async def close_session(session):
    await end_shell(session)
    try:
        del sessions[session.sid]
    except:
        pass


async def read_from_process(session, reader):
    try:
        txq = session.txq
        while True:
            data = await reader.read(1000)
            if not data:
                break
            try:
                d = data.decode()
                #print(f"From shell: {d}")
                #js = json.dumps({ 'text': d })
                #print(f"To remote: {js}")
                await txq.put(d)
            except Exception as e:
                print(e)
    except Exception as e:
        print(e)
    print("Session ", session.sid, ": stdout/stderr closing...")

async def write_to_process(session):
    rxq = session.rxq
    #print(f"Writer connected to {rxq}")
    writer = session.process.wr
    while True:
        message = await rxq.get()
        #print(f">> {message}")
        try:
            t = ''
            try:
                d = json.loads(message)
                t = d['text']
            except:
                t = message
            if t != '':
                writer.write(t.encode())
                await writer.drain()
        except Exception as e:
            print(e)
            break
    print("Session ", session.sid, ": stdin closing...")


async def session_core(session):

    print("Session ", session.sid, ": starting I/O tasks")
    proc = session.process

    tasks = list()

    tasks.append(asyncio.create_task(read_from_process(session, proc.rd)))
    tasks.append(asyncio.create_task(write_to_process(session)))
    if proc.err:
        tasks.append(asyncio.create_task(read_from_process(session, proc.err)))

    done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)

    print("Session core: ", len(done), " completed, ", len(pending), " pending")

    try:
        for task in pending:
            print(" cancel ", task)
            task.cancel()
    except Exception as e:
        print(e)
        
    print(" end_shell")

    await end_shell(session)
    #await close_session(session)

    print("Session ", session.sid, ": exiting")



# Session dictionary
sessions = {}
session_task_queue = asyncio.Queue()
session_tasks = set()

async def session_manager(request):
    session_id = request.cookies.get('session_id')

    #print("Receive session ID: ", session_id or "");
    if session_id and session_id in sessions:
        # Existing session
        #print("Existing session: ", session_id);
        session = sessions[session_id]
    else:
        # New session
        session_id = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
        print("New session: ", session_id);
        shell = await new_shell()
        session = Session(session_id, shell)
        sessions[session_id] = session
        task = asyncio.create_task(session_core(session))
        task.add_done_callback(session_tasks.discard)
        session.task = task
        empty = not session_tasks
        session_tasks.add(task)
        await session_task_queue.put(True)

    session.last_visited = time.time()

    return session

async def session_task_listener():
    print("Session task listener: waiting for signal")
    ok = await session_task_queue.get()
    print("Session task listener: got signal ", ok)
    return ok


async def session_task_scheduler():
    print("Session task scheduler: started")
    
    listener = asyncio.create_task(session_task_listener())
    
    while True:
        print("Session task scheduler: waiting for tasks")
        tasks = list(session_tasks)
        tasks.append(listener)
        done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        if listener in done:
            ok = await listener
            listener = asyncio.create_task(session_task_listener())

        print("Session task scheduler: ", len(done), " completed, ", len(pending), " pending")
        print("Session task scheduler: got signal ", ok, " from listener")
        if not ok:
            break

async def session_task_terminate():
    print("Session task scheduler: closing...")

    async def cancel(task):
        print("Closing task ", task, "...")
        try:
            task.cancel()
            await task
        except:
            pass
        print("...done")

    #{ cancel(x) for x in session_tasks }
    for task in session_tasks:
        cancel(task)

    print("Session task scheduler: closed")


session_cleaner_task = None

async def session_cleaner():
    print("Session cleaner started")
    while True:
        await asyncio.sleep(10)
        print("Session cleaner loop")
        s = sessions.copy()
        for session_id in s:
            session = sessions[session_id]
            if (time.time() - session.last_visited > 30):
                print("Session ", session.sid, ": timeout -- closing...")
                await close_session(session)
                try:
                    session.task.cancel()
                    await session.task
                except:
                    pass
                print("Session ", session.sid, ": closed")

async def session_cleaner_terminate():
    print("Session  cleaner: closing...")
    try:
        session_cleaner_task.cancel()
        await session_cleaner_task
    except:
        pass
    print("Session cleaner: closed")



# This decorator adds session management to the core request logic.
# Core function receive session ID and session data as additional parameters.
def session_decorator(fn):
    async def wrapper(request):
        if False:
            print("Request:")
            print(" Method:", request.method)
            print(" URL:", request.url)
            print(" Headers:", request.headers)
            print(" Cookies:", request.cookies)
            print(" Query String:", request.query_string)
            print(" Query Parameters:", request.query)
        session = await session_manager(request)
        response = await fn(request, session)
        response.set_cookie('session_id', session.sid, path='/')
        if False:
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
        if mime_type is None:
            mime_type = 'application/octet-stream'
    response = aiohttp.web.Response(body=content, content_type=mime_type)
    return response

@session_decorator
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
                    set_size(session.process.fd, li, co)
            except Exception as e:
                print(e)

        text = "";
        if not session.visited:
            text = "Session ID = " + session.sid + "\r\n"
            session.visited = True;
        #response = aiohttp.web.Response(text=f'Visits: {session_data["visits"]}')
        try:
            while True:
                t = session.txq.get_nowait()
                if t == "":
                    break
                text += t
            text = text.decode('utf-8')
        except:
            pass
        response = aiohttp.web.Response(body=json.dumps({ 'text': text }), content_type='application/json')
        #print("GET: Session=", session_id, " Data=", sessions[session_id]);
    else:
        response = await get_files(request, session)

    return response



@session_decorator
async def do_GET_files(request, session):
    return await get_files(request, session)

@session_decorator
async def do_POST(request, session):
    #print("POST: Session=", session.sid);
    try:
        data = await request.text()
        #
        # data = data.decode("UTF-8")
        #print("POST: Data=", data)
        await session.rxq.put(data)
        response = aiohttp.web.Response(text='', status = 200)
    except Exception as e:
        print("POST: error", e)
        response = aiohttp.web.Response(text='Bad request', status = 400)
    return response

@session_decorator
async def do_PUT(request, session):
    response = aiohttp.web.Response(text='Bad request', status = 400)
    return response

async def init_app():
    app = aiohttp.web.Application()
    app.add_routes([aiohttp.web.get('/', do_GET),
                    aiohttp.web.get('/{file_path:.*}', do_GET_files),
                    aiohttp.web.post('/', do_POST),
                    aiohttp.web.put('/', do_PUT)])
    
    scheduler = None
    async def start_scheduler(app):
        scheduler = asyncio.create_task(session_task_scheduler())
    async def stop_scheduler(app):
        scheduler.cancel()
        await scheduler

    app.on_startup.append(start_scheduler)
    app.on_cleanup.append(stop_scheduler)

    async def start_cleaner(app):
        session_cleaner_task = asyncio.create_task(session_cleaner())
    async def stop_cleaner(app):
        session_cleaner.cancel()
        await session_cleaner_task

    app.on_startup.append(start_cleaner)
    app.on_cleanup.append(stop_cleaner)

    return app

if __name__ == '__main__':
    aiohttp.web.run_app(init_app(), host='127.0.0.1', port=8000)

