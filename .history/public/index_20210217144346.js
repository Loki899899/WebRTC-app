const checking=["audioinput","videoinput"];
let onlyHas=[];
let hasMic = false;
let hasWebcam = false
let haveAllDevices=true;
const socket = io();

if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log("This browser does not support the API yet");
}

navigator.mediaDevices.enumerateDevices()
    .then((devices) => {
        devices.forEach((device) => {
            onlyHas.push(device.kind);
            //console.log(device.kind);
            if (!(device.kind == checking[0] || device.kind == checking[1])) {
                haveAllDevices = false;
            }
        });
    })
    .catch(function (err) {
        console.log(err.name + ": " + err.message);
    });
