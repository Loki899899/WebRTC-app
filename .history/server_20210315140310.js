require('dotenv').config()

const fs = require('fs')
const express = require('express')
const app = express()

const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
};

const https = require('http').createServer(app);

const PORT = process.env.PORT || 3000;

var activeSockets = [];

https.listen(PORT, function() {
    console.log(`Listening on port ${PORT}`);
});


app.use(express.static(__dirname + '/public'))


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

// Socket connection
const io = require('socket.io')(https)

io.on('connection', (socket) => {
    socket.on('message', (msg) => {
        socket.broadcast.emit('message', msg)
      })
      socket.on('sendfile', function(data) {
          socket.broadcast.emit('sendfile', {filename: data.filename, blob: data.data});
      });
  })

const RoomService = require('./RoomService')(io);
io.sockets.on('connection', RoomService.listen);
io.sockets.on('error', e => console.log(e));
app.get('/*', function(req, res) {
    res.sendFile(`${__dirname}/public/videochat.html`);
});
