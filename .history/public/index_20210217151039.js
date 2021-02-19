const checking = ["audioinput", "videoinput"];
let haveMic = false;
let haveWebcam = false
const socket = io();

if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log("This browser does not support the API yet");
}

navigator.mediaDevices.enumerateDevices()
    .then((devices) => {
        devices.forEach((device) => {
            //console.log(device.kind);
            if (device.kind == checking[0]) {
                haveMic = true;
                console.log('mic present');
            }
            else {
                console.log('No audio input devices');
            }
            if (device.kind == checking[1]) {
                haveWebcam = true;
                console.log('webcam present');
            }
            else {
                console.log('No video input devices');
            }            
        });
    })
    .catch(function (err) {
        console.log(err.name + ": " + err.message);
    });
