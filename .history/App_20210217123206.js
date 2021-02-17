// var express = require('express');
// var app = express();
// var server = require('http').createServer(app);
// var io = require('socket.io')(server);
// const port = 3000;

// app.use(express.static(__dirname+'/public'));

// io.on('connection', (req, res) => {
//     console.log('User connected '+ res);
//     io.on('disconnect', () => {
//         console.log('user disconnected');
//     });
// })

// server.listen(port, () => {
//     console.log('listening on port: '+port);
// });

var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
   res.sendfile('/index.html');
   console.log('sent');   
});

//Whenever someone connects this gets executed\
io.on('connection', socket => {
   console.log('A user connected');

   //Whenever someone disconnects this piece of code executed
   socket.on('disconnect', () => {
      console.log('A user disconnected');
   });
});

http.listen(3000, function() {
   console.log('listening on *:3000');
});