const socket = io();

const click = document.getElementById('btn');

function hasUserMedia() {
    console.warn(navigator.getUserMedia)
    return navigator.getUserMedia;
}

if(hasUserMedia()) {
    console.log('got the devices');
}
else {
    console.log('not supported');
}

socket.emit('clicked');