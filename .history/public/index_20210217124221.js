const socket = io();

const click = document.getElementById('btn');

socket.emit('clicked');