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
var users = {};
var currentPresenter
app.use(express.static(__dirname + '/public'));
let socketToSend;

io.on('connection', (socket) => {
    //console.log('client connected');
    socket.on('join', (roomId, userId) => {        

        // These events are emitted only to the socket that creates or joins a room
        if (!roomIds[roomId]) { //if no room with the given id is present new room is created
            console.log(`Creating room ${roomId} and emitting room_created socket event`);
            socket.join(roomId);
            socket.emit('room_created', roomId);
            roomIds[roomId] = [];
            roomIds[roomId].push(userId);
            console.log(roomIds);     
            users[userId] = socket.id
            io.to(roomId).emit('attendee-update', roomIds[roomId])       
        } else if (roomIds[roomId].includes(userId)) {
            socket.emit('username-taken')
        }else if (roomIds[roomId].length > 0 && roomIds[roomId].length < 4) {  //when room with given id is present and the limit to be implemented later
            console.log(`Joining room ${roomId} and emitting room_joined socket event`);
            socketToSend = socket.id
            socket.join(roomId);
            socket.emit('room_joined', roomId);
            roomIds[roomId].push(userId);
            console.log(roomIds);
            users[userId] = socket.id
            io.to(roomId).emit('attendee-update', roomIds[roomId])
            socket.emit('presenter-change', currentPresenter)
        } else {  //if the room is full
            console.log(`Can't join room ${roomId}, emitting full_room socket event`);
            socket.emit('full_room', roomId);
        }
    })

    // These events are emitted to all the sockets connected to the same room except the sender.
    socket.on('start_call', (roomId) => {
        console.log(`Broadcasting start_call event to peers in room ${roomId} by ${socket.id}`);
        //socket.broadcast.to(roomId).emit('start_call');
        io.in(roomId).emit('start_call')
    })
    socket.on('webrtc_offer', (event) => {
        console.log(`Broadcasting webrtc_offer event to peers in room ${event.roomId} by ${socket.id}`);
        socket.broadcast.to(event.roomId).emit('webrtc_offer', event.sdp, currentPresenter);
    })
    socket.on('webrtc_answer', (event) => {
        console.log(`Broadcasting webrtc_answer event to peers in room ${event.roomId} by ${socket.id}`);
        socket.broadcast.to(event.roomId).emit('webrtc_answer', event.sdp);
    })
    socket.on('webrtc_ice_candidate', (event) => {
        console.log(`Broadcasting webrtc_ice_candidate event to peers in room ${event.roomId} by ${socket.id}`);
        socket.broadcast.to(event.roomId).emit('webrtc_ice_candidate', event);
    })
    socket.on('leave', (roomId,userId) => {
        if(roomIds[roomId]) {
            socket.broadcast.to(roomId).emit('leave');
            console.log(userId + "left")
            console.log('left');
            console.log(`address was ${socket.handshake.address}`);
            roomIds[roomId] =  roomIds[roomId].filter(item => item!=userId)
            if(roomIds[roomId].length == 0) {
                delete roomIds[roomId];
            }
        }
        console.log(roomIds);
    });
    socket.on('presenter-change', (event) => {
        console.log('changing presenter to ' + event.presenter + ' in room ' + event.roomId)        
        if(currentPresenter != event.presenter) {
            io.to(event.roomId).emit('presenter-change', event.presenter)
        }
        currentPresenter = event.presenter        
    })
    socket.on('disconnect', () => {
        //console.log(socket)
        //console.log('client disconnected');
    });
})

server.listen(port, () => {
    console.log('listening on port: ' + port);
});
