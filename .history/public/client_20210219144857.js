const roomSelectionContainer = document.getElementById('room-selection-container')
const roomInput = document.getElementById('room-input')
const connectButton = document.getElementById('connect-button')

const videoChatContainer = document.getElementById('video-chat-container')
const localVideoComponent = document.getElementById('local-video')
const remoteVideoComponent = document.getElementById('remote-video')

const socket = io()
const mediaConstraints = {
    audio: true,
    video: false //{ width: 1280, height: 720 },
}
let localStream
let remoteStream
let isRoomCreator
let rtcPeerConnection // Connection between the local device and the remote peer.
let roomId
let inRoom = false;

// Free public STUN servers provided by Google.
const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // { urls: 'stun:stun1.l.google.com:19302' },
        // { urls: 'stun:stun2.l.google.com:19302' },
        // { urls: 'stun:stun3.l.google.com:19302' },
        // { urls: 'stun:stun4.l.google.com:19302' },
    ],
}

// BUTTON LISTENER 
connectButton.addEventListener('click', () => {
    joinRoom(roomInput.value)
})

// SOCKET EVENT CALLBACKS 
socket.on('room_created', async () => {
    console.log('Socket event callback: room_created')

    await setLocalStream(mediaConstraints)
    inRoom = true;
    isRoomCreator = true
})

socket.on('room_joined', async () => {
    console.log('Socket event callback: room_joined')

    await setLocalStream(mediaConstraints)
    socket.emit('start_call', roomId)
    inRoom = true;
})

socket.on('full_room', () => {
    console.log('Socket event callback: full_room')

    alert('The room is full, please try another one')
})

// FUNCTIONS
function joinRoom(room) {
    if (room === '') {
        alert('Please type a room ID')
    } else {
        roomId = room
        socket.emit('join', room)
        showVideoConference()
    }
}

function showVideoConference() {
    roomSelectionContainer.style = 'display: none'
    videoChatContainer.style = 'display: block'
}

async function setLocalStream(mediaConstraints) {
    let stream
    try {
        stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
    } catch (error) {
        console.error('Could not get user media', error);
        alert('Media devices not present');
    }

    localStream = stream
    localVideoComponent.srcObject = stream
}

// SOCKET EVENT CALLBACKS =====================================================
socket.on('start_call', async () => {
    console.log('Socket event callback: start_call')

    if (isRoomCreator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        addLocalTracks(rtcPeerConnection)
        rtcPeerConnection.ontrack = setRemoteStream
        rtcPeerConnection.onicecandidate = sendIceCandidate
        await createOffer(rtcPeerConnection)
    }
})

socket.on('webrtc_offer', async (event) => {
    console.log('Socket event callback: webrtc_offer')

    if (!isRoomCreator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        addLocalTracks(rtcPeerConnection)
        rtcPeerConnection.ontrack = setRemoteStream
        rtcPeerConnection.onicecandidate = sendIceCandidate
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
        await createAnswer(rtcPeerConnection)
    }
})

socket.on('webrtc_answer', (event) => {
    console.log('Socket event callback: webrtc_answer')
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
})

socket.on('webrtc_ice_candidate', (event) => {
    console.log('Socket event callback: webrtc_ice_candidate')

    // ICE candidate configuration.
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate,
    })
    rtcPeerConnection.addIceCandidate(candidate)
})

// FUNCTIONS ==================================================================
function addLocalTracks(rtcPeerConnection) {
    localStream.getTracks().forEach((track) => {
        rtcPeerConnection.addTrack(track, localStream)
    })
}

async function createOffer(rtcPeerConnection) {
    let sessionDescription
    try {
        sessionDescription = await rtcPeerConnection.createOffer()
        rtcPeerConnection.setLocalDescription(sessionDescription)
    } catch (error) {
        console.error(error)
    }

    socket.emit('webrtc_offer', {
        type: 'webrtc_offer',
        sdp: sessionDescription,
        roomId,
    })
}

async function createAnswer(rtcPeerConnection) {
    let sessionDescription
    try {
        sessionDescription = await rtcPeerConnection.createAnswer()
        rtcPeerConnection.setLocalDescription(sessionDescription)
    } catch (error) {
        console.error(error)
    }

    socket.emit('webrtc_answer', {
        type: 'webrtc_answer',
        sdp: sessionDescription,
        roomId,
    })
}

function setRemoteStream(event) {
    remoteVideoComponent.srcObject = event.streams[0]
    remoteStream = event.stream
}

function sendIceCandidate(event) {
    if (event.candidate) {
        socket.emit('webrtc_ice_candidate', {
            roomId,
            label: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate,
        })
    }
}

//to tell server user left from a specified room
window.addEventListener('beforeunload', event => {
    if(inRoom) {
        socket.emit('leave', roomId);
    }    
});

//hide remote video on leave
socket.on('leave', () => {
    remoteVideoComponent.toggleClass('show-remote-vid')
});

// const socket = io();
// var p2pConn;

// $('#vidCall').on('click', () => {
//     socket.emit('vidCall');
//     getUserPermission();
// });

// $('#voiceCall').on('click', () => {
//     socket.emit('voiceCall');
// });

// socket.on('offer', (id, desc) => {
//     var config = {
//         'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]
//     };
//     p2pConn = RTCPeerConnection(config);
//     console.log("RTCPeerConnection object created");
//     p2pConn.setRemoteDescription(desc)
//     .then(() => p2pConn.createAnswer())
//     .then(sdp => p2pConn.setRemoteDescription(sdp))
//     .then(() => {
//         socket.emit('answer', id, p2pConn.localDesciption);
//     })
//     p2pConn.ontrack = event => {
//         video.srcObject = event.streams[0];
//     };
//     p2pConn.onicecandidate = event => {
//         if(event.candidate) {
//             socket.emit('candidate', id, event);
//         }
//     };
// });