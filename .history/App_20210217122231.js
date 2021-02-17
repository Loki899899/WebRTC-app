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

// var express = require('express');
// var app = require('express')();
// var http = require('http').Server(app);
// var io = require('socket.io')(http);

// app.use(express.static(__dirname + '/public'));

// app.get('/', function(req, res) {
//    res.sendfile('/index.html');
//    console.log('sent');   
// });

// //Whenever someone connects this gets executed\
// io.on('connection', socket => {
//    console.log('A user connected');

//    //Whenever someone disconnects this piece of code executed
//    socket.on('disconnect', () => {
//       console.log('A user disconnected');
//    });
// });

// http.listen(3000, function() {
//    console.log('listening on *:3000');
// });