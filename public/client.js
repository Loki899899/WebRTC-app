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
    ]
}


let userId, roomId, localStream, users, 
    targets = [],
    peers = [],
    peerConnections = {},
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
    showChatRoom()
    getLocalStream()
})

socket.on('room_joined', () => {
    console.log('room joined')    
    showChatRoom()
    //getLocalStream()
    //setUpPeers()
})

socket.on('username-taken', () => {
    alert("username already taken")
})

socket.on('message', message => {
    switch (message.type) {
        case 'offer':
            //console.log(message)
            if(message.target === userId) {
                onOffer(message)
            }
            break;
        case 'answer':
            //console.log('target')
            //console.log(message.target)
            //if(userId === message.target)
            if(message.target === userId) {
                onAnswer(message)
            }
            break;
        case 'onicecandidate':
            console.log('ice ')
            console.log(message)
            console.log(message.target.includes(userId))
            if(message.target.includes(userId)) {
                console.log('ice for me')
                if(peerConnections[message.userId]) {
                    console.log('adding ice')
                    var candidate = new RTCIceCandidate({
                        sdpMLineIndex: message.label,
                        candidate: message.candidate,
                    })
                    peerConnections[message.userId].addIceCandidate(candidate)
                }
                else {
                    console.log('no peer')
                }
            }
            break;
        default:
            console.log('what!')
            break;
    }
})

socket.on('attendee-update', (attendees) => {
    users = attendees
    setPeers()
    //checkDevices()    
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
    //console.log('i recieved my id - '+userId + ' was for ' + message.target + 'and by ' + message.userId)
    //console.log(message.sdp)
    peerConnections[message.userId].setRemoteDescription(message.sdp)
}

function sendIceCandidate(event) {
    //console.log('this happened' + event)
    //console.log(message)
    console.log('sending to ' + target)
    if (event.candidate) {
        //console.log('this')
        socket.emit('message', {
            userId,
            roomId,
            target: target,
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
    peerConnection.createOffer()
        .then((offer) => {
            console.log('sending to '+ users[users.length-1])
            peerConnection.setLocalDescription(new RTCSessionDescription(offer))
            socket.emit('message', {
                userId: userId,
                target: users[users.length - 1],
                roomId: roomId,
                type: 'offer',
                sdp: offer,
            })
        })
        .catch(console.log('erroe'))
    console.log('offer sent')
}

function onOffer(message) {
    //console.log(message)
    console.log('offer recvd')
    getLocalStream(message, true)    
}

function getLocalStream(message, createAnswer = false) {
    if(navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
            localStream = stream
            localVideo.srcObject = stream
            console.log('got local stream')
        })
        .then(() => {
            if(createAnswer) {
                sendAnswer(message)
            }
        })
    }
}

function addLocalTracks(peerConnection) {
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
    })
}

function sendAnswer(message) {
    console.log('setting target here ')
    console.log(message)
    target = users.slice(0,users.length - 1)
    console.log('target ' + target)
    peerConnections[message.userId] = new RTCPeerConnection(iceServers)
    peerConnection = peerConnections[message.userId]
    //console.log(peerConnections)
    addLocalTracks(peerConnection)
    peerConnections[message.userId].onicecandidate = sendIceCandidate
    peerConnections[message.userId].ontrack = setRemoteStream
    peerConnections[message.userId].setRemoteDescription(new RTCSessionDescription(message.sdp))
    peerConnections[message.userId].createAnswer()
        .then((answer) => {
            console.log('sending answer')
            console.log(answer)
            peerConnections[message.userId].setLocalDescription(answer)
            socket.emit('message', {
                userId: userId,
                target: message.userId,
                roomId: roomId,
                type: 'answer',
                sdp: answer
            })
        })
}

function setPeers() {    
    if (users[users.length - 1] != userId) {
        console.log('settings up peers')
        target = users.slice(0,users.length - 1)
        console.log('target' + targets)
        console.log(users)
        peerConnections[users[users.length - 1]] = new RTCPeerConnection(iceServers)
        peerConnection = peerConnections[users[users.length - 1]]
        addLocalTracks(peerConnection)
        peerConnection.onicecandidate = sendIceCandidate
        peerConnection.ontrack = setRemoteStream
        sendOffer()
    }
}