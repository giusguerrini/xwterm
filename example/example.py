#!/usr/bin/python3

import http.server
import socketserver
import pty
import os
import fcntl
import binascii
import struct
import termios

DEFAULT_PORT=8000

DEFAULT_NLINES=80
DEFAULT_NCOLUMNS=120

CONSOLE_URL="/"
DATA_REQUEST_PARAM="console"
SET_SIZE_PARAM="size" # es. size=25x80
DEFAULT_URL="/example.html"


#[master, slave ] pty.openpty()
[pid, fd ] = pty.fork()

if pid == 0:
    os.execv("/bin/bash", ["bash"])

flag = fcntl.fcntl(fd, fcntl.F_GETFD)
fcntl.fcntl(fd, fcntl.F_SETFL, flag | os.O_NONBLOCK)

def set_size(fd, li, co):
    s = struct.pack('HHHH', li, co, 0, 0)
    fcntl.ioctl(fd, termios.TIOCSWINSZ, s)

set_size(fd, DEFAULT_NLINES, DEFAULT_NCOLUMNS)

#os.write(fd, bytes("echo ciao $$; pwd; n=1; ###while : ; do sleep 1; echo $n; n=$[$n+1]; done\n", "UTF-8"))
#os.write(fd, bytes("\necho -en '\\x1b[19t'\n", "UTF-8"))
#os.write(fd, bytes("\nresize\n", "UTF-8"))
os.write(fd, bytes("\n", "UTF-8"))


#whileTrue:
#l = os.read(fd, 1)
#os.write(1, l)

#Handler= http.server.SimpleHTTPRequestHandler



#withsocketserver.TCPServer(("", PORT), Handler) as httpd:
#print("serving at port", PORT)
#httpd.serve_forever()

from http.server import HTTPServer
from http.server import BaseHTTPRequestHandler

#Subclass HTTPServer with some additional callbacks
class CallbackHTTPServer(HTTPServer):

    def server_activate(self):
        #self.RequestHandlerClass.pre_start()
        HTTPServer.server_activate(self)
        #self.RequestHandlerClass.post_start()

    def server_close(self):
        #self.RequestHandlerClass.pre_stop()
        HTTPServer.server_close(self)
        #self.RequestHandlerClass.post_stop()


# HTTP request handler
class HttpHandler(BaseHTTPRequestHandler):

#    @classmethod
#    def pre_start(cls):
#        print('Before calling socket.listen()')
#
#    @classmethod
#    def post_start(cls):
#        print('After calling socket.listen()')
#
#    @classmethod
#    def pre_stop(cls):
#        print('Before calling socket.close()')
#
#    @classmethod
#    def post_stop(cls):
#        print('After calling socket.close()')

    def do_POST(self):
        #print("I have just received an HTTP POST request")
        length = int(self.headers.get('content-length'))
        field_data = self.rfile.read(length)
        fields = field_data.decode("UTF-8")
        #print("Tasti ricevuti: ", fields)
        try:
            #d = fields["data"]
            d = field_data
            os.write(fd, d)
        except Exception as e:
            print(e)
        self.send_response(200, "OK")
        self.end_headers()

    def do_GET(self):
        #print("I have just received an HTTP GET request", self.path)
        url = self.path.split("?")
        if len(url) == 1:
            url.append("")

        params = dict()
        for p in url[1].split("&"):
            a = p.split("=")
            if len(a) == 1:
                a.append("")
            params[a[0]] = a[1]


        get_file = True

        #print(url, params)

        if url[0] == CONSOLE_URL:

            url[0] = DEFAULT_URL

            if SET_SIZE_PARAM in params:
                get_file = False
                try:
                    sz = params[SET_SIZE_PARAM].split("x")
                    if len(sz) >= 2:
                        li = int(sz[0])
                        co = int(sz[1])
                        set_size(fd, li, co)
                except Exception as e:
                    print(e)

            if DATA_REQUEST_PARAM in params or not get_file:
                get_file = False

                self.send_response(200, "OK")
                self.send_header('Content-type', 'application/json')
                self.send_header('Accept', 'application/json')
                self.end_headers()
                s = '{\n"text" : \"'
                b = []
                n = 0;
                while True:
                    try:
                        c = os.read(fd, 1)
                        n = n + 1
                        if n > 2000:
                            break
                    except Exception as e:
                        #print(e)
                        break
                    b = b + [c]
                    #print(b)
                #print(b)
                try:
                    for c in b:
                        s = s + "\\u" + "{:04x}".format(int.from_bytes(c, byteorder='big'))
                        #s = s + "\\x" + str(c)
                except Exception as e:
                    print(e)
                s = s + '\"\n}\n'
                self.wfile.write(bytes(s, "UTF-8"))

        if get_file:
            try:
                with open(url[0][1:], "rb") as f:
                    enc = ''
                    #enc = 'UTF-8'
                    self.send_response(200, "OK")
                    if self.path.endswith("html"):
                        self.send_header('Content-type', 'text/html')
                    elif self.path.endswith(".js"):
                        self.send_header('Content-type', 'text/javascript')
                    elif self.path.endswith(".css"):
                        self.send_header('Content-type', 'text/css')
                    elif self.path.endswith(".ico"):
                        self.send_header('Content-type', 'image/x-icon')
                        enc = ''
                    else:
                        self.send_header('Content-type', 'text/html')
                    self.end_headers()
                    l = f.read()
                    if enc == '':
                        self.wfile.write(l)
                    else:
                        try:
                            self.wfile.write(bytes(l, enc))
                        except Exception as e:
                            print(e)
            except Exception as e:
                print(e)
                self.send_response(404)
                pass



def main():

    # Create server
    try:
        print("Creating server")
        server = CallbackHTTPServer(('', DEFAULT_PORT), HttpHandler)
    except KeyboardInterrupt:
        print("Server creation aborted")
        return

    # Start serving
    try:
        print("Calling serve_forever()")
        server.serve_forever()
    except KeyboardInterrupt:
        print("Calling server.server_close()")
        server.server_close()


if __name__ == '__main__':
    main()

