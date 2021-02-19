const express = require('express'),
    fs = require('fs'),
    app = express(),    
    io = require('socket.io')(server),
    port = 3000,
    options = {
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem')
    },
    server = require('https').createServer(options,app),

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