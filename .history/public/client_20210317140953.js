const userName = $('#user-name')
room = $('#room-input')
introPage = $('#room-selection-container')
chatRoom = $('#chat-room-container')
connectButton = $('#connect-button')
menu = $('#menu')
menuButton = $('#menu-button')
usersButton = $('#users-button')
textMessage = $('#input-message')
sendButton = $('#send-button')
textChatContainer = $('#text-chat-container')
messagesContainer = $('#messages-container')
usersList = $('#users-list')
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
    menuOpen = false
    count = 0,
    targets = [],
    candidates = {},
    peerConnections = {},
    isInitiator = false,
    isAttendee = false,
    remoteVidEl = {},
    remotevids = {},
    hasDevices = false,
    constraints = {
        audio: false,
        video: {
            'width': 360,//window.screen.availHeight/2,
            'height': 360//window.screen.availHeight/2
        }//true
    }

// EVENT LISTERNERS====================================
connectButton.on('click', () => {
    joinRoom()
})

menuButton.on('click', () => {
    menu.toggleClass('disp-none')
    if(menuOpen) {
        menuButton.html('\u22EE')
        menuOpen = false
    } else {
        menuButton.html('X')
        menuOpen = true
    }
})

sendButton.on('click', () => {
    console.log(textMessage.val())
    textMessage.val('')
    messagesContainer
        .append($('<div>')
            .addClass('message-box-holder')
            .append($('<div>')
                .addClass('outgoing-msg').
                text('this')))
})

usersButton.on('click', () => {
    textChatContainer.toggleClass('disp-none')
    usersList.toggleClass('disp-none')
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
            if(message.target.includes(userId)) {
                if(peerConnections[message.userId]) {
                    console.log('got ice')
                    let candidate = new RTCIceCandidate({
                        sdpMLineIndex: message.label,
                        candidate: message.candidate,
                    })
                    if(isInitiator) {
                        peerConnections[message.userId].addIceCandidate(candidate)
                        .catch((err) => {
                            console.log('cannot add ice ' + err)
                        })
                    } else {
                        if(!candidates[message.userId]) {
                            candidates[message.userId] = []
                        }
                        candidates[message.userId].push(candidate)
                    }
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

socket.on('full_room', () => {
    alert('Rool full')
})

socket.on('attendee-update', (attendees) => {
    users = attendees
    console.log(users)
    if(users[users.length-1] != userId) {
        updateUsers(users[users.length - 1])
    } else {
        updateUserList()
    }
    setPeers()
})

socket.on('hangup', (user, attendees) => {
    remoteVidEl[user].remove()
    peerConnections[user].close()
    delete peerConnections[user]
    if(attendees === 1) {
        localVideo.classList.remove('small-local-video')
    } else {
        updateView()
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
    updateUsers(userId)
    usersList.append($('<hr>'))
    introPage.toggleClass('disp-none')
    chatRoom.toggleClass('disp-none')
}

function updateUsers(user) {
    usersList.append(
        $('<div>')
            .attr('id', 'user-' + user)
            .addClass('user')
            .text(user)
    )
}

function updateUserList() {
    users.slice(0, users.length - 1).forEach((user) => {
        updateUsers(user)
    })
}

function onAnswer(message) {
    console.log('got answer')
    peerConnections[message.userId].setRemoteDescription(message.sdp)
}


function sendIceCandidate(event) {
    console.log('sending to ' + target)
    if (event.candidate) {
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
    remoteVidEl[user].setAttribute('width', window.screen.width/2.5)
    remoteVidEl[user].setAttribute('height', window.screen.width/2.5)
    remoteVidEl[user].setAttribute('autoplay', 'autoplay')
    updateView()
}

function setWidthHeight(config) {
    Object.keys(remoteVidEl).forEach((key) => {
        remoteVidEl[key].setAttribute('width', config)
        remoteVidEl[key].setAttribute('height', config)
    })
}

function updateView() {
    localVideo.setAttribute('class', 'small-local-video')
    console.log(Object.keys(peerConnections).length)
    switch (Object.keys(peerConnections).length) {
        case 1:
        case 2:
            setWidthHeight(window.screen.width/2.5)
            break;
        case 3:
            setWidthHeight(window.screen.width/3.2)
            break;
        case 4:
        case 5:
            setWidthHeight(window.screen.width/4.3)
        default:
            break;
    }
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
            localVideo.setAttribute('width', window.screen.width/2.5)
            localVideo.setAttribute('height', window.screen.width/2.5)
            localVideo.srcObject = stream
        })
        .catch((err) => {
            alert('Media devices not found\nOr\nPermission Denied')
            console.log('cannot get stream ' + err)
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
    peerConnection.ontrack = (event) => {
        setRemoteStream(event, message.userId)
    }
    peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp))
        .then(() => {
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
            addIce(message.userId)
        })
}

function addIce(user) {
    candidates[user].forEach((candidate) => {
        peerConnections[user].addIceCandidate(candidate)
            .catch((err) => {
                console.log('cannot add ice ' + err)
            })
    })
}

function setPeers() {    
    if (users[users.length - 1] != userId) {
        target = users.slice(users.length - 1, users.length)
        const peerConnection = new RTCPeerConnection(iceServers)
        peerConnections[users[users.length - 1]] = peerConnection
        addLocalTracks(peerConnection)
        peerConnection.onicecandidate = sendIceCandidate
        peerConnection.onicegatheringstatechange = () => {
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
