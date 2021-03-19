const recordButton = $('#record-button')

let mediaStream

recordButton.on('click', () => {
    if (recordButton.text() === 'Record') {
        startRecording()
    } else {
        stopRecording()
    }
})

function stopRecording() {
    screenCaptureForRecording.getVideoTracks()[0].stop()
    mediaStream.stop()
    recordButton.text('Record')
}

function startRecording() {
    getUserScreen(false)
        .then(() => {
            mediaStream = new MediaRecorder(screenCaptureForRecording)
            let chunks = []
            mediaStream.start(1000)
            mediaStream.ondataavailable = (e) => {
                chunks.push(e.data)
            }
            mediaStream.onstop = (e) => {
                let blob = new Blob(chunks, { 'type': 'video/webm' })
                let recordedVideo = $('<a>')
                    .attr({
                        href: URL.createObjectURL(blob), id: 'recording', download: userId + new Date().toString().slice(0, 24)
                    })
                $(document.body).append(recordedVideo)
                $('#recording')[0].click()
                recordedVideo.remove()
            }
            recordButton.text('Stop Recording')
        })
        .catch(() => {
            console.log('error')
        })
}