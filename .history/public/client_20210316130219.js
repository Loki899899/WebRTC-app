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
        // {
        //     urls: "turn:numb.viagenie.ca:3478",
        //     username: "lokeshsingh899@gmail.com",
        //     credential: "Lokesh@numb899"
        // },
    ],
    iceTransportPolicy: "all"
}

let userId, roomId, localStream, users,
    count = 0,
    targets = [],
    candidates = {},
    peerConnections = {},
    isInitiator = false,
    isAttendee = false,
    remoteVidEl = [],
    remotevids = {},
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
})

socket.on('username-taken', () => {
    alert("username already taken")
})


socket.on('message', message => {
    switch (message.type) {
        case 'offer':
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
            //console.log('ice ')
            //console.log(message.target.includes(userId))
            if(message.target.includes(userId)) {
                if(peerConnections[message.userId]) {
                    console.log('got ice')
                    //console.log(message.candidate)
                    //console.log(message.label)
                    let candidate = new RTCIceCandidate({
                        sdpMLineIndex: message.label,
                        candidate: message.candidate,
                    })
                    if(isInitiator) {
                        peerConnections[message.userId].addIceCandidate(candidate)
                    } else {
                        if(!candidates[message.userId]) {
                            candidates[message.userId] = []
                        }
                        candidates[message.userId].push(candidate)
                    }
                    // peerConnections[message.userId].addIceCandidate(candidate)
                    //console.log('ICE state: ',peerConnections[message.userId].iceConnectionState)
                    // count += 1
                    // if(count === 4 && peerConnections[message.userId].iceConnectionState === 'new') {
                    //     console.log('restarting')
                    //     sendOffer(peerConnections[message.userId])
                    // }
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
    if(attendees.length>1) {
        updateView()
    }
})

socket.on('hangup', (user, attendees) => {
    remoteVidEl[user].remove()
    if(attendees === 1) {
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
    console.log('got answer')
    peerConnections[message.userId].setRemoteDescription(message.sdp)
    // .then(() => {
    //     setCandidates(message.userId)
    // })
}

// function setCandidates(user) {
//     if(count != 4) {
//         setTimeout(setCandidates, 200)
//     } else {
//         candidates[user].forEach((candidate) => {
//             peerConnection.addIceCandidate(candidate)
//         })
//     }
// }

function sendIceCandidate(event) {
    console.log('sending to ' + target)
    //console.log(event)
    if (event.candidate) {
        //console.log(event.candidate.candidate)
        //console.log(event.candidate.sdpMLineIndex)
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

function sendOffer(peerConnection) {
    isInitiator = true
    peerConnection.createOffer()
        .then((offer) => {
            console.log('offer created')
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
}

function onOffer(message) {
    console.log('offer recvd')
    peerConnections[message.userId] = new RTCPeerConnection(iceServers)
    getLocalStream(message, true)
}

function getLocalStream(message, createAnswer = false) {
    if(navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
            localStream = stream
            localVideo.srcObject = stream
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
    target = users.slice(0, users.length - 1)
    const peerConnection = peerConnections[message.userId]
    addLocalTracks(peerConnection)
    peerConnection.onicecandidate = sendIceCandidate
    // peerConnection.oniceconnectionstatechange = function(){
    //     console.log('ICE state: ',peerConnections[message.userId].iceConnectionState)
    // }
    peerConnection.ontrack = (event) => {
        setRemoteStream(event, message.userId)
    }
    peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp))
        .then(() => {
            candidates[message.userId].forEach((candidate) => {
                peerConnection.addIceCandidate(candidate)
            })
            peerConnection.createAnswer()
            .then((answer) => {
                peerConnection.setLocalDescription(answer)
                socket.emit('message', {
                    userId: userId,
                    target: message.userId,
                    roomId: roomId,
                    type: 'answer',
                    sdp: answer
                })
                console.log('sent ans')
            })
        })
}

function checkIceState() {
    console.log(peerConnections[users[users.length - 1]].iceGatheringState)
    if(peerConnections[users[users.length - 1]].iceGatheringState == 'complete') {
        console.log('completed gathering')
    }
}

function setPeers() {    
    if (users[users.length - 1] != userId) {
        target = users.slice(users.length - 1, users.length)
        const peerConnection = new RTCPeerConnection(iceServers)
        peerConnections[users[users.length - 1]] = peerConnection
        addLocalTracks(peerConnection)
        peerConnection.onicecandidate = sendIceCandidate
        // peerConnection.oniceconnectionstatechange = function(){
        //     console.log('ICE state: ',peerConnection.iceConnectionState)
        // }
        peerConnection.onicegatheringstatechange = () => {
            //console.log(peerConnections[users[users.length - 1]].iceGatheringState)
            if(peerConnections[users[users.length - 1]].iceGatheringState == 'complete') {
                console.log('completed gathering')
            }
        }
        peerConnection.ontrack = (event) => {
            setRemoteStream(event, users[users.length - 1])
        }
        sendOffer(peerConnection)
    }
}
