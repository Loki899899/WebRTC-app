const socket = io();


// function hasUserMedia() {
//     console.warn(navigator.getUserMedia)
//     return navigator.getUserMedia;
// }

// function hasUserMedia() { 
//     //check if the browser supports the WebRTC 
//     //console.warn(navigator.mediaDevices.getUserMedia({audio:true}));
//     return !!(navigator.mediaDevices.getUserMedia({audio:true})) ;
//  } 
 
// //console.warn(!!navigator.mediaDevices.getUserMedia());
// if(hasUserMedia()) {
//     console.log('got the devices');
// }
// else {
//     console.log('not supported');
// }

if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log("This browser does not support the API yet");
  }