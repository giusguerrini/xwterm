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


class Shell:
    def  __init__(process):
        pass

class Session:
    def  __init__(self, sid, process):
        self.sid = sid
        self.process = process
        self.visited =  False
        self.rxq = asyncio.Queue()
        self.txq = asyncio.Queue()


# Platoform-specific shell process management

async def new_shell_linux():
    [pid, fd] = pty.fork()

    if pid == 0:
        os.execv("/bin/bash", ["bash"])

    flag = fcntl.fcntl(fd, fcntl.F_GETFD)
    fcntl.fcntl(fd, fcntl.F_SETFL, flag | os.O_NONBLOCK)

    def set_size(fd, li, co):
        s = struct.pack('HHHH', li, co, 0, 0)
        #fcntl.ioctl(fd, termios.TIOCSWINSZ, s)

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
    process.proc = proc
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
        del sessions[session]
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
                print(f"From shell: {d}")
                #js = json.dumps({ 'text': d })
                #print(f"To remote: {js}")
                await txq.put(d)
            except Exception as e:
                print(e)
    except Exception as e:
        print(e)
        await close_session(session)

async def write_to_process(session):
    rxq = session.rxq
    print(f"Writer connected to {rxq}")
    writer = session.process.wr
    async for message in rxq:
        print(f">> {message}")
        try:
            t = ''
            try:
                d = json.loads(message)
                t = d['text']
            except:
                pass
            if t != '':
                writer.write(t.encode())
                await writer.drain()
        except Exception as e:
            print(e)
            await close_session(session)


async def session_core(session):
    proc = session.process
    if proc.err:
        print("Windows")
        await asyncio.gather(read_from_process(session, proc.rd),
                             write_to_process(session),
                             read_from_process(session, proc.err),
                             return_exceptions=True)
    else:
        print("Linux")
        await asyncio.gather(read_from_process(session, proc.rd),
                             write_to_process(session),
                             return_exceptions=True)

import asyncio

session_tasks = set()


# Session dictionary
sessions = {}

async def session_manager(request):
    session_id = request.cookies.get('session_id')

    print("Receive session ID: ", session_id or "");
    if session_id and session_id in sessions:
        # Existing session
        print("Existing session: ", session_id);
        session = sessions[session_id]
    else:
        # New session
        session_id = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
        print("New session: ", session_id);
        shell = await new_shell()
        session = Session(session_id, shell)
        sessions[session_id] = session
        task = asyncio.create_task(session_core(session))
        session_tasks.add(task)
        task.add_done_callback(session_tasks.discard)

    return session

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

@session_decorator
async def do_GET(request, session):
    print("GET: Session=", session.sid);
    text = "";
    if not session.visited:
        text = "Session ID = " + session.sid + "\r\n"
        session.visited = True;
    #response = aiohttp.web.Response(text=f'Visits: {session_data["visits"]}')
    try:
        text += session.txq.get_nowait()
    except:
        pass
    response = aiohttp.web.Response(body=json.dumps({ 'text': text }), content_type='application/json')
    #print("GET: Session=", session_id, " Data=", sessions[session_id]);
    return response

@session_decorator
async def do_GET_files(request, session):
    file_path = request.match_info.get('file_path', 'index.html')
    if os.path.exists(file_path):
        with open(file_path, 'rb') as file:
            content = file.read()
        mime_type, _ = mimetypes.guess_type(file_path)
        if mime_type is None:
            mime_type = 'application/octet-stream'
    response = aiohttp.web.Response(body=content, content_type=mime_type)
    return response

@session_decorator
async def do_POST(request, session):
    print("POST: Session=", session.sid);
    try:
        data = await request.text()
        #
        # data = data.decode("UTF-8")
        print("POST: Data=", data)
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
    return app

if __name__ == '__main__':
    aiohttp.web.run_app(init_app(), host='127.0.0.1', port=8000)

