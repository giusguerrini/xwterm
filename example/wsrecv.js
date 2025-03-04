
var socket = null;
function WebSocketExample()
{
	let do_it = () => {
	    s = JSON.stringify({ text: 'echo $$; date\r' });
	    socket.send(s);
	}

if (! socket) {
	socket = new WebSocket('ws://localhost:8765');
	socket.addEventListener('open', (event) => {
	    console.log('Connection open');
	    do_it();
	});

	socket.addEventListener('message', (event) => {
	    console.log('Messagge from server:', event.data);
	});

	socket.addEventListener('close', (event) => {
	    console.log('Connection closed');
		try {
	    socket.close();
		} catch {}
		socket = null;
	});

	socket.addEventListener('error', (event) => {
	    console.error('Error in WebSocket:', event);
		try {
	    socket.close();
		} catch {}
		socket = null;
	});
}
else {
	do_it();
}
}

