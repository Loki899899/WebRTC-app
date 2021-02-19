let haveMic = false;
let haveWebcam = false;

// if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
//     console.log('This browser does not support the API yet');
// }

// navigator.mediaDevices.enumerateDevices()
//     .then((devices) => {
//         devices.forEach((device) => {
//             console.log("device: "+device.kind);
//             //console.log(device.kind);
//             // if (device.kind == 'audioinput') {
//             //     haveMic = true;
//             //     console.log(device.kind);
//             //     console.log('mic present');
//             // }
//             // else {
//             //     console.log(device.kind);
//             //     console.error('No audio input devices');
//             // }
//             // if (device.kind == 'videoinput') {
//             //     haveWebcam = true;
//             //     console.log(device.kind);
//             //     console.log('webcam present');
//             // }
//             // else {
//             //     console.log(device.kind);
//             //     console.error('No video input devices');
//             // }
//         });
//     })
//     .catch(function (err) {
//         console.log(err.name + ": " + err.message);
//     });
console.warn(!navigator.mediaDevices);
console.warn(!navigator.mediaDevices.enumerateDevices);
if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log("enumerateDevices() not supported.");
  }
  
  // List cameras and microphones.
  
navigator.mediaDevices.getUserMedia({audio:true, video: false})
.then(() => {
    hasDevice = true;
    navigator.mediaDevices.enumerateDevices()
    .then(function(devices) {
      devices.forEach(function(device) {
        console.log(device.kind + ": " + device.label +
                    " id = " + device.deviceId);
      });
    })
    .catch(function(err) {
      console.log(err.name + ": " + err.message);
    });
}, () => {
    prompt("devices not present or permission denied");
});
