
const socket = io();

$('#vidCall').on('click', () => {
    socket.emit('vidCall');
})

$('#voiceCall').on('click', () => {
    socket.emit('voiceCall');
})