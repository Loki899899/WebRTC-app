var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
const port = 3000;

app.use(express.static(__dirname+'/public'));

io.on('connection', socket => {
    console.log('User connected '+ socket.handshake.address+ ' on '+socket.handshake.time);    
    //console.log(req);
    socket.on('vidCall', () => {
        console.log('start vidcall');
    })
    socket.on('voiceCall', () => {
        console.log('start voice call');
    });
    socket.on('disconnect', () => {
        console.log('user disconnected '+socket.handshake.address+ ' on '+socket.handshake.time);
    });
})

server.listen(port, () => {
    console.log('listening on port: '+port);
});