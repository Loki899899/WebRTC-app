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
    isAttendee = false
    remoteVidEl = []
remotevids = {}
hasDevices = false,
    constraints = {
        audio: false,
        video: {
            'width': window.screen.availHeight/2,
            'height': window.screen.availHeight/2
        }//true
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
    //setUpPeers()
})

socket.on('username-taken', () => {
    alert("username already taken")
})

socket.on('message', message => {
    switch (message.type) {
        case 'offer':
            onOffer(message)
            break;
        case 'answer':
            //console.log('target')
            //console.log(message.target)
            //if(userId === message.target)
            onAnswer(message)
            break;
        case 'onicecandidate':
            //console.log(message)
            if(peerConnections) {
                var candidate = new RTCIceCandidate({
                    sdpMLineIndex: message.label,
                    candidate: message.candidate,
                })
                peerConnections.addIceCandidate(candidate)
            }
            else {
                console.log('no peer')
            }
            break;
        default:
            console.log('what!')
            break;
    }
})

socket.on('attendee-update', (attendees) => {
    users = attendees
    switch (attendees.length) {
        case 2:
            updateViewForTwo()
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
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                localStream = stream
                localVideo.srcObject = stream
                peerConnections = new RTCPeerConnection(iceServers)
                localStream.getTracks().forEach((track) => {
                    peerConnections.addTrack(track, localStream)
                })
                peerConnections.onicecandidate = sendIceCandidate
                peerConnections.ontrack = setRemoteStream
                //console.log(localStream)                       
            }).catch(() => {
                console.log('couldnt get media Devices')
            })
            .then(() => {
                console.log(users.length)
                if(users.length===2) {
                    console.log('now  send')
                    console.log(`${users[users.length-1]} and ${userId}`)
                    if(users[users.length-1] === userId) {
                        console.log('i sent it')
                        sendOffer()
                    }                    
                } else if(users.length>2) {
                    console.log('its big')
                    if(users[users.length-1] != userId) {
                        sendOffer()
                    }
                }
            });
    } else {
        alert('Browser doesnt support WebRTC')
    }
}

// function to validate inputs and let server know someone has joined
function joinRoom() {
    if (room.val() === '' || userName.val() == '') {
        alert('Both fields are REQUIRED')
    } else {
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

function onAnswer(message) {
    console.log('recieved answer')
    //console.log(message.target)
    //console.log(userId)    
    peerConnections.setRemoteDescription(new RTCSessionDescription(message.sdp))
    //console.log(peerConnections)
}

function sendIceCandidate(event) {
    //console.log(event)
    if (event.candidate) {
        //console.log('this')
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
    remoteVidEl[users] = document.createElement('video')
    remoteVidEl[users].srcObject = message.streams[0]
    videoContainer.appendChild(remoteVidEl[users])
    remoteVidEl[users].setAttribute('id', 'vid-' + message.streams[0].id)
    remoteVidEl[users].setAttribute('autoplay', 'autoplay')
}

function updateViewForTwo() {
    localVideo.setAttribute('class', 'twoVideos')
}

function sendOffer() {
    peerConnections.createOffer()
        .then((offer) => {
            peerConnections.setLocalDescription(new RTCSessionDescription(offer))
            socket.emit('message', {
                userId: userId,
                roomId: roomId,
                type: 'offer',
                sdp: offer,
            })
        })
        .catch(console.log('erroe'))
    console.log('offer sent')
}

function onOffer(message) {
    console.log('offer recvd')
    peerConnections = new RTCPeerConnection(iceServers)
    localStream.getTracks().forEach((track) => {
        peerConnections.addTrack(track, localStream)
    })
    peerConnections.onicecandidate = sendIceCandidate
    peerConnections.ontrack = setRemoteStream
    peerConnections.setRemoteDescription(new RTCSessionDescription(message.sdp))
    peerConnections.createAnswer()
        .then((answer) => {
            console.log('sending answer')
            peerConnections.setLocalDescription(answer)
            socket.emit('message', {
                userId: userId,
                target: message.userId,
                roomId: roomId,
                type: 'answer',
                sdp: answer
            })
        })
}