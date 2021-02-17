// var express = require('express');
// var app = express();
// var http = require('http').Server(app);
// var io = require('socket.io')(http);

// app.use(express.static(__dirname+'/public/'));

// io.on('connection', (req, res) => {
//     console.log('User connected');
// })

// app.listen(3000, () => {
//     console.log("listening on port: 3000");
// });

var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ipdict = {};
var ip = null;

app.use(express.static(__dirname + '/public'));

//Whenever someone connects this gets executed\
io.on('connection', (socket) => {
   //console.log('A user connected');      
   socket.on("setname", name => {
      // if(name in ipdict.values() {
      //    socket.emit("userAlreadyPresent");
      // }
      ipdict[socket.handshake.address] = name;
      //console.log(ipdict[socket.handshake.address]);
   });
   //console.log(ipdict[socket.handshake.address]);
   socket.on("chat", msg => {      
      io.emit("chat", ipdict[socket.handshake.address]+": "+msg+"\n", ipdict[socket.handshake.address]);
      console.log(ipdict);
   });

   //Whenever someone disconnects this piece of code executed
   socket.on('disconnect', () => {
      //console.log('A user disconnected');
   });
});

http.listen(3000, function() {
   console.log('listening on port:3000');
});