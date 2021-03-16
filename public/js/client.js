
const socket = io()
let name;
let filemsg;
let textarea = document.querySelector('#textarea')
let messageArea = document.querySelector('.message__area')
let sendbtn = document.querySelector('#sendFile')
let vc = document.querySelector('#videochat')
let filechange = document.querySelector('#filname')
let msgbtn = document.querySelector('#send')
let check;
do {
    if(document.cookie){
      name = document.cookie;
     }
     else{
        name = prompt('Please enter your name: ')
        document.cookie = name;
     }
} while(!name)

msgbtn.addEventListener('click', ()=>{
  check=1;
  if(check==1)
  {
    sendMessage(textarea.value)
    
  }
 
})
// textarea.addEventListener('keyup', (check) => {
//     if(check == 1) {
//         sendMessage(e.target.value)
//         console.log("chal raha hai")
//     }
// })

function sendMessage(message, filedata) {
    let msg = {
        user: name,
        message: message
    }

      // Append
        appendMessage(msg, 'outgoing')
        textarea.value = ''
        scrollToBottom()

    if(filedata==null){
      // Send to server
      socket.emit('message', msg);
    }
    else{
      socket.emit('sendfile',filedata)
    }
}

function appendMessage(msg, type) {
    let mainDiv = document.createElement('div')
    let className = type
    mainDiv.classList.add(className, 'message')

    let markup = `
        <h4>${msg.user}</h4>
        <p>${msg.message}</p>
    `

    mainDiv.innerHTML = markup
    messageArea.appendChild(mainDiv)
}

function scrollToBottom() {
    messageArea.scrollTop = messageArea.scrollHeight
}
//Recieve message
socket.on('message', (msg) => {
    appendMessage(msg, 'incoming');
    scrollToBottom()
})


//receive file
socket.on('sendfile', ({filename, blob}) => {
    myblob = new Blob([blob]);
    let link = document.createElement('a');
    //link.download = `${filname}`
    console.log(myblob);
    link.href = URL.createObjectURL(myblob);
    var newfile = `<a href="${link.href}" download="${filename}"><img src="https://img.icons8.com/metro/52/000000/document.png"/>${filename}<br>   [${myblob.size} bits]</a>`;
    let msg = {
      user: name,
      message: newfile
    }
    appendMessage(msg, 'incoming')
    scrollToBottom();
    delete myblob;
    myfile=null;
  })


//file transfer
document.querySelector('#filname').onchange=function(){

   var myfile = document.querySelector('#filname').files[0];

  sendbtn.addEventListener('click', sendingfile(myfile));
}

function sendingfile(myfile){
  let link = document.createElement('a')
  link.download = `${myfile.name}`
  var myblob =  new Blob([myfile]);
  link.href = URL.createObjectURL(myblob);
  filemsg = `<a href="${link.href}" download="${myfile.name}"><img src="https://img.icons8.com/metro/52/000000/document.png"/>${myfile.name}<br>   [${myfile.size} bits]</a>`;
  let filedata = {
    filename : `${myfile.name}`,
    data: myblob
  }
  sendMessage(filemsg, filedata);
  delete myblob;
}

//meeting Room
vc.addEventListener('click',()=>{
  window.location.href='/meeting_room.html';
})

