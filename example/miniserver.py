#!/usr/bin/python3
#
# Miniserver. Requires aiohttp (pip install aiohttp)

import os
import string
import random
import aiohttp
import aiohttp.web
import mimetypes

# Session dictionary
sessions = {}

def session_manager(request):
    session_id = request.cookies.get('session_id')

    print("Receive session ID: ", session_id or "");
    if session_id and session_id in sessions:
        # Existing session
        print("Existing session: ", session_id);
        session_data = sessions[session_id]
    else:
        # New session
        session_id = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
        print("New session: ", session_id);
        session_data = {'visits': 0}
        sessions[session_id] = session_data
    return session_id, session_data

# This decorator adds session management to the core request logic.
# Core function receive session ID and session data as additional parameters.
def session_decorator(fn):
    async def wrapper(request):
        print("Request:")
        print(" Method:", request.method)
        print(" URL:", request.url)
        print(" Headers:", request.headers)
        print(" Cookies:", request.cookies)
        print(" Query String:", request.query_string)
        print(" Query Parameters:", request.query)
        session_id, session_data = session_manager(request)
        response = await fn(request, session_id, session_data)
        response.set_cookie('session_id', session_id, path='/', samesite='none')
        print("Response:")
        print(" Headers:", response.headers)
        print(" Cookies:", response.cookies)
        return response
    return wrapper

@session_decorator
async def do_GET(request, session_id, session_data):
    print("GET: Session=", session_id, " Data=", sessions[session_id]);
    session_data['visits'] += 1
    response = aiohttp.web.Response(text=f'Visits: {session_data["visits"]}')
    print("GET: Session=", session_id, " Data=", sessions[session_id]);
    return response

@session_decorator
async def do_GET_files(request, session_id, session_data):
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
async def do_POST(request, session_id, session_data):
    response = aiohttp.web.Response(text=f'Visits: {session_data["visits"]}')
    return response

@session_decorator
async def do_PUT(request, session_id, session_data):
    response = aiohttp.web.Response(text=f'Visits: {session_data["visits"]}')
    return response

async def init_app():
    app = aiohttp.web.Application()
    app.add_routes([aiohttp.web.get('/', do_GET),
                    aiohttp.web.get('/{file_path:.*}', do_GET_files),
                    aiohttp.web.post('/post', do_POST),
                    aiohttp.web.put('/put', do_PUT)])
    return app

if __name__ == '__main__':
    aiohttp.web.run_app(init_app(), host='127.0.0.1', port=8000)

