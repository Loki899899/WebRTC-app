const express = require('express'),
    fs = require('fs'),
    app = express(),
    port = 3000,
    options = {
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem')
    },
    server = require('https').createServer(options, app),
    io = require('socket.io')(server);
var roomIds = {};
app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
    console.log('client connected');
    socket.on('join', (roomId) => {        

        // These events are emitted only to the sender socket.
        if (!roomIds[roomId]) {
            console.log(`Creating room ${roomId} and emitting room_created socket event`);
            socket.join(roomId);
            socket.emit('room_created', roomId);
            roomIds[roomId] = [];
            roomIds[roomId].push(socket.handshake.address);
            console.log(roomIds);            
        } else if (roomIds[roomId].length > 0) {
            console.log(`Joining room ${roomId} and emitting room_joined socket event`);
            socket.join(roomId);
            socket.emit('room_joined', roomId);
            roomIds[roomId].push(socket.handshake.address)
            console.log(roomIds);
        } else {
            console.log(`Can't join room ${roomId}, emitting full_room socket event`);
            socket.emit('full_room', roomId);
        }
    })

    // These events are emitted to all the sockets connected to the same room except the sender.
    socket.on('start_call', (roomId) => {
        console.log(`Broadcasting start_call event to peers in room ${roomId}`);
        socket.broadcast.to(roomId).emit('start_call');
    })
    socket.on('webrtc_offer', (event) => {
        console.log(`Broadcasting webrtc_offer event to peers in room ${event.roomId}`);
        socket.broadcast.to(event.roomId).emit('webrtc_offer', event.sdp);
    })
    socket.on('webrtc_answer', (event) => {
        console.log(`Broadcasting webrtc_answer event to peers in room ${event.roomId}`);
        socket.broadcast.to(event.roomId).emit('webrtc_answer', event.sdp);
    })
    socket.on('webrtc_ice_candidate', (event) => {
        console.log(`Broadcasting webrtc_ice_candidate event to peers in room ${event.roomId}`);
        socket.broadcast.to(event.roomId).emit('webrtc_ice_candidate', event);
    })

    socket.on('disconnect', () => {
        console.log('client disconnected');
    });
})

server.listen(port, () => {
    console.log('listening on port: ' + port);
});


// io.on('connection', socket => {
//     console.log('User connected '+ socket.handshake.address+ ' on '+socket.handshake.time);    
//     //console.log(req);
//     socket.on('vidCall', () => {
//         console.log('start vidcall');
//         socket.on('offer', (id, msg) => {
//             socket.to(id).emit('offer', socket.id, msg);
//         });
//         socket.on('answer', (id, msg) => {
//             socket.to(id).emit('answer', socket.id, msg);
//         });
//         socket.on('candidate', (id, msg) => {
//             socket.to(id).emit('candidate', socket.id, msg);
//         });
//     })
//     socket.on('voiceCall', () => {
//         console.log('start voice call');
//     });
//     socket.on('disconnect', () => {
//         console.log('user disconnected '+socket.handshake.address+ ' on '+socket.handshake.time);
//     });
// })