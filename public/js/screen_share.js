const screenShareButton = $('#screen-share')

let isSharingScreen = false,
    hasRightsToShareScreen = false,
    screenCapture

screenShareButton.on('click', () => {
    if (hasRightsToShareScreen) {
        if (isSharingScreen) {
            stopScreenShare()
        } else {
            getUserScreen()
        }
    } else {
        alert('Ask host for Screen Sharing Rights')
    }
})

function updateScreenShareButton() {
    if(isSharingScreen) {
        screenShareButton.text('stop')
    } else {
        screenShareButton.text('share')
    }
}

function replaceVideoTrack(track) {
    Object.keys(peerConnections).forEach((peer) => {
        console.log(peerConnections[peer].getSenders()[0])
        let sender = peerConnections[peer].getSenders()[0]
        sender.replaceTrack(track)
        updateScreenShareButton()
    })
}

function getUserScreen() {
    if(navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia()
        .then((stream) => {
            screenCapture = stream.getVideoTracks()[0]
            localVideo.srcObject = stream
            isSharingScreen = true
            replaceVideoTrack(stream.getVideoTracks()[0], true)
            socket.emit('screen-sharing-live', roomId)
        }) .catch((err) => {
            console.log('Cannot capture screen ' + err)
        })
    }
}

function stopScreenShare() {
    screenCapture.stop()
    localVideo.scrObject = localStream
    isSharingScreen = false
    replaceVideoTrack(localStream.getVideoTracks()[0])
}