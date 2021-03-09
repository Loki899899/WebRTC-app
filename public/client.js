//DOM elements
const roomSelectionContainer = $('#room-selection-container')
const roomInput = document.getElementById('room-input')
const connectButton = document.getElementById('connect-button')
const sSButton = document.getElementById('share-screen')
const videoChatContainer = $('#chat-room')
const localVideoComponent = document.getElementById('local-video')
const remoteVideoComponent = document.getElementById('remote-video')
const startCall = document.getElementById('video-call')
const shareOptions = document.getElementById('share-options')
const candidatesSelect = document.getElementById('candidates')
const userName = document.getElementById('user-name')
const dropdown = document.getElementsByClassName("dropdown")[0]
const presenterElement = document.getElementById('presenter')
const presenterBtn = document.getElementById('presenter-changer')

const socket = io()
const mediaConstraints = {
    audio: true,
    video: true //{ width: 1280, height: 720 },
}

let userId             // user ID of every user in room
let sSFlag = false     // flag to toggle screen Sharing
let localStream        // the local stream to be shown on the sneder
let remoteStream       // the remote stream to be shown to other peers
let isRoomCreator      // var to now if a user is creator 
let rtcPeerConnection  // Connection between the local device and the remote peer.
let roomId             // room Id of a room peer is connected to
let presenter          // var to change presenter in a room when screen sharing
let attendees          // var to know attendees in a room
let joined = false     // used for changing display on video stop when user leaves
let streamIsLive = false
let hasDevices = true

// Free public STUN servers provided by Google.
const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // { urls: 'stun:stun1.l.google.com:19302' },
        // { urls: 'stun:stun2.l.google.com:19302' },
        // { urls: 'stun:stun3.l.google.com:19302' },
        // { urls: 'stun:stun4.l.google.com:19302' },
    ]
}

// LISTENERS

// triggered when Connect button is clicked
connectButton.addEventListener('click', () => {
    joinRoom(roomInput.value)
})

// triggered when Share Screen button is clicked
// also checks if a user is presenter or not and does screen sharing accordingly
sSButton.addEventListener('click', async () => {
    console.log('presenter = ' + presenter + ' user = ' + userId)
    if(presenter != userId) {
        alert("Ask for Sharing rights first")
    }
    else {
        sSFlag = true
        await setLocalStream(mediaConstraints)
        if(hasDevices) {
            socket.emit('start_call', roomId)    
        }        
    }    
})

// triggered when Video Call button is clicked or Screen is shrared
startCall.addEventListener('click', async () => {
    await setLocalStream(mediaConstraints)
    if(hasDevices) {
        socket.emit('start_call', roomId)    
    }        
})

// triggered when Creator clicks on more options (downward arrow)
// displays options for creator
shareOptions.addEventListener('click', () => {
    document.getElementsByClassName('dropdown-items')[0].style.display = 'grid';
})

// triggered when a new presenter is granted permission
// grants the selected attendee the rights to share screen
presenterBtn.addEventListener('click', () => {
    presenter.textContent = candidatesSelect.value
    presenter = candidatesSelect.value
    socket.emit('presenter-change', {
        presenter,
        roomId
    })
    console.log(presenter)
    console.log('presenter changed')
}, false)

// Use to close sockets and let server know when a peer leaves
window.addEventListener('beforeunload', event => {
    if(joined) {
        socket.emit('leave', roomId, userId);
    }
    socket.close();    
});

// SOCKET EVENT CALLBACKS =====================================================
socket.on('room_created', async () => {
    console.log('Socket event callback: room_created')
    // await setLocalStream(mediaConstraints)
    joined = true
    isRoomCreator = true
    presenter = userId
    socket.emit('presenter-change', {
        presenter,
        roomId
    })
    showVideoConference()
})

socket.on('username-taken', () => {
    alert("username already taken")
})

socket.on('room_joined', async () => {
    console.log('Socket event callback: room_joined')
    dropdown.style.display = 'none'
    joined = true;
    showVideoConference()
    socket.emit('start_call', roomId)
})

socket.on('full_room', () => {
    console.log('Socket event callback: full_room')
    alert('The room is full, please try another one')
})

socket.on('attendee-update', (attendee) => {
    // console.log(attendee)
    // console.log('updating list')
    attendees = attendee
    newOption = document.createElement('option')
    newOption.value = attendee[attendee.length-1]
    newOption.textContent = attendee[attendee.length-1]
    candidatesSelect.appendChild(newOption)
})

socket.on('presenter-change', newPresenter => {
    if(streamIsLive) {
        stopVideoStream()
        streamIsLive = false
    }
    //console.log('pre '+presenter + 'user '+ userId)
    if(remoteVideoComponent.srcObject != null) {
        //console.log('not yet changed')
        remoteVideoComponent.srcObject = null
    }
    presenter = newPresenter 
    presenterElement.textContent = presenter   
})

socket.on('start_call', async () => {
    console.log('Socket event callback: start_call')
    if (localStream) {
        if ((isRoomCreator || sSFlag)&& presenter==userId) {
            streamIsLive = true     
            rtcPeerConnection = new RTCPeerConnection(iceServers)
            addLocalTracks(rtcPeerConnection)  //to be checked later
            rtcPeerConnection.ontrack = setRemoteStream
            rtcPeerConnection.onicecandidate = sendIceCandidate
            await createOffer(rtcPeerConnection)
        }
    }
})

socket.on('webrtc_offer', async (event, currentPresenter) => {
    console.log('Socket event callback: webrtc_offer')    
    if(!remoteVideoComponent.srcObject) {
        console.log('did answer')
        if (!isRoomCreator || currentPresenter !=userId) {
            rtcPeerConnection = new RTCPeerConnection(iceServers)
            // if(sSFlag) {
            //     addLocalTracks(rtcPeerConnection)
            // }
            rtcPeerConnection.ontrack = setRemoteStream
            rtcPeerConnection.onicecandidate = sendIceCandidate
            rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
            await createAnswer(rtcPeerConnection)
        }
    }
    else {
        console.log('wasnt answerd')
    }
})

socket.on('webrtc_answer', (event) => {
    console.log(rtcPeerConnection)
    if(rtcPeerConnection.signalingState != 'stable' || presenter == userId) {
        console.log('recieved here')
        console.log('Socket event callback: webrtc_answer')
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
    }
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

socket.on('leave', () => {
    console.log('set remote disp none');    
    remoteVideoComponent.srcObject = null
});

// FUNCTIONS ==================================================================
function joinRoom(room) {
    if (room === '' || userName.value == '') {
        alert('Please type a room ID')
    } else{
        userId = userName.value
        roomId = room
        socket.emit('join', room, userName.value)        
    }
}

function showVideoConference() {
    roomSelectionContainer.toggleClass('disp-none');
    videoChatContainer.toggleClass('disp-none');
}

async function setLocalStream(mediaConstraints) {
    let stream
    try {
        if(sSFlag && presenter==userId) {
            stream = await navigator.mediaDevices.getDisplayMedia();
        }
        else if(!sSFlag) {
            stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
        }                
    } catch (error) {
        console.error('Could not get user media', error);
        alert('Media devices not present\nOr\nPermission Denied');     
        hasDevices = false   
    }

    localStream = stream
    localVideoComponent.srcObject = stream
}

function addLocalTracks(rtcPeerConnection) {
    localStream.getTracks().forEach((track) => {
        rtcPeerConnection.addTrack(track, localStream)
    })
}

function changePresenter() {
    presenter.textContent = candidatesSelect.value
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
        userId,
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

function stopVideoStream() {
    console.log('stopping stream')
    localVideoComponent.srcObject = null
    // remoteVideoComponent.srcObject = null    
    if(localStream.getVideoTracks()[0].readyState == 'live') {
        localStream.getTracks().forEach(track => track.stop())
    }    
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