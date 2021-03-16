import h from './check.js'

(function() {


  /** @type {SocketIOClient.Socket} */
  const socket = io.connect(window.location.origin);
  const localVideo = document.querySelector('.localVideo');
  const remoteVideos = document.querySelector('.remoteVideos');
  const sidelist = document.querySelector('.sidelist');
  var screen = '';
  var pc = [];
  const peerConnections = {};
  var recordedStream = [];
  var mediaRecorder = '';

  let ctr = 1;
  let namediv;
  let markup;

  let room = !location.protocol.substring(0) ? 'home' : location.protocol.substring(0);

  let getUserMediaAttempts = 5;
  let gettingUserMedia = false;

  /** @type {RTCConfiguration} */
  const config = {
    'iceServers': [{
      'urls': ['stun:stun.l.google.com:19302']
    }]
  };

  /** @type {MediaStreamConstraints} */
  const constraints = {
    audio: true,
    video: { facingMode: "user" }
  };
  var roomdetails = {
    room:room,
    name:name,
    
  }
console.log(roomdetails.roomcreator);
  socket.on('full', function(room) {
    alert('Room ' + room + ' is full');
  });

  socket.on('bye', function(id) {
    handleRemoteHangup(id);
  });

  if (room && !!room) {
    socket.emit('join', roomdetails);

      markup = `
        <h4><b>${roomdetails.name}</b>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp<button class="btn btn-lg rounded-0 btn-no-effect" id='local-toggle-mute' title="Mute">
          <i class="fas fa-microphone"></i>
         </button>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp<button class=" btn btn-lg rounded-0 btn-no-effect" id='record-screen'>
           <i class="fas fa-dot-circle"></i>
         </button></h4>
       `
        namediv=document.createElement('div')
        namediv.innerHTML=markup;
        sidelist.appendChild(namediv);
  }

  window.onunload = window.onbeforeunload = function() {
    socket.close();
  };

  socket.on('ready', function (id,name) {

    if (!(localVideo instanceof HTMLVideoElement) || !localVideo.srcObject) {
      console.log(name);
      return;
    }
    const peerConnection = new RTCPeerConnection(config);
    peerConnections[id] = peerConnection;
    if (localVideo instanceof HTMLVideoElement) {
      peerConnection.addStream(localVideo.srcObject);
    }
    peerConnection.createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(function () {
      socket.emit('offer', id, peerConnection.localDescription, name);
    });
    console.log(name);
    peerConnection.onaddstream = event => handleRemoteStreamAdded(event.stream, id, name);
    peerConnection.onicecandidate = function(event) {
      if (event.candidate) {
        socket.emit('candidate', id, event.candidate);
      }
    };
  });

  socket.on('offer', function(id, description, name) {

    const peerConnection = new RTCPeerConnection(config);
    peerConnections[id] = peerConnection;
    if (localVideo instanceof HTMLVideoElement) {
      peerConnection.addStream(localVideo.srcObject);
    }
    peerConnection.setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(function () {
      socket.emit('answer', id, peerConnection.localDescription);
    });
    peerConnection.onaddstream = event => handleRemoteStreamAdded(event.stream, id, name);
    peerConnection.onicecandidate = function(event) {
      if (event.candidate) {
        socket.emit('candidate', id, event.candidate);
      }
    };
  });

  socket.on('candidate', function(id, candidate) {
    peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));
  });

  socket.on('answer', function(id, description) {
    peerConnections[id].setRemoteDescription(description);
  });

  function getUserMediaSuccess(stream) {

    gettingUserMedia = false;
    if (localVideo instanceof HTMLVideoElement) {
      !localVideo.srcObject && (localVideo.srcObject = stream);

      //MUTE AND UNMUTE-----------------------------------START----------------------------------------------------------------------------//

      document.getElementById( 'toggle-mute' ).addEventListener( 'click', ( e ) => {
        e.preventDefault();

        let elem = document.getElementById( 'toggle-mute' );
        // var myStream=stream;
        if ( stream.getAudioTracks()[0].enabled ) {
            e.target.classList.remove( 'fa-microphone' );
            e.target.classList.add( 'fa-microphone-slash' );
            elem.setAttribute( 'title', 'Unmute' );

            stream.getAudioTracks()[0].enabled = false;
        }

        else {
            e.target.classList.remove( 'fa-microphone-slash' );
            e.target.classList.add( 'fa-microphone' );
            elem.setAttribute( 'title', 'Mute' );

            stream.getAudioTracks()[0].enabled = true;
        }


      } );

      //MUTE AND UNMUTE-----------------------------------------------END-----------------------------------------------------------//
      document.getElementById( 'local-toggle-mute' ).addEventListener( 'click', ( e ) => {
        e.preventDefault();

        let elem = document.getElementById( 'local-toggle-mute' );
        // var myStream=stream;
        if ( stream.getAudioTracks()[0].enabled ) {
            e.target.classList.remove( 'fa-microphone' );
            e.target.classList.add( 'fa-microphone-slash' );
            elem.setAttribute( 'title', 'Unmute' );

            stream.getAudioTracks()[0].enabled = false;
        }
        else {
            e.target.classList.remove( 'fa-microphone-slash' );
            e.target.classList.add( 'fa-microphone' );
            elem.setAttribute( 'title', 'Mute' );

            stream.getAudioTracks()[0].enabled = true;
        }
      } );

      //VIDEO ON AND OFF-------------------------------------------------------START-------------------------------------------------------//

      document.getElementById( 'videoONN' ).addEventListener( 'click', ( e ) => {
        e.preventDefault();

        let elem = document.getElementById( 'videoONN' );
        // var myStream=stream;
        if ( stream.getVideoTracks()[0].enabled ) {
            e.target.classList.remove( 'fa-video' );
            e.target.classList.add( 'fa-video-slash' );
            elem.setAttribute( 'title', 'videoOff' );

            stream.getVideoTracks()[0].enabled = false;
            ctr = 0;
            console.log(ctr)

        }

        else {
            e.target.classList.remove( 'fa-video-slash' );
            e.target.classList.add( 'fa-video' );
            elem.setAttribute( 'title', 'videoONN' );

            stream.getVideoTracks()[0].enabled = true;
            ctr = 1;
            console.log(ctr)
        }

        // if (ctr == 0){

        //     }


      } );

      // VIDEO ON AND OFF----------------------------------END------------------------------------------------------------------------//

      // SHARE SCREEN *************--------------------START----------------------------------------*************************************



function shareScreen() {
  h.shareScreen().then( ( stream ) => {
      h.toggleShareIcons( true );

      //disable the video toggle btns while sharing screen. This is to ensure clicking on the btn does not interfere with the screen sharing
      //It will be enabled was user stopped sharing screen
      h.toggleVideoBtnDisabled( true );

      //save my screen stream
      screen = stream;

      //share the new stream with all partners
      broadcastNewTracks( stream, 'video');
      // handleRemoteStreamAdded(stream,'remoteVideos') ;

      socket.emit()


      //When the stop sharing button shown by the browser is clicked
      screen.getVideoTracks()[0].addEventListener( 'ended', () => {
          stopSharingScreen();
        } );
       } ).catch( ( e ) => {
      console.error( e );
    } );
  }

  function stopSharingScreen() {
  //enable video toggle btn
  h.toggleVideoBtnDisabled( false );

  return new Promise( ( res, rej ) => {
      screen.getTracks().length ? screen.getTracks().forEach( track => track.stop() ) : '';

      res();
  } ).then( () => {
      h.toggleShareIcons( false );
      broadcastNewTracks( stream, 'video' );
  } ).catch( ( e ) => {
      console.error( e );
  } );
  }



  function broadcastNewTracks( stream, type, mirrorMode = true ) {
  h.setLocalStream( stream, mirrorMode );

  let track = type == 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
  pc=peerConnections;
  for ( let p in pc ) {
      let pName = pc[p];
      console.log(pName);
      h.replaceTrack( track, pName );
      // if ( pc[pName]!=null ) {
      //   console.log("if chALA")
      //     h.replaceTrack( track, pc[pName] );
      //     // handleRemoteStreamAdded( stream , 'video');

      // }
  }
  // handleRemoteStreamAdded( stream , 'video');
  }






  //When user clicks the 'Share screen' button
  document.getElementById( 'share-screen' ).addEventListener( 'click', ( e ) => {
  e.preventDefault();

  if ( screen && screen.getVideoTracks().length && screen.getVideoTracks()[0].readyState != 'ended' ) {
      stopSharingScreen();
  }

  else {
      shareScreen();
  }

  } );

  //SHARE SCREEN FINISHED ************----------------------END--------------------------********************************************




  }
    socket.emit('ready');
  }

  function handleRemoteStreamAdded(stream, id, name) {
    console.log(name);
    const remoteVideo = document.createElement('video');
    remoteVideo.srcObject = stream;
    // stream.getAudioTracks()[0].enabled = false;
    remoteVideo.setAttribute("id", id.replace(/[^a-zA-Z]+/g, "").toLowerCase());
    remoteVideo.setAttribute("playsinline", "true");
    remoteVideo.setAttribute("autoplay", "true");
    remoteVideos.appendChild(remoteVideo);
    if (remoteVideos.querySelectorAll("video").length === 1) {
      remoteVideos.setAttribute("class", "one remoteVideos");
    } else {
      remoteVideos.setAttribute("class", "remoteVideos");
    }
//remote user in user list
    markup = `
      <h4><b>${name}</b>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp<button class="btn btn-lg rounded-0 btn-no-effect" id='remote-toggle-mute' title="Mute">
        <i class="fas fa-microphone"></i>
       </button>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp<button class=" btn btn-lg rounded-0 btn-no-effect" id='record-screen'>
         <i class="fas fa-dot-circle"></i>
       </button></h4>
     `
    namediv = document.createElement('div')
    namediv.innerHTML= markup;
    sidelist.appendChild(namediv);

//muting remote video
    document.getElementById( 'remote-toggle-mute' ).addEventListener( 'click', ( e ) => {
      e.preventDefault();

      let elem = document.getElementById( 'remote-toggle-mute' );
      // var myStream=stream;
      if ( stream.getAudioTracks()[0].enabled ) {
          e.target.classList.remove( 'fa-microphone' );
          e.target.classList.add( 'fa-microphone-slash' );
          elem.setAttribute( 'title', 'Unmute' );

          stream.getAudioTracks()[0].enabled = false;
      }
      else {
          e.target.classList.remove( 'fa-microphone-slash' );
          e.target.classList.add( 'fa-microphone' );
          elem.setAttribute( 'title', 'Mute' );

          stream.getAudioTracks()[0].enabled = true;
      }
    } );

  }

  function getUserMediaError(error) {
    console.error(error);
    gettingUserMedia = false;
    (--getUserMediaAttempts > 0) && setTimeout(getUserMediaDevices, 1000);
  }

  function getUserMediaDevices() {
    if (localVideo instanceof HTMLVideoElement) {
      if (localVideo.srcObject) {
        getUserMediaSuccess(localVideo.srcObject);
      } else if (!gettingUserMedia && !localVideo.srcObject) {
        gettingUserMedia = true;
        navigator.mediaDevices.getUserMedia(constraints)
        .then(getUserMediaSuccess)
        .catch(getUserMediaError);
      }
    }
  }

  function handleRemoteHangup(id) {
    peerConnections[id] && peerConnections[id].close();
    delete peerConnections[id];
    document.querySelector("#" + id.replace(/[^a-zA-Z]+/g, "").toLowerCase()).remove();
    if (remoteVideos.querySelectorAll("video").length === 1) {
      remoteVideos.setAttribute("class", "one remoteVideos");
    } else {
      remoteVideos.setAttribute("class", "remoteVideos");
    }
  }


  function startRecording( stream ) {
    mediaRecorder = new MediaRecorder( stream, {
        mimeType: 'video/webm;codecs=vp8'
    } );
    console.log("recoding started");
    mediaRecorder.start( 1000 );
    toggleRecordingIcons( true );

    mediaRecorder.ondataavailable = function ( e ) {
        recordedStream.push( e.data );
    };

    mediaRecorder.onstop = function () {
        toggleRecordingIcons( false );

        h.saveRecordedStream( recordedStream, username );

        setTimeout( () => {
            recordedStream = [];
        }, 3000 );
    };

    mediaRecorder.onerror = function ( e ) {
        console.error( e );
    };
}


//When user choose to record screen


function startRecording( stream ) {
  mediaRecorder = new MediaRecorder( stream, {
      mimeType: 'video/webm;codecs=vp8'
  } );
  console.log("recoding started");
  mediaRecorder.start( 1000 );
  //toggleRecordingIcons( true );

  mediaRecorder.ondataavailable = function ( e ) {
      recordedStream.push( e.data );
  };

  mediaRecorder.onstop = function () {
      //toggleRecordingIcons( false );
     var username="sadasd";
      h.saveRecordedStream( recordedStream, username );

      setTimeout( () => {
          recordedStream = [];
      }, 3000 );
  };

  mediaRecorder.onerror = function ( e ) {
      console.error( e );
  };
}





document.getElementById( 'record-screen' ).addEventListener( 'click', () => {

  if ( screen && screen.getVideoTracks().length ) {
    startRecording( screen );
}

else if ( mediaRecorder.state == 'recording' ) {
    mediaRecorder.stop();
}


  else {
      h.shareScreen().then( ( screenStream ) => {
          startRecording( screenStream );
      } ).catch( () => { } );
  }
} );

//record screen Finished********************---------------------------END---------------------***************************************//


  getUserMediaDevices();
})();



document.querySelector('#hangup').addEventListener('click',() => {
    window.location.href ="/";
   })
