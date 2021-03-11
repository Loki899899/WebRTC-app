const userName = $('#user-name')
    room = $('#room-input')
    introPage = $('#room-selection-container')
    chatRoom = $('#chat-room-container')
    connectButton = $('#connect-button')
    localVideo = document.getElementById('local-video')
    videoContainer = document.getElementById('messages-container')
    socket = io.connect(window.location.origin)
    iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            // { urls: 'stun:stun1.l.google.com:19302' },
            // { urls: 'stun:stun2.l.google.com:19302' },
            // { urls: 'stun:stun3.l.google.com:19302' },
            // { urls: 'stun:stun4.l.google.com:19302' },
        ]
    }


let userId, roomId, localStream, users, peerConnections,
    remotevids = {}
    hasDevices = false,
    constraints = {
        audio: false,
        video: true
    }

// EVENT LISTERNERS====================================
connectButton.on('click', () => {
    joinRoom() 
})


// SOCKET EVENT CALLBACKS==============================
socket.on('room_created', () => {
    console.log('room created')
    checkDevices()
    showChatRoom()
})

socket.on('room_joined', () => {
    console.log('room joined')
    checkDevices()
    showChatRoom()
    setUpPeers()
})

socket.on('username-taken', () => {
    alert("username already taken")
})

socket.on('message', message => {
    switch(message.type) {
        case 'offer':    
            onOffer(message)         
            break;
        case 'answer':
            onAnswer(message)
            break;
        case 'onicecandidate':
            console.log(message)
                var candidate = new RTCIceCandidate({
                    sdpMLineIndex: message.label,
                    candidate: message.candidate,
                })
                peerConnections.addIceCandidate(candidate)
            break;
        default: 
            console.log('what!')
            break;
    }
})

socket.on('attendee-update', (attendees) => {
    console.log(attendees)
    users = attendees
    switch(attendees) {
        case 2: 
            // document.getElementById('vid-'+users[1]).setAttribute('class', 'twoVideos')
            // localVideo.setAttribute('class', 'twoVideos')
            // break;               ======================NEEDS WORK
        case 3: break;
        default: break;
    }
})

socket.on('hangup', (user) => {
    console.log(user + ' left')
})

// FUNCTIONS===========================================
// Checks if the user have media devices if yes then get video stream
function checkDevices() {    
    if(navigator.mediaDevices.getUserMedia) {        
        navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            localStream = stream
            localVideo.srcObject = stream
            //console.log(localStream)                       
        }).catch(() => {
            console.log('couldnt get media Devices')
        })
    } else {
        alert('Browser doesnt support WebRTC')
    }
}

// function to validate inputs and let server know someone has joined
function joinRoom() {
    if (room.val() === '' || userName.val() == '') {
        alert('Both fields are REQUIRED')
    } else{        
        userId = userName.val()
        roomId = room.val()        
        socket.emit('join', roomId, userId)        
    }    
}

// function to hide intro screen and show chat room
function showChatRoom() {   
    introPage.toggleClass('disp-none')
    chatRoom.toggleClass('disp-none')
}

//function 
function setUpPeers() {
    if(localStream === undefined) {
        setTimeout(setUpPeers, 100)
    } else {
        peerConnections = new RTCPeerConnection(iceServers)
        localStream.getTracks().forEach((track) => {
            peerConnections.addTrack(track, localStream)
        })
        peerConnections.onicecandidate = sendIceCandidate   
        peerConnections.ontrack = setRemoteStream        
        peerConnections.createOffer()
            .then((offer) => {
                peerConnections.setLocalDescription(new RTCSessionDescription(offer))
                socket.emit('message', {
                    userId,
                    roomId,
                    type: 'offer',
                    sdp: offer,
                })
            })
        console.log('sent offer')    
    }    
}

function onOffer(message) {
    console.log('recieved offer')
    peerConnections = new RTCPeerConnection(iceServers)
    localStream.getTracks().forEach((track) => {
        peerConnections.addTrack(track, localStream)
    })    
    peerConnections.ontrack = setRemoteStream    
    peerConnections.setRemoteDescription(new RTCSessionDescription(message.sdp))
    peerConnections.onicecandidate = sendIceCandidate
    peerConnections.createAnswer().then((answer) => {
        peerConnections.setLocalDescription(answer)        
        socket.emit('message', {
            userId,
            roomId,
            type: 'answer',
            sdp: answer
        })
    })
    console.log('sent asnswer')
    //console.log(peerConnections)
}

function onAnswer(message) {
    console.log('recieved answer')        
    peerConnections.setRemoteDescription(new RTCSessionDescription(message.sdp))         
    //console.log(peerConnections)
}

function sendIceCandidate(event) {
    console.log(event)
    if (event.candidate) {
        console.log('this')
        socket.emit('message', {
            roomId,
            type: 'onicecandidate',
            label: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate,
        })
    }
}

function setRemoteStream(message) {
    remotevids[users] = message.streams[0].id
    console.log('creating remote vid')
    remoteVidEl = document.createElement('video')
    remoteVidEl.srcObject = message.streams[0]
    videoContainer.appendChild(remoteVidEl)
    remoteVidEl.setAttribute('id', 'vid-'+message.streams[0].id)
    remoteVidEl.setAttribute('autoplay', 'autoplay') 
}

// function handleNegotiationNeeded() {
//     console.log('negotiation needed')
// }