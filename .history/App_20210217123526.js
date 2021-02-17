var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
const port = 3000;

app.use(express.static(__dirname+'/public'));

io.on('connection', socket => {
    console.log('User connected '+ socket.address+ ' on '+socket.time);    
    //console.log(req);
    io.on('disconnect', () => {
        console.log('user disconnected '+socket.address);
    });
})

server.listen(port, () => {
    console.log('listening on port: '+port);
});

