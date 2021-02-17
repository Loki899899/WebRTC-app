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
navigator.mediaDevices.getUserMedia({ audio: true, video: true},function (stream) {
    if(stream.getVideoTracks().length > 0 && stream.getAudioTracks().length > 0){
        console.warn("hai")                 
    }else{
       console.error("nahi hai")
    }
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