let haveMic = false;
let haveWebcam = false;

if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log('This browser does not support the API yet');
}

navigator.mediaDevices.enumerateDevices()
    .then((devices) => {
        devices.forEach((device) => {
            console.log("devide: "+device.kind);
            //console.log(device.kind);
            // if (device.kind == 'audioinput') {
            //     haveMic = true;
            //     console.log(device.kind);
            //     console.log('mic present');
            // }
            // else {
            //     console.log(device.kind);
            //     console.error('No audio input devices');
            // }
            // if (device.kind == 'videoinput') {
            //     haveWebcam = true;
            //     console.log(device.kind);
            //     console.log('webcam present');
            // }
            // else {
            //     console.log(device.kind);
            //     console.error('No video input devices');
            // }
        });
    })
    .catch(function (err) {
        console.log(err.name + ": " + err.message);
    });