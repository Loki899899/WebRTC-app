let haveMic = false;
let haveWebcam = false
const socket = io();

if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log('This browser does not support the API yet');
}

navigator.mediaDevices.enumerateDevices()
    .then((devices) => {
        devices.forEach((device) => {
            //console.log(device.kind);
            if (device.kind == 'audioinput') {
                haveMic = true;
                console.log('mic present');
            }
            else {
                console.error('No audio input devices');
            }
            if (device.kind == 'videoinput') {
                haveWebcam = true;
                console.log('webcam present');
            }
            else {
                console.error('No video input devices');
            }            
        });
    })
    .catch(function (err) {
        console.log(err.name + ": " + err.message);
    });

if (haveWebcam) {
    console.log($('#btn').textContent);
    $('#btn').on('click', () => {
        socket.emit('record')
    })
}