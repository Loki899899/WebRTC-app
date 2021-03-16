const socket = io();

const createroom = document.querySelector('#createbtn1');
const joinroom = document.querySelector('#joinbtn');
const roomservice = 'videochat.html';

createroom.addEventListener('click',(roomservice)=>{
  socket.emit('createroom', roomservice);
})


socket.on('createroom', (data)=>{
    window.location.href=`${data}`;
})

joinroom.addEventListener('click', ()=>{
  window.location.href=`${roomurl.value}`
})
