var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname+'/public/'));

io.on('connection', (req, res) => {
    console.log('User connected');
})

app.listen(3000, () => {
    console.log("listening on port: 3000");
});