const checking=["audioinput","videoinput"];
let onlyHas=[];
let haveAllDevices=true;
const socket = io();

if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log("This browser does not support the API yet");
}

navigator.mediaDevices.enumerateDevices()
.then((devices)=> {  
  devices.forEach((device)=>{
    onlyHas.push(device.kind);
    //console.log(device.kind);
    if(!(device.kind==checking[0] || device.kind==checking[1])){
    haveAllDevices=false;
    }
   });
   //do something about ...
  if(haveAllDevices) {console.log('Input Devices Present');}
  else {console.log('No Input Devices')}
  
})
.catch(function(err) {
  console.log(err.name + ": " + err.message);
});
// var canEnumerate = false;

// console.warn(navigator.mediaDevices.enumerateDevices);
// if (typeof MediaStreamTrack !== 'undefined' && 'getSources' in MediaStreamTrack) {
//     canEnumerate = true;
//     console.log('this ran');
// } else if (navigator.mediaDevices && !!navigator.mediaDevices.enumerateDevices) {
//     canEnumerate = true;
//     console.log('that ran');
// }