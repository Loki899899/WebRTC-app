var http = require('http');
var io = require('socket.io')(http);
var express = require('express');
var app = express();

app.use(express.static(__dirname+'/public/'));

io.on('connection', (req, res) => {
    console.log('User connected');
})

app.listen(3000, () => {
    console.log("listening on port: 3000");
});