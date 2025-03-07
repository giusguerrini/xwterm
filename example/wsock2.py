#!/usr/bin/python3

import asyncio
import websockets
import pty
import os
import fcntl
import binascii
import struct
import termios
import json

DEFAULT_PORT=8765

DEFAULT_NLINES=40
DEFAULT_NCOLUMNS=120

CONSOLE_URL="/"
DATA_REQUEST_PARAM="console"
SET_SIZE_PARAM="size" # e.g. size=25x80
DEFAULT_URL="/example.html"

ws = False

async def main():


    async def new_shell():
        [pid, fd] = pty.fork()

        if pid == 0:
            os.execv("/bin/bash", ["bash"])

        flag = fcntl.fcntl(fd, fcntl.F_GETFD)
        fcntl.fcntl(fd, fcntl.F_SETFL, flag | os.O_NONBLOCK)

        def set_size(fd, li, co):
            s = struct.pack('HHHH', li, co, 0, 0)
            fcntl.ioctl(fd, termios.TIOCSWINSZ, s)

        set_size(fd, DEFAULT_NLINES, DEFAULT_NCOLUMNS)

        os.write(fd, bytes("\n", "UTF-8"))
        loop = asyncio.get_running_loop()

        wr = await loop.connect_write_pipe(asyncio.streams.FlowControlMixin, os.fdopen(fd, 'wb'))
        writer_transport, writer_protocol = wr;
        writer = asyncio.StreamWriter(writer_transport, writer_protocol, None, loop)

        reader = asyncio.StreamReader()
        protocol = asyncio.StreamReaderProtocol(reader)
        await loop.connect_read_pipe(lambda: protocol, os.fdopen(fd, 'rb'))

        return { "rd": reader, "wr": writer }


    async def read_from_process(ws, reader):
        try:
            while True:
                print("in ascolto da tty...")
                data = await reader.read(1000)
                if not data:
                    print("...nessun dato")
                    break
                try:
                    d = data.decode()
                    print(f"Ricevuto: {d}")
                    js = json.dumps({ 'text': d })
                    print(f"Invio di: {js}")
                    await ws.send(js)
                    print(f"Inviato")
                except Exception as e:
                    print(e)
        except Exception as e:
            print(e)

    async def ws_handler_core(websocket, path, writer):
        async for message in websocket:
            print(f">> {message}")
            try:
                d = json.loads(message)
                writer.write(d['text'].encode())
                await writer.drain()
            except Exception as e:
                print(e)


    async def ws_handler(ws, path):
        rw = await new_shell()
        await asyncio.gather(read_from_process(ws, rw["rd"]), ws_handler_core(ws, path, rw["wr"]))


    async def server():
        async with websockets.serve(ws_handler, "127.0.0.1", DEFAULT_PORT):
            await asyncio.Future()

    await server()

if __name__ == "__main__":
    asyncio.run(main())

