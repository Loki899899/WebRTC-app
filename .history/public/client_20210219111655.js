import $ from 'jquery';
const roomSelectionContainer = document.getElementById('room-selection-container')
const roomInput = document.getElementById('room-input')
const connectButton = document.getElementById('connect-button')

const videoChatContainer = document.getElementById('video-chat-container')
const localVideoComponent = document.getElementById('local-video')
const remoteVideoComponent = document.getElementById('remote-video')

const socket = io()
const mediaConstraints = {
  audio: true,
  video: { width: 1280, height: 720 },
}
let localStream
let remoteStream
let isRoomCreator
let rtcPeerConnection // Connection between the local device and the remote peer.
let roomId

// Free public STUN servers provided by Google.
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
}

// BUTTON LISTENER 
$(document).ready(() => {
    connectButton.addEventListener('click', () => {
        joinRoom(roomInput.value)
      })
})

// SOCKET EVENT CALLBACKS 
socket.on('room_created', async () => {
  console.log('Socket event callback: room_created')

  await setLocalStream(mediaConstraints)
  isRoomCreator = true
})

socket.on('room_joined', async () => {
  console.log('Socket event callback: room_joined')

  await setLocalStream(mediaConstraints)
  socket.emit('start_call', roomId)
})

socket.on('full_room', () => {
  console.log('Socket event callback: full_room')

  alert('The room is full, please try another one')
})

// FUNCTIONS
function joinRoom(room) {
  if (room === '') {
    alert('Please type a room ID')
  } else {
    roomId = room
    socket.emit('join', room)
    showVideoConference()
  }
}

function showVideoConference() {
  roomSelectionContainer.style = 'display: none'
  videoChatContainer.style = 'display: block'
}

async function setLocalStream(mediaConstraints) {
  let stream
  try {
    stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
  } catch (error) {
    console.error('Could not get user media', error)
  }

  localStream = stream
  localVideoComponent.srcObject = stream
}


// const socket = io();
// var p2pConn;

// $('#vidCall').on('click', () => {
//     socket.emit('vidCall');
//     getUserPermission();
// });

// $('#voiceCall').on('click', () => {
//     socket.emit('voiceCall');
// });

// socket.on('offer', (id, desc) => {
//     var config = {
//         'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]
//     };
//     p2pConn = RTCPeerConnection(config);
//     console.log("RTCPeerConnection object created");
//     p2pConn.setRemoteDescription(desc)
//     .then(() => p2pConn.createAnswer())
//     .then(sdp => p2pConn.setRemoteDescription(sdp))
//     .then(() => {
//         socket.emit('answer', id, p2pConn.localDesciption);
//     })
//     p2pConn.ontrack = event => {
//         video.srcObject = event.streams[0];
//     };
//     p2pConn.onicecandidate = event => {
//         if(event.candidate) {
//             socket.emit('candidate', id, event);
//         }
//     };
// });