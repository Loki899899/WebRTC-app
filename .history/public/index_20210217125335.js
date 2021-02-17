const socket = io();

const click = document.getElementById('btn');

// function hasUserMedia() {
//     console.warn(navigator.getUserMedia)
//     return navigator.getUserMedia;
// }

function hasUserMedia() { 
    //check if the browser supports the WebRTC 
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || 
       navigator.mozGetUserMedia); 
 } 
 

if(hasUserMedia()) {
    console.log('got the devices');
}
else {
    console.log('not supported');
}

socket.emit('clicked');