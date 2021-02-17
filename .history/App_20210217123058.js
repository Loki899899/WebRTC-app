var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
const port = 3000;

app.use(express.static(__dirname+'/public'));

io.on('connection', (req, res) => {
    console.log('User connected '+ res);
    io.on('disconnection', () => {
        console.log('user disconnected');
    });
})

server.listen(port, () => {
    console.log('listening on port: '+port);
});