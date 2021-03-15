const userName = $('#user-name')
room = $('#room-input')
introPage = $('#room-selection-container')
chatRoom = $('#chat-room-container')
connectButton = $('#connect-button')
localVideo = document.getElementById('local-video')
videoContainer = document.getElementById('video-container')
socket = io()
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
            'width': 480,//window.screen.availHeight/2,
            'height': 480//window.screen.availHeight/2
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
            if(message.target === userId) {
                onAnswer(message)
            }
            break;
        case 'onicecandidate':
            console.log('ice ')
            //console.log(message)
             //console.log(message.target.includes(userId))
            // if(message.target.includes(userId)) {
            //     console.log('ice for me')
                if(peerConnections[message.userId]) {
                    console.log('adding ice')
                    console.log(message)
                    console.log('ICE state: ',peerConnections[message.userId].iceConnectionState)
                    var candidate = new RTCIceCandidate({
                        sdpMLineIndex: message.label,
                        candidate: message.candidate,
                    })
                    peerConnections[message.userId].addIceCandidate(candidate)
                }
                else {
                    console.log('no peer')
                }
            //}
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
    if(attendees.length>1) {
        updateView()
    }
})

socket.on('hangup', (user, attendees) => {
    console.log(user + ' left')
    remoteVidEl[user].remove()
    console.log(attendees)
    if(attendees === 1) {
        //console.log(localVideo.classList.contains('small-local-video'))
        localVideo.classList.remove('small-local-video')
    }
    
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
    console.log(event.candidate.candidate)
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

function setRemoteStream(message, user) {
    remotevids[user] = message.streams[0].id
    console.log('creating remote vid')
    console.log(target[target.length - 1])
    remoteVidEl[user] = document.createElement('video')
    remoteVidEl[user].srcObject = message.streams[0]
    videoContainer.appendChild(remoteVidEl[user])
    remoteVidEl[user].setAttribute('id', 'vid-' + user)
    remoteVidEl[user].setAttribute('width', '480')
    remoteVidEl[user].setAttribute('height', '480')
    remoteVidEl[user].setAttribute('autoplay', 'autoplay')
}

function updateView() {
    localVideo.setAttribute('class', 'small-local-video')
}

function sendOffer() {
    peerConnections[users[users.length-1]].createOffer()
        .then((offer) => {
            console.log('sending to '+ users[users.length-1])
            peerConnections[users[users.length-1]].setLocalDescription(new RTCSessionDescription(offer))
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
    peerConnection.oniceconnectionstatechange = function(){
        console.log('ICE state: ',peerConnections[message.userId].iceConnectionState)
     }
    peerConnections[message.userId].ontrack = (event) => {
        setRemoteStream(event, message.userId)
    }
    peerConnections[message.userId].setRemoteDescription(new RTCSessionDescription(message.sdp))
    peerConnections[message.userId].createAnswer()
        .then((answer) => {
            console.log('sending answer')
            //console.log(answer)
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
        console.log(users.slice(users.length - 1, users.length))
        target = users.slice(users.length - 1, users.length)
        console.log('target' + target)
        //console.log(users)
        peerConnections[users[users.length - 1]] = new RTCPeerConnection(iceServers)
        peerConnection = peerConnections[users[users.length - 1]]
        addLocalTracks(peerConnection)
        peerConnection.onicecandidate = sendIceCandidate
        peerConnection.oniceconnectionstatechange = function(){
            console.log('ICE state: ',peerConnection.iceConnectionState);
         }
        peerConnection.ontrack = (event) => {
            setRemoteStream(event, users[users.length - 1])
        }
        sendOffer()
    }
}
