#!/usr/bin/python3

import http.server
import socketserver
import pty
import os
import fcntl
import binascii
import struct
import termios
import json

DEFAULT_PORT=8000

DEFAULT_NLINES=40
DEFAULT_NCOLUMNS=120

CONSOLE_URL="/"
DATA_REQUEST_PARAM="console"
SET_SIZE_PARAM="size" # e.g. size=25x80
DEFAULT_URL="/example.html"


from http.server import HTTPServer
from http.server import BaseHTTPRequestHandler

class CallbackHTTPServer(HTTPServer):

    def server_activate(self):
        HTTPServer.server_activate(self)

    def server_close(self):
        HTTPServer.server_close(self)


# HTTP request handler
class HttpHandler(BaseHTTPRequestHandler):

    def do_POST(self):
        length = int(self.headers.get('content-length'))
        field_data = self.rfile.read(length)
        fields = field_data.decode("UTF-8")
 
        self.send_response(200, "OK")
        self.end_headers()

    def do_GET(self):
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
                except Exception as e:
                    print(e)

            if DATA_REQUEST_PARAM in params or not get_file:
                get_file = False

                self.send_response(200, "OK")
                self.send_header('Content-type', 'application/json')
                self.send_header('Accept', 'application/json')
                self.end_headers()

                self.wfile.write(bytes("\n", "UTF-8"))

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

