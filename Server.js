const express = require('express')
    fs = require('fs')
    app = express()
    port = process.env.PORT || 3000
    options = {
        key:fs.readFileSync('key.pem'),
        cert:fs.readFileSync('cert.pem'),
    }
    server = require('https').createServer(options, app)
    io = require('socket.io')(server)

let roomIds = {}  

app.use(express.static(__dirname + '/public'))

io.on('connection', (socket) => {
    //console.log('connctd')    
    socket.on('join', (roomId, userId) => {        
        if (!Object.keys(roomIds).includes(roomId)) { //if no room with the given id is present new room is created
            console.log(`room ${roomId} created by ${userId}`)
            socket.join(roomId)                               
            roomIds[roomId] = {}
            roomIds[roomId].socketIds = []
            roomIds[roomId].peers = [] 
            roomIds[roomId].screenSharing = false
            roomIds[roomId].socketIds.push(socket.id)  
            roomIds[roomId].peers.push(userId)
            console.log(roomIds)
            socket.emit('room_created')           
        } else if (roomIds[roomId].peers.includes(userId)) {
            socket.emit('username-taken')
        }else if (roomIds[roomId].peers.length > 0 && roomIds[roomId].peers.length < 6) {  //when room with given id is present and the limit to be implemented later
            console.log(`room ${roomId} joined by ${userId}`)
            socket.join(roomId)
            roomIds[roomId].socketIds.push(socket.id)
            roomIds[roomId].peers.push(userId)
            // console.log(roomIds)
            // console.log(roomIds[roomId].peers)
            socket.emit('room_joined', roomIds[roomId].screenSharing)  
            io.in(roomId).emit('attendee-update', roomIds[roomId].peers)                      
            //socket.emit('presenter-change', currentPresenter)
        } else {  //if the room is full
            console.log(`Can't join room ${roomId}, emitting full_room socket event`)
            socket.emit('full_room', roomId)
        }
    })

    socket.on('message', (message) => {
        socket.broadcast.to(message.roomId).emit('message', message, socket.id)
        console.log('sending ' + message.type + ' id ' + message.userId)
    })
    
    socket.on('screen-sharing-live', (roomId) => {
        roomIds[roomId].screenSharing = true
    })

    socket.on('Make host', (user, roomId) => {
        console.log('changing host')
        socket.broadcast.to(roomId).emit('change-host', user)
    })

    socket.on('kick-user', (user, roomId) => {
        console.log('kicking user')
        socket.broadcast.to(roomId).emit('kick-user', user)
    })

    socket.on('disconnect', () => {
        Object.keys(roomIds).forEach(key => {
            if(roomIds[key].socketIds.includes(socket.id)){
                if(roomIds[key].socketIds.length === 1) {
                    delete roomIds[key]
                } else {
                    io.to(key).emit('hangup', roomIds[key].peers[roomIds[key].socketIds.indexOf(socket.id)], roomIds[key].peers.length - 1)
                    if(socket.id === roomIds[key].socketIds[0]) {
                        socket.broadcast.to(key).emit('change-host', roomIds[key].peers[1])
                    }
                    //console.log(roomIds)
                    roomIds[key].peers = roomIds[key].peers.filter((peer) => {
                        return peer!=roomIds[key].peers[roomIds[key].socketIds.indexOf(socket.id)]
                    })
                    roomIds[key].socketIds = roomIds[key].socketIds.filter((socketId) => {
                        return socketId!=socket.id
                    })                                    
                }
            }
            console.log(roomIds)
        })
        console.log('disscn')
    })
})

server.listen(port, () => {
    console.log(`listening on port ${port}`)
})
