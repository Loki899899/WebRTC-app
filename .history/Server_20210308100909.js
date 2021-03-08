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
    //console.log('client connected');
    socket.on('join', (roomId) => {        

        // These events are emitted only to the socket that creates or joins a room
        if (!roomIds[roomId]) { //if no room with the given id is present new room is created
            console.log(`Creating room ${roomId} and emitting room_created socket event`);
            socket.join(roomId);
            socket.emit('room_created', roomId);
            roomIds[roomId] = [];
            roomIds[roomId] = 1;
            console.log(roomIds);            
        } else if (roomIds[roomId] > 0 && roomIds[roomId] < 2) {  //when room with given id is present and the limit to be implemented later
            console.log(`Joining room ${roomId} and emitting room_joined socket event`);
            socket.join(roomId);
            socket.emit('room_joined', roomId);
            roomIds[roomId] += 1
            console.log(roomIds);
        } else {  //if the room is full
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
    socket.on('leave', roomId => {
        if(roomIds[roomId]) {
            socket.broadcast.to(roomId).emit('leave');
            console.log('left');
            console.log(`address was ${socket.handshake.address}`);
            roomIds[roomId] -= 1;
            if(roomIds[roomId] == 0) {
                delete roomIds[roomId];
            }
        }
        console.log(roomIds);
    });
    socket.on('disconnect', () => {
        //console.log('client disconnected');
    });
})

server.listen(port, () => {
    console.log('listening on port: ' + port);
});
