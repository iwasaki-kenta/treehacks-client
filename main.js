import SocketIO from 'socket.io-client';

const socket = SocketIO('http://127.0.0.1:5000/data');
socket.on('connect', () => {
    console.log("Connected.")
    socket.emit('draw', 'test')
});

socket.on('preview', (data) => {
    console.log(data)
});