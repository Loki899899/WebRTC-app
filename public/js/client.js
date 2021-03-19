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
fileUpload = $('#file')
usersList = $('#users-list')
localVideo = document.getElementById('local-video')
videoContainer = $('#video-container')//document.getElementById('video-container')
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
    isCreator = false
    menuOpen = false
    count = 0,
    targets = [],
    candidates = {},
    peerConnections = {},
    isInitiator = false,
    isAttendee = false,
    remoteVidEl = {},
    hasDevices = false,
    constraints = {
        audio: true,
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
    if (textMessage.val()) {
        handleMessage(textMessage.val(), 'outgoing-msg')
        scrollToMessage(messagesContainer)
        socket.emit('message', {
            userId: userId,
            type: 'text-message',
            msg: textMessage.val(),
            roomId: roomId
        })
        textMessage.val('')
    }
})

usersButton.on('click', () => {
    textChatContainer.toggleClass('disp-none')
    usersList.toggleClass('disp-none')
})

fileUpload.on('change', () => {
    if(fileUpload.val()) {
        sendFileToRoom(fileUpload.prop('files')[0])
    }
})

// SOCKET EVENT CALLBACKS==============================
socket.on('room_created', () => {
    isCreator = true
    hasRightsToShareScreen = true
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
        case 'text-message':
            handleMessage(message.msg, 'incoming-msg')
            break;
        case 'file':
            handleFileMessage(message)
            break;
        default:
            console.log('This cannot be')
            break;
    }
})

socket.on('Allow Screen Sharing-user', (user) => {
    if(user === userId) {
        hasRightsToShareScreen = true
    }
})

socket.on('full_room', () => {
    alert('Rool full')
})

socket.on('attendee-update', (attendees) => {
    users = attendees
    if(users[users.length-1] != userId) {
        updateUsers(users[users.length - 1], 'remote')
    } else {
        updateUserList()
    }
    setPeers()
})

socket.on('Make host', (user) => {
    if(user === userId) {
        isCreator = true
    }
})

socket.on('Kick-user', (user) => {
    console.log('to kick '+ user)
    if(user === userId) {
        location.reload()
        alert('Kicked from room')
    }
})

socket.on('hangup', (user, attendees) => {
    remoteVidEl[user].remove()
    peerConnections[user].close()
    delete peerConnections[user]
    $('#remoteuser-'+user).remove()
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

function returnList(user, act) {
    return ($('<li>')
        .attr({ id: act+'-' + user, act: act, user: user })
        .addClass('usersettings')
        .text(act)
        .on('click', () => {
            if (confirm($('#Kick-'+user).attr('act') + ': ' + $('#Kick-'+user).attr('user'))) {
                socket.emit(act+'-user', $('#Kick-'+user).attr('user'), roomId)
                if(act === 'Allow Screen Sharing') {
                    hasRightsToShareScreen = false
                }
            }
        }));
}

function updateUsers(user, remote = '') {
    let remoteUserDiv = $('<div>')
        .attr('id', remote + 'user-' + user)
        .addClass(remote + 'user')
        .text(user)
        .on('mouseover mouseout', () => {
            if (isCreator) {
                $('#' + remote + user + 'settings').toggleClass('disp-none')
            }
        })
    usersList.append(remoteUserDiv)
    if (remote != '') {
        remoteUserDiv.append(
            $('<ul>')
                .attr('id', remote + user + 'settings')
                .addClass('remote-user-settings')
                .addClass('disp-none')
                .append(returnList(user, 'Kick'))
                .append($('<hr>'))
                .append(
                    $('<li>')
                        .attr({ id: 'host-' + user, act: 'Make-host', user: user })
                        .addClass('usersettings')
                        .text('Make Host')
                        .on('click', () => {
                            if(confirm($('#host-' + user).attr('act') + ': ' + $('#host-' + user).attr('user'))) {
                                isCreator = false
                                socket.emit('Make host', user, roomId)
                                $('#' + remote + user + 'settings').toggleClass('disp-none')
                            }
                        })
                )
                .append(returnList(user, 'Allow Screen Sharing'))
        )
    }
}

function updateUserList() {
    users.slice(0, users.length - 1).forEach((user) => {
        updateUsers(user, 'remote')
    })    
}

function handleMessage(message, type, isFile = false) {
    if (isFile) {
        messagesContainer
            .append($('<div>')
                .addClass('message-box-holder')
                .append(message
                    .addClass(type)))
    } else {
        messagesContainer
            .append($('<div>')
                .addClass('message-box-holder')
                .append($('<div>')
                    .addClass(type).
                    text(message)))
    }
}

function scrollToMessage(element) {
    element.animate({scrollTop: element.height()})
}

function sendFileToRoom(file) {
    let blob = new Blob([file])
    let fileMsg = $('<a>').attr({ href: URL.createObjectURL(blob), download: file.name, })
        .append($('<span>')
            .addClass('file')
            .text(file.name))
        .append('<span>')
    handleMessage(fileMsg, 'outgoing-msg', true)
    socket.emit('message', {
        userId: userId,
        roomId: roomId,
        type: 'file',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        blob: blob
    })
}

function handleFileMessage(message) {
    let blob = new Blob([message.blob])
    let fileMsg = $('<a>')
        .attr({ href: URL.createObjectURL(blob), download: message.fileName, })
        .append($('<span>')
            .attr({id: message.filename})
            .text(message.fileName + '\n' + message.fileSize))
    handleMessage(fileMsg, 'incoming-msg', true)
}

function onAnswer(message) {
    console.log('got answer')
    peerConnections[message.userId].setRemoteDescription(message.sdp)
    if(isSharingScreen&&hasRightsToShareScreen) {
        replaceVideoTrack(screenCapture.getVideoTracks()[0])
    }
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
    remoteVideoContainer = $('<div>').attr({ id: 'remote-vid-container-' + user }).addClass('remote-vid-container')
    //let remoteVideoContainer = 
    remoteVidEl[user] = document.createElement('video')
    remoteVidEl[user].srcObject = message.streams[0]
    //remoteVidEl["two"][0].setAttributeNS('','srcObject', message.streams[0])
    videoContainer.append(remoteVideoContainer[0])
    //remoteVideoContainer.append([remoteVidEl[user]])
    remoteVidEl[user].setAttribute('id', 'vid-' + user)
    remoteVidEl[user].setAttribute('width', window.screen.width / 2.5)
    remoteVidEl[user].setAttribute('height', window.screen.width / 2.5)
    remoteVidEl[user].setAttribute('autoplay', 'autoplay')
    remoteVideoContainer.append(remoteVidEl[user])
    remoteVideoContainer.append(videoButtonOptions(remoteVidEl[user], user))
    // remoteVidEl[user].srcObject.getVideoTracks()[0].enabled.addEventListener('onchange', () => {
    //     if(remoteVidEl[user].srcObject.getVideoTracks()[0].enabled == 'true')
    // })
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
            break;
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

function videoButtonOptions(video, user) {
    return ([$('<button>')
        .attr({ id: 'mute-button-' + user})
        .addClass('mute-button')
        .text('mute')
        .on('click', () => {
            if ($('#mute-button-' + user).text() === 'mute') {
                console.log('click')
                video.srcObject.getAudioTracks()[0].enabled = false
                $('#mute-button-' + user).text('unmute')
            } else {
                video.srcObject.getAudioTracks()[0].enabled = true
                $('#mute-button-' + user).text('mute')
            }
        }),
        $('<button>')
            .attr('id', 'video-disable-button-' + user)
            .addClass('video-disable-button')
            .text('disable')
            .on('click', () => {
                if ($('#video-disable-button-' + user).text() == 'disable') {
                    video.srcObject.getVideoTracks()[0].enabled = false
                    $('#video-disable-button-' + user).text('enable')
                } else {
                    video.srcObject.getVideoTracks()[0].enabled = true
                    $('#video-disable-button-' + user).text('disable')
                }
            })]);
}

function getLocalStream(message, createAnswer = false) {
    if(navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
            localStream = stream
            localVideo.setAttribute('width', window.screen.width/2.5)
            localVideo.setAttribute('height', window.screen.width/2.5)
            localVideo.srcObject = stream
            $('#local-video-container').append(videoButtonOptions(localVideo, userId))
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
    try {
        localStream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStream)
        })
    } catch (err) {
        console.log('cannot add tracks error: ' + err)
    }
}

function sendAnswer(message) {
    target = users.slice(0, users.length - 1)
    const peerConnection = peerConnections[message.userId]
    addLocalTracks(peerConnection)
    peerConnection.onicecandidate = sendIceCandidate
    peerConnection.ontrack = (event) => {
        if(event.track.kind == 'video') {
            setRemoteStream(event, message.userId)
        }
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
        }).catch((err) => {
            console.log('no peers to add ' + err)
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
        peerConnection.ontrack = (event) => {
            if(event.track.kind == 'video') {
                setRemoteStream(event, users[users.length - 1])
            }
        }
        sendOffer(peerConnection)
    }
}