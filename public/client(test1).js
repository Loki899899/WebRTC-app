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

function joinRoom() {
    if (room.val() === '' || userName.val() == '') {
        alert('Both fields are REQUIRED')
    } else {
        userId = userName.val()
        roomId = room.val()
        socket.emit('join', roomId, userId)
    }
}