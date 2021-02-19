
const socket = io();
var p2pConn;

$('#vidCall').on('click', () => {
    socket.emit('vidCall');
    getUserPermission();
});

$('#voiceCall').on('click', () => {
    socket.emit('voiceCall');
});

socket.on('offer', (id, desc) => {
    var config = {
        'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]
    };
    p2pConn = RTCPeerConnection(config);
    console.log("RTCPeerConnection object created");
    p2pConn.setRemoteDescription(desc)
    .then(() => p2pConn.createAnswer())
    .then(sdp => p2pConn.setRemoteDescription(sdp))
    .then(() => {
        socket.emit('answer', id, p2pConn.localDesciption);
    })
    p2pConn.ontrack = event => {
        video.srcObject = event.streams[0];
    };
    p2pConn.onicecandidate = event => {
        if(event.candidate) {
            socket.emit('candidate', id, event);
        }
    };
});