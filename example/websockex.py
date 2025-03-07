#!/usr/bin/python3

import os
import platform 
import asyncio
import websockets
import binascii
import struct
import json
try:
    import fcntl
    import pty
    import termios
except:
    pass

DEFAULT_PORT=8765

DEFAULT_NLINES=40
DEFAULT_NCOLUMNS=120

CONSOLE_URL="/"
DATA_REQUEST_PARAM="console"
SET_SIZE_PARAM="size" # e.g. size=25x80
DEFAULT_URL="/example.html"

ws = False

async def main():


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

        return { "rd": reader, "wr": writer }

    async def new_shell_windows():
        cmd = ["cmd.exe", "/a"];

        #stdout, stderr = proc.communicate()

        loop = asyncio.get_running_loop()

        proc = await asyncio.create_subprocess_exec(*cmd, stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        reader = proc.stdout
        reader_err = proc.stderr
        writer = proc.stdin

        return { "rd": reader, "wr": writer, "err": reader_err }

    async def new_shell():
        print("New shell...")
        if platform.system() == "Linux":
            return await new_shell_linux()
        else:
            return await new_shell_windows()


    async def read_from_process(ws, reader):
        try:
            while True:
                data = await reader.read(1000)
                if not data:
                    break
                try:
                    d = data.decode()
                    print(f"From shell: {d}")
                    js = json.dumps({ 'text': d })
                    print(f"To remote: {js}")
                    await ws.send(js)
                except Exception as e:
                    print(e)
        except Exception as e:
            print(e)

    async def ws_handler_core(websocket, writer):
        async for message in websocket:
            print(f">> {message}")
            try:
                d = json.loads(message)
                writer.write(d['text'].encode())
                await writer.drain()
            except Exception as e:
                print(e)


    async def ws_handler(ws):
        rw = await new_shell()
        if "err" in rw:
            await asyncio.gather(read_from_process(ws, rw["rd"]), ws_handler_core(ws, rw["wr"]), read_from_process(ws, rw["err"]))
        else:
            await asyncio.gather(read_from_process(ws, rw["rd"]), ws_handler_core(ws, rw["wr"]))


    async def server():
        async with websockets.serve(ws_handler, "127.0.0.1", DEFAULT_PORT):
            await asyncio.Future()

    await server()

if __name__ == "__main__":
    asyncio.run(main())

