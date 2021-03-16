/** @type {SocketIO.Server} */
let _io;
const MAX_CLIENTS = 5;

const { v4: uuidV4} = require('uuid');

/** @param {SocketIO.Socket} socket */
function listen(socket) {
  const io = _io;
  const rooms = io.nsps['/'].adapter.rooms;

  socket.on('createroom', (data)=>{
    data = `${uuidV4()}`;
    socket.emit('createroom', data);
  })
  socket.on('join', function(roomdetails) {

    let numClients = 0;

    if (rooms[roomdetails.room]) {
      numClients = rooms[roomdetails.room].length;
    }
    if (numClients < MAX_CLIENTS) {
      socket.on('ready', function() {
        socket.broadcast.to(roomdetails.room).emit('ready', socket.id, roomdetails.name);
      });
      socket.on('offer', function (id, message) {
        socket.to(id).emit('offer', socket.id, message);
      });
      socket.on('answer', function (id, message) {
        socket.to(id).emit('answer', socket.id, message);
      });
      socket.on('candidate', function (id, message) {
        socket.to(id).emit('candidate', socket.id, message);
      });
      socket.on('disconnect', function() {
        socket.broadcast.to(roomdetails.room).emit('bye', socket.id);
      });
      socket.join(roomdetails.room);
    } else {
      socket.emit('full', roomdetails.room);
    }
  });
}

/** @param {SocketIO.Server} io */
module.exports = function(io) {
  _io = io;
  return {listen};
};
