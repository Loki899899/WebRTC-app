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
        screenShareButton.text('stop Sharing')
    } else {
        screenShareButton.text('share')
    }
}

function replaceVideoTrack(track) {
    Object.keys(peerConnections).forEach((peer) => {
        let sender = peerConnections[peer].getSenders()[0]
        sender.replaceTrack(track)
        updateScreenShareButton()
    })
}

function getUserScreen(forSharing=true) {
    return new Promise((res, rej) => {
        if(navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia()
            .then((stream) => {
                if (forSharing) {
                    screenCapture = stream
                    screenCapture.getVideoTracks()[0].onended = stopScreenShare
                    localVideo.srcObject = stream
                    isSharingScreen = true
                    replaceVideoTrack(screenCapture.getVideoTracks()[0], true)
                } else {
                    screenCaptureForRecording = stream
                }
                res()
            }) .catch((err) => {
                console.log('Cannot capture screen ' + err)
                rej()
            })
        }
    })
}

function stopScreenShare() {
    screenCapture.getVideoTracks()[0].stop()
    localVideo.srcObject = localStream
    isSharingScreen = false
    replaceVideoTrack(localStream.getVideoTracks()[0])
}